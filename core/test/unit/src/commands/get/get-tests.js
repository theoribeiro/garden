"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../../../helpers");
const get_tests_1 = require("../../../../../src/commands/get/get-tests");
const chai_1 = require("chai");
describe("GetTestsCommand", () => {
    const projectRoot = (0, helpers_1.getDataDir)("test-project-a");
    it("should return all tests in the project", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        const log = garden.log;
        const command = new get_tests_1.GetTestsCommand();
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        const graph = await garden.getConfigGraph({ log, emit: false });
        const action = graph.getTest("module-a-integration");
        (0, chai_1.expect)(res.errors).to.be.undefined;
        const result = res.result;
        (0, chai_1.expect)(Object.keys(result).length).to.equal(5);
        (0, chai_1.expect)(result["test.module-a-integration"]).to.eql(action.describe());
    });
    it("should return only the applicable tests when called with a list of test names", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        const log = garden.log;
        const command = new get_tests_1.GetTestsCommand();
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["module-a-integration"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        const graph = await garden.getConfigGraph({ log, emit: false });
        const action = graph.getTest("module-a-integration");
        const result = res.result;
        (0, chai_1.expect)(result).to.eql({
            "test.module-a-integration": action.describe(),
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0LXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsaURBQXVGO0FBQ3ZGLHlFQUEyRTtBQUMzRSwrQkFBNkI7QUFFN0IsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtJQUMvQixNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQTtJQUVoRCxFQUFFLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxDQUFDLENBQUE7UUFDaEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQTtRQUVyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDL0IsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUMxQixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLENBQUM7U0FDaEMsQ0FBQyxDQUFBO1FBRUYsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQy9ELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtRQUVwRCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7UUFFbEMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU8sQ0FBQTtRQUUxQixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDOUMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLCtFQUErRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzdGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ2hELE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFDdEIsTUFBTSxPQUFPLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUE7UUFFckMsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQy9CLE1BQU07WUFDTixHQUFHO1lBQ0gsU0FBUyxFQUFFLEdBQUc7WUFDZCxTQUFTLEVBQUUsR0FBRztZQUNkLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLHNCQUFzQixDQUFDLEVBQUU7WUFDekMsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUMsRUFBRSxDQUFDO1NBQ2hDLENBQUMsQ0FBQTtRQUVGLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUMvRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUE7UUFFcEQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU8sQ0FBQTtRQUUxQixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ3BCLDJCQUEyQixFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7U0FDL0MsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9