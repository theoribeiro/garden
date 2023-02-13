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
const nodetree = require("nodetree");
const readdir_enhanced_1 = __importDefault(require("@jsdevtools/readdir-enhanced"));
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const chai_1 = require("chai");
const helpers_1 = require("../../../helpers");
const fs_1 = require("../../../../src/util/fs");
const bluebird_1 = __importDefault(require("bluebird"));
const rsync_1 = require("../../../../src/build-staging/rsync");
const build_1 = require("../../../../src/tasks/build");
// TODO-G2: rename test cases to match the new graph model semantics
/*
  Module dependency diagram for build-dir test project

    a   b
     \ /
      d   c  e (e is a local exec module)
        \ | /
          f
 */
const projectRoot = (0, helpers_1.getDataDir)("test-projects", "build-dir");
const makeGarden = async (opts = {}) => {
    return await (0, helpers_1.makeTestGarden)(projectRoot, { ...opts, noTempDir: true });
};
async function populateDirectory(root, posixPaths) {
    await bluebird_1.default.map(posixPaths, async (path) => {
        const absPath = (0, fs_1.joinWithPosix)(root, path);
        await (0, fs_extra_1.ensureFile)(absPath);
        await (0, fs_extra_1.writeFile)(absPath, (0, path_1.basename)(path));
    });
}
async function listFiles(path) {
    return (await (0, readdir_enhanced_1.default)(path, { deep: true, filter: (stats) => stats.isFile() })).sort();
}
async function assertIdentical(sourceRoot, targetRoot, posixPaths) {
    if (!posixPaths) {
        posixPaths = await listFiles(sourceRoot);
    }
    await bluebird_1.default.map(posixPaths, async (path) => {
        const sourcePath = (0, fs_1.joinWithPosix)(sourceRoot, path);
        const targetPath = (0, fs_1.joinWithPosix)(targetRoot, path);
        const sourceData = (await (0, fs_extra_1.readFile)(sourcePath)).toString();
        const targetData = (await (0, fs_extra_1.readFile)(targetPath)).toString();
        (0, chai_1.expect)(sourceData).to.equal(targetData);
    });
}
describe("BuildStaging", () => {
    let garden;
    let log;
    let buildStaging;
    before(async () => {
        garden = await makeGarden();
        log = garden.log;
        buildStaging = garden.buildStaging;
    });
    afterEach(async () => {
        await buildStaging.clear();
    });
    async function sync(params) {
        return buildStaging["sync"](params);
    }
    describe("(common)", () => commonSyncTests(true));
    describe("sync", () => {
        let tmpDir;
        let tmpPath;
        beforeEach(async () => {
            tmpDir = await (0, fs_1.makeTempDir)();
            tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
        });
        afterEach(async () => {
            await (tmpDir === null || tmpDir === void 0 ? void 0 : tmpDir.cleanup());
        });
        it("syncs source directory to populated target directory and deletes extraneous files", async () => {
            const sourceRoot = (0, path_1.join)(tmpPath, "source");
            const targetRoot = (0, path_1.join)(tmpPath, "target");
            await (0, fs_extra_1.ensureDir)(sourceRoot);
            await (0, fs_extra_1.ensureDir)(targetRoot);
            await populateDirectory(sourceRoot, ["a", "subdir/c"]);
            await populateDirectory(targetRoot, ["b", "subdir/subsubdir/d"]);
            await sync({ log, sourceRoot, targetRoot, withDelete: true });
            await assertIdentical(sourceRoot, targetRoot, ["a", "subdir/c"]);
            (0, chai_1.expect)(await listFiles(targetRoot)).to.eql(["a", "subdir/c"]);
        });
        it("throws if source relative path is absolute", async () => {
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: tmpPath, targetRoot: tmpPath, sourceRelPath: "/foo", withDelete: false }), { contains: "Build staging: Got absolute path for sourceRelPath" });
        });
        it("throws if target relative path is absolute", async () => {
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: tmpPath, targetRoot: tmpPath, targetRelPath: "/foo", withDelete: false }), { contains: "Build staging: Got absolute path for targetRelPath" });
        });
        it("throws if target relative path contains wildcards", async () => {
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: tmpPath, targetRoot: tmpPath, targetRelPath: "foo/*", withDelete: false }), { contains: "Build staging: Target path (foo/*) must not contain wildcards" });
        });
        it("throws if source root doesn't exist", async () => {
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: "/oepfkaopwefk", targetRoot: tmpPath, withDelete: false }), {
                contains: "Build staging: Source root /oepfkaopwefk must exist and be a directory",
            });
        });
        it("throws if source root is not a directory", async () => {
            const path = (0, path_1.join)(tmpPath, "a");
            await (0, fs_extra_1.ensureFile)(path);
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: path, targetRoot: tmpPath, withDelete: false }), {
                contains: `Build staging: Source root ${path} must exist and be a directory`,
            });
        });
        it("does nothing if source path has no wildcard and cannot be found", async () => {
            await sync({ log, sourceRoot: tmpPath, targetRoot: tmpPath, sourceRelPath: "foo", withDelete: false });
            const files = await (0, readdir_enhanced_1.default)(tmpPath);
            (0, chai_1.expect)(files.length).to.equal(0);
        });
        it("throws if source rel path ends with slash but points to a file", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: tmpPath, targetRoot: tmpPath, sourceRelPath: "a/", withDelete: false }), { contains: `Build staging: Expected source path ${tmpPath}/a/ to be a directory` });
        });
        it("throws if target rel path ends with slash but points to a file", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: tmpPath, targetRoot: tmpPath, targetRelPath: "a/", withDelete: false }), { contains: `Build staging: Expected target path ${tmpPath}/a/ to not exist or be a directory` });
        });
        it("throws if file list is specified and source+target aren't both directories", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, helpers_1.expectError)(() => sync({
                log,
                sourceRoot: tmpPath,
                targetRoot: tmpPath,
                sourceRelPath: "a",
                withDelete: false,
                files: ["b"],
            }), { contains: "Build staging: Both source and target must be directories when specifying a file list" });
        });
        it("throws if source relative path has wildcard and target path points to an existing file", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: tmpPath, targetRoot: (0, path_1.join)(tmpPath, "a"), sourceRelPath: "*", withDelete: false }), {
                contains: `Build staging: Attempting to copy multiple files from ${tmpPath} to ${tmpPath}/a, but a file exists at target path`,
            });
        });
        it("removes target before cloning if source is a directory, target is a file and withDelete=true", async () => {
            const sourceRoot = (0, path_1.join)(tmpPath, "source");
            const targetRoot = (0, path_1.join)(tmpPath, "target");
            await (0, fs_extra_1.ensureDir)(sourceRoot);
            await (0, fs_extra_1.ensureFile)(targetRoot);
            await populateDirectory(sourceRoot, ["a", "b", "subdir/c", "subdir/subsubdir/d"]);
            await sync({ log, sourceRoot, targetRoot, withDelete: true });
            await assertIdentical(sourceRoot, targetRoot);
        });
        it("throws if source is directory, target is a file and withDelete=false", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, helpers_1.expectError)(() => sync({ log, sourceRoot: tmpPath, targetRoot: tmpPath, targetRelPath: "a", withDelete: false }), {
                contains: `Build staging: Attempting to copy directory from ${tmpPath} to ${tmpPath}/a, but a file exists at target path`,
            });
        });
    });
});
describe("BuildStagingRsync", () => {
    let garden;
    before(async () => {
        garden = await makeGarden({ legacyBuildSync: true });
    });
    afterEach(async () => {
        await garden.buildStaging.clear();
    });
    it("should have ensured the existence of the build dir when Garden was initialized", async () => {
        const buildDirExists = await (0, fs_extra_1.pathExists)(garden.buildStaging.buildDirPath);
        (0, chai_1.expect)(buildDirExists).to.eql(true);
    });
    describe("(common)", () => commonSyncTests(false));
    describe("sync", () => {
        let buildStaging;
        let graph;
        let action;
        beforeEach(async () => {
            buildStaging = new rsync_1.BuildStagingRsync(garden.projectRoot, garden.gardenDirPath);
            graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            action = graph.getBuild("module-a");
        });
        it("should not sync symlinks that point outside the module root", async () => {
            const actionWithSymlink = graph.getBuild("symlink-outside-module");
            await garden.buildStaging.syncFromSrc(actionWithSymlink, garden.log);
            const buildDir = garden.buildStaging.getBuildPath(actionWithSymlink.getConfig());
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDir, "symlink.txt"))).to.be.false;
        });
        it("should throw if rsync is not on PATH", async () => {
            const orgPath = process.env.PATH;
            try {
                process.env.PATH = "";
                await (0, helpers_1.expectError)(() => buildStaging.syncFromSrc(action, garden.log), {
                    contains: "Could not find rsync binary. Please make sure rsync (version 3.1.0 or later) is installed and on your PATH.",
                });
            }
            finally {
                process.env.PATH = orgPath;
            }
        });
        it(`should work with rsync v${rsync_1.minRsyncVersion}`, async () => {
            buildStaging.setRsyncPath((0, helpers_1.getDataDir)("dummy-rsync", "min-version", "rsync"));
            await buildStaging.validate();
        });
        it("should work with rsync v3.2.3", async () => {
            buildStaging.setRsyncPath((0, helpers_1.getDataDir)("dummy-rsync", "new-version", "rsync"));
            await buildStaging.validate();
        });
        it("should throw if rsync is too old", async () => {
            buildStaging.setRsyncPath((0, helpers_1.getDataDir)("dummy-rsync", "old-version", "rsync"));
            await (0, helpers_1.expectError)(() => buildStaging.syncFromSrc(action, garden.log), {
                contains: [
                    "found rsync binary but the version is too old",
                    "please make sure rsync",
                    "more about garden installation and requirements can be found in our documentation",
                ],
            });
        });
        it("should throw if rsync returns invalid version", async () => {
            buildStaging.setRsyncPath((0, helpers_1.getDataDir)("dummy-rsync", "invalid", "rsync"));
            await (0, helpers_1.expectError)(() => buildStaging.syncFromSrc(action, garden.log), {
                contains: [
                    "could not detect rsync binary version in the version command",
                    "please make sure rsync",
                    "more about garden installation and requirements can be found in our documentation",
                ],
            });
        });
    });
});
function commonSyncTests(legacyBuildSync) {
    let garden;
    let log;
    let buildStaging;
    let tmpDir;
    let tmpPath;
    before(async () => {
        garden = await makeGarden({ legacyBuildSync });
        log = garden.log;
        buildStaging = garden.buildStaging;
    });
    beforeEach(async () => {
        tmpDir = await (0, fs_1.makeTempDir)();
        tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
    });
    afterEach(async () => {
        await buildStaging.clear();
        await (tmpDir === null || tmpDir === void 0 ? void 0 : tmpDir.cleanup());
    });
    async function sync(params) {
        return buildStaging["sync"](params);
    }
    it("should sync dependency products to their specified destinations", async () => {
        try {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildActions = graph.getBuilds();
            const buildTasks = buildActions.map((action) => new build_1.BuildTask({
                garden,
                log,
                graph,
                action,
                force: true,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            }));
            await garden.processTasks({ tasks: buildTasks });
            const buildActionD = await graph.getBuild("module-d");
            const buildActionF = await graph.getBuild("module-f");
            const buildDirD = buildStaging.getBuildPath(buildActionD.getConfig());
            const buildDirF = buildStaging.getBuildPath(buildActionF.getConfig());
            // All these destinations should be populated now.
            const buildProductDestinations = [
                (0, path_1.join)(buildDirD, "a", "a.txt"),
                (0, path_1.join)(buildDirD, "b", "build", "b1.txt"),
                (0, path_1.join)(buildDirD, "b", "build_subdir", "b2.txt"),
                (0, path_1.join)(buildDirF, "d", "build", "d.txt"),
                (0, path_1.join)(buildDirF, "e", "e1.txt"),
                (0, path_1.join)(buildDirF, "e", "build", "e2.txt"),
            ];
            for (const p of buildProductDestinations) {
                (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(p)).to.eql(true, `${p} not found`);
            }
            // This file was not requested by module-d's garden.yml's copy directive for module-b.
            const notCopiedPath = (0, path_1.join)(buildDirD, "B", "build", "unused.txt");
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(notCopiedPath)).to.eql(false);
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log(nodetree(buildStaging.buildDirPath));
            throw e;
        }
    });
    describe("ensureBuildPath", () => {
        it("should ensure the build path and return it", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildActionA = graph.getBuild("module-a");
            const buildDirA = await buildStaging.ensureBuildPath(buildActionA.getConfig());
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(buildDirA)).to.eql(true);
            (0, chai_1.expect)(buildDirA).to.eql((0, path_1.join)(buildStaging.buildDirPath, "module-a"));
        });
        it("should return the module path for a local exec modules", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildActionE = graph.getBuild("module-e");
            const buildDirE = await buildStaging.ensureBuildPath(buildActionE.getConfig());
            (0, chai_1.expect)(buildDirE).to.eql(buildActionE.getBuildPath());
        });
    });
    it("should sync sources to the build dir", async () => {
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const buildActionA = graph.getBuild("module-a");
        await buildStaging.syncFromSrc(buildActionA, garden.log);
        const buildDirA = buildStaging.getBuildPath(buildActionA.getConfig());
        const copiedPaths = [(0, path_1.join)(buildDirA, "some-dir", "some-file")];
        for (const p of copiedPaths) {
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(p)).to.eql(true);
        }
    });
    it("should have ensured the existence of the build dir when Garden was initialized", async () => {
        const buildDirExists = await (0, fs_extra_1.pathExists)(buildStaging.buildDirPath);
        (0, chai_1.expect)(buildDirExists).to.eql(true);
    });
    it("should clear the build dir when requested", async () => {
        const nodeCount = await (0, readdir_enhanced_1.default)(buildStaging.buildDirPath);
        (0, chai_1.expect)(nodeCount).to.eql([]);
    });
    it("should ensure that a module's build subdir exists before returning from buildPath", async () => {
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const buildActionA = await graph.getBuild("module-a");
        const buildPath = await buildStaging.ensureBuildPath(buildActionA.getConfig());
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(buildPath)).to.eql(true);
    });
    describe("sync", () => {
        it("should not sync sources for local exec modules", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildActionE = graph.getBuild("module-e");
            await buildStaging.syncFromSrc(buildActionE, garden.log);
            // This is the dir Garden would have synced the sources into
            const buildDirF = (0, path_1.join)(buildStaging.buildDirPath, buildActionE.name);
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(buildDirF)).to.eql(false);
        });
        it("should respect the file list in the module's version", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildActionA = graph.getBuild("module-a");
            buildActionA.getFullVersion().files = [(0, path_1.join)(buildActionA.basePath(), fs_1.defaultConfigFilename)];
            await buildStaging.syncFromSrc(buildActionA, garden.log);
            const buildDirA = buildStaging.getBuildPath(buildActionA.getConfig());
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDirA, fs_1.defaultConfigFilename))).to.eql(true);
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDirA, "some-dir", "some-file"))).to.eql(false);
        });
        it("should delete files that are not being synced from the module source directory", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildActionA = graph.getBuild("module-a");
            const buildDirA = await buildStaging.ensureBuildPath(buildActionA.getConfig());
            const deleteMe = (0, path_1.join)(buildDirA, "delete-me");
            await (0, fs_extra_1.createFile)(deleteMe);
            buildActionA.getFullVersion().files = [(0, path_1.join)(buildActionA.getBuildPath(), fs_1.defaultConfigFilename)];
            await buildStaging.syncFromSrc(buildActionA, garden.log);
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(deleteMe)).to.be.false;
        });
        it("should sync hidden files and directories (names starting with .)", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildAction = graph.getBuild("hidden-files");
            await buildStaging.syncFromSrc(buildAction, garden.log);
            const buildDir = buildStaging.getBuildPath(buildAction.getConfig());
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDir, ".hidden-file"))).to.be.true;
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDir, ".hidden-dir", "something"))).to.be.true;
        });
        it("should sync symlinks that point within the module root", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildAction = graph.getBuild("symlink-within-module");
            await buildStaging.syncFromSrc(buildAction, garden.log);
            const buildDir = buildStaging.getBuildPath(buildAction.getConfig());
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDir, "symlink.txt"))).to.be.true;
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDir, "nested", "symlink.txt"))).to.be.true;
        });
        it("should not sync absolute symlinks", async () => {
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const buildAction = graph.getBuild("symlink-absolute");
            await buildStaging.syncFromSrc(buildAction, garden.log);
            const buildDir = buildStaging.getBuildPath(buildAction.getConfig());
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(buildDir, "symlink.txt"))).to.be.false;
        });
        it("syncs source directory to empty target directory with no file list", async () => {
            const sourceRoot = (0, path_1.join)(tmpPath, "source");
            const targetRoot = (0, path_1.join)(tmpPath, "target");
            await (0, fs_extra_1.ensureDir)(sourceRoot);
            await (0, fs_extra_1.ensureDir)(targetRoot);
            await populateDirectory(sourceRoot, ["a", "b", "subdir/c", "subdir/subsubdir/d"]);
            await sync({ log, sourceRoot, targetRoot, withDelete: false });
            await assertIdentical(sourceRoot, targetRoot);
        });
        it("syncs source directory to empty target directory with file list", async () => {
            const sourceRoot = (0, path_1.join)(tmpPath, "source");
            const targetRoot = (0, path_1.join)(tmpPath, "target");
            await (0, fs_extra_1.ensureDir)(sourceRoot);
            await (0, fs_extra_1.ensureDir)(targetRoot);
            await populateDirectory(sourceRoot, ["a", "b", "subdir/c", "subdir/subsubdir/d"]);
            const files = ["a", "subdir/subsubdir/d"];
            await sync({ log, sourceRoot, targetRoot, withDelete: false, files });
            await assertIdentical(sourceRoot, targetRoot, files);
            (0, chai_1.expect)(await listFiles(targetRoot)).to.eql(files);
        });
        it("syncs source directory to populated target directory with no file list", async () => {
            const sourceRoot = (0, path_1.join)(tmpPath, "source");
            const targetRoot = (0, path_1.join)(tmpPath, "target");
            await (0, fs_extra_1.ensureDir)(sourceRoot);
            await (0, fs_extra_1.ensureDir)(targetRoot);
            await populateDirectory(sourceRoot, ["a", "subdir/c"]);
            await populateDirectory(targetRoot, ["b", "subdir/subsubdir/d"]);
            await sync({ log, sourceRoot, targetRoot, withDelete: false });
            await assertIdentical(sourceRoot, targetRoot, ["a", "subdir/c"]);
            (0, chai_1.expect)(await listFiles(targetRoot)).to.eql(["a", "b", "subdir/c", "subdir/subsubdir/d"]);
        });
        it("syncs source directory to populated target directory with file list", async () => {
            const sourceRoot = (0, path_1.join)(tmpPath, "source");
            const targetRoot = (0, path_1.join)(tmpPath, "target");
            await (0, fs_extra_1.ensureDir)(sourceRoot);
            await (0, fs_extra_1.ensureDir)(targetRoot);
            await populateDirectory(sourceRoot, ["a", "subdir/c"]);
            await populateDirectory(targetRoot, ["b", "subdir/subsubdir/d"]);
            await sync({ log, sourceRoot, targetRoot, withDelete: false, files: ["a"] });
            await assertIdentical(sourceRoot, targetRoot, ["a"]);
            (0, chai_1.expect)(await listFiles(targetRoot)).to.eql(["a", "b", "subdir/subsubdir/d"]);
        });
        it("syncs directly if source path is a file and target doesn't exist", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await sync({
                log,
                sourceRoot: tmpPath,
                sourceRelPath: "a",
                targetRoot: tmpPath,
                targetRelPath: "b",
                withDelete: false,
            });
            const data = (await (0, fs_extra_1.readFile)((0, path_1.join)(tmpPath, "b"))).toString();
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("syncs directly into target directory if source path is a file and target is a directory", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, fs_extra_1.ensureDir)(b);
            await sync({ log, sourceRoot: tmpPath, sourceRelPath: "a", targetRoot: b, withDelete: false });
            const data = (await (0, fs_extra_1.readFile)((0, path_1.join)(b, "a"))).toString();
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("syncs directly into target directory if source path is a file and targetRelPath ends with slash", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, fs_extra_1.ensureDir)(b);
            await sync({
                log,
                sourceRoot: tmpPath,
                sourceRelPath: "a",
                targetRoot: tmpPath,
                targetRelPath: "b/",
                withDelete: false,
            });
            const data = (await (0, fs_extra_1.readFile)((0, path_1.join)(b, "a"))).toString();
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("correctly handles '.' as the targetRelPath", async () => {
            const sourceRoot = (0, path_1.join)(tmpPath, "source");
            const targetRoot = (0, path_1.join)(tmpPath, "target");
            await (0, fs_extra_1.ensureDir)(sourceRoot);
            await (0, fs_extra_1.ensureDir)(targetRoot);
            await populateDirectory(sourceRoot, ["subdir/a"]);
            await sync({ log, sourceRoot, sourceRelPath: "subdir", targetRoot, targetRelPath: ".", withDelete: false });
            (0, chai_1.expect)(await listFiles(targetRoot)).to.eql(["subdir/a"]);
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtc3RhZ2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJ1aWxkLXN0YWdpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDcEMsb0ZBQWtEO0FBQ2xELCtCQUFxQztBQUNyQyx1Q0FBdUc7QUFDdkcsK0JBQTZCO0FBQzdCLDhDQUFzRjtBQUN0RixnREFBMEc7QUFHMUcsd0RBQStCO0FBRS9CLCtEQUF3RjtBQUN4Rix1REFBdUQ7QUFJdkQsb0VBQW9FO0FBRXBFOzs7Ozs7OztHQVFHO0FBRUgsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUU1RCxNQUFNLFVBQVUsR0FBRyxLQUFLLEVBQUUsT0FBdUIsRUFBRSxFQUFFLEVBQUU7SUFDckQsT0FBTyxNQUFNLElBQUEsd0JBQWMsRUFBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUN4RSxDQUFDLENBQUE7QUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQUMsSUFBWSxFQUFFLFVBQW9CO0lBQ2pFLE1BQU0sa0JBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUM1QyxNQUFNLE9BQU8sR0FBRyxJQUFBLGtCQUFhLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3pDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3pCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLE9BQU8sRUFBRSxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO0lBQzFDLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQztBQUVELEtBQUssVUFBVSxTQUFTLENBQUMsSUFBWTtJQUNuQyxPQUFP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QUMsQ0FBQTtZQUUvQyxNQUFNLFNBQVMsR0FBRyxNQUFNLFlBQVksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7WUFDOUUsTUFBTSxRQUFRLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFBO1lBRTdDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLFFBQVEsQ0FBQyxDQUFBO1lBRTFCLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFBLFdBQUksRUFBQyxZQUFZLENBQUMsWUFBWSxFQUFFLEVBQUUsMEJBQXFCLENBQUMsQ0FBQyxDQUFBO1lBRWhHLE1BQU0sWUFBWSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRXhELElBQUEsYUFBTSxFQUFDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7UUFDaEQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsa0VBQWtFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEYsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFDM0UsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQTtZQUVsRCxNQUFNLFlBQVksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUV2RCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1lBQ25FLElBQUEsYUFBTSxFQUFDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7WUFDbkUsSUFBQSxhQUFNLEVBQUMsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFDakYsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFDM0UsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO1lBRTNELE1BQU0sWUFBWSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRXZELE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7WUFDbkUsSUFBQSxhQUFNLEVBQUMsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtZQUNsRSxJQUFBLGFBQU0sRUFBQyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtRQUM5RSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRCxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtZQUMzRSxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUE7WUFFdEQsTUFBTSxZQUFZLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7WUFFdkQsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtZQUNuRSxJQUFBLGFBQU0sRUFBQyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO1FBQ3JFLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLG9FQUFvRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xGLE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFFMUMsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUE7WUFFakYsTUFBTSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtZQUU5RCxNQUFNLGVBQWUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsaUVBQWlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0UsTUFBTSxVQUFVLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQzFDLE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUUxQyxNQUFNLElBQUEsb0JBQVMsRUFBQyxVQUFVLENBQUMsQ0FBQTtZQUMzQixNQUFNLElBQUEsb0JBQVMsRUFBQyxVQUFVLENBQUMsQ0FBQTtZQUMzQixNQUFNLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQTtZQUVqRixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxvQkFBb0IsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBRXJFLE1BQU0sZUFBZSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDcEQsSUFBQSxhQUFNLEVBQUMsTUFBTSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ25ELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHdFQUF3RSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RGLE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFFMUMsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTtZQUN0RCxNQUFNLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUE7WUFFaEUsTUFBTSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtZQUU5RCxNQUFNLGVBQWUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUE7WUFDaEUsSUFBQSxhQUFNLEVBQUMsTUFBTSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFBO1FBQzFGLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHFFQUFxRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25GLE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFFMUMsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTtZQUN0RCxNQUFNLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUE7WUFFaEUsTUFBTSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUU1RSxNQUFNLGVBQWUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNwRCxJQUFBLGFBQU0sRUFBQyxNQUFNLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQTtRQUM5RSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxrRUFBa0UsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3pCLE1BQU0sSUFBSSxDQUFDO2dCQUNULEdBQUc7Z0JBQ0gsVUFBVSxFQUFFLE9BQU87Z0JBQ25CLGFBQWEsRUFBRSxHQUFHO2dCQUNsQixVQUFVLEVBQUUsT0FBTztnQkFDbkIsYUFBYSxFQUFFLEdBQUc7Z0JBQ2xCLFVBQVUsRUFBRSxLQUFLO2FBQ2xCLENBQUMsQ0FBQTtZQUNGLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFBLG1CQUFRLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUM1RCxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzlCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHlGQUF5RixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZHLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3pCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xCLE1BQU0sSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBQzlGLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFBLG1CQUFRLEVBQUMsSUFBQSxXQUFJLEVBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUN0RCxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzlCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGlHQUFpRyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9HLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3pCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xCLE1BQU0sSUFBSSxDQUFDO2dCQUNULEdBQUc7Z0JBQ0gsVUFBVSxFQUFFLE9BQU87Z0JBQ25CLGFBQWEsRUFBRSxHQUFHO2dCQUNsQixVQUFVLEVBQUUsT0FBTztnQkFDbkIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLFVBQVUsRUFBRSxLQUFLO2FBQ2xCLENBQUMsQ0FBQTtZQUNGLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFBLG1CQUFRLEVBQUMsSUFBQSxXQUFJLEVBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUN0RCxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzlCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFELE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFFMUMsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUE7WUFDM0IsTUFBTSxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBRWpELE1BQU0sSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBRTNHLElBQUEsYUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7UUFDMUQsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==