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
const plugin_1 = require("../../../../src/plugin/plugin");
const run_1 = require("../../../../src/tasks/run");
const common_1 = require("../../../../src/config/common");
describe("RunTask", () => {
    let tmpDir;
    let config;
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        config = (0, helpers_1.createProjectConfig)({
            path: tmpDir.path,
            providers: [{ name: "test" }],
        });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    describe("process", () => {
        let cache = {};
        beforeEach(() => {
            cache = {};
        });
        const testPlugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            createActionTypes: {
                Run: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object(),
                        handlers: {
                            run: async (params) => {
                                const log = new Date().getTime().toString();
                                const result = {
                                    state: "ready",
                                    detail: {
                                        completedAt: new Date(),
                                        log: params.action.getSpec().command.join(" "),
                                        startedAt: new Date(),
                                        success: true,
                                    },
                                    outputs: { log },
                                };
                                cache[params.action.key()] = result;
                                return result;
                            },
                            getResult: async (params) => {
                                return (cache[params.action.key()] || {
                                    state: "not-ready",
                                    outputs: {},
                                });
                            },
                        },
                    },
                ],
            },
        });
        it("should cache results", async () => {
            var _a, _b;
            const garden = await helpers_1.TestGarden.factory(tmpDir.path, { config, plugins: [testPlugin] });
            garden.setActionConfigs([], [
                {
                    name: "test",
                    type: "test",
                    kind: "Run",
                    dependencies: [],
                    disabled: false,
                    timeout: 10,
                    internal: {
                        basePath: "./",
                    },
                    spec: {
                        command: ["echo", "this is a test lalala kumiko"],
                    },
                },
            ]);
            let graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            let taskTask = new run_1.RunTask({
                garden,
                graph,
                action: graph.getRun("test"),
                force: false,
                forceBuild: false,
                log: garden.log,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            let result = await garden.processTasks({ tasks: [taskTask], throwOnError: true });
            const logA = (_a = result.results.getAll()[0]) === null || _a === void 0 ? void 0 : _a.outputs;
            result = await garden.processTasks({ tasks: [taskTask], throwOnError: true });
            const logB = (_b = result.results.getAll()[0]) === null || _b === void 0 ? void 0 : _b.outputs;
            // Expect the same log from the second run
            (0, chai_1.expect)(logA).to.eql(logB);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBR0gsK0JBQTZCO0FBQzdCLDhDQUErRTtBQUUvRSwwREFBa0U7QUFDbEUsbURBQW1EO0FBRW5ELDBEQUFtRDtBQUVuRCxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtJQUN2QixJQUFJLE1BQTJCLENBQUE7SUFDL0IsSUFBSSxNQUFxQixDQUFBO0lBRXpCLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQixNQUFNLEdBQUcsTUFBTSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBRS9ELE1BQU0sR0FBRyxJQUFBLDZCQUFtQixFQUFDO1lBQzNCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtZQUNqQixTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztTQUM5QixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNmLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ3hCLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDdkIsSUFBSSxLQUFLLEdBQW9DLEVBQUUsQ0FBQTtRQUUvQyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ2QsS0FBSyxHQUFHLEVBQUUsQ0FBQTtRQUNaLENBQUMsQ0FBQyxDQUFBO1FBRUYsTUFBTSxVQUFVLEdBQUcsSUFBQSwyQkFBa0IsRUFBQztZQUNwQyxJQUFJLEVBQUUsTUFBTTtZQUNaLGlCQUFpQixFQUFFO2dCQUNqQixHQUFHLEVBQUU7b0JBQ0g7d0JBQ0UsSUFBSSxFQUFFLE1BQU07d0JBQ1osSUFBSSxFQUFFLE1BQU07d0JBQ1osTUFBTSxF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