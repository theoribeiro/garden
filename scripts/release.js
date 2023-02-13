#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = __importDefault(require("execa"));
const semver_1 = __importDefault(require("semver"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const parseArgs = require("minimist");
const deline = require("deline");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const run_script_1 = require("./run-script");
const Bluebird = require("bluebird");
const replace = require("replace-in-file");
const RELEASE_TYPES = ["minor", "patch", "preminor", "prepatch", "prerelease"];
const gardenRoot = (0, path_1.resolve)(__dirname, "..");
/**
 * Performs the following steps to prepare for a release:
 * 1. Check out to a branch named release-${version}
 * 2. Bump the version in core/package.json and core/yarn.lock.
 * 5. Update the changelog.
 * 6. Add and commit CHANGELOG.md, core/package.json and core/yarn.lock
 * 7. Tag the commit.
 * 8. Push the tag. This triggers a CircleCI job that creates the release artifacts and publishes them to Github.
 * 9. If we're making a minor release, update links to examples and re-push the tag.
 * 10. If this is not a pre-release, pushes the release branch to Github.
 *
 * Usage: ./scripts/release.ts <minor | patch | preminor | prepatch | prerelease> [--force] [--dry-run]
 */
async function release() {
    // Parse arguments
    const argv = parseArgs(process.argv.slice(2));
    const releaseType = argv._[0];
    const force = !!argv.force;
    const dryRun = !!argv["dry-run"];
    // Check if branch is clean
    try {
        await (0, execa_1.default)("git", ["diff", "--exit-code"], { cwd: gardenRoot });
    }
    catch (_) {
        throw new Error("Current branch has unstaged changes, aborting.");
    }
    if (!RELEASE_TYPES.includes(releaseType)) {
        throw new Error(`Invalid release type ${releaseType}, available types are: ${RELEASE_TYPES.join(", ")}`);
    }
    const prevVersion = require("../package.json").version;
    const version = semver_1.default.inc(prevVersion, releaseType);
    // Update package.json versions
    /**
     * For prereleases, we omit the prerelease suffix for all package.json-s except the top-level one.
     *
     * This is to make references to internal packages (e.g. "@garden-io/core@*") work during the build process in CI.
     */
    const packageReleaseTypeMap = { preminor: "minor", prepatch: "patch" };
    const incrementedPackageVersion = semver_1.default.inc(prevVersion, packageReleaseTypeMap[releaseType] || releaseType);
    const parsed = semver_1.default.parse(incrementedPackageVersion);
    // We omit the prerelease suffix from `incrementedPackageVersion` (if there is one).
    const packageVersion = `${parsed === null || parsed === void 0 ? void 0 : parsed.major}.${parsed === null || parsed === void 0 ? void 0 : parsed.minor}.${parsed === null || parsed === void 0 ? void 0 : parsed.patch}`;
    console.log(`Bumping version from ${prevVersion} to ${version}...`);
    const rootPackageJsonPath = (0, path_1.resolve)(__dirname, "..", "package.json");
    await updatePackageJsonVersion(rootPackageJsonPath, version);
    console.log(`Setting package versions to ${packageVersion}...`);
    const packages = await (0, run_script_1.getPackages)();
    const packageJsonPaths = Object.values(packages).map((p) => (0, path_1.resolve)(p.location, "package.json"));
    await Bluebird.map(packageJsonPaths, async (p) => await updatePackageJsonVersion(p, packageVersion));
    const branchName = `release-${version}`;
    // Check if branch already exists locally
    let localBranch;
    try {
        localBranch = (await (0, execa_1.default)("git", ["rev-parse", "--verify", branchName], { cwd: gardenRoot })).stdout;
    }
    catch (_) {
        // no op
    }
    finally {
        if (localBranch) {
            await rollBack();
            throw new Error(`Branch ${branchName} already exists locally. Aborting.`);
        }
    }
    // Check if branch already exists remotely
    let remoteBranch;
    try {
        remoteBranch = (await (0, execa_1.default)("git", ["ls-remote", "--exit-code", "--heads", "origin", branchName], { cwd: gardenRoot })).stdout;
    }
    catch (_) {
        // no op
    }
    finally {
        if (remoteBranch) {
            await rollBack();
            throw new Error(`Branch ${branchName} already exists remotely. Aborting.`);
        }
    }
    // Check if user wants to continue
    const proceed = await prompt(version);
    if (!proceed) {
        await rollBack();
        return;
    }
    // Pull remote tags
    console.log("Pulling remote tags...");
    await (0, execa_1.default)("git", ["fetch", "origin", "--tags", "-f"], { cwd: gardenRoot });
    // Verify tag doesn't exist
    const tags = (await (0, execa_1.default)("git", ["tag"], { cwd: gardenRoot })).stdout.split("\n");
    if (tags.includes(version) && !force) {
        await rollBack();
        throw new Error(`Tag ${version} already exists. Use "--force" to override.`);
    }
    // Checkout to a release branch
    console.log(`Checking out to branch ${branchName}...`);
    await (0, execa_1.default)("git", ["checkout", "-b", branchName], { cwd: gardenRoot });
    // Remove pre-release tags so they don't get included in the changelog
    await stripPrereleaseTags(tags, version);
    // Update changelog
    console.log("Updating changelog...");
    await updateChangelog(version);
    // Add and commit changes
    console.log("Committing changes...");
    await (0, execa_1.default)("git", [
        "add",
        "CHANGELOG.md",
        rootPackageJsonPath,
        ...packageJsonPaths.map((p) => (0, path_1.relative)(gardenRoot, p)),
    ], { cwd: gardenRoot });
    await (0, execa_1.default)("git", [
        "commit",
        "-m", `chore(release): bump version to ${version}`,
    ], { cwd: gardenRoot });
    // Tag the commit and push the tag
    if (!dryRun) {
        console.log("Pushing tag...");
        await createTag(version, force);
    }
    // Reset local tag state (after stripping release tags)
    await (0, execa_1.default)("git", ["fetch", "origin", "--tags"], { cwd: gardenRoot });
    // For non pre-releases, we update links to examples in the docs so that they point to the relevant tag.
    // E.g.: "github.com/garden-io/tree/v0.8.0/example/..." becomes "github.com/garden-io/tree/v0.9.0/example/..."
    // Note that we do this after pushing the tag originally. This is because we check that links are valid in CI
    // and the check would fail if the tag hasn't been created in the first place.
    if (releaseType === "minor" || releaseType === "patch") {
        console.log("Updating links to examples and re-pushing tag...");
        await updateExampleLinks(version);
        // Add and commit changes to example links
        await (0, execa_1.default)("git", [
            "add",
            "README.md", "docs",
        ], { cwd: gardenRoot });
        await (0, execa_1.default)("git", ["commit", "--amend", "--no-edit"], { cwd: gardenRoot });
        // Tag the commit and force push the tag after updating the links (this triggers another CI build)
        if (!dryRun) {
            await createTag(version, true);
        }
    }
    if (!dryRun && !semver_1.default.prerelease(version)) {
        console.log("Pushing release branch...");
        const pushArgs = ["push", "origin", branchName, "--no-verify"];
        if (force) {
            pushArgs.push("-f");
        }
        await (0, execa_1.default)("git", pushArgs, { cwd: gardenRoot });
    }
    if (dryRun) {
        console.log(deline `
    Release ${chalk_1.default.bold.cyan(version)} is ready! To release, create and push a release tag with:\n

    ${chalk_1.default.bold(`git tag -a ${version} -m "chore(release): release ${version}"`)}

    ${chalk_1.default.bold(`git push push origin ${version} --no-verify`)}\n

    Then, if this is not a pre-release, push the branch with:\n

    ${chalk_1.default.bold(`git push origin ${branchName} --no-verify`)}\n

    and create a pull request on Github by visiting:
      https://github.com/garden-io/garden/pull/new/${branchName}\n

    Alternatively, you can undo the commit created by the dry-run and run the script
    again without the --dry-run flag. This will perform all the steps automatically.
    `);
    }
    else {
        console.log(deline `
    \nRelease ${chalk_1.default.bold.cyan(version)} has been ${chalk_1.default.bold("tagged")}, ${chalk_1.default.bold("committed")},
    and ${chalk_1.default.bold("pushed")} to Github! 🎉\n

    A CI job that creates the release artifacts is currently in process: https://circleci.com/gh/garden-io/garden\n

    If this is not a pre-release, create a pull request for ${branchName} on Github by visiting:
      https://github.com/garden-io/garden/pull/new/${branchName}\n

    Please refer to our contributing docs for the next steps:
    https://github.com/garden-io/garden/blob/main/CONTRIBUTING.md
  `);
    }
}
async function updatePackageJsonVersion(packageJsonPath, newVersion) {
    const packageJson = require(packageJsonPath);
    packageJson.version = newVersion;
    await (0, fs_extra_1.writeFile)(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
async function createTag(version, force) {
    // Tag the commit
    const createTagArgs = ["tag", "-a", version, "-m", `chore(release): release ${version}`];
    if (force) {
        createTagArgs.push("-f");
    }
    await (0, execa_1.default)("git", createTagArgs, { cwd: gardenRoot });
    // Push the tag
    const pushTagArgs = ["push", "origin", version, "--no-verify"];
    if (force) {
        pushTagArgs.push("-f");
    }
    await (0, execa_1.default)("git", pushTagArgs, { cwd: gardenRoot });
}
async function updateExampleLinks(version) {
    const options = {
        files: ["docs/**/*.md", "README.md"],
        from: /github\.com\/garden-io\/garden\/tree\/[^\/]*\/examples/g,
        to: `github.com/garden-io/garden/tree/${version}/examples`,
    };
    const results = await replace(options);
    console.log("Modified files:", results.filter(r => r.hasChanged).map(r => r.file).join("\n"));
}
async function rollBack() {
    // Undo any file changes. This is safe since we know the branch is clean.
    console.log("Undoing file changes");
    await (0, execa_1.default)("git", ["checkout", "."], { cwd: gardenRoot });
}
async function prompt(version) {
    const message = deline `
    Running this script will create a branch and a tag for ${chalk_1.default.bold.cyan(version)} and push them to Github.
    This triggers a CI process that creates the release artifacts.\n

    Are you sure you want to continue?
  `;
    const ans = await inquirer_1.default.prompt({
        name: "continue",
        message,
    });
    return ans.continue.startsWith("y");
}
/**
 * Update CHANGELOG.md. We need to get the latest entry and prepend it to the current CHANGELOG.md
 */
async function updateChangelog(version) {
    const changelogPath = "./CHANGELOG.md";
    // TODO: Use readStream and pipe
    const changelog = await (0, fs_extra_1.readFile)(changelogPath);
    const nextChangelogEntry = (await (0, execa_1.default)("git-chglog", ["--next-tag", version, version], { cwd: gardenRoot })).stdout;
    return new Promise((resolve, reject) => {
        const writeStream = (0, fs_extra_1.createWriteStream)(changelogPath);
        writeStream.write(nextChangelogEntry);
        writeStream.write(changelog);
        writeStream.close();
        writeStream.on("close", () => {
            resolve(null);
        });
        writeStream.on("error", error => {
            reject(error);
        });
    });
}
/**
 * We don't include pre-release tags in the changelog except for the current release cycle.
 * So if we're releasing, say, v0.9.1-3, we include the v0.9.1-0, v0.9.1-1, and v0.9.1-2 tags.
 *
 * Once we release v0.9.1, we remove the pre-release tags, so the changelog will only show the changes
 * between v0.9.0 and v0.9.1.
 */
async function stripPrereleaseTags(tags, version) {
    const prereleaseTags = tags.filter(t => !!semver_1.default.prerelease(t));
    for (const tag of prereleaseTags) {
        // If we're not releasing a pre-release, we remove the tag. Or,
        // if we are releasing a pre-release and the tag is not from the same cycle, we remove it.
        // E.g., if the current tag is v0.5.0-2 and we're releasing v0.9.0-2, we remove it.
        // If the current tag is v0.9.0-0 and we're releasing v0.9.0-2, we keep it.
        if (!semver_1.default.prerelease(version) || semver_1.default.diff(version, tag) !== "prerelease") {
            await (0, execa_1.default)("git", ["tag", "-d", tag]);
        }
    }
    // We also need to remove the "edge" tag
    await (0, execa_1.default)("git", ["tag", "-d", "edge"]);
}
(async () => {
    try {
        await release();
        process.exit(0);
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
})().catch(() => { });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsZWFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlbGVhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUEsa0RBQXlCO0FBQ3pCLG9EQUEyQjtBQUMzQix3REFBK0I7QUFDL0Isa0RBQXlCO0FBQ3pCLHNDQUFzQztBQUN0QyxpQ0FBaUM7QUFDakMsK0JBQXdDO0FBQ3hDLHVDQUFpRTtBQUNqRSw2Q0FBMEM7QUFDMUMscUNBQXFDO0FBQ3JDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBRzFDLE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBRTlFLE1BQU0sVUFBVSxHQUFHLElBQUEsY0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUUzQzs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxLQUFLLFVBQVUsT0FBTztJQUNwQixrQkFBa0I7SUFDbEIsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDN0MsTUFBTSxXQUFXLEdBQWdCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDMUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUE7SUFDMUIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVoQywyQkFBMkI7SUFDM0IsSUFBSTtRQUNGLE1BQU0sSUFBQSxlQUFLLEVBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7S0FDakU7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RB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