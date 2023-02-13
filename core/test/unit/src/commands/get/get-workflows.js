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
const chai_1 = require("chai");
const get_workflows_1 = require("../../../../../src/commands/get/get-workflows");
const constants_1 = require("../../../../../src/constants");
const workflow_1 = require("../../../../../src/config/workflow");
describe("GetWorkflowsCommand", () => {
    const projectRoot = (0, helpers_1.getDataDir)("test-project-a");
    const defaultWorkflowConf = {
        apiVersion: constants_1.DEFAULT_API_VERSION,
        kind: "Workflow",
        envVars: {},
        resources: workflow_1.defaultWorkflowResources,
        path: projectRoot,
        steps: [],
    };
    it("should return workflows, grouped alphabetically", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        garden.setWorkflowConfigs([
            { name: "c", description: "c-desc", ...defaultWorkflowConf },
            { name: "a", description: "a-desc", ...defaultWorkflowConf },
            { name: "b", description: "b-desc", ...defaultWorkflowConf },
        ]);
        const log = garden.log;
        const command = new get_workflows_1.GetWorkflowsCommand();
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { workflows: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(res.result.length).to.eq(3);
        (0, chai_1.expect)(res.result[0].name).to.eq("a");
        (0, chai_1.expect)(res.result[1].name).to.eq("b");
        (0, chai_1.expect)(res.result[2].name).to.eq("c");
        (0, chai_1.expect)(res.result[0].description).to.eq("a-desc");
        (0, chai_1.expect)(res.result[1].description).to.eq("b-desc");
        (0, chai_1.expect)(res.result[2].description).to.eq("c-desc");
    });
    it("should return only the applicable workflow when called with a name", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        garden.setWorkflowConfigs([
            { name: "c", description: "c-desc", ...defaultWorkflowConf },
            { name: "a", description: "a-desc", ...defaultWorkflowConf },
            { name: "b", description: "b-desc", ...defaultWorkflowConf },
        ]);
        const log = garden.log;
        const command = new get_workflows_1.GetWorkflowsCommand();
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { workflows: ["a"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(res.result.length).to.eq(1);
        (0, chai_1.expect)(res.result[0].name).to.eq("a");
        (0, chai_1.expect)(res.result[0].description).to.eq("a-desc");
    });
    it("should return only the applicable workflows when called with a list of names", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        garden.setWorkflowConfigs([
            { name: "c", description: "c-desc", ...defaultWorkflowConf },
            { name: "a", description: "a-desc", ...defaultWorkflowConf },
            { name: "b", description: "b-desc", ...defaultWorkflowConf },
        ]);
        const log = garden.log;
        const command = new get_workflows_1.GetWorkflowsCommand();
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { workflows: ["a", "c"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(res.result.length).to.eq(2);
        (0, chai_1.expect)(res.result[0].name).to.eq("a");
        (0, chai_1.expect)(res.result[0].description).to.eq("a-desc");
        (0, chai_1.expect)(res.result[1].name).to.eq("c");
        (0, chai_1.expect)(res.result[1].description).to.eq("c-desc");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXdvcmtmbG93cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC13b3JrZmxvd3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxpREFBdUY7QUFDdkYsK0JBQTZCO0FBQzdCLGlGQUFtRjtBQUNuRiw0REFBa0U7QUFDbEUsaUVBQTZFO0FBRTdFLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkMsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGdCQUFnQixDQUFDLENBQUE7SUFDaEQsTUFBTSxtQkFBbUIsR0FBRztRQUMxQixVQUFVLEVBQUUsK0JBQW1CO1FBQy9CLElBQUksRUFBRSxVQUF3QjtRQUM5QixPQUFPLEVBQUUsRUFBRTtRQUNYLFNBQVMsRUFBRSxtQ0FBd0I7UUFDbkMsSUFBSSxFQUFFLFdBQVc7UUFDakIsS0FBSyxFQUFFLEVBQUU7S0FDVixDQUFBO0lBRUQsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQy9ELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ2hELE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztZQUN4QixFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxHQUFHLG1CQUFtQixFQUFFO1lBQzVELEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEdBQUcsbUJBQW1CLEVBQUU7WUFDNUQsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsR0FBRyxtQkFBbUIsRUFBRTtTQUM3RCxDQUFDLENBQUE7UUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ3RCLE1BQU0sT0FBTyxHQUFHLElBQUksbUNBQW1CLEVBQUUsQ0FBQTtRQUV6QyxNQUFNLEdBQUcsR0FBRyxNQUFN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