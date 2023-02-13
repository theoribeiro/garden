#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = require("fs-extra");
const child_process_1 = require("child_process");
const path_1 = require("path");
const string_1 = require("@garden-io/sdk/util/string");
const parseArgs = require("minimist");
const gardenRoot = (0, path_1.resolve)(__dirname, "..");
async function getChangelog(prevReleaseTag, curReleaseTag) {
    try {
        return (await (0, execa_1.default)("git-chglog", [`${prevReleaseTag}..${curReleaseTag}`], { cwd: gardenRoot })).stdout;
    }
    catch (err) {
        throw new Error(`Error generating changelog: ${err}`);
    }
}
function getContributors(prevReleaseTag, curReleaseTag) {
    try {
        return (0, child_process_1.execSync)(`git log ${prevReleaseTag}..${curReleaseTag} --no-merges | grep ^Author | sort | uniq -c | sort -nr`).toString();
    }
    catch (err) {
        throw new Error(`Error generating list of contributors: ${err}`);
    }
}
const releaseNotesDraft = (version, changelog, contributors) => (0, string_1.dedent)(`
# Garden ${version} is out! :tada:

[TODO: INSERT BRIEF RELEASE DESCRIPTION HERE. Give an overview of the release and mention all relevant features.]

[TODO: prepare the list of **external** contributors, replace the list in [[]] with the comma-separated list of @github_names, and remove surrounding [[]] characters. Note that authors of squashed commits won't show up, so it might be good to do a quick sanity check on Github as well.]
Many thanks to [[${contributors}]] for the contributions to this release!

## Assets

Download the Garden binary for your platform from below or simply run \`garden self-update\` if you already have it installed.

* [Garden v${version} for Alpine AMD64 (tar.gz)](https://download.garden.io/core/${version}/garden-${version}-alpine-amd64.tar.gz)
* [Garden v${version} for Linux AMD64 (tar.gz)](https://download.garden.io/core/${version}/garden-${version}-linux-amd64.tar.gz)
* [Garden v${version} for MacOS AMD64 (tar.gz)](https://download.garden.io/core/${version}/garden-${version}-macos-amd64.tar.gz)
* [Garden v${version} for Windows AMD64 (.zip)](https://download.garden.io/core/${version}/garden-${version}-windows-amd64.zip)

## Changelog
[TODO: Remember to put the list of features on top of the list of bug fixes.]
[TODO: Remove all garbage entries from the changelog below.]
${changelog}
`);
// todo: for better automation, consider calling this from ./release.ts when RELEASE_TYPE arg is minor|patch
//       and remember to update CONTRIBUTING.msd guide
async function draftReleaseNotes() {
    // Parse arguments
    const argv = parseArgs(process.argv.slice(2));
    const prevReleaseTag = argv._[0];
    const curReleaseTag = argv._[1];
    console.log(`Generating release notes draft for ${curReleaseTag}...`);
    // Generate changelog
    // todo: ensure that the list of features on top of the list of bug fixes
    console.log("Generating changelog...");
    const changelog = await getChangelog(prevReleaseTag, curReleaseTag);
    console.log("Generating list of contributors...");
    const contributors = getContributors(prevReleaseTag, curReleaseTag);
    const content = releaseNotesDraft(curReleaseTag, changelog, contributors);
    const filename = `release-notes-${curReleaseTag}-draft.md`;
    const outputPath = `${gardenRoot}/${filename}`;
    console.log(`Writing release notes draft to ${outputPath}`);
    try {
        await (0, fs_extra_1.writeFile)(outputPath, content, { encoding: "utf-8" });
    }
    catch (err) {
        throw new Error(`Error writing release notes draft to path ${outputPath}: ${err}`);
    }
    console.log("Done!");
}
(async () => {
    try {
        await draftReleaseNotes();
        process.exit(0);
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
})().catch(() => { });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZnQtcmVsZWFzZS1ub3Rlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRyYWZ0LXJlbGVhc2Utbm90ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUEsa0RBQXlCO0FBQ3pCLHVDQUFvQztBQUNwQyxpREFBd0M7QUFDeEMsK0JBQThCO0FBQzlCLHVEQUFtRDtBQUNuRCxzQ0FBc0M7QUFFdEMsTUFBTSxVQUFVLEdBQUcsSUFBQSxjQUFPLEVBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBRTNDLEtBQUssVUFBVSxZQUFZLENBQUMsY0FBc0IsRUFBRSxhQUFxQjtJQUN2RSxJQUFJO1FBQ0YsT0FBTyxDQUFDLE1BQU0sSUFBQSxlQUFLLEVBQUMsWUFBWSxFQUFFLENBQUMsR0FBRyxjQUFjLEtBQUssYUFBYSxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFBO0tBQ3hHO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixHQUFHLEVBQUUsQ0FBQyxDQUFBO0tBQ3REO0FBQ0gsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLGNBQXNCLEVBQUUsYUFBcUI7SUFDcEUsSUFBSTtRQUNGLE9BQU8sSUFBQSx3QkFBUSxFQUNiLFdBQVcsY0FBYyxLQUFLLGFBQWEseURBQXlELENBQ3JHLENBQUMsUUFBUSxFQUFFLENBQUE7S0FDYjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsR0FBRyxFQUFFLENBQUMsQ0FBQTtLQUNqRTtBQUNILENBQUM7QUFFRCxNQUFNLGlCQUFpQixHQUFHLENBQUMsT0FBZSxFQUFFLFNBQWlCLEVBQUUsWUFBb0IsRUFBVSxFQUFFLENBQzdGLElBQUEsZUFBTSxFQUFDO1dBQ0UsT0FBTzs7Ozs7bUJBS0MsWUFBWTs7Ozs7O2FBTWxCLE9BQU8sK0RBQStELE9BQU8sV0FBVyxPQUFPO2FBQy9GLE9BQU8sOERBQThELE9BQU8sV0FBVyxPQUFPO2FBQzlGLE9BQU8sOERBQThELE9BQU8sV0FBVyxPQUFPO2FBQzlGLE9BQU8sOERBQThELE9BQU8sV0FBVyxPQUFPOzs7OztFQUt6RyxTQUFTO0NBQ1YsQ0FBQyxDQUFBO0FBRUYsNEdBQTRHO0FBQzVHLHNEQUFzRDtBQUN0RCxLQUFLLFVBQVUsaUJBQWlCO0lBQzlCLGtCQUFrQjtJQUNsQixNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUM3QyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ2hDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsYUFBYSxLQUFLLENBQUMsQ0FBQTtJQUVyRSxxQkFBcUI7SUFDckIseUVBQXlFO0lBQ3pFLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQTtJQUN0QyxNQUFNLFNBQVMsR0FBRyxNQUFNLFlBQVksQ0FBQyxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFFbkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFBO0lBQ2pELE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFFbkUsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQTtJQUN6RSxNQUFNLFFBQVEsR0FBRyxpQkFBaUIsYUFBYSxXQUFXLENBQUE7SUFDMUQsTUFBTSxVQUFVLEdBQUcsR0FBRyxVQUFVLElBQUksUUFBUSxFQUFFLENBQUE7SUFFOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsVUFBVSxFQUFFLENBQUMsQ0FBQTtJQUMzRCxJQUFJO1FBQ0YsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO0tBQzVEO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxVQUFVLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQTtLQUNuRjtJQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDdEIsQ0FBQztBQUVELENBQUMsS0FBSyxJQUFJLEVBQUU7SUFDVixJQUFJO1FBQ0YsTUFBTSxpQkFBaUIsRUFBRSxDQUFBO1FBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDaEI7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUNoQjtBQUNILENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFBIn0=