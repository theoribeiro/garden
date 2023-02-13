"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const chai_1 = require("chai");
const fs_extra_1 = require("fs-extra");
const helpers_1 = require("../../helpers");
const util_1 = require("../../../src/util/util");
const config_graph_1 = require("../../../src/graph/config-graph");
const constants_1 = require("../../../src/constants");
const common_1 = require("../../../src/config/common");
const makeAction = ({ basePath, name, kind, spec, disabled, }) => ({
    apiVersion: constants_1.DEFAULT_API_VERSION,
    kind,
    name,
    type: "test",
    disabled,
    internal: {
        basePath,
    },
    spec,
});
async function makeGarden(tmpDir, plugin) {
    const config = (0, helpers_1.createProjectConfig)({
        path: tmpDir.path,
        providers: [{ name: "test" }],
    });
    const garden = await helpers_1.TestGarden.factory(tmpDir.path, { config, plugins: [plugin] });
    return garden;
}
/**
 * TODO-G2B:
 *  - implement the remained test cases similar to the existing module-based (getDependants* and getDependencies)
 *  - consider using template helper functions or parameteric tests for the similar Build/Deploy/Run/Test spec
 */
describe("ConfigGraph (action-based configs)", () => {
    let tmpDir;
    let garden;
    let configGraph;
    // Minimalistic test plugin with no-op behaviour and without any schema validation constraints,
    // because we only need to unit test the processing of action configs into the action definitions.
    const testPlugin = (0, helpers_1.customizedTestPlugin)({
        name: "test",
        createActionTypes: {
            Build: [
                {
                    name: "test",
                    docs: "Test Build action",
                    schema: common_1.joi.object(),
                    handlers: {},
                },
            ],
            Deploy: [
                {
                    name: "test",
                    docs: "Test Deploy action",
                    schema: common_1.joi.object(),
                    handlers: {},
                },
            ],
            Run: [
                {
                    name: "test",
                    docs: "Test Run action",
                    schema: common_1.joi.object(),
                    handlers: {},
                },
            ],
            Test: [
                {
                    name: "test",
                    docs: "Test Test action",
                    schema: common_1.joi.object(),
                    handlers: {},
                },
            ],
        },
    });
    // Helpers to create minimalistic action configs.
    // Each action type has its own simple spec with a single field named `${lowercase(kind)}Command`.
    const _makeBuild = (name, disabled) => makeAction({
        basePath: tmpDir.path,
        name,
        kind: "Build",
        spec: {
            buildCommand: ["echo", name, "ok"],
        },
        disabled,
    });
    const makeBuild = (name) => _makeBuild(name, false);
    const makeDisabledBuild = (name) => _makeBuild(name, true);
    const _makeDeploy = (name, disabled) => makeAction({
        basePath: tmpDir.path,
        name,
        kind: "Deploy",
        spec: {
            deployCommand: ["echo", name, "ok"],
        },
        disabled,
    });
    const makeDeploy = (name) => _makeDeploy(name, false);
    const makeDisabledDeploy = (name) => _makeDeploy(name, true);
    const _makeRun = (name, disabled) => makeAction({
        basePath: tmpDir.path,
        name,
        kind: "Run",
        spec: {
            runCommand: ["echo", name, "ok"],
        },
        disabled,
    });
    const makeRun = (name) => _makeRun(name, false);
    const makeDisabledRun = (name) => _makeRun(name, true);
    const _makeTest = (name, disabled) => makeAction({
        basePath: tmpDir.path,
        name,
        kind: "Test",
        spec: {
            testCommand: ["echo", name, "ok"],
        },
        disabled,
    });
    const makeTest = (name) => _makeTest(name, false);
    const makeDisabledTest = (name) => _makeTest(name, true);
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        // init Garden and some actions of each kind
        garden = await makeGarden(tmpDir, testPlugin);
        const validActionConfigs = [
            makeBuild("build-1"),
            makeBuild("build-2"),
            makeBuild("build-3"),
            makeDeploy("deploy-1"),
            makeDeploy("deploy-2"),
            makeDeploy("deploy-3"),
            makeRun("run-1"),
            makeRun("run-2"),
            makeRun("run-3"),
            makeTest("test-1"),
            makeTest("test-2"),
            makeTest("test-3"),
        ];
        garden.setActionConfigs([], [...validActionConfigs]);
        configGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    describe("getActionsByKind", () => {
        describe("getBuilds", () => {
            it("should return all registered Build actions", async () => {
                const buildActions = configGraph.getBuilds();
                (0, chai_1.expect)((0, util_1.getNames)(buildActions).sort()).to.eql(["build-1", "build-2", "build-3"]);
                const spec1 = buildActions[0].getConfig("spec");
                (0, chai_1.expect)(spec1.buildCommand).to.eql(["echo", "build-1", "ok"]);
                const spec2 = buildActions[1].getConfig("spec");
                (0, chai_1.expect)(spec2.buildCommand).to.eql(["echo", "build-2", "ok"]);
                const spec3 = buildActions[2].getConfig("spec");
                (0, chai_1.expect)(spec3.buildCommand).to.eql(["echo", "build-3", "ok"]);
            });
            it("should optionally return specified Build actions in the context", async () => {
                const buildActions = configGraph.getBuilds({ names: ["build-1", "build-2"] });
                (0, chai_1.expect)((0, util_1.getNames)(buildActions).sort()).to.eql(["build-1", "build-2"]);
            });
            it("should omit disabled Build actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledBuild("disabled-build")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const buildActions = graph.getBuilds();
                (0, chai_1.expect)(buildActions).to.eql([]);
            });
            it("should optionally include disabled Build actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledBuild("disabled-build")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const disabledBuildActions = graph.getBuilds({ includeDisabled: true });
                (0, chai_1.expect)((0, util_1.getNames)(disabledBuildActions).sort()).to.eql(["disabled-build"]);
            });
            it("should throw if named Build action is missing", async () => {
                try {
                    configGraph.getBuilds({ names: ["missing-build"] });
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
            it("should throw if specifically requesting a disabled Build action", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledBuild("disabled-build")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                await (0, helpers_1.expectError)(() => graph.getBuilds({ names: ["disabled-build"] }), {
                    contains: "Could not find one or more Build actions: disabled-build",
                });
            });
        });
        describe("getDeploys", () => {
            it("should return all registered Deploy actions", async () => {
                const deployActions = configGraph.getDeploys();
                (0, chai_1.expect)((0, util_1.getNames)(deployActions).sort()).to.eql(["deploy-1", "deploy-2", "deploy-3"]);
                const spec1 = deployActions[0].getConfig("spec");
                (0, chai_1.expect)(spec1.deployCommand).to.eql(["echo", "deploy-1", "ok"]);
                const spec2 = deployActions[1].getConfig("spec");
                (0, chai_1.expect)(spec2.deployCommand).to.eql(["echo", "deploy-2", "ok"]);
                const spec3 = deployActions[2].getConfig("spec");
                (0, chai_1.expect)(spec3.deployCommand).to.eql(["echo", "deploy-3", "ok"]);
            });
            it("should optionally return specified Deploy actions in the context", async () => {
                const deployActions = configGraph.getDeploys({ names: ["deploy-1", "deploy-2"] });
                (0, chai_1.expect)((0, util_1.getNames)(deployActions).sort()).to.eql(["deploy-1", "deploy-2"]);
            });
            it("should omit disabled Deploy actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledDeploy("disabled-deploy")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const deployActions = graph.getDeploys();
                (0, chai_1.expect)(deployActions).to.eql([]);
            });
            it("should optionally include disabled Deploy actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledDeploy("disabled-deploy")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const disabledDeployActions = graph.getDeploys({ includeDisabled: true });
                (0, chai_1.expect)((0, util_1.getNames)(disabledDeployActions).sort()).to.eql(["disabled-deploy"]);
            });
            it("should throw if named Deploy action is missing", async () => {
                try {
                    configGraph.getDeploys({ names: ["missing-deploy"] });
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
            it("should throw if specifically requesting a disabled Deploy action", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledDeploy("disabled-deploy")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                await (0, helpers_1.expectError)(() => graph.getDeploys({ names: ["disabled-deploy"] }), {
                    contains: "Could not find one or more Deploy actions: disabled-deploy",
                });
            });
        });
        describe("getRuns", () => {
            it("should return all registered Run actions", async () => {
                const runActions = configGraph.getRuns();
                (0, chai_1.expect)((0, util_1.getNames)(runActions).sort()).to.eql(["run-1", "run-2", "run-3"]);
                const spec1 = runActions[0].getConfig("spec");
                (0, chai_1.expect)(spec1.runCommand).to.eql(["echo", "run-1", "ok"]);
                const spec2 = runActions[1].getConfig("spec");
                (0, chai_1.expect)(spec2.runCommand).to.eql(["echo", "run-2", "ok"]);
                const spec3 = runActions[2].getConfig("spec");
                (0, chai_1.expect)(spec3.runCommand).to.eql(["echo", "run-3", "ok"]);
            });
            it("should optionally return specified Run actions in the context", async () => {
                const runActions = configGraph.getRuns({ names: ["run-1", "run-2"] });
                (0, chai_1.expect)((0, util_1.getNames)(runActions).sort()).to.eql(["run-1", "run-2"]);
            });
            it("should omit disabled Run actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledRun("disabled-run")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const runActions = graph.getRuns();
                (0, chai_1.expect)(runActions).to.eql([]);
            });
            it("should optionally include disabled Run actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledRun("disabled-run")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const disabledRunActions = graph.getRuns({ includeDisabled: true });
                (0, chai_1.expect)((0, util_1.getNames)(disabledRunActions).sort()).to.eql(["disabled-run"]);
            });
            it("should throw if named Run action is missing", async () => {
                try {
                    configGraph.getRuns({ names: ["missing-run"] });
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
            it("should throw if specifically requesting a disabled Run action", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledRun("disabled-run")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                await (0, helpers_1.expectError)(() => graph.getRuns({ names: ["disabled-run"] }), {
                    contains: "Could not find one or more Run actions: disabled-run",
                });
            });
        });
        describe("getTests", () => {
            it("should return all registered Test actions", async () => {
                const testActions = configGraph.getTests();
                (0, chai_1.expect)((0, util_1.getNames)(testActions).sort()).to.eql(["test-1", "test-2", "test-3"]);
                const spec1 = testActions[0].getConfig("spec");
                (0, chai_1.expect)(spec1.testCommand).to.eql(["echo", "test-1", "ok"]);
                const spec2 = testActions[1].getConfig("spec");
                (0, chai_1.expect)(spec2.testCommand).to.eql(["echo", "test-2", "ok"]);
                const spec3 = testActions[2].getConfig("spec");
                (0, chai_1.expect)(spec3.testCommand).to.eql(["echo", "test-3", "ok"]);
            });
            it("should optionally return specified Test actions in the context", async () => {
                const testActions = configGraph.getTests({ names: ["test-1", "test-2"] });
                (0, chai_1.expect)((0, util_1.getNames)(testActions).sort()).to.eql(["test-1", "test-2"]);
            });
            it("should omit disabled Test actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledTest("disabled-test")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const testActions = graph.getTests();
                (0, chai_1.expect)(testActions).to.eql([]);
            });
            it("should optionally include disabled Test actions", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledTest("disabled-test")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                const disabledTestActions = graph.getTests({ includeDisabled: true });
                (0, chai_1.expect)((0, util_1.getNames)(disabledTestActions).sort()).to.eql(["disabled-test"]);
            });
            it("should throw if named Test action is missing", async () => {
                try {
                    configGraph.getTests({ names: ["missing-test"] });
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
            it("should throw if specifically requesting a disabled Test action", async () => {
                const tmpGarden = await makeGarden(tmpDir, testPlugin);
                tmpGarden.setActionConfigs([], [makeDisabledTest("disabled-test")]);
                const graph = await tmpGarden.getConfigGraph({ log: tmpGarden.log, emit: false });
                await (0, helpers_1.expectError)(() => graph.getTests({ names: ["disabled-test"] }), {
                    contains: "Could not find one or more Test actions: disabled-test",
                });
            });
        });
    });
    describe("getActionByKind", () => {
        describe("getBuild", () => {
            it("should return the specified Build action", async () => {
                const buildAction = configGraph.getBuild("build-1");
                (0, chai_1.expect)(buildAction.name).to.equal("build-1");
                const spec = buildAction.getConfig("spec");
                (0, chai_1.expect)(spec.buildCommand).to.eql(["echo", "build-1", "ok"]);
            });
            it("should throw if Build action is missing", async () => {
                try {
                    configGraph.getBuild("missing-build");
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
        });
        describe("getDeploy", () => {
            it("should return the specified Deploy action", async () => {
                const deployAction = configGraph.getDeploy("deploy-1");
                (0, chai_1.expect)(deployAction.name).to.equal("deploy-1");
                const spec = deployAction.getConfig("spec");
                (0, chai_1.expect)(spec.deployCommand).to.eql(["echo", "deploy-1", "ok"]);
            });
            it("should throw if Deploy action is missing", async () => {
                try {
                    configGraph.getDeploy("missing-deploy");
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
        });
        describe("getRun", () => {
            it("should return the specified Run action", async () => {
                const runAction = configGraph.getRun("run-1");
                (0, chai_1.expect)(runAction.name).to.equal("run-1");
                const spec = runAction.getConfig("spec");
                (0, chai_1.expect)(spec.runCommand).to.eql(["echo", "run-1", "ok"]);
            });
            it("should throw if Run action is missing", async () => {
                try {
                    configGraph.getRun("missing-run");
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
        });
        describe("getTest", () => {
            it("should return the specified Test action", async () => {
                const testAction = configGraph.getTest("test-1");
                (0, chai_1.expect)(testAction.name).to.equal("test-1");
                const spec = testAction.getConfig("spec");
                (0, chai_1.expect)(spec.testCommand).to.eql(["echo", "test-1", "ok"]);
            });
            it("should throw if Test action is missing", async () => {
                try {
                    configGraph.getTest("missing-test");
                }
                catch (err) {
                    (0, chai_1.expect)(err.type).to.equal("graph");
                    return;
                }
                throw new Error("Expected error");
            });
        });
    });
});
describe("ConfigGraph (module-based configs)", () => {
    let gardenA;
    let graphA;
    let tmpPath;
    before(async () => {
        gardenA = await (0, helpers_1.makeTestGardenA)();
        graphA = await gardenA.getConfigGraph({ log: gardenA.log, emit: false });
        tmpPath = (0, path_1.join)(constants_1.GARDEN_CORE_ROOT, "tmp");
        await (0, fs_extra_1.ensureDir)(tmpPath);
    });
    it("should throw when two deploy actions have the same name", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "duplicate-service"));
        await (0, helpers_1.expectError)(() => garden.getConfigGraph({ log: garden.log, emit: false }), {
            contains: "Service names must be unique - the service name 'dupe' is declared multiple times (in modules 'module-a' and 'module-b')",
        });
    });
    it("should throw when two run actions have the same name", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "duplicate-task"));
        await (0, helpers_1.expectError)(() => garden.getConfigGraph({ log: garden.log, emit: false }), {
            contains: "Task names must be unique - the task name 'dupe' is declared multiple times (in modules 'module-a' and 'module-b')",
        });
    });
    it("should throw when a deploy and a run actions have the same name", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "duplicate-service-and-task"));
        await (0, helpers_1.expectError)(() => garden.getConfigGraph({ log: garden.log, emit: false }), {
            contains: "Service and task names must be mutually unique - the name 'dupe' is used for a task in 'module-b' and for a service in 'module-a'",
        });
    });
    it("should automatically add service source modules as module build dependencies", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "source-module"));
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const module = graph.getModule("module-b");
        (0, chai_1.expect)(module.build.dependencies).to.eql([{ name: "module-a", copy: [] }]);
    });
    describe("getActions", () => {
        it("returns all actions in graph", () => {
            const actions = graphA.getActions();
            (0, chai_1.expect)(actions.map((a) => a.key()).sort()).to.eql([
                "build.module-a",
                "build.module-b",
                "build.module-c",
                "deploy.service-a",
                "deploy.service-b",
                "deploy.service-c",
                "run.task-a",
                "run.task-a2",
                "run.task-b",
                "run.task-c",
                "test.module-a-integration",
                "test.module-a-unit",
                "test.module-b-unit",
                "test.module-c-integ",
                "test.module-c-unit",
            ]);
        });
        it("returns actions matching the given references", () => {
            const actions = graphA.getActions({
                refs: [
                    { kind: "Build", name: "module-a" },
                    { kind: "Run", name: "task-c" },
                ],
            });
            (0, chai_1.expect)(actions.map((a) => a.key()).sort()).to.eql(["build.module-a", "run.task-c"]);
        });
    });
    describe("getModules", () => {
        it("should scan and return all registered modules in the context", async () => {
            const modules = graphA.getModules();
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-b", "module-c"]);
        });
        it("should optionally return specified modules in the context", async () => {
            const modules = graphA.getModules({ names: ["module-b", "module-c"] });
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-b", "module-c"]);
        });
        it("should omit disabled modules", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            await garden.scanAndAddConfigs();
            garden["moduleConfigs"]["module-c"].disabled = true;
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const modules = graph.getModules();
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-b"]);
        });
        it("should optionally include disabled modules", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            await garden.scanAndAddConfigs();
            garden["moduleConfigs"]["module-c"].disabled = true;
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const modules = graph.getModules({ includeDisabled: true });
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-b", "module-c"]);
        });
        it("should throw if specifically requesting a disabled module", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            await garden.scanAndAddConfigs();
            garden["moduleConfigs"]["module-c"].disabled = true;
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            await (0, helpers_1.expectError)(() => graph.getModules({ names: ["module-c"] }), {
                contains: "Could not find module(s): module-c",
            });
        });
        it("should throw if named module is missing", async () => {
            try {
                graphA.getModules({ names: ["bla"] });
            }
            catch (err) {
                (0, chai_1.expect)(err.type).to.equal("parameter");
                return;
            }
            throw new Error("Expected error");
        });
        it("should throw if a build dependency is missing", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                (0, helpers_1.makeTestModule)({
                    name: "test",
                    path: tmpPath,
                    build: {
                        dependencies: [{ name: "missing-build-dep", copy: [] }],
                    },
                }),
            ]);
            await (0, helpers_1.expectError)(() => garden.getConfigGraph({ log: garden.log, emit: false }), {
                contains: "Could not find build dependency missing-build-dep, configured in module test",
            });
        });
        it("should throw if a runtime dependency is missing", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                (0, helpers_1.makeTestModule)({
                    name: "test",
                    path: tmpPath,
                    spec: {
                        services: [
                            {
                                name: "test-service",
                                dependencies: ["missing-runtime-dep"],
                                disabled: false,
                                spec: {},
                            },
                        ],
                    },
                }),
            ]);
            await (0, helpers_1.expectError)(() => garden.getConfigGraph({ log: garden.log, emit: false }), {
                contains: "Unknown service or task 'missing-runtime-dep' referenced in dependencies",
            });
        });
    });
    describe("getDeploys", () => {
        it("should scan for modules and return all registered deploys in the context", async () => {
            const deploys = graphA.getDeploys();
            (0, chai_1.expect)((0, util_1.getNames)(deploys).sort()).to.eql(["service-a", "service-b", "service-c"]);
        });
        it("should optionally return specified deploys in the context", async () => {
            const deploys = graphA.getDeploys({ names: ["service-b", "service-c"] });
            (0, chai_1.expect)((0, util_1.getNames)(deploys).sort()).to.eql(["service-b", "service-c"]);
        });
        it("should omit disabled deploys", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "disabled-service",
                                dependencies: [],
                                disabled: true,
                                spec: {},
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDeploys();
            (0, chai_1.expect)(deps).to.eql([]);
        });
        it("should optionally include disabled deploys", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "disabled-service",
                                dependencies: [],
                                disabled: true,
                                spec: {},
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deploys = graph.getDeploys({ includeDisabled: true });
            (0, chai_1.expect)((0, util_1.getNames)(deploys)).to.eql(["disabled-service"]);
        });
        it("should throw if specifically requesting a disabled deploy", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service-a",
                                dependencies: [],
                                disabled: true,
                                spec: {},
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            await (0, helpers_1.expectError)(() => graph.getDeploys({ names: ["service-a"] }), {
                contains: "Could not find one or more Deploy actions: service-a",
            });
        });
        it("should throw if named deploy is missing", async () => {
            try {
                graphA.getDeploys({ names: ["bla"] });
            }
            catch (err) {
                (0, chai_1.expect)(err.type).to.equal("graph");
                return;
            }
            throw new Error("Expected error");
        });
    });
    describe("getDeploy", () => {
        it("should return the specified deploy", async () => {
            const deploy = graphA.getDeploy("service-b");
            (0, chai_1.expect)(deploy.name).to.equal("service-b");
        });
        it("should throw if deploy is missing", async () => {
            try {
                graphA.getDeploy("bla");
            }
            catch (err) {
                (0, chai_1.expect)(err.type).to.equal("graph");
                return;
            }
            throw new Error("Expected error");
        });
    });
    describe("getRuns", () => {
        it("should scan for modules and return all registered runs in the context", async () => {
            const runs = graphA.getRuns();
            (0, chai_1.expect)((0, util_1.getNames)(runs).sort()).to.eql(["task-a", "task-a2", "task-b", "task-c"]);
        });
        it("should optionally return specified runs in the context", async () => {
            const runs = graphA.getRuns({ names: ["task-b", "task-c"] });
            (0, chai_1.expect)((0, util_1.getNames)(runs).sort()).to.eql(["task-b", "task-c"]);
        });
        it("should omit disabled runs", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        tasks: [
                            {
                                name: "disabled-task",
                                command: ["echo", "ok"],
                                dependencies: [],
                                disabled: true,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getRuns();
            (0, chai_1.expect)(deps).to.eql([]);
        });
        it("should optionally include disabled runs", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        tasks: [
                            {
                                name: "disabled-task",
                                command: ["echo", "ok"],
                                dependencies: [],
                                disabled: true,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const runs = graph.getRuns({ includeDisabled: true });
            (0, chai_1.expect)((0, util_1.getNames)(runs)).to.eql(["disabled-task"]);
        });
        it("should throw if specifically requesting a disabled run", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        tasks: [
                            {
                                name: "disabled-task",
                                command: ["echo", "ok"],
                                dependencies: [],
                                disabled: true,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            await (0, helpers_1.expectError)(() => graph.getRuns({ names: ["disabled-task"] }), {
                contains: "Could not find one or more Run actions: disabled-task",
            });
        });
        it("should throw if named run is missing", async () => {
            try {
                graphA.getRuns({ names: ["bla"] });
            }
            catch (err) {
                (0, chai_1.expect)(err.type).to.equal("graph");
                return;
            }
            throw new Error("Expected error");
        });
    });
    describe("getRun", () => {
        it("should return the specified run", async () => {
            const run = graphA.getRun("task-b");
            (0, chai_1.expect)(run.name).to.equal("task-b");
        });
        it("should throw if run is missing", async () => {
            try {
                graphA.getRun("bla");
            }
            catch (err) {
                (0, chai_1.expect)(err.type).to.equal("graph");
                return;
            }
            throw new Error("Expected error");
        });
    });
    describe("getDependencies", () => {
        it("should include disabled modules in build dependencies", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            // FIXME: find a proper way of refreshing module configs programmatically.
            //  With the configs below, function convertModules(...) from convert-modules.ts loses the build actions info
            //  when its' called from Garden.getConfigGraph(...)
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    kind: "Module",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: true,
                    name: "module-a",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {},
                    testConfigs: [],
                    type: "test",
                },
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    kind: "Module",
                    allowPublish: false,
                    build: { dependencies: [{ name: "module-a", copy: [] }] },
                    disabled: false,
                    name: "module-b",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {},
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDependencies({
                kind: "Build",
                name: "module-b",
                recursive: false,
            });
            const buildDeps = deps.filter((d) => d.kind === "Build");
            (0, chai_1.expect)((0, util_1.getNames)(buildDeps)).to.eql(["module-a"]);
        });
        it("should ignore dependencies by deploys on disabled deploys", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "disabled-service",
                                dependencies: [],
                                disabled: true,
                            },
                            {
                                name: "enabled-service",
                                dependencies: ["disabled-service"],
                                disabled: true,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDependencies({
                kind: "Deploy",
                name: "enabled-service",
                recursive: false,
            });
            const deployDeps = deps.filter((d) => d.kind === "Deploy");
            (0, chai_1.expect)(deployDeps).to.eql([]);
        });
        it("should ignore dependencies by deploys on disabled runs", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "enabled-service",
                                dependencies: ["disabled-task"],
                                disabled: false,
                            },
                        ],
                        tasks: [
                            {
                                name: "disabled-task",
                                command: ["echo", "ok"],
                                dependencies: [],
                                disabled: true,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDependencies({
                kind: "Deploy",
                name: "enabled-service",
                recursive: false,
            });
            const runDeps = deps.filter((d) => d.kind === "Run");
            (0, chai_1.expect)(runDeps).to.eql([]);
        });
        it("should ignore dependencies by deploys on deploys in disabled modules", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "module-a",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "disabled-service",
                                dependencies: [],
                                disabled: true,
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
                    name: "module-b",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "enabled-service",
                                dependencies: ["disabled-service"],
                                disabled: false,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDependencies({
                kind: "Deploy",
                name: "enabled-service",
                recursive: false,
            });
            const deployDeps = deps.filter((d) => d.kind === "Deploy");
            (0, chai_1.expect)(deployDeps).to.eql([]);
        });
        it("should ignore dependencies by runs on disabled deploys", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "disabled-service",
                                dependencies: [],
                                disabled: true,
                            },
                        ],
                        tasks: [
                            {
                                name: "enabled-task",
                                command: ["echo", "ok"],
                                dependencies: ["disabled-service"],
                                disabled: false,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDependencies({
                kind: "Deploy",
                name: "enabled-task",
                recursive: false,
            });
            const deployDeps = deps.filter((d) => d.kind === "Deploy");
            (0, chai_1.expect)(deployDeps).to.eql([]);
        });
        it("should ignore dependencies by tests on disabled deploys", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "foo",
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "disabled-service",
                                dependencies: [],
                                disabled: true,
                            },
                        ],
                        tests: [
                            {
                                name: "enabled-test",
                                command: ["echo", "ok"],
                                dependencies: ["disabled-service"],
                                disabled: false,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDependencies({
                kind: "Deploy",
                name: "enabled-test",
                recursive: false,
            });
            const deployDeps = deps.filter((d) => d.kind === "Deploy");
            (0, chai_1.expect)(deployDeps).to.eql([]);
        });
    });
    describe("resolveDependencyModules", () => {
        it("should include disabled modules in build dependencies", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: true,
                    name: "module-a",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {},
                    testConfigs: [],
                    type: "test",
                },
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "module-b",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {},
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.moduleGraph.resolveDependencyModules([{ name: "module-a", copy: [] }], []);
            (0, chai_1.expect)((0, util_1.getNames)(deps)).to.eql(["module-a"]);
        });
    });
    describe("getDependants", () => {
        it("should not traverse past disabled deploys", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "module-a",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service-a",
                                dependencies: [],
                                disabled: true,
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
                    name: "module-b",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service-b",
                                dependencies: ["service-a"],
                                disabled: false,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const deps = graph.getDependants({ kind: "Build", name: "module-a", recursive: true });
            const deployDeps = deps.filter((d) => d.kind === "Deploy");
            (0, chai_1.expect)(deployDeps).to.eql([]);
        });
    });
    describe("getDependantsForModule", () => {
        it("should return deploys and runs for a build dependant of the given module", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    name: "module-a",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {},
                    testConfigs: [],
                    type: "test",
                },
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    allowPublish: false,
                    build: { dependencies: [{ name: "module-a", copy: [] }] },
                    disabled: false,
                    name: "module-b",
                    include: [],
                    path: tmpPath,
                    serviceConfigs: [],
                    taskConfigs: [],
                    spec: {
                        services: [
                            {
                                name: "service-b",
                                dependencies: [],
                                disabled: false,
                            },
                        ],
                        tasks: [
                            {
                                name: "task-b",
                                command: ["echo", "ok"],
                                dependencies: [],
                                disabled: false,
                            },
                        ],
                    },
                    testConfigs: [],
                    type: "test",
                },
            ]);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const moduleA = graph.getModule("module-a");
            const deps = graph.moduleGraph.getDependantsForModule(moduleA, true);
            (0, chai_1.expect)((0, util_1.getNames)(deps.deploy)).to.eql(["service-b"]);
            (0, chai_1.expect)((0, util_1.getNames)(deps.run)).to.eql(["task-b"]);
        });
    });
    describe("resolveDependencyModules", () => {
        it("should resolve build dependencies", async () => {
            const modules = graphA.moduleGraph.resolveDependencyModules([{ name: "module-c", copy: [] }], []);
            (0, chai_1.expect)((0, util_1.getNames)(modules)).to.eql(["module-a", "module-b", "module-c"]);
        });
        it("should resolve deploy dependencies", async () => {
            const modules = graphA.moduleGraph.resolveDependencyModules([], ["service-b"]);
            (0, chai_1.expect)((0, util_1.getNames)(modules)).to.eql(["module-a", "module-b"]);
        });
        it("should combine module and deploy dependencies", async () => {
            const modules = graphA.moduleGraph.resolveDependencyModules([{ name: "module-b", copy: [] }], ["service-c"]);
            (0, chai_1.expect)((0, util_1.getNames)(modules)).to.eql(["module-a", "module-b", "module-c"]);
        });
    });
    describe("render", () => {
        it("should render config graph nodes with test names", () => {
            const rendered = graphA.render();
            (0, chai_1.expect)(rendered.nodes).to.include.deep.members([
                {
                    kind: "Build",
                    name: "module-a",
                    key: "module-a",
                    disabled: false,
                },
                {
                    kind: "Build",
                    name: "module-b",
                    key: "module-b",
                    disabled: false,
                },
                {
                    kind: "Build",
                    name: "module-c",
                    key: "module-c",
                    disabled: false,
                },
                {
                    kind: "Test",
                    name: "module-c-unit",
                    key: "module-c-unit",
                    disabled: false,
                },
                {
                    kind: "Test",
                    name: "module-c-integ",
                    key: "module-c-integ",
                    disabled: false,
                },
                {
                    kind: "Run",
                    name: "task-c",
                    key: "task-c",
                    disabled: false,
                },
                {
                    kind: "Deploy",
                    name: "service-c",
                    key: "service-c",
                    disabled: false,
                },
                {
                    kind: "Test",
                    name: "module-a-unit",
                    key: "module-a-unit",
                    disabled: false,
                },
                {
                    kind: "Test",
                    name: "module-a-integration",
                    key: "module-a-integration",
                    disabled: false,
                },
                {
                    kind: "Run",
                    name: "task-a",
                    key: "task-a",
                    disabled: false,
                },
                {
                    kind: "Test",
                    name: "module-b-unit",
                    key: "module-b-unit",
                    disabled: false,
                },
                {
                    kind: "Run",
                    name: "task-b",
                    key: "task-b",
                    disabled: false,
                },
                {
                    kind: "Deploy",
                    name: "service-a",
                    key: "service-a",
                    disabled: false,
                },
                {
                    kind: "Deploy",
                    name: "service-b",
                    key: "service-b",
                    disabled: false,
                },
            ]);
        });
    });
});
describe("ConfigGraphNode", () => {
    describe("render", () => {
        it("should render a build node", () => {
            const node = new config_graph_1.ConfigGraphNode("Build", "module-a", false);
            const res = node.render();
            (0, chai_1.expect)(res).to.eql({
                kind: "Build",
                name: "module-a",
                key: "module-a",
                disabled: false,
            });
        });
        it("should render a deploy node", () => {
            const node = new config_graph_1.ConfigGraphNode("Deploy", "service-a", false);
            const res = node.render();
            (0, chai_1.expect)(res).to.eql({
                kind: "Deploy",
                name: "service-a",
                key: "service-a",
                disabled: false,
            });
        });
        it("should render a run node", () => {
            const node = new config_graph_1.ConfigGraphNode("Run", "task-a", false);
            const res = node.render();
            (0, chai_1.expect)(res).to.eql({
                kind: "Run",
                name: "task-a",
                key: "task-a",
                disabled: false,
            });
        });
        it("should render a test node", () => {
            const node = new config_graph_1.ConfigGraphNode("Test", "module-a.test-a", false);
            const res = node.render();
            (0, chai_1.expect)(res).to.eql({
                kind: "Test",
                name: "module-a.test-a",
                key: "module-a.test-a",
                disabled: false,
            });
        });
        it("should indicate if the node is disabled", () => {
            const node = new config_graph_1.ConfigGraphNode("Test", "module-a.test-a", true);
            const res = node.render();
            (0, chai_1.expect)(res).to.eql({
                kind: "Test",
                name: "module-a.test-a",
                key: "module-a.test-a",
                disabled: true,
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLWdyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLWdyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTJCO0FBQzNCLCtCQUE2QjtBQUM3Qix1Q0FBb0M7QUFDcEMsMkNBVXNCO0FBQ3RCLGlEQUFpRDtBQUNqRCxrRUFBOEU7QUFFOUUsc0RBQThFO0FBSzlFLHVEQUFnRDtBQUVoRCxNQUFNLFVBQVUsR0FBRyxDQUFDLEVBQ2xCLFFBQVEsRUFDUixJQUFJLEVBQ0osSUFBSSxFQUNKLElBQUksRUFDSixRQUFRLEdBT1QsRUFBb0IsRUFBRSxDQUFDLENBQUM7SUFDdkIsVUFBVSxFQUFFLCtCQUFtQjtJQUMvQixJQUFJO0lBQ0osSUFBSTtJQUNKLElBQUksRUFBRSxNQUFNO0lBQ1osUUFBUTtJQUNSLFFBQVEsRUFBRTtRQUNSLFFBQVE7S0FDVDtJQUNELElBQUk7Q0FDTCxDQUFDLENBQUE7QUFFRixLQUFLLFVBQVUsVUFBVSxDQUFDLE1BQTJCLEVBQUUsTUFBb0I7SUFDekUsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7UUFDaEQsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO1FBQ2pCLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO0tBQzlCLENBQUMsQ0FBQTtJQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sb0JBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbkYsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFFBQVEsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7SUFDbEQsSUFBSSxNQUEyQixDQUFBO0lBQy9CLElBQUksTUFBa0IsQ0FBQTtJQUN0QixJQUFJLFdBQXdC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