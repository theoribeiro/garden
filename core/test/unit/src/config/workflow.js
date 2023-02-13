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
const constants_1 = require("../../../../src/constants");
const helpers_1 = require("../../../helpers");
const workflow_1 = require("../../../../src/config/workflow");
const project_1 = require("../../../../src/config/project");
describe("resolveWorkflowConfig", () => {
    let garden;
    const defaults = {
        files: [],
        resources: {
            requests: workflow_1.defaultWorkflowRequests,
            limits: workflow_1.defaultWorkflowLimits,
        },
        keepAliveHours: 48,
    };
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        garden["secrets"] = { foo: "bar", bar: "baz", baz: "banana" };
        garden["variables"] = { foo: "baz", skip: false };
    });
    it("should pass through a canonical workflow config", async () => {
        const config = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            description: "Sample workflow",
            envVars: {},
            steps: [
                { description: "Deploy the stack", command: ["deploy"], skip: false, when: "onSuccess", envVars: {} },
                { command: ["test"], skip: false, when: "onSuccess", envVars: {} },
            ],
            triggers: [
                {
                    environment: "local",
                    namespace: "default",
                    events: ["pull-request"],
                    branches: ["feature*"],
                    ignoreBranches: ["feature-ignored*"],
                },
            ],
        };
        (0, chai_1.expect)((0, workflow_1.resolveWorkflowConfig)(garden, config)).to.eql({
            ...config,
        });
    });
    it("should set workflow.resources.limits to workflow.limits if workflow.limits is specified", async () => {
        const config = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            description: "Sample workflow",
            envVars: {},
            limits: workflow_1.minimumWorkflowLimits,
            steps: [
                { description: "Deploy the stack", command: ["deploy"], skip: false, when: "onSuccess", envVars: {} },
                { command: ["test"], skip: false, when: "onSuccess", envVars: {} },
            ],
            triggers: [
                {
                    environment: "local",
                    namespace: "default",
                    events: ["pull-request"],
                    branches: ["feature*"],
                    ignoreBranches: ["feature-ignored*"],
                },
            ],
        };
        (0, chai_1.expect)((0, workflow_1.resolveWorkflowConfig)(garden, config)).to.eql({
            ...config,
            resources: {
                requests: workflow_1.defaultWorkflowRequests,
                limits: workflow_1.minimumWorkflowLimits, // <-----
            },
        });
    });
    it("should resolve template strings", async () => {
        const config = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            description: "Secret: ${secrets.foo}, var: ${variables.foo}",
            envVars: {},
            steps: [
                {
                    description: "Deploy the stack",
                    command: ["deploy"],
                    skip: "${var.skip}",
                    when: "onSuccess",
                    envVars: {},
                },
            ],
        };
        const resolved = (0, workflow_1.resolveWorkflowConfig)(garden, config);
        (0, chai_1.expect)(resolved.description).to.equal("Secret: bar, var: baz");
        (0, chai_1.expect)(resolved.steps[0].skip).to.equal(false);
    });
    it("should not resolve template strings in step commands and scripts", async () => {
        const config = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            description: "foo",
            envVars: {},
            steps: [
                {
                    description: "Deploy the stack",
                    command: ["deploy", "${var.foo}"],
                    skip: false,
                    when: "onSuccess",
                },
                { script: "echo ${var.foo}", skip: false, when: "onSuccess" },
            ],
        };
        const resolved = (0, workflow_1.resolveWorkflowConfig)(garden, config);
        (0, chai_1.expect)(resolved.steps[0].command).to.eql(config.steps[0].command);
        (0, chai_1.expect)(resolved.steps[1].script).to.eql(config.steps[1].script);
    });
    it("should not resolve template strings in trigger specs or in the workflow name", async () => {
        const configWithTemplateStringInName = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-${secrets.foo}",
            path: "/tmp/foo",
            envVars: {},
            steps: [
                { description: "Deploy the stack", command: ["deploy"], skip: false, when: "onSuccess" },
                { command: ["test"], skip: false, when: "onSuccess" },
            ],
        };
        (0, helpers_1.expectError)(() => (0, workflow_1.resolveWorkflowConfig)(garden, configWithTemplateStringInName), {
            contains: 'key .name with value "workflow-${secrets.foo}" fails to match the required pattern',
        });
        const configWithTemplateStringInTrigger = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            envVars: {},
            steps: [
                { description: "Deploy the stack", command: ["deploy"], skip: false, when: "onSuccess" },
                { command: ["test"], skip: false, when: "onSuccess" },
            ],
            triggers: [
                {
                    environment: "${secrets.bar}", // <--- should not be resolved, resulting in an error
                },
            ],
        };
        (0, helpers_1.expectError)(() => (0, workflow_1.resolveWorkflowConfig)(garden, configWithTemplateStringInTrigger), {
            contains: "Invalid environment in trigger for workflow",
        });
    });
    it("should populate default values in the schema", async () => {
        const config = {
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            description: "Description",
            envVars: {},
            resources: {},
            steps: [{ description: "Deploy the stack", command: ["deploy"] }, { command: ["test"] }],
        };
        (0, chai_1.expect)((0, workflow_1.resolveWorkflowConfig)(garden, config)).to.eql({
            ...config,
            ...defaults,
            steps: [
                { description: "Deploy the stack", command: ["deploy"], skip: false, when: "onSuccess", envVars: {} },
                { command: ["test"], skip: false, when: "onSuccess", envVars: {} },
            ],
        });
    });
    it("should throw if a trigger uses an environment that isn't defined in the project", async () => {
        const config = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            description: "Sample workflow",
            envVars: {},
            steps: [{ description: "Deploy the stack", command: ["deploy"] }, { command: ["test"] }],
            triggers: [
                {
                    environment: "banana",
                    events: ["pull-request"],
                    branches: ["feature*"],
                    ignoreBranches: ["feature-ignored*"],
                },
            ],
        };
        await (0, helpers_1.expectError)(() => (0, workflow_1.resolveWorkflowConfig)(garden, config), {
            contains: "Invalid environment in trigger for workflow workflow-a",
        });
    });
    describe("populateNamespaceForTriggers", () => {
        const trigger = {
            environment: "test",
            events: ["pull-request"],
            branches: ["feature*"],
            ignoreBranches: ["feature-ignored*"],
        };
        const config = {
            ...defaults,
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Workflow",
            name: "workflow-a",
            path: "/tmp/foo",
            description: "Sample workflow",
            envVars: {},
            steps: [{ description: "Deploy the stack", command: ["deploy"] }, { command: ["test"] }],
        };
        it("should pass through a trigger without a namespace when namespacing is optional", () => {
            const environmentConfigs = [
                {
                    name: "test",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {},
                },
            ];
            // config's only trigger has no namespace defined
            (0, workflow_1.populateNamespaceForTriggers)(config, environmentConfigs);
        });
        it("should throw if a trigger's environment requires a namespace, but none is specified", () => {
            const environmentConfigs = [
                {
                    name: "test",
                    defaultNamespace: null,
                    variables: {},
                },
            ];
            (0, helpers_1.expectError)(() => (0, workflow_1.populateNamespaceForTriggers)({ ...config, triggers: [trigger] }, environmentConfigs), {
                contains: `Invalid namespace in trigger for workflow workflow-a: Environment test has defaultNamespace set to null, and no explicit namespace was specified. Please either set a defaultNamespace or explicitly set a namespace at runtime (e.g. --env=some-namespace.test).`,
            });
        });
        it("should populate the trigger with a default namespace if one is defined", () => {
            const environmentConfigs = [
                {
                    name: "test",
                    defaultNamespace: "foo",
                    variables: {},
                },
            ];
            const configToPopulate = { ...config, triggers: [trigger] };
            (0, workflow_1.populateNamespaceForTriggers)(configToPopulate, environmentConfigs);
            (0, chai_1.expect)(configToPopulate.triggers[0].namespace).to.eql("foo");
        });
        it("should not override a trigger's specified namespace with a default namespace", () => {
            const environmentConfigs = [
                {
                    name: "test",
                    defaultNamespace: "foo",
                    variables: {},
                },
            ];
            const configToPopulate = { ...config, triggers: [{ ...trigger, namespace: "bar" }] };
            (0, workflow_1.populateNamespaceForTriggers)(configToPopulate, environmentConfigs);
            (0, chai_1.expect)(configToPopulate.triggers[0].namespace).to.eql("bar");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2Zsb3cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3b3JrZmxvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3Qix5REFBK0Q7QUFDL0QsOENBQTJFO0FBQzNFLDhEQVF3QztBQUN4Qyw0REFBb0Y7QUFFcEYsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtJQUNyQyxJQUFJLE1BQWtCLENBQUE7SUFFdEIsTUFBTSxRQUFRLEdBQUc7UUFDZixLQUFLLEVBQUUsRUFBRTtRQUNULFNBQVMsRUFBRTtZQUNULFFBQVEsRUFBRSxrQ0FBdUI7WUFDakMsTUFBTSxFQUFFLGdDQUFxQjtTQUM5QjtRQUNELGNBQWMsRUFBRSxFQUFFO0tBQ25CLENBQUE7SUFFRCxNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7UUFDaEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQTtRQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQTtJQUNuRCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMvRCxNQUFNLE1BQU0sR0FBbUI7WUFDN0IsR0FBRyxRQUFRO1lBQ1gsVUFBVSxFQUFFLCtCQUFtQjtZQUMvQixJQUFJLEVBQUUsVUFBVTtZQUNoQixJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsS0FBSyxFQUFFO2dCQUNMLEVBQUUsV0FBVyxFQUFFLGtC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