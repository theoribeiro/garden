"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTarballFilename = exports.getZipFilename = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = require("path");
const bluebird_1 = __importDefault(require("bluebird"));
const constants_1 = require("@garden-io/core/build/src/constants");
const fs_extra_1 = require("fs-extra");
const util_1 = require("@garden-io/core/build/src/util/util");
const string_1 = require("@garden-io/core/build/src/util/string");
const lodash_1 = require("lodash");
const minimist_1 = __importDefault(require("minimist"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
require("source-map-support").install();
const repoRoot = (0, path_1.resolve)(constants_1.GARDEN_CLI_ROOT, "..");
const tmpDir = (0, path_1.resolve)(repoRoot, "tmp", "pkg");
const tmpStaticDir = (0, path_1.resolve)(tmpDir, "static");
const pkgPath = (0, path_1.resolve)(repoRoot, "cli", "node_modules", ".bin", "pkg");
const distPath = (0, path_1.resolve)(repoRoot, "dist");
// Allow larger heap size than default
const nodeOptions = ["max-old-space-size=4096"];
const targets = {
    "macos-amd64": { pkgType: "node18-macos-x64", handler: pkgMacos, nodeBinaryPlatform: "darwin" },
    "linux-amd64": { pkgType: "node18-linux-x64", handler: pkgLinux, nodeBinaryPlatform: "linux" },
    "windows-amd64": { pkgType: "node18-win-x64", handler: pkgWindows, nodeBinaryPlatform: "win32" },
    "alpine-amd64": { pkgType: "node18-alpine-x64", handler: pkgAlpine, nodeBinaryPlatform: "linuxmusl" },
};
/**
 * This function defines the filename format for release packages.
 *
 * The format SHOULD NOT be changed since other tools we use depend on it, unless you absolutely know what you're doing.
 */
function composePackageFilename(version, targetName, extension) {
    return `garden-${version}-${targetName}.${extension}`;
}
function getZipFilename(version, targetName) {
    return composePackageFilename(version, targetName, "zip");
}
exports.getZipFilename = getZipFilename;
function getTarballFilename(version, targetName) {
    return composePackageFilename(version, targetName, "tar.gz");
}
exports.getTarballFilename = getTarballFilename;
async function buildBinaries(args) {
    const argv = (0, minimist_1.default)(args);
    const version = argv.version || (0, util_1.getPackageVersion)();
    const selected = argv._.length > 0 ? (0, lodash_1.pick)(targets, argv._) : targets;
    console.log(chalk_1.default.cyan("Building targets: ") + Object.keys(selected).join(", "));
    // (re)-create temp dir
    console.log(chalk_1.default.cyan("Creating temp directory at " + tmpDir));
    await (0, fs_extra_1.remove)(tmpDir);
    await (0, fs_extra_1.mkdirp)(tmpDir);
    // Copy static dir, stripping out undesired files for the dist build
    console.log(chalk_1.default.cyan("Copying static directory"));
    await (0, util_1.exec)("rsync", ["-r", "-L", "--exclude=.garden", "--exclude=.git", constants_1.STATIC_DIR, tmpDir]);
    await (0, util_1.exec)("git", ["init"], { cwd: tmpStaticDir });
    // Copy each package to the temp dir
    console.log(chalk_1.default.cyan("Getting package info"));
    const res = (await (0, util_1.exec)("yarn", ["--json", "workspaces", "info"])).stdout;
    const workspaces = JSON.parse(JSON.parse(res).data);
    console.log(chalk_1.default.cyan("Copying packages"));
    await bluebird_1.default.map(Object.entries(workspaces), async ([name, info]) => {
        const sourcePath = (0, path_1.resolve)(repoRoot, info.location);
        const targetPath = (0, path_1.resolve)(tmpDir, info.location);
        await (0, fs_extra_1.remove)(targetPath);
        await (0, fs_extra_1.mkdirp)(targetPath);
        await (0, util_1.exec)("rsync", [
            "-r",
            "-L",
            "--exclude=node_modules",
            "--exclude=tmp",
            "--exclude=test",
            sourcePath,
            (0, path_1.resolve)(targetPath, ".."),
        ]);
        console.log(chalk_1.default.green(" ✓ " + name));
    });
    // Edit all the packages to have them directly link any internal dependencies
    console.log(chalk_1.default.cyan("Modifying package.json files for direct installation"));
    await bluebird_1.default.map(Object.entries(workspaces), async ([name, info]) => {
        const packageRoot = (0, path_1.resolve)(tmpDir, info.location);
        const packageJsonPath = (0, path_1.resolve)(packageRoot, "package.json");
        const packageJson = require(packageJsonPath);
        for (const depName of info.workspaceDependencies) {
            const depInfo = workspaces[depName];
            const targetRoot = (0, path_1.resolve)(tmpDir, depInfo.location);
            const relPath = (0, path_1.relative)(packageRoot, targetRoot);
            packageJson.dependencies[depName] = "file:" + relPath;
        }
        if (version === "edge") {
            const gitHash = await (0, util_1.exec)("git", ["rev-parse", "--short", "HEAD"]);
            packageJson.version = packageJson.version + "-edge-" + gitHash.stdout;
            console.log("Set package version to " + packageJson.version);
        }
        await (0, fs_extra_1.writeFile)(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(chalk_1.default.green(" ✓ " + name));
    });
    // Run yarn install in the cli package
    console.log(chalk_1.default.cyan("Installing packages in @garden-io/cli package"));
    const cliPath = (0, path_1.resolve)(tmpDir, workspaces["@garden-io/cli"].location);
    await (0, util_1.exec)("yarn", ["--production"], { cwd: cliPath });
    // Run pkg and pack up each platform binary
    console.log(chalk_1.default.cyan("Packaging garden binaries"));
    await bluebird_1.default.map(Object.entries(selected), async ([targetName, spec]) => {
        await spec.handler({ targetName, sourcePath: cliPath, pkgType: spec.pkgType, version });
        await (0, util_1.sleep)(5000); // Work around concurrency bug in pkg...
        console.log(chalk_1.default.green(" ✓ " + targetName));
    });
    console.log(chalk_1.default.green.bold("Done!"));
}
async function pkgMacos({ targetName, sourcePath, pkgType, version }) {
    console.log(` - ${targetName} -> fsevents`);
    // Copy fsevents from lib to node_modules
    await (0, fs_extra_1.copy)((0, path_1.resolve)(constants_1.GARDEN_CORE_ROOT, "lib", "fsevents"), (0, path_1.resolve)(tmpDir, "cli", "node_modules", "fsevents"));
    await pkgCommon({
        sourcePath,
        targetName,
        pkgType,
        binFilename: "garden",
    });
    console.log(` - ${targetName} -> fsevents.node`);
    await (0, fs_extra_1.copy)((0, path_1.resolve)(constants_1.GARDEN_CORE_ROOT, "lib", "fsevents", "fsevents.node"), (0, path_1.resolve)(distPath, targetName, "fsevents.node"));
    await tarball(targetName, version);
}
async function pkgLinux({ targetName, sourcePath, pkgType, version }) {
    await pkgCommon({
        sourcePath,
        targetName,
        pkgType,
        binFilename: "garden",
    });
    await tarball(targetName, version);
}
async function pkgWindows({ targetName, sourcePath, pkgType, version }) {
    await pkgCommon({
        sourcePath,
        targetName,
        pkgType,
        binFilename: "garden.exe",
    });
    console.log(` - ${targetName} -> zip`);
    const filename = getZipFilename(version, targetName);
    await (0, util_1.exec)("zip", ["-q", "-r", filename, targetName], { cwd: distPath });
}
async function pkgAlpine({ targetName, version }) {
    const targetPath = (0, path_1.resolve)(distPath, targetName);
    await (0, fs_extra_1.remove)(targetPath);
    await (0, fs_extra_1.mkdirp)(targetPath);
    console.log(` - ${targetName} -> docker build`);
    const imageName = "gardendev/garden:alpine-builder";
    const containerName = "alpine-builder-" + (0, string_1.randomString)(8);
    const supportDir = (0, path_1.resolve)(repoRoot, "support");
    await (0, fs_extra_1.copy)((0, path_1.resolve)(supportDir, ".dockerignore"), (0, path_1.resolve)(tmpDir, ".dockerignore"));
    await (0, util_1.exec)("docker", [
        "build",
        "--platform",
        "linux/amd64",
        "-t",
        imageName,
        "-f",
        (0, path_1.resolve)(repoRoot, "support", "alpine-builder.Dockerfile"),
        tmpDir,
    ]);
    try {
        console.log(` - ${targetName} -> docker create`);
        await (0, util_1.exec)("docker", ["create", "-it", "--name", containerName, imageName, "sh"]);
        console.log(` - ${targetName} -> docker copy`);
        await (0, util_1.exec)("docker", ["cp", `${containerName}:/garden/.`, targetPath]);
    }
    finally {
        await (0, util_1.exec)("docker", ["rm", "-f", containerName]);
    }
    await tarball(targetName, version);
}
async function pkgCommon({ sourcePath, targetName, pkgType, binFilename, }) {
    const targetPath = (0, path_1.resolve)(distPath, targetName);
    await (0, fs_extra_1.remove)(targetPath);
    await (0, fs_extra_1.mkdirp)(targetPath);
    const pkgFetchTmpDir = (0, path_1.resolve)(repoRoot, "tmp", "pkg-fetch", targetName);
    await (0, fs_extra_1.mkdirp)(pkgFetchTmpDir);
    console.log(` - ${targetName} -> pkg`);
    await (0, util_1.exec)(pkgPath, [
        "--target",
        pkgType,
        sourcePath,
        "--compress",
        "Brotli",
        "--public",
        "--options",
        nodeOptions.join(","),
        "--output",
        (0, path_1.resolve)(targetPath, binFilename),
    ], { env: { PKG_CACHE_PATH: pkgFetchTmpDir } });
    console.log(` - ${targetName} -> static`);
    await copyStatic(targetName);
}
async function copyStatic(targetName) {
    const targetPath = (0, path_1.resolve)(distPath, targetName);
    console.log(` - ${targetName} -> static dir`);
    await (0, fs_extra_1.copy)(tmpStaticDir, (0, path_1.resolve)(targetPath, "static"));
}
async function tarball(targetName, version) {
    const filename = getTarballFilename(version, targetName);
    console.log(` - ${targetName} -> tar (${filename})`);
    await (0, util_1.exec)("tar", ["-czf", filename, targetName], { cwd: distPath });
    return new Promise((_resolve, reject) => {
        const hashFilename = filename + ".sha256";
        const archivePath = (0, path_1.join)(distPath, filename);
        const hashPath = (0, path_1.join)(distPath, hashFilename);
        // compute the sha256 checksum
        console.log(` - ${targetName} -> sha256 (${hashFilename})`);
        const response = (0, fs_1.createReadStream)(archivePath);
        response.on("error", reject);
        const hash = (0, crypto_1.createHash)("sha256");
        hash.setEncoding("hex");
        response.on("end", () => {
            hash.end();
            const sha256 = hash.read();
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            (0, fs_extra_1.writeFile)(hashPath, sha256 + "\n")
                .catch(reject)
                .then(_resolve);
        });
        response.pipe(hash);
    });
}
buildBinaries(process.argv.slice(2)).catch((err) => {
    console.error(chalk_1.default.red(err.message));
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtcGtnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVpbGQtcGtnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILGtEQUF5QjtBQUN6QiwrQkFBOEM7QUFDOUMsd0RBQStCO0FBQy9CLG1FQUFtRztBQUNuRyx1Q0FBMEQ7QUFDMUQsOERBQW9GO0FBQ3BGLGtFQUFvRTtBQUNwRSxtQ0FBNkI7QUFDN0Isd0RBQStCO0FBQy9CLG1DQUFtQztBQUNuQywyQkFBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUE7QUFFdkMsTUFBTSxRQUFRLEdBQUcsSUFBQSxjQUFPLEVBQUMsMkJBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUMvQyxNQUFNLE1BQU0sR0FBRyxJQUFBLGNBQU8sRUFBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQzlDLE1BQU0sWUFBWSxHQUFHLElBQUEsY0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtBQUM5QyxNQUFNLE9BQU8sR0FBRyxJQUFBLGNBQU8sRUFBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDdkUsTUFBTSxRQUFRLEdBQUcsSUFBQSxjQUFPLEVBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBRTFDLHNDQUFzQztBQUN0QyxNQUFNLFdBQVcsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUE7QUFpQi9DLE1BQU0sT0FBTyxHQUFtQztJQUM5QyxhQUFhLEVBQUUsRUFBRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUU7SUFDL0YsYUFBYSxFQUFFLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsT0FB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