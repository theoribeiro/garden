"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = require("path");
const helpers_1 = require("../../../helpers");
const fs_1 = require("../../../../src/util/fs");
const tmp_promise_1 = require("tmp-promise");
describe("detectModuleOverlap", () => {
    const projectRoot = (0, path_1.join)("/", "user", "code");
    const gardenDirPath = (0, path_1.join)(projectRoot, ".garden");
    it("should detect if modules have the same root", () => {
        const moduleA = {
            name: "module-a",
            path: (0, path_1.join)(projectRoot, "foo"),
        };
        const moduleB = {
            name: "module-b",
            path: (0, path_1.join)(projectRoot, "foo"),
        };
        const moduleC = {
            name: "module-c",
            path: (0, path_1.join)(projectRoot, "foo"),
        };
        const moduleD = {
            name: "module-d",
            path: (0, path_1.join)(projectRoot, "bas"),
        };
        (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB, moduleC, moduleD] })).to.eql([
            {
                module: moduleA,
                overlaps: [moduleB, moduleC],
            },
            {
                module: moduleB,
                overlaps: [moduleA, moduleC],
            },
            {
                module: moduleC,
                overlaps: [moduleA, moduleB],
            },
        ]);
    });
    it("should detect if a module has another module in its path", () => {
        const moduleA = {
            name: "module-a",
            path: (0, path_1.join)(projectRoot, "foo"),
        };
        const moduleB = {
            name: "module-b",
            path: (0, path_1.join)(projectRoot, "foo", "bar"),
        };
        const moduleC = {
            name: "module-c",
            path: (0, path_1.join)(projectRoot, "foo", "bar", "bas"),
        };
        const moduleD = {
            name: "module-d",
            path: (0, path_1.join)(projectRoot, "bas", "bar", "bas"),
        };
        (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB, moduleC, moduleD] })).to.eql([
            {
                module: moduleA,
                overlaps: [moduleB, moduleC],
            },
            {
                module: moduleB,
                overlaps: [moduleC],
            },
        ]);
    });
    context("same root", () => {
        it("should ignore modules that set includes", () => {
            const moduleA = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
                include: [""],
            };
            const moduleB = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo"),
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB] })).to.eql([
                {
                    module: moduleB,
                    overlaps: [moduleA],
                },
            ]);
        });
        it("should ignore modules that set excludes", () => {
            const moduleA = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
                exclude: [""],
            };
            const moduleB = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo"),
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB] })).to.eql([
                {
                    module: moduleB,
                    overlaps: [moduleA],
                },
            ]);
        });
        it("should ignore modules that are disabled", () => {
            const moduleA = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
                disabled: true,
            };
            const moduleB = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo"),
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB] })).to.be.empty;
        });
    });
    context("nested modules", () => {
        it("should ignore modules that set includes", () => {
            const moduleA = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
                include: [""],
            };
            const moduleB = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo", "bar"),
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB] })).to.be.empty;
        });
        it("should ignore modules that set excludes", () => {
            const moduleA = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
                exclude: [""],
            };
            const moduleB = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo", "bar"),
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB] })).to.be.empty;
        });
        it("should ignore modules that are disabled", () => {
            const moduleA = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
                disabled: true,
            };
            const moduleB = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo", "bar"),
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA, moduleB] })).to.be.empty;
        });
        it("should detect overlaps if only nested module has includes/excludes", () => {
            const moduleA1 = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
            };
            const moduleB1 = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo", "bar"),
                include: [""],
            };
            const moduleA2 = {
                name: "module-a",
                path: (0, path_1.join)(projectRoot, "foo"),
            };
            const moduleB2 = {
                name: "module-b",
                path: (0, path_1.join)(projectRoot, "foo", "bar"),
                exclude: [""],
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA1, moduleB1] })).to.eql([
                {
                    module: moduleA1,
                    overlaps: [moduleB1],
                },
            ]);
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleA2, moduleB2] })).to.eql([
                {
                    module: moduleA2,
                    overlaps: [moduleB2],
                },
            ]);
        });
        it("should not consider remote source modules to overlap with module in project root", () => {
            const remoteModule = {
                name: "remote-module",
                path: (0, path_1.join)(gardenDirPath, "sources", "foo", "bar"),
            };
            const moduleFoo = {
                name: "module-foo",
                path: (0, path_1.join)(projectRoot, "foo"),
                include: [""],
            };
            (0, chai_1.expect)((0, fs_1.detectModuleOverlap)({ projectRoot, gardenDirPath, moduleConfigs: [moduleFoo, remoteModule] })).to.eql([]);
        });
    });
});
describe("scanDirectory", () => {
    it("should iterate through all files in a directory", async () => {
        const testPath = (0, helpers_1.getDataDir)("scanDirectory");
        let count = 0;
        const expectedPaths = ["1", "2", "3", "subdir", "subdir/4"].map((f) => (0, path_1.join)(testPath, f));
        for await (const item of (0, fs_1.scanDirectory)(testPath)) {
            (0, chai_1.expect)(expectedPaths).to.include(item.path);
            count++;
        }
        (0, chai_1.expect)(count).to.eq(5);
    });
    it("should filter files based on filter function", async () => {
        const testPath = (0, helpers_1.getDataDir)("scanDirectory");
        const filterFunc = (item) => !item.includes("scanDirectory/subdir");
        const expectedPaths = ["1", "2", "3"].map((f) => (0, path_1.join)(testPath, f));
        let count = 0;
        for await (const item of (0, fs_1.scanDirectory)(testPath, {
            filter: filterFunc,
        })) {
            (0, chai_1.expect)(expectedPaths).to.include(item.path);
            count++;
        }
        (0, chai_1.expect)(count).to.eq(3);
    });
});
describe("getChildDirNames", () => {
    it("should return the names of all none hidden directories in the parent directory", async () => {
        const testPath = (0, helpers_1.getDataDir)("get-child-dir-names");
        (0, chai_1.expect)(await (0, fs_1.getChildDirNames)(testPath)).to.eql(["a", "b"]);
    });
});
describe("toCygwinPath", () => {
    it("should convert a win32 path to a cygwin path", () => {
        const path = "C:\\some\\path";
        (0, chai_1.expect)((0, fs_1.toCygwinPath)(path)).to.equal("/cygdrive/c/some/path");
    });
    it("should retain a trailing slash", () => {
        const path = "C:\\some\\path\\";
        (0, chai_1.expect)((0, fs_1.toCygwinPath)(path)).to.equal("/cygdrive/c/some/path/");
    });
});
describe("isConfigFilename", () => {
    it("should return true if the name of the file is garden.yaml", async () => {
        (0, chai_1.expect)((0, fs_1.isConfigFilename)("garden.yaml")).to.be.true;
    });
    it("should return true if the name of the file is garden.yml", async () => {
        (0, chai_1.expect)((0, fs_1.isConfigFilename)("garden.yml")).to.be.true;
    });
    it("should return false otherwise", async () => {
        const badNames = ["agarden.yml", "garden.ymla", "garden.yaaml", "garden.ml"];
        for (const name of badNames) {
            (0, chai_1.expect)((0, fs_1.isConfigFilename)(name)).to.be.false;
        }
    });
});
describe("getWorkingCopyId", () => {
    it("should generate and return a new ID for an empty directory", async () => {
        return (0, tmp_promise_1.withDir)(async (dir) => {
            const id = await (0, fs_1.getWorkingCopyId)(dir.path);
            (0, chai_1.expect)(id).to.be.string;
        }, { unsafeCleanup: true });
    });
    it("should return the same ID after generating for the first time", async () => {
        return (0, tmp_promise_1.withDir)(async (dir) => {
            const idA = await (0, fs_1.getWorkingCopyId)(dir.path);
            const idB = await (0, fs_1.getWorkingCopyId)(dir.path);
            (0, chai_1.expect)(idA).to.equal(idB);
        }, { unsafeCleanup: true });
    });
});
describe("findConfigPathsInPath", () => {
    it("should recursively find all garden configs in a directory", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const files = await (0, fs_1.findConfigPathsInPath)({
            vcs: garden.vcs,
            dir: garden.projectRoot,
            log: garden.log,
        });
        (0, chai_1.expect)(files).to.eql([
            (0, path_1.join)(garden.projectRoot, "commands.garden.yml"),
            (0, path_1.join)(garden.projectRoot, "garden.yml"),
            (0, path_1.join)(garden.projectRoot, "module-a", "garden.yml"),
            (0, path_1.join)(garden.projectRoot, "module-b", "garden.yml"),
            (0, path_1.join)(garden.projectRoot, "module-c", "garden.yml"),
        ]);
    });
    it("should find custom-named garden configs", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "custom-config-names"));
        const files = await (0, fs_1.findConfigPathsInPath)({
            vcs: garden.vcs,
            dir: garden.projectRoot,
            log: garden.log,
        });
        (0, chai_1.expect)(files).to.eql([
            (0, path_1.join)(garden.projectRoot, "module-a", "garden.yml"),
            (0, path_1.join)(garden.projectRoot, "module-b", "module-b.garden.yaml"),
            (0, path_1.join)(garden.projectRoot, "project.garden.yml"),
            (0, path_1.join)(garden.projectRoot, "workflows.garden.yml"),
        ]);
    });
    it("should respect the include option, if specified", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const include = ["module-a/**/*"];
        const files = await (0, fs_1.findConfigPathsInPath)({
            vcs: garden.vcs,
            dir: garden.projectRoot,
            log: garden.log,
            include,
        });
        (0, chai_1.expect)(files).to.eql([(0, path_1.join)(garden.projectRoot, "module-a", "garden.yml")]);
    });
    it("should respect the exclude option, if specified", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const exclude = ["module-a/**/*"];
        const files = await (0, fs_1.findConfigPathsInPath)({
            vcs: garden.vcs,
            dir: garden.projectRoot,
            log: garden.log,
            exclude,
        });
        (0, chai_1.expect)(files).to.eql([
            (0, path_1.join)(garden.projectRoot, "commands.garden.yml"),
            (0, path_1.join)(garden.projectRoot, "garden.yml"),
            (0, path_1.join)(garden.projectRoot, "module-b", "garden.yml"),
            (0, path_1.join)(garden.projectRoot, "module-c", "garden.yml"),
        ]);
    });
    it("should respect the include and exclude options, if both are specified", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const include = ["module*/**/*"];
        const exclude = ["module-a/**/*"];
        const files = await (0, fs_1.findConfigPathsInPath)({
            vcs: garden.vcs,
            dir: garden.projectRoot,
            log: garden.log,
            include,
            exclude,
        });
        (0, chai_1.expect)(files).to.eql([
            (0, path_1.join)(garden.projectRoot, "module-b", "garden.yml"),
            (0, path_1.join)(garden.projectRoot, "module-c", "garden.yml"),
        ]);
    });
    it("should find directly referenced files in modules.include", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const include = ["module-b/garden.yml"];
        const exclude = [];
        const files = await (0, fs_1.findConfigPathsInPath)({
            vcs: garden.vcs,
            dir: garden.projectRoot,
            log: garden.log,
            include,
            exclude,
        });
        (0, chai_1.expect)(files).to.eql([(0, path_1.join)(garden.projectRoot, "module-b", "garden.yml")]);
    });
    it("should find configs with .yaml extension", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-yaml-file-extensions"));
        const files = await (0, fs_1.findConfigPathsInPath)({
            vcs: garden.vcs,
            dir: garden.projectRoot,
            log: garden.log,
        });
        (0, chai_1.expect)(files).to.eql([
            (0, path_1.join)(garden.projectRoot, "garden.yaml"),
            (0, path_1.join)(garden.projectRoot, "module-yaml", "garden.yaml"),
            (0, path_1.join)(garden.projectRoot, "module-yml", "garden.yml"),
        ]);
    });
});
describe("joinWithPosix", () => {
    it("should join a POSIX path to another path", () => {
        (0, chai_1.expect)((0, fs_1.joinWithPosix)("/tmp", "a/b")).to.equal("/tmp/a/b");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3QiwrQkFBMkI7QUFDM0IsOENBQThFO0FBQzlFLGdEQVNnQztBQUNoQyw2Q0FBcUM7QUFHckMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtJQUNuQyxNQUFNLFdBQVcsR0FBRyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQzdDLE1BQU0sYUFBYSxHQUFHLElBQUEsV0FBSSxFQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQTtJQUVsRCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1FBQ3JELE1BQU0sT0FBTyxHQUFHO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLFdBQVcsRUFBRSxLQUFLLENBQUM7U0FDZixDQUFBO1FBQ2pCLE1BQU0sT0FBTyxHQUFHO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLFdBQVcsRUFBRSxLQUFLLENBQUM7U0FDZixDQUFBO1FBQ2pCLE1BQU0sT0FBTyxHQUFHO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLFdBQVcsRUFBRSxLQUFLLENBQUM7U0FDZixDQUFBO1FBQ2pCLE1BQU0sT0FBTyxHQUFHO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLFdBQVcsRUFBRSxLQUFLLENBQUM7U0FDZixDQUFBO1FBQ2pCLElBQUEsYUFBTSxFQUNKLElBQUEsd0JBQW1CLEVBQUMsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FB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