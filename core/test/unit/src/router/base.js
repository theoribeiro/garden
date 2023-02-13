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
const lodash_1 = require("lodash");
const common_1 = require("../../../../src/config/common");
const plugin_1 = require("../../../../src/plugin/plugin");
const base_1 = require("../../../../src/router/base");
const helpers_1 = require("../../../helpers");
const _helpers_1 = require("./_helpers");
describe("BaseActionRouter", () => {
    const path = helpers_1.projectRootA;
    const _testHandlerResult = {
        detail: {},
        outputs: {
            foo: "bar",
        },
        state: "ready",
    };
    const now = new Date();
    const _testHandlers = {
        build: async () => _testHandlerResult,
        getStatus: async () => _testHandlerResult,
        publish: async () => ({ ..._testHandlerResult, detail: { published: true } }),
        run: async () => ({
            ..._testHandlerResult,
            completedAt: now,
            startedAt: now,
            success: true,
            log: "bla bla",
        }),
    };
    const actionTypesCfg = {
        Build: [
            {
                name: "test",
                docs: "",
                schema: common_1.joi.object(),
                handlers: {
                    build: async () => _testHandlerResult,
                },
            },
        ],
    };
    const createTestPlugin = ({ name, dependencies, actionTypesConfig = actionTypesCfg, }) => {
        return (0, plugin_1.createGardenPlugin)({
            name,
            dependencies: dependencies.map((dep) => ({ name: dep })),
            createActionTypes: actionTypesConfig,
        });
    };
    const createTestRouter = async (plugins, garden) => {
        if (!garden) {
            garden = await (0, helpers_1.makeTestGarden)(path, {
                plugins,
                noTempDir: true,
                onlySpecifiedPlugins: true,
                config: {
                    ...(0, helpers_1.getDefaultProjectConfig)(),
                    providers: plugins.map((p) => ({ name: p.name, dependencies: p.dependencies.map((d) => d.name) })),
                },
            });
        }
        return {
            garden,
            router: (0, base_1.createActionRouter)("Build", // the action kind doesn't matter here, just picked randomly
            {
                garden,
                loadedPlugins: plugins,
                configuredPlugins: plugins,
            }, _testHandlers),
        };
    };
    describe("getHandler", () => {
        it("should return a handler for action- and handler type if one plugin provides it", async () => {
            const plugin = createTestPlugin({ name: "test-plugin", dependencies: [] });
            const { router } = await createTestRouter([plugin]);
            const handler = await router.getHandler({
                handlerType: "build",
                actionType: "test",
            });
            (0, chai_1.expect)(handler.handlerType).to.equal("build");
            (0, chai_1.expect)(handler.actionType).to.equal("test");
            (0, chai_1.expect)(handler.pluginName).to.equal(plugin.name);
        });
        it("should throw if no handler is available", async () => {
            const plugin = createTestPlugin({ name: "test-plugin", dependencies: [] });
            const { router } = await createTestRouter([plugin]);
            await (0, helpers_1.expectError)(() => router.getHandler({
                handlerType: "getOutputs",
                actionType: "test",
            }), "parameter");
        });
        it("should return default handler if it's specified and no provider-defined handler is available", async () => {
            const defaultHandlerOutput = { outputs: { default: true } };
            const plugin = createTestPlugin({ name: "test-plugin", dependencies: [] });
            const { router } = await createTestRouter([plugin]);
            const handler = await router.getHandler({
                handlerType: "getOutputs",
                actionType: "test",
                defaultHandler: async () => defaultHandlerOutput,
            });
            (0, chai_1.expect)(handler.handlerType).to.equal("getOutputs");
            (0, chai_1.expect)(handler.actionType).to.equal("test");
            (0, chai_1.expect)(handler.pluginName).to.equal("_default");
            (0, chai_1.expect)(await handler()).to.equal(defaultHandlerOutput, "it should return the defined default handler");
        });
        context("when no providers extend the action type with requested handler", () => {
            // TODO
            // https://github.com/garden-io/garden/blob/bbe493b16baf35150e2a883bcb5613ef13d54dcd/core/test/unit/src/actions.ts#L1072
        });
        context("plugin extendActionTypes", () => {
            // TODO
        });
        context("when one provider overrides the requested handler on the action type", () => {
            it("should return the handler from the extending provider", async () => {
                const basePlugin = createTestPlugin({ name: "base", dependencies: [] });
                const extencionPlugin = createTestPlugin({ name: "extends", dependencies: ["base"] });
                const { router } = await createTestRouter([basePlugin, extencionPlugin]);
                const handler = await router.getHandler({ handlerType: "build", actionType: "test" });
                (0, chai_1.expect)(handler.handlerType).to.equal("build");
                (0, chai_1.expect)(handler.actionType).to.equal("test");
                (0, chai_1.expect)(handler.pluginName).to.equal(extencionPlugin.name);
            });
        });
        context("when multiple providers override the requested handler on the action type", () => {
            it("should return the handler that is not being overridden by another handler", async () => {
                const basePlugin = createTestPlugin({ name: "base", dependencies: [] });
                const basePlugin2 = createTestPlugin({ name: "base-2", dependencies: ["base"] });
                const extencionPlugin = createTestPlugin({ name: "plugin-that-extends", dependencies: ["base-2"] });
                const { router } = await createTestRouter([basePlugin, basePlugin2, extencionPlugin]);
                const handler = await router.getHandler({ handlerType: "build", actionType: "test" });
                (0, chai_1.expect)(handler.handlerType).to.equal("build");
                (0, chai_1.expect)(handler.actionType).to.equal("test");
                (0, chai_1.expect)(handler.pluginName).to.equal("plugin-that-extends");
            });
            context("when multiple providers are side by side in the dependency graph", () => {
                it("should return the last configured handler for the specified action type", async () => {
                    const basePlugin = createTestPlugin({ name: "base", dependencies: [] });
                    const extencionPlugin1 = createTestPlugin({ name: "extends-1", dependencies: ["base"] });
                    const extencionPlugin2 = createTestPlugin({ name: "extends-2", dependencies: ["base"] });
                    const { router } = await createTestRouter([basePlugin, extencionPlugin1, extencionPlugin2]);
                    const handler = await router.getHandler({ handlerType: "build", actionType: "test" });
                    (0, chai_1.expect)(handler.handlerType).to.equal("build");
                    (0, chai_1.expect)(handler.actionType).to.equal("test");
                    (0, chai_1.expect)(handler.pluginName).to.equal(extencionPlugin2.name);
                });
            });
            context("when the handler was added by a provider and not specified in the creating provider", () => {
                it("should return the added handler", async () => {
                    const basePlugin = createTestPlugin({
                        name: "base",
                        dependencies: [],
                        actionTypesConfig: {
                            Build: [
                                {
                                    name: "test",
                                    docs: "",
                                    schema: common_1.joi.object(),
                                    handlers: {}, // <-- has no handlers
                                },
                            ],
                        },
                    });
                    const extencionPluginThatHasTheHandler = createTestPlugin({
                        name: "extends",
                        dependencies: ["base"],
                        actionTypesConfig: {
                            Build: [
                                {
                                    name: "test",
                                    docs: "",
                                    schema: common_1.joi.object(),
                                    handlers: {
                                        build: async () => _testHandlerResult,
                                    },
                                },
                            ],
                        },
                    });
                    const { router } = await createTestRouter([basePlugin, extencionPluginThatHasTheHandler]);
                    const handler = await router.getHandler({ handlerType: "build", actionType: "test" });
                    (0, chai_1.expect)(handler.handlerType).to.equal("build");
                    (0, chai_1.expect)(handler.actionType).to.equal("test");
                    (0, chai_1.expect)(handler.pluginName).to.equal(extencionPluginThatHasTheHandler.name);
                });
            });
        });
        context("when the action type has a base", () => {
            it("should return the handler for the specific action type, if available", async () => {
                const basePlugin = createTestPlugin({ name: "base", dependencies: [] });
                const plugin2 = createTestPlugin({
                    name: "plugin2",
                    // <- creates, not extends action type
                    dependencies: ["base"],
                    actionTypesConfig: {
                        Build: [
                            {
                                name: "test-action-type-extenction",
                                docs: "",
                                base: "test",
                                schema: common_1.joi.object(),
                                handlers: {
                                    build: async () => _testHandlerResult,
                                },
                            },
                        ],
                    },
                });
                const { router } = await createTestRouter([basePlugin, plugin2]);
                const handler = await router.getHandler({ handlerType: "build", actionType: "test-action-type-extenction" });
                (0, chai_1.expect)(handler.handlerType).to.equal("build");
                (0, chai_1.expect)(handler.actionType).to.equal("test-action-type-extenction");
                (0, chai_1.expect)(handler.pluginName).to.equal(plugin2.name);
            });
            it("should fall back on the base if no specific handler is available", async () => {
                const basePlugin = createTestPlugin({ name: "base", dependencies: [] });
                const plugin2 = createTestPlugin({
                    name: "plugin2",
                    // <- creates, not extends action type
                    dependencies: ["base"],
                    actionTypesConfig: {
                        Build: [
                            {
                                name: "test-action-type-extenction",
                                docs: "",
                                base: "test",
                                schema: common_1.joi.object(),
                                handlers: {}, // <-- no handlers defined
                            },
                        ],
                    },
                });
                const { router } = await createTestRouter([basePlugin, plugin2]);
                const handler = await router.getHandler({ handlerType: "build", actionType: "test-action-type-extenction" });
                (0, chai_1.expect)(handler.handlerType).to.equal("build");
                (0, chai_1.expect)(handler.actionType).to.equal("test");
                (0, chai_1.expect)(handler.pluginName).to.equal(basePlugin.name);
            });
            it("should recursively fall back on the base's bases if needed", async () => {
                const basePlugin = createTestPlugin({ name: "base", dependencies: [] });
                const basePlugin2 = createTestPlugin({
                    name: "base-2",
                    dependencies: ["base"],
                    actionTypesConfig: {
                        Build: [
                            {
                                name: "base-2",
                                docs: "",
                                base: "test",
                                schema: common_1.joi.object(),
                                handlers: {}, // <-- no handlers defined
                            },
                        ],
                    },
                });
                const plugin2 = createTestPlugin({
                    name: "plugin2",
                    // <- creates, not extends action type
                    dependencies: ["base-2"],
                    actionTypesConfig: {
                        Build: [
                            {
                                name: "test-action-type-extenction",
                                docs: "",
                                base: "base-2",
                                schema: common_1.joi.object(),
                                handlers: {}, // <-- no handlers defined
                            },
                        ],
                    },
                });
                const { router } = await createTestRouter([basePlugin, basePlugin2, plugin2]);
                const handler = await router.getHandler({ handlerType: "build", actionType: "test-action-type-extenction" });
                (0, chai_1.expect)(handler.handlerType).to.equal("build");
                (0, chai_1.expect)(handler.actionType).to.equal("test");
                (0, chai_1.expect)(handler.pluginName).to.equal(basePlugin.name);
            });
        });
    });
    describe("callHandler", () => {
        let garden;
        let graph;
        let log;
        let resolvedBuildAction;
        let testPlugins;
        before(async () => {
            const data = await (0, _helpers_1.getRouterTestData)();
            garden = data.garden;
            graph = data.graph;
            log = data.log;
            testPlugins = [data.plugins.basePlugin, data.plugins.testPluginA, data.plugins.testPluginB];
            resolvedBuildAction = data.resolvedBuildAction;
        });
        // TODO: test in a better way
        // I'd love to write something better but there's no time.
        // Currently this router that's returned from the createTestRouter is a brand new instance
        // and does not have anyhing to do with the one already initiated in the garden instance.
        // That's quite confusing and it's necessary to know how the internals work to test all the things.
        // To clean up these tesks the base router logic itself has to be rewritten to be more testable.
        // The test-plugin-a build action getStatus handler is modded for these tests.
        it("should call the specified handler", async () => {
            const { router } = await createTestRouter(testPlugins, garden);
            const result = await router.callHandler({
                handlerType: "build",
                params: { graph, log, action: resolvedBuildAction, events: undefined },
            });
            (0, chai_1.expect)(result.outputs.isTestPluginABuildActionBuildHandlerReturn).to.equal(true);
        });
        it("should should throw if the handler is not found", async () => {
            const { router } = await createTestRouter(testPlugins, garden);
            await (0, helpers_1.expectError)(() => router.callHandler({
                handlerType: "getOutputs",
                params: { graph, log, action: resolvedBuildAction, events: undefined },
            }), { contains: "No 'getOutputs' handler configured for build type" });
        });
        it("should call the handler with a base argument if the handler is overriding another", async () => {
            const { router } = await createTestRouter(testPlugins, garden);
            const result = await router.callHandler({
                handlerType: "getStatus",
                params: { graph, log, action: resolvedBuildAction, events: undefined },
            });
            (0, chai_1.expect)(result.outputs.base).to.not.be.undefined;
            (0, chai_1.expect)(await result.outputs.base().outputs.plugin).to.equal("base");
        });
        it("should recursively override the base parameter when calling a base handler", async () => {
            throw "TODO-G2: write this test after the above is fixed";
        });
        it("should call the handler with the template context for the provider", async () => {
            const { router } = await createTestRouter(testPlugins, garden);
            const result = await router.callHandler({
                handlerType: "getStatus",
                params: { graph, log, action: resolvedBuildAction, events: undefined },
            });
            (0, chai_1.expect)(result.outputs.resolvedEnvName).to.equal("default");
        });
        it("should call the handler with the template context for the action", async () => {
            const { router } = await createTestRouter(testPlugins, garden);
            const result = await router.callHandler({
                handlerType: "getStatus",
                params: { graph, log, action: resolvedBuildAction, events: undefined },
            });
            // TODO-G2: see test-plugin-a build getStatus handler comment
            (0, chai_1.expect)(result.outputs.resolvedActionVersion).to.equal("a valid version string");
        });
    });
    describe("validateActionOutputs", () => {
        let resolvedBuildAction;
        let testPlugins;
        before(async () => {
            const data = await (0, _helpers_1.getRouterTestData)();
            testPlugins = [data.plugins.basePlugin, data.plugins.testPluginA];
            resolvedBuildAction = data.resolvedBuildAction;
        });
        it("validates static outputs", async () => {
            const { router } = await createTestRouter(testPlugins);
            await (0, helpers_1.expectError)(async () => await router.validateActionOutputs(resolvedBuildAction, "static", { staticKey: 123 }), {
                contains: ["Error validating static action outputs from Build", "key .staticKey must be a string."],
            });
        });
        it("validates runtime outputs", async () => {
            const { router } = await createTestRouter(testPlugins);
            await (0, helpers_1.expectError)(async () => await router.validateActionOutputs(resolvedBuildAction, "runtime", { foo: 123 }), {
                contains: "Error validating runtime action outputs from Build 'module-a': key .foo must be a string.",
            });
        });
        it("throws if no schema is set and a key is set", async () => {
            throw "TODO";
        });
        it("validates against base schemas", async () => {
            const plugins = (0, lodash_1.cloneDeep)({ base: testPlugins[0], pluginA: testPlugins[1] });
            delete plugins.pluginA.createActionTypes.Build[0].runtimeOutputsSchema;
            delete plugins.pluginA.createActionTypes.Build[0].staticOutputsSchema;
            plugins.base.createActionTypes.Build[0].runtimeOutputsSchema = common_1.joi.object().keys({
                thisPropertyFromBaseMustBePresent: common_1.joi.number(),
            });
            const { router } = await createTestRouter([plugins.base, plugins.pluginA]);
            await (0, helpers_1.expectError)(async () => await router.validateActionOutputs(resolvedBuildAction, "runtime", {
                thisPropertyFromBaseMustBePresent: "this should be a number",
            }), {
                contains: "key .thispropertyfrombasemustbepresent must be a number",
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsbUNBQWtDO0FBRWxDLDBEQUFtRDtBQUluRCwwREFBZ0Y7QUFDaEYsc0RBQWdFO0FBQ2hFLDhDQUFpSDtBQUNqSCx5Q0FBOEM7QUFFOUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtJQUNoQyxNQUFNLElBQUksR0FBRyxzQkFBWSxDQUFBO0lBQ3pCLE1BQU0sa0JBQWtCLEdBQUc7UUFDekIsTUFBTSxFQUFFLEVBQUU7UUFDVixPQUFPLEVBQUU7WUFDUCxHQUFHLEVBQUUsS0FBSztTQUNYO1FBQ0QsS0FBSyxFQUFFLE9BQWtCO0tBQzFCLENBQUE7SUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFBO0lBQ3RCLE1BQU0sYUFBYSxHQUFHO1FBQ3BCLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLGtCQUFrQjtRQUNyQyxTQUFTLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxrQkFBa0I7UUFDekMsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7UUFDN0UsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNoQixHQUFHLGtCQUFrQjtZQUNyQixXQUFXLEVBQUUsR0FBRztZQUNoQixTQUFTLEVBQUUsR0FBRztZQUNkLE9BQU8sRUFBRSxJQUFJO1lBQ2IsR0FBRyxFQUFFLFNBQVM7U0FDZixDQUFDO0tBQ0gsQ0FBQTtJQUdELE1BQU0sY0FBYyxHQUFHO1FBQ3JCLEtBQUssRUFBRTtZQUNMO2dCQUNFLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxFQUFFO2dCQUNSLE1BQU0sRUFBRSxZ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