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
const helpers_1 = require("../../../helpers");
const deploy_1 = require("../../../../src/tasks/deploy");
const plugin_1 = require("../../../../src/plugin/plugin");
const common_1 = require("../../../../src/config/common");
// TODO-G2: consider merging it with ./deploy.ts
describe("DeployTask", () => {
    let tmpDir;
    let config;
    let testPlugin;
    let garden;
    const actionConfig = [
        {
            name: "test-deploy",
            type: "test",
            kind: "Deploy",
            dependencies: ["run.test-run"],
            internal: {
                basePath: "foo",
            },
            spec: {
                log: "${runtime.tasks.test-run.outputs.log}",
            },
        },
        {
            name: "test-run",
            type: "test",
            kind: "Run",
            internal: {
                basePath: "foo",
            },
            spec: {
                log: "cool log",
            },
        },
    ];
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        config = (0, helpers_1.createProjectConfig)({
            path: tmpDir.path,
            providers: [{ name: "test" }],
        });
        testPlugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            createActionTypes: {
                Deploy: [
                    {
                        name: "test",
                        docs: "asd",
                        schema: common_1.joi.object(),
                        handlers: {
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
                            getResult: async (params) => ({
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
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    describe("process", () => {
        it("should correctly resolve runtime outputs from tasks", async () => {
            var _a;
            garden.setActionConfigs([], actionConfig);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
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
            (0, chai_1.expect)((_a = result.results.getResult(deployTask)) === null || _a === void 0 ? void 0 : _a.outputs).to.eql({ log: "cool log" });
        });
        it("should set status to unknown if runtime variables can't be resolved", async () => {
            var _a, _b;
            garden.setActionConfigs([], actionConfig);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
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
            (0, chai_1.expect)((_b = (_a = result.results.getResult(deployTask)) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b.state).to.equal("unknown");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXNlcnZpY2Utc3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0LXNlcnZpY2Utc3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBS0gsK0JBQTZCO0FBQzdCLDhDQUErRTtBQUMvRSx5REFBeUQ7QUFDekQsMERBQWdGO0FBQ2hGLDBEQUFtRDtBQUduRCxnREFBZ0Q7QUFDaEQsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFDMUIsSUFBSSxNQUEyQixDQUFBO0lBQy9CLElBQUksTUFBcUIsQ0FBQTtJQUN6QixJQUFJLFVBQXdCLENBQUE7SUFDNUIsSUFBSSxNQUFrQixDQUFBO0lBRXRCLE1BQU0sWUFBWSxHQUFtQjtRQUNuQztZQUNFLElBQUksRUFBRSxhQUFhO1lBQ25CLElBQUksRUFBRSxNQUFNO1lBQ1osSUFBSSxFQUFFLFFBQVE7WUFDZCxZQUFZLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDOUIsUUFBUSxFQUFFO2dCQUNSLFFBQVEsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsSUFBSSxFQUFFO2dCQUNKLEdBQUcsRUFBRSx1Q0FBdUM7YUFDN0M7U0FDRjtRQUNEO1lBQ0UsSUFBSSxFQUFFLFVBQVU7WUFDaEIsSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsS0FBSztZQUNYLFFBQVEsRUFBRTtnQkFDUixRQUFRLEVBQUUsS0FBSzthQUNoQjtZQUNELElBQUksRUFBRTtnQkFDSixHQUFHLEVBQUUsVUFBVTthQUNoQjtTQUNGO0tBQ0YsQ0FBQTtJQUVELE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQixNQUFNLEdBQUcsTUFBTSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBRS9ELE1BQU0sR0FBRyxJQUFBLDZCQUFtQixFQUFDO1lBQzNCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtZ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