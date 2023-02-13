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
const chai_1 = require("chai");
const path_1 = require("path");
const lodash_1 = require("lodash");
const testdouble_1 = __importDefault(require("testdouble"));
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const fs_extra_1 = require("fs-extra");
const garden_1 = require("../../../../../src/garden");
const container_1 = require("../../../../../src/plugins/container/container");
const helpers_1 = require("../../../../helpers");
const module_1 = require("../../../../../src/types/module");
const moduleConfig_1 = require("../../../../../src/plugins/container/moduleConfig");
const helpers_2 = require("../../../../../src/plugins/container/helpers");
const constants_1 = require("../../../../../src/constants");
const string_1 = require("../../../../../src/util/string");
const actions_1 = require("../../../../../src/graph/actions");
describe("containerHelpers", () => {
    const projectRoot = (0, helpers_1.getDataDir)("test-project-container");
    const modulePath = (0, helpers_1.getDataDir)("test-project-container", "module-a");
    const plugin = (0, container_1.gardenPlugin)();
    const configure = plugin.createModuleTypes[0].handlers.configure;
    const baseConfig = {
        allowPublish: false,
        apiVersion: constants_1.DEFAULT_API_VERSION,
        build: {
            dependencies: [],
        },
        disabled: false,
        name: "test",
        path: modulePath,
        type: "container",
        spec: {
            build: {
                timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
            },
            buildArgs: {},
            extraFlags: [],
            services: [],
            tasks: [],
            tests: [],
        },
        serviceConfigs: [],
        taskConfigs: [],
        testConfigs: [],
    };
    const dummyVersion = {
        versionString: "1234",
        dependencyVersions: {},
        files: [],
    };
    let garden;
    let ctx;
    let log;
    const moduleHasDockerfile = (0, helpers_1.getPropertyName)(helpers_2.containerHelpers, (x) => x.moduleHasDockerfile);
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, container_1.gardenPlugin)()] });
        log = garden.log;
        const provider = await garden.resolveProvider(garden.log, "container");
        ctx = await garden.getPluginContext({ provider, templateContext: undefined, events: undefined });
        testdouble_1.default.replace(garden.buildStaging, "syncDependencyProducts", () => null);
        testdouble_1.default.replace(garden_1.Garden.prototype, "resolveModuleVersion", async () => dummyVersion);
    });
    async function getTestBuildAction(moduleConfig) {
        const parsed = await configure({ ctx, moduleConfig, log });
        return (0, actions_1.actionFromConfig)({
            garden,
            log,
            config: parsed.moduleConfig.buildConfig,
            configsByKey: {},
            router: await garden.getActionRouter(),
            graph: await garden.getConfigGraph({ log, emit: false }),
        });
    }
    async function getResolvedTestBuildAction(moduleConfig) {
        const action = await getTestBuildAction(moduleConfig);
        return await garden.resolveAction({ action, log });
    }
    async function getTestModule(moduleConfig) {
        const parsed = await configure({ ctx, moduleConfig, log });
        return (0, module_1.moduleFromConfig)({ garden, log, config: parsed.moduleConfig, buildDependencies: [] });
    }
    describe("getLocalImageId", () => {
        it("should return configured image name if set, with the version as the tag", async () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.getLocalImageId(baseConfig.name, "some/image:1.1", dummyVersion)).to.equal("some/image:1234");
        });
        it("should return build name if image is not specified, with the version as the tag", async () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.getLocalImageId(baseConfig.name, undefined, dummyVersion)).to.equal("test:1234");
        });
    });
    describe("getLocalImageName", () => {
        it("should return explicit image name with no version if specified", async () => {
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => false);
            const config = (0, lodash_1.cloneDeep)(baseConfig);
            config.spec.image = "some/image:1.1";
            (0, chai_1.expect)(helpers_2.containerHelpers.getLocalImageName(config.name, "some/image:1.1")).to.equal("some/image");
        });
        it("should return build name if no image name is specified", async () => {
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => true);
            const config = (0, lodash_1.cloneDeep)(baseConfig);
            (0, chai_1.expect)(helpers_2.containerHelpers.getLocalImageName(config.name, undefined)).to.equal(config.name);
        });
    });
    describe("getDeploymentImageId", () => {
        it("should return module name with module version if there is a Dockerfile and no image name set", async () => {
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => true);
            const config = (0, lodash_1.cloneDeep)(baseConfig);
            const module = await getTestModule(config);
            (0, chai_1.expect)(helpers_2.containerHelpers.getModuleDeploymentImageId(config, module.version, undefined)).to.equal("test:1234");
        });
        it("should return image name with module version if there is a Dockerfile and image name is set", async () => {
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => true);
            const config = (0, lodash_1.cloneDeep)(baseConfig);
            config.spec.image = "some/image:1.1";
            const module = await getTestModule(config);
            (0, chai_1.expect)(helpers_2.containerHelpers.getModuleDeploymentImageId(module, module.version, undefined)).to.equal("some/image:1234");
        });
        it("should return configured image tag if there is no Dockerfile", async () => {
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => false);
            const config = (0, lodash_1.cloneDeep)(baseConfig);
            config.spec.image = "some/image:1.1";
            const module = await getTestModule(config);
            (0, chai_1.expect)(helpers_2.containerHelpers.getModuleDeploymentImageId(module, module.version, undefined)).to.equal("some/image:1.1");
        });
        it("should throw if no image name is set and there is no Dockerfile", async () => {
            const config = (0, lodash_1.cloneDeep)(baseConfig);
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => false);
            await (0, helpers_1.expectError)(() => helpers_2.containerHelpers.getModuleDeploymentImageId(config, dummyVersion, undefined), "configuration");
        });
    });
    describe("getPublicImageId", () => {
        it("should use image name including version if specified", async () => {
            const config = (0, lodash_1.cloneDeep)(baseConfig);
            config.spec.image = "some/image:1.1";
            const action = await getResolvedTestBuildAction(config);
            (0, chai_1.expect)(helpers_2.containerHelpers.getPublicImageId(action)).to.equal("some/image:1.1");
        });
        it("should use image name if specified with commit hash if no version is set", async () => {
            const action = await getResolvedTestBuildAction({
                apiVersion: constants_1.DEFAULT_API_VERSION,
                allowPublish: false,
                build: {
                    dependencies: [],
                },
                disabled: false,
                name: "test",
                path: modulePath,
                type: "container",
                spec: {
                    build: {
                        dependencies: [],
                        timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                    },
                    buildArgs: {},
                    extraFlags: [],
                    image: "some/image",
                    services: [],
                    tasks: [],
                    tests: [],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            });
            (0, chai_1.expect)(helpers_2.containerHelpers.getPublicImageId(action)).to.equal("some/image:1234");
        });
        it("should use local id if no image name is set", async () => {
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => true);
            const action = await getResolvedTestBuildAction(baseConfig);
            testdouble_1.default.replace(helpers_2.containerHelpers, "getLocalImageId", () => "test:1234");
            (0, chai_1.expect)(helpers_2.containerHelpers.getPublicImageId(action)).to.equal("test:1234");
        });
    });
    describe("parseImageId", () => {
        it("should correctly parse a simple id", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.parseImageId("image:tag")).to.eql({
                repository: "image",
                tag: "tag",
            });
        });
        it("should correctly parse an id with a namespace", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.parseImageId("namespace/image:tag")).to.eql({
                namespace: "namespace",
                repository: "image",
                tag: "tag",
            });
        });
        it("should correctly parse an id with a host and namespace", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.parseImageId("my-host.com/namespace/image:tag")).to.eql({
                host: "my-host.com",
                namespace: "namespace",
                repository: "image",
                tag: "tag",
            });
        });
        it("should correctly parse an id with a host with a port, and namespace", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.parseImageId("localhost:5000/namespace/image:tag")).to.eql({
                host: "localhost:5000",
                namespace: "namespace",
                repository: "image",
                tag: "tag",
            });
        });
        it("should correctly parse an id with a host and multi-level namespace", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.parseImageId("my-host.com/a/b/c/d/image:tag")).to.eql({
                host: "my-host.com",
                namespace: "a/b/c/d",
                repository: "image",
                tag: "tag",
            });
        });
        it("should throw on an empty name", async () => {
            await (0, helpers_1.expectError)(() => helpers_2.containerHelpers.parseImageId(""), "configuration");
        });
    });
    describe("unparseImageId", () => {
        it("should correctly compose a simple id", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.unparseImageId({
                repository: "image",
                tag: "tag",
            })).to.equal("image:tag");
        });
        it("should correctly compose an id with a namespace", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.unparseImageId({
                namespace: "namespace",
                repository: "image",
                tag: "tag",
            })).to.equal("namespace/image:tag");
        });
        it("should correctly compose an id with a host and namespace", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.unparseImageId({
                host: "my-host.com",
                namespace: "namespace",
                repository: "image",
                tag: "tag",
            })).to.equal("my-host.com/namespace/image:tag");
        });
        it("should set a default namespace when host but no namespace is specified", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.unparseImageId({
                host: "my-host.com",
                repository: "image",
                tag: "tag",
            })).to.equal("my-host.com/_/image:tag");
        });
        it("should correctly compose an id with a host and multi-level namespace", () => {
            (0, chai_1.expect)(helpers_2.containerHelpers.unparseImageId({
                host: "my-host.com",
                namespace: "a/b/c/d",
                repository: "image",
                tag: "tag",
            })).to.equal("my-host.com/a/b/c/d/image:tag");
        });
        it("should throw on an empty name", async () => {
            await (0, helpers_1.expectError)(() => helpers_2.containerHelpers.parseImageId(""), "configuration");
        });
    });
    describe("hasDockerfile", () => {
        it("should return true if module config explicitly sets a Dockerfile", async () => {
            testdouble_1.default.replace(helpers_2.containerHelpers, moduleHasDockerfile, () => true);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const module = graph.getModule("module-a");
            module.spec.dockerfile = moduleConfig_1.defaultDockerfileName;
            testdouble_1.default.reset();
            (0, chai_1.expect)(helpers_2.containerHelpers.moduleHasDockerfile(module, module.version)).to.be.true;
        });
        it("should return true if module sources include a Dockerfile", async () => {
            const config = (await garden.getRawModuleConfigs(["module-a"]))[0];
            const dockerfilePath = (0, path_1.join)(garden.projectRoot, "module-a", moduleConfig_1.defaultDockerfileName);
            const version = (0, lodash_1.cloneDeep)(dummyVersion);
            version.files = [dockerfilePath];
            testdouble_1.default.replace(helpers_2.containerHelpers, "getDockerfileSourcePath", () => dockerfilePath);
            (0, chai_1.expect)(helpers_2.containerHelpers.moduleHasDockerfile(config, version)).to.be.true;
        });
        it("should return false if no Dockerfile is specified or included in sources", async () => {
            const config = (await garden.getRawModuleConfigs(["module-a"]))[0];
            const dockerfilePath = (0, path_1.join)(garden.projectRoot, "module-a", moduleConfig_1.defaultDockerfileName);
            testdouble_1.default.replace(helpers_2.containerHelpers, "getDockerfileSourcePath", () => dockerfilePath);
            (0, chai_1.expect)(helpers_2.containerHelpers.moduleHasDockerfile(config, dummyVersion)).to.be.false;
        });
    });
    describe("autoResolveIncludes", () => {
        let tmpDir;
        let config;
        let dockerfilePath;
        beforeEach(async () => {
            tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
            dockerfilePath = (0, path_1.join)(tmpDir.path, moduleConfig_1.defaultDockerfileName);
            config = {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                type: "container",
                allowPublish: false,
                build: { dependencies: [] },
                disabled: false,
                name: "test",
                path: tmpDir.path,
                serviceConfigs: [],
                spec: {
                    build: { timeout: 999 },
                    buildArgs: {},
                    extraFlags: [],
                    services: [],
                    tasks: [],
                    tests: [],
                },
                taskConfigs: [],
                testConfigs: [],
            };
        });
        afterEach(async () => {
            await tmpDir.cleanup();
        });
        it("should return empty list if no Dockerfile is not found", async () => {
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql([]);
        });
        it("should return all paths in COPY and ADD commands + the Dockerfile path", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo

        ADD file-a .
        COPY file-b file-c file-d d/

        ENTRYPOINT bla
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql([
                "file-a",
                "file-b",
                "file-c",
                "file-d",
                moduleConfig_1.defaultDockerfileName,
            ]);
        });
        it("should handle array style COPY and ADD commands", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD ["file-a", "."]
        COPY ["file-b", "file-c", "file-d", "d/"]
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql([
                "file-a",
                "file-b",
                "file-c",
                "file-d",
                moduleConfig_1.defaultDockerfileName,
            ]);
        });
        it("should ignore URLs", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD http://example.com/bla /
        ADD file-* /
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql(["file-*", moduleConfig_1.defaultDockerfileName]);
        });
        it("should pass globs through", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD file-* /
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql(["file-*", moduleConfig_1.defaultDockerfileName]);
        });
        it("should handle quoted paths", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD "file-a" /
        ADD 'file-b' /
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql(["file-a", "file-b", moduleConfig_1.defaultDockerfileName]);
        });
        it("should ignore --chown arguments", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD --chown=bla file-a /
        COPY --chown=bla file-b file-c /
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql([
                "file-a",
                "file-b",
                "file-c",
                moduleConfig_1.defaultDockerfileName,
            ]);
        });
        it("should ignore COPY statements with a --from argument", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD --chown=bla file-a /
        COPY --from=bla /file-b file-c /
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql(["file-a", moduleConfig_1.defaultDockerfileName]);
        });
        it("should handle COPY statements with multiple arguments in any order", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD --chown=bla file-a /
        COPY --chown=bla --from=bla /file-b file-c /
        COPY --from=bla --chown=bla  /file-c file-d /
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql(["file-a", "Dockerfile"]);
        });
        it("should ignore unknown flag arguments", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD --foo=bla file-a /destination-a
        COPY --bar=bla --keks file-b file-c file-d /destination-b
        COPY --crazynewarg --yes  file-e /destination-c
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql([
                "file-a",
                "file-b",
                "file-c",
                "file-d",
                "file-e",
                "Dockerfile",
            ]);
        });
        it("should ignore paths containing a template string", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, "FROM foo\nADD file-a /\nCOPY file-${foo} file-c /");
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.be.undefined;
        });
        it("should ignore paths containing a naked template string", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, "FROM foo\nADD file-a /\nCOPY file-$foo file-c /");
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.be.undefined;
        });
        it("should pass through paths containing an escaped template string", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, "FROM foo\nADD file-a /\nCOPY file-\\$foo file-c /");
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql([
                "file-a",
                "file-$foo",
                "file-c",
                moduleConfig_1.defaultDockerfileName,
            ]);
        });
        it("should return if any source path is '.'", async () => {
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD . .
        COPY file-b file-c file-d d/
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.be.undefined;
        });
        it("should create a glob for every directory path", async () => {
            await (0, fs_extra_1.mkdir)((0, path_1.join)(tmpDir.path, "dir-a"));
            await (0, fs_extra_1.writeFile)(dockerfilePath, (0, string_1.dedent) `
        FROM foo
        ADD dir-a .
        COPY file-b d/
        `);
            (0, chai_1.expect)(await helpers_2.containerHelpers.autoResolveIncludes(config, log)).to.eql(["dir-a/**/*", "file-b", moduleConfig_1.defaultDockerfileName]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCwrQkFBNkI7QUFDN0IsK0JBQTJCO0FBQzNCLG1DQUFrQztBQUNsQyw0REFBMkI7QUFDM0IsOERBQTZCO0FBQzdCLHVDQUEyQztBQUUzQyxzREFBa0Q7QUFFbEQsOEVBQTZFO0FBQzdFLGlEQUE4RjtBQUM5Riw0REFBa0U7QUFHbEUsb0ZBSTBEO0FBQzFELDBFQUFpSDtBQUNqSCw0REFBa0U7QUFDbEUsMkRBQXVEO0FBR3ZELDhEQUFtRTtBQUVuRSxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLE1BQU0sV0FBVyxHQUFHLElBQUEsb0JBQVUsRUFBQyx3QkFBd0IsQ0FBQyxDQUFBO0lBQ3hELE1BQU0sVUFBVSxHQUFHLElBQUEsb0JBQVUsRUFBQyx3QkFBd0IsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUVuRSxNQUFNLE1BQU0sR0FBRyxJQUFBLHdCQUFZLEdBQUUsQ0FBQTtJQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsaUJBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVUsQ0FBQTtJQUVsRSxNQUFNLFVBQVUsR0FBZ0Q7UUFDOUQsWUFBWSxFQUFFLEtBQUs7UUFDbkIsVUFBVSxFQUFFLCtCQUFtQjtRQUMvQixLQUFLLEVBQUU7WUFDTCxZQUFZLEVBQUUsRUFBRTtTQUNqQjtRQUNELFFBQVEsRUFBRSxLQUFLO1FBQ2YsSUFBSSxFQUFFLE1BQU07UUFDWixJQUFJLEVBQUUsVUFBVTtRQUNoQixJQUFJLEVBQUUsV0FBVztRQUVqQixJQUFJLEVBQUU7WUFDSixLQUFLLEVBQUU7Z0JBQ0wsT0FBTyxFQUFFLCtCQUFxQjthQUMvQjtZQUNELFNBQVMsRUFBRSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEVBQUU7WUFDZCxRQUFRLEVBQUUsRUFBRTtZQUNa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