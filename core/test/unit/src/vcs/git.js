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
const execa = require("execa");
const chai_1 = require("chai");
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const helpers_1 = require("../../../helpers");
const git_1 = require("../../../../src/vcs/git");
const ext_source_util_1 = require("../../../../src/util/ext-source-util");
const string_1 = require("../../../../src/util/string");
const util_1 = require("../../../../src/util/util");
// Overriding this to make sure any ignorefile name is respected
const defaultIgnoreFilename = ".testignore";
async function getCommitMsg(repoPath) {
    const res = (await execa("git", ["log", "-1", "--pretty=%B"], { cwd: repoPath })).stdout;
    return res.replace("\n", "");
}
async function commit(msg, repoPath) {
    // Ensure main contains changes when committing
    const uniqueFilename = `${(0, util_1.uuidv4)()}.txt`;
    const filePath = (0, path_1.join)(repoPath, uniqueFilename);
    await (0, fs_extra_1.createFile)(filePath);
    await execa("git", ["add", filePath], { cwd: repoPath });
    await execa("git", ["commit", "-m", msg], { cwd: repoPath });
    const commitSHA = (await execa("git", ["rev-parse", "HEAD"], { cwd: repoPath })).stdout;
    return { uniqueFilename, commitSHA };
}
async function createGitTag(tag, message, repoPath) {
    await execa("git", ["tag", "-a", tag, "-m", message], { cwd: repoPath });
}
async function makeTempGitRepo() {
    const tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
    const tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
    await execa("git", ["init", "--initial-branch=main"], { cwd: tmpPath });
    return tmpDir;
}
async function addToIgnore(tmpPath, pathToExclude, ignoreFilename = defaultIgnoreFilename) {
    const gardenignorePath = (0, path_1.resolve)(tmpPath, ignoreFilename);
    await (0, fs_extra_1.createFile)(gardenignorePath);
    await (0, fs_extra_1.writeFile)(gardenignorePath, pathToExclude);
}
describe("GitHandler", () => {
    let garden;
    let tmpDir;
    let tmpPath;
    let git;
    let handler;
    let log;
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        log = garden.log;
        tmpDir = await makeTempGitRepo();
        tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
        handler = new git_1.GitHandler({
            garden,
            projectRoot: tmpPath,
            gardenDirPath: (0, path_1.join)(tmpPath, ".garden"),
            ignoreFile: defaultIgnoreFilename,
            cache: garden.cache,
        });
        git = handler.gitCli(log, tmpPath);
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    async function getGitHash(path) {
        return (await git("hash-object", path))[0];
    }
    describe("toGitConfigCompatiblePath", () => {
        it("should return an unmodified path in Linux", async () => {
            const path = "/home/user/repo";
            (0, chai_1.expect)(handler.toGitConfigCompatiblePath(path, "linux")).to.equal(path);
        });
        it("should return an unmodified path in macOS", async () => {
            const path = "/Users/user/repo";
            (0, chai_1.expect)(handler.toGitConfigCompatiblePath(path, "darwin")).to.equal(path);
        });
        it("should return a modified and corrected path in Windows", async () => {
            const path = "C:\\Users\\user\\repo";
            const expectedPath = "C:/Users/user/repo";
            (0, chai_1.expect)(handler.toGitConfigCompatiblePath(path, "win32")).to.equal(expectedPath);
        });
    });
    describe("getRepoRoot", () => {
        it("should return the repo root if it is the same as the given path", async () => {
            const path = tmpPath;
            (0, chai_1.expect)(await handler.getRepoRoot(log, path)).to.equal(tmpPath);
        });
        it("should return the nearest repo root, given a subpath of that repo", async () => {
            const dirPath = (0, path_1.join)(tmpPath, "dir");
            await (0, fs_extra_1.mkdir)(dirPath);
            (0, chai_1.expect)(await handler.getRepoRoot(log, dirPath)).to.equal(tmpPath);
        });
        it("should throw a nice error when given a path outside of a repo", async () => {
            await (0, helpers_1.expectError)(() => handler.getRepoRoot(log, "/tmp"), (err) => (0, chai_1.expect)(err.message).to.equal((0, string_1.deline) `
          Path /tmp is not in a git repository root. Garden must be run from within a git repo.
          Please run \`git init\` if you're starting a new project and repository, or move the project to
          an existing repository, and try again.
        `));
        });
    });
    describe("getPathInfo", () => {
        it("should return empty strings with no commits in repo", async () => {
            const path = tmpPath;
            const { branch, commitHash } = await handler.getPathInfo(log, path);
            (0, chai_1.expect)(branch).to.equal("");
            (0, chai_1.expect)(commitHash).to.equal("");
        });
        it("should return the current branch name when there are commits in the repo", async () => {
            const path = tmpPath;
            await commit("init", tmpPath);
            const { branch } = await handler.getPathInfo(log, path);
            (0, chai_1.expect)(branch).to.equal("main");
        });
        it("should return empty strings when given a path outside of a repo", async () => {
            const path = tmpPath;
            const { branch, commitHash, originUrl } = await handler.getPathInfo(log, path);
            (0, chai_1.expect)(branch).to.equal("");
            (0, chai_1.expect)(commitHash).to.equal("");
            (0, chai_1.expect)(originUrl).to.equal("");
        });
    });
    describe("getFiles", () => {
        it("should work with no commits in repo", async () => {
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, log })).to.eql([]);
        });
        it("should return tracked files as absolute paths with hash", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            await (0, fs_extra_1.writeFile)(path, "my change");
            await git("add", ".");
            await git("commit", "-m", "foo");
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, log })).to.eql([{ path, hash }]);
        });
        it("should return the correct hash on a modified file", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            await git("add", ".");
            await git("commit", "-m", "foo");
            await (0, fs_extra_1.writeFile)(path, "my change");
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, log })).to.eql([{ path, hash }]);
        });
        const dirContexts = [
            { ctx: "when called from repo root", pathFn: (tp) => tp },
            { ctx: "when called from project root", pathFn: (tp) => (0, path_1.resolve)(tp, "somedir") },
        ];
        for (const { ctx, pathFn } of dirContexts) {
            context(ctx, () => {
                it("should return different hashes before and after a file is modified", async () => {
                    const dirPath = pathFn(tmpPath);
                    const filePath = (0, path_1.resolve)(tmpPath, "somedir", "foo.txt");
                    await (0, fs_extra_1.createFile)(filePath);
                    await (0, fs_extra_1.writeFile)(filePath, "original content");
                    await git("add", ".");
                    await git("commit", "-m", "foo");
                    await (0, fs_extra_1.writeFile)(filePath, "my change");
                    const beforeHash = (await handler.getFiles({ path: dirPath, log }))[0].hash;
                    await (0, fs_extra_1.writeFile)(filePath, "ch-ch-ch-ch-changes");
                    const afterHash = (await handler.getFiles({ path: dirPath, log }))[0].hash;
                    (0, chai_1.expect)(beforeHash).to.not.eql(afterHash);
                });
                it("should return untracked files as absolute paths with hash", async () => {
                    const dirPath = pathFn(tmpPath);
                    const path = (0, path_1.join)(dirPath, "foo.txt");
                    await (0, fs_extra_1.createFile)(path);
                    const hash = await getGitHash(path);
                    (0, chai_1.expect)(await handler.getFiles({ path: dirPath, log })).to.eql([{ path, hash }]);
                });
            });
        }
        it("should return untracked files in untracked directory", async () => {
            const dirPath = (0, path_1.join)(tmpPath, "dir");
            const path = (0, path_1.join)(dirPath, "file.txt");
            await (0, fs_extra_1.mkdir)(dirPath);
            await (0, fs_extra_1.createFile)(path);
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: dirPath, log })).to.eql([{ path, hash }]);
        });
        it("should work with tracked files with spaces in the name", async () => {
            const path = (0, path_1.join)(tmpPath, "my file.txt");
            await (0, fs_extra_1.createFile)(path);
            await git("add", path);
            await git("commit", "-m", "foo");
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, log })).to.eql([{ path, hash }]);
        });
        it("should work with tracked+modified files with spaces in the name", async () => {
            const path = (0, path_1.join)(tmpPath, "my file.txt");
            await (0, fs_extra_1.createFile)(path);
            await git("add", path);
            await git("commit", "-m", "foo");
            await (0, fs_extra_1.writeFile)(path, "fooooo");
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, log })).to.eql([{ path, hash }]);
        });
        it("should gracefully skip files that are deleted after having been committed", async () => {
            const filePath = (0, path_1.join)(tmpPath, "my file.txt");
            await (0, fs_extra_1.createFile)(filePath);
            await git("add", filePath);
            await git("commit", "-m", "foo");
            await (0, fs_extra_1.remove)(filePath);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, log })).to.eql([]);
        });
        it("should work with untracked files with spaces in the name", async () => {
            const path = (0, path_1.join)(tmpPath, "my file.txt");
            await (0, fs_extra_1.createFile)(path);
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, log })).to.eql([{ path, hash }]);
        });
        it("should return nothing if include: []", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, include: [], log })).to.eql([]);
        });
        it("should filter out files that don't match the include filter, if specified", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, include: ["bar.*"], log })).to.eql([]);
        });
        it("should include files that match the include filter, if specified", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, include: ["foo.*"], exclude: [], log })).to.eql([{ path, hash }]);
        });
        it("should include a directory that's explicitly included by exact name", async () => {
            const subdirName = "subdir";
            const subdir = (0, path_1.resolve)(tmpPath, subdirName);
            await (0, fs_extra_1.mkdir)(subdir);
            const path = (0, path_1.resolve)(tmpPath, subdirName, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, include: [subdirName], exclude: [], log })).to.eql([
                { path, hash },
            ]);
        });
        it("should include hidden files that match the include filter, if specified", async () => {
            const path = (0, path_1.resolve)(tmpPath, ".foo");
            await (0, fs_extra_1.createFile)(path);
            const hash = await getGitHash(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, include: ["*"], exclude: [], log })).to.eql([{ path, hash }]);
        });
        it("should filter out files that match the exclude filter, if specified", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            (0, chai_1.expect)(await handler.getFiles({ path: tmpPath, include: [], exclude: ["foo.*"], log })).to.eql([]);
        });
        it("should respect include and exclude patterns, if both are specified", async () => {
            const moduleDir = (0, path_1.resolve)(tmpPath, "module-a");
            const pathA = (0, path_1.resolve)(moduleDir, "yes.txt");
            const pathB = (0, path_1.resolve)(tmpPath, "no.txt");
            const pathC = (0, path_1.resolve)(moduleDir, "yes.pass");
            await (0, fs_extra_1.mkdir)(moduleDir);
            await (0, fs_extra_1.createFile)(pathA);
            await (0, fs_extra_1.createFile)(pathB);
            await (0, fs_extra_1.createFile)(pathC);
            const files = (await handler.getFiles({
                path: tmpPath,
                include: ["module-a/**/*"],
                exclude: ["**/*.txt"],
                log,
            })).map((f) => f.path);
            (0, chai_1.expect)(files).to.eql([pathC]);
        });
        it("should exclude untracked files that are listed in ignore file", async () => {
            const name = "foo.txt";
            const path = (0, path_1.resolve)(tmpPath, name);
            await (0, fs_extra_1.createFile)(path);
            await addToIgnore(tmpPath, name);
            const files = (await handler.getFiles({ path: tmpPath, exclude: [], log })).filter((f) => !f.path.includes(defaultIgnoreFilename));
            (0, chai_1.expect)(files).to.eql([]);
        });
        it("should exclude tracked files that are listed in ignore file", async () => {
            const name = "foo.txt";
            const path = (0, path_1.resolve)(tmpPath, name);
            await (0, fs_extra_1.createFile)(path);
            await addToIgnore(tmpPath, name);
            await git("add", path);
            await git("commit", "-m", "foo");
            const files = (await handler.getFiles({ path: tmpPath, exclude: [], log })).filter((f) => !f.path.includes(defaultIgnoreFilename));
            (0, chai_1.expect)(files).to.eql([]);
        });
        it("should work without ignore files", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            await (0, fs_extra_1.writeFile)(path, "my change");
            await git("add", ".");
            await git("commit", "-m", "foo");
            const hash = await getGitHash(path);
            const _handler = new git_1.GitHandler({
                garden,
                projectRoot: tmpPath,
                gardenDirPath: (0, path_1.join)(tmpPath, ".garden"),
                ignoreFile: "",
                cache: garden.cache,
            });
            (0, chai_1.expect)(await _handler.getFiles({ path: tmpPath, log })).to.eql([{ path, hash }]);
        });
        it("should include a relative symlink within the path", async () => {
            const fileName = "foo";
            const filePath = (0, path_1.resolve)(tmpPath, fileName);
            const symlinkPath = (0, path_1.resolve)(tmpPath, "symlink");
            await (0, fs_extra_1.createFile)(filePath);
            await (0, fs_extra_1.symlink)(fileName, symlinkPath);
            const files = (await handler.getFiles({ path: tmpPath, exclude: [], log })).map((f) => f.path);
            (0, chai_1.expect)(files).to.eql([filePath, symlinkPath]);
        });
        it("should exclude a relative symlink that points outside the path", async () => {
            const subPath = (0, path_1.resolve)(tmpPath, "subdir");
            const fileName = "foo";
            const filePath = (0, path_1.resolve)(tmpPath, fileName);
            const symlinkPath = (0, path_1.resolve)(subPath, "symlink");
            await (0, fs_extra_1.createFile)(filePath);
            await (0, fs_extra_1.ensureSymlink)((0, path_1.join)("..", fileName), symlinkPath);
            const files = (await handler.getFiles({ path: subPath, exclude: [], log })).map((f) => f.path);
            (0, chai_1.expect)(files).to.eql([]);
        });
        it("should exclude an absolute symlink that points inside the path", async () => {
            const fileName = "foo";
            const filePath = (0, path_1.resolve)(tmpPath, fileName);
            const symlinkPath = (0, path_1.resolve)(tmpPath, "symlink");
            await (0, fs_extra_1.createFile)(filePath);
            await (0, fs_extra_1.symlink)(filePath, symlinkPath);
            const files = (await handler.getFiles({ path: tmpPath, exclude: [], log })).map((f) => f.path);
            (0, chai_1.expect)(files).to.eql([filePath]);
        });
        it("gracefully aborts if given path doesn't exist", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo");
            const files = (await handler.getFiles({ path, exclude: [], log })).map((f) => f.path);
            (0, chai_1.expect)(files).to.eql([]);
        });
        it("gracefully aborts if given path is not a directory", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo");
            await (0, fs_extra_1.createFile)(path);
            const files = (await handler.getFiles({ path, exclude: [], log })).map((f) => f.path);
            (0, chai_1.expect)(files).to.eql([]);
        });
        context("path contains a submodule", () => {
            let submodule;
            let submodulePath;
            let initFile;
            beforeEach(async () => {
                submodule = await makeTempGitRepo();
                submodulePath = await (0, fs_extra_1.realpath)(submodule.path);
                initFile = (await commit("init", submodulePath)).uniqueFilename;
                await execa("git", ["submodule", "add", "--force", "--", submodulePath, "sub"], { cwd: tmpPath });
                await execa("git", ["commit", "-m", "add submodule"], { cwd: tmpPath });
            });
            afterEach(async () => {
                await submodule.cleanup();
            });
            it("should include tracked files in submodules", async () => {
                const files = await handler.getFiles({ path: tmpPath, log });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path));
                (0, chai_1.expect)(paths).to.eql([".gitmodules", (0, path_1.join)("sub", initFile)]);
            });
            it("should work if submodule is not initialized and not include any files", async () => {
                await execa("git", ["submodule", "deinit", "--all"], { cwd: tmpPath });
                const files = await handler.getFiles({ path: tmpPath, log });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path));
                (0, chai_1.expect)(paths).to.eql([".gitmodules", "sub"]);
            });
            it("should work if submodule is initialized but not updated", async () => {
                await execa("git", ["submodule", "deinit", "--all"], { cwd: tmpPath });
                await execa("git", ["submodule", "init"], { cwd: tmpPath });
                const files = await handler.getFiles({ path: tmpPath, log });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path));
                (0, chai_1.expect)(paths).to.eql([".gitmodules", "sub"]);
            });
            it("should include untracked files in submodules", async () => {
                const path = (0, path_1.join)(tmpPath, "sub", "x.txt");
                await (0, fs_extra_1.createFile)(path);
                const files = await handler.getFiles({ path: tmpPath, log });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                (0, chai_1.expect)(paths).to.eql([".gitmodules", (0, path_1.join)("sub", initFile), (0, path_1.join)("sub", "x.txt")]);
            });
            it("should respect include filter when scanning a submodule", async () => {
                const path = (0, path_1.join)(tmpPath, "sub", "x.foo");
                await (0, fs_extra_1.createFile)(path);
                const files = await handler.getFiles({ path: tmpPath, log, include: ["**/*.txt"] });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                (0, chai_1.expect)(paths).to.not.include((0, path_1.join)("sub", path));
                (0, chai_1.expect)(paths).to.include((0, path_1.join)("sub", initFile));
            });
            it("should respect exclude filter when scanning a submodule", async () => {
                const path = (0, path_1.join)(tmpPath, "sub", "x.foo");
                await (0, fs_extra_1.createFile)(path);
                const files = await handler.getFiles({ path: tmpPath, log, exclude: ["sub/*.txt"] });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                (0, chai_1.expect)(paths).to.eql([".gitmodules", (0, path_1.join)("sub", "x.foo")]);
            });
            it("should respect include filter with ./ prefix when scanning a submodule", async () => {
                const path = (0, path_1.join)(tmpPath, "sub", "x.foo");
                await (0, fs_extra_1.createFile)(path);
                const files = await handler.getFiles({ path: tmpPath, log, include: ["./sub/*.txt"] });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                (0, chai_1.expect)(paths).to.not.include((0, path_1.join)("sub", path));
                (0, chai_1.expect)(paths).to.include((0, path_1.join)("sub", initFile));
            });
            it("should include the whole submodule contents when an include directly specifies its path", async () => {
                const files = await handler.getFiles({ path: tmpPath, log, include: ["sub"] });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                (0, chai_1.expect)(paths).to.include((0, path_1.join)("sub", initFile));
            });
            it("should include a whole directory within a submodule when an include specifies its path", async () => {
                const subdirName = "subdir";
                const subdir = (0, path_1.resolve)(submodulePath, subdirName);
                await (0, fs_extra_1.mkdir)(subdir);
                const relPath = (0, path_1.join)("sub", subdirName, "foo.txt");
                const path = (0, path_1.resolve)(tmpPath, relPath);
                await (0, fs_extra_1.createFile)(path);
                await commit(relPath, submodulePath);
                const files = await handler.getFiles({ path: tmpPath, log, include: ["sub/subdir"] });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                (0, chai_1.expect)(paths).to.eql([relPath]);
            });
            it("should include the whole submodule when a surrounding include matches it", async () => {
                const files = await handler.getFiles({ path: tmpPath, log, include: ["**/*"] });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                (0, chai_1.expect)(paths).to.include((0, path_1.join)("sub", initFile));
            });
            it("gracefully skips submodule if its path doesn't exist", async () => {
                const subPath = (0, path_1.join)(tmpPath, "sub");
                await (0, fs_extra_1.remove)(subPath);
                const files = await handler.getFiles({ path: tmpPath, log });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path));
                (0, chai_1.expect)(paths).to.eql([".gitmodules"]);
            });
            it("gracefully skips submodule if its path doesn't point to a directory", async () => {
                const subPath = (0, path_1.join)(tmpPath, "sub");
                await (0, fs_extra_1.remove)(subPath);
                await (0, fs_extra_1.createFile)(subPath);
                const files = await handler.getFiles({ path: tmpPath, log });
                const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path));
                (0, chai_1.expect)(paths).to.eql([".gitmodules"]);
            });
            context("submodule contains another submodule", () => {
                let submoduleB;
                let submodulePathB;
                let initFileB;
                beforeEach(async () => {
                    submoduleB = await makeTempGitRepo();
                    submodulePathB = await (0, fs_extra_1.realpath)(submoduleB.path);
                    initFileB = (await commit("init", submodulePathB)).uniqueFilename;
                    await execa("git", ["submodule", "add", submodulePathB, "sub-b"], { cwd: (0, path_1.join)(tmpPath, "sub") });
                    await execa("git", ["commit", "-m", "add submodule"], { cwd: (0, path_1.join)(tmpPath, "sub") });
                });
                afterEach(async () => {
                    await submoduleB.cleanup();
                });
                it("should include tracked files in nested submodules", async () => {
                    const files = await handler.getFiles({ path: tmpPath, log });
                    const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                    (0, chai_1.expect)(paths).to.eql([
                        ".gitmodules",
                        (0, path_1.join)("sub", ".gitmodules"),
                        (0, path_1.join)("sub", initFile),
                        (0, path_1.join)("sub", "sub-b", initFileB),
                    ]);
                });
                it("should include untracked files in nested submodules", async () => {
                    const dir = (0, path_1.join)(tmpPath, "sub", "sub-b");
                    const path = (0, path_1.join)(dir, "x.txt");
                    await (0, fs_extra_1.createFile)(path);
                    const files = await handler.getFiles({ path: tmpPath, log });
                    const paths = files.map((f) => (0, path_1.relative)(tmpPath, f.path)).sort();
                    (0, chai_1.expect)(paths).to.eql([
                        ".gitmodules",
                        (0, path_1.join)("sub", ".gitmodules"),
                        (0, path_1.join)("sub", initFile),
                        (0, path_1.join)("sub", "sub-b", initFileB),
                        (0, path_1.join)("sub", "sub-b", "x.txt"),
                    ]);
                });
            });
        });
    });
    describe("hashObject", () => {
        it("should return the same result as `git hash-object` for a file", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            await (0, fs_extra_1.writeFile)(path, "iogjeiojgeowigjewoijoeiw");
            const stats = await (0, fs_extra_1.lstat)(path);
            const expected = await getGitHash(path);
            return new Promise((_resolve, reject) => {
                handler.hashObject(stats, path, (err, hash) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        (0, chai_1.expect)(hash).to.equal(expected);
                        _resolve();
                    }
                });
            });
        });
        it("should return the same result as `git ls-files` for a file", async () => {
            const path = (0, path_1.resolve)(tmpPath, "foo.txt");
            await (0, fs_extra_1.createFile)(path);
            await (0, fs_extra_1.writeFile)(path, "iogjeiojgeowigjewoijoeiw");
            const stats = await (0, fs_extra_1.lstat)(path);
            await git("add", path);
            const files = (await git("ls-files", "-s", path))[0];
            const expected = files.split(" ")[1];
            return new Promise((_resolve, reject) => {
                handler.hashObject(stats, path, (err, hash) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        (0, chai_1.expect)(hash).to.equal(expected);
                        _resolve();
                    }
                });
            });
        });
        it("should return the same result as `git ls-files` for a symlink", async () => {
            const filePath = (0, path_1.resolve)(tmpPath, "foo");
            const symlinkPath = (0, path_1.resolve)(tmpPath, "bar");
            await (0, fs_extra_1.createFile)(filePath);
            await (0, fs_extra_1.writeFile)(filePath, "kfgjdslgjaslj");
            await (0, fs_extra_1.symlink)("foo", symlinkPath);
            await git("add", symlinkPath);
            const stats = await (0, fs_extra_1.lstat)(symlinkPath);
            const files = (await git("ls-files", "-s", symlinkPath))[0];
            const expected = files.split(" ")[1];
            return new Promise((_resolve, reject) => {
                handler.hashObject(stats, symlinkPath, (err, hash) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        (0, chai_1.expect)(hash).to.equal(expected);
                        _resolve();
                    }
                });
            });
        });
    });
    describe("remote sources", () => {
        // Some git repo that we set as a remote source
        let tmpRepoA;
        let tmpRepoPathA;
        let repoUrl;
        // Another git repo that we add as a submodule to tmpRepoA
        let tmpRepoB;
        let tmpRepoPathB;
        // The path to which Garden clones the remote source, i.e.: `.garden/sources/modules/my-remote-module--hash`
        let clonePath;
        afterEach(async () => {
            await tmpRepoA.cleanup();
            await tmpRepoB.cleanup();
        });
        async function createRepo(repoUrlMethod, withSubmodule = false) {
            tmpRepoA = await makeTempGitRepo();
            tmpRepoPathA = await (0, fs_extra_1.realpath)(tmpRepoA.path);
            tmpRepoB = await makeTempGitRepo();
            tmpRepoPathB = await (0, fs_extra_1.realpath)(tmpRepoB.path);
            await commit("test commit B", tmpRepoPathB);
            if (withSubmodule) {
                // Add repo B as a submodule to repo A
                await execa("git", ["submodule", "add", tmpRepoPathB], { cwd: tmpRepoPathA });
                await execa("git", ["commit", "-m", "add submodule"], { cwd: tmpRepoPathA });
            }
            const { commitSHA } = await commit("test commit A", tmpRepoPathA);
            const tag = "v1";
            await createGitTag(tag, "a cool release", tmpRepoPathA);
            switch (repoUrlMethod) {
                case "commit":
                    repoUrl = `file://${tmpRepoPathA}#${commitSHA}`;
                    break;
                case "branch":
                    repoUrl = `file://${tmpRepoPathA}#main`;
                    break;
                case "tag":
                    repoUrl = `file://${tmpRepoPathA}#${tag}`;
                    break;
            }
            const hash = (0, ext_source_util_1.hashRepoUrl)(repoUrl);
            clonePath = (0, path_1.join)(tmpPath, ".garden", "sources", "module", `foo--${hash}`);
        }
        describe("ensureRemoteSource", () => {
            for (const repoUrlMethod of ["commit", "branch", "tag"]) {
                context(`from a ${repoUrlMethod}`, () => {
                    it("should clone the remote source", async () => {
                        await createRepo(repoUrlMethod);
                        await handler.ensureRemoteSource({
                            url: repoUrl,
                            name: "foo",
                            sourceType: "module",
                            log,
                        });
                        (0, chai_1.expect)(await getCommitMsg(clonePath)).to.eql("test commit A");
                    });
                    it("should return the correct remote source path for module sources", async () => {
                        await createRepo(repoUrlMethod);
                        const res = await handler.ensureRemoteSource({
                            url: repoUrl,
                            name: "foo",
                            sourceType: "module",
                            log,
                        });
                        (0, chai_1.expect)(res).to.eql(clonePath);
                    });
                    it("should return the correct remote source path for project sources", async () => {
                        await createRepo(repoUrlMethod);
                        const res = await handler.ensureRemoteSource({
                            url: repoUrl,
                            name: "foo",
                            sourceType: "project",
                            log,
                        });
                        const hash = (0, ext_source_util_1.hashRepoUrl)(repoUrl);
                        (0, chai_1.expect)(res).to.eql((0, path_1.join)(tmpPath, ".garden", "sources", "project", `foo--${hash}`));
                    });
                    it("should not error if source already cloned", async () => {
                        await createRepo(repoUrlMethod);
                        await handler.ensureRemoteSource({
                            url: repoUrl,
                            name: "foo",
                            sourceType: "module",
                            log,
                        });
                        (0, chai_1.expect)(await handler.ensureRemoteSource({
                            url: repoUrl,
                            name: "foo",
                            sourceType: "module",
                            log,
                        })).to.not.throw;
                    });
                    it("should also clone submodules", async () => {
                        await createRepo(repoUrlMethod, true);
                        await handler.ensureRemoteSource({
                            url: repoUrl,
                            name: "foo",
                            sourceType: "module",
                            log,
                        });
                        // Path to submodule inside cloned source
                        const submoduleFullPath = (0, path_1.join)(clonePath, (0, path_1.basename)(tmpRepoPathB));
                        (0, chai_1.expect)(await getCommitMsg(submoduleFullPath)).to.eql("test commit B");
                        (0, chai_1.expect)(await getCommitMsg(clonePath)).to.eql("test commit A");
                    });
                });
            }
        });
        describe("updateRemoteSource", () => {
            beforeEach(async () => await createRepo("branch"));
            it("should work for remote module sources", async () => {
                await handler.updateRemoteSource({
                    url: repoUrl,
                    name: "foo",
                    sourceType: "module",
                    log,
                });
                (0, chai_1.expect)(await getCommitMsg(clonePath)).to.eql("test commit A");
            });
            it("should work for remote project sources", async () => {
                await handler.updateRemoteSource({
                    url: repoUrl,
                    name: "foo",
                    sourceType: "project",
                    log,
                });
                const hash = (0, ext_source_util_1.hashRepoUrl)(repoUrl);
                clonePath = (0, path_1.join)(tmpPath, ".garden", "sources", "project", `foo--${hash}`);
                (0, chai_1.expect)(await getCommitMsg(clonePath)).to.eql("test commit A");
            });
            it("should update remote source", async () => {
                await handler.ensureRemoteSource({
                    url: repoUrl,
                    name: "foo",
                    sourceType: "module",
                    log,
                });
                await commit("new commit", tmpRepoPathA);
                await handler.updateRemoteSource({
                    url: repoUrl,
                    name: "foo",
                    sourceType: "module",
                    log,
                });
                (0, chai_1.expect)(await getCommitMsg(clonePath)).to.eql("new commit");
            });
            it("should exit on `failOnPrompt` when updating a remote source and prompting for user input", async () => {
                await (0, fs_extra_1.mkdirp)(clonePath);
                await execa("git", ["init", "--initial-branch=main"], { cwd: clonePath });
                await execa("git", ["commit", "-m", "commit", "--allow-empty"], { cwd: clonePath });
                await execa("git", ["remote", "add", "origin", "https://fake@github.com/private/private.git"], {
                    cwd: clonePath,
                });
                let error;
                try {
                    await handler.updateRemoteSource({
                        url: repoUrl,
                        name: "foo",
                        sourceType: "module",
                        log,
                        failOnPrompt: true,
                    });
                }
                catch (e) {
                    error = e;
                }
                (0, chai_1.expect)(error).to.be.instanceOf(Error);
                (0, chai_1.expect)(error === null || error === void 0 ? void 0 : error.message).to.contain("Invalid username or password.");
            });
            it("should update submodules", async () => {
                // Add repo B as a submodule to repo A
                await execa("git", ["submodule", "add", tmpRepoPathB], { cwd: tmpRepoPathA });
                await execa("git", ["commit", "-m", "add submodule"], { cwd: tmpRepoPathA });
                await handler.ensureRemoteSource({
                    url: repoUrl,
                    name: "foo",
                    sourceType: "module",
                    log,
                });
                // Update repo B
                await commit("update repo B", tmpRepoPathB);
                // Update submodule in repo A
                await execa("git", ["submodule", "update", "--recursive", "--remote"], { cwd: tmpRepoPathA });
                await execa("git", ["add", "."], { cwd: tmpRepoPathA });
                await execa("git", ["commit", "-m", "update submodules"], { cwd: tmpRepoPathA });
                await handler.updateRemoteSource({
                    url: repoUrl,
                    name: "foo",
                    sourceType: "module",
                    log,
                });
                // Path to submodule inside cloned source
                const submoduleFullPath = (0, path_1.join)(clonePath, (0, path_1.basename)(tmpRepoPathB));
                (0, chai_1.expect)(await getCommitMsg(submoduleFullPath)).to.eql("update repo B");
                (0, chai_1.expect)(await getCommitMsg(clonePath)).to.eql("update submodules");
                // Update repo A again to test that we can successfully update the clone after updating submodules
                await commit("update repo A again", tmpRepoPathA);
                await handler.updateRemoteSource({
                    url: repoUrl,
                    name: "foo",
                    sourceType: "module",
                    log,
                });
                (0, chai_1.expect)(await getCommitMsg(clonePath)).to.eql("update repo A again");
            });
        });
    });
});
describe("git", () => {
    describe("getCommitIdFromRefList", () => {
        it("should get the commit id from a list of commit ids and refs", () => {
            const refList = ["abcde	ref/heads/main", "1234	ref/heads/main", "foobar	ref/heads/main"];
            (0, chai_1.expect)((0, git_1.getCommitIdFromRefList)(refList)).to.equal("abcde");
        });
        it("should get the commit id from a list of commit ids without refs", () => {
            const refList = ["abcde", "1234	ref/heads/main", "foobar	ref/heads/main"];
            (0, chai_1.expect)((0, git_1.getCommitIdFromRefList)(refList)).to.equal("abcde");
        });
        it("should get the commit id from a single commit id / ref pair", () => {
            const refList = ["abcde	ref/heads/main"];
            (0, chai_1.expect)((0, git_1.getCommitIdFromRefList)(refList)).to.equal("abcde");
        });
        it("should get the commit id from single commit id without a ref", () => {
            const refList = ["abcde"];
            (0, chai_1.expect)((0, git_1.getCommitIdFromRefList)(refList)).to.equal("abcde");
        });
    });
    describe("parseGitUrl", () => {
        it("should return the url part and the hash part from a github url", () => {
            const url = "https://github.com/org/repo.git#branch";
            (0, chai_1.expect)((0, git_1.parseGitUrl)(url)).to.eql({ repositoryUrl: "https://github.com/org/repo.git", hash: "branch" });
        });
        it("should throw a configuration error if the hash part is missing", async () => {
            const url = "https://github.com/org/repo.git";
            await (0, helpers_1.expectError)(() => (0, git_1.parseGitUrl)(url), "configuration");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQStCO0FBQy9CLCtCQUE2QjtBQUM3Qiw4REFBNkI7QUFDN0IsdUNBQWdIO0FBQ2hILCtCQUF3RDtBQUV4RCw4Q0FBMkU7QUFDM0UsaURBQXlGO0FBRXpGLDBFQUFrRTtBQUNsRSx3REFBb0Q7QUFDcEQsb0RBQWtEO0FBRWxELGdFQUFnRTtBQUNoRSxNQUFNLHFCQUFxQixHQUFHLGFBQWEsQ0FBQTtBQUUzQyxLQUFLLFVBQVUsWUFBWSxDQUFDLFFBQWdCO0lBQzFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFBO0lBQ3hGLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDOUIsQ0FBQztBQUVELEtBQUssVUFBVSxNQUFNLENBQUMsR0FBVyxFQUFFLFFBQWdCO0lBQ2pELCtDQUErQztJQUMvQyxNQUFNLGNBQWMsR0FBRyxHQUFHLElBQUEsYUFBTSxHQUFFLE1BQU0sQ0FBQTtJQUN4QyxNQUFNLFFBQVEsR0FBRyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUE7SUFDL0MsTUFBTSxJQUFBLHFCQUFVLEVBQUMsUUFBUSxDQUFDLENBQUE7SUFDMUIsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDeEQsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxF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