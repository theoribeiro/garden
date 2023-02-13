"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const chai_1 = require("chai");
const path_1 = require("path");
const ps_tree_1 = __importDefault(require("ps-tree"));
const exec_1 = require("../../../../../src/plugins/exec/exec");
const lodash_1 = require("lodash");
const helpers_1 = require("../../../../helpers");
const run_1 = require("../../../../../src/tasks/run");
const helpers_2 = require("../../../../helpers");
const fs_extra_1 = require("fs-extra");
const test_1 = require("../../../../../src/tasks/test");
const fs_extra_2 = require("fs-extra");
const string_1 = require("../../../../../src/util/string");
const util_1 = require("../../../../../src/util/util");
const moduleConfig_1 = require("../../../../../src/plugins/exec/moduleConfig");
const actions_1 = require("../../../../../src/graph/actions");
const resolve_module_1 = require("../../../../../src/resolve-module");
describe("exec plugin", () => {
    context("test-project based tests", () => {
        const testProjectRoot = (0, helpers_1.getDataDir)("test-project-exec");
        const plugin = (0, exec_1.gardenPlugin)();
        let garden;
        let ctx;
        let execProvider;
        let graph;
        let log;
        beforeEach(async () => {
            garden = await (0, helpers_2.makeTestGarden)(testProjectRoot, { plugins: [plugin] });
            graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            execProvider = await garden.resolveProvider(garden.log, "exec");
            ctx = await garden.getPluginContext({ provider: execProvider, templateContext: undefined, events: undefined });
            log = garden.log;
            await garden.clearBuilds();
        });
        it("should run a script on init in the project root, if configured", async () => {
            const _garden = await (0, helpers_2.makeTestGarden)(testProjectRoot, {
                plugins: [plugin],
                config: (0, helpers_1.createProjectConfig)({
                    path: garden.projectRoot,
                    providers: [{ name: "exec", initScript: "echo hello! > .garden/test.txt" }],
                }),
                noCache: true,
            });
            await _garden.getConfigGraph({ log: _garden.log, emit: false, noCache: true });
            const f = await (0, fs_extra_2.readFile)((0, path_1.join)(_garden.projectRoot, ".garden", "test.txt"));
            (0, chai_1.expect)(f.toString().trim()).to.equal("hello!");
        });
        it("should throw if a script configured and exits with a non-zero code", async () => {
            const _garden = await (0, helpers_2.makeTestGarden)(garden.projectRoot, {
                plugins: [plugin],
                config: (0, helpers_1.createProjectConfig)({
                    path: testProjectRoot,
                    providers: [{ name: "exec", initScript: "echo oh no!; exit 1" }],
                }),
            });
            await (0, helpers_1.expectError)(() => _garden.resolveProviders(_garden.log), "plugin");
        });
        it("should correctly parse exec modules", async () => {
            const modules = (0, lodash_1.keyBy)(graph.getModules(), "name");
            const { "module-a": moduleA, "module-b": moduleB, "module-c": moduleC, "module-local": moduleLocal } = modules;
            (0, chai_1.expect)(moduleA.build.dependencies).to.eql([]);
            (0, chai_1.expect)(moduleA.spec.build.command).to.eql(["echo", "A"]);
            (0, chai_1.expect)(moduleA.serviceConfigs).to.eql([
                {
                    dependencies: [],
                    disabled: false,
                    name: "apple",
                    spec: {
                        cleanupCommand: ["rm -f deployed.log && echo cleaned up"],
                        dependencies: [],
                        deployCommand: ["touch deployed.log && echo deployed"],
                        disabled: false,
                        env: {},
                        name: "apple",
                        statusCommand: ["test -f deployed.log && echo already deployed"],
                    },
                },
            ]);
            (0, chai_1.expect)(moduleA.taskConfigs).to.eql([
                {
                    name: "banana",
                    cacheResult: false,
                    dependencies: ["orange"],
                    disabled: false,
                    timeout: null,
                    spec: {
                        artifacts: [],
                        name: "banana",
                        command: ["echo", "BANANA"],
                        env: {},
                        dependencies: ["orange"],
                        disabled: false,
                        timeout: null,
                    },
                },
                {
                    name: "orange",
                    cacheResult: false,
                    dependencies: [],
                    disabled: false,
                    timeout: 999,
                    spec: {
                        artifacts: [],
                        name: "orange",
                        command: ["echo", "ORANGE"],
                        env: {},
                        dependencies: [],
                        disabled: false,
                        timeout: 999,
                    },
                },
            ]);
            (0, chai_1.expect)(moduleA.testConfigs).to.eql([
                {
                    name: "unit",
                    dependencies: [],
                    disabled: false,
                    timeout: null,
                    spec: {
                        name: "unit",
                        artifacts: [],
                        dependencies: [],
                        disabled: false,
                        command: ["echo", "OK"],
                        env: {
                            FOO: "boo",
                        },
                        timeout: null,
                    },
                },
            ]);
            (0, chai_1.expect)(moduleB.build.dependencies).to.eql([{ name: "module-a", copy: [] }]);
            (0, chai_1.expect)(moduleB.spec.build.command).to.eql(["echo", "B"]);
            (0, chai_1.expect)(moduleB.serviceConfigs).to.eql([]);
            (0, chai_1.expect)(moduleB.taskConfigs).to.eql([]);
            (0, chai_1.expect)(moduleB.testConfigs).to.eql([
                {
                    name: "unit",
                    dependencies: [],
                    disabled: false,
                    timeout: null,
                    spec: {
                        name: "unit",
                        artifacts: [],
                        dependencies: [],
                        disabled: false,
                        command: ["echo", "OK"],
                        env: {},
                        timeout: null,
                    },
                },
            ]);
            (0, chai_1.expect)(moduleC.build.dependencies).to.eql([{ name: "module-b", copy: [] }]);
            (0, chai_1.expect)(moduleC.spec.build.command).to.eql([]);
            (0, chai_1.expect)(moduleC.serviceConfigs).to.eql([]);
            (0, chai_1.expect)(moduleC.taskConfigs).to.eql([]);
            (0, chai_1.expect)(moduleC.testConfigs).to.eql([
                {
                    name: "unit",
                    dependencies: [],
                    disabled: false,
                    timeout: null,
                    spec: {
                        name: "unit",
                        dependencies: [],
                        artifacts: [],
                        disabled: false,
                        command: ["echo", "OK"],
                        env: {},
                        timeout: null,
                    },
                },
            ]);
            (0, chai_1.expect)(moduleLocal.spec.local).to.eql(true);
            (0, chai_1.expect)(moduleLocal.build.dependencies).to.eql([]);
            (0, chai_1.expect)(moduleLocal.spec.build.command).to.eql(["pwd"]);
            (0, chai_1.expect)(moduleLocal.serviceConfigs).to.eql([
                {
                    dependencies: [],
                    disabled: false,
                    name: "touch",
                    spec: {
                        cleanupCommand: ["rm -f deployed.log && echo cleaned up"],
                        dependencies: [],
                        deployCommand: ["touch deployed.log && echo deployed"],
                        disabled: false,
                        env: {},
                        name: "touch",
                        statusCommand: ["test -f deployed.log && echo already deployed"],
                    },
                },
                {
                    dependencies: [],
                    disabled: false,
                    name: "echo",
                    spec: {
                        dependencies: [],
                        deployCommand: ["echo", "deployed $NAME"],
                        disabled: false,
                        env: { NAME: "echo service" },
                        name: "echo",
                    },
                },
                {
                    dependencies: [],
                    disabled: false,
                    name: "error",
                    spec: {
                        cleanupCommand: ["sh", '-c "echo fail! && exit 1"'],
                        dependencies: [],
                        deployCommand: ["sh", '-c "echo fail! && exit 1"'],
                        disabled: false,
                        env: {},
                        name: "error",
                    },
                },
                {
                    dependencies: [],
                    disabled: false,
                    name: "empty",
                    spec: {
                        dependencies: [],
                        deployCommand: [],
                        disabled: false,
                        env: {},
                        name: "empty",
                    },
                },
            ]);
            (0, chai_1.expect)(moduleLocal.taskConfigs).to.eql([
                {
                    name: "pwd",
                    cacheResult: false,
                    dependencies: [],
                    disabled: false,
                    timeout: null,
                    spec: {
                        name: "pwd",
                        env: {},
                        command: ["pwd"],
                        artifacts: [],
                        dependencies: [],
                        disabled: false,
                        timeout: null,
                    },
                },
            ]);
            (0, chai_1.expect)(moduleLocal.testConfigs).to.eql([]);
        });
        it("should propagate task logs to runtime outputs", async () => {
            const _garden = await (0, helpers_2.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "exec-task-outputs"));
            const _graph = await _garden.getConfigGraph({ log: _garden.log, emit: false });
            const taskB = _graph.getRun("task-b");
            const taskTask = new run_1.RunTask({
                garden: _garden,
                graph: _graph,
                action: taskB,
                log: _garden.log,
                force: false,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            const results = await _garden.processTasks({ tasks: [taskTask], throwOnError: false });
            // Task A echoes "task-a-output" and Task B echoes the output from Task A
            (0, chai_1.expect)(results["task.task-b"]).to.exist;
            (0, chai_1.expect)(results["task.task-b"]).to.have.property("output");
            (0, chai_1.expect)(results["task.task-b"].result.log).to.equal("task-a-output");
            (0, chai_1.expect)(results["task.task-b"].result).to.have.property("outputs");
            (0, chai_1.expect)(results["task.task-b"].result.outputs.log).to.equal("task-a-output");
        });
        it("should copy artifacts after task runs", async () => {
            const _garden = await (0, helpers_2.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "exec-artifacts"));
            const _graph = await _garden.getConfigGraph({ log: _garden.log, emit: false });
            const run = _graph.getRun("task-a");
            const taskTask = new run_1.RunTask({
                garden: _garden,
                graph: _graph,
                action: run,
                log: _garden.log,
                force: false,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            await (0, fs_extra_1.emptyDir)(_garden.artifactsPath);
            await _garden.processTasks({ tasks: [taskTask], throwOnError: false });
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(_garden.artifactsPath, "task-outputs", "task-a.txt"))).to.be.true;
        });
        it("should copy artifacts after test runs", async () => {
            const _garden = await (0, helpers_2.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "exec-artifacts"));
            const _graph = await _garden.getConfigGraph({ log: _garden.log, emit: false });
            const test = _graph.getTest("module-a-test-a");
            const testTask = new test_1.TestTask({
                garden: _garden,
                graph: _graph,
                action: test,
                log: _garden.log,
                force: false,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            await (0, fs_extra_1.emptyDir)(_garden.artifactsPath);
            await _garden.processTasks({ tasks: [testTask], throwOnError: false });
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(_garden.artifactsPath, "test-outputs", "test-a.txt"))).to.be.true;
        });
        describe("configureExecModule", () => {
            it("should throw if a local exec module has a build.copy spec", async () => {
                const moduleConfig = (0, helpers_1.makeTestModule)({
                    build: {
                        dependencies: [
                            {
                                name: "foo",
                                copy: [
                                    {
                                        source: ".",
                                        target: ".",
                                    },
                                ],
                            },
                        ],
                    },
                    spec: { local: true },
                });
                await (0, helpers_1.expectError)(async () => await (0, moduleConfig_1.configureExecModule)({ ctx, moduleConfig, log }), "configuration");
            });
        });
        describe("build", () => {
            it("should run the build command in the module dir if local true", async () => {
                const action = graph.getBuild("module-local");
                const actions = await garden.getActionRouter();
                const resolvedAction = await garden.resolveAction({ action, log, graph });
                const res = await actions.build.build({ log, action: resolvedAction, graph });
                const expectedBuildLog = (0, path_1.join)(garden.projectRoot, "module-local");
                (0, chai_1.expect)(res.detail).to.eql({ buildLog: expectedBuildLog, fresh: true });
            });
            it("should receive module version as an env var", async () => {
                const action = graph.getBuild("module-local");
                const actions = await garden.getActionRouter();
                action._config.spec.command = ["echo", "$GARDEN_MODULE_VERSION"];
                const resolvedAction = await garden.resolveAction({ log, graph, action });
                const res = await actions.build.build({ log, action: resolvedAction, graph });
                (0, chai_1.expect)(res.detail).to.eql({ buildLog: action.versionString(), fresh: true });
            });
        });
        describe("testExecModule", () => {
            it("should run the test command in the module dir if local true", async () => {
                const router = await garden.getActionRouter();
                const rawAction = (await (0, actions_1.actionFromConfig)({
                    garden,
                    graph,
                    router,
                    log,
                    config: {
                        type: "test",
                        kind: "Test",
                        name: "test",
                        dependencies: [],
                        disabled: false,
                        timeout: 1234,
                        spec: {
                            command: ["pwd"],
                        },
                        internal: {
                            basePath: "TODO-G2",
                        },
                    },
                    configsByKey: {},
                }));
                const action = await garden.resolveAction({ action: rawAction, graph, log });
                const res = await router.test.run({
                    log,
                    interactive: true,
                    graph,
                    silent: false,
                    action,
                });
                (0, chai_1.expect)(res.outputs).to.eql((0, path_1.join)(garden.projectRoot, "module-local"));
            });
            it("should receive module version as an env var", async () => {
                const router = await garden.getActionRouter();
                const rawAction = (await (0, actions_1.actionFromConfig)({
                    garden,
                    graph,
                    router,
                    log,
                    config: {
                        type: "test",
                        kind: "Test",
                        name: "test",
                        dependencies: [],
                        disabled: false,
                        timeout: 1234,
                        spec: {
                            command: ["echo", "$GARDEN_MODULE_VERSION"],
                        },
                        internal: {
                            basePath: "TODO-G2",
                        },
                    },
                    configsByKey: {},
                }));
                const action = await garden.resolveAction({ action: rawAction, graph, log });
                const res = await router.test.run({
                    log,
                    action,
                    interactive: true,
                    graph,
                    silent: false,
                });
                (0, chai_1.expect)(res.outputs).to.equal(rawAction.versionString());
            });
        });
        describe("runExecTask", () => {
            it("should run the task command in the module dir if local true", async () => {
                var _a;
                const actions = await garden.getActionRouter();
                const task = graph.getRun("pwd");
                const action = await garden.resolveAction({ action: task, graph, log });
                const res = await actions.run.run({
                    log,
                    action,
                    interactive: true,
                    graph,
                });
                const expectedLogPath = (0, path_1.join)(garden.projectRoot, "module-local");
                // TODO-G2: there is also `res.detail.outputs` field existing in runtime here,
                //  which does not exist in the `RunResult` type declaration.
                //  Is it a bug? Reference `res.detail?.outputs` causes a TS compilation error.
                (0, chai_1.expect)((_a = res.detail) === null || _a === void 0 ? void 0 : _a.log).to.eql(expectedLogPath);
            });
            it("should receive module version as an env var", async () => {
                var _a;
                const actions = await garden.getActionRouter();
                const task = graph.getRun("pwd");
                const action = await garden.resolveAction({ action: task, graph, log });
                action._config.spec.command = ["echo", "$GARDEN_MODULE_VERSION"];
                const res = await actions.run.run({
                    log,
                    action,
                    interactive: true,
                    graph,
                });
                // TODO-G2: see the comment is the previous spec
                (0, chai_1.expect)((_a = res.detail) === null || _a === void 0 ? void 0 : _a.log).to.equal(action.versionString());
            });
        });
        context("services", () => {
            let touchFilePath;
            beforeEach(async () => {
                touchFilePath = (0, path_1.join)(garden.projectRoot, "module-local", "deployed.log");
                await (0, fs_extra_2.remove)(touchFilePath);
            });
            describe("deployExecService", () => {
                it("runs the service's deploy command with the specified env vars", async () => {
                    var _a, _b;
                    const rawAction = graph.getDeploy("echo");
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ log, graph, action: rawAction });
                    const res = await router.deploy.deploy({
                        devMode: false,
                        force: false,
                        localMode: false,
                        log,
                        action,
                        graph,
                    });
                    (0, chai_1.expect)(res.state).to.eql("ready");
                    (0, chai_1.expect)((_a = res.detail) === null || _a === void 0 ? void 0 : _a.state).to.eql("ready");
                    (0, chai_1.expect)((_b = res.detail) === null || _b === void 0 ? void 0 : _b.detail.deployCommandOutput).to.eql("deployed echo service");
                });
                it("skips deploying if deploy command is empty but does not throw", async () => {
                    var _a;
                    const rawAction = graph.getDeploy("empty");
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    const res = await router.deploy.deploy({
                        devMode: false,
                        force: false,
                        localMode: false,
                        log,
                        action,
                        graph,
                    });
                    (0, chai_1.expect)((_a = res.detail) === null || _a === void 0 ? void 0 : _a.detail.skipped).to.eql(true);
                });
                it("throws if deployCommand returns with non-zero code", async () => {
                    const rawAction = graph.getDeploy("error");
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    await (0, helpers_1.expectError)(async () => await router.deploy.deploy({
                        devMode: false,
                        force: false,
                        localMode: false,
                        log,
                        action,
                        graph,
                    }), (err) => (0, chai_1.expect)(err.message).to.equal((0, string_1.dedent) `
            Command "sh -c "echo fail! && exit 1"" failed with code 1:

            Here's the full output:

            fail!
            `));
                });
                context("devMode", () => {
                    // We set the pid in the "it" statements.
                    let pid = -1;
                    afterEach(async () => {
                        if (pid > 1) {
                            try {
                                // This ensures the actual child process gets killed.
                                // See: https://github.com/sindresorhus/execa/issues/96#issuecomment-776280798
                                (0, ps_tree_1.default)(pid, function (_err, children) {
                                    (0, child_process_1.spawn)("kill", ["-9"].concat(children.map(function (p) {
                                        return p.PID;
                                    })));
                                });
                            }
                            catch (_err) { }
                        }
                    });
                    it("should run a persistent local service in dev mode", async () => {
                        var _a;
                        const rawAction = graph.getDeploy("dev-mode");
                        const router = await garden.getActionRouter();
                        const action = await garden.resolveAction({ graph, log, action: rawAction });
                        const res = await router.deploy.deploy({
                            devMode: true,
                            force: false,
                            localMode: false,
                            log,
                            action,
                            graph,
                        });
                        pid = (_a = res.detail) === null || _a === void 0 ? void 0 : _a.detail.pid;
                        (0, chai_1.expect)(pid).to.be.a("number");
                        (0, chai_1.expect)(pid).to.be.greaterThan(0);
                    });
                    it("should write logs to a local file with the proper format", async () => {
                        var _a;
                        // This services just echos a string N times before exiting.
                        const rawAction = graph.getDeploy("dev-mode-with-logs");
                        const router = await garden.getActionRouter();
                        const action = await garden.resolveAction({ graph, log, action: rawAction });
                        const res = await router.deploy.deploy({
                            devMode: true,
                            force: false,
                            localMode: false,
                            log,
                            action,
                            graph,
                        });
                        // Wait for entries to be written since we otherwise don't wait on persistent commands (unless
                        // a status command is set).
                        await (0, util_1.sleep)(1500);
                        pid = (_a = res.detail) === null || _a === void 0 ? void 0 : _a.detail.pid;
                        (0, chai_1.expect)(pid).to.be.a("number");
                        (0, chai_1.expect)(pid).to.be.greaterThan(0);
                        const logFilePath = (0, exec_1.getLogFilePath)({ projectRoot: garden.projectRoot, deployName: action.name });
                        const logFileContents = (await (0, fs_extra_2.readFile)(logFilePath)).toString();
                        const logEntriesWithoutTimestamps = logFileContents
                            .split("\n")
                            .filter((line) => !!line)
                            .map((line) => JSON.parse(line))
                            .map((parsed) => {
                            return {
                                serviceName: parsed.serviceName,
                                msg: parsed.msg,
                                level: parsed.level,
                            };
                        });
                        (0, chai_1.expect)(logEntriesWithoutTimestamps).to.eql([
                            {
                                serviceName: "dev-mode-with-logs",
                                msg: "Hello 1",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-logs",
                                msg: "Hello 2",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-logs",
                                msg: "Hello 3",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-logs",
                                msg: "Hello 4",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-logs",
                                msg: "Hello 5",
                                level: 2,
                            },
                        ]);
                    });
                    it("should handle empty log lines", async () => {
                        var _a;
                        // This services just echos a string N times before exiting.
                        const rawAction = graph.getDeploy("dev-mode-with-empty-log-lines");
                        const router = await garden.getActionRouter();
                        const action = await garden.resolveAction({ graph, log, action: rawAction });
                        const res = await router.deploy.deploy({
                            devMode: true,
                            force: false,
                            localMode: false,
                            log,
                            action,
                            graph,
                        });
                        // Wait for entries to be written since we otherwise don't wait on persistent commands (unless
                        // a status command is set).
                        await (0, util_1.sleep)(1500);
                        pid = (_a = res.detail) === null || _a === void 0 ? void 0 : _a.detail.pid;
                        const logFilePath = (0, exec_1.getLogFilePath)({ projectRoot: garden.projectRoot, deployName: action.name });
                        const logFileContents = (await (0, fs_extra_2.readFile)(logFilePath)).toString();
                        const logEntriesWithoutTimestamps = logFileContents
                            .split("\n")
                            .filter((line) => !!line)
                            .map((line) => JSON.parse(line))
                            .map((parsed) => {
                            return {
                                serviceName: parsed.serviceName,
                                msg: parsed.msg,
                                level: parsed.level,
                            };
                        });
                        (0, chai_1.expect)(logEntriesWithoutTimestamps).to.eql([
                            {
                                serviceName: "dev-mode-with-empty-log-lines",
                                msg: "Hello",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-empty-log-lines",
                                msg: "1",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-empty-log-lines",
                                msg: "Hello",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-empty-log-lines",
                                msg: "2",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-empty-log-lines",
                                msg: "Hello",
                                level: 2,
                            },
                            {
                                serviceName: "dev-mode-with-empty-log-lines",
                                msg: "3",
                                level: 2,
                            },
                        ]);
                    });
                    it("should eventually timeout if status command is set and it returns a non-zero exit code ", async () => {
                        const rawAction = graph.getDeploy("dev-mode-timeout");
                        const router = await garden.getActionRouter();
                        const action = await garden.resolveAction({ graph, log, action: rawAction });
                        let error;
                        try {
                            await router.deploy.deploy({
                                devMode: true,
                                force: false,
                                localMode: false,
                                log,
                                action,
                                graph,
                            });
                        }
                        catch (err) {
                            error = err;
                        }
                        pid = error.detail.pid;
                        (0, chai_1.expect)(pid).to.be.a("number");
                        (0, chai_1.expect)(pid).to.be.greaterThan(0);
                        (0, chai_1.expect)(error.detail.serviceName).to.eql("dev-mode-timeout");
                        (0, chai_1.expect)(error.detail.statusCommand).to.eql([`/bin/sh -c "echo Status command output; exit 1"`]);
                        (0, chai_1.expect)(error.detail.timeout).to.eql(3);
                        (0, chai_1.expect)(error.message).to.include(`Timed out waiting for local service dev-mode-timeout to be ready.`);
                        (0, chai_1.expect)(error.message).to.include(`The last exit code was 1.`);
                        (0, chai_1.expect)(error.message).to.include(`Command output:\nStatus command output`);
                    });
                });
            });
            describe("getExecServiceStatus", async () => {
                it("returns 'unknown' if no statusCommand is set", async () => {
                    const actionName = "error";
                    const rawAction = graph.getDeploy(actionName);
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    const res = await router.getDeployStatuses({
                        log,
                        graph,
                        names: [action.name],
                    });
                    const actionRes = res[actionName];
                    (0, chai_1.expect)(actionRes.state).to.equal("unknown");
                    const detail = actionRes.detail;
                    (0, chai_1.expect)(detail.state).to.equal("unknown");
                    (0, chai_1.expect)(detail.version).to.equal(action.versionString());
                    (0, chai_1.expect)(detail.detail).to.be.empty;
                });
                it("returns 'ready' if statusCommand returns zero exit code", async () => {
                    const actionName = "touch";
                    const rawAction = graph.getDeploy(actionName);
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    await router.deploy.deploy({
                        devMode: false,
                        localMode: false,
                        force: false,
                        log,
                        action,
                        graph,
                    });
                    const res = await router.getDeployStatuses({
                        log,
                        graph,
                        names: [action.name],
                    });
                    const actionRes = res[actionName];
                    (0, chai_1.expect)(actionRes.state).to.equal("ready");
                    const detail = actionRes.detail;
                    (0, chai_1.expect)(detail.state).to.equal("ready");
                    (0, chai_1.expect)(detail.version).to.equal(action.versionString());
                    (0, chai_1.expect)(detail.detail.statusCommandOutput).to.equal("already deployed");
                });
                it("returns 'outdated' if statusCommand returns non-zero exit code", async () => {
                    const actionName = "touch";
                    const rawAction = graph.getDeploy(actionName);
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    const res = await router.getDeployStatuses({
                        graph,
                        log,
                        names: [action.name],
                    });
                    const actionRes = res[actionName];
                    (0, chai_1.expect)(actionRes.state).to.equal("outdated");
                    const detail = actionRes.detail;
                    (0, chai_1.expect)(detail.state).to.equal("outdated");
                    (0, chai_1.expect)(detail.version).to.equal(action.versionString());
                    (0, chai_1.expect)(detail.detail.statusCommandOutput).to.be.empty;
                });
            });
            describe("deleteExecService", async () => {
                it("runs the cleanup command if set", async () => {
                    const rawAction = graph.getDeploy("touch");
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    await router.deploy.deploy({
                        devMode: false,
                        localMode: false,
                        force: false,
                        log,
                        action,
                        graph,
                    });
                    const res = await router.deploy.delete({
                        log,
                        graph,
                        action,
                    });
                    (0, chai_1.expect)(res.state).to.equal("not-ready");
                    const detail = res.detail;
                    (0, chai_1.expect)(detail.state).to.equal("missing");
                    (0, chai_1.expect)(detail.detail.cleanupCommandOutput).to.equal("cleaned up");
                });
                it("returns 'unknown' state if no cleanupCommand is set", async () => {
                    var _a;
                    const rawAction = graph.getDeploy("echo");
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    const res = await router.deploy.delete({
                        log,
                        graph,
                        action,
                    });
                    (0, chai_1.expect)(res.state).to.equal("unknown");
                    (0, chai_1.expect)((_a = res.detail) === null || _a === void 0 ? void 0 : _a.state).to.equal("unknown");
                });
                it("throws if cleanupCommand returns with non-zero code", async () => {
                    const rawAction = graph.getDeploy("error");
                    const router = await garden.getActionRouter();
                    const action = await garden.resolveAction({ graph, log, action: rawAction });
                    await (0, helpers_1.expectError)(async () => await router.deploy.delete({
                        log,
                        action,
                        graph,
                    }), (err) => (0, chai_1.expect)(err.message).to.equal((0, string_1.dedent) `
            Command "sh -c "echo fail! && exit 1"" failed with code 1:

            Here's the full output:

            fail!
            `));
                });
            });
        });
    });
    /**
     * Test specs in this context use {@link convertModules} helper function
     * to test the whole module-to-action conversion chain,
     * including the creation of {@link ConvertModuleParams} object and passing it to {@link ModuleRouter#convert}
     * via the {@link ActionRouter}.
     *
     * This has been done because mocking of {@link ConvertModuleParams} is not easy and can be fragile,
     * as it requires implementation of naming-conversion and construction of services, tasks and tests.
     *
     * In order to test the {@link ExecModule}-to-action conversion,
     * the test {@link Garden} instance must have a configured "exec" provider and "exec" plugin.
     *
     * Each test spec used temporary Garden project initialized in a tmp dir,
     * and doesn't use any disk-located pre-defined test projects.
     *
     * Each test spec defines a minimalistic module-based config and re-initializes the {@link ConfigGraph} instance.
     */
    context("code-based config tests", () => {
        describe("convert", () => {
            async function makeGarden(tmpDirResult) {
                const config = (0, helpers_1.createProjectConfig)({
                    path: tmpDirResult.path,
                    providers: [{ name: "exec" }],
                });
                return helpers_1.TestGarden.factory(tmpDirResult.path, { config, plugins: [(0, exec_1.gardenPlugin)()] });
            }
            let tmpDir;
            let garden;
            before(async () => {
                tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
                garden = await makeGarden(tmpDir);
            });
            after(async () => {
                await tmpDir.cleanup();
            });
            context("variables", () => {
                it("adds configured variables to the Group", async () => {
                    const moduleA = "module-a";
                    const taskCommand = ["echo", moduleA];
                    const variables = { FOO: "foo", BAR: "bar" };
                    garden.setActionConfigs([
                        (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                            name: moduleA,
                            type: "exec",
                            variables,
                            spec: {
                                build: {
                                    command: [],
                                },
                                services: [],
                                tests: [],
                                tasks: [
                                    {
                                        name: "task-a",
                                        command: taskCommand,
                                        dependencies: [],
                                        disabled: false,
                                        env: {},
                                        timeout: 10,
                                    },
                                ],
                                env: {},
                            },
                        }),
                    ]);
                    const tmpGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
                    const module = tmpGraph.getModule(moduleA);
                    const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [module], tmpGraph.moduleGraph);
                    (0, chai_1.expect)(result.groups).to.exist;
                    const group = (0, resolve_module_1.findGroupConfig)(result, moduleA);
                    (0, chai_1.expect)(group).to.exist;
                    (0, chai_1.expect)(group.variables).to.eql(variables);
                });
            });
            context("Build action", () => {
                it("adds a Build action if build.command is set", async () => {
                    const moduleA = "module-a";
                    const buildCommand = ["echo", moduleA];
                    garden.setActionConfigs([
                        (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                            name: moduleA,
                            type: "exec",
                            spec: {
                                build: {
                                    command: buildCommand,
                                },
                                services: [],
                                tasks: [],
                                tests: [],
                                env: {},
                            },
                        }),
                    ]);
                    const tmpGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
                    const module = tmpGraph.getModule(moduleA);
                    const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [module], tmpGraph.moduleGraph);
                    (0, chai_1.expect)(result.groups).to.exist;
                    const group = (0, resolve_module_1.findGroupConfig)(result, moduleA);
                    (0, chai_1.expect)(group.actions).to.exist;
                    (0, chai_1.expect)(group.actions.length).to.eql(1);
                    const build = (0, resolve_module_1.findActionConfigInGroup)(group, "Build", moduleA);
                    (0, chai_1.expect)(build).to.exist;
                    (0, chai_1.expect)(build.name).to.eql(moduleA);
                    (0, chai_1.expect)(build.spec.command).to.eql(buildCommand);
                });
                it("adds a Build action if build.dependencies[].copy is set and adds a copy field", async () => {
                    const moduleNameA = "module-a";
                    const moduleNameB = "module-b";
                    const buildCommandA = ["echo", moduleNameA];
                    const buildCommandB = ["echo", moduleNameB];
                    const sourcePath = "./module-a.out";
                    const targetPath = "a/module-a.out";
                    garden.setActionConfigs([
                        (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                            name: moduleNameA,
                            type: "exec",
                            spec: {
                                build: {
                                    command: buildCommandA,
                                },
                                services: [],
                                tasks: [],
                                tests: [],
                                env: {},
                            },
                        }),
                        (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                            name: moduleNameB,
                            type: "exec",
                            // module-level build config
                            build: {
                                dependencies: [
                                    {
                                        name: moduleNameA,
                                        copy: [
                                            {
                                                source: sourcePath,
                                                target: targetPath,
                                            },
                                        ],
                                    },
                                ],
                            },
                            spec: {
                                // exec-plugin specific build config defined in the spec
                                build: {
                                    command: buildCommandB,
                                },
                                services: [],
                                tasks: [],
                                tests: [],
                                env: {},
                            },
                        }),
                    ]);
                    const tmpGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
                    const moduleB = tmpGraph.getModule(moduleNameB);
                    const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [moduleB], tmpGraph.moduleGraph);
                    (0, chai_1.expect)(result.groups).to.exist;
                    const groupB = (0, resolve_module_1.findGroupConfig)(result, moduleNameB);
                    (0, chai_1.expect)(groupB.actions).to.exist;
                    (0, chai_1.expect)(groupB.actions.length).to.eql(1);
                    const buildB = (0, resolve_module_1.findActionConfigInGroup)(groupB, "Build", moduleNameB);
                    (0, chai_1.expect)(buildB).to.exist;
                    (0, chai_1.expect)(buildB.name).to.eql(moduleNameB);
                    (0, chai_1.expect)(buildB.spec.command).to.eql(buildCommandB);
                    (0, chai_1.expect)(buildB.copyFrom).to.eql([{ build: moduleNameA, sourcePath, targetPath }]);
                });
                /**
                 * See TODO-G2 comments in {@link preprocessActionConfig}.
                 */
                it("converts the repositoryUrl field", async () => {
                    throw "TODO";
                });
                it("sets Build dependencies correctly", async () => {
                    throw "TODO";
                });
                describe("sets buildAtSource on Build", () => {
                    async function getGraph(name, local) {
                        const buildCommand = ["echo", name];
                        garden.setActionConfigs([
                            (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                                name,
                                type: "exec",
                                spec: {
                                    local,
                                    build: {
                                        command: buildCommand,
                                    },
                                    services: [],
                                    tasks: [],
                                    tests: [],
                                    env: {},
                                },
                            }),
                        ]);
                        return garden.getConfigGraph({ log: garden.log, emit: false });
                    }
                    function assertBuildAtSource(moduleName, result, buildAtSource) {
                        (0, chai_1.expect)(result.groups).to.exist;
                        const group = (0, resolve_module_1.findGroupConfig)(result, moduleName);
                        (0, chai_1.expect)(group.actions).to.exist;
                        (0, chai_1.expect)(group.actions.length).to.eql(1);
                        const build = (0, resolve_module_1.findActionConfigInGroup)(group, "Build", moduleName);
                        (0, chai_1.expect)(build).to.exist;
                        (0, chai_1.expect)(build.buildAtSource).to.eql(buildAtSource);
                    }
                    it("sets buildAtSource on Build if local:true", async () => {
                        const moduleA = "module-a";
                        const tmpGraph = await getGraph(moduleA, true);
                        const module = tmpGraph.getModule(moduleA);
                        const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [module], tmpGraph.moduleGraph);
                        assertBuildAtSource(module.name, result, true);
                    });
                    it("does not set buildAtSource on Build if local:false", async () => {
                        const moduleA = "module-a";
                        const tmpGraph = await getGraph(moduleA, false);
                        const module = tmpGraph.getModule(moduleA);
                        const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [module], tmpGraph.moduleGraph);
                        assertBuildAtSource(module.name, result, false);
                    });
                });
            });
            context("Deploy/Run/Test (runtime) actions", () => {
                it("correctly maps a serviceConfig to a Deploy with a build", async () => {
                    // Dependencies
                    // build field
                    // timeout
                    // service spec
                    const moduleNameA = "module-a";
                    const buildCommandA = ["echo", moduleNameA];
                    const serviceNameA = "service-a";
                    const deployCommandA = ["echo", "deployed", serviceNameA];
                    const moduleConfigA = (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                        name: moduleNameA,
                        type: "exec",
                        spec: {
                            // <--- plugin-level build field
                            build: {
                                command: buildCommandA,
                            },
                            services: [
                                {
                                    name: serviceNameA,
                                    deployCommand: deployCommandA,
                                    dependencies: [],
                                    disabled: false,
                                    env: {},
                                    timeout: 10,
                                },
                            ],
                            tasks: [],
                            tests: [],
                            env: {},
                        },
                    });
                    garden.setActionConfigs([moduleConfigA]);
                    // this will produce modules with `serviceConfigs` fields initialized
                    const tmpGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
                    const moduleA = tmpGraph.getModule(moduleNameA);
                    // this will use `serviceConfigs` defined in modules
                    const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [moduleA], tmpGraph.moduleGraph);
                    (0, chai_1.expect)(result.groups).to.exist;
                    const groupA = (0, resolve_module_1.findGroupConfig)(result, moduleNameA);
                    (0, chai_1.expect)(groupA).to.exist;
                    const buildA = (0, resolve_module_1.findActionConfigInGroup)(groupA, "Build", moduleNameA);
                    (0, chai_1.expect)(buildA).to.exist;
                    (0, chai_1.expect)(buildA.dependencies).to.eql([]);
                    const deployA = (0, resolve_module_1.findActionConfigInGroup)(groupA, "Deploy", serviceNameA);
                    (0, chai_1.expect)(deployA).to.exist;
                    (0, chai_1.expect)(deployA.build).to.eql(moduleNameA);
                    (0, chai_1.expect)(deployA.dependencies).to.eql([]);
                });
                it("correctly maps a serviceConfig to a Deploy with no build", async () => {
                    throw "TODO";
                    // Dependencies
                    // + build dependencies
                    // timeout
                    // service spec
                });
                it("correctly maps a taskConfig to a Run with a build", async () => {
                    // Dependencies
                    // build field
                    // timeout
                    // task spec
                    const moduleNameA = "module-a";
                    const buildCommandA = ["echo", moduleNameA];
                    const taskNameA = "task-a";
                    const commandA = ["echo", "deployed", taskNameA];
                    const moduleConfigA = (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                        name: moduleNameA,
                        type: "exec",
                        spec: {
                            // <--- plugin-level build field
                            build: {
                                command: buildCommandA,
                            },
                            services: [],
                            tests: [],
                            tasks: [
                                {
                                    name: taskNameA,
                                    command: commandA,
                                    dependencies: [],
                                    disabled: false,
                                    env: {},
                                    timeout: 10,
                                },
                            ],
                            env: {},
                        },
                    });
                    garden.setActionConfigs([moduleConfigA]);
                    // this will produce modules with `serviceConfigs` fields initialized
                    const tmpGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
                    const moduleA = tmpGraph.getModule(moduleNameA);
                    // this will use `serviceConfigs` defined in modules
                    const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [moduleA], tmpGraph.moduleGraph);
                    (0, chai_1.expect)(result.groups).to.exist;
                    const groupA = (0, resolve_module_1.findGroupConfig)(result, moduleNameA);
                    (0, chai_1.expect)(groupA).to.exist;
                    const buildA = (0, resolve_module_1.findActionConfigInGroup)(groupA, "Build", moduleNameA);
                    (0, chai_1.expect)(buildA).to.exist;
                    (0, chai_1.expect)(buildA.dependencies).to.eql([]);
                    const runA = (0, resolve_module_1.findActionConfigInGroup)(groupA, "Run", taskNameA);
                    (0, chai_1.expect)(runA).to.exist;
                    (0, chai_1.expect)(runA.build).to.eql(moduleNameA);
                    (0, chai_1.expect)(runA.dependencies).to.eql([]);
                });
                it("correctly maps a taskConfig to a Run with no build", async () => {
                    throw "TODO";
                    // Dependencies
                    // + build dependencies
                    // timeout
                    // task spec
                });
                it("correctly maps a testConfig to a Test with a build", async () => {
                    // Dependencies
                    // build field
                    // timeout
                    // test spec
                    const moduleNameA = "module-a";
                    const buildCommandA = ["echo", moduleNameA];
                    const testNameA = "test-a";
                    const convertedTestNameA = "module-a-test-a";
                    const commandA = ["echo", "deployed", testNameA];
                    const moduleConfigA = (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                        name: moduleNameA,
                        type: "exec",
                        spec: {
                            // <--- plugin-level build field
                            build: {
                                command: buildCommandA,
                            },
                            services: [],
                            tasks: [],
                            tests: [
                                {
                                    name: testNameA,
                                    command: commandA,
                                    dependencies: [],
                                    disabled: false,
                                    env: {},
                                    timeout: 10,
                                },
                            ],
                            env: {},
                        },
                    });
                    garden.setActionConfigs([moduleConfigA]);
                    // this will produce modules with `serviceConfigs` fields initialized
                    const tmpGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
                    const moduleA = tmpGraph.getModule(moduleNameA);
                    // this will use `serviceConfigs` defined in modules
                    const result = await (0, resolve_module_1.convertModules)(garden, garden.log, [moduleA], tmpGraph.moduleGraph);
                    (0, chai_1.expect)(result.groups).to.exist;
                    const groupA = (0, resolve_module_1.findGroupConfig)(result, moduleNameA);
                    (0, chai_1.expect)(groupA).to.exist;
                    const buildA = (0, resolve_module_1.findActionConfigInGroup)(groupA, "Build", moduleNameA);
                    (0, chai_1.expect)(buildA).to.exist;
                    (0, chai_1.expect)(buildA.dependencies).to.eql([]);
                    const testA = (0, resolve_module_1.findActionConfigInGroup)(groupA, "Test", convertedTestNameA);
                    (0, chai_1.expect)(testA).to.exist;
                    (0, chai_1.expect)(testA.build).to.eql(moduleNameA);
                    (0, chai_1.expect)(testA.dependencies).to.eql([]);
                });
                it("correctly maps a testConfig to a Test with no build", async () => {
                    throw "TODO";
                    // Dependencies
                    // + build dependencies
                    // timeout
                    // test spec
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4ZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCxpREFBcUM7QUFDckMsK0JBQTZCO0FBQzdCLCtCQUEyQjtBQUMzQixzREFBNEI7QUFHNUIsK0RBQWlHO0FBRWpHLG1DQUE4QjtBQUM5QixpREFRNEI7QUFDNUIsc0RBQXNEO0FBQ3RELGlEQUFvRDtBQUdwRCx1Q0FBK0M7QUFDL0Msd0RBQXdEO0FBQ3hELHVDQUEyQztBQUMzQywyREFBdUQ7QUFDdkQsdURBQW9EO0FBQ3BELCtFQUFvRztBQUNwRyw4REFBbUU7QUFHbkUsc0VBSzBDO0FBTzFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO0lBQzNCLE9BQU8sQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDdkMsTUFBTSxlQUFlLEdBQUcsSUFBQSxvQkFBVSxFQUFDLG1CQUFtQixDQUFDLENBQUE7UUFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBQSxtQkFBWSxHQUFFLENBQUE7UUFFN0IsSUFBSSxNQUFjLENBQUE7UUFDbEIsSUFBSSxHQUFrQixDQUFBO1FBQ3RCLElBQUksWUFBMEIsQ0FBQTtRQUM5QixJQUFJLEtBQWtCLENBQUE7UUFDdEIsSUFBSSxHQUFhLENBQUE7UUFFakIsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ3BCLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxlQUFlLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDckUsS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBQ3JFLFlBQVksR0FBRyxNQUFNLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxN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