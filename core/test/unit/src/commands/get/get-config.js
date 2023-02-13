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
const helpers_1 = require("../../../../helpers");
const get_config_1 = require("../../../../../src/commands/get/get-config");
const lodash_2 = require("lodash");
const constants_1 = require("../../../../../src/constants");
const workflow_1 = require("../../../../../src/config/workflow");
const moduleConfig_1 = require("../../../../../src/plugins/container/moduleConfig");
describe("GetConfigCommand", () => {
    const command = new get_config_1.GetConfigCommand();
    it("returns all action configs", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const { result } = await garden.runCommand({
            command,
            args: {},
            opts: { "exclude-disabled": false, "resolve": "full" },
        });
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const actions = graph.getActions();
        for (const action of actions) {
            const config = action.getConfig();
            (0, chai_1.expect)(result.actionConfigs[action.kind][action.name]).to.eql(config);
        }
    });
    it("should get the project configuration", async () => {
        var _a;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "full" }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        const expectedModuleConfigs = (0, lodash_2.sortBy)(await garden.resolveModules({ log }), "name").map((m) => m._config);
        (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
    });
    it("should include the project name, id, domain and all environment names", async () => {
        const root = (0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id");
        const garden = await (0, helpers_1.makeTestGarden)(root);
        const log = garden.log;
        const result = (await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "full" }),
        })).result;
        (0, chai_1.expect)((0, lodash_1.pick)(result, ["domain", "projectName", "projectId", "allEnvironmentNames"])).to.eql({
            projectName: "has-domain-and-id",
            projectId: "dummy-id",
            domain: "http://example.invalid",
            allEnvironmentNames: ["local", "other"],
        });
    });
    it("should include workflow configs", async () => {
        var _a;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const workflowConfigs = [
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                keepAliveHours: 48,
                limits: moduleConfig_1.defaultContainerLimits,
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ command: ["run", "foo"] }],
            },
        ];
        garden.setWorkflowConfigs(workflowConfigs);
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "full" }),
        });
        const expectedModuleConfigs = (0, lodash_2.sortBy)(await garden.resolveModules({ log }), "name").map((m) => m._config);
        (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
    });
    it("should include disabled module configs", async () => {
        var _a;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        garden.setActionConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                allowPublish: false,
                build: { dependencies: [] },
                disabled: true,
                name: "a-disabled",
                include: [],
                path: garden.projectRoot,
                serviceConfigs: [],
                taskConfigs: [],
                spec: {
                    services: [
                        {
                            name: "service-a",
                            dependencies: [],
                            disabled: false,
                            spec: {},
                        },
                    ],
                },
                testConfigs: [],
                type: "test",
            },
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                allowPublish: false,
                build: { dependencies: [] },
                disabled: false,
                include: [],
                name: "b-enabled",
                path: garden.projectRoot,
                serviceConfigs: [],
                taskConfigs: [],
                spec: {
                    services: [
                        {
                            name: "service-b",
                            dependencies: [],
                            disabled: false,
                            spec: {},
                        },
                    ],
                },
                testConfigs: [],
                type: "test",
            },
        ]);
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "full" }),
        });
        const expectedModuleConfigs = (0, lodash_2.sortBy)(await garden.resolveModules({ log, includeDisabled: true }), "name").map((m) => m._config);
        (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
    });
    it("should include disabled service configs", async () => {
        var _a;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        garden.setActionConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                allowPublish: false,
                build: { dependencies: [] },
                disabled: false,
                name: "enabled",
                include: [],
                path: garden.projectRoot,
                serviceConfigs: [],
                taskConfigs: [],
                spec: {
                    services: [
                        {
                            name: "service-disabled",
                            dependencies: [],
                            disabled: true,
                            spec: {},
                        },
                        {
                            name: "service-enabled",
                            dependencies: [],
                            disabled: false,
                            spec: {},
                        },
                    ],
                    tasks: [
                        {
                            name: "task-enabled",
                            dependencies: [],
                            disabled: false,
                            command: ["echo", "ok"],
                        },
                    ],
                },
                testConfigs: [],
                type: "test",
            },
        ]);
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "full" }),
        });
        const expectedModuleConfigs = (await garden.resolveModules({ log, includeDisabled: true })).map((m) => m._config);
        (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
    });
    it("should include disabled task configs", async () => {
        var _a;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        garden.setActionConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                allowPublish: false,
                build: { dependencies: [] },
                disabled: false,
                name: "enabled",
                include: [],
                path: garden.projectRoot,
                serviceConfigs: [],
                taskConfigs: [],
                spec: {
                    services: [
                        {
                            name: "service",
                            dependencies: [],
                            disabled: false,
                            spec: {},
                        },
                    ],
                    tasks: [
                        {
                            name: "task-disabled",
                            dependencies: [],
                            disabled: true,
                            command: ["echo", "ok"],
                        },
                        {
                            name: "task-enabled",
                            dependencies: [],
                            disabled: false,
                            command: ["echo", "ok"],
                        },
                    ],
                },
                testConfigs: [],
                type: "test",
            },
        ]);
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "full" }),
        });
        const expectedModuleConfigs = (await garden.resolveModules({ log, includeDisabled: true })).map((m) => m._config);
        (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
    });
    it("should include disabled test configs", async () => {
        var _a;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        garden.setActionConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                allowPublish: false,
                build: { dependencies: [] },
                disabled: false,
                name: "enabled",
                include: [],
                path: garden.projectRoot,
                serviceConfigs: [],
                taskConfigs: [],
                spec: {
                    services: [
                        {
                            name: "service",
                            dependencies: [],
                            disabled: false,
                            spec: {},
                        },
                    ],
                    tasks: [
                        {
                            name: "task-enabled",
                            dependencies: [],
                            disabled: false,
                            command: ["echo", "ok"],
                        },
                    ],
                    tests: [
                        {
                            name: "test-enabled",
                            dependencies: [],
                            disabled: false,
                            command: ["echo", "ok"],
                        },
                        {
                            name: "test-disabled",
                            dependencies: [],
                            disabled: true,
                            command: ["echo", "ok"],
                        },
                    ],
                },
                testConfigs: [],
                type: "test",
            },
        ]);
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "full" }),
        });
        const expectedModuleConfigs = (await garden.resolveModules({ log, includeDisabled: true })).map((m) => m._config);
        (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
    });
    context("--exclude-disabled", () => {
        it("should exclude disabled module configs", async () => {
            var _a;
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: true,
                    name: "a-disabled",
                    include: [],
                    path: garden.projectRoot,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service-a",
                                dependencies: [],
                                disabled: false,
                                spec: {},
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    include: [],
                    name: "b-enabled",
                    path: garden.projectRoot,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service-b",
                                dependencies: [],
                                disabled: false,
                                spec: {},
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const res = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": true, "resolve": "full" }),
            });
            const expectedModuleConfigs = (0, lodash_2.sortBy)(await garden.resolveModules({ log }), "name").map((m) => m._config);
            (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
        });
        it("should exclude disabled service configs", async () => {
            var _a;
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "enabled",
                    include: [],
                    path: garden.projectRoot,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service-disabled",
                                dependencies: [],
                                disabled: true,
                                spec: {},
                            },
                            {
                                name: "service-enabled",
                                dependencies: [],
                                disabled: false,
                                spec: {},
                            },
                        ],
                        tasks: [
                            {
                                name: "task-enabled",
                                dependencies: [],
                                disabled: false,
                                command: ["echo", "ok"],
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const res = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": true, "resolve": "full" }),
            });
            const expectedModuleConfigs = (await garden.resolveModules({ log })).map((m) => m._config);
            // Remove the disabled service
            expectedModuleConfigs[0].serviceConfigs = [
                {
                    name: "service-enabled",
                    dependencies: [],
                    disabled: false,
                    sourceModuleName: undefined,
                    spec: {
                        name: "service-enabled",
                        dependencies: [],
                        disabled: false,
                        spec: {},
                    },
                },
            ];
            (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
        });
        it("should exclude disabled task configs", async () => {
            var _a;
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "enabled",
                    include: [],
                    path: garden.projectRoot,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service",
                                dependencies: [],
                                disabled: false,
                                spec: {},
                            },
                        ],
                        tasks: [
                            {
                                name: "task-disabled",
                                dependencies: [],
                                disabled: true,
                                command: ["echo", "ok"],
                            },
                            {
                                name: "task-enabled",
                                dependencies: [],
                                disabled: false,
                                command: ["echo", "ok"],
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const res = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": true, "resolve": "full" }),
            });
            const expectedModuleConfigs = (await garden.resolveModules({ log })).map((m) => m._config);
            // Remove the disabled task
            expectedModuleConfigs[0].taskConfigs = [
                {
                    name: "task-enabled",
                    cacheResult: true,
                    dependencies: [],
                    disabled: false,
                    spec: {
                        name: "task-enabled",
                        dependencies: [],
                        disabled: false,
                        timeout: null,
                        env: {},
                        artifacts: [],
                        command: ["echo", "ok"],
                    },
                    timeout: null,
                },
            ];
            (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
        });
        it("should exclude disabled test configs", async () => {
            var _a;
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "enabled",
                    include: [],
                    path: garden.projectRoot,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service",
                                dependencies: [],
                                disabled: false,
                                spec: {},
                            },
                        ],
                        tasks: [
                            {
                                name: "task-enabled",
                                dependencies: [],
                                disabled: false,
                                command: ["echo", "ok"],
                            },
                        ],
                        tests: [
                            {
                                name: "test-enabled",
                                dependencies: [],
                                disabled: false,
                                command: ["echo", "ok"],
                            },
                            {
                                name: "test-disabled",
                                dependencies: [],
                                disabled: true,
                                command: ["echo", "ok"],
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const res = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": true, "resolve": "full" }),
            });
            const expectedModuleConfigs = (await garden.resolveModules({ log })).map((m) => m._config);
            // Remove the disabled test
            expectedModuleConfigs[0].testConfigs = [
                {
                    name: "test-enabled",
                    dependencies: [],
                    disabled: false,
                    spec: {
                        name: "test-enabled",
                        dependencies: [],
                        disabled: false,
                        timeout: null,
                        artifacts: [],
                        command: ["echo", "ok"],
                        env: {},
                    },
                    timeout: null,
                },
            ];
            (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(expectedModuleConfigs);
        });
    });
    context("resolve=partial", () => {
        it("should return raw module configs instead of fully resolved module configs", async () => {
            var _a;
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            const rawConfigs = [
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "enabled",
                    include: [],
                    path: garden.projectRoot,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [],
                        tasks: [],
                        tests: [
                            {
                                name: "test-enabled",
                                dependencies: [],
                                disabled: false,
                                command: ["${project.name}"],
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ];
            garden.setActionConfigs(rawConfigs);
            const res = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "partial" }),
            });
            (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.moduleConfigs).to.deep.equal(rawConfigs);
        });
        it("should return raw provider configs instead of fully resolved providers", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            const res = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "partial" }),
            });
            (0, chai_1.expect)(res.result.providers).to.eql(garden.getRawProviderConfigs());
        });
        it("should not resolve providers", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const log = garden.log;
            await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "resolve": "partial" }),
            });
            (0, chai_1.expect)(garden["resolvedProviders"]).to.eql({});
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsbUNBQTZCO0FBQzdCLGlEQUF3RztBQUN4RywyRUFBNkU7QUFDN0UsbUNBQStCO0FBQy9CLDREQUFrRTtBQUNsRSxpRUFBNkY7QUFDN0Ysb0ZBQTBGO0FBRTFGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7SUFDaEMsTUFBTSxPQUFPLEdBQUcsSUFBSSw2QkFBZ0IsRUFBRSxDQUFBO0lBRXRDLEVBQUUsQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMxQyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBRXRDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFDekMsT0FBTztZQUNQLElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7U0FDdkQsQ0FBQyxDQUFBO1FBRUYsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFDM0UsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBRWxDLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO1lBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNqQyxJQUFBLGFBQU0sRUFBQyxNQUFPLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENB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