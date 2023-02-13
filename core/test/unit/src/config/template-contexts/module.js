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
const path_1 = require("path");
const lodash_1 = require("lodash");
const helpers_1 = require("../../../../helpers");
const template_string_1 = require("../../../../../src/template-string/template-string");
const module_1 = require("../../../../../src/config/template-contexts/module");
const workflow_1 = require("../../../../../src/config/template-contexts/workflow");
describe("ModuleConfigContext", () => {
    let garden;
    let graph;
    let c;
    let module;
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        garden["secrets"] = { someSecret: "someSecretValue" };
        graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const modules = graph.getModules();
        module = graph.getModule("module-b");
        c = new module_1.ModuleConfigContext({
            garden,
            resolvedProviders: (0, lodash_1.keyBy)(await garden.resolveProviders(garden.log), "name"),
            variables: garden.variables,
            modules,
            buildPath: module.buildPath,
            partialRuntimeResolution: false,
            name: module.name,
            path: module.path,
            parentName: module.parentName,
            inputs: module.inputs,
            templateName: module.templateName,
        });
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
    it("should resolve the current git branch", () => {
        (0, chai_1.expect)(c.resolve({ key: ["git", "branch"], nodePath: [], opts: {} })).to.eql({
            resolved: garden.vcsInfo.branch,
        });
    });
    it("should resolve the path of a module", async () => {
        const path = (0, path_1.join)(garden.projectRoot, "module-a");
        (0, chai_1.expect)(c.resolve({ key: ["modules", "module-a", "path"], nodePath: [], opts: {} })).to.eql({ resolved: path });
    });
    it("should should resolve the version of a module", async () => {
        const { versionString } = graph.getModule("module-a").version;
        (0, chai_1.expect)(c.resolve({ key: ["modules", "module-a", "version"], nodePath: [], opts: {} })).to.eql({
            resolved: versionString,
        });
    });
    it("should resolve the outputs of a module", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["modules", "module-a", "outputs", "foo"], nodePath: [], opts: {} })).to.eql({
            resolved: "bar",
        });
    });
    it("should resolve this.buildPath", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["this", "buildPath"], nodePath: [], opts: {} })).to.eql({
            resolved: module.buildPath,
        });
    });
    it("should resolve this.path", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["this", "path"], nodePath: [], opts: {} })).to.eql({
            resolved: module.path,
        });
    });
    it("should resolve this.name", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["this", "name"], nodePath: [], opts: {} })).to.eql({
            resolved: module.name,
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
    context("graphResults is set", () => {
        let withRuntime;
        let deployA;
        before(async () => {
            const modules = graph.getModules();
            deployA = graph.getDeploy("service-a");
            // eslint-disable-next-line no-unused
            const deployB = graph.getDeploy("service-b");
            // const testB = graph.getTest("test-b")
            module = graph.getModule("module-b");
            withRuntime = new module_1.ModuleConfigContext({
                garden,
                resolvedProviders: (0, lodash_1.keyBy)(await garden.resolveProviders(garden.log), "name"),
                variables: garden.variables,
                modules,
                buildPath: deployA.getBuildPath(),
                partialRuntimeResolution: false,
                name: module.name,
                inputs: module.inputs,
                parentName: module.parentName,
                path: module.path,
                templateName: module.templateName,
            });
        });
        it("should resolve service outputs", async () => {
            const result = withRuntime.resolve({
                key: ["runtime", "services", "service-b", "outputs", "foo"],
                nodePath: [],
                opts: {},
            });
            (0, chai_1.expect)(result).to.eql({ resolved: "bar" });
        });
        it("should resolve task outputs", async () => {
            const result = withRuntime.resolve({
                key: ["runtime", "tasks", "task-b", "outputs", "moo"],
                nodePath: [],
                opts: {},
            });
            (0, chai_1.expect)(result).to.eql({ resolved: "boo" });
        });
        it("should allow using a runtime key as a test in a ternary (positive)", async () => {
            const result = (0, template_string_1.resolveTemplateString)("${runtime.tasks.task-b ? runtime.tasks.task-b.outputs.moo : 'default'}", withRuntime);
            (0, chai_1.expect)(result).to.equal("boo");
        });
    });
});
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
    it("should resolve the local platform", async () => {
        (0, chai_1.expect)(c.resolve({ key: ["local", "platform"], nodePath: [], opts: {} })).to.eql({
            resolved: process.platform,
        });
    });
    it("should resolve the current git branch", () => {
        (0, chai_1.expect)(c.resolve({ key: ["git", "branch"], nodePath: [], opts: {} })).to.eql({
            resolved: garden.vcsInfo.branch,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLCtCQUEyQjtBQUMzQixtQ0FBOEI7QUFFOUIsaURBQThFO0FBQzlFLHdGQUEwRjtBQUMxRiwrRUFBd0Y7QUFDeEYsbUZBQXVIO0FBWXZILFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkMsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksS0FBa0IsQ0FBQTtJQUN0QixJQUFJLENBQXNCLENBQUE7SUFDMUIsSUFBSSxNQUFvQixDQUFBO0lBRXhCLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQixNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUNoQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQTtRQUNyRCxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFDckUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ2xDLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRXBDLENBQUMsR0FBRyxJQUFJLDRCQUFtQixDQUFDO1lBQzFCLE1BQU07WUFDTixpQkFBaUIsRUFBRSxJQUFBLGNBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDO1lBQzNFLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztZQUMzQixPQUFPO1lBQ1AsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO1lBQzNCLHdCQUF3QixFQUFFLEtBQUs7WUFDL0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO1lBQ2pCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtZQUNqQixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7WUFDN0IsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTtTQUNsQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUE7UUFDakMsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDM0YsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQTtJQUNsQyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3QyxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzNFLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSTtTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNqRCxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQy9FLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtTQUMzQixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyRCxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ2pGLFFBQVEsRUFBRSxNQUFNLENBQUMsZUFBZTtTQUNqQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUMzRSxRQUFRLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1NBQ2hDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ25ELE1BQU0sSUFBSSxHQUFHLElBQUEsV0FBSSxFQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDakQsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNoSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3RCxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUE7UUFDN0QsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDNUYsUUFBUSxFQUFFLGFBQWE7U0FDeEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEQsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ25HLFFBQVEsRUFBRSxLQUFLO1NBQ2hCLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLCtCQUErQixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzdDLElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDL0UsUUFBUSxFQUFFLE1BQU0sQ0FBQyxTQUFTO1NBQzNCLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDBCQUEwQixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hDLElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDMUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJO1NBQ3RCLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDBCQUEwQixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hDLElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDMUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJO1NBQ3RCLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLG1DQUFtQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2pELElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FB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