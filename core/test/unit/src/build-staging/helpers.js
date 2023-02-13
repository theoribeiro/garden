"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const helpers_1 = require("../../../../src/build-staging/helpers");
const fs_1 = require("../../../../src/util/fs");
const fs_extra_1 = require("fs-extra");
const chai_1 = require("chai");
const helpers_2 = require("../../../helpers");
const util_1 = require("../../../../src/util/util");
const lodash_1 = require("lodash");
describe("build staging helpers", () => {
    let statsHelper;
    let tmpDir;
    let tmpPath;
    beforeEach(async () => {
        statsHelper = new helpers_1.FileStatsHelper();
        tmpDir = await (0, fs_1.makeTempDir)();
        tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
    });
    afterEach(async () => {
        await (tmpDir === null || tmpDir === void 0 ? void 0 : tmpDir.cleanup());
    });
    async function readFileStr(path) {
        const buf = await (0, fs_extra_1.readFile)(path);
        return buf.toString();
    }
    describe("cloneFile", () => {
        it("clones a file", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            const res = await (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false });
            const data = await readFileStr(b);
            (0, chai_1.expect)(res.skipped).to.be.false;
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("removes existing directory at target if allowDelete=true", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, fs_extra_1.mkdir)(b);
            const res = await (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: true });
            const data = await readFileStr(b);
            (0, chai_1.expect)(res.skipped).to.be.false;
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("throws if a directory exists at target and allowDelete=false", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, fs_extra_1.mkdir)(b);
            await (0, helpers_2.expectError)(() => (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false }), {
                contains: `Build staging: Failed copying file ${a} to ${b} because a directory exists at the target path`,
            });
        });
        it("preserves mtime from source at target", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, util_1.sleep)(100);
            await (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false });
            const statA = await statsHelper.extendedStat({ path: a });
            const statB = await statsHelper.extendedStat({ path: b });
            (0, chai_1.expect)((0, lodash_1.round)(statA === null || statA === void 0 ? void 0 : statA.mtimeMs, 2)).to.equal((0, lodash_1.round)(statB === null || statB === void 0 ? void 0 : statB.mtimeMs, 2));
        });
        it("skips if file at target exists and has same mtime and size", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false });
            const res = await (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false });
            (0, chai_1.expect)(res.skipped).to.be.true;
        });
        it("ensures the target directory for the file exists", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "subdir", "b");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false });
            const data = await readFileStr(b);
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("resolves a symlink before copying", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            const c = (0, path_1.join)(tmpPath, "c");
            await (0, fs_extra_1.writeFile)(a, "foo");
            await (0, fs_extra_1.symlink)("a", b);
            const res = await (0, helpers_1.cloneFileAsync)({ from: b, to: c, statsHelper, allowDelete: false });
            const data = await readFileStr(c);
            (0, chai_1.expect)(res.skipped).to.be.false;
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("clones a file that's within a symlinked directory", async () => {
            const dirLink = (0, path_1.join)(tmpPath, "dir-link");
            const dir = (0, path_1.join)(tmpPath, "dir");
            const a = (0, path_1.join)(dirLink, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.ensureDir)(dir);
            await (0, fs_extra_1.symlink)("dir", dirLink);
            await (0, fs_extra_1.writeFile)(a, "foo");
            const res = await (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false });
            const data = await readFileStr(b);
            (0, chai_1.expect)(res.skipped).to.be.false;
            (0, chai_1.expect)(data).to.equal("foo");
        });
        it("throws if attempting to clone a directory", async () => {
            const a = (0, path_1.join)(tmpPath, "a");
            const b = (0, path_1.join)(tmpPath, "b");
            await (0, fs_extra_1.ensureDir)(a);
            await (0, helpers_2.expectError)(() => (0, helpers_1.cloneFileAsync)({ from: a, to: b, statsHelper, allowDelete: false }), {
                contains: `Attempted to copy non-file ${a}`,
            });
        });
    });
    describe("scanDirectoryForClone", () => {
        function sortFiles(paths) {
            return (0, lodash_1.sortBy)(paths, (p) => p.join(":"));
        }
        it("returns all files in a directory when no pattern is set", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "c"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "d"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath);
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["a", "a"],
                ["dir-a/b", "dir-a/b"],
                ["dir-a/c", "dir-a/c"],
                ["dir-b/d", "dir-b/d"],
            ]);
        });
        it("matches a single directory", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "c"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "d"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "dir-a");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["dir-a/b", "dir-a/b"],
                ["dir-a/c", "dir-a/c"],
            ]);
        });
        it("matches multiple directories", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "c"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "d"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "dir-*");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["dir-a/b", "dir-a/b"],
                ["dir-a/c", "dir-a/c"],
                ["dir-b/d", "dir-b/d"],
            ]);
        });
        it("matches a set of files in root", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-c"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "file-d"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "file-e"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "file-*");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["file-a", "file-a"],
                ["file-b", "file-b"],
                ["file-c", "file-c"],
            ]);
        });
        it("matches files across all directories and maps to root", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "nope"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "file-d"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "file-e"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "**/file-*");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["dir-a/file-d", "file-d"],
                ["dir-b/file-e", "file-e"],
                ["file-a", "file-a"],
                ["file-b", "file-b"],
            ]);
        });
        it("matches files in multiple directories and maps to root", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-c"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "file-d"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "nope"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "file-e"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "dir-*/file-*");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["dir-a/file-d", "file-d"],
                ["dir-b/file-e", "file-e"],
            ]);
        });
        it("matches everything with a wildcard", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-c"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "file-d"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "file-e"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "*");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["dir-a/file-d", "dir-a/file-d"],
                ["dir-b/file-e", "dir-b/file-e"],
                ["file-a", "file-a"],
                ["file-b", "file-b"],
                ["file-c", "file-c"],
            ]);
        });
        it("matches and maps some subdirectories", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "subdir", "file-d"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-b", "subdir", "file-e"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "*/subdir");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["dir-a/subdir/file-d", "subdir/file-d"],
                ["dir-b/subdir/file-e", "subdir/file-e"],
            ]);
        });
        it("matches files within symlinked directories, mapping source path to link source", async () => {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "file-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "file-b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "dir-a", "file-c"));
            await (0, fs_extra_1.symlink)("dir-a", (0, path_1.join)(tmpPath, "link-a"));
            const res = await (0, helpers_1.scanDirectoryForClone)(tmpPath, "link-a/*");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["link-a/file-b", "file-b"],
                ["link-a/file-c", "file-c"],
            ]);
        });
        // TODO
        it.skip("ignores symlinks that point outside the root", async () => {
            const rootPath = (0, path_1.join)(tmpPath, "root");
            const outside = (0, path_1.join)(tmpPath, "outside");
            await (0, fs_extra_1.ensureDir)(rootPath);
            await (0, fs_extra_1.ensureDir)(outside);
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(tmpPath, "linked-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(rootPath, "file-a"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(rootPath, "file-b"));
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(outside, "file-c"));
            await (0, fs_extra_1.symlink)("../linked-a", (0, path_1.join)(rootPath, "link-a"));
            await (0, fs_extra_1.symlink)("../outside", (0, path_1.join)(rootPath, "link-b"));
            const res = await (0, helpers_1.scanDirectoryForClone)(rootPath, "*");
            (0, chai_1.expect)(sortFiles(res)).to.eql([
                ["file-a", "file-a"],
                ["file-b", "file-b"],
            ]);
        });
    });
    describe("FileStatsHelper", () => {
        describe("lstat", () => {
            it("stats a path", (done) => {
                statsHelper.lstat(tmpPath, (err, stats) => {
                    (0, chai_1.expect)(stats === null || stats === void 0 ? void 0 : stats.isDirectory()).to.be.true;
                    done(err);
                });
            });
            it("caches the stats for a path", (done) => {
                statsHelper.lstat(tmpPath, (err, stats) => {
                    (0, chai_1.expect)(statsHelper["lstatCache"][tmpPath]).to.equal(stats);
                    done(err);
                });
            });
        });
        describe("extendedStat", () => {
            it("resolves a simple file path", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                await (0, fs_extra_1.writeFile)(a, "foo");
                const stat = await statsHelper.extendedStat({ path: a });
                (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.path).to.equal(a);
                (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.isFile()).to.be.true;
            });
            it("resolves a symlink", async () => {
                var _a, _b;
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                await (0, fs_extra_1.writeFile)(a, "foo");
                await (0, fs_extra_1.symlink)("a", b);
                const stat = await statsHelper.extendedStat({ path: b });
                (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.path).to.equal(b);
                (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.isSymbolicLink()).to.be.true;
                (0, chai_1.expect)((_a = stat === null || stat === void 0 ? void 0 : stat.target) === null || _a === void 0 ? void 0 : _a.path).to.equal(a);
                (0, chai_1.expect)((_b = stat === null || stat === void 0 ? void 0 : stat.target) === null || _b === void 0 ? void 0 : _b.isFile()).to.be.true;
            });
            it("resolves a simple directory path", async () => {
                const stat = await statsHelper.extendedStat({ path: tmpPath });
                (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.path).to.equal(tmpPath);
                (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.isDirectory()).to.be.true;
            });
            it("caches the resolved path", async () => {
                const stats = await statsHelper.extendedStat({ path: tmpPath });
                (0, chai_1.expect)(statsHelper["extendedStatCache"][tmpPath]).to.equal(stats);
            });
            it("returns null if path cannot be found", async () => {
                const a = (0, path_1.join)(tmpPath, "foo");
                const stat = await statsHelper.extendedStat({ path: a });
                (0, chai_1.expect)(stat).to.equal(null);
            });
            it("throws if given a relative path", async () => {
                return (0, helpers_2.expectError)(() => statsHelper.extendedStat({ path: "foo" }), {
                    contains: "Must specify absolute path (got foo)",
                });
            });
            context("with callback", () => {
                it("resolves a simple directory path", (done) => {
                    statsHelper.extendedStat({ path: tmpPath }, (err, stat) => {
                        (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.path).to.equal(tmpPath);
                        (0, chai_1.expect)(stat === null || stat === void 0 ? void 0 : stat.isDirectory()).to.be.true;
                        done(err);
                    });
                });
                it("caches the resolved path", (done) => {
                    statsHelper.extendedStat({ path: tmpPath }, (err, stats) => {
                        (0, chai_1.expect)(statsHelper["extendedStatCache"][tmpPath]).to.equal(stats);
                        done(err);
                    });
                });
                it("returns null if path cannot be found", (done) => {
                    const a = (0, path_1.join)(tmpPath, "foo");
                    statsHelper.extendedStat({ path: a }, (err, stat) => {
                        (0, chai_1.expect)(stat).to.equal(null);
                        done(err);
                    });
                });
            });
        });
        describe("resolveSymlink", () => {
            // A promisified version to simplify tests
            async function resolveSymlink(params) {
                return new Promise((resolve, reject) => {
                    statsHelper.resolveSymlink(params, (err, target) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(target);
                        }
                    });
                });
            }
            it("resolves a simple symlink", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                await (0, fs_extra_1.writeFile)(a, "foo");
                await (0, fs_extra_1.symlink)("a", b);
                const res = await resolveSymlink({ path: b });
                (0, chai_1.expect)(res === null || res === void 0 ? void 0 : res.path).to.equal(a);
            });
            it("resolves a symlink recursively", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                const c = (0, path_1.join)(tmpPath, "c");
                await (0, fs_extra_1.writeFile)(a, "foo");
                await (0, fs_extra_1.symlink)("a", b);
                await (0, fs_extra_1.symlink)("b", c);
                const res = await resolveSymlink({ path: c });
                (0, chai_1.expect)(res === null || res === void 0 ? void 0 : res.path).to.equal(a);
            });
            it("returns null for an absolute symlink", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                await (0, fs_extra_1.writeFile)(a, "foo");
                await (0, fs_extra_1.symlink)(a, b); // <- absolute link
                const res = await resolveSymlink({ path: b });
                (0, chai_1.expect)(res).to.equal(null);
            });
            it("returns null for a recursive absolute symlink", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                const c = (0, path_1.join)(tmpPath, "c");
                await (0, fs_extra_1.writeFile)(a, "foo");
                await (0, fs_extra_1.symlink)(a, b); // <- absolute link
                await (0, fs_extra_1.symlink)("b", c);
                const res = await resolveSymlink({ path: c });
                (0, chai_1.expect)(res).to.equal(null);
            });
            it("resolves an absolute symlink if allowAbsolute=true", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                await (0, fs_extra_1.writeFile)(a, "foo");
                await (0, fs_extra_1.symlink)(a, b); // <- absolute link
                const res = await resolveSymlink({ path: b, allowAbsolute: true });
                (0, chai_1.expect)(res === null || res === void 0 ? void 0 : res.path).to.equal(a);
            });
            it("throws if a relative path is given", async () => {
                return (0, helpers_2.expectError)(() => resolveSymlink({ path: "foo" }), { contains: "Must specify absolute path (got foo)" });
            });
            it("throws if a path to a non-symlink (e.g. directory) is given", async () => {
                return (0, helpers_2.expectError)(() => resolveSymlink({ path: tmpPath }), {
                    contains: `Error reading symlink: EINVAL: invalid argument, readlink '${tmpPath}'`,
                });
            });
            it("returns null if resolving a circular symlink", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                await (0, fs_extra_1.symlink)("a", b);
                await (0, fs_extra_1.symlink)("b", a);
                const res = await resolveSymlink({ path: b });
                (0, chai_1.expect)(res).to.equal(null);
            });
            it("returns null if resolving a two-step circular symlink", async () => {
                const a = (0, path_1.join)(tmpPath, "a");
                const b = (0, path_1.join)(tmpPath, "b");
                const c = (0, path_1.join)(tmpPath, "c");
                await (0, fs_extra_1.symlink)("c", a);
                await (0, fs_extra_1.symlink)("a", b);
                await (0, fs_extra_1.symlink)("b", c);
                const res = await resolveSymlink({ path: c });
                (0, chai_1.expect)(res).to.equal(null);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBMkI7QUFDM0IsbUVBTzhDO0FBQzlDLGdEQUFvRTtBQUNwRSx1Q0FBK0Y7QUFDL0YsK0JBQTZCO0FBQzdCLDhDQUE4QztBQUM5QyxvREFBaUQ7QUFDakQsbUNBQXNDO0FBRXRDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxXQUE0QixDQUFBO0lBQ2hDLElBQUksTUFBcUIsQ0FBQTtJQUN6QixJQUFJLE9BQWUsQ0FBQTtJQUVuQixVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDcEIsV0FBVyxHQUFHLElBQUkseUJBQWUsRUFBRSxDQUFBO1FBQ25DLE1BQU0sR0FBRyxNQUFNLElBQUEsZ0JBQVcsR0FBRSxDQUFBO1FBQzVCLE9BQU8sR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdkMsQ0FBQyxDQUFDLENBQUE7SUFFRixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxDQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxPQUFPLEVBQUUsQ0FBQSxDQUFBO0lBQ3pCLENBQUMsQ0FBQyxDQUFBO0lBRUYsS0FBSyxVQUFVLFdBQVcsQ0FBQyxJQUFZO1FBQ3JDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSxtQkFBUSxFQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2hDLE9BQU8sR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUN6QixFQUFFLENBQUMsZUFBZSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3pCLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtZQUNyRixNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNqQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7WUFDL0IsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM5QixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQywwREFBMEQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN4RSxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQzVCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN6QixNQUFNLElBQUEsZ0JBQUssRUFBQyxDQUFDLENBQUMsQ0FBQTtZQUNkLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtZQUNwRixNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNqQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7WUFDL0IsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM5QixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RSxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQzVCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN6QixNQUFNLElBQUEsZ0JBQUssRUFBQyxDQUFDLENBQUMsQ0FBQTtZQUVkLE1BQU0sSUFBQSxxQkFBVyxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsd0JBQWMsRUFBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7Z0JBQzNGLFFBQVEsRUFBRSxzQ0FBc0MsQ0FBQyxPQUFPLENBQUMsZ0RBQWdEO2FBQzFHLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JELE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3pCLE1BQU0sSUFBQSxZQUFLLEVBQUMsR0FBRyxDQUFDLENBQUE7WUFFaEIsTUFBTSxJQUFBLHdCQUFjLEVBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBRXpFLE1BQU0sS0FBSyxHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ3pELE1BQU0sS0FBSyxHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBRXpELElBQUEsYUFBTSxFQUFDLElBQUEsY0FBSyxFQUFDLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxPQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBSyxFQUFDLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxPQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN2RSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw0REFBNEQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxRSxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQzVCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUV6QixNQUFNLElBQUEsd0JBQWMsRUFBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFekUsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBQ3JGLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtRQUNoQyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRSxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUN0QyxNQUFNLElBQUEsb0JBQVMsRUFBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFFekIsTUFBTSxJQUFBLHdCQUFjLEVBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBRXpFLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2pDLElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDOUIsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsbUNBQW1DLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakQsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3pCLE1BQU0sSUFBQSxrQkFBTyxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUNyQixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFDckYsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDakMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO1lBQy9CLElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDOUIsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakUsTUFBTSxPQUFPLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sR0FBRyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUNoQyxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRTVCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3BCLE1BQU0sSUFBQSxrQkFBTyxFQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUM3QixNQUFNLElBQUEsb0JBQVMsRUFBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFFekIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBQ3JGLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2pDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtZQUMvQixJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzlCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDJDQUEyQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pELE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUE7WUFFbEIsTUFBTSxJQUFBLHFCQUFXLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSx3QkFBYyxFQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtnQkFDM0YsUUFBUSxFQUFFLDhCQUE4QixDQUFDLEVBQUU7YUFDNUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsU0FBUyxTQUFTLENBQUMsS0FBa0I7WUFDbkMsT0FBTyxJQUFBLGVBQU0sRUFBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUMxQyxDQUFDO1FBRUQsRUFBRSxDQUFDLHlEQUF5RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZFLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ3BDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUM3QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDN0MsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBRTdDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSwrQkFBcUIsRUFBQyxPQUFPLENBQUMsQ0FBQTtZQUVoRCxJQUFBLGFBQU0sRUFBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUM1QixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ1YsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO2dCQUN0QixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7Z0JBQ3RCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQzthQUN2QixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxQyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNwQyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDN0MsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQzdDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUU3QyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsK0JBQXFCLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBRXpELElBQUEsYUFBTSxFQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQzVCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztnQkFDdEIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO2FBQ3ZCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDhCQUE4QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ3BDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUM3QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDN0MsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBRTdDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSwrQkFBcUIsRUFBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFFekQsSUFBQSxhQUFNLEVBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDNUIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO2dCQUN0QixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7Z0JBQ3RCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQzthQUN2QixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUN6QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUN6QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUN6QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDbEQsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBRWxELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSwrQkFBcUIsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFFMUQsSUFBQSxhQUFNLEVBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDNUIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO2dCQUNwQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7Z0JBQ3BCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQzthQUNyQixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyRSxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUN6QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUN6QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQTtZQUN2QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDbEQsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBRWxELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSwrQkFBcUIsRUFBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUE7WUFFN0QsSUFBQSxhQUFNLEVBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDNUIsQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDO2dCQUMxQixDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUM7Z0JBQzFCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztnQkFDcEIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO2FBQ3JCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHdEQUF3RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RFLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUNsRCxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUE7WUFDaEQsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBRWxELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSwrQkFBcUIsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUE7WUFFaEUsSUFBQSxhQUFNLEVBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDNUIsQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDO2dCQUMxQixDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUM7YUFDM0IsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEQsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDekMsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDekMsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDekMsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBQ2xELE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUVsRCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsK0JBQXFCLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRXJELElBQUEsYUFBTSxFQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQzVCLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQztnQkFDaEMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDO2dCQUNoQyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7Z0JBQ3BCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztnQkFDcEIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO2FBQ3JCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BELE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDNUQsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUU1RCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsK0JBQXFCLEVBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBRTVELElBQUEsYUFBTSxFQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQzVCLENBQUMscUJBQXFCLEVBQUUsZUFBZSxDQUFDO2dCQUN4QyxDQUFDLHFCQUFxQixFQUFFLGVBQWUsQ0FBQzthQUN6QyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxnRkFBZ0YsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5RixNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUN6QyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDbEQsTUFBTSxJQUFBLHFCQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBQ2xELE1BQU0sSUFBQSxrQkFBTyxFQUFDLE9BQU8sRUFBRSxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUUvQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsK0JBQXFCLEVBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBRTVELElBQUEsYUFBTSxFQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQzVCLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQztnQkFDM0IsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDO2FBQzVCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTztRQUNQLEVBQUUsQ0FBQyxJQUFJLENBQUMsOENBQThDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakUsTUFBTSxRQUFRLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3RDLE1BQU0sT0FBTyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtZQUN4QyxNQUFNLElBQUEsb0JBQVMsRUFBQyxRQUFRLENBQUMsQ0FBQTtZQUN6QixNQUFNLElBQUEsb0JBQVMsRUFBQyxPQUFPLENBQUMsQ0FBQTtZQUN4QixNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTtZQUMzQyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUMxQyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUMxQyxNQUFNLElBQUEscUJBQVUsRUFBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUN6QyxNQUFNLElBQUEsa0JBQU8sRUFBQyxhQUFhLEVBQUUsSUFBQSxXQUFJLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7WUFDdEQsTUFBTSxJQUFBLGtCQUFPLEVBQUMsWUFBWSxFQUFFLElBQUEsV0FBSSxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBRXJELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSwrQkFBcUIsRUFBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFFdEQsSUFBQSxhQUFNLEVBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDNUIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO2dCQUNwQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7YUFDckIsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDckIsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUMxQixXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtvQkFDeEMsSUFBQSxhQUFNLEVBQUMsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7b0JBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDWCxDQUFDLENBQUMsQ0FBQTtZQUNKLENBQUMsQ0FBQyxDQUFBO1lBRUYsRUFBRSxDQUFDLDZCQUE2QixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3pDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO29CQUN4QyxJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO29CQUMxRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ1gsQ0FBQyxDQUFDLENBQUE7WUFDSixDQUFDLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFDNUIsRUFBRSxDQUFDLDZCQUE2QixFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUMzQyxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQ3hELElBQUEsYUFBTSxFQUFDLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUM5QixJQUFBLGFBQU0sRUFBQyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtZQUNuQyxDQUFDLENBQUMsQ0FBQTtZQUVGLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLElBQUksRUFBRTs7Z0JBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1QixNQUFNLElBQUEsb0JBQVMsRUFBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7Z0JBQ3pCLE1BQU0sSUFBQSxrQkFBTyxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtnQkFDckIsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQ3hELElBQUEsYUFBTSxFQUFDLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUM5QixJQUFBLGFBQU0sRUFBQyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtnQkFDekMsSUFBQSxhQUFNLEVBQUMsTUFBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsTUFBTSwwQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUN0QyxJQUFBLGFBQU0sRUFBQyxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxNQUFNLDBDQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7WUFDM0MsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hELE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO2dCQUM5RCxJQUFBLGFBQU0sRUFBQyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDcEMsSUFBQSxhQUFNLEVBQUMsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7WUFDeEMsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3hDLE1BQU0sS0FBSyxHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO2dCQUMvRCxJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbkUsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3BELE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDOUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQ3hELElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDN0IsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQy9DLE9BQU8sSUFBQSxxQkFBVyxFQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtvQkFDbEUsUUFBUSxFQUFFLHNDQUFzQztpQkFDakQsQ0FBQyxDQUFBO1lBQ0osQ0FBQyxDQUFDLENBQUE7WUFFRixPQUFPLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtnQkFDNUIsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7b0JBQzlDLFdBQVcsQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7d0JBQ3hELElBQUEsYUFBTSxFQUFDLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO3dCQUNwQyxJQUFBLGFBQU0sRUFBQyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTt3QkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO29CQUNYLENBQUMsQ0FBQyxDQUFBO2dCQUNKLENBQUMsQ0FBQyxDQUFBO2dCQUVGLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO29CQUN0QyxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO3dCQUN6RCxJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQ2pFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQkFDWCxDQUFDLENBQUMsQ0FBQTtnQkFDSixDQUFDLENBQUMsQ0FBQTtnQkFFRixFQUFFLENBQUMsc0NBQXNDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtvQkFDbEQsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFBO29CQUM5QixXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO3dCQUNsRCxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO3dCQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBQ1gsQ0FBQyxDQUFDLENBQUE7Z0JBQ0osQ0FBQyxDQUFDLENBQUE7WUFDSixDQUFDLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUM5QiwwQ0FBMEM7WUFDMUMsS0FBSyxVQUFVLGNBQWMsQ0FBQyxNQUE0QjtnQkFDeEQsT0FBTyxJQUFJLE9BQU8sQ0FBdUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQzNELFdBQVcsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFO3dCQUNqRCxJQUFJLEdBQUcsRUFBRTs0QkFDUCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7eUJBQ1o7NkJBQU07NEJBQ0wsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO3lCQUNoQjtvQkFDSCxDQUFDLENBQUMsQ0FBQTtnQkFDSixDQUFDLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFFRCxFQUFFLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3pDLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1QixNQUFNLElBQUEsb0JBQVMsRUFBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7Z0JBQ3pCLE1BQU0sSUFBQSxrQkFBTyxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtnQkFDckIsTUFBTSxHQUFHLEdBQUcsTUFBTSxjQUFjLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDN0MsSUFBQSxhQUFNLEVBQUMsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDL0IsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsZ0NBQWdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzlDLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDekIsTUFBTSxJQUFBLGtCQUFPLEVBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUNyQixNQUFNLElBQUEsa0JBQU8sRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ3JCLE1BQU0sR0FBRyxHQUFHLE1BQU0sY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQzdDLElBQUEsYUFBTSxFQUFDLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQy9CLENBQUMsQ0FBQyxDQUFBO1lBRUYsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNwRCxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxJQUFBLG9CQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO2dCQUN6QixNQUFNLElBQUEsa0JBQU8sRUFBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUEsQ0FBQyxtQkFBbUI7Z0JBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQzdDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDNUIsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsK0NBQStDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzdELE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVCLE1BQU0sSUFBQSxvQkFBUyxFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDekIsTUFBTSxJQUFBLGtCQUFPLEVBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBLENBQUMsbUJBQW1CO2dCQUN2QyxNQUFNLElBQUEsa0JBQU8sRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ3JCLE1BQU0sR0FBRyxHQUFHLE1BQU0sY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQzdDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDNUIsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsb0RBQW9ELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ2xFLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1QixNQUFNLElBQUEsb0JBQVMsRUFBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7Z0JBQ3pCLE1BQU0sSUFBQSxrQkFBTyxFQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQSxDQUFDLG1CQUFtQjtnQkFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxjQUFjLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO2dCQUNsRSxJQUFBLGFBQU0sRUFBQyxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUMvQixDQUFDLENBQUMsQ0FBQTtZQUVGLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDbEQsT0FBTyxJQUFBLHFCQUFXLEVBQUMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsc0NBQXNDLEVBQUUsQ0FBQyxDQUFBO1lBQ2pILENBQUMsQ0FBQyxDQUFBO1lBRUYsRUFBRSxDQUFDLDZEQUE2RCxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUMzRSxPQUFPLElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRTtvQkFDMUQsUUFBUSxFQUFFLDhEQUE4RCxPQUFPLEdBQUc7aUJBQ25GLENBQUMsQ0FBQTtZQUNKLENBQUMsQ0FBQyxDQUFBO1lBRUYsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUM1RCxNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxJQUFBLGtCQUFPLEVBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUNyQixNQUFNLElBQUEsa0JBQU8sRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ3JCLE1BQU0sR0FBRyxHQUFHLE1BQU0sY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQzdDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDNUIsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsdURBQXVELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3JFLE1BQU0sQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVCLE1BQU0sSUFBQSxrQkFBTyxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtnQkFDckIsTUFBTSxJQUFBLGtCQUFPLEVBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUNyQixNQUFNLElBQUEsa0JBQU8sRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ3JCLE1BQU0sR0FBRyxHQUFHLE1BQU0sY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQzdDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDNUIsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==