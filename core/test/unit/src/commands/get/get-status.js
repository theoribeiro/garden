"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../../../helpers");
const get_status_1 = require("../../../../../src/commands/get/get-status");
const helpers_2 = require("../../../../helpers");
const chai_1 = require("chai");
const logger_1 = require("../../../../../src/logger/logger");
const testing_1 = require("../../../../../src/util/testing");
describe("GetStatusCommand", () => {
    const command = new get_status_1.GetStatusCommand();
    describe("action", () => {
        it("returns statuses for all actions in a project", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const { result } = await garden.runCommand({
                command,
                args: {},
                opts: {},
            });
            (0, chai_1.expect)(result).to.eql({
                providers: {
                    "exec": {
                        ready: true,
                        outputs: {},
                    },
                    "container": {
                        ready: true,
                        outputs: {},
                    },
                    "templated": {
                        ready: true,
                        outputs: {},
                    },
                    "test-plugin": {
                        ready: true,
                        outputs: {
                            testKey: "testValue",
                        },
                    },
                    "test-plugin-b": {
                        ready: true,
                        outputs: {
                            testKey: "testValue",
                        },
                    },
                },
                actions: {
                    Build: {
                        "module-b": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "module-c": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "module-a": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                    },
                    Deploy: {
                        "service-b": {
                            state: "ready",
                            detail: {
                                state: "ready",
                                detail: {},
                                forwardablePorts: [],
                                outputs: {},
                            },
                            outputs: {},
                        },
                        "service-c": {
                            state: "ready",
                            detail: {
                                state: "ready",
                                detail: {},
                                forwardablePorts: [],
                                outputs: {},
                            },
                            outputs: {},
                        },
                        "service-a": {
                            state: "ready",
                            detail: {
                                state: "ready",
                                detail: {},
                                forwardablePorts: [],
                                outputs: {},
                            },
                            outputs: {},
                        },
                    },
                    Test: {
                        "module-b-unit": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "module-c-unit": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "module-c-integ": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "module-a-unit": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "module-a-integration": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                    },
                    Run: {
                        "task-b": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "task-c": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "task-a": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                        "task-a2": {
                            state: "not-ready",
                            detail: null,
                            outputs: {},
                        },
                    },
                },
            });
        });
        it("should warn if a service's status can't be resolved", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            await garden.setTestActionStatus({
                log,
                kind: "Deploy",
                name: "service-a",
                status: {
                    state: "unknown",
                    detail: { state: "unknown", detail: {} },
                    outputs: {},
                },
            });
            await command.action({
                garden,
                log,
                args: {},
                opts: (0, helpers_2.withDefaultGlobalOpts)({}),
                headerLog: log,
                footerLog: log,
            });
            const logMessages = (0, testing_1.getLogMessages)(log, (l) => l.level === logger_1.LogLevel.warn);
            (0, chai_1.expect)(logMessages).to.include("Unable to resolve status for Deploy service-a. It is likely missing or outdated. This can come up if the deployment has runtime dependencies that are not resolvable, i.e. not deployed or invalid.");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXN0YXR1cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC1zdGF0dXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxpREFBcUQ7QUFDckQsMkVBQTZFO0FBQzdFLGlEQUEyRDtBQUMzRCwrQkFBNkI7QUFDN0IsNkRBQTJEO0FBQzNELDZEQUFnRTtBQUVoRSxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLE1BQU0sT0FBTyxHQUFHLElBQUksNkJBQWdCLEVBQUUsQ0FBQTtJQUV0QyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtRQUN0QixFQUFFLENBQUMsK0NBQStDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtZQUV0QyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDO2dCQUN6QyxPQUFPO2dCQUNQLElBQUksRUFBRSxFQUFFO2dCQUNSLElBQUksRUFBRSxFQUFFO2FBQ1QsQ0FBQyxDQUFBO1lBRUYsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDcEIsU0FBUyxFQUFFO29CQUNULE1BQU0sRUFBRTt3QkFDTixLQUFLLEVBQUUsSUFBSTt3QkFDWCxPQUFPLEVBQUUsRUFBRTtxQkFDWjtvQkFDRCxXQUFXLEVBQUU7d0JBQ1gsS0FBSyxFQUFFLElBQUk7d0JBQ1gsT0FBTyxFQUFFLEVBQUU7cUJBQ1o7b0JBQ0QsV0FBVyxFQUFFO3dCQUNYLEtBQUssRUFBRSxJQUFJO3dCQUNYLE9BQU8sRUFBRSxFQUFFO3FCQUNaO29CQUNELGFBQWEsRUFBRTt3QkFDYixLQUFLLEVBQUUsSUFBSTt3QkFDWCxPQUFPLEVBQUU7NEJBQ1AsT0FBTyxFQUFFLFdBQVc7eUJBQ3JCO3FCQUNGO29CQUNELGVBQWUsRUFBRTt3QkFD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