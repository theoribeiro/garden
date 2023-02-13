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
const testdouble_1 = __importDefault(require("testdouble"));
const container_1 = require("../../../../../src/plugins/container/container");
const helpers_1 = require("../../../../helpers");
const module_1 = require("../../../../../src/types/module");
const chai_1 = require("chai");
const moduleConfig_1 = require("../../../../../src/plugins/container/moduleConfig");
const helpers_2 = require("../../../../../src/plugins/container/helpers");
const constants_1 = require("../../../../../src/constants");
const path_1 = require("path");
// import { DEFAULT_API_VERSION } from "../../../../../src/constants"
// import { ContainerModuleConfig, defaultContainerResources } from "../../../../../src/plugins/container/moduleConfig"
// import { DEFAULT_BUILD_TIMEOUT } from "../../../../../src/plugins/container/helpers"
describe("plugins.container", () => {
    const projectRoot = (0, helpers_1.getDataDir)("test-project-container");
    const modulePath = (0, path_1.resolve)(projectRoot, "module-a");
    const defaultCpu = moduleConfig_1.defaultContainerResources.cpu;
    const defaultMemory = moduleConfig_1.defaultContainerResources.memory;
    const baseConfig = {
        allowPublish: false,
        build: {
            dependencies: [],
        },
        disabled: false,
        apiVersion: constants_1.DEFAULT_API_VERSION,
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
    let garden;
    let ctx;
    let log;
    let containerProvider;
    let graph;
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, container_1.gardenPlugin)()] });
        log = garden.log;
        containerProvider = await garden.resolveProvider(garden.log, "container");
        ctx = await garden.getPluginContext({ provider: containerProvider, templateContext: undefined, events: undefined });
        graph = await garden.getConfigGraph({ log, emit: false });
        testdouble_1.default.replace(garden.buildStaging, "syncDependencyProducts", () => null);
    });
    it("TODO-G2", () => {
        throw "TODO-G2 (all tests need updating)";
    });
    describe("convertContainerModule", () => {
        const getModuleConvertBaseParams = (module) => ({
            baseFields: {
                copyFrom: [],
                disabled: false,
                internal: {
                    basePath: "module-a",
                },
            },
            convertBuildDependency: () => "buildDep",
            convertRuntimeDependencies: () => ["runtimeDep"],
            convertTestName: () => "testName",
            ctx,
            dummyBuild: undefined,
            log,
            module,
            prepareRuntimeDependencies: () => ["preopRuntimeDep"],
            services: [],
            tasks: [],
            tests: [],
        });
        it("creates a Build action if there is a Dockerfile detected", async () => {
            const module = graph.getModule("module-a");
            const result = await (0, container_1.convertContainerModule)(getModuleConvertBaseParams(module));
            const build = result.group.actions.find((a) => a.kind === "Build");
            (0, chai_1.expect)(build).to.exist;
            (0, chai_1.expect)(build.type).to.be.eql("container");
        });
        it("creates a Build action if there is a Dockerfile explicitly configured", async () => {
            const module = graph.getModule("module-a");
            module._config.spec.dockerfile = "Dockerfile";
            const result = await (0, container_1.convertContainerModule)(getModuleConvertBaseParams(module));
            const build = result.group.actions.find((a) => a.kind === "Build");
            (0, chai_1.expect)(build).to.exist;
            (0, chai_1.expect)(build.type).to.be.eql("container");
        });
        it("returns the dummy Build action if no Dockerfile and an exec Build is needed", async () => {
            const module = graph.getModule("module-a");
            module.version.files.pop(); // remove automatically picked up Dockerfile
            const dummyBuild = {
                internal: {
                    basePath: ".",
                },
                kind: "Build",
                name: "dummyBuild",
                spec: {
                    env: {},
                },
                type: "exec",
            };
            const result = await (0, container_1.convertContainerModule)({ ...getModuleConvertBaseParams(module), dummyBuild });
            const build = result.group.actions.find((a) => a.kind === "Build");
            (0, chai_1.expect)(build).to.exist;
            (0, chai_1.expect)(build.type).to.be.eql("exec");
            (0, chai_1.expect)(build.name).to.be.eql("dummyBuild");
        });
        it("sets spec.localId from module image field", async () => {
            const module = graph.getModule("module-a");
            module.spec.image = "customImage";
            const result = await (0, container_1.convertContainerModule)(getModuleConvertBaseParams(module));
            const build = result.group.actions.find((a) => a.kind === "Build");
            (0, chai_1.expect)(build).to.exist;
            (0, chai_1.expect)(build.type).to.be.eql("container");
            (0, chai_1.expect)(build.spec.localId).to.be.eql("customImage");
        });
    });
    describe("version calculations", () => {
        async function getTestModule(moduleConfig) {
            return (0, module_1.moduleFromConfig)({ garden, log, config: moduleConfig, buildDependencies: [], forceVersion: true });
        }
        it("has same build version if nothing is changed", async () => {
            const baseModule = await getTestModule(baseConfig);
            const baseModule2 = await getTestModule(baseConfig);
            (0, chai_1.expect)(baseModule.version.versionString).to.equal(baseModule2.version.versionString);
        });
        it("has different build version if buildArgs are added", async () => {
            const baseModule = await getTestModule(baseConfig);
            const changedBuild = await getTestModule({
                ...baseConfig,
                spec: {
                    ...baseConfig.spec,
                    buildArgs: { foo: "bar" },
                },
            });
            (0, chai_1.expect)(baseModule.version.versionString).to.not.equal(changedBuild.version.versionString);
        });
        it("has different build version if a targetImage is set", async () => {
            const baseModule = await getTestModule(baseConfig);
            const changedBuild = await getTestModule({
                ...baseConfig,
                spec: {
                    ...baseConfig.spec,
                    build: {
                        ...baseConfig.spec.build,
                        targetImage: "foo",
                    },
                },
            });
            (0, chai_1.expect)(baseModule.version.versionString).to.not.equal(changedBuild.version.versionString);
        });
        it("has different build version if extraFlags are added", async () => {
            const baseModule = await getTestModule(baseConfig);
            const changedBuild = await getTestModule({
                ...baseConfig,
                spec: {
                    ...baseConfig.spec,
                    extraFlags: ["foo"],
                },
            });
            (0, chai_1.expect)(baseModule.version.versionString).to.not.equal(changedBuild.version.versionString);
        });
        it("has different build version if dockerfile is changed", async () => {
            const baseModule = await getTestModule(baseConfig);
            const changedBuild = await getTestModule({
                ...baseConfig,
                spec: {
                    ...baseConfig.spec,
                    dockerfile: "foo.Dockerfile",
                },
            });
            (0, chai_1.expect)(baseModule.version.versionString).to.not.equal(changedBuild.version.versionString);
        });
    });
    //   describe("convert", () => {
    //     // TODO-G2: adapt from exec convert tests
    //     it("TODO", () => {
    //       throw "TODO"
    //     })
    //   })
    describe("configureContainerModule", () => {
        const containerModuleConfig = {
            allowPublish: false,
            build: {
                dependencies: [],
            },
            disabled: false,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            name: "module-a",
            path: modulePath,
            type: "container",
            spec: {
                build: {
                    timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                },
                buildArgs: {},
                extraFlags: [],
                services: [
                    {
                        name: "service-a",
                        annotations: {},
                        args: ["echo"],
                        dependencies: [],
                        daemon: false,
                        disabled: false,
                        ingresses: [
                            {
                                annotations: {},
                                path: "/",
                                port: "http",
                            },
                        ],
                        env: {
                            SOME_ENV_VAR: "value",
                        },
                        healthCheck: {
                            httpGet: {
                                path: "/health",
                                port: "http",
                            },
                            livenessTimeoutSeconds: 10,
                            readinessTimeoutSeconds: 10,
                        },
                        limits: {
                            cpu: 123,
                            memory: 456,
                        },
                        cpu: defaultCpu,
                        memory: defaultMemory,
                        ports: [
                            {
                                name: "http",
                                protocol: "TCP",
                                containerPort: 8080,
                                servicePort: 8080,
                            },
                        ],
                        replicas: 1,
                        volumes: [],
                        deploymentStrategy: moduleConfig_1.defaultDeploymentStrategy,
                    },
                ],
                tasks: [
                    {
                        name: "task-a",
                        args: ["echo", "OK"],
                        artifacts: [],
                        cacheResult: true,
                        dependencies: [],
                        disabled: false,
                        env: {
                            TASK_ENV_VAR: "value",
                        },
                        cpu: defaultCpu,
                        memory: defaultMemory,
                        timeout: null,
                        volumes: [],
                    },
                ],
                tests: [
                    {
                        name: "unit",
                        args: ["echo", "OK"],
                        artifacts: [],
                        dependencies: [],
                        disabled: false,
                        env: {
                            TEST_ENV_VAR: "value",
                        },
                        cpu: defaultCpu,
                        memory: defaultMemory,
                        timeout: null,
                        volumes: [],
                    },
                ],
            },
            serviceConfigs: [],
            taskConfigs: [],
            testConfigs: [],
        };
        it("should validate and parse a container module", async () => {
            const result = await (0, container_1.configureContainerModule)({ ctx, moduleConfig: containerModuleConfig, log });
            (0, chai_1.expect)(result).to.eql({
                moduleConfig: {
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    include: [moduleConfig_1.defaultDockerfileName],
                    path: modulePath,
                    type: "container",
                    spec: {
                        build: {
                            timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                        },
                        buildArgs: {},
                        extraFlags: [],
                        services: [
                            {
                                name: "service-a",
                                annotations: {},
                                args: ["echo"],
                                dependencies: [],
                                disabled: false,
                                daemon: false,
                                ingresses: [
                                    {
                                        annotations: {},
                                        path: "/",
                                        port: "http",
                                    },
                                ],
                                env: {
                                    SOME_ENV_VAR: "value",
                                },
                                healthCheck: {
                                    httpGet: { path: "/health", port: "http" },
                                    readinessTimeoutSeconds: 10,
                                    livenessTimeoutSeconds: 10,
                                },
                                limits: {
                                    cpu: 123,
                                    memory: 456,
                                },
                                cpu: defaultCpu,
                                memory: defaultMemory,
                                ports: [{ name: "http", protocol: "TCP", containerPort: 8080, servicePort: 8080 }],
                                replicas: 1,
                                volumes: [],
                                deploymentStrategy: moduleConfig_1.defaultDeploymentStrategy,
                            },
                        ],
                        tasks: [
                            {
                                name: "task-a",
                                args: ["echo", "OK"],
                                artifacts: [],
                                cacheResult: true,
                                dependencies: [],
                                disabled: false,
                                env: {
                                    TASK_ENV_VAR: "value",
                                },
                                cpu: defaultCpu,
                                memory: defaultMemory,
                                timeout: null,
                                volumes: [],
                            },
                        ],
                        tests: [
                            {
                                name: "unit",
                                args: ["echo", "OK"],
                                artifacts: [],
                                dependencies: [],
                                disabled: false,
                                env: {
                                    TEST_ENV_VAR: "value",
                                },
                                cpu: defaultCpu,
                                memory: defaultMemory,
                                timeout: null,
                                volumes: [],
                            },
                        ],
                    },
                    buildConfig: {
                        buildArgs: {},
                        dockerfile: undefined,
                        extraFlags: [],
                        targetImage: undefined,
                    },
                    serviceConfigs: [
                        {
                            name: "service-a",
                            dependencies: [],
                            disabled: false,
                            spec: {
                                name: "service-a",
                                annotations: {},
                                args: ["echo"],
                                dependencies: [],
                                disabled: false,
                                daemon: false,
                                ingresses: [
                                    {
                                        annotations: {},
                                        path: "/",
                                        port: "http",
                                    },
                                ],
                                env: {
                                    SOME_ENV_VAR: "value",
                                },
                                healthCheck: {
                                    httpGet: { path: "/health", port: "http" },
                                    readinessTimeoutSeconds: 10,
                                    livenessTimeoutSeconds: 10,
                                },
                                limits: {
                                    cpu: 123,
                                    memory: 456,
                                },
                                cpu: defaultCpu,
                                memory: defaultMemory,
                                ports: [{ name: "http", protocol: "TCP", containerPort: 8080, servicePort: 8080 }],
                                replicas: 1,
                                volumes: [],
                                deploymentStrategy: moduleConfig_1.defaultDeploymentStrategy,
                            },
                        },
                    ],
                    taskConfigs: [
                        {
                            cacheResult: true,
                            dependencies: [],
                            disabled: false,
                            name: "task-a",
                            spec: {
                                args: ["echo", "OK"],
                                artifacts: [],
                                cacheResult: true,
                                dependencies: [],
                                disabled: false,
                                env: {
                                    TASK_ENV_VAR: "value",
                                },
                                cpu: defaultCpu,
                                memory: defaultMemory,
                                name: "task-a",
                                timeout: null,
                                volumes: [],
                            },
                            timeout: null,
                        },
                    ],
                    testConfigs: [
                        {
                            name: "unit",
                            dependencies: [],
                            disabled: false,
                            spec: {
                                name: "unit",
                                args: ["echo", "OK"],
                                artifacts: [],
                                dependencies: [],
                                disabled: false,
                                env: {
                                    TEST_ENV_VAR: "value",
                                },
                                cpu: defaultCpu,
                                memory: defaultMemory,
                                timeout: null,
                                volumes: [],
                            },
                            timeout: null,
                        },
                    ],
                },
            });
        });
        it("should add service volume modules as build and runtime dependencies", async () => {
            const moduleConfig = {
                allowPublish: false,
                build: {
                    dependencies: [],
                },
                disabled: false,
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "module-a",
                path: modulePath,
                type: "container",
                spec: {
                    build: {
                        timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                    },
                    buildArgs: {},
                    extraFlags: [],
                    services: [
                        {
                            name: "service-a",
                            annotations: {},
                            args: ["echo"],
                            dependencies: [],
                            daemon: false,
                            disabled: false,
                            ingresses: [],
                            env: {},
                            healthCheck: {},
                            limits: {
                                cpu: 123,
                                memory: 456,
                            },
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            ports: [],
                            replicas: 1,
                            volumes: [
                                {
                                    name: "test",
                                    containerPath: "/",
                                    module: "volume-module",
                                },
                            ],
                            deploymentStrategy: moduleConfig_1.defaultDeploymentStrategy,
                        },
                    ],
                    tasks: [],
                    tests: [],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            };
            const result = await (0, container_1.configureContainerModule)({ ctx, moduleConfig, log });
            (0, chai_1.expect)(result.moduleConfig.build.dependencies).to.eql([{ name: "volume-module", copy: [] }]);
            (0, chai_1.expect)(result.moduleConfig.serviceConfigs[0].dependencies).to.eql(["volume-module"]);
        });
        it("should add task volume modules as build and runtime dependencies", async () => {
            const moduleConfig = {
                allowPublish: false,
                build: {
                    dependencies: [],
                },
                disabled: false,
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "module-a",
                path: modulePath,
                type: "container",
                spec: {
                    build: {
                        timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                    },
                    buildArgs: {},
                    extraFlags: [],
                    services: [],
                    tasks: [
                        {
                            name: "task-a",
                            args: [],
                            artifacts: [],
                            cacheResult: true,
                            dependencies: [],
                            disabled: false,
                            env: {},
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            timeout: null,
                            volumes: [
                                {
                                    name: "test",
                                    containerPath: "/",
                                    module: "volume-module",
                                },
                            ],
                        },
                    ],
                    tests: [],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            };
            const result = await (0, container_1.configureContainerModule)({ ctx, moduleConfig, log });
            (0, chai_1.expect)(result.moduleConfig.build.dependencies).to.eql([{ name: "volume-module", copy: [] }]);
            (0, chai_1.expect)(result.moduleConfig.taskConfigs[0].dependencies).to.eql(["volume-module"]);
        });
        it("should add test volume modules as build and runtime dependencies", async () => {
            const moduleConfig = {
                allowPublish: false,
                build: {
                    dependencies: [],
                },
                disabled: false,
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "module-a",
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
                    tests: [
                        {
                            name: "test-a",
                            args: [],
                            artifacts: [],
                            dependencies: [],
                            disabled: false,
                            env: {},
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            timeout: null,
                            volumes: [
                                {
                                    name: "test",
                                    containerPath: "/",
                                    module: "volume-module",
                                },
                            ],
                        },
                    ],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            };
            const result = await (0, container_1.configureContainerModule)({ ctx, moduleConfig, log });
            (0, chai_1.expect)(result.moduleConfig.build.dependencies).to.eql([{ name: "volume-module", copy: [] }]);
            (0, chai_1.expect)(result.moduleConfig.testConfigs[0].dependencies).to.eql(["volume-module"]);
        });
        it("should fail with invalid port in ingress spec", async () => {
            const moduleConfig = {
                allowPublish: false,
                build: {
                    dependencies: [],
                },
                disabled: false,
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "module-a",
                path: modulePath,
                type: "test",
                spec: {
                    build: {
                        timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                    },
                    buildArgs: {},
                    extraFlags: [],
                    services: [
                        {
                            name: "service-a",
                            annotations: {},
                            args: ["echo"],
                            dependencies: [],
                            daemon: false,
                            disabled: false,
                            ingresses: [
                                {
                                    annotations: {},
                                    path: "/",
                                    port: "bla",
                                },
                            ],
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            env: {},
                            ports: [],
                            replicas: 1,
                            volumes: [],
                            deploymentStrategy: moduleConfig_1.defaultDeploymentStrategy,
                        },
                    ],
                    tasks: [
                        {
                            name: "task-a",
                            args: ["echo"],
                            artifacts: [],
                            cacheResult: true,
                            dependencies: [],
                            disabled: false,
                            env: {},
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            timeout: null,
                            volumes: [],
                        },
                    ],
                    tests: [
                        {
                            name: "unit",
                            args: ["echo", "OK"],
                            artifacts: [],
                            dependencies: [],
                            disabled: false,
                            env: {},
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            timeout: null,
                            volumes: [],
                        },
                    ],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            };
            await (0, helpers_1.expectError)(() => (0, container_1.configureContainerModule)({ ctx, moduleConfig, log }), "configuration");
        });
        it("should fail with invalid port in httpGet healthcheck spec", async () => {
            const moduleConfig = {
                allowPublish: false,
                build: {
                    dependencies: [],
                },
                disabled: false,
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "module-a",
                path: modulePath,
                type: "test",
                spec: {
                    build: {
                        timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                    },
                    buildArgs: {},
                    extraFlags: [],
                    services: [
                        {
                            name: "service-a",
                            annotations: {},
                            args: ["echo"],
                            dependencies: [],
                            daemon: false,
                            disabled: false,
                            ingresses: [],
                            env: {},
                            healthCheck: {
                                httpGet: {
                                    path: "/",
                                    port: "bla",
                                },
                            },
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            ports: [],
                            replicas: 1,
                            volumes: [],
                            deploymentStrategy: moduleConfig_1.defaultDeploymentStrategy,
                        },
                    ],
                    tasks: [
                        {
                            name: "task-a",
                            args: ["echo"],
                            artifacts: [],
                            cacheResult: true,
                            dependencies: [],
                            disabled: false,
                            env: {},
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            timeout: null,
                            volumes: [],
                        },
                    ],
                    tests: [],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            };
            await (0, helpers_1.expectError)(() => (0, container_1.configureContainerModule)({ ctx, moduleConfig, log }), "configuration");
        });
        it("should fail with invalid port in tcpPort healthcheck spec", async () => {
            const moduleConfig = {
                allowPublish: false,
                build: {
                    dependencies: [],
                },
                disabled: false,
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "module-a",
                path: modulePath,
                type: "test",
                spec: {
                    build: {
                        timeout: helpers_2.DEFAULT_BUILD_TIMEOUT,
                    },
                    buildArgs: {},
                    extraFlags: [],
                    services: [
                        {
                            name: "service-a",
                            annotations: {},
                            args: ["echo"],
                            dependencies: [],
                            daemon: false,
                            disabled: false,
                            ingresses: [],
                            env: {},
                            healthCheck: {
                                tcpPort: "bla",
                            },
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            ports: [],
                            replicas: 1,
                            volumes: [],
                            deploymentStrategy: moduleConfig_1.defaultDeploymentStrategy,
                        },
                    ],
                    tasks: [
                        {
                            name: "task-a",
                            args: ["echo"],
                            artifacts: [],
                            cacheResult: true,
                            dependencies: [],
                            disabled: false,
                            env: {},
                            cpu: defaultCpu,
                            memory: defaultMemory,
                            timeout: null,
                            volumes: [],
                        },
                    ],
                    tests: [],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            };
            await (0, helpers_1.expectError)(() => (0, container_1.configureContainerModule)({ ctx, moduleConfig, log }), "configuration");
        });
    });
});
//   describe("publishModule", () => {
//     it("should not publish image if module doesn't container a Dockerfile", async () => {
//       const config = cloneDeep(baseConfig)
//       config.spec.image = "some/image"
//       const module = td.object(await getTestModule(config))
//       td.replace(helpers, "hasDockerfile", () => false)
//       const result = await publishModule({ ctx, log, module })
//       expect(result).to.eql({ published: false })
//     })
//     it("should publish image if module contains a Dockerfile", async () => {
//       const config = cloneDeep(baseConfig)
//       config.spec.image = "some/image:1.1"
//       const module = td.object(await getTestModule(config))
//       td.replace(helpers, "hasDockerfile", () => true)
//       td.replace(helpers, "getPublicImageId", () => "some/image:12345")
//       module.outputs["local-image-id"] = "some/image:12345"
//       td.replace(helpers, "dockerCli", async ({ cwd, args, ctx: _ctx }) => {
//         expect(cwd).to.equal(module.buildPath)
//         expect(args).to.eql(["push", "some/image:12345"])
//         expect(_ctx).to.exist
//         return { all: "log" }
//       })
//       const result = await publishModule({ ctx, log, module })
//       expect(result).to.eql({ message: "Published some/image:12345", published: true })
//     })
//     it("should tag image if remote id differs from local id", async () => {
//       const config = cloneDeep(baseConfig)
//       config.spec.image = "some/image:1.1"
//       const module = td.object(await getTestModule(config))
//       td.replace(helpers, "hasDockerfile", () => true)
//       td.replace(helpers, "getPublicImageId", () => "some/image:1.1")
//       module.outputs["local-image-id"] = "some/image:12345"
//       const dockerCli = td.replace(helpers, "dockerCli")
//       const result = await publishModule({ ctx, log, module })
//       expect(result).to.eql({ message: "Published some/image:1.1", published: true })
//       td.verify(
//         dockerCli({
//           cwd: module.buildPath,
//           args: ["tag", "some/image:12345", "some/image:1.1"],
//           log: td.matchers.anything(),
//           ctx: td.matchers.anything(),
//         })
//       )
//       td.verify(
//         dockerCli({
//           cwd: module.buildPath,
//           args: ["push", "some/image:1.1"],
//           log: td.matchers.anything(),
//           ctx: td.matchers.anything(),
//         })
//       )
//     })
//     it("should use specified tag if provided", async () => {
//       const config = cloneDeep(baseConfig)
//       config.spec.image = "some/image:1.1"
//       const module = td.object(await getTestModule(config))
//       td.replace(helpers, "hasDockerfile", () => true)
//       module.outputs["local-image-id"] = "some/image:12345"
//       const dockerCli = td.replace(helpers, "dockerCli")
//       const result = await publishModule({ ctx, log, module, tag: "custom-tag" })
//       expect(result).to.eql({ message: "Published some/image:custom-tag", published: true })
//       td.verify(
//         dockerCli({
//           cwd: module.buildPath,
//           args: ["tag", "some/image:12345", "some/image:custom-tag"],
//           log: td.matchers.anything(),
//           ctx: td.matchers.anything(),
//         })
//       )
//       td.verify(
//         dockerCli({
//           cwd: module.buildPath,
//           args: ["push", "some/image:custom-tag"],
//           log: td.matchers.anything(),
//           ctx: td.matchers.anything(),
//         })
//       )
//     })
//   })
//   describe("checkDockerServerVersion", () => {
//     it("should return if server version is equal to the minimum version", async () => {
//       helpers.checkDockerServerVersion(minDockerVersion)
//     })
//     it("should return if server version is greater than the minimum version", async () => {
//       const version = {
//         client: "99.99",
//         server: "99.99",
//       }
//       helpers.checkDockerServerVersion(version)
//     })
//     it("should throw if server is not reachable (version is undefined)", async () => {
//       const version = {
//         client: minDockerVersion.client,
//         server: undefined,
//       }
//       await expectError(
//         () => helpers.checkDockerServerVersion(version),
//         (err) => {
//           expect(err.message).to.equal("Docker server is not running or cannot be reached.")
//         }
//       )
//     })
//     it("should throw if server version is too old", async () => {
//       const version = {
//         client: minDockerVersion.client,
//         server: "17.06",
//       }
//       await expectError(
//         () => helpers.checkDockerServerVersion(version),
//         (err) => {
//           expect(err.message).to.equal("Docker server needs to be version 17.07.0 or newer (got 17.06)")
//         }
//       )
//     })
//   })
//   describe("getDockerBuildFlags", () => {
//     it("should include extraFlags", async () => {
//       td.replace(helpers, "hasDockerfile", () => true)
//       const buildAction = await getTestBuildAction({
//         allowPublish: false,
//         build: {
//           dependencies: [],
//         },
//         disabled: false,
//         apiVersion: DEFAULT_API_VERSION,
//         name: "module-a",
//         path: modulePath,
//         type: "container",
//         spec: {
//           build: {
//             dependencies: [],
//             timeout: DEFAULT_BUILD_TIMEOUT,
//           },
//           buildArgs: {},
//           extraFlags: ["--cache-from", "some-image:latest"],
//           services: [],
//           tasks: [],
//           tests: [],
//         },
//         serviceConfigs: [],
//         taskConfigs: [],
//         testConfigs: [],
//       })
//       const resolvedBuild = await garden.resolveAction({ action: buildAction, log })
//       const args = getDockerBuildFlags(resolvedBuild)
//       expect(args.slice(-2)).to.eql(["--cache-from", "some-image:latest"])
//     })
//     it("should set GARDEN_MODULE_VERSION", async () => {
//       td.replace(helpers, "hasDockerfile", () => true)
//       const buildAction = await getTestBuildAction({
//         allowPublish: false,
//         build: {
//           dependencies: [],
//         },
//         disabled: false,
//         apiVersion: DEFAULT_API_VERSION,
//         name: "module-a",
//         path: modulePath,
//         type: "container",
//         spec: {
//           build: {
//             dependencies: [],
//             timeout: DEFAULT_BUILD_TIMEOUT,
//           },
//           buildArgs: {},
//           extraFlags: [],
//           services: [],
//           tasks: [],
//           tests: [],
//         },
//         serviceConfigs: [],
//         taskConfigs: [],
//         testConfigs: [],
//       })
//       const resolvedBuild = await garden.resolveAction({ action: buildAction, log })
//       const args = getDockerBuildFlags(resolvedBuild)
//       expect(args.slice(0, 2)).to.eql(["--build-arg", `GARDEN_MODULE_VERSION=${buildAction.versionString()}`])
//     })
//   })
// })
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsNERBQTJCO0FBRzNCLDhFQUt1RDtBQUN2RCxpREFBeUY7QUFHekYsNERBQWdGO0FBQ2hGLCtCQUE2QjtBQUM3QixvRkFPMEQ7QUFFMUQsMEVBQW9GO0FBQ3BGLDREQUFrRTtBQUNsRSwrQkFBOEI7QUFDOUIscUVBQXFFO0FBQ3JFLHVIQUF1SDtBQUN2SCx1RkFBdUY7QUFFdkYsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsd0JBQXdCLENBQUMsQ0FBQTtJQUN4RCxNQUFNLFVBQVUsR0FBRyxJQUFBLGNBQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUE7SUFFbkQsTUFBTSxVQUFVLEdBQUcsd0NBQXlCLENBQUMsR0FBRyxDQUFBO0lBQ2hELE1BQU0sYUFBYSxHQUFHLHdDQUF5QixDQUFDLE1BQU0sQ0FBQTtJQUV0RCxNQUFNLFVBQVUsR0FBMEI7UUFDeEMsWUFBWSxFQUFFLEtBQUs7UUFDbkIsS0FBSyxFQUFFO1lBQ0wsWUFBWSxFQUFFLEVBQUU7U0FDakI7UUFDRCxRQUFRLEVBQUUsS0FBSztRQUNmLFVBQVUsRUFBRSwrQkFBbUI7UUFDL0IsSUFBSSxFQUFFLE1BQU07UUFDWixJQUFJLEVBQUUsVUFBVTtRQUNoQixJQUFJLEVBQUUsV0FBVztRQUVqQixJQUFJLEVBQUU7WUFDSixLQUFLLEVBQUU7Z0JBQ0wsT0FBTyxFQUFFLCtCQUFxQjthQUMvQjtZQUNELFNBQVMsRUFBRSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEVBQUU7WUFDZCxRQUFRLEVBQUUsRUFBRTtZQUNaLEtBQUssRUFBRSxFQUFFO1lBQ1QsS0FBSyxFQUFFLEVBQUU7U0FDVjtRQUVELGNBQWMsRUFBRSxFQUFFO1FBQ2xCLFdBQVcs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