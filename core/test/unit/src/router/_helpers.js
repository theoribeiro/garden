"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouterTestData = void 0;
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const path_1 = require("path");
const common_1 = require("../../../../src/config/common");
const validation_1 = require("../../../../src/config/validation");
const module_types_1 = require("../../../../src/plugin/module-types");
const plugin_1 = require("../../../../src/plugin/plugin");
const providers_1 = require("../../../../src/plugin/providers");
const helpers_1 = require("../../../helpers");
async function getRouterTestData() {
    const { basePlugin, dateUsedForCompleted, returnWrongOutputsCfgKey, testPluginA, testPluginB, } = getRouterUnitTestPlugins();
    const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, {
        plugins: [basePlugin, testPluginA, testPluginB],
        config: (0, helpers_1.createProjectConfig)({
            path: helpers_1.projectRootA,
            providers: [{ name: "base" }, { name: "test-plugin-a" }, { name: "test-plugin-b" }],
        }),
        onlySpecifiedPlugins: true,
    });
    const log = garden.log;
    const actionRouter = await garden.getActionRouter();
    const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
    const module = graph.getModule("module-a");
    const buildAction = graph.getBuild("module-a");
    const resolvedBuildAction = await garden.resolveAction({
        action: buildAction,
        log: garden.log,
        graph: await garden.getConfigGraph({ log: garden.log, emit: false }),
    });
    const deployAction = graph.getDeploy("service-a");
    const resolvedDeployAction = await garden.resolveAction({
        action: deployAction,
        log: garden.log,
        graph: await garden.getConfigGraph({ log: garden.log, emit: false }),
    });
    const runAction = graph.getRun("task-a");
    const resolvedRunAction = await garden.resolveAction({
        action: runAction,
        log: garden.log,
        graph: await garden.getConfigGraph({ log: garden.log, emit: false }),
    });
    return {
        resolvedBuildAction,
        resolvedDeployAction,
        resolvedRunAction,
        garden,
        log,
        graph,
        actionRouter,
        module,
        dateUsedForCompleted,
        returnWrongOutputsCfgKey,
        plugins: {
            basePlugin,
            testPluginA,
            testPluginB,
        },
    };
}
exports.getRouterTestData = getRouterTestData;
function getRouterUnitTestPlugins() {
    function getTestPluginOutputs(params) {
        return { base: "ok", foo: params.action._config[returnWrongOutputsCfgKey] ? 123 : "ok" };
    }
    function validateParams(params, schema) {
        (0, validation_1.validateSchema)(params, schema.keys({
            graph: common_1.joi.object(),
        }));
    }
    const now = new Date();
    const returnWrongOutputsCfgKey = "returnWrong";
    const baseOutputsSchema = () => common_1.joi.object().keys({ base: common_1.joi.string() });
    const testOutputSchema = () => baseOutputsSchema().keys({ foo: common_1.joi.string() });
    const staticOutputsSchema = common_1.joi.object().keys({
        staticKey: common_1.joi.string(),
    });
    const runtimeOutputsSchema = common_1.joi.object().keys({
        runtimeKey: common_1.joi.string(),
        base: common_1.joi.string(),
        foo: common_1.joi.string(),
        plugin: common_1.joi.any().optional(),
        resolvedEnvName: common_1.joi.any().optional(),
        resolvedActionVersion: common_1.joi.any().optional(),
        isTestPluginABuildActionBuildHandlerReturn: common_1.joi.any().optional(),
    });
    const basePlugin = (0, plugin_1.createGardenPlugin)({
        name: "base",
        createModuleTypes: [
            {
                name: "base",
                docs: "bla bla bla",
                moduleOutputsSchema: baseOutputsSchema(),
                needsBuild: true,
                handlers: {},
            },
        ],
        createActionTypes: {
            Build: [
                {
                    name: "base-action-type",
                    docs: "asd",
                    handlers: {
                        getStatus: async (_) => ({ state: "ready", detail: {}, outputs: { foo: "bar", plugin: "base" } }),
                    },
                    schema: common_1.joi.object(),
                },
            ],
        },
    });
    const pluginActionDescriptions = (0, providers_1.getProviderActionDescriptions)();
    const moduleActionDescriptions = (0, module_types_1.getModuleHandlerDescriptions)();
    const testPluginASpec = {
        name: "test-plugin-a",
        dependencies: [{ name: "base" }],
        handlers: {
            configureProvider: async (params) => {
                validateParams(params, pluginActionDescriptions.configureProvider.paramsSchema);
                return { config: params.config };
            },
            getEnvironmentStatus: async (params) => {
                validateParams(params, pluginActionDescriptions.getEnvironmentStatus.paramsSchema);
                return {
                    ready: false,
                    outputs: {},
                };
            },
            augmentGraph: async (params) => {
                validateParams(params, pluginActionDescriptions.augmentGraph.paramsSchema);
                const actionName = "added-by-" + params.ctx.provider.name;
                return {
                    addDependencies: [
                        {
                            by: {
                                kind: "Deploy",
                                name: actionName,
                            },
                            on: {
                                kind: "Build",
                                name: actionName,
                            },
                        },
                    ],
                    addActions: [
                        {
                            kind: "Build",
                            name: actionName,
                            type: "test",
                            internal: {
                                basePath: ".",
                            },
                            spec: {},
                        },
                        {
                            kind: "Deploy",
                            name: actionName,
                            type: "test",
                            internal: {
                                basePath: ".",
                            },
                            spec: {},
                        },
                    ],
                };
            },
            getDashboardPage: async (params) => {
                validateParams(params, pluginActionDescriptions.getDashboardPage.paramsSchema);
                return { url: "http://" + params.page.name };
            },
            getDebugInfo: async (params) => {
                validateParams(params, pluginActionDescriptions.getDebugInfo.paramsSchema);
                return { info: {} };
            },
            prepareEnvironment: async (params) => {
                validateParams(params, pluginActionDescriptions.prepareEnvironment.paramsSchema);
                return { status: { ready: true, outputs: {} } };
            },
            cleanupEnvironment: async (params) => {
                validateParams(params, pluginActionDescriptions.cleanupEnvironment.paramsSchema);
                return {};
            },
        },
        createModuleTypes: [
            {
                name: "test",
                base: "base",
                docs: "bla bla bla",
                moduleOutputsSchema: testOutputSchema(),
                schema: common_1.joi.object(),
                needsBuild: true,
                title: "Bla",
                handlers: {
                    configure: async (params) => {
                        validateParams(params, moduleActionDescriptions.configure.paramsSchema);
                        const serviceConfigs = params.moduleConfig.spec.services.map((spec) => ({
                            name: spec.name,
                            dependencies: spec.dependencies || [],
                            disabled: false,
                            spec,
                        }));
                        const taskConfigs = (params.moduleConfig.spec.tasks || []).map((spec) => ({
                            name: spec.name,
                            dependencies: spec.dependencies || [],
                            disabled: false,
                            spec,
                        }));
                        const testConfigs = (params.moduleConfig.spec.tests || []).map((spec) => ({
                            name: spec.name,
                            dependencies: spec.dependencies || [],
                            disabled: false,
                            spec,
                        }));
                        return {
                            moduleConfig: {
                                ...params.moduleConfig,
                                serviceConfigs,
                                taskConfigs,
                                testConfigs,
                            },
                        };
                    },
                    convert: async (params) => {
                        var _a;
                        validateParams(params, moduleActionDescriptions.convert.paramsSchema);
                        const { module, services, tasks, tests, dummyBuild, convertBuildDependency, convertRuntimeDependencies, } = params;
                        const actions = [];
                        const buildAction = {
                            kind: "Build",
                            type: "test",
                            name: module.name,
                            ...params.baseFields,
                            ...dummyBuild,
                            dependencies: module.build.dependencies.map(convertBuildDependency),
                            spec: {
                                command: (_a = module.spec.build) === null || _a === void 0 ? void 0 : _a.command,
                                env: module.spec.env,
                            },
                        };
                        actions.push(buildAction);
                        for (const service of services) {
                            actions.push({
                                kind: "Deploy",
                                type: "test",
                                name: service.name,
                                ...params.baseFields,
                                disabled: service.disabled,
                                build: buildAction ? buildAction.name : undefined,
                                dependencies: convertRuntimeDependencies(service.spec.dependencies),
                                spec: {
                                    ...(0, lodash_1.omit)(service.spec, ["name", "dependencies", "disabled"]),
                                },
                            });
                        }
                        for (const task of tasks) {
                            actions.push({
                                kind: "Run",
                                type: "test",
                                name: task.name,
                                ...params.baseFields,
                                disabled: task.disabled,
                                build: buildAction ? buildAction.name : undefined,
                                dependencies: convertRuntimeDependencies(task.spec.dependencies),
                                spec: {
                                    ...(0, lodash_1.omit)(task.spec, ["name", "dependencies", "disabled"]),
                                },
                            });
                        }
                        for (const test of tests) {
                            actions.push({
                                kind: "Test",
                                type: "test",
                                name: module.name + "-" + test.name,
                                ...params.baseFields,
                                disabled: test.disabled,
                                build: buildAction ? buildAction.name : undefined,
                                dependencies: convertRuntimeDependencies(test.spec.dependencies),
                                spec: {
                                    ...(0, lodash_1.omit)(test.spec, ["name", "dependencies", "disabled"]),
                                },
                            });
                        }
                        return {
                            group: {
                                // This is an annoying TypeScript limitation :P
                                kind: "Group",
                                name: module.name,
                                path: module.path,
                                actions,
                                variables: module.variables,
                                varfiles: module.varfile ? [module.varfile] : undefined,
                            },
                        };
                    },
                    getModuleOutputs: async (params) => {
                        validateParams(params, moduleActionDescriptions.getModuleOutputs.paramsSchema);
                        return { outputs: { foo: "bar" } };
                    },
                    suggestModules: async () => {
                        return { suggestions: [] };
                    },
                },
            },
        ],
        createActionTypes: {
            Build: [
                {
                    name: "test",
                    docs: "Test Build action",
                    schema: common_1.joi.object(),
                    staticOutputsSchema,
                    runtimeOutputsSchema,
                    base: "base-action-type",
                    handlers: {
                        getStatus: async (_params) => {
                            // This is hacked for the base router tests
                            return {
                                state: "ready",
                                detail: {},
                                outputs: {
                                    foo: "bar",
                                    base: _params.base,
                                    plugin: "test-plugin-a",
                                    resolvedEnvName: _params.ctx.resolveTemplateStrings("${environment.name}"),
                                    resolvedActionVersion: "TODO-G2 (see one line below)",
                                    // resolvedActionVersion: _params.ctx.resolveTemplateStrings("${runtime.build.module-a.version}"),
                                },
                            };
                        },
                        build: async (_params) => {
                            return {
                                state: "ready",
                                detail: {},
                                // This is hacked for the base router tests
                                outputs: { foo: "bar", isTestPluginABuildActionBuildHandlerReturn: true },
                            };
                        },
                        publish: async (_params) => {
                            return { state: "ready", detail: null, outputs: {} };
                        },
                    },
                },
            ],
            Deploy: [
                {
                    name: "test",
                    docs: "Test Deploy action",
                    schema: common_1.joi.object(),
                    staticOutputsSchema,
                    runtimeOutputsSchema,
                    handlers: {
                        getStatus: async (params) => {
                            return {
                                state: "ready",
                                detail: { state: "ready", detail: {} },
                                outputs: getTestPluginOutputs(params),
                            };
                        },
                        deploy: async (params) => {
                            // validateParams(params, moduleActionDescriptions.deployService.paramsSchema)
                            return {
                                state: "ready",
                                detail: { state: "ready", detail: {} },
                                outputs: getTestPluginOutputs(params),
                            };
                        },
                        delete: async (_params) => {
                            return { state: "ready", detail: { state: "ready", detail: {} }, outputs: {} };
                        },
                        exec: async (_params) => {
                            return {
                                code: 0,
                                output: "bla bla",
                            };
                        },
                        getLogs: async (_params) => {
                            return {};
                        },
                        getPortForward: async (params) => {
                            validateParams(params, moduleActionDescriptions.getPortForward.paramsSchema);
                            return {
                                hostname: "bla",
                                port: 123,
                            };
                        },
                        stopPortForward: async (params) => {
                            validateParams(params, moduleActionDescriptions.stopPortForward.paramsSchema);
                            return {};
                        },
                    },
                },
            ],
            Run: [
                {
                    name: "test",
                    docs: "Test Run action",
                    schema: common_1.joi.object(),
                    staticOutputsSchema,
                    runtimeOutputsSchema,
                    handlers: {
                        getResult: async (params) => {
                            return {
                                state: "ready",
                                detail: {
                                    moduleName: params.action.name,
                                    taskName: params.action.name,
                                    command: ["foo"],
                                    completedAt: now,
                                    log: "bla bla",
                                    success: true,
                                    startedAt: now,
                                    version: params.action.versionString(),
                                },
                                outputs: getTestPluginOutputs(params),
                            };
                        },
                        run: async (params) => {
                            // Create artifacts, to test artifact copying
                            for (const artifact of params.action.getSpec().artifacts || []) {
                                await (0, fs_extra_1.ensureFile)((0, path_1.join)(params.artifactsPath, artifact.source));
                            }
                            return {
                                state: "ready",
                                detail: {
                                    moduleName: params.action.name,
                                    taskName: params.action.name,
                                    command: ["foo"],
                                    completedAt: now,
                                    log: "bla bla",
                                    success: true,
                                    startedAt: now,
                                    version: params.action.versionString(),
                                },
                                outputs: getTestPluginOutputs(params),
                            };
                        },
                    },
                },
            ],
            Test: [
                {
                    name: "test",
                    docs: "Test Test action",
                    schema: common_1.joi.object(),
                    handlers: {
                        run: async (params) => {
                            // Create artifacts, to test artifact copying
                            for (const artifact of params.action.getSpec().artifacts || []) {
                                await (0, fs_extra_1.ensureFile)((0, path_1.join)(params.artifactsPath, artifact.source));
                            }
                            return {
                                state: "ready",
                                detail: {
                                    moduleName: params.action.name,
                                    command: [],
                                    completedAt: now,
                                    log: "bla bla",
                                    outputs: {
                                        log: "bla bla",
                                    },
                                    success: true,
                                    startedAt: now,
                                    testName: params.action.name,
                                    version: params.action.versionString(),
                                },
                                outputs: getTestPluginOutputs(params),
                            };
                        },
                        getResult: async (params) => {
                            return {
                                state: "ready",
                                detail: {
                                    moduleName: params.action.name,
                                    command: [],
                                    completedAt: now,
                                    log: "bla bla",
                                    outputs: {
                                        log: "bla bla",
                                    },
                                    success: true,
                                    startedAt: now,
                                    testName: params.action.name,
                                    version: params.action.versionString(),
                                },
                                outputs: getTestPluginOutputs(params),
                            };
                        },
                    },
                },
            ],
        },
    };
    const testPluginA = (0, plugin_1.createGardenPlugin)(testPluginASpec);
    const testPluginB = (0, plugin_1.createGardenPlugin)({
        ...(0, lodash_1.omit)(testPluginASpec, ["createModuleTypes", "createActionTypes"]),
        name: "test-plugin-b",
    });
    return {
        basePlugin,
        testPluginA,
        testPluginB,
        returnWrongOutputsCfgKey,
        dateUsedForCompleted: now,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2hlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCx1Q0FBcUM7QUFDckMsbUNBQTZCO0FBQzdCLCtCQUEyQjtBQUczQiwwREFBdUU7QUFDdkUsa0VBQWtFO0FBQ2xFLHNFQUFrRjtBQUNsRiwwREFBb0Y7QUFDcEYsZ0VBQWtHO0FBQ2xHLDhDQUFvRjtBQUU3RSxLQUFLLFVBQVUsaUJBQWlCO0lBQ3JDLE1BQU0sRUFDSixVQUFVLEVBQ1Ysb0JBQW9CLEVBQ3BCLHdCQUF3QixFQUN4QixXQUFXLEVBQ1gsV0FBVyxHQUNaLEdBQUcsd0JBQXdCLEVBQUUsQ0FBQTtJQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxzQkFBWSxFQUFFO1FBQ2hELE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDO1FBQy9DLE1BQU0sRUFBRSxJQUFBLDZCQUFtQixFQUFDO1lBQzFCLElBQUksRUFBRSxzQkFBWTtZQUNsQixTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsQ0FBQztTQUNwRixDQUFDO1FBQ0Ysb0JBQW9CLEVBQUUsSUFBSTtLQUMzQixDQUFDLENBQUE7SUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO0lBQ3RCLE1BQU0sWUFBWSxHQUFHLE1BQU0sTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBQ25ELE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO0lBQzNFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FB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