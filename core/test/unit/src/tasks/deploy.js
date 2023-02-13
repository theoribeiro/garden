"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("../../../../src/plugin/plugin");
const deploy_1 = require("../../../../src/tasks/deploy");
const chai_1 = require("chai");
const helpers_1 = require("../../../helpers");
const common_1 = require("../../../../src/config/common");
describe("DeployTask", () => {
    let tmpDir;
    let garden;
    let graph;
    let config;
    let testPlugin;
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        config = (0, helpers_1.createProjectConfig)({
            path: tmpDir.path,
            providers: [{ name: "test" }],
        });
        testPlugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            docs: "asd",
            createActionTypes: {
                Build: [
                    {
                        name: "test",
                        docs: "asd",
                        schema: common_1.joi.object(),
                        handlers: {
                            build: async (_) => ({ state: "ready", detail: {}, outputs: {} }),
                        },
                    },
                ],
                Deploy: [
                    {
                        name: "test",
                        docs: "asd",
                        schema: common_1.joi.object(),
                        handlers: {
                            deploy: async (params) => ({
                                state: "ready",
                                detail: { detail: {}, state: "ready" },
                                outputs: { log: params.action.getSpec().log },
                            }),
                            getStatus: async (params) => ({
                                state: "ready",
                                detail: { detail: {}, state: "ready" },
                                outputs: { log: params.action.getSpec().log },
                            }),
                        },
                    },
                ],
                Run: [
                    {
                        name: "test",
                        docs: "asdü",
                        schema: common_1.joi.object(),
                        handlers: {
                            run: async (params) => ({
                                detail: {
                                    completedAt: new Date(),
                                    log: params.action.getSpec().log,
                                    startedAt: new Date(),
                                    success: true,
                                },
                                outputs: {},
                                state: "ready",
                            }),
                        },
                    },
                ],
            },
        });
        garden = await helpers_1.TestGarden.factory(tmpDir.path, { config, plugins: [testPlugin] });
        garden.setActionConfigs([], [
            {
                name: "test-deploy",
                type: "test",
                kind: "Deploy",
                internal: {
                    basePath: "foo",
                },
                dependencies: ["deploy.dep-deploy", "run.test-run"],
                disabled: false,
                spec: {
                    log: "${runtime.tasks.test-run.outputs.log}",
                },
            },
            {
                name: "dep-deploy",
                type: "test",
                kind: "Deploy",
                internal: {
                    basePath: "foo",
                },
                dependencies: [],
                disabled: false,
                spec: {
                    log: "apples and pears",
                },
            },
            {
                name: "test-run",
                type: "test",
                kind: "Run",
                dependencies: [],
                disabled: false,
                timeout: 10,
                internal: {
                    basePath: "./",
                },
                spec: {
                    log: "test output",
                },
            },
        ]);
        graph = await garden.getConfigGraph({ log: garden.log, emit: false });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    describe("resolveProcessDependencies", () => {
        it("should always return deploy action's dependencies having force = false", async () => {
            const action = graph.getDeploy("test-deploy");
            const forcedDeployTask = new deploy_1.DeployTask({
                garden,
                graph,
                action,
                force: true,
                forceBuild: false,
                log: garden.log,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            (0, chai_1.expect)(forcedDeployTask.resolveProcessDependencies({ status: null }).find((dep) => dep.type === "run").force).to
                .be.false;
            const unforcedDeployTask = new deploy_1.DeployTask({
                garden,
                graph,
                action,
                force: false,
                forceBuild: false,
                log: garden.log,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            (0, chai_1.expect)(unforcedDeployTask.resolveProcessDependencies({ status: null }).find((dep) => dep.type === "run").force)
                .to.be.false;
        });
        it("returns just the resolve task if the status is ready", async () => {
            throw "TODO";
        });
        context("when skipRuntimeDependencies = true", () => {
            it("doesn't return deploy or run dependencies", async () => {
                const action = graph.getDeploy("test-deploy");
                const deployTask = new deploy_1.DeployTask({
                    garden,
                    graph,
                    action,
                    force: true,
                    forceBuild: false,
                    log: garden.log,
                    skipRuntimeDependencies: true,
                    devModeDeployNames: [],
                    localModeDeployNames: [],
                });
                const deps = deployTask.resolveProcessDependencies({ status: null });
                (0, chai_1.expect)(deps.find((dep) => dep.type === "deploy" || dep.type === "run")).to.be.undefined;
            });
        });
    });
    describe("process", () => {
        it("should correctly resolve runtime outputs from deploys", async () => {
            const action = graph.getDeploy("test-deploy");
            const deployTask = new deploy_1.DeployTask({
                garden,
                graph,
                action,
                force: true,
                log: garden.log,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            const result = await garden.processTasks({ tasks: [deployTask], throwOnError: true });
            (0, chai_1.expect)(result[deployTask.getBaseKey()].result.outputs).to.eql({ log: "test output" });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVwbG95LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBT0gsMERBQWdGO0FBQ2hGLHlEQUF5RDtBQUN6RCwrQkFBNkI7QUFDN0IsOENBQStFO0FBQy9FLDBEQUFtRDtBQUVuRCxRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtJQUMxQixJQUFJLE1BQTJCLENBQUE7SUFDL0IsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksS0FBa0IsQ0FBQTtJQUN0QixJQUFJLE1BQXFCLENBQUE7SUFDekIsSUFBSSxVQUF3QixDQUFBO0lBRTVCLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQixNQUFNLEdBQUcsTUFBTSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBRS9ELE1BQU0sR0FBRyxJQUFBLDZCQUFtQixFQUFDO1lBQzNCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtZQUNqQixTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztTQUM5QixDQUFDLENBQUE7UUFFRixVQUFVLEdBQUcsSUFBQSwyQkFBa0IsRUFBQztZQUM5QixJQUFJLEVBQUUsTUFBTTtZQUNaLElBQUksRUFBRSxLQUFLO1lBQ1gsaUJBQWlCLEVBQUU7Z0JBQ2pCLEtBQUssRUFBRTtvQkFDTDt3QkFDRSxJQUFJLEVBQUUsTUFBTTt3QkFDWixJQUFJLEVBQUUsS0FBSzt3QkFDWCxNQUFNLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTt3QkFDcEIsUUFBUSxFQUFFOzRCQUNSLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUs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