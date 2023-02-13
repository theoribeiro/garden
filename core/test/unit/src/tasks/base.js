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
const base_1 = require("../../../../src/tasks/base");
describe("BaseActionTask", () => {
    let garden;
    let graph;
    let log;
    const projectRoot = (0, helpers_1.getDataDir)("test-project-test-deps");
    class TestTask extends base_1.BaseActionTask {
        constructor() {
            super(...arguments);
            this.type = "test";
        }
        getDescription() {
            return "foo";
        }
        async getStatus() {
            return { state: "ready", outputs: {} };
        }
        async process() {
            return { state: "ready", outputs: {} };
        }
    }
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        // Adding this to test dependencies on Test actions
        garden.addAction({
            kind: "Test",
            name: "test-b",
            type: "test",
            dependencies: [
                { kind: "Build", name: "module-a" },
                { kind: "Deploy", name: "service-b" },
                { kind: "Run", name: "task-a" },
                { kind: "Test", name: "module-a-integ" },
            ],
            internal: {
                basePath: projectRoot,
            },
            spec: {
                command: ["echo", "foo"],
            },
        });
        graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        log = garden.log;
    });
    describe("resolveStatusDependencies", () => {
        it("returns the resolve task for the action", async () => {
            const action = graph.getTest("module-a-integ");
            const task = new TestTask({
                garden,
                log,
                graph,
                action,
                force: true,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            const deps = task.resolveStatusDependencies();
            (0, chai_1.expect)(deps.map((d) => d.getBaseKey())).to.eql(["resolve-action.test.module-a-integ"]);
        });
    });
    describe("resolveProcessDependencies", () => {
        it("should include task dependencies", async () => {
            const action = graph.getTest("module-a-integ");
            const task = new TestTask({
                garden,
                log,
                graph,
                action,
                force: true,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            const deps = task.resolveProcessDependencies({ status: null });
            (0, chai_1.expect)(deps.map((d) => d.getBaseKey()).sort()).to.eql([
                "build.module-a",
                "deploy.service-b",
                "resolve-action.test.module-a-integ",
                "run.task-a",
            ]);
        });
        it("includes all runtime dependencies by default", async () => {
            const action = graph.getTest("test-b");
            const task = new TestTask({
                garden,
                log,
                graph,
                action,
                force: true,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            const deps = task.resolveProcessDependencies({ status: null });
            (0, chai_1.expect)(deps.map((d) => d.getBaseKey()).sort()).to.eql([
                "build.module-a",
                "deploy.service-b",
                "resolve-action.test.test-b",
                "run.task-a",
                "test.module-a-integ",
            ]);
        });
        it("returns just the resolve task if the status is ready and force=false", async () => {
            const action = graph.getTest("module-a-integ");
            const task = new TestTask({
                garden,
                log,
                graph,
                action,
                force: false,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            const deps = task.resolveProcessDependencies({ status: { state: "ready", outputs: {} } });
            (0, chai_1.expect)(deps.map((d) => d.getBaseKey())).to.eql(["resolve-action.test.module-a-integ"]);
        });
        context("when skipRuntimeDependencies = true", () => {
            it("doesn't return Deploy, Run or Test dependencies", async () => {
                graph = await garden.getConfigGraph({ log: garden.log, emit: false });
                const action = graph.getTest("test-b");
                const task = new TestTask({
                    garden,
                    log,
                    graph,
                    action,
                    force: true,
                    forceBuild: false,
                    skipRuntimeDependencies: true,
                    devModeDeployNames: [],
                    localModeDeployNames: [],
                });
                const deps = task.resolveProcessDependencies({ status: null });
                (0, chai_1.expect)(deps.map((d) => d.getBaseKey()).sort()).to.eql([
                    "build.module-a",
                    // "deploy.service-b", <----
                    "resolve-action.test.test-b",
                    // "run.task-a", <----
                    // "test.module-a-integ", <----
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsOENBQXlFO0FBR3pFLHFEQUE0RTtBQUc1RSxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0lBQzlCLElBQUksTUFBa0IsQ0FBQTtJQUN0QixJQUFJLEtBQWtCLENBQUE7SUFDdEIsSUFBSSxHQUFhLENBQUE7SUFFakIsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLHdCQUF3QixDQUFDLENBQUE7SUFFeEQsTUFBTSxRQUFTLFNBQVEscUJBQTJDO1FBQWxFOztZQUNFLFNBQUksR0FBRyxNQUFNLENBQUE7UUFhZixDQUFDO1FBWEMsY0FBYztZQUNaLE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFTO1lBQ2IsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBcUIsQ0FBQTtRQUMzRCxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU87WUFDWCxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFxQixDQUFBO1FBQzNELENBQUM7S0FDRjtJQUVELFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxDQUFDLENBQUE7UUFDMUMsbURBQW1EO1FBQ25ELE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFDZixJQUFJLEVBQUUsTUFBTTtZQUNaLElBQUksRUFBRSxRQUFRO1lBQ2QsSUFBSSxFQUFFLE1BQU07WUFDWixZQUFZLEVBQUU7Z0JBQ1osRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUU7Z0JBQ25DLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFF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