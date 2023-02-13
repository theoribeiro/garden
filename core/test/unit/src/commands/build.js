"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const build_1 = require("../../../../src/commands/build");
const chai_1 = require("chai");
const helpers_1 = require("../../../helpers");
const helpers_2 = require("../../../helpers");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const modules_1 = require("../../../../src/graph/modules");
describe("BuildCommand", () => {
    it("should build everything in a project and output the results", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const footerLog = garden.log;
        const command = new build_1.BuildCommand();
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": true, "with-dependants": false }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(result).error).to.be.undefined;
        // TODO-G2B: think about a way to use type-safe values in taskOutputResults
        const taskOutputResults = (0, helpers_2.taskResultOutputs)(result);
        (0, chai_1.expect)(taskOutputResults).to.eql({
            "build.module-a": {
                state: "ready",
                outputs: {},
                detail: { fresh: true, buildLog: "A" },
            },
            "build.module-b": {
                state: "ready",
                outputs: {},
                detail: { fresh: true, buildLog: "B" },
            },
            "build.module-c": {
                state: "ready",
                outputs: {},
                detail: {},
            },
        });
        // eslint-disable-next-line no-shadowed-variable
        function getBuildModuleResultVersion(result, moduleName) {
            var _a, _b;
            const buildActionResults = result.graphResults;
            const moduleKey = (0, modules_1.nodeKey)("build", moduleName);
            const buildModuleResult = buildActionResults[moduleKey];
            return (_b = (_a = buildModuleResult === null || buildModuleResult === void 0 ? void 0 : buildModuleResult.result) === null || _a === void 0 ? void 0 : _a.executedAction) === null || _b === void 0 ? void 0 : _b.moduleVersion().versionString;
        }
        const buildModuleAVersion = getBuildModuleResultVersion(result, "module-a");
        const buildModuleBVersion = getBuildModuleResultVersion(result, "module-b");
        const buildModuleCVersion = getBuildModuleResultVersion(result, "module-c");
        const graph = await garden.getConfigGraph({ log, emit: false });
        (0, chai_1.expect)(buildModuleAVersion).to.eql(graph.getBuild("module-a").moduleVersion().versionString);
        (0, chai_1.expect)(buildModuleBVersion).to.eql(graph.getBuild("module-b").moduleVersion().versionString);
        (0, chai_1.expect)(buildModuleCVersion).to.eql(graph.getBuild("module-c").moduleVersion().versionString);
    });
    it("should optionally run single build and its dependencies", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const footerLog = garden.log;
        const command = new build_1.BuildCommand();
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog,
            args: { names: ["module-b"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": true, "with-dependants": false }),
        });
        const taskOutputResults = (0, helpers_2.taskResultOutputs)(result);
        (0, chai_1.expect)(taskOutputResults).to.eql({
            "build.module-b": {
                state: "ready",
                outputs: {},
                detail: { fresh: true, buildLog: "B" },
            },
        });
    });
    it("should be protected", async () => {
        const command = new build_1.BuildCommand();
        (0, chai_1.expect)(command.protected).to.be.true;
    });
    it("should skip disabled modules", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const footerLog = garden.log;
        const command = new build_1.BuildCommand();
        await garden.scanAndAddConfigs();
        garden["moduleConfigs"]["module-c"].disabled = true;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": true, "with-dependants": false }),
        });
        (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
            "build.module-a": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "A" } },
            "build.module-b": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "B" } },
        });
    });
    it("should build disabled modules if they are dependencies of enabled modules", async () => {
        var _a, _b, _c;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const footerLog = garden.log;
        const command = new build_1.BuildCommand();
        await garden.scanAndAddConfigs();
        // module-b is a build dependency of module-c
        garden["moduleConfigs"]["module-b"].disabled = true;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": true, "with-dependants": false }),
        });
        (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
            "build.module-a": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "A" } },
            "build.module-c": { state: "ready", outputs: {}, detail: {} },
        });
        (0, chai_1.expect)((_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.graphResults["build.module-c"]) === null || _a === void 0 ? void 0 : _a.dependencyResults) === null || _b === void 0 ? void 0 : _b["build.module-c"]) === null || _c === void 0 ? void 0 : _c.success).to.be.true;
    });
    it("should build dependant modules when using the --with-dependants flag", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const footerLog = garden.log;
        const command = new build_1.BuildCommand();
        const moduleConfigs = [
            (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                name: "module-a",
                include: [],
                spec: {
                    services: [{ name: "service-a" }],
                    tests: [],
                    tasks: [],
                    build: { command: ["echo", "A"], dependencies: ["module-b", "module-c"] },
                },
            }),
            (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                name: "module-b",
                include: [],
                spec: {
                    services: [{ name: "service-b" }],
                    tests: [],
                    tasks: [],
                    build: { command: ["echo", "B"], dependencies: ["module-c"] },
                },
            }),
            (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                name: "module-c",
                include: [],
                spec: {
                    services: [{ name: "service-c" }],
                    tests: [],
                    tasks: [],
                    build: { command: ["echo", "C"], dependencies: ["module-d"] },
                },
            }),
            (0, helpers_1.makeModuleConfig)(garden.projectRoot, {
                name: "module-d",
                include: [],
                spec: {
                    services: [{ name: "service-d" }],
                    tests: [],
                    tasks: [],
                    build: { command: ["echo", "D"], dependencies: [] },
                },
            }),
        ];
        garden.setActionConfigs(moduleConfigs);
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": true, "with-dependants": true }), // <---
        });
        (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
            "build.module-a": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "A" } },
            "build.module-b": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "B" } },
            "build.module-c": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "C" } },
            "build.module-d": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "D" } },
        });
    });
    // adds a third level of dependants and tests rebuild logic after changes to modules
    context("tracking changes and rebuilding logic", () => {
        let log;
        let buildCommand;
        let projectPath;
        let defaultOpts;
        beforeEach(async () => {
            const tmpGarden = await (0, helpers_1.makeTestGardenBuildDependants)([], { noCache: true });
            log = tmpGarden.log;
            buildCommand = new build_1.BuildCommand();
            defaultOpts = { log, headerLog: log, footerLog: log };
            projectPath = (0, path_1.join)(tmpGarden.gardenDirPath, "../");
        });
        // The project needs to be deleted for fresh state, otherwise the same one would be reused across the test-cases.
        afterEach(async () => {
            await helpers_1.testProjectTempDirs[helpers_1.projectRootBuildDependants].cleanup();
            delete helpers_1.testProjectTempDirs[helpers_1.projectRootBuildDependants];
        });
        // Can't reuse same garden as there's caching going on that's way too hacky to disable
        async function getFreshTestGarden() {
            return await (0, helpers_1.makeTestGarden)(projectPath, { noTempDir: true, noCache: true });
        }
        // dependencies graph: (A and D depend on B which depends on C)
        // A->B->C
        // D->B->C
        it("should optionally build single module and its dependencies", async () => {
            const { result } = await buildCommand.action({
                garden: await (0, helpers_1.makeTestGarden)(projectPath, { noTempDir: true }),
                ...defaultOpts,
                args: { names: ["aaa-service"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": false }),
            });
            (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
                "build.aaa-service": { state: "ready", outputs: {}, detail: { fresh: true, buildLog: "build aaa module" } },
            });
        });
        it("should rebuild module if a deep dependency has been modified", async () => {
            const { result: result1 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: ["aaa-service"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": true, "with-dependants": false }),
            });
            const allResults1 = (0, helpers_2.getAllTaskResults)(result1.graphResults);
            await (0, fs_extra_1.writeFile)((0, path_1.join)(projectPath, "C/file.txt"), "module c has been modified");
            const { result: result2 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: ["aaa-service"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": false }),
            });
            const allResults2 = (0, helpers_2.getAllTaskResults)(result2.graphResults);
            (0, chai_1.expect)(allResults2["build.aaa-service"].version).not.to.be.eq(allResults1["build.aaa-service"].version);
            (0, chai_1.expect)(allResults2["build.bbb-service"].version).not.to.be.eq(allResults1["build.bbb-service"].version);
            (0, chai_1.expect)(allResults2["build.ccc-service"].version).not.to.be.eq(allResults1["build.ccc-service"].version);
        });
        it("should rebuild module and dependants if with-dependants flag has been passed", async () => {
            const { result: result1 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: undefined },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": false }),
            });
            const graphResult1 = result1.graphResults;
            const allResults1 = (0, helpers_2.getAllTaskResults)(graphResult1);
            await (0, fs_extra_1.writeFile)((0, path_1.join)(projectPath, "C/file.txt"), "module c has been modified");
            const { result: result2 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: ["bbb-service"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": true }), // <---
            });
            const graphResult2 = result2.graphResults;
            const allResults2 = (0, helpers_2.getAllTaskResults)(graphResult2);
            (0, chai_1.expect)(graphResult2["build.aaa-service"]).to.exist; // <-- The dependant should be added to the main output
            (0, chai_1.expect)(allResults2["build.aaa-service"].version).not.to.be.eq(allResults1["build.aaa-service"].version);
            (0, chai_1.expect)(allResults2["build.bbb-service"].version).not.to.be.eq(allResults1["build.bbb-service"].version);
            (0, chai_1.expect)(allResults2["build.ccc-service"].version).not.to.be.eq(allResults1["build.ccc-service"].version);
        });
        it("should rebuild only necessary modules after changes even if with-dependants flag has been passed", async () => {
            const { result: result1 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: undefined },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": false }),
            });
            const allResults1 = (0, helpers_2.getAllTaskResults)(result1.graphResults);
            await (0, fs_extra_1.writeFile)((0, path_1.join)(projectPath, "B/file.txt"), "module c has been modified");
            const { result: result2 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: ["bbb-service"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": true }), // <---
            });
            const allResults2 = (0, helpers_2.getAllTaskResults)(result2.graphResults);
            (0, chai_1.expect)(allResults2["build.aaa-service"].version).not.to.be.eq(allResults1["build.aaa-service"].version);
            (0, chai_1.expect)(allResults2["build.bbb-service"].version).not.to.be.eq(allResults1["build.bbb-service"].version);
            (0, chai_1.expect)(allResults2["build.ccc-service"].version, "c should be equal as it has not been changed").to.be.eq(allResults1["build.ccc-service"].version);
        });
        it("should not rebuild dependency after changes", async () => {
            const { result: result1 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: undefined },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": false }),
            });
            const allResults1 = (0, helpers_2.getAllTaskResults)(result1.graphResults);
            await (0, fs_extra_1.writeFile)((0, path_1.join)(projectPath, "B/file.txt"), "module c has been modified");
            const { result: result2 } = await buildCommand.action({
                garden: await getFreshTestGarden(),
                ...defaultOpts,
                args: { names: ["bbb-service"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "watch": false, "force": false, "with-dependants": false }),
            });
            const allResults2 = (0, helpers_2.getAllTaskResults)(result2.graphResults);
            (0, chai_1.expect)(allResults2["build.bbb-service"].version).not.to.be.eq(allResults1["build.bbb-service"].version);
            (0, chai_1.expect)(allResults2["build.ccc-service"].version, "c should be equal as it has not been changed").to.be.eq(allResults1["build.ccc-service"].version);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILDBEQUE2RDtBQUM3RCwrQkFBNkI7QUFDN0IsOENBUXlCO0FBQ3pCLDhDQUF1RTtBQUd2RSx1Q0FBb0M7QUFDcEMsK0JBQTJCO0FBRTNCLDJEQUF1RDtBQUV2RCxRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixFQUFFLENBQUMsNkRBQTZELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDM0UsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUN0QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFDNUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxvQkFBWSxFQUFFLENBQUE7UUFFbEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN0QyxNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUztZQUNULElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDMUIsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLENBQUM7U0FDekYsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtRQUV0RSwyRUFBMkU7UUFDM0UsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLDJCQUFpQixFQUFDLE1BQU8sQ0FBQyxDQUFB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