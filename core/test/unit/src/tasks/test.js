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
const test_1 = require("../../../../src/tasks/test");
const helpers_1 = require("../../../helpers");
describe("TestTask", () => {
    let garden;
    let graph;
    let log;
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-test-deps"));
        graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        log = garden.log;
    });
    describe("getStatus", () => {
        it("TODO", async () => {
            throw "TODO";
        });
    });
    describe("process", () => {
        it("should correctly resolve runtime outputs from tasks", async () => {
            var _a, _b;
            const action = graph.getTest("module-a-integ");
            const testTask = new test_1.TestTask({
                garden,
                log,
                graph,
                action,
                force: true,
                forceBuild: false,
                devModeDeployNames: [],
                localModeDeployNames: [],
            });
            const res = await garden.processTasks({ tasks: [testTask], throwOnError: true });
            const result = res.results.getResult(testTask);
            (0, chai_1.expect)((_b = (_a = result.result) === null || _a === void 0 ? void 0 : _a.detail) === null || _b === void 0 ? void 0 : _b.log).to.eql("echo task-a-ok");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IscURBQXFEO0FBQ3JELDhDQUF5RTtBQUl6RSxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxLQUFrQixDQUFBO0lBQ3RCLElBQUksR0FBYSxDQUFBO0lBRWpCLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsSUFBQSxvQkFBVSxFQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQTtRQUNuRSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFDckUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7SUFDbEIsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUN6QixFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BCLE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ3ZCLEVBQUUsQ0FBQyxxREFBcUQsRUFBRSxLQUFLLElBQUksRUFBRTs7WUFDbkUsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1lBRTlDLE1BQU0sUUFBUSxHQUFHLElBQUksZUFBUSxDQUFDO2dCQUM1QixNQUFNO2dCQUNOLEdBQUc7Z0JBQ0gsS0FBSztnQkFDTCxNQUFNO2dCQUNOLEtBQUssRUFBRSxJQUFJO2dCQUNYLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixrQkFBa0IsRUFBRSxFQUFFO2dCQUN0QixvQkFBb0IsRUFBRSxFQUFFO2FBQ3pCLENBQUMsQ0FBQTtZQUVGLE1BQU0sR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1lBQ2hGLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBRSxDQUFBO1lBRS9DLElBQUEsYUFBTSxFQUFDLE1BQUEsTUFBQSxNQUFNLENBQUMsTUFBTSwwQ0FBRSxNQUFNLDBDQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtRQUM3RCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==