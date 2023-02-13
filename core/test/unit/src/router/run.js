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
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const helpers_1 = require("../../../helpers");
const _helpers_1 = require("./_helpers");
describe("run actions", () => {
    let garden;
    let graph;
    let log;
    let actionRouter;
    let returnWrongOutputsCfgKey;
    let resolvedRunAction;
    let taskResult = {};
    let dateUsedForCompleted;
    before(async () => {
        const data = await (0, _helpers_1.getRouterTestData)();
        garden = data.garden;
        graph = data.graph;
        log = data.log;
        actionRouter = data.actionRouter;
        resolvedRunAction = data.resolvedRunAction;
        returnWrongOutputsCfgKey = data.returnWrongOutputsCfgKey;
        dateUsedForCompleted = data.dateUsedForCompleted;
        taskResult = {
            detail: {
                command: ["foo"],
                completedAt: dateUsedForCompleted,
                log: "bla bla",
                moduleName: "task-a",
                startedAt: dateUsedForCompleted,
                success: true,
                taskName: "task-a",
                version: resolvedRunAction.versionString(),
            },
            outputs: {
                base: "ok",
                foo: "ok",
            },
            state: "ready",
        };
    });
    after(async () => {
        await garden.close();
    });
    afterEach(() => {
        resolvedRunAction._config[returnWrongOutputsCfgKey] = false;
    });
    describe("run.getResult", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const result = await actionRouter.run.getResult({
                log,
                action: resolvedRunAction,
                graph,
            });
            (0, chai_1.expect)(result).to.eql(taskResult);
        });
        it("should emit a taskStatus event", async () => {
            garden.events.eventLog = [];
            await actionRouter.run.getResult({
                log,
                action: resolvedRunAction,
                graph,
            });
            const event = garden.events.eventLog[0];
            (0, chai_1.expect)(event).to.exist;
            (0, chai_1.expect)(event.name).to.eql("taskStatus");
            (0, chai_1.expect)(event.payload.taskName).to.eql("task-a");
            (0, chai_1.expect)(event.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event.payload.moduleVersion).to.eql(resolvedRunAction.moduleVersion().versionString);
            (0, chai_1.expect)(event.payload.taskVersion).to.eql(resolvedRunAction.versionString());
            (0, chai_1.expect)(event.payload.actionUid).to.be.undefined;
            (0, chai_1.expect)(event.payload.status.state).to.eql("succeeded");
        });
        it("should throw if the outputs don't match the task outputs schema of the plugin", async () => {
            resolvedRunAction._config[returnWrongOutputsCfgKey] = true;
            await (0, helpers_1.expectError)(() => actionRouter.run.getResult({ log, action: resolvedRunAction, graph }), {
                contains: "Error validating runtime action outputs from Run 'task-a': key .foo must be a string",
            });
        });
    });
    describe("run.run", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const result = await actionRouter.run.run({
                log,
                action: resolvedRunAction,
                interactive: true,
                graph,
            });
            (0, chai_1.expect)(result).to.eql(taskResult);
        });
        it("should emit taskStatus events", async () => {
            garden.events.eventLog = [];
            await actionRouter.run.run({
                log,
                action: resolvedRunAction,
                interactive: true,
                graph,
            });
            const moduleVersion = resolvedRunAction.moduleVersion().versionString;
            const event1 = garden.events.eventLog[0];
            const event2 = garden.events.eventLog[1];
            (0, chai_1.expect)(event1).to.exist;
            (0, chai_1.expect)(event1.name).to.eql("taskStatus");
            (0, chai_1.expect)(event1.payload.taskName).to.eql("task-a");
            (0, chai_1.expect)(event1.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event1.payload.moduleVersion).to.eql(moduleVersion);
            (0, chai_1.expect)(event1.payload.taskVersion).to.eql(resolvedRunAction.versionString());
            (0, chai_1.expect)(event1.payload.actionUid).to.be.ok;
            (0, chai_1.expect)(event1.payload.status.state).to.eql("running");
            (0, chai_1.expect)(event2).to.exist;
            (0, chai_1.expect)(event2.name).to.eql("taskStatus");
            (0, chai_1.expect)(event2.payload.taskName).to.eql("task-a");
            (0, chai_1.expect)(event2.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event2.payload.moduleVersion).to.eql(moduleVersion);
            (0, chai_1.expect)(event2.payload.taskVersion).to.eql(resolvedRunAction.versionString());
            (0, chai_1.expect)(event2.payload.actionUid).to.eql(event1.payload.actionUid);
            (0, chai_1.expect)(event2.payload.status.state).to.eql("succeeded");
        });
        it("should throw if the outputs don't match the task outputs schema of the plugin", async () => {
            resolvedRunAction._config[returnWrongOutputsCfgKey] = true;
            await (0, helpers_1.expectError)(() => actionRouter.run.run({
                log,
                action: resolvedRunAction,
                interactive: true,
                graph,
            }), { contains: "Error validating runtime action outputs from Run 'task-a': key .foo must be a string" });
        });
        it("should copy artifacts exported by the handler to the artifacts directory", async () => {
            await (0, fs_extra_1.emptyDir)(garden.artifactsPath);
            graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const runActionTaskA = graph.getRun("task-a");
            runActionTaskA.getConfig().spec.artifacts = [
                {
                    source: "some-file.txt",
                },
                {
                    source: "some-dir/some-file.txt",
                    target: "some-dir/some-file.txt",
                },
            ];
            await actionRouter.run.run({
                log,
                action: await garden.resolveAction({
                    action: runActionTaskA,
                    log: garden.log,
                    graph,
                }),
                interactive: true,
                graph,
            });
            const targetPaths = runActionTaskA
                .getConfig()
                .spec.artifacts.map((spec) => (0, path_1.join)(garden.artifactsPath, spec.source))
                .sort();
            for (const path of targetPaths) {
                (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(path)).to.be.true;
            }
            const metadataKey = `run.task-a.${runActionTaskA.versionString()}`;
            const metadataFilename = `.metadata.${metadataKey}.json`;
            const metadataPath = (0, path_1.join)(garden.artifactsPath, metadataFilename);
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(metadataPath)).to.be.true;
            const metadata = JSON.parse((await (0, fs_extra_1.readFile)(metadataPath)).toString());
            (0, chai_1.expect)(metadata).to.eql({
                key: metadataKey,
                files: targetPaths,
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHVDQUF5RDtBQUN6RCwrQkFBMkI7QUFLM0IsOENBQTBEO0FBQzFELHlDQUE4QztBQUU5QyxRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxLQUFrQixDQUFBO0lBQ3RCLElBQUksR0FBYSxDQUFBO0lBQ2pCLElBQUksWUFBMEIsQ0FBQTtJQUM5QixJQUFJLHdCQUFnQyxDQUFBO0lBQ3BDLElBQUksaUJBQW9DLENBQUE7SUFDeEMsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFBO0lBQ25CLElBQUksb0JBQTBCLENBQUE7SUFFOUIsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSw0QkFBaUIsR0FBRSxDQUFBO1FBQ3RDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQ3BCLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBQ2xCLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO1FBQ2QsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUE7UUFDaEMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFBO1FBQzFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQTtRQUN4RCxvQkFBb0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUE7UUFDaEQsVUFBVSxHQUFHO1lBQ1gsTUFBTSxFQUFFO2dCQUNOLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQztnQkFDaEIsV0FBVyxFQUFFLG9CQUFvQjtnQkFDakMsR0FBRyxFQUFFLFNBQVM7Z0JBQ2QsVUFBVSxFQUFFLFFBQVE7Z0JBQ3BCLFNBQVMsRUFBRSxvQkFBb0I7Z0JBQy9CLE9BQU8s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