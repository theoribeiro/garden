"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const delete_1 = require("../../../../src/commands/delete");
const helpers_1 = require("../../../helpers");
const chai_1 = require("chai");
const config_1 = require("../../../../src/plugins/exec/config");
const projectRootB = (0, helpers_1.getDataDir)("test-project-b");
const moduleConfigs = [
    (0, helpers_1.makeModuleConfig)(projectRootB, {
        name: "module-a",
        include: [],
        spec: {
            services: [{ name: "service-a", deployCommand: ["echo", "ok"] }],
            tests: [],
            tasks: [],
            build: { dependencies: [] },
        },
    }),
    (0, helpers_1.makeModuleConfig)(projectRootB, {
        name: "module-b",
        include: [],
        spec: {
            services: [{ name: "service-b", deployCommand: ["echo", "ok"], dependencies: ["service-a"] }],
            tests: [],
            tasks: [],
            build: { dependencies: [] },
        },
    }),
    (0, helpers_1.makeModuleConfig)(projectRootB, {
        name: "module-c",
        include: [],
        spec: {
            services: [{ name: "service-c", deployCommand: ["echo", "ok"], dependencies: ["service-b"] }],
            tests: [],
            tasks: [],
            build: { dependencies: [] },
        },
    }),
    (0, helpers_1.makeModuleConfig)(projectRootB, {
        name: "module-d",
        include: [],
        spec: {
            services: [{ name: "service-d", deployCommand: ["echo", "ok"], dependencies: ["service-c"] }],
            tests: [],
            tasks: [],
            build: { dependencies: [] },
        },
    }),
];
const missingDeployStatus = {
    state: "not-ready",
    detail: { state: "missing", forwardablePorts: [], outputs: {}, detail: {} },
    outputs: {},
};
describe("DeleteEnvironmentCommand", () => {
    let deletedServices = [];
    let deleteOrder = [];
    const testEnvStatuses = {};
    let garden;
    let log;
    const testProvider = (0, helpers_1.customizedTestPlugin)({
        name: "test-plugin",
        handlers: {
            cleanupEnvironment: async ({ ctx }) => {
                testEnvStatuses[ctx.environmentName] = { ready: false, outputs: {} };
                return {};
            },
            getEnvironmentStatus: async ({ ctx }) => {
                return testEnvStatuses[ctx.environmentName] || { ready: true, outputs: {} };
            },
        },
        createActionTypes: {
            Deploy: [
                {
                    name: "test",
                    docs: "Test Deploy action",
                    schema: (0, config_1.execDeployActionSchema)(),
                    handlers: {
                        deploy: async (_params) => {
                            return { state: "ready", detail: { state: "ready", detail: {} }, outputs: {} };
                        },
                        getStatus: async (_params) => {
                            return { state: "ready", detail: { state: "ready", detail: {} }, outputs: {} };
                        },
                        delete: async (params) => {
                            deletedServices.push(params.action.name);
                            deleteOrder.push(params.action.name);
                            return { state: "not-ready", detail: { state: "missing", detail: {} }, outputs: {} };
                        },
                    },
                },
            ],
        },
    });
    beforeEach(async () => {
        deletedServices = [];
        deleteOrder = [];
        garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins });
        garden.setActionConfigs(moduleConfigs);
        log = garden.log;
    });
    const command = new delete_1.DeleteEnvironmentCommand();
    const plugins = [testProvider];
    it("should delete environment with services", async () => {
        const { result } = await command.action({
            garden,
            log,
            footerLog: log,
            headerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "dependants-first": false }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(result).error).to.be.undefined;
        (0, chai_1.expect)(result.providerStatuses["test-plugin"]["ready"]).to.be.false;
        (0, chai_1.expect)(result.deployStatuses).to.eql({
            "service-a": missingDeployStatus,
            "service-b": missingDeployStatus,
            "service-c": missingDeployStatus,
            "service-d": missingDeployStatus,
        });
        (0, chai_1.expect)(deletedServices.sort()).to.eql(["service-a", "service-b", "service-c", "service-d"]);
    });
    context("when called with --dependants-first", () => {
        it("should delete environment with services in dependant order", async () => {
            const { result } = await command.action({
                garden,
                log,
                footerLog: log,
                headerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "dependants-first": true }),
            });
            (0, chai_1.expect)(command.outputsSchema().validate(result).error).to.be.undefined;
            (0, chai_1.expect)(result.providerStatuses["test-plugin"]["ready"]).to.be.false;
            (0, chai_1.expect)(result.deployStatuses).to.eql({
                "service-a": missingDeployStatus,
                "service-b": missingDeployStatus,
                "service-c": missingDeployStatus,
                "service-d": missingDeployStatus,
            });
            (0, chai_1.expect)(deletedServices.sort()).to.eql(["service-a", "service-b", "service-c", "service-d"]);
            // This means that the services were deleted in dependant order.
            (0, chai_1.expect)(deleteOrder).to.eql(["service-d", "service-c", "service-b", "service-a"]);
        });
    });
    it("should be protected", async () => {
        (0, chai_1.expect)(command.protected).to.be.true;
    });
});
describe("DeleteDeployCommand", () => {
    let deleteOrder = [];
    const testStatuses = {
        "service-a": missingDeployStatus,
        "service-b": missingDeployStatus,
        "service-c": missingDeployStatus,
        "service-d": missingDeployStatus,
    };
    const testProvider = (0, helpers_1.customizedTestPlugin)({
        name: "test-plugin",
        createActionTypes: {
            Deploy: [
                {
                    name: "test",
                    docs: "Test Deploy action",
                    schema: (0, config_1.execDeployActionSchema)(),
                    handlers: {
                        deploy: async (_params) => {
                            return { state: "ready", detail: { state: "ready", detail: {} }, outputs: {} };
                        },
                        getStatus: async (_params) => {
                            return { state: "ready", detail: { state: "ready", detail: {} }, outputs: {} };
                        },
                        delete: async (params) => {
                            deleteOrder.push(params.action.name);
                            return testStatuses[params.action.name];
                        },
                    },
                },
            ],
        },
    });
    const plugins = [testProvider];
    const command = new delete_1.DeleteDeployCommand();
    let garden;
    let log;
    beforeEach(async () => {
        deleteOrder = [];
        garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins });
        garden.setActionConfigs(moduleConfigs);
        log = garden.log;
    });
    it("should return the status of the deleted service", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["service-a"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "with-dependants": false, "dependants-first": false }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(result).error).to.be.undefined;
        (0, chai_1.expect)(result).to.eql({
            "service-a": missingDeployStatus,
        });
    });
    it("should delete the specified services and return their statuses", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["service-a", "service-b", "service-c"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "with-dependants": false, "dependants-first": false }),
        });
        (0, chai_1.expect)(result).to.eql({
            "service-a": missingDeployStatus,
            "service-b": missingDeployStatus,
            "service-c": missingDeployStatus,
        });
    });
    context("when called with --dependants-first", () => {
        it("should delete the specified services in reverse dependency order and return their statuses", async () => {
            const { result } = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { names: ["service-a", "service-b", "service-c"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "with-dependants": false, "dependants-first": true }),
            });
            (0, chai_1.expect)(deleteOrder).to.eql(["service-c", "service-b", "service-a"]);
            (0, chai_1.expect)(result).to.eql({
                "service-a": missingDeployStatus,
                "service-b": missingDeployStatus,
                "service-c": missingDeployStatus,
            });
        });
    });
    context("when called with --with-dependants", () => {
        it("should delete the specified services and their dependants in reverse dependency order", async () => {
            const { result } = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { names: ["service-a"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "with-dependants": true, "dependants-first": false }),
            });
            (0, chai_1.expect)(deleteOrder).to.eql(["service-d", "service-c", "service-b", "service-a"]);
            (0, chai_1.expect)(result).to.eql({
                "service-a": missingDeployStatus,
                "service-b": missingDeployStatus,
                "service-c": missingDeployStatus,
                "service-d": missingDeployStatus,
            });
        });
    });
    it("should delete all services if none are specified", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "with-dependants": false, "dependants-first": true }),
        });
        (0, chai_1.expect)(result).to.eql({
            "service-a": missingDeployStatus,
            "service-b": missingDeployStatus,
            "service-c": missingDeployStatus,
            "service-d": missingDeployStatus,
        });
    });
    it("should be protected", async () => {
        (0, chai_1.expect)(command.protected).to.be.true;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVsZXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsNERBQStGO0FBQy9GLDhDQU95QjtBQUN6QiwrQkFBNkI7QUFJN0IsZ0VBQTRFO0FBRzVFLE1BQU0sWUFBWSxHQUFHLElBQUEsb0JBQVUsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFtQjtJQUNwQyxJQUFBLDBCQUFnQixFQUFDLFlBQVksRUFBRTtRQUM3QixJQUFJLEVBQUUsVUFBVTtRQUNoQixPQUFPLEVBQUUsRUFBRTtRQUNYLElBQUksRUFBRTtZQUNKLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoRSxLQUFLLEVBQUUsRUFBRTtZQUNULEtBQUssRUFBRSxFQUFFO1lBQ1QsS0FBSyxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRTtTQUM1QjtLQUNGLENBQUM7SUFDRixJQUFBLDBCQUFnQixFQUFDLFlBQVksRUFBRTtRQUM3QixJQUFJLEVBQUUsVUFBVTtRQUNoQixPQUFPLEVBQUUsRUFBRTtRQUNYLElBQUksRUFBRTtZQUNKLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUM3RixLQUFLLEVBQUUsRUFBRTtZQUNULEtBQUssRUFBRSxFQUFFO1lBQ1QsS0FBSyxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRTtTQUM1QjtLQUNGLENBQUM7SUFDRixJQUFBLDBCQUFnQixFQUFDLFlBQVksRUFBRTtRQUM3QixJQUFJLEVBQUUsVUFBVTtRQUNoQixPQUFPLEVBQUUsRUFBRTtRQUNY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