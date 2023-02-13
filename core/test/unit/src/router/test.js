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
const actions_1 = require("../../../../src/graph/actions");
const _helpers_1 = require("./_helpers");
describe("test actions", () => {
    let garden;
    let graph;
    let log;
    let actionRouter;
    let module;
    async function getResolvedAction(testConfig) {
        const action = (await (0, actions_1.actionFromConfig)({
            garden,
            // rebuild config graph because the module config has been changed
            graph: await garden.getConfigGraph({ emit: false, log: garden.log }),
            config: testConfig,
            log: garden.log,
            configsByKey: {},
            router: await garden.getActionRouter(),
        }));
        return await garden.resolveAction({ action, log: garden.log });
    }
    before(async () => {
        const data = await (0, _helpers_1.getRouterTestData)();
        garden = data.garden;
        graph = data.graph;
        log = data.log;
        actionRouter = data.actionRouter;
        module = data.module;
    });
    after(async () => {
        await garden.close();
    });
    describe("test.run", () => {
        const actionConfig = {
            name: "test",
            type: "test",
            internal: { basePath: "test" },
            kind: "Test",
            dependencies: [],
            disabled: false,
            timeout: 1234,
            spec: {},
        };
        it("should correctly call the corresponding plugin handler", async () => {
            var _a;
            const action = await getResolvedAction(actionConfig);
            const result = await actionRouter.test.run({
                log,
                action,
                interactive: true,
                graph,
                silent: false,
            });
            (0, chai_1.expect)(result.outputs).to.eql({
                base: "ok",
                foo: "ok",
            });
            (0, chai_1.expect)((_a = result.detail) === null || _a === void 0 ? void 0 : _a.log).to.eql("bla bla");
            (0, chai_1.expect)(result.state).to.eql("ready");
        });
        it("should emit testStatus events", async () => {
            const action = await getResolvedAction(actionConfig);
            garden.events.eventLog = [];
            await actionRouter.test.run({
                log,
                action,
                interactive: true,
                graph,
                silent: false,
            });
            const testVersion = action.versionString();
            const event1 = garden.events.eventLog[0];
            const event2 = garden.events.eventLog[1];
            (0, chai_1.expect)(event1).to.exist;
            (0, chai_1.expect)(event1.name).to.eql("testStatus");
            (0, chai_1.expect)(event1.payload.testName).to.eql("test");
            (0, chai_1.expect)(event1.payload.actionName).to.eql("test");
            (0, chai_1.expect)(event1.payload.testVersion).to.eql(testVersion);
            (0, chai_1.expect)(event1.payload.actionUid).to.be.ok;
            (0, chai_1.expect)(event1.payload.status.state).to.eql("running");
            (0, chai_1.expect)(event2).to.exist;
            (0, chai_1.expect)(event2.name).to.eql("testStatus");
            (0, chai_1.expect)(event2.payload.testName).to.eql("test");
            (0, chai_1.expect)(event2.payload.actionName).to.eql("test");
            (0, chai_1.expect)(event2.payload.testVersion).to.eql(testVersion);
            (0, chai_1.expect)(event2.payload.actionUid).to.eql(event1.payload.actionUid);
            (0, chai_1.expect)(event2.payload.status.state).to.eql("succeeded");
        });
        it("should copy artifacts exported by the handler to the artifacts directory", async () => {
            await (0, fs_extra_1.emptyDir)(garden.artifactsPath);
            const testConfig = {
                ...actionConfig,
                spec: {
                    artifacts: [
                        {
                            source: "some-file.txt",
                        },
                        {
                            source: "some-dir/some-file.txt",
                            target: "some-dir/some-file.txt",
                        },
                    ],
                },
            };
            const action = await getResolvedAction(testConfig);
            await actionRouter.test.run({
                log,
                action,
                interactive: true,
                graph,
                silent: false,
            });
            const targetPaths = testConfig.spec.artifacts.map((spec) => (0, path_1.join)(garden.artifactsPath, spec.source)).sort();
            for (const path of targetPaths) {
                (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(path)).to.be.true;
            }
            const metadataKey = `test.test.${action.versionString()}`;
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
    describe("test.getResult", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            var _a;
            const action = await garden.resolveAction({ action: graph.getTest("module-a-unit"), log, graph });
            const result = await actionRouter.test.getResult({
                log,
                action,
                graph,
            });
            (0, chai_1.expect)(result.outputs).to.eql({
                base: "ok",
                foo: "ok",
            });
            (0, chai_1.expect)((_a = result.detail) === null || _a === void 0 ? void 0 : _a.log).to.eql("bla bla");
            (0, chai_1.expect)(result.state).to.eql("ready");
        });
    });
    it("should emit a testStatus event", async () => {
        const action = await garden.resolveAction({ action: graph.getTest("module-a-unit"), log, graph });
        garden.events.eventLog = [];
        await actionRouter.test.getResult({
            log,
            action,
            graph,
        });
        const event = garden.events.eventLog[0];
        (0, chai_1.expect)(event).to.exist;
        (0, chai_1.expect)(event.name).to.eql("testStatus");
        (0, chai_1.expect)(event.payload.testName).to.eql("module-a-unit");
        (0, chai_1.expect)(event.payload.moduleVersion).to.eql(module.version.versionString);
        (0, chai_1.expect)(event.payload.testVersion).to.eql(action.versionString());
        (0, chai_1.expect)(event.payload.actionUid).to.be.undefined;
        (0, chai_1.expect)(event.payload.status.state).to.eql("succeeded");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsdUNBQXlEO0FBQ3pELCtCQUEyQjtBQUUzQiwyREFBZ0U7QUFNaEUseUNBQThDO0FBRTlDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLElBQUksTUFBa0IsQ0FBQTtJQUN0QixJQUFJLEtBQWtCLENBQUE7SUFDdEIsSUFBSSxHQUFhLENBQUE7SUFDakIsSUFBSSxZQUEwQixDQUFBO0lBQzlCLElBQUksTUFBb0IsQ0FBQTtJQUV4QixLQUFLLFVBQVUsaUJBQWlCLENBQUMsVUFBeUM7UUFDeEUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUEsMEJBQWdCLEVBQUM7WUFDckMsTUFBTTtZQUNOLGtFQUFrRTtZQUNsRSxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3BFLE1BQU0sRUFBRSxVQUFVO1lBQ2xCLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNmLFlBQVksRUFBRSxFQUFFO1lBQ2hCLE1BQU0sRUFBRSxNQUFNLE1BQU0sQ0FBQyxlQUFlLEVBQUU7U0FDdkMsQ0FBQyxDQUFlLENBQUE7UUFDakIsT0FBTyxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQWEsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0lBQzVFLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLDRCQUFpQixHQUFFLENBQUE7UUFDdEMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDcEIsS0FBSyxHQUFHLElBQUksQ0FBQyxL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