"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../helpers");
const outputs_1 = require("../../../src/outputs");
const chai_1 = require("chai");
const fs_extra_1 = require("fs-extra");
const plugin_1 = require("../../../src/plugin/plugin");
const constants_1 = require("../../../src/constants");
const common_1 = require("../../../src/config/common");
describe("resolveProjectOutputs", () => {
    let tmpDir;
    let tmpPath;
    let projectConfig;
    beforeEach(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
        projectConfig = (0, helpers_1.createProjectConfig)({
            path: tmpPath,
            providers: [{ name: "test" }],
        });
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    it("should return immediately if there are no outputs specified", async () => {
        const garden = await helpers_1.TestGarden.factory(tmpPath, {
            config: projectConfig,
        });
        const outputs = await (0, outputs_1.resolveProjectOutputs)(garden, garden.log);
        (0, chai_1.expect)(outputs).to.eql([]);
    });
    it("should resolve provider output template references", async () => {
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            handlers: {
                async getEnvironmentStatus() {
                    return { ready: true, outputs: { test: "test-value" } };
                },
            },
        });
        projectConfig.outputs = [{ name: "test", value: "${providers.test.outputs.test}" }];
        const garden = await helpers_1.TestGarden.factory(tmpPath, {
            plugins: [plugin],
            config: projectConfig,
        });
        const outputs = await (0, outputs_1.resolveProjectOutputs)(garden, garden.log);
        (0, chai_1.expect)(outputs).to.eql([{ name: "test", value: "test-value" }]);
    });
    it("should resolve module output template references", async () => {
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            handlers: {
                async getEnvironmentStatus() {
                    return { ready: true, outputs: { test: "test-value" } };
                },
            },
            createModuleTypes: [
                {
                    name: "test",
                    docs: "test",
                    needsBuild: false,
                    handlers: {
                        async getModuleOutputs({ moduleConfig }) {
                            return { outputs: moduleConfig.spec.outputs };
                        },
                        convert: async (_params) => ({}),
                    },
                },
            ],
        });
        projectConfig.outputs = [{ name: "test", value: "${modules.test.outputs.test}" }];
        const garden = await helpers_1.TestGarden.factory(tmpPath, {
            plugins: [plugin],
            config: projectConfig,
        });
        garden.setActionConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                allowPublish: false,
                build: { dependencies: [] },
                disabled: false,
                name: "test",
                path: tmpPath,
                serviceConfigs: [],
                taskConfigs: [],
                spec: {
                    outputs: {
                        test: "test-value",
                    },
                },
                testConfigs: [],
                type: "test",
            },
        ]);
        const outputs = await (0, outputs_1.resolveProjectOutputs)(garden, garden.log);
        (0, chai_1.expect)(outputs).to.eql([{ name: "test", value: "test-value" }]);
    });
    it("should resolve service runtime output references", async () => {
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            handlers: {},
            createModuleTypes: [
                {
                    docs: "asd",
                    name: "test",
                    needsBuild: false,
                    handlers: {
                        convert: async (_params) => ({}),
                    },
                },
            ],
            createActionTypes: {
                Deploy: [
                    {
                        docs: "asd",
                        name: "test",
                        schema: common_1.joi.object(),
                        handlers: {
                            getOutputs: async (params) => ({ outputs: params.action.getSpec().outputs }),
                            getStatus: async (params) => ({
                                detail: { outputs: params.action.getSpec().outputs, state: "ready", detail: {} },
                                outputs: params.action.getSpec().outputs,
                                state: "ready",
                            }),
                        },
                    },
                ],
            },
        });
        projectConfig.outputs = [{ name: "test", value: "${runtime.services.test.outputs.test}" }];
        const garden = await helpers_1.TestGarden.factory(tmpPath, {
            plugins: [plugin],
            config: projectConfig,
        });
        garden.setActionConfigs([], [
            {
                name: "test",
                type: "test",
                internal: {
                    basePath: "asd",
                },
                kind: "Deploy",
                spec: {
                    outputs: {
                        test: "test-value",
                    },
                },
            },
        ]);
        const outputs = await (0, outputs_1.resolveProjectOutputs)(garden, garden.log);
        (0, chai_1.expect)(outputs).to.eql([{ name: "test", value: "test-value" }]);
    });
    it("should resolve run runtime output references", async () => {
        const result = {
            detail: {
                success: true,
                completedAt: new Date(),
                log: "hello",
                startedAt: new Date(),
            },
            outputs: { log: "hello" },
            state: "ready",
        };
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            handlers: {},
            createModuleTypes: [
                {
                    docs: "asd",
                    name: "test",
                    needsBuild: false,
                    handlers: {
                        convert: async (_params) => ({}),
                    },
                },
            ],
            createActionTypes: {
                Run: [
                    {
                        docs: "asd",
                        name: "test",
                        schema: common_1.joi.object(),
                        handlers: {
                            getOutputs: async (params) => ({ outputs: params.action.getSpec().outputs }),
                            run: async (_params) => result,
                            getResult: async (_params) => result,
                        },
                    },
                ],
            },
        });
        projectConfig.outputs = [{ name: "test", value: "${runtime.tasks.test.outputs.log}" }];
        const garden = await helpers_1.TestGarden.factory(tmpPath, {
            plugins: [plugin],
            config: projectConfig,
        });
        garden.setActionConfigs([], [
            {
                name: "test",
                type: "test",
                internal: {
                    basePath: "asd",
                },
                kind: "Run",
                spec: {
                    outputs: {
                        test: "test-value",
                    },
                },
            },
        ]);
        const outputs = await (0, outputs_1.resolveProjectOutputs)(garden, garden.log);
        (0, chai_1.expect)(outputs).to.eql([{ name: "test", value: "hello" }]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm91dHB1dHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFHSCwyQ0FBNEU7QUFDNUUsa0RBQTREO0FBQzVELCtCQUE2QjtBQUM3Qix1Q0FBbUM7QUFDbkMsdURBQStEO0FBRS9ELHNEQUE0RDtBQUM1RCx1REFBZ0Q7QUFFaEQsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtJQUNyQyxJQUFJLE1BQTJCLENBQUE7SUFDL0IsSUFBSSxPQUFlLENBQUE7SUFDbkIsSUFBSSxhQUE0QixDQUFBO0lBRWhDLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQy9ELE9BQU8sR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFckMsYUFBYSxHQUFHLElBQUEsNkJBQW1CLEVBQUM7WUFDbEMsSUFBSSxFQUFFLE9BQU87WUFDYixTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztTQUM5QixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUN4QixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMzRSxNQUFNLE1BQU0sR0FBRyxNQUFNLG9CQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUMvQyxNQUFNLEVBQUUsYUFBYTtTQUN0QixDQUFDLENBQUE7UUFDRixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsK0JBQXFCLEVBQUMsTUFB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