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
const test_1 = require("../../../../src/commands/test");
const helpers_1 = require("../../../helpers");
describe("TestCommand", () => {
    const command = new test_1.TestCommand();
    let garden;
    let log;
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        log = garden.log;
    });
    it("should run all tests in a simple project", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": undefined,
            }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(result).error).to.be.undefined;
        const outputs = (0, helpers_1.taskResultOutputs)(result);
        (0, chai_1.expect)(outputs["test.module-a-unit"].state).to.equal("ready");
        (0, chai_1.expect)(outputs["test.module-a-integration"].state).to.equal("ready");
        (0, chai_1.expect)(outputs["test.module-b-unit"].state).to.equal("ready");
        (0, chai_1.expect)(outputs["test.module-c-unit"].state).to.equal("ready");
        (0, chai_1.expect)(outputs["test.module-c-integ"].state).to.equal("ready");
    });
    it("should optionally test single module", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": ["module-a"], // <---
            }),
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["test.module-a-integration", "test.module-a-unit"]);
    });
    it("should optionally run single test", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["module-a-unit"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": undefined,
            }),
        });
        (0, chai_1.expect)(Object.keys(result.graphResults)).to.eql(["test.module-a-unit"]);
    });
    it("should optionally skip tests by name", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": ["*int*"],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": ["module-a"],
            }),
        });
        (0, chai_1.expect)(result.graphResults["test.module-a-integration"]).to.not.exist;
    });
    it("handles --interactive option if single test name is specified", async () => {
        var _a;
        await garden.stubRouterAction("Test", "run", async ({ interactive }) => {
            return {
                state: "ready",
                detail: {
                    success: true,
                    log: `Interactive: ${interactive}`,
                    startedAt: new Date(),
                    completedAt: new Date(),
                },
                outputs: {},
            };
        });
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["module-a-unit"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": true,
                "module": undefined,
            }),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.graphResults["test.module-a-unit"]) === null || _a === void 0 ? void 0 : _a.result.detail.log).to.equal("Interactive: true");
    });
    it("throws if --interactive option is set and no test name is specified in arguments", async () => {
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": true,
                "module": undefined,
            }),
        }), { contains: "The --interactive/-i option can only be used if a single test is selected." });
    });
    it("throws if --interactive option is set and multiple test names are specified in arguments", async () => {
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["module-a-unit", "module-a-integration"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": true,
                "module": undefined,
            }),
        }), { contains: "The --interactive/-i option can only be used if a single test is selected." });
    });
    it("should be protected", async () => {
        (0, chai_1.expect)(command.protected).to.be.true;
    });
    it("should skip disabled tests", async () => {
        await garden.scanAndAddConfigs();
        garden["moduleConfigs"]["module-c"].spec.tests[0].disabled = true;
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": false,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": ["module-c"],
            }),
        });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(Object.keys((0, helpers_1.taskResultOutputs)(result)).sort()).to.eql(["test.module-c-integ"]);
    });
    it("should skip tests from disabled modules", async () => {
        await garden.scanAndAddConfigs();
        garden["moduleConfigs"]["module-c"].disabled = true;
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": false,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": undefined,
            }),
        });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(Object.keys((0, helpers_1.taskResultOutputs)(result)).sort()).to.eql([
            "test.module-a-integration",
            "test.module-a-unit",
            "test.module-b-unit",
        ]);
    });
    it("selects tests by glob from positional argument", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["module-a-*"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": undefined,
            }),
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["test.module-a-integration", "test.module-a-unit"]);
    });
    it("concatenates positional args and --name flags", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["module-a-unit"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": ["module-b-unit"],
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": undefined,
            }),
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["test.module-a-unit", "test.module-b-unit"]);
    });
    it("throws if --module filter specifies module that does not exist", async () => {
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "name": undefined,
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": undefined,
                "skip-dependencies": false,
                "skip-dependants": false,
                "interactive": false,
                "module": ["foo"],
            }),
        }), { contains: "Could not find module(s): foo" });
    });
    context("when --skip-dependencies is passed", () => {
        it("should not process runtime dependencies", async () => {
            const moduleConfigs = [
                (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                    name: "module-a",
                    include: [],
                    spec: {
                        services: [{ name: "service-a" }],
                        tests: [
                            { name: "unit", command: ["echo", "OK"] },
                            { name: "integration", command: ["echo", "OK"], dependencies: ["service-a"] },
                        ],
                        tasks: [],
                        build: { command: ["echo", "A"], dependencies: [] },
                    },
                }),
                (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                    name: "module-b",
                    include: [],
                    spec: {
                        services: [{ name: "service-b", dependencies: ["task-b"] }],
                        tests: [
                            { name: "unit", command: ["echo", "OK"] },
                            { name: "integration", command: ["echo", "OK"], dependencies: ["service-b"] },
                        ],
                        tasks: [{ command: ["echo", "A"], name: "task-b" }],
                        build: { command: ["echo", "A"], dependencies: [] },
                    },
                }),
            ];
            garden.setActionConfigs(moduleConfigs);
            const { result, errors } = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { names: ["module-a-*"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({
                    "name": undefined,
                    "force": true,
                    "force-build": false,
                    "watch": false,
                    "skip": [],
                    "skip-dependencies": true,
                    "skip-dependants": false,
                    "interactive": false,
                    "module": undefined,
                }),
            });
            if (errors) {
                throw errors[0];
            }
            const processed = (0, helpers_1.getAllProcessedTaskNames)(result.graphResults);
            (0, chai_1.expect)(processed).to.eql([
                "build.module-a",
                "resolve-action.build.module-a",
                "resolve-action.deploy.service-a",
                "resolve-action.test.module-a-integration",
                "resolve-action.test.module-a-unit",
                "test.module-a-integration",
                "test.module-a-unit",
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0Isd0RBQTJEO0FBQzNELDhDQVF5QjtBQUl6QixRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixNQUFNLE9BQU8sR0FBRyxJQUFJLGtCQUFXLEVBQUUsQ0FBQTtJQUVqQyxJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxHQUFhLENBQUE7SUFFakIsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBQ2hDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO0lBQ2xCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDBDQUEwQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDdEMsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUMxQixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztnQkFDMUIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLE9BQU8sRUFBRSxJQUFJO2dCQUNiLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixPQUFPLEVBQUUsS0FBSztnQkFDZCxNQUFNLEVBQUUsRUFBRTtnQkFDVixtQkFBbUIsRUFBRSxLQUFLO2dCQUMxQixpQkFBaUIsRUFBRSxLQUFLO2dCQUN4QixhQUFhLEVBQUUsS0FBSztnQkFDcEIsUUFBUSxFQUFFLFNBQVM7YUFDcEIsQ0FBQztTQUNILENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxR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