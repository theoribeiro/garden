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
const helpers_1 = require("../../../../helpers");
const workflow_1 = require("../../../../../src/config/template-contexts/workflow");
describe("WorkflowConfigContext", () => {
    let garden;
    let c;
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        garden["secrets"] = { someSecret: "someSecretValue" };
        c = new workflow_1.WorkflowConfigContext(garden, garden.variables);
    });
    it("should resolve local env variables", async () => {
        process.env.TEST_VARIABLE = "foo";
        (0, chai_1.expect)(c.resolve({ key: ["local", "env", "TEST_VARIABLE"], nodePath: [], opts: {} })).to.eql({
            resolved: "foo",
        });
        delete process.env.TEST_VARIABLE;
    });
    it("should resolve the local arch", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["local", "arch"], nodePath: [], opts: {} })).to.eql({
            resolved: process.arch,
        });
    });
    it("should resolve the local platform", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["local", "platform"], nodePath: [], opts: {} })).to.eql({
            resolved: process.platform,
        });
    });
    it("should resolve the environment config", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["environment", "name"], nodePath: [], opts: {} })).to.eql({
            resolved: garden.environmentName,
        });
    });
    it("should resolve a project variable", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["variables", "some"], nodePath: [], opts: {} })).to.eql({ resolved: "variable" });
    });
    it("should resolve a project variable under the var alias", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["var", "some"], nodePath: [], opts: {} })).to.eql({ resolved: "variable" });
    });
    context("secrets", () => {
        it("should resolve a secret", async () => {
            (0, chai_1.expect)(c.resolve({ key: ["secrets", "someSecret"], nodePath: [], opts: {} })).to.eql({
                resolved: "someSecretValue",
            });
        });
    });
});
describe("WorkflowStepConfigContext", () => {
    let garden;
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
    });
    it("should successfully resolve an output from a prior resolved step", () => {
        const c = new workflow_1.WorkflowStepConfigContext({
            garden,
            allStepNames: ["step-1", "step-2"],
            resolvedSteps: {
                "step-1": {
                    log: "bla",
                    number: 1,
                    outputs: { some: "value" },
                },
            },
            stepName: "step-2",
        });
        (0, chai_1.expect)(c.resolve({ key: ["steps", "step-1", "outputs", "some"], nodePath: [], opts: {} }).resolved).to.equal("value");
    });
    it("should successfully resolve the log from a prior resolved step", () => {
        const c = new workflow_1.WorkflowStepConfigContext({
            garden,
            allStepNames: ["step-1", "step-2"],
            resolvedSteps: {
                "step-1": {
                    log: "bla",
                    number: 1,
                    outputs: {},
                },
            },
            stepName: "step-2",
        });
        (0, chai_1.expect)(c.resolve({ key: ["steps", "step-1", "log"], nodePath: [], opts: {} }).resolved).to.equal("bla");
    });
    it("should throw error when attempting to reference a following step", () => {
        const c = new workflow_1.WorkflowStepConfigContext({
            garden,
            allStepNames: ["step-1", "step-2"],
            resolvedSteps: {},
            stepName: "step-1",
        });
        (0, helpers_1.expectError)(() => c.resolve({ key: ["steps", "step-2", "log"], nodePath: [], opts: {} }), {
            contains: "Step step-2 is referenced in a template for step step-1, but step step-2 is later in the execution order. Only previous steps in the workflow can be referenced.",
        });
    });
    it("should throw error when attempting to reference current step", () => {
        const c = new workflow_1.WorkflowStepConfigContext({
            garden,
            allStepNames: ["step-1", "step-2"],
            resolvedSteps: {},
            stepName: "step-1",
        });
        (0, helpers_1.expectError)(() => c.resolve({ key: ["steps", "step-1", "log"], nodePath: [], opts: {} }), {
            contains: "Step step-1 references itself in a template. Only previous steps in the workflow can be referenced.",
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2Zsb3cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3b3JrZmxvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUU3QixpREFBOEU7QUFDOUUsbUZBQXVIO0FBU3ZILFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksQ0FBd0IsQ0FBQTtJQUU1QixNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7UUFDaEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLENBQUE7UUFDckQsQ0FBQyxHQUFHLElBQUksZ0NBQXFCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUN6RCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUE7UUFDakMsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDM0YsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQTtJQUNsQyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3QyxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzNFLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSTtTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNqRCxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQy9FLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtTQUMzQixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyRCxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ2pGLFFBQVEsRUFBRSxNQUFNLENBQUMsZUFBZTtTQUNqQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNqRCxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFD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