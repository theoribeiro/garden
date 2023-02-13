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
exports.TestVcsHandler = void 0;
const vcs_1 = require("../../../../src/vcs/vcs");
const helpers_1 = require("../../../helpers");
const chai_1 = require("chai");
const lodash_1 = require("lodash");
const git_1 = require("../../../../src/vcs/git");
const path_1 = require("path");
const testdouble_1 = __importDefault(require("testdouble"));
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const fs_extra_1 = require("fs-extra");
const constants_1 = require("../../../../src/constants");
const fs_1 = require("../../../../src/util/fs");
class TestVcsHandler extends vcs_1.VcsHandler {
    constructor() {
        super(...arguments);
        this.name = "test";
        this.testTreeVersions = {};
    }
    async getRepoRoot() {
        return "/foo";
    }
    async getFiles(_) {
        return [];
    }
    async getPathInfo() {
        return {
            branch: "main",
            commitHash: "acbdefg",
            originUrl: "git@github.com:garden-io/foo.git",
        };
    }
    async getTreeVersion(log, projectName, moduleConfig) {
        return this.testTreeVersions[moduleConfig.path] || super.getTreeVersion(log, projectName, moduleConfig);
    }
    setTestTreeVersion(path, version) {
        this.testTreeVersions[path] = version;
    }
    setTestModuleVersion(path, version) {
        this.testTreeVersions[path] = version;
    }
    async ensureRemoteSource() {
        return "";
    }
    async updateRemoteSource() {
        return;
    }
}
exports.TestVcsHandler = TestVcsHandler;
describe("VcsHandler", () => {
    let handlerA;
    let gardenA;
    beforeEach(async () => {
        gardenA = await (0, helpers_1.makeTestGardenA)();
        handlerA = new TestVcsHandler({
            garden: gardenA,
            projectRoot: gardenA.projectRoot,
            gardenDirPath: (0, path_1.join)(gardenA.projectRoot, ".garden"),
            ignoreFile: fs_1.defaultDotIgnoreFile,
            cache: gardenA.cache,
        });
    });
    describe("getTreeVersion", () => {
        it("should sort the list of files in the returned version", async () => {
            const moduleConfig = await gardenA.resolveModule("module-a");
            handlerA.getFiles = async () => [
                { path: "c", hash: "c" },
                { path: "b", hash: "b" },
                { path: "d", hash: "d" },
            ];
            const version = await handlerA.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(version.files).to.eql(["b", "c", "d"]);
        });
        it("should not include the module config file in the file list", async () => {
            const moduleConfig = await gardenA.resolveModule("module-a");
            handlerA.getFiles = async () => [
                { path: moduleConfig.configPath, hash: "c" },
                { path: "b", hash: "b" },
                { path: "d", hash: "d" },
            ];
            const version = await handlerA.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(version.files).to.eql(["b", "d"]);
        });
        it("should respect the include field, if specified", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "include-exclude");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const moduleConfig = await garden.resolveModule("module-a");
            const handler = new git_1.GitHandler({
                garden,
                projectRoot: garden.projectRoot,
                gardenDirPath: garden.gardenDirPath,
                ignoreFile: garden.dotIgnoreFile,
                cache: garden.cache,
            });
            const version = await handler.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(version.files).to.eql([
                (0, path_1.resolve)(moduleConfig.path, "somedir/yes.txt"),
                (0, path_1.resolve)(moduleConfig.path, "yes.txt"),
            ]);
        });
        it("should respect the exclude field, if specified", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "include-exclude");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const moduleConfig = await garden.resolveModule("module-b");
            const handler = new git_1.GitHandler({
                garden,
                projectRoot: garden.projectRoot,
                gardenDirPath: garden.gardenDirPath,
                ignoreFile: garden.dotIgnoreFile,
                cache: garden.cache,
            });
            const version = await handler.getTreeVersion(garden.log, garden.projectName, moduleConfig);
            (0, chai_1.expect)(version.files).to.eql([(0, path_1.resolve)(moduleConfig.path, "yes.txt")]);
        });
        it("should respect both include and exclude fields, if specified", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "include-exclude");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const moduleConfig = await garden.resolveModule("module-c");
            const handler = new git_1.GitHandler({
                garden,
                projectRoot: garden.projectRoot,
                gardenDirPath: garden.gardenDirPath,
                ignoreFile: garden.dotIgnoreFile,
                cache: garden.cache,
            });
            const version = await handler.getTreeVersion(garden.log, garden.projectName, moduleConfig);
            (0, chai_1.expect)(version.files).to.eql([(0, path_1.resolve)(moduleConfig.path, "yes.txt")]);
        });
        it("should not be affected by changes to the module's garden.yml that don't affect the module config", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "multiple-module-config");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const moduleConfigA1 = await garden.resolveModule("module-a1");
            const configPath = moduleConfigA1.configPath;
            const orgConfig = await (0, fs_extra_1.readFile)(configPath);
            try {
                const version1 = await garden.vcs.getTreeVersion(garden.log, garden.projectName, moduleConfigA1);
                await (0, fs_extra_1.writeFile)(configPath, orgConfig + "\n---");
                const version2 = await garden.vcs.getTreeVersion(garden.log, garden.projectName, moduleConfigA1);
                (0, chai_1.expect)(version1).to.eql(version2);
            }
            finally {
                await (0, fs_extra_1.writeFile)(configPath, orgConfig);
            }
        });
        it("should apply project-level excludes if module's path is same as root and no include is set", async () => {
            testdouble_1.default.replace(handlerA, "getFiles", async ({ exclude }) => {
                (0, chai_1.expect)(exclude).to.eql(fs_1.fixedProjectExcludes);
                return [{ path: "foo", hash: "abcdef" }];
            });
            const moduleConfig = await gardenA.resolveModule("module-a");
            moduleConfig.path = gardenA.projectRoot;
            const result = await handlerA.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(result.files).to.eql(["foo"]);
        });
        it("should not apply project-level excludes if module's path is same as root but include is set", async () => {
            testdouble_1.default.replace(handlerA, "getFiles", async ({ exclude }) => {
                (0, chai_1.expect)(exclude).to.be.undefined;
                return [{ path: "foo", hash: "abcdef" }];
            });
            const moduleConfig = await gardenA.resolveModule("module-a");
            moduleConfig.path = gardenA.projectRoot;
            moduleConfig.include = ["foo"];
            const result = await handlerA.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(result.files).to.eql(["foo"]);
        });
        it("should not call getFiles is include: [] is set on the module", async () => {
            testdouble_1.default.replace(handlerA, "getFiles", async () => {
                throw new Error("Nope!");
            });
            const moduleConfig = await gardenA.resolveModule("module-a");
            moduleConfig.include = [];
            await handlerA.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
        });
        it("should get a cached tree version if available", async () => {
            const moduleConfig = await gardenA.resolveModule("module-a");
            const cacheKey = (0, vcs_1.getResourceTreeCacheKey)(moduleConfig);
            const cachedResult = { contentHash: "abcdef", files: ["foo"] };
            handlerA["cache"].set(gardenA.log, cacheKey, cachedResult, ["foo", "bar"]);
            const result = await handlerA.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(result).to.eql(cachedResult);
        });
        it("should cache the resolved version", async () => {
            const moduleConfig = await gardenA.resolveModule("module-a");
            const cacheKey = (0, vcs_1.getResourceTreeCacheKey)(moduleConfig);
            const result = await handlerA.getTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            const cachedResult = handlerA["cache"].get(gardenA.log, cacheKey);
            (0, chai_1.expect)(result).to.eql(cachedResult);
        });
    });
    describe("resolveTreeVersion", () => {
        it("should return the version from a version file if it exists", async () => {
            const moduleConfig = await gardenA.resolveModule("module-a");
            const result = await handlerA.resolveTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(result).to.eql({
                contentHash: "1234567890",
                files: [],
            });
        });
        it("should call getTreeVersion if there is no version file", async () => {
            const moduleConfig = await gardenA.resolveModule("module-b");
            const version = {
                contentHash: "qwerty",
                files: [],
            };
            handlerA.setTestTreeVersion(moduleConfig.path, version);
            const result = await handlerA.resolveTreeVersion(gardenA.log, gardenA.projectName, moduleConfig);
            (0, chai_1.expect)(result).to.eql(version);
        });
    });
});
describe("getModuleVersionString", () => {
    const namedVersionA = {
        name: "module-a",
        versionString: "qwerty",
        dependencyVersions: {},
        files: [],
    };
    const treeVersionA = {
        name: namedVersionA.name,
        contentHash: namedVersionA.versionString,
        files: [],
    };
    const namedVersionB = {
        name: "module-b",
        versionString: "qwerty",
        dependencyVersions: { "module-a": namedVersionA.versionString },
        files: [],
    };
    const namedVersionC = {
        name: "module-c",
        versionString: "qwerty",
        dependencyVersions: { "module-b": namedVersionB.versionString },
        files: [],
    };
    const dependencyVersions = [namedVersionB, namedVersionC];
    const dummyTreeVersion = { name: "module-a", contentHash: "00000000000", files: [] };
    it("should return a different version for a module when a variable used by it changes", async () => {
        const templateGarden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-variable-versioning"));
        templateGarden["cacheKey"] = ""; // Disable caching of the config graph
        const before = await templateGarden.resolveModule("module-a");
        templateGarden.variables["echo-string"] = "something-else";
        const after = await templateGarden.resolveModule("module-a");
        (0, chai_1.expect)((0, vcs_1.getModuleVersionString)(before, dummyTreeVersion, [])).to.not.eql((0, vcs_1.getModuleVersionString)(after, dummyTreeVersion, []));
    });
    it("should return the same version for a module when a variable not used by it changes", async () => {
        const templateGarden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-variable-versioning"));
        templateGarden["cacheKey"] = ""; // Disable caching of the config graph
        const before = await templateGarden.resolveModule("module-a");
        templateGarden.variables["bla"] = "ble";
        const after = await templateGarden.resolveModule("module-a");
        (0, chai_1.expect)((0, vcs_1.getModuleVersionString)(before, dummyTreeVersion, [])).to.eql((0, vcs_1.getModuleVersionString)(after, dummyTreeVersion, []));
    });
    it("is stable with respect to key order in moduleConfig", async () => {
        const originalConfig = helpers_1.defaultModuleConfig;
        const stirredConfig = (0, lodash_1.cloneDeep)(originalConfig);
        delete stirredConfig.name;
        stirredConfig.name = originalConfig.name;
        (0, chai_1.expect)((0, vcs_1.getModuleVersionString)(originalConfig, treeVersionA, dependencyVersions)).to.eql((0, vcs_1.getModuleVersionString)(stirredConfig, treeVersionA, dependencyVersions));
    });
    it("is stable with respect to dependency version order", async () => {
        const config = helpers_1.defaultModuleConfig;
        (0, chai_1.expect)((0, vcs_1.getModuleVersionString)(config, treeVersionA, [namedVersionB, namedVersionC])).to.eql((0, vcs_1.getModuleVersionString)(config, treeVersionA, [namedVersionC, namedVersionB]));
    });
    it("should be stable between runtimes", async () => {
        const projectRoot = (0, helpers_1.getDataDir)("test-projects", "fixed-version-hashes-1");
        // fixed-version-hashes-1 expects this var to be set
        process.env.MODULE_A_TEST_ENV_VAR = "foo";
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot, { noCache: true });
        const module = await garden.resolveModule("module-a");
        // TODO-G2: the assertion below still fails, check if there is something changed in the hash calculation
        const fixedVersionString = "v-6f85bdd407";
        (0, chai_1.expect)(module.version.versionString).to.eql(fixedVersionString);
        delete process.env.TEST_ENV_VAR;
    });
});
describe("writeTreeVersionFile", () => {
    let tmpDir;
    let tmpPath;
    beforeEach(async () => {
        tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
        tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    describe("writeVersionFile", () => {
        it("should write relative paths for files", async () => {
            await (0, vcs_1.writeTreeVersionFile)(tmpPath, {
                contentHash: "foo",
                files: [(0, path_1.join)(tmpPath, "some", "file")],
            });
            (0, chai_1.expect)(await (0, vcs_1.readTreeVersionFile)((0, path_1.join)(tmpPath, constants_1.GARDEN_VERSIONFILE_NAME))).to.eql({
                contentHash: "foo",
                files: ["some/file"],
            });
        });
        it("should handle relative paths in input", async () => {
            await (0, vcs_1.writeTreeVersionFile)(tmpPath, {
                contentHash: "foo",
                files: ["some/file"],
            });
            (0, chai_1.expect)(await (0, vcs_1.readTreeVersionFile)((0, path_1.join)(tmpPath, constants_1.GARDEN_VERSIONFILE_NAME))).to.eql({
                contentHash: "foo",
                files: ["some/file"],
            });
        });
        it("should normalize Windows-style paths to POSIX-style", async () => {
            await (0, vcs_1.writeTreeVersionFile)(tmpPath, {
                contentHash: "foo",
                files: [`some\\file`],
            });
            (0, chai_1.expect)(await (0, vcs_1.readTreeVersionFile)((0, path_1.join)(tmpPath, constants_1.GARDEN_VERSIONFILE_NAME))).to.eql({
                contentHash: "foo",
                files: ["some/file"],
            });
        });
    });
});
describe("hashModuleVersion", () => {
    function baseConfig() {
        return {
            apiVersion: constants_1.DEFAULT_API_VERSION,
            type: "test",
            path: "/tmp",
            name: "foo",
            allowPublish: false,
            build: { dependencies: [] },
            disabled: false,
            serviceConfigs: [],
            taskConfigs: [],
            testConfigs: [],
            spec: {},
        };
    }
    context("buildConfig is set", () => {
        it("only uses the buildConfig for the module config hash", () => {
            const config = {
                ...baseConfig(),
                buildConfig: {
                    something: "build specific",
                },
            };
            const a = (0, vcs_1.hashModuleVersion)(config, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            const b = (0, vcs_1.hashModuleVersion)({
                ...config,
                serviceConfigs: [{ name: "bla", dependencies: [], disabled: false, spec: {} }],
                taskConfigs: [{ name: "bla", dependencies: [], disabled: false, spec: {}, timeout: 123, cacheResult: false }],
                testConfigs: [{ name: "bla", dependencies: [], disabled: false, spec: {}, timeout: 123 }],
                spec: { foo: "bar" },
            }, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            (0, chai_1.expect)(a).to.equal(b);
        });
        it("factors in dependency versions", () => {
            const config = {
                ...baseConfig(),
                buildConfig: {
                    something: "build specific",
                },
            };
            const a = (0, vcs_1.hashModuleVersion)(config, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            const b = (0, vcs_1.hashModuleVersion)(config, { name: "foo", contentHash: "abcdefabced", files: [] }, [
                { name: "dep", versionString: "blabalbalba", files: [], dependencyVersions: {} },
            ]);
            (0, chai_1.expect)(a).to.not.equal(b);
        });
    });
    context("buildConfig is not set", () => {
        it("is affected by changes to the spec field", () => {
            const config = {
                ...baseConfig(),
            };
            const a = (0, vcs_1.hashModuleVersion)(config, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            const b = (0, vcs_1.hashModuleVersion)({
                ...config,
                spec: { foo: "bar" },
            }, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            (0, chai_1.expect)(a).to.not.equal(b);
        });
        it("omits generally-considered runtime fields", () => {
            const config = {
                ...baseConfig(),
            };
            const a = (0, vcs_1.hashModuleVersion)(config, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            const b = (0, vcs_1.hashModuleVersion)({
                ...config,
                serviceConfigs: [{ name: "bla", dependencies: [], disabled: false, spec: {} }],
                taskConfigs: [{ name: "bla", dependencies: [], disabled: false, spec: {}, timeout: 123, cacheResult: false }],
                testConfigs: [{ name: "bla", dependencies: [], disabled: false, spec: {}, timeout: 123 }],
            }, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            (0, chai_1.expect)(a).to.equal(b);
        });
        it("factors in dependency versions", () => {
            const config = {
                ...baseConfig(),
            };
            const a = (0, vcs_1.hashModuleVersion)(config, { name: "foo", contentHash: "abcdefabced", files: [] }, []);
            const b = (0, vcs_1.hashModuleVersion)(config, { name: "foo", contentHash: "abcdefabced", files: [] }, [
                { name: "dep", versionString: "blabalbalba", files: [], dependencyVersions: {} },
            ]);
            (0, chai_1.expect)(a).to.not.equal(b);
        });
    });
});
describe("helpers", () => {
    context("BaseActionConfig", () => {
        const baseActionConfig = {
            internal: { basePath: "/path/to/build-action", configFilePath: "/path/to/build-action/garden.yml" },
            kind: "Build",
            name: "build-action",
            spec: {},
            type: "",
        };
        it("getConfigFilePath", () => {
            const configFilePath = (0, vcs_1.getConfigFilePath)(baseActionConfig);
            (0, chai_1.expect)(configFilePath).to.equal(baseActionConfig.internal.configFilePath);
        });
        it("getConfigBasePath", () => {
            const configBasePath = (0, vcs_1.getConfigBasePath)(baseActionConfig);
            (0, chai_1.expect)(configBasePath).to.equal(baseActionConfig.internal.basePath);
        });
        it("describeConfig", () => {
            const configDescription = (0, vcs_1.describeConfig)(baseActionConfig);
            (0, chai_1.expect)(configDescription).to.equal(`${baseActionConfig.kind} action ${baseActionConfig.name}`);
        });
    });
    context("ModuleConfig", () => {
        const moduleConfig = {
            allowPublish: false,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            build: {
                dependencies: [],
            },
            disabled: false,
            name: "module-a",
            path: "/path/to/module/a",
            configPath: "/path/to/module/a/garden.yml",
            serviceConfigs: [],
            spec: undefined,
            taskConfigs: [],
            testConfigs: [],
            type: "",
        };
        it("getConfigFilePath", () => {
            const configFilePath = (0, vcs_1.getConfigFilePath)(moduleConfig);
            (0, chai_1.expect)(configFilePath).to.equal(moduleConfig.configPath);
        });
        it("getConfigBasePath", () => {
            const configBasePath = (0, vcs_1.getConfigBasePath)(moduleConfig);
            (0, chai_1.expect)(configBasePath).to.equal(moduleConfig.path);
        });
        it("describeConfig", () => {
            const configDescription = (0, vcs_1.describeConfig)(moduleConfig);
            (0, chai_1.expect)(configDescription).to.equal(`module ${moduleConfig.name}`);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILGlEQWdCZ0M7QUFDaEMsOENBQStHO0FBQy9HLCtCQUE2QjtBQUM3QixtQ0FBa0M7QUFFbEMsaURBQW9EO0FBQ3BELCtCQUFvQztBQUNwQyw0REFBMkI7QUFDM0IsOERBQTZCO0FBQzdCLHVDQUF3RDtBQUN4RCx5REFBd0Y7QUFDeEYsZ0RBQW9GO0FBSXBGLE1BQWEsY0FBZSxTQUFRLGdCQUFVO0lBQTlDOztRQUNFLFNBQUksR0FBRyxNQUFNLENBQUE7UUFDTCxxQkFBZ0IsR0FBaUIsRUFBRSxDQUFBO0lBcUM3QyxDQUFDO0lBbkNDLEtBQUssQ0FBQyxXQUFXO1FBQ2YsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFpQjtRQUM5QixPQUFPLEVBQUUsQ0FBQTtJQUNYLENBQUM7SUFFRCxLQUFLLENBQUMsV0FBVztRQUNmLE9BQU87WUFDTCxNQUFNLEVBQUUsTUFBTTtZQUNkLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLFNBQVMsRUFBRSxrQ0FBa0M7U0FDOUMsQ0FBQTtJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQWEsRUFBRSxXQUFtQixFQUFFLFlBQTBCO1FBQ2pGLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7SUFDekcsQ0FBQztJQUVELGtCQUFrQixDQUFDLElBQVksRUFBRSxPQUFvQjtRQUNuRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFBO0lBQ3ZDLENBQUM7SUFFRCxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsT0FBb0I7UUFDckQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQTtJQUN2QyxDQUFDO0lBRUQsS0FBSyxDQUFDLGtCQUFrQjtRQUN0QixPQUFPLEVBQUUsQ0FBQTtJQUNYLENBQUM7SUFFRCxLQUFLLENBQUMsa0JBQWtCO1FBQ3RCLE9BQU07SUFDUixDQUFDO0NBQ0Y7QUF2Q0Qsd0NBdUNDO0FBRUQsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFDMUIsSUFBSSxRQUF3QixDQUFBO0lBQzVCLElBQUksT0FBbUIsQ0FBQTtJQUV2QixVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDcEIsT0FBTyxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7UUFDakMsUUFBUSxHQUFHLElBQUksY0FBYyxDQUFDO1lBQzVCLE1BQU0sRUFBRSxPQUFPO1lBQ2YsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ2hDLGFBQWEsRUFBRSxJQUFBLFdBQUksRUFBQyxPQUFPLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztZQUNuRCxVQUFVLEVBQUUseUJBQW9CO1lBQ2hDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztTQUNyQixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsRUFBRSxDQUFDLHVEQUF1RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JFLE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM1RCxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzlCLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUN4QixFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDeEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7YUFDekIsQ0FBQTtZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFDN0YsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsNERBQTRELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUUsTUFBTSxZQUFZLEdBQUcsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQzVELFFBQVEsQ0FBQyxRQUFRLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDOUIsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLFVBQVcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUM3QyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDeEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7YUFDekIsQ0FBQTtZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFDN0YsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUMxQyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5RCxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLENBQUE7WUFDbEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxDQUFDLENBQUE7WUFDaEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQzNELE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQVUsQ0FBQztnQkFDN0IsTUFBTTtnQkFDTixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7Z0JBQy9CLGFBQWEsRUFBRSxNQUFNLENBQUMsYUFBYTtnQkFDbkMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxhQUFhO2dCQUNoQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7YUFDcEIsQ0FBQyxDQUFBO1lBRUYsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQTtZQUU1RixJQUFBLGFBQU0sRUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDM0IsSUFBQSxjQUFPLEVBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztnQkFDN0MsSUFBQSxjQUFPLEVBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUM7YUFDdEMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsZ0RBQWdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUQsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFBO1lBQ2xFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQ2hELE1BQU0sWUFBWSxHQUFHLE1BQU0sTUFBTSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUMzRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFVLENBQUM7Z0JBQzdCLE1BQU07Z0JBQ04sV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXO2dCQUMvQixhQUFhLEVBQUUsTUFBTSxDQUFDLGFBQWE7Z0JBQ25DLFVBQVUsRUFBRSxNQUFNLENBQUMsYUFBYTtnQkFDaEMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO2FBQ3BCLENBQUMsQ0FBQTtZQUVGLE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFFMUYsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFBLGNBQU8sRUFBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN2RSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RSxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLENBQUE7WUFDbEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxDQUFDLENBQUE7WUFDaEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBRTNELE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQVUsQ0FBQztnQkFDN0IsTUFBTTtnQkFDTixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7Z0JBQy9CLGFBQWEsRUFBRSxNQUFNLENBQUMsYUFBYTtnQkFDbkMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxhQUFhO2dCQUNoQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7YUFDcEIsQ0FBQyxDQUFBO1lBRUYsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQTtZQUUxRixJQUFBLGFBQU0sRUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUEsY0FBTyxFQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZFLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGtHQUFrRyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hILE1BQU0sV0FBVyxHQUFHLElBQUEsb0JBQVUsRUFBQyxlQUFlLEVBQUUsd0JBQXdCLENBQUMsQ0FBQTtZQUN6RSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxXQUFXLENBQUMsQ0FBQTtZQUNoRCxNQUFNLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDOUQsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLFVBQVcsQ0FBQTtZQUM3QyxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxVQUFVLENBQUMsQ0FBQTtZQUU1QyxJQUFJO2dCQUNGLE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFBO2dCQUNoRyxNQUFNLElBQUEsb0JBQVMsRUFBQyxVQUFVLEVBQUUsU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFBO2dCQUNoRCxNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQTtnQkFDaEcsSUFBQSxhQUFNLEVBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUNsQztvQkFBUztnQkFDUixNQUFNLElBQUEsb0JBQVMsRUFBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUE7YUFDdkM7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw0RkFBNEYsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxRyxvQkFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBa0IsRUFBRSxFQUFFO2dCQUNyRSxJQUFBLGFBQU0sRUFBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLHlCQUFvQixDQUFDLENBQUE7Z0JBQzVDLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7WUFDMUMsQ0FBQyxDQUFDLENBQUE7WUFDRixNQUFNLFlBQVksR0FBRyxNQUFNLE9BQU8sQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDNUQsWUFBWSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFBO1lBQ3ZDLE1BQU0sTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFDNUYsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1FBQ3RDLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDZGQUE2RixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNHLG9CQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFrQixFQUFFLEVBQUU7Z0JBQ3JFLElBQUEsYUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO2dCQUMvQixPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO1lBQzFDLENBQUMsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxZQUFZLEdBQUcsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQzVELFlBQVksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQTtZQUN2QyxZQUFZLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQTtZQUM1RixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDdEMsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsOERBQThELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUUsb0JBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDMUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMxQixDQUFDLENBQUMsQ0FBQTtZQUNGLE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM1RCxZQUFZLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTtZQUN6QixNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBQy9FLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLCtDQUErQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdELE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM1RCxNQUFNLFFBQVEsR0FBRyxJQUFBLDZCQUF1QixFQUFDLFlBQVksQ0FBQyxDQUFBO1lBRXRELE1BQU0sWUFBWSxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFBO1lBQzlELFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFFMUUsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQTtZQUM1RixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ3JDLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLG1DQUFtQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2pELE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM1RCxNQUFNLFFBQVEsR0FBRyxJQUFBLDZCQUF1QixFQUFDLFlBQVksQ0FBQyxDQUFBO1lBRXRELE1BQU0sTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFDNUYsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBRWpFLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDckMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDbEMsRUFBRSxDQUFDLDREQUE0RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFFLE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM1RCxNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFFaEcsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDcEIsV0FBVyxFQUFFLFlBQVk7Z0JBQ3pCLEtBQUssRUFBRSxFQUFFO2FBQ1YsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxZQUFZLEdBQUcsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBRTVELE1BQU0sT0FBTyxHQUFHO2dCQUNkLFdBQVcsRUFBRSxRQUFRO2dCQUNyQixLQUFLLEVBQUUsRUFBRTthQUNWLENBQUE7WUFDRCxRQUFRLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUV2RCxNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFDaEcsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNoQyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO0lBQ3RDLE1BQU0sYUFBYSxHQUF1QjtRQUN4QyxJQUFJLEVBQUUsVUFBVTtRQUNoQixhQUFhLEVBQUUsUUFBUTtRQUN2QixrQkFBa0IsRUFBRSxFQUFFO1FBQ3RCLEtBQUssRUFBRSxFQUFFO0tBQ1YsQ0FBQTtJQUNELE1BQU0sWUFBWSxHQUFxQjtRQUNyQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUk7UUFDeEIsV0FBVyxFQUFFLGFBQWEsQ0FBQyxhQUFhO1FBQ3hDLEtBQUssRUFBRSxFQUFFO0tBQ1YsQ0FBQTtJQUNELE1BQU0sYUFBYSxHQUF1QjtRQUN4QyxJQUFJLEVBQUUsVUFBVTtRQUNoQixhQUFhLEVBQUUsUUFBUTtRQUN2QixrQkFBa0IsRUFBRSxFQUFFLFVBQVUsRUFBRSxhQUFhLENBQUMsYUFBYSxFQUFFO1FBQy9ELEtBQUssRUFBRSxFQUFFO0tBQ1YsQ0FBQTtJQUVELE1BQU0sYUFBYSxHQUF1QjtRQUN4QyxJQUFJLEVBQUUsVUFBVTtRQUNoQixhQUFhLEVBQUUsUUFBUTtRQUN2QixrQkFBa0IsRUFBRSxFQUFFLFVBQVUsRUFBRSxhQUFhLENBQUMsYUFBYSxFQUFFO1FBQy9ELEtBQUssRUFBRSxFQUFFO0tBQ1YsQ0FBQTtJQUVELE1BQU0sa0JBQWtCLEdBQXlCLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFBO0lBQy9FLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFBO0lBRXBGLEVBQUUsQ0FBQyxtRkFBbUYsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNqRyxNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxJQUFBLG9CQUFVLEVBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFBO1FBQzNGLGNBQWMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUEsQ0FBQyxzQ0FBc0M7UUFDdEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxjQUFjLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRTdELGNBQWMsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEdBQUcsZ0JBQWdCLENBQUE7UUFFMUQsTUFBTSxLQUFLLEdBQUcsTUFBTSxjQUFjLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRTVELElBQUEsYUFBTSxFQUFDLElBQUEsNEJBQXNCLEVBQUMsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQ3JFLElBQUEsNEJBQXNCLEVBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUNwRCxDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0ZBQW9GLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDbEcsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsSUFBQSxvQkFBVSxFQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQTtRQUMzRixjQUFjLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFBLENBQUMsc0NBQXNDO1FBQ3RFLE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUU3RCxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQTtRQUV2QyxNQUFNLEtBQUssR0FBRyxNQUFNLGNBQWMsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUE7UUFFNUQsSUFBQSxhQUFNLEVBQUMsSUFBQSw0QkFBc0IsRUFBQyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUNqRSxJQUFBLDRCQUFzQixFQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FDcEQsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHFEQUFxRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ25FLE1BQU0sY0FBYyxHQUFHLDZCQUFtQixDQUFBO1FBQzFDLE1BQU0sYUFBYSxHQUFRLElBQUEsa0JBQVMsRUFBQyxjQUFjLENBQUMsQ0FBQTtRQUNwRCxPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUE7UUFDekIsYUFBYSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFBO1FBRXhDLElBQUEsYUFBTSxFQUFDLElBQUEsNEJBQXNCLEVBQUMsY0FBYyxFQUFFLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FDckYsSUFBQSw0QkFBc0IsRUFBQyxhQUFhLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixDQUFDLENBQ3hFLENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsRSxNQUFNLE1BQU0sR0FBRyw2QkFBbUIsQ0FBQTtRQUVsQyxJQUFBLGFBQU0sRUFBQyxJQUFBLDRCQUFzQixFQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQ3pGLElBQUEsNEJBQXNCLEVBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUM3RSxDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsbUNBQW1DLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDakQsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGVBQWUsRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO1FBRXpFLG9EQUFvRDtRQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQTtRQUV6QyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxXQUFXLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUNuRSxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUE7UUFFckQsd0dBQXdHO1FBQ3hHLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFBO1FBQ3pDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1FBRS9ELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUE7SUFDakMsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQTtBQUVGLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7SUFDcEMsSUFBSSxNQUEyQixDQUFBO0lBQy9CLElBQUksT0FBZSxDQUFBO0lBRW5CLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxxQkFBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQy9DLE9BQU8sR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdkMsQ0FBQyxDQUFDLENBQUE7SUFFRixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDeEIsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyRCxNQUFNLElBQUEsMEJBQW9CLEVBQUMsT0FBTyxFQUFFO2dCQUNsQyxXQUFXLEVBQUUsS0FBSztnQkFDbEIsS0FBSyxFQUFFLENBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN2QyxDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxNQUFNLElBQUEseUJBQW1CLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLG1DQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQy9FLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixLQUFLLEVBQUUsQ0FBQyxXQUFXLENBQUM7YUFDckIsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckQsTUFBTSxJQUFBLDBCQUFvQixFQUFDLE9BQU8sRUFBRTtnQkFDbEMsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQzthQUNyQixDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxNQUFNLElBQUEseUJBQW1CLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLG1DQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQy9FLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixLQUFLLEVBQUUsQ0FBQyxXQUFXLENBQUM7YUFDckIsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMscURBQXFELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkUsTUFBTSxJQUFBLDBCQUFvQixFQUFDLE9BQU8sRUFBRTtnQkFDbEMsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLFlBQVksQ0FBQzthQUN0QixDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxNQUFNLElBQUEseUJBQW1CLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLG1DQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQy9FLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixLQUFLLEVBQUUsQ0FBQyxXQUFXLENBQUM7YUFDckIsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBO0FBRUYsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxTQUFTLFVBQVU7UUFDakIsT0FBTztZQUNMLFVBQVUsRUFBRSwrQkFBbUI7WUFDL0IsSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsTUFBTTtZQUNaLElBQUksRUFBRSxLQUFLO1lBQ1gsWUFBWSxFQUFFLEtBQUs7WUFDbkIsS0FBSyxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRTtZQUMzQixRQUFRLEVBQUUsS0FBSztZQUNmLGNBQWMsRUFBRSxFQUFFO1lBQ2xCLFdBQVcsRUFBRSxFQUFFO1lBQ2YsV0FBVyxFQUFFLEVBQUU7WUFDZixJQUFJLEVBQUUsRUFBRTtTQUNULENBQUE7SUFDSCxDQUFDO0lBRUQsT0FBTyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUNqQyxFQUFFLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQzlELE1BQU0sTUFBTSxHQUFHO2dCQUNiLEdBQUcsVUFBVSxFQUFFO2dCQUNmLFdBQVcsRUFBRTtvQkFDWCxTQUFTLEVBQUUsZ0JBQWdCO2lCQUM1QjthQUNGLENBQUE7WUFDRCxNQUFNLENBQUMsR0FBRyxJQUFBLHVCQUFpQixFQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDL0YsTUFBTSxDQUFDLEdBQUcsSUFBQSx1QkFBaUIsRUFDekI7Z0JBQ0UsR0FBRyxNQUFNO2dCQUNULGNBQWMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM5RSxXQUFXLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQzdHLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUM7Z0JBQ3pGLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUU7YUFDckIsRUFDRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQ3RELEVBQUUsQ0FDSCxDQUFBO1lBQ0QsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN2QixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7WUFDeEMsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsR0FBRyxVQUFVLEVBQUU7Z0JBQ2YsV0FBVyxFQUFFO29CQUNYLFNBQVMsRUFBRSxnQkFBZ0I7aUJBQzVCO2FBQ0YsQ0FBQTtZQUNELE1BQU0sQ0FBQyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUMvRixNQUFNLENBQUMsR0FBRyxJQUFBLHVCQUFpQixFQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQzFGLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxFQUFFO2FBQ2pGLENBQUMsQ0FBQTtZQUNGLElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzNCLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixPQUFPLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsR0FBRyxVQUFVLEVBQUU7YUFDaEIsQ0FBQTtZQUNELE1BQU0sQ0FBQyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUMvRixNQUFNLENBQUMsR0FBRyxJQUFBLHVCQUFpQixFQUN6QjtnQkFDRSxHQUFHLE1BQU07Z0JBQ1QsSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRTthQUNyQixFQUNELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFDdEQsRUFBRSxDQUNILENBQUE7WUFDRCxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUMzQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7WUFDbkQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsR0FBRyxVQUFVLEVBQUU7YUFDaEIsQ0FBQTtZQUNELE1BQU0sQ0FBQyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUMvRixNQUFNLENBQUMsR0FBRyxJQUFBLHVCQUFpQixFQUN6QjtnQkFDRSxHQUFHLE1BQU07Z0JBQ1QsY0FBYyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzlFLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDN0csV0FBVyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQzthQUMxRixFQUNELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFDdEQsRUFBRSxDQUNILENBQUE7WUFDRCxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUN4QyxNQUFNLE1BQU0sR0FBRztnQkFDYixHQUFHLFVBQVUsRUFBRTthQUNoQixDQUFBO1lBQ0QsTUFBTSxDQUFDLEdBQUcsSUFBQSx1QkFBaUIsRUFBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQy9GLE1BQU0sQ0FBQyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDMUYsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxFQUFFLEVBQUU7YUFDakYsQ0FBQyxDQUFBO1lBQ0YsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDM0IsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBO0FBRUYsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7SUFDdkIsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUMvQixNQUFNLGdCQUFnQixHQUFxQjtZQUN6QyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUUsY0FBYyxFQUFFLGtDQUFrQyxFQUFFO1lBQ25HLElBQUksRUFBRSxPQUFPO1lBQ2IsSUFBSSxFQUFFLGNBQWM7WUFDcEIsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsRUFBRTtTQUNULENBQUE7UUFFRCxFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzNCLE1BQU0sY0FBYyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQTtZQUMxRCxJQUFBLGFBQU0sRUFBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQTtRQUMzRSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7WUFDM0IsTUFBTSxjQUFjLEdBQUcsSUFBQSx1QkFBaUIsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFBO1lBQzFELElBQUEsYUFBTSxFQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3JFLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUN4QixNQUFNLGlCQUFpQixHQUFHLElBQUEsb0JBQWMsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFBO1lBQzFELElBQUEsYUFBTSxFQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLGdCQUFnQixDQUFDLElBQUksV0FBVyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQ2hHLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixPQUFPLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUMzQixNQUFNLFlBQVksR0FBaUI7WUFDakMsWUFBWSxFQUFFLEtBQUs7WUFDbkIsVUFBVSxFQUFFLCtCQUFtQjtZQUMvQixLQUFLLEVBQUU7Z0JBQ0wsWUFBWSxFQUFFLEVBQUU7YUFDakI7WUFDRCxRQUFRLEVBQUUsS0FBSztZQUNmLElBQUksRUFBRSxVQUFVO1lBQ2hCLElBQUksRUFBRSxtQkFBbUI7WUFDekIsVUFBVSxFQUFFLDhCQUE4QjtZQUMxQyxjQUFjLEVBQUUsRUFBRTtZQUNsQixJQUFJLEVBQUUsU0FBUztZQUNmLFdBQVcsRUFBRSxFQUFFO1lBQ2YsV0FBVyxFQUFFLEVBQUU7WUFDZixJQUFJLEVBQUUsRUFBRTtTQUNULENBQUE7UUFFRCxFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzNCLE1BQU0sY0FBYyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsWUFBWSxDQUFDLENBQUE7WUFDdEQsSUFBQSxhQUFNLEVBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDMUQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzNCLE1BQU0sY0FBYyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsWUFBWSxDQUFDLENBQUE7WUFDdEQsSUFBQSxhQUFNLEVBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDcEQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLE1BQU0saUJBQWlCLEdBQUcsSUFBQSxvQkFBYyxFQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ3RELElBQUEsYUFBTSxFQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQ25FLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9