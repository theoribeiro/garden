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
const constants_1 = require("../../../../src/constants");
const run_workflow_1 = require("../../../../src/commands/run-workflow");
const plugin_1 = require("../../../../src/plugin/plugin");
const common_1 = require("../../../../src/config/common");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const string_1 = require("../../../../src/util/string");
const workflow_1 = require("../../../../src/config/workflow");
describe("RunWorkflowCommand", () => {
    const cmd = new run_workflow_1.RunWorkflowCommand();
    let garden;
    let defaultParams;
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        defaultParams = {
            cli: new helpers_1.TestGardenCli(),
            garden,
            log,
            headerLog: log,
            footerLog: log,
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        };
    });
    it("should run a workflow", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                path: garden.projectRoot,
                steps: [
                    { command: ["deploy"], description: "deploy services" },
                    { command: ["get", "outputs"] },
                    { command: ["test"] },
                    { command: ["deploy", "${var.foo}"] },
                    { command: ["test", "module-a.unit"] },
                    { command: ["run", "task-a"] },
                    { command: ["cleanup", "service", "service-a"] },
                    { command: ["cleanup", "namespace"] },
                    { command: ["publish"] },
                ],
            },
        ]);
        garden.variables = { foo: null };
        const result = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result.errors || []).to.eql([]);
    });
    it("should add workflowStep metadata to log entries provided to steps", async () => {
        const _garden = await (0, helpers_1.makeTestGardenA)();
        const _log = _garden.log;
        const _defaultParams = {
            garden: _garden,
            log: _log,
            headerLog: _log,
            footerLog: _log,
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        };
        _garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                path: garden.projectRoot,
                steps: [{ command: ["deploy"] }, { command: ["test"] }],
            },
        ]);
        await cmd.action({ ..._defaultParams, args: { workflow: "workflow-a" } });
        const entries = _garden.log.getChildEntries();
        const stepHeaderEntries = filterLogEntries(entries, /Running step/);
        const stepBodyEntries = filterLogEntries(entries, /Starting processActions/);
        const stepFooterEntries = filterLogEntries(entries, /Step.*completed/);
        const workflowCompletedEntry = filterLogEntries(entries, /Workflow.*completed/)[0];
        (0, chai_1.expect)(stepHeaderEntries.map((e) => e.getMetadata())).to.eql([undefined, undefined], "stepHeaderEntries");
        const stepBodyEntriesMetadata = stepBodyEntries.map((e) => e.getMetadata());
        (0, chai_1.expect)(stepBodyEntriesMetadata).to.eql([{ workflowStep: { index: 0 } }, { workflowStep: { index: 1 } }], "stepBodyEntries");
        (0, chai_1.expect)(stepFooterEntries.map((e) => e.getMetadata())).to.eql([undefined, undefined], "stepFooterEntries");
        (0, chai_1.expect)(workflowCompletedEntry).to.exist;
        (0, chai_1.expect)(workflowCompletedEntry.getMetadata()).to.eql(undefined, "workflowCompletedEntry");
    });
    it("should emit workflow events", async () => {
        const _garden = await (0, helpers_1.makeTestGardenA)();
        const _log = _garden.log;
        const _defaultParams = {
            garden: _garden,
            log: _log,
            headerLog: _log,
            footerLog: _log,
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        };
        _garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                path: garden.projectRoot,
                steps: [{ command: ["deploy"] }, { command: ["build"], skip: true }, { command: ["test"] }],
            },
        ]);
        await cmd.action({ ..._defaultParams, args: { workflow: "workflow-a" } });
        const we = getWorkflowEvents(_garden);
        (0, chai_1.expect)(we[0]).to.eql({ name: "workflowRunning", payload: {} });
        (0, chai_1.expect)(we[1]).to.eql({ name: "workflowStepProcessing", payload: { index: 0 } });
        (0, chai_1.expect)(we[2].name).to.eql("workflowStepComplete");
        (0, chai_1.expect)(we[2].payload.index).to.eql(0);
        (0, chai_1.expect)(we[2].payload.durationMsec).to.gte(0);
        (0, chai_1.expect)(we[3]).to.eql({ name: "workflowStepSkipped", payload: { index: 1 } });
        (0, chai_1.expect)(we[4]).to.eql({ name: "workflowStepProcessing", payload: { index: 2 } });
        (0, chai_1.expect)(we[5].name).to.eql("workflowStepComplete");
        (0, chai_1.expect)(we[5].payload.index).to.eql(2);
        (0, chai_1.expect)(we[5].payload.durationMsec).to.gte(0);
        (0, chai_1.expect)(we[6]).to.eql({ name: "workflowComplete", payload: {} });
    });
    function filterLogEntries(entries, msgRegex) {
        return entries.filter((e) => msgRegex.test(e.getLatestMessage().msg || ""));
    }
    it("should collect log outputs from a command step", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                path: garden.projectRoot,
                files: [],
                steps: [{ command: ["run", "task-a"] }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, helpers_1.expectFuzzyMatch)(result === null || result === void 0 ? void 0 : result.steps["step-1"].log.trim(), "echo OK");
    });
    it("should abort subsequent steps if a command returns an error", async () => {
        const testModuleLog = [];
        // This plugin always returns errors when a task is run.
        const testPlugin = (0, helpers_1.customizedTestPlugin)({
            name: "test",
            // createModuleTypes: [
            //   {
            //     name: "test",
            //     docs: "test",
            //     serviceOutputsSchema: joi.object().keys({ log: joi.string() }),
            //     handlers: {
            //       build: async () => ({}),
            //       runTask: async ({ task }: RunTaskParams) => {
            //         const result = {
            //           taskName: task.name,
            //           moduleName: task.module.name,
            //           success: false,
            //           outputs: { log: "" },
            //           command: [],
            //           errors: [
            //             {
            //               type: "task",
            //               message: "Task failed",
            //               detail: {},
            //             },
            //           ],
            //           log: "",
            //           startedAt: new Date(),
            //           completedAt: new Date(),
            //           version: task.version,
            //         }
            //
            //         return result
            //       },
            //       testModule: async ({}) => {
            //         testModuleLog.push("tests have been run")
            //         const now = new Date()
            //         return {
            //           moduleName: "",
            //           command: [],
            //           completedAt: now,
            //           log: "",
            //           outputs: {
            //             log: "",
            //           },
            //           success: true,
            //           startedAt: now,
            //           testName: "some-test",
            //           version: "123",
            //         }
            //       },
            //       getTaskResult: async ({}) => {
            //         return null
            //       },
            //     },
            //   },
            // ],
            createActionTypes: {
                Run: [
                    {
                        name: "run",
                        docs: "run",
                        schema: common_1.joi.object().keys({ log: common_1.joi.string() }),
                        handlers: {
                            run: async (_params) => {
                                throw new Error(`oops!`);
                            },
                            getResult: async (_params) => {
                                return {
                                    state: "failed",
                                    detail: null,
                                    outputs: {},
                                };
                            },
                        },
                    },
                ],
                Test: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object().keys({ log: common_1.joi.string() }),
                        handlers: {
                            run: async (_params) => {
                                testModuleLog.push("tests have been run");
                                const now = new Date();
                                return {
                                    state: "ready",
                                    detail: {
                                        command: [],
                                        completedAt: now,
                                        log: "",
                                        success: true,
                                        startedAt: now,
                                    },
                                    outputs: { log: "" },
                                };
                            },
                            getResult: async (_params) => {
                                return {
                                    state: "ready",
                                    detail: null,
                                    outputs: {},
                                };
                            },
                        },
                    },
                ],
            },
        });
        const tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        const projectConfig = (0, helpers_1.createProjectConfig)({
            path: tmpDir.path,
            providers: [{ name: "test" }],
        });
        const _garden = await helpers_1.TestGarden.factory(tmpDir.path, { config: projectConfig, plugins: [testPlugin] });
        const log = garden.log;
        _garden.setActionConfigs([], [
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Run",
                name: "some-task",
                type: "test",
                disabled: false,
                internal: {
                    basePath: tmpDir.path,
                },
                spec: {
                    command: ["exit", "1"],
                },
            },
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Test",
                name: "test-unit",
                type: "test",
                disabled: false,
                internal: {
                    basePath: tmpDir.path,
                },
                spec: {
                    command: ["echo", "ok"],
                },
            },
        ]);
        _garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                path: garden.projectRoot,
                steps: [{ command: ["run", "some-task"] }, { command: ["test"] }],
            },
        ]);
        await cmd.action({
            garden: _garden,
            log,
            headerLog: log,
            footerLog: log,
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            args: { workflow: "workflow-a" },
        });
        (0, chai_1.expect)(testModuleLog.length).to.eql(0);
        const we = getWorkflowEvents(_garden);
        (0, chai_1.expect)(we[0]).to.eql({ name: "workflowRunning", payload: {} });
        (0, chai_1.expect)(we[1]).to.eql({ name: "workflowStepProcessing", payload: { index: 0 } });
        (0, chai_1.expect)(we[2].name).to.eql("workflowStepError");
        (0, chai_1.expect)(we[2].payload.index).to.eql(0);
        (0, chai_1.expect)(we[2].payload.durationMsec).to.gte(0);
        (0, chai_1.expect)(we[3].name).to.eql("workflowError");
    });
    it("should write a file with string data ahead of the run, before resolving providers", async () => {
        // Make a test plugin that expects a certain file to exist when resolving
        const filePath = (0, path_1.join)(garden.projectRoot, ".garden", "test.txt");
        await (0, fs_extra_1.remove)(filePath);
        const test = (0, plugin_1.createGardenPlugin)({
            name: "test",
            handlers: {
                configureProvider: async ({ config }) => {
                    (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(filePath)).to.be.true;
                    return { config };
                },
            },
        });
        const projectConfig = (0, helpers_1.createProjectConfig)({
            path: garden.projectRoot,
            providers: [{ name: "test" }],
        });
        const _garden = await (0, helpers_1.makeTestGarden)(garden.projectRoot, { config: projectConfig, plugins: [test] });
        _garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [{ path: ".garden/test.txt", data: "test" }],
                steps: [{ command: ["get", "outputs"] }],
            },
        ]);
        await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
    });
    it("should write a file with data from a secret", async () => {
        garden.secrets.test = "super secret value";
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [{ path: ".garden/test.txt", secretName: "test" }],
                steps: [{ command: ["get", "outputs"] }],
            },
        ]);
        const filePath = (0, path_1.join)(garden.projectRoot, ".garden", "test.txt");
        await (0, fs_extra_1.remove)(filePath);
        await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        const data = await (0, fs_extra_1.readFile)(filePath);
        (0, chai_1.expect)(data.toString()).to.equal(garden.secrets.test);
    });
    it("should throw if a file references a secret that doesn't exist", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [{ path: ".garden/test.txt", secretName: "missing" }],
                steps: [{ command: ["get", "outputs"] }],
            },
        ]);
        await (0, helpers_1.expectError)(() => cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } }), {
            contains: "File '.garden/test.txt' requires secret 'missing' which could not be found.",
        });
    });
    it("should throw if attempting to write a file with a directory path that contains an existing file", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [{ path: "garden.yml/foo.txt", data: "foo" }],
                steps: [{ command: ["get", "outputs"] }],
            },
        ]);
        await (0, helpers_1.expectError)(() => cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } }), {
            contains: "Unable to write file 'garden.yml/foo.txt': EEXIST: file already exists, mkdir",
        });
    });
    it("should throw if attempting to write a file to an existing directory path", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [{ path: ".garden", data: "foo" }],
                steps: [{ command: ["get", "outputs"] }],
            },
        ]);
        await (0, helpers_1.expectError)(() => cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } }), {
            contains: `Unable to write file '.garden': EISDIR: illegal operation on a directory, open '${garden.gardenDirPath}'`,
        });
    });
    it("should run a script step in the project root", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [],
                steps: [{ script: "pwd" }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-1"].log).to.equal(garden.projectRoot);
    });
    it("should run a custom command in a command step", async () => {
        var _a;
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [],
                steps: [{ command: ["echo", "foo"] }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.eql(undefined);
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.steps["step-1"].outputs.exec) === null || _a === void 0 ? void 0 : _a["command"]).to.eql(["sh", "-c", "echo foo"]);
    });
    it("should support global parameters for custom commands", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                files: [],
                steps: [{ command: ["run-task", "task-a2", "--env", "other", "--var", "msg=YEP"] }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        const outputs = result === null || result === void 0 ? void 0 : result.steps["step-1"].outputs.gardenCommand;
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.eql(undefined);
        (0, chai_1.expect)(outputs["errors"]).to.eql([]);
        (0, chai_1.expect)(outputs["result"].success).to.be.true;
        (0, chai_1.expect)(outputs["result"].graphResults["run.task-a2"].result.detail.log).to.equal("echo other-YEP");
        (0, chai_1.expect)(outputs["command"]).to.eql(["run", "task-a2", "--env", "other", "--var", "msg=YEP"]);
    });
    it("should include env vars from the workflow config, if provided", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: { TEST_VAR_A: "llama" },
                resources: workflow_1.defaultWorkflowResources,
                files: [],
                steps: [{ script: "echo $TEST_VAR_A" }],
            },
        ]);
        await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-1"].log).to.equal("llama");
        delete process.env.TEST_VAR_A;
    });
    it("should override env vars from the workflow config with script step env vars, if provided", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: { TEST_VAR_A: "llama" },
                resources: workflow_1.defaultWorkflowResources,
                files: [],
                steps: [{ script: "echo $TEST_VAR_A", envVars: { TEST_VAR_A: "bear" } }],
            },
        ]);
        await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-1"].log).to.equal("bear");
        delete process.env.TEST_VAR_A;
    });
    it("should apply configured envVars when running script steps", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ script: "echo $FOO $BAR", envVars: { FOO: "foo", BAR: 123 } }],
            },
        ]);
        await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-1"].log).to.equal("foo 123");
    });
    it("should skip disabled steps", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ script: "pwd" }, { script: "echo fail!; exit 1", skip: true }],
            },
        ]);
        await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-2"].outputs).to.eql({});
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-2"].log).to.equal("");
    });
    describe("shouldBeDropped", () => {
        context("step has no when modifier", () => {
            it("should include the step if no error has been thrown by previous steps", () => {
                const steps = [
                    { command: ["deploy"] },
                    { command: ["test"], when: "onError" },
                    { command: ["build"] }, // <-- checking this step
                ];
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(2, steps, {})).to.be.false;
            });
            it("should drop the step when errors have been thrown by previous steps", () => {
                const steps = [
                    { command: ["deploy"] },
                    { command: ["test"], when: "onError" },
                    { command: ["build"] }, // <-- checking this step
                ];
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(2, steps, { 0: [new Error()] })).to.be.true;
            });
        });
        context("step has when = always", () => {
            it("should include the step even when errors have been thrown by previous steps", () => {
                const steps = [
                    { command: ["deploy"] },
                    { command: ["test"] },
                    { command: ["build"], when: "always" }, // <-- checking this step
                ];
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(2, steps, { 0: [new Error()] })).to.be.false;
            });
        });
        context("step has when = never", () => {
            it("should drop the step even if no error has been thrown by previous steps", () => {
                const steps = [
                    { command: ["deploy"] },
                    { command: ["test"] },
                    { command: ["build"], when: "never" },
                ];
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(2, steps, {})).to.be.true;
            });
        });
        context("step has when = onError", () => {
            it("should be dropped if no previous steps have failed", () => {
                const steps = [
                    { command: ["deploy"] },
                    { command: ["test"] },
                    { command: ["build"], when: "onError" },
                ];
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(2, steps, {})).to.be.true;
            });
            it("should be included if a step in the current sequence failed", () => {
                const steps = [
                    { command: ["deploy"] },
                    { command: ["test"] },
                    { command: ["build"], when: "onError" },
                    { command: ["test"], when: "onError" }, // <-- checking this step
                ];
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(2, steps, { 0: [new Error()] })).to.be.false;
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(3, steps, { 0: [new Error()] })).to.be.false;
            });
            it("should be dropped if a step in a preceding sequence failed", () => {
                const steps = [
                    { command: ["deploy"] },
                    { command: ["test"] },
                    { command: ["build"], when: "onError" },
                    { command: ["test"], when: "onError" },
                    { command: ["test"] },
                    { command: ["test"], when: "onError" }, // <-- checking this step
                ];
                (0, chai_1.expect)((0, run_workflow_1.shouldBeDropped)(5, steps, { 0: [new Error()] })).to.be.true;
            });
        });
    });
    it("should collect log outputs, including stderr, from a script step", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [
                    {
                        script: (0, string_1.dedent) `
              echo stdout
              echo stderr 1>&2
            `,
                    },
                ],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-1"].log).to.equal("stdout\nstderr");
    });
    it("should throw if a script step fails", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ script: "echo boo!; exit 1" }],
            },
        ]);
        const { errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        (0, chai_1.expect)(errors[0].message).to.equal("workflow failed with 1 error, see logs above for more info");
        // no details because log is set to human-readable output and details are logged above
        (0, chai_1.expect)(errors[0].detail).to.equal(undefined);
    });
    it("should throw if a script step fails and add log to output with --output flag set", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ script: "echo boo!; exit 1" }],
            },
        ]);
        const { errors } = await cmd.action({
            ...defaultParams,
            args: { workflow: "workflow-a" },
            opts: { output: "json" },
        });
        (0, chai_1.expect)(errors[0].message).to.equal("Script exited with code 1");
        (0, chai_1.expect)(errors[0].detail.stdout).to.equal("boo!");
    });
    it("should return script logs with the --output flag set", async () => {
        var _a;
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ script: "echo boo!;" }],
            },
        ]);
        const result = await cmd.action({
            ...defaultParams,
            args: { workflow: "workflow-a" },
            opts: { output: "json" },
        });
        (0, chai_1.expect)(result.errors).to.be.undefined;
        (0, chai_1.expect)((_a = result.result) === null || _a === void 0 ? void 0 : _a.steps["step-1"].log).to.be.equal("boo!");
    });
    it("should include outputs from steps in the command output", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ command: ["get", "config"] }, { command: ["run", "task-a"] }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        if (errors) {
            throw errors[0];
        }
        const config = await garden.dumpConfig({ log: garden.log });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-1"].outputs).to.eql(config);
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-2"].outputs.graphResults).to.exist;
    });
    it("should use explicit names for steps if specified", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ name: "test", command: ["run", "task-a"] }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(errors).to.not.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["test"]).to.exist;
    });
    it("should resolve references to previous steps when running a command step", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ command: ["get", "outputs"] }, { command: ["run", "${steps.step-1.outputs.taskName}"] }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-2"].outputs["graphResults"]["run.task-a"].result.detail.log).to.equal("echo OK");
    });
    it("should resolve references to previous steps when running a script step", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-a",
                kind: "Workflow",
                path: garden.projectRoot,
                files: [],
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ command: ["get", "outputs"] }, { script: "echo ${steps.step-1.outputs.taskName}" }],
            },
        ]);
        const { result, errors } = await cmd.action({ ...defaultParams, args: { workflow: "workflow-a" } });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.steps["step-2"].log).to.equal("task-a");
    });
    it("should only resolve the workflow that's being run", async () => {
        garden.setWorkflowConfigs([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "workflow-to-run",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: {},
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ command: ["deploy"] }],
            },
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                name: "some-other-workflow",
                kind: "Workflow",
                path: garden.projectRoot,
                envVars: { FOO: "${secrets.missing}" },
                resources: workflow_1.defaultWorkflowResources,
                steps: [{ command: ["deploy"] }],
            },
        ]);
        // This workflow should run without errors, despite a missing secret being referenced in a separate workflow config.
        await cmd.action({ ...defaultParams, args: { workflow: "workflow-to-run" } });
    });
});
function getWorkflowEvents(garden) {
    const eventNames = [
        "workflowRunning",
        "workflowComplete",
        "workflowError",
        "workflowStepProcessing",
        "workflowStepSkipped",
        "workflowStepError",
        "workflowStepComplete",
    ];
    return garden.events.eventLog.filter((e) => eventNames.includes(e.name));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXdvcmtmbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLXdvcmtmbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLDhDQVd5QjtBQUN6Qix5REFBK0Q7QUFDL0Qsd0VBQTJGO0FBQzNGLDBEQUFrRTtBQUNsRSwwREFBbUQ7QUFFbkQsK0JBQTJCO0FBQzNCLHVDQUF1RDtBQUN2RCx3REFBb0Q7QUFFcEQsOERBQTRGO0FBRTVGLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQ0FBa0IsRUFBRSxDQUFBO0lBQ3BDLElBQUksTUFBa0IsQ0FBQTtJQUN0QixJQUFJLGFBQWtCLENBQUE7SUFFdEIsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBQ2hDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFDdEIsYUFBYSxHQUFHO1lBQ2QsR0FBRyxFQUFFLElBQUksdUJBQWEsRUFBRTtZQUN4QixNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLEdBQUc7WUFDZCxJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLENBQUM7U0FDaEMsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHVCQUF1QixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3JDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztZQUN4QjtnQkFDRSxVQUFVLEVBQUUsK0JBQW1CO2dCQUMvQixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLE9BQU8sRUFBRSxFQUFFO2dCQUNYLFNBQVMsRUFBRSxtQ0FBd0I7Z0JBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsV0FBVztnQkFDeEIs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d0JBQXdCLEVBQUUsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUUvRSxJQUFBLGFBQU0sRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO1FBQ2pELElBQUEsYUFBTSxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNyQyxJQUFBLGFBQU0sRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFNUMsSUFBQSxhQUFNLEVBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUEsYUFBTSxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsd0JBQXdCLEVBQUUsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUUvRSxJQUFBLGFBQU0sRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO1FBQ2pELElBQUEsYUFBTSxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNyQyxJQUFBLGFBQU0sRUFBQyxFQUFFLENB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