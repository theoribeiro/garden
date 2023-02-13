"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const deploy_1 = require("../../../../src/commands/deploy");
const chai_1 = require("chai");
const helpers_1 = require("../../../helpers");
const lodash_1 = require("lodash");
const logger_1 = require("../../../../src/logger/logger");
// TODO-G2: rename test cases to match the new graph model semantics
const placeholderTimestamp = new Date();
const testProvider = () => {
    const testStatuses = {
        "service-a": {
            state: "ready",
            detail: {
                state: "ready",
                detail: {},
                ingresses: [
                    {
                        hostname: "service-a.test-project-b.local.app.garden",
                        path: "/path-a",
                        port: 80,
                        protocol: "http",
                    },
                ],
            },
            outputs: {},
        },
        "service-c": {
            state: "ready",
            detail: { state: "ready", detail: {} },
            outputs: {},
        },
    };
    return (0, helpers_1.customizedTestPlugin)({
        name: "test-plugin",
        createActionTypes: {
            Deploy: [
                {
                    name: "test",
                    docs: "Test Deploy action",
                    schema: (0, helpers_1.testDeploySchema)(),
                    handlers: {
                        deploy: async (params) => {
                            const newStatus = { state: "ready", detail: { state: "ready", detail: {} }, outputs: {} };
                            testStatuses[params.action.name] = newStatus;
                            return newStatus;
                        },
                        getStatus: async (params) => {
                            return (testStatuses[params.action.name] || {
                                state: "unknown",
                                detail: { state: "unknown", detail: {} },
                                outputs: {},
                            });
                        },
                        exec: async ({ action }) => {
                            const { command } = action.getSpec();
                            return { code: 0, output: "Ran command: " + command.join(" ") };
                        },
                    },
                },
            ],
            Run: [
                {
                    name: "test",
                    docs: "Test Run action",
                    schema: (0, helpers_1.testTestSchema)(),
                    handlers: {
                        run: async ({}) => {
                            return {
                                state: "ready",
                                outputs: {},
                                detail: {
                                    success: true,
                                    startedAt: placeholderTimestamp,
                                    completedAt: placeholderTimestamp,
                                    log: "OK",
                                },
                            };
                        },
                    },
                },
            ],
        },
    });
};
describe("DeployCommand", () => {
    const projectRootB = (0, helpers_1.getDataDir)("test-project-b");
    const projectRootA = (0, helpers_1.getDataDir)("test-project-a");
    // TODO: Verify that services don't get redeployed when same version is already deployed.
    const command = new deploy_1.DeployCommand();
    it("should build and deploy everything in a project, and execute Run dependencies", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins: [testProvider()] });
        const log = garden.log;
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "dev-mode": undefined,
                "local-mode": undefined,
                "watch": false,
                "force": false,
                "force-build": true,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-watch": false,
                "forward": false,
            }),
        });
        if (errors === null || errors === void 0 ? void 0 : errors.length) {
            throw errors[0];
        }
        (0, chai_1.expect)(command.outputsSchema().validate(result).error).to.be.undefined;
        (0, chai_1.expect)(Object.keys((0, helpers_1.taskResultOutputs)(result)).sort()).to.eql([
            "deploy.service-a",
            "deploy.service-b",
            "deploy.service-c",
            "deploy.service-d",
        ]);
        const deployResults = result.graphResults;
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const sortedEvents = (0, lodash_1.sortBy)((0, helpers_1.getRuntimeStatusEvents)(garden.events.eventLog), (e) => `${e.name}.${e.payload.actionName}.${e.payload.status.state}`);
        const getActionUid = (actionName) => {
            const event = sortedEvents.find((e) => e.payload.actionName === actionName && !!e.payload.actionUid);
            if (!event) {
                throw new Error(`No event with an actionUid found for action name ${actionName}`);
            }
            return event.payload.actionUid;
        };
        const getModuleVersion = (moduleName) => graph.getModule(moduleName).version.versionString;
        const getDeployVersion = (serviceName) => graph.getDeploy(serviceName).versionString();
        const getRunVersion = (taskName) => graph.getRun(taskName).versionString();
        const deployServiceAUid = getActionUid("service-a");
        const deployServiceBUid = getActionUid("service-b");
        const deployServiceDUid = getActionUid("service-d");
        // Note: Runs A and C should not run or be queried for status because service-a is ready beforehand
        const runTaskBUid = getActionUid("task-b");
        const taskVersionB = getRunVersion("task-b");
        const moduleVersionA = getModuleVersion("module-a");
        const moduleVersionB = getModuleVersion("module-b");
        const moduleVersionC = getModuleVersion("module-c");
        const serviceVersionA = getDeployVersion("service-a");
        const serviceVersionB = getDeployVersion("service-b");
        const serviceVersionC = getDeployVersion("service-c");
        const serviceVersionD = getDeployVersion("service-d"); // `service-d` is defined in `module-c`
        for (const graphResult of Object.values(deployResults)) {
            (0, chai_1.expect)(graphResult).to.exist;
            // Won't happen, but chai expect doesn't serve as a typeguard :(
            if (graphResult === null) {
                continue;
            }
            (0, chai_1.expect)(graphResult.name).to.exist;
            (0, chai_1.expect)(graphResult.version).to.equal(getDeployVersion(graphResult.name));
            (0, chai_1.expect)(graphResult.aborted).to.be.false;
            (0, chai_1.expect)(graphResult.error).to.be.null;
            (0, chai_1.expect)(graphResult.result).to.exist;
            (0, chai_1.expect)(graphResult.startedAt).to.be.instanceOf(Date);
            (0, chai_1.expect)(graphResult.completedAt).to.be.instanceOf(Date);
            const { result: res } = graphResult;
            (0, chai_1.expect)(res.state).to.equal("ready");
            (0, chai_1.expect)(res.outputs).to.eql({});
            (0, chai_1.expect)(res.detail.state).to.equal("ready");
            (0, chai_1.expect)(res.detail.forwardablePorts).to.eql([]);
            (0, chai_1.expect)(res.detail.outputs).to.eql({});
        }
        (0, chai_1.expect)(sortedEvents[0]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-a",
                serviceName: "service-a",
                moduleName: "module-a",
                moduleVersion: moduleVersionA,
                actionVersion: serviceVersionA,
                actionUid: deployServiceAUid,
                serviceVersion: serviceVersionA,
                status: { state: "deploying" },
            },
        });
        (0, chai_1.expect)(sortedEvents[1]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-a",
                serviceName: "service-a",
                moduleName: "module-a",
                moduleVersion: moduleVersionA,
                actionVersion: serviceVersionA,
                serviceVersion: serviceVersionA,
                status: { state: "ready" },
            },
        });
        (0, chai_1.expect)(sortedEvents[2]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-a",
                serviceName: "service-a",
                moduleName: "module-a",
                moduleVersion: moduleVersionA,
                actionVersion: serviceVersionA,
                serviceVersion: serviceVersionA,
                actionUid: deployServiceAUid,
                status: { state: "ready" },
            },
        });
        (0, chai_1.expect)(sortedEvents[3]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-b",
                serviceName: "service-b",
                moduleName: "module-b",
                actionUid: deployServiceBUid,
                moduleVersion: moduleVersionB,
                actionVersion: serviceVersionB,
                serviceVersion: serviceVersionB,
                status: { state: "deploying" },
            },
        });
        (0, chai_1.expect)(sortedEvents[4]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-b",
                serviceName: "service-b",
                moduleName: "module-b",
                actionUid: deployServiceBUid,
                moduleVersion: moduleVersionB,
                actionVersion: serviceVersionB,
                serviceVersion: serviceVersionB,
                status: { state: "ready" },
            },
        });
        (0, chai_1.expect)(sortedEvents[5]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-b",
                serviceName: "service-b",
                moduleName: "module-b",
                moduleVersion: moduleVersionB,
                actionVersion: serviceVersionB,
                serviceVersion: serviceVersionB,
                status: { state: "unknown" },
            },
        });
        (0, chai_1.expect)(sortedEvents[6]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-c",
                serviceName: "service-c",
                moduleName: "module-c",
                moduleVersion: moduleVersionC,
                actionVersion: serviceVersionC,
                serviceVersion: serviceVersionC,
                status: { state: "ready" },
            },
        });
        (0, chai_1.expect)(sortedEvents[7]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-d",
                serviceName: "service-d",
                moduleName: "module-c",
                actionUid: deployServiceDUid,
                moduleVersion: moduleVersionC,
                actionVersion: serviceVersionD,
                serviceVersion: serviceVersionD,
                status: { state: "deploying" },
            },
        });
        (0, chai_1.expect)(sortedEvents[8]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-d",
                serviceName: "service-d",
                moduleName: "module-c",
                actionUid: deployServiceDUid,
                moduleVersion: moduleVersionC,
                actionVersion: serviceVersionD,
                serviceVersion: serviceVersionD,
                status: { state: "ready" },
            },
        });
        (0, chai_1.expect)(sortedEvents[9]).to.eql({
            name: "serviceStatus",
            payload: {
                actionName: "service-d",
                serviceName: "service-d",
                moduleName: "module-c",
                moduleVersion: moduleVersionC,
                actionVersion: serviceVersionD,
                serviceVersion: serviceVersionD,
                status: { state: "unknown" },
            },
        });
        (0, chai_1.expect)(sortedEvents[10]).to.eql({
            name: "taskStatus",
            payload: {
                actionName: "task-b",
                taskName: "task-b",
                moduleName: "module-b",
                moduleVersion: moduleVersionB,
                actionVersion: taskVersionB,
                taskVersion: taskVersionB,
                status: { state: "outdated" },
            },
        });
        (0, chai_1.expect)(sortedEvents[11]).to.eql({
            name: "taskStatus",
            payload: {
                actionName: "task-b",
                taskName: "task-b",
                moduleName: "module-b",
                moduleVersion: moduleVersionB,
                actionVersion: taskVersionB,
                taskVersion: taskVersionB,
                actionUid: runTaskBUid,
                status: { state: "running" },
            },
        });
        (0, chai_1.expect)(sortedEvents[12]).to.eql({
            name: "taskStatus",
            payload: {
                actionName: "task-b",
                taskName: "task-b",
                moduleName: "module-b",
                moduleVersion: moduleVersionB,
                actionVersion: taskVersionB,
                taskVersion: taskVersionB,
                actionUid: runTaskBUid,
                status: { state: "succeeded" },
            },
        });
    });
    it("should optionally build and deploy single service and its dependencies", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins: [testProvider()] });
        const log = garden.log;
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: ["service-b"],
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "dev-mode": undefined,
                "local-mode": undefined,
                "watch": false,
                "force": false,
                "force-build": true,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-watch": false,
                "forward": false,
            }),
        });
        if (errors) {
            throw errors[0];
        }
        const keys = (0, helpers_1.getAllProcessedTaskNames)(result.graphResults);
        (0, chai_1.expect)(keys).to.eql([
            "build.module-a",
            "build.module-b",
            "deploy.service-a",
            "deploy.service-b",
            "resolve-action.build.module-a",
            "resolve-action.build.module-b",
            "resolve-action.build.module-c",
            "resolve-action.deploy.service-a",
            "resolve-action.deploy.service-b",
            "resolve-action.run.task-a",
            "resolve-action.run.task-b",
            "resolve-action.run.task-c",
            "run.task-b",
        ]);
    });
    context("when --skip-dependencies is passed", () => {
        it("should not process runtime dependencies for the requested services", async () => {
            const garden = await (0, helpers_1.makeTestGarden)(projectRootA, { plugins: [testProvider()] });
            const log = garden.log;
            const { result, errors } = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    names: ["service-b", "service-c"],
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({
                    "dev-mode": undefined,
                    "local-mode": undefined,
                    "watch": false,
                    "force": false,
                    "force-build": true,
                    "skip": undefined,
                    "skip-dependencies": true,
                    "skip-watch": false,
                    "forward": false,
                }),
            });
            if (errors) {
                throw errors[0];
            }
            const keys = (0, helpers_1.getAllProcessedTaskNames)(result.graphResults);
            // service-b has a dependency on service-a, it should be skipped here
            (0, chai_1.expect)(keys).to.not.include("deploy.service-a");
            // service-c has a dependency on task-c, it should be skipped here
            (0, chai_1.expect)(keys).to.not.include("run.task-c");
            // Specified services should be deployed
            (0, chai_1.expect)(keys).to.include("deploy.service-b");
            (0, chai_1.expect)(keys).to.include("deploy.service-c");
        });
    });
    it("should be protected", async () => {
        (0, chai_1.expect)(command.protected).to.be.true;
    });
    it("should skip disabled services", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins: [testProvider()] });
        const log = garden.log;
        await garden.scanAndAddConfigs();
        garden["moduleConfigs"]["module-c"].spec.services[0].disabled = true;
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "dev-mode": undefined,
                "local-mode": undefined,
                "watch": false,
                "force": false,
                "force-build": true,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-watch": false,
                "forward": false,
            }),
        });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql([
            "deploy.service-a",
            "deploy.service-b",
            "deploy.service-d",
        ]);
    });
    it("should skip services from disabled modules", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins: [testProvider()] });
        const log = garden.log;
        await garden.scanAndAddConfigs();
        garden["moduleConfigs"]["module-c"].disabled = true;
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "dev-mode": undefined,
                "local-mode": undefined,
                "watch": false,
                "force": false,
                "force-build": true,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-watch": false,
                "forward": false,
            }),
        });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["deploy.service-a", "deploy.service-b"]);
    });
    it("should skip services set in the --skip option", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins: [testProvider()] });
        const log = garden.log;
        await garden.scanAndAddConfigs();
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "dev-mode": undefined,
                "local-mode": undefined,
                "watch": false,
                "force": false,
                "force-build": true,
                "skip": ["service-b"],
                "skip-dependencies": false,
                "skip-watch": false,
                "forward": false,
            }),
        });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(Object.keys((0, helpers_1.taskResultOutputs)(result)).includes("deploy.service-b")).to.be.false;
    });
    describe("isPersistent", () => {
        it("should return persistent=true if --dev is set", async () => {
            const cmd = new deploy_1.DeployCommand();
            const log = (0, logger_1.getLogger)().placeholder();
            const persistent = cmd.isPersistent({
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    names: undefined,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({
                    "dev-mode": [],
                    "local-mode": undefined,
                    "watch": false,
                    "force": false,
                    "force-build": true,
                    "skip": ["service-b"],
                    "skip-dependencies": false,
                    "skip-watch": false,
                    "forward": false,
                }),
            });
            (0, chai_1.expect)(persistent).to.be.true;
        });
        it("should return persistent=true if --local-mode is set", async () => {
            const cmd = new deploy_1.DeployCommand();
            const log = (0, logger_1.getLogger)().placeholder();
            const persistent = cmd.isPersistent({
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    names: undefined,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({
                    "dev-mode": undefined,
                    "local-mode": [],
                    "watch": false,
                    "force": false,
                    "force-build": true,
                    "skip": ["service-b"],
                    "skip-dependencies": false,
                    "skip-watch": false,
                    "forward": false,
                }),
            });
            (0, chai_1.expect)(persistent).to.be.true;
        });
        it("should return persistent=true if --follow is set", async () => {
            const cmd = new deploy_1.DeployCommand();
            const log = (0, logger_1.getLogger)().placeholder();
            const persistent = cmd.isPersistent({
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    names: undefined,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({
                    "dev-mode": undefined,
                    "local-mode": undefined,
                    "watch": false,
                    "force": false,
                    "force-build": true,
                    "skip": ["service-b"],
                    "skip-dependencies": false,
                    "skip-watch": false,
                    "forward": true,
                }),
            });
            (0, chai_1.expect)(persistent).to.be.true;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVwbG95LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsNERBQStEO0FBQy9ELCtCQUE2QjtBQUM3Qiw4Q0FXeUI7QUFDekIsbUNBQStCO0FBQy9CLDBEQUF5RDtBQUl6RCxvRUFBb0U7QUFDcEUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFBO0FBRXZDLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtJQUN4QixNQUFNLFlBQVksR0FBb0M7UUFDcEQsV0FBVyxFQUFFO1lBQ1gsS0FBSyxFQUFFLE9BQU87WUFDZCxNQUFNLEVBQUU7Z0JBQ04sS0FBSyxFQUFFLE9BQU87Z0JBQ2QsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsU0FBUyxFQUFFO29CQUNUO3dCQUNFLFFBQVEsRUFBRSwyQ0FBMkM7d0JBQ3JELElBQUksRUFBRSxTQUFTO3dCQUNmLElBQUksRUFBRSxFQUFFO3dCQUNSLFFBQVEsRUFBRSxNQUFNO3FCQUNqQjtpQkFDRjthQUNGO1lBQ0QsT0FBTyxFQUFFLEVBQUU7U0FDWjtRQUNELFdBQVcsRUFBRTtZQUNYLEtBQUssRUFBRSxPQUFPO1lBQ2QsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO1lBQ3RDLE9BQU8sRUFBRSxFQUFFO1NBQ1o7S0FDRixDQUFBO0lBRUQsT0FBTyxJQUFBLDhCQUFvQixFQUFDO1FBQzFCLElBQUksRUFBRSxhQUFhO1FBQ25CLGlCQUFpQixFQUFFO1lBQ2pCLE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxJQUFJLEVBQUUsTUFBTTtvQkFDWixJQUFJLEVBQUUsb0JBQW9CO29CQUMxQixNQUFNLEVBQUUsSUFBQSwwQkFBZ0IsR0FBRTtvQkFDMUIsUUFBUSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7NEJBQ3ZCLE1BQU0sU0FBUyxHQUFpQixFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFBOzRCQUN2RyxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUE7NEJBQzVDLE9BQU8sU0FBUyxDQUFBO3dCQUNsQixDQUFDO3dCQUNELFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7NEJBQzFCLE9BQU8sQ0FDTCxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSTtnQ0FDbEMsS0FBSyxFQUFFLFNBQVM7Z0NBQ2hCLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQ0FDeEMsT0FBTyxFQUFFLEVBQUU7NkJBQ1osQ0FDRixDQUFBO3dCQUNILENBQUM7d0JBQ0QsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7NEJBQ3pCLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7NEJBQ3BDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxlQUFlLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFBO3dCQUNqRSxDQUFDO3FCQUNGO2lCQUNGO2FBQ0Y7WUFDRCxHQUFHLEVBQUU7Z0JBQ0g7b0JBQ0UsSUFBSSxFQUFFLE1BQU07b0JBQ1osSUFBSSxFQUFFLGlCQUFpQjtvQkFDdkIsTUFBTSxFQUFFLElBQUEsd0JBQWMsR0FBRTtvQkFDeEIsUUFBUSxFQUFFO3dCQUNSLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUU7NEJBQ2hCLE9BQU87Z0NBQ0wsS0FBSyxFQUFFLE9BQU87Z0NBQ2QsT0FBTyxFQUFFLEVBQUU7Z0NBQ1gsTUFBTSxFQUFFO29DQUNOLE9BQU8sRUFBRSxJQUFJO29DQUNiLFNBQVMsRUFBRSxvQkFBb0I7b0NBQy9CLFdBQVcsRUFBRSxvQkFBb0I7b0NBQ2pDLEdBQUcsRUFBRSxJQUFJO2lDQUNWOzZCQUNGLENBQUE7d0JBQ0gsQ0FBQztxQkFDRjtpQkFDRjthQUNGO1NBQ0Y7S0FDRixDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUFFRCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUM3QixNQUFNLFlBQVksR0FBRyxJQUFBLG9CQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQTtJQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFBLG9CQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQTtJQUVqRCx5RkFBeUY7SUFFekYsTUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBYSxFQUFFLENBQUE7SUFFbkMsRUFBRSxDQUFDLCtFQUErRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzdGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLFlBQVksRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2hGLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFFdEIsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUMsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxTQUFTO2FBQ2pCO1lBQ0QsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUM7Z0JBQzFCLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixZQUFZLEVBQUUsU0FBUztnQkFDdkIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixtQkFBbUIsRUFBRSxLQUFLO2dCQUMxQixZQUFZLEVBQUUsS0FBSztnQkFDbkIsU0FBUyxFQUFFLEtBQUs7YUFDakIsQ0FBQztTQUNILENBQUMsQ0FBQTtRQUVGLElBQUksTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLE1BQU0sRUFBRTtZQUNsQixNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUNoQjtRQUVELElBQUEsYUFBTSxFQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7UUFFdEUsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFBLDJCQUFpQixFQUFDLE1BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzVELGtCQUFrQjtZQUNsQixrQkFBa0I7WUFDbEIsa0JBQWtCO1lBQ2xCLGtCQUFrQjtTQUNuQixDQUFDLENBQUE7UUFFRixNQUFNLGFBQWEsR0FBRyxNQUFPLENBQUMsWUFBWSxDQUFBO1FBRTFDLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBRTNFLE1BQU0sWUFBWSxHQUFHLElBQUEsZUFBTSxFQUN6QixJQUFBLGdDQUFzQixFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQzlDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQ3JFLENBQUE7UUFFRCxNQUFNLFlBQVksR0FBRyxDQUFDLFVBQWtCLEVBQVUsRUFBRTtZQUNsRCxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7WUFDcEcsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDVixNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxVQUFVLEVBQUUsQ0FBQyxDQUFBO2FBQ2xGO1lBQ0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQTtRQUNoQyxDQUFDLENBQUE7UUFFRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsVUFBa0IsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFBO1FBQ2xHLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxXQUFtQixFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFBO1FBQzlGLE1BQU0sYUFBYSxHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtRQUVsRixNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUNuRCxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUNuRCxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUVuRCxtR0FBbUc7UUFDbkcsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzFDLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUU1QyxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUNuRCxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUNuRCxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUVuRCxNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUNyRCxNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUNyRCxNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUNyRCxNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQSxDQUFDLHVDQUF1QztRQUU3RixLQUFLLE1BQU0sV0FBVyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDdEQsSUFBQSxhQUFNLEVBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtZQUU1QixnRUFBZ0U7WUFDaEUsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO2dCQUN4QixTQUFRO2FBQ1Q7WUFFRCxJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtZQUNqQyxJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtZQUN4RSxJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7WUFDdkMsSUFBQSxhQUFNLEVBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFBO1lBQ3BDLElBQUEsYUFBTSxFQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO1lBQ25DLElBQUEsYUFBTSxFQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNwRCxJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7WUFFdEQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxXQUFXLENBQUE7WUFFbkMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDbkMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7WUFFOUIsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzFDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQzlDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtTQUN0QztRQUVELElBQUEsYUFBTSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDN0IsSUFBSSxFQUFFLGVBQWU7WUFDckIsT0FBTyxFQUFFO2dCQUNQLFVBQVUsRUFBRSxXQUFXO2dCQUN2QixXQUFXLEVBQUUsV0FBVztnQkFDeEIsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLGFBQWEsRUFBRSxjQUFjO2dCQUM3QixhQUFhLEVBQUUsZUFBZTtnQkFDOUIsU0FBUyxFQUFFLGlCQUFpQjtnQkFDNUIsY0FBYyxFQUFFLGVBQWU7Z0JBQy9CLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7YUFDL0I7U0FDRixDQUFDLENBQUE7UUFDRixJQUFBLGFBQU0sRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzdCLElBQUksRUFBRSxlQUFlO1lBQ3JCLE9BQU8sRUFBRTtnQkFDUCxVQUFVLEVBQUUsV0FBVztnQkFDdkIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixhQUFhLEVBQUUsY0FBYztnQkFDN0IsYUFBYSxFQUFFLGVBQWU7Z0JBQzlCLGNBQWMsRUFBRSxlQUFlO2dCQUMvQixNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO2FBQzNCO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsSUFBQSxhQUFNLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM3QixJQUFJLEVBQUUsZUFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsVUFBVSxFQUFFLFdBQVc7Z0JBQ3ZCLFdBQVcsRUFBRSxXQUFXO2dCQUN4QixVQUFVLEVBQUUsVUFBVTtnQkFDdEIsYUFBYSxFQUFFLGNBQWM7Z0JBQzdCLGFBQWEsRUFBRSxlQUFlO2dCQUM5QixjQUFjLEVBQUUsZUFBZTtnQkFDL0IsU0FBUyxFQUFFLGlCQUFpQjtnQkFDNUIsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTthQUMzQjtTQUNGLENBQUMsQ0FBQTtRQUNGLElBQUEsYUFBTSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDN0IsSUFBSSxFQUFFLGVBQWU7WUFDckIsT0FBTyxFQUFFO2dCQUNQLFVBQVUsRUFBRSxXQUFXO2dCQUN2QixXQUFXLEVBQUUsV0FBVztnQkFDeEIsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLFNBQVMsRUFBRSxpQkFBaUI7Z0JBQzVCLGFBQWEsRUFBRSxjQUFjO2dCQUM3QixhQUFhLEVBQUUsZUFBZTtnQkFDOUIsY0FBYyxFQUFFLGVBQWU7Z0JBQy9CLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7YUFDL0I7U0FDRixDQUFDLENBQUE7UUFDRixJQUFBLGFBQU0sRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzdCLElBQUksRUFBRSxlQUFlO1lBQ3JCLE9BQU8sRUFBRTtnQkFDUCxVQUFVLEVBQUUsV0FBVztnQkFDdkIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixTQUFTLEVBQUUsaUJBQWlCO2dCQUM1QixhQUFhLEVBQUUsY0FBYztnQkFDN0IsYUFBYSxFQUFFLGVBQWU7Z0JBQzlCLGNBQWMsRUFBRSxlQUFlO2dCQUMvQixNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO2FBQzNCO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsSUFBQSxhQUFNLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM3QixJQUFJLEVBQUUsZUFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsVUFBVSxFQUFFLFdBQVc7Z0JBQ3ZCLFdBQVcsRUFBRSxXQUFXO2dCQUN4QixVQUFVLEVBQUUsVUFBVTtnQkFDdEIsYUFBYSxFQUFFLGNBQWM7Z0JBQzdCLGFBQWEsRUFBRSxlQUFlO2dCQUM5QixjQUFjLEVBQUUsZUFBZTtnQkFDL0IsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRTthQUM3QjtTQUNGLENBQUMsQ0FBQTtRQUNGLElBQUEsYUFBTSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDN0IsSUFBSSxFQUFFLGVBQWU7WUFDckIsT0FBTyxFQUFFO2dCQUNQLFVBQVUsRUFBRSxXQUFXO2dCQUN2QixXQUFXLEVBQUUsV0FBVztnQkFDeEIsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLGFBQWEsRUFBRSxjQUFjO2dCQUM3QixhQUFhLEVBQUUsZUFBZTtnQkFDOUIsY0FBYyxFQUFFLGVBQWU7Z0JBQy9CLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7YUFDM0I7U0FDRixDQUFDLENBQUE7UUFDRixJQUFBLGFBQU0sRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzdCLElBQUksRUFBRSxlQUFlO1lBQ3JCLE9BQU8sRUFBRTtnQkFDUCxVQUFVLEVBQUUsV0FBVztnQkFDdkIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixTQUFTLEVBQUUsaUJBQWlCO2dCQUM1QixhQUFhLEVBQUUsY0FBYztnQkFDN0IsYUFBYSxFQUFFLGVBQWU7Z0JBQzlCLGNBQWMsRUFBRSxlQUFlO2dCQUMvQixNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO2FBQy9CO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsSUFBQSxhQUFNLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM3QixJQUFJLEVBQUUsZUFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsVUFBVSxFQUFFLFdBQVc7Z0JBQ3ZCLFdBQVcsRUFBRSxXQUFXO2dCQUN4QixVQUFVLEVBQUUsVUFBVTtnQkFDdEIsU0FBUyxFQUFFLGlCQUFpQjtnQkFDNUIsYUFBYSxFQUFFLGNBQWM7Z0JBQzdCLGFBQWEsRUFBRSxlQUFlO2dCQUM5QixjQUFjLEVBQUUsZUFBZTtnQkFDL0IsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTthQUMzQjtTQUNGLENBQUMsQ0FBQTtRQUNGLElBQUEsYUFBTSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDN0IsSUFBSSxFQUFFLGVBQWU7WUFDckIsT0FBTyxFQUFFO2dCQUNQLFVBQVUsRUFBRSxXQUFXO2dCQUN2QixXQUFXLEVBQUUsV0FBVztnQkFDeEIsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLGFBQWEsRUFBRSxjQUFjO2dCQUM3QixhQUFhLEVBQUUsZUFBZTtnQkFDOUIsY0FBYyxFQUFFLGVBQWU7Z0JBQy9CLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7YUFDN0I7U0FDRixDQUFDLENBQUE7UUFDRixJQUFBLGFBQU0sRUFBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzlCLElBQUksRUFBRSxZQUFZO1lBQ2xCLE9BQU8sRUFBRTtnQkFDUCxVQUFVLEVBQUUsUUFBUTtnQkFDcEIsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixhQUFhLEVBQUUsY0FBYztnQkFDN0IsYUFBYSxFQUFFLFlBQVk7Z0JBQzNCLFdBQVcsRUFBRSxZQUFZO2dCQUN6QixNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO2FBQzlCO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsSUFBQSxhQUFNLEVBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM5QixJQUFJLEVBQUUsWUFBWTtZQUNsQixPQUFPLEVBQUU7Z0JBQ1AsVUFBVSxFQUFFLFFBQVE7Z0JBQ3BCLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixVQUFVLEVBQUUsVUFBVTtnQkFDdEIsYUFBYSxFQUFFLGNBQWM7Z0JBQzdCLGFBQWEsRUFBRSxZQUFZO2dCQUMzQixXQUFXLEVBQUUsWUFBWTtnQkFDekIsU0FBUyxFQUFFLFdBQVc7Z0JBQ3RCLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7YUFDN0I7U0FDRixDQUFDLENBQUE7UUFDRixJQUFBLGFBQU0sRUFBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzlCLElBQUksRUFBRSxZQUFZO1lBQ2xCLE9BQU8sRUFBRTtnQkFDUCxVQUFVLEVBQUUsUUFBUTtnQkFDcEIsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixhQUFhLEVBQUUsY0FBYztnQkFDN0IsYUFBYSxFQUFFLFlBQVk7Z0JBQzNCLFdBQVcsRUFBRSxZQUFZO2dCQUN6QixTQUFTLEVBQUUsV0FBVztnQkFDdEIsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTthQUMvQjtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHdFQUF3RSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3RGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLFlBQVksRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2hGLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFFdEIsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUMsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQzthQUNyQjtZQUNELElBQUksRUFBRSxJQUFBLCtCQUFxQixFQUFDO2dCQUMxQixVQUFVLEVBQUUsU0FBUztnQkFDckIsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxLQUFLO2dCQUNkLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixNQUFNLEVBQUUsU0FBUztnQkFDakIsbUJBQW1CLEVBQUUsS0FBSztnQkFDMUIsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2FBQ2pCLENBQUM7U0FDSCxDQUFDLENBQUE7UUFFRixJQUFJLE1BQU0sRUFBRTtZQUNWLE1BQU0sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ2hCO1FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBQSxrQ0FBd0IsRUFBQyxNQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7UUFFM0QsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUNsQixnQkFBZ0I7WUFDaEIsZ0JBQWdCO1lBQ2hCLGtCQUFrQjtZQUNsQixrQkFBa0I7WUFDbEIsK0JBQStCO1lBQy9CLCtCQUErQjtZQUMvQiwrQkFBK0I7WUFDL0IsaUNBQWlDO1lBQ2pDLGlDQUFpQztZQUNqQywyQkFBMkI7WUFDM0IsMkJBQTJCO1lBQzNCLDJCQUEyQjtZQUMzQixZQUFZO1NBQ2IsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixPQUFPLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO1FBQ2pELEVBQUUsQ0FBQyxvRUFBb0UsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNoRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1lBRXRCLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUM5QyxNQUFNO2dCQUNOLEdBQUc7Z0JBQ0gsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsSUFBSSxFQUFFO29CQUNKLEtBQUssRUFBRSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUM7aUJBQ2xDO2dCQUNELElBQUksRUFBRSxJQUFBLCtCQUFxQixFQUFDO29CQUMxQixVQUFVLEVBQUUsU0FBUztvQkFDckIsWUFBWSxFQUFFLFNBQVM7b0JBQ3ZCLE9BQU8sRUFBRSxLQUFLO29CQUNkLE9BQU8sRUFBRSxLQUFLO29CQUNkLGFBQWEsRUFBRSxJQUFJO29CQUNuQixNQUFNLEVBQUUsU0FBUztvQkFDakIsbUJBQW1CLEVBQUUsSUFBSTtvQkFDekIsWUFBWSxFQUFFLEtBQUs7b0JBQ25CLFNBQVMsRUFBRSxLQUFLO2lCQUNqQixDQUFDO2FBQ0gsQ0FBQyxDQUFBO1lBRUYsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsTUFBTSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDaEI7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFBLGtDQUF3QixFQUFDLE1BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUUzRCxxRUFBcUU7WUFDckUsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtZQUUvQyxrRUFBa0U7WUFDbEUsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7WUFFekMsd0NBQXdDO1lBQ3hDLElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtZQUMzQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFDN0MsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNuQyxJQUFBLGFBQU0sRUFBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7SUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0JBQStCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDN0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDaEYsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUV0QixNQUFNLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFBO1FBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUE7UUFFcEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUMsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxTQUFTO2FBQ2pCO1lBQ0QsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUM7Z0JBQzFCLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixZQUFZLEVBQUUsU0FBUztnQkFDdkIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixtQkFBbUIsRUFBRSxLQUFLO2dCQUMxQixZQUFZLEVBQUUsS0FBSztnQkFDbkIsU0FBUyxFQUFFLEtBQUs7YUFDakIsQ0FBQztTQUNILENBQUMsQ0FBQTtRQUVGLElBQUksTUFBTSxFQUFFO1lBQ1YsTUFBTSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDaEI7UUFFRCxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDdEQsa0JBQWtCO1lBQ2xCLGtCQUFrQjtZQUNsQixrQkFBa0I7U0FDbkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsNENBQTRDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDMUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDaEYsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUV0QixNQUFNLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFBO1FBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO1FBRW5ELE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzlDLE1BQU07WUFDTixHQUFHO1lBQ0gsU0FBUyxFQUFFLEdBQUc7WUFDZCxTQUFTLEVBQUUsR0FBRztZQUNkLElBQUksRUFBRTtnQkFDSixLQUFLLEVBQUUsU0FBUzthQUNqQjtZQUNELElBQUksRUFBRSxJQUFBLCtCQUFxQixFQUFDO2dCQUMxQixVQUFVLEVBQUUsU0FBUztnQkFDckIsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxLQUFLO2dCQUNkLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixNQUFNLEVBQUUsU0FBUztnQkFDakIsbUJBQW1CLEVBQUUsS0FBSztnQkFDMUIsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2FBQ2pCLENBQUM7U0FDSCxDQUFDLENBQUE7UUFFRixJQUFJLE1BQU0sRUFBRTtZQUNWLE1BQU0sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ2hCO1FBRUQsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFBO0lBQ25HLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLCtDQUErQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzdELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLFlBQVksRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2hGLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFFdEIsTUFBTSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtRQUVoQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QyxNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLEdBQUc7WUFDZCxJQUFJLEVBQUU7Z0JBQ0osS0FBSyxFQUFFLFNBQVM7YUFDakI7WUFDRCxJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztnQkFDMUIsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixPQUFPLEVBQUUsS0FBSztnQkFDZCxPQUFPLEVBQUUsS0FBSztnQkFDZCxhQUFhLEVBQUUsSUFBSTtnQkFDbkIsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDO2dCQUNyQixtQkFBbUIsRUFBRSxLQUFLO2dCQUMxQixZQUFZLEVBQUUsS0FBSztnQkFDbkIsU0FBUyxFQUFFLEtBQUs7YUFDakIsQ0FBQztTQUNILENBQUMsQ0FBQTtRQUVGLElBQUksTUFBTSxFQUFFO1lBQ1YsTUFBTSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDaEI7UUFFRCxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUEsMkJBQWlCLEVBQUMsTUFBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO0lBQzFGLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDNUIsRUFBRSxDQUFDLCtDQUErQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdELE1BQU0sR0FBRyxHQUFHLElBQUksc0JBQWEsRUFBRSxDQUFBO1lBQy9CLE1BQU0sR0FBRyxHQUFHLElBQUEsa0JBQVMsR0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBQ3JDLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUM7Z0JBQ2xDLEdBQUc7Z0JBQ0gsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsSUFBSSxFQUFFO29CQUNKLEtBQUssRUFBRSxTQUFTO2lCQUNqQjtnQkFDRCxJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztvQkFDMUIsVUFBVSxFQUFFLEVBQUU7b0JBQ2QsWUFBWSxFQUFFLFNBQVM7b0JBQ3ZCLE9BQU8sRUFBRSxLQUFLO29CQUNkLE9BQU8sRUFBRSxLQUFLO29CQUNkLGFBQWEsRUFBRSxJQUFJO29CQUNuQixNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUM7b0JBQ3JCLG1CQUFtQixFQUFFLEtBQUs7b0JBQzFCLFlBQVksRUFBRSxLQUFLO29CQUNuQixTQUFTLEVBQUUsS0FBSztpQkFDakIsQ0FBQzthQUNILENBQUMsQ0FBQTtZQUNGLElBQUEsYUFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFBO1FBQy9CLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BFLE1BQU0sR0FBRyxHQUFHLElBQUksc0JBQWEsRUFBRSxDQUFBO1lBQy9CLE1BQU0sR0FBRyxHQUFHLElBQUEsa0JBQVMsR0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBQ3JDLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUM7Z0JBQ2xDLEdBQUc7Z0JBQ0gsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsSUFBSSxFQUFFO29CQUNKLEtBQUssRUFBRSxTQUFTO2lCQUNqQjtnQkFDRCxJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztvQkFDMUIsVUFBVSxFQUFFLFNBQVM7b0JBRXJCLFlBQVksRUFBRSxFQUFFO29CQUNoQixPQUFPLEVBQUUsS0FBSztvQkFDZCxPQUFPLEVBQUUsS0FBSztvQkFDZCxhQUFhLEVBQUUsSUFBSTtvQkFDbkIsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDO29CQUNyQixtQkFBbUIsRUFBRSxLQUFLO29CQUMxQixZQUFZLEVBQUUsS0FBSztvQkFDbkIsU0FBUyxFQUFFLEtBQUs7aUJBQ2pCLENBQUM7YUFDSCxDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtRQUMvQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRSxNQUFNLEdBQUcsR0FBRyxJQUFJLHNCQUFhLEVBQUUsQ0FBQTtZQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFBLGtCQUFTLEdBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtZQUNyQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDO2dCQUNsQyxHQUFHO2dCQUNILFNBQVMsRUFBRSxHQUFHO2dCQUNkLFNBQVMsRUFBRSxHQUFHO2dCQUNkLElBQUksRUFBRTtvQkFDSixLQUFLLEVBQUUsU0FBUztpQkFDakI7Z0JBQ0QsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUM7b0JBQzFCLFVBQVUsRUFBRSxTQUFTO29CQUVyQixZQUFZLEVBQUUsU0FBUztvQkFDdkIsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsYUFBYSxFQUFFLElBQUk7b0JBQ25CLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDckIsbUJBQW1CLEVBQUUsS0FBSztvQkFDMUIsWUFBWSxFQUFFLEtBQUs7b0JBQ25CLFNBQVMsRUFBRSxJQUFJO2lCQUNoQixDQUFDO2FBQ0gsQ0FBQyxDQUFBO1lBQ0YsSUFBQSxhQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=