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
const provider_1 = require("../../../../src/config/provider");
const _helpers_1 = require("./_helpers");
describe("provider actions", async () => {
    let garden;
    let actionRouter;
    let log;
    let graph;
    before(async () => {
        const data = await (0, _helpers_1.getRouterTestData)();
        garden = data.garden;
        actionRouter = data.actionRouter;
        log = data.log;
        graph = data.graph;
    });
    describe("configureProvider", () => {
        it("should configure the provider", async () => {
            const config = { name: "test-plugin-a", foo: "bar", dependencies: [] };
            const result = await actionRouter.provider.configureProvider({
                ctx: await garden.getPluginContext({
                    provider: (0, provider_1.providerFromConfig)({
                        plugin: await garden.getPlugin("test-plugin-a"),
                        config,
                        dependencies: {},
                        moduleConfigs: [],
                        status: { ready: false, outputs: {} },
                    }),
                    templateContext: undefined,
                    events: undefined,
                }),
                namespace: "default",
                environmentName: "default",
                pluginName: "test-plugin-a",
                log,
                config,
                configStore: garden.configStore,
                projectName: garden.projectName,
                projectRoot: garden.projectRoot,
                dependencies: {},
            });
            (0, chai_1.expect)(result).to.eql({
                config,
                moduleConfigs: [],
            });
        });
    });
    describe("augmentGraph", () => {
        it("should return modules and/or dependency relations to add to the stack graph", async () => {
            var _a;
            graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const providers = await garden.resolveProviders(garden.log);
            const result = await actionRouter.provider.augmentGraph({
                log,
                pluginName: "test-plugin-a",
                actions: graph.getActions(),
                providers,
                events: undefined,
            });
            (0, chai_1.expect)(result.addDependencies).to.eql([
                {
                    by: {
                        kind: "Deploy",
                        name: "added-by-test-plugin-a",
                    },
                    on: {
                        kind: "Build",
                        name: "added-by-test-plugin-a",
                    },
                },
            ]);
            (0, chai_1.expect)((_a = result.addActions) === null || _a === void 0 ? void 0 : _a.map((a) => ({ name: a.name, kind: a.kind }))).to.eql([
                {
                    name: "added-by-test-plugin-a",
                    kind: "Build",
                },
                {
                    name: "added-by-test-plugin-a",
                    kind: "Deploy",
                },
            ]);
        });
    });
    describe("getDashboardPage", () => {
        it("should resolve the URL for a dashboard page", async () => {
            const page = {
                name: "foo",
                title: "Foo",
                description: "foodefoodefoo",
                newWindow: false,
            };
            const result = await actionRouter.provider.getDashboardPage({
                log,
                pluginName: "test-plugin-a",
                page,
                events: undefined,
            });
            (0, chai_1.expect)(result).to.eql({
                url: "http://foo",
            });
        });
    });
    describe("getEnvironmentStatus", () => {
        it("should return the environment status for a provider", async () => {
            const result = await actionRouter.provider.getEnvironmentStatus({
                log,
                pluginName: "test-plugin-a",
                events: undefined,
            });
            (0, chai_1.expect)(result).to.eql({
                ready: false,
                outputs: {},
            });
        });
    });
    describe("prepareEnvironment", () => {
        it("should prepare the environment for a configured provider", async () => {
            const result = await actionRouter.provider.prepareEnvironment({
                log,
                pluginName: "test-plugin-a",
                force: false,
                status: { ready: true, outputs: {} },
                events: undefined,
            });
            (0, chai_1.expect)(result).to.eql({
                status: {
                    ready: true,
                    outputs: {},
                },
            });
        });
    });
    describe("cleanupEnvironment", () => {
        it("should clean up environment for a provider", async () => {
            const result = await actionRouter.provider.cleanupEnvironment({
                log,
                pluginName: "test-plugin-a",
                events: undefined,
            });
            (0, chai_1.expect)(result).to.eql({});
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3Qiw4REFBb0U7QUFNcEUseUNBQThDO0FBRTlDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLElBQUksRUFBRTtJQUN0QyxJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxZQUEwQixDQUFBO0lBQzlCLElBQUksR0FBYSxDQUFBO0lBQ2pCLElBQUksS0FBa0IsQ0FBQTtJQUV0QixNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLDRCQUFpQixHQUFFLENBQUE7UUFDdEMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDcEIsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUE7UUFDaEMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7UUFDZCxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtJQUNwQixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsRUFBRSxDQUFDLCtCQUErQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdDLE1BQU0sTUFBTSxHQUFHLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsQ0FBQTtZQUN0RSxNQUFNLE1BQU0sR0FBRyxNQUFNLFlBQVksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQzNELEdBQUcsRUFBRSxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDakMsUUFBUSxFQUFFLElBQUEsNkJBQWtCLEVBQUM7d0JBQzNCLE1BQU0sRUFBRSxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDO3dCQUMvQyxNQUFNO3dC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