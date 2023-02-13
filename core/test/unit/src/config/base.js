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
const base_1 = require("../../../../src/config/base");
const path_1 = require("path");
const helpers_1 = require("../../../helpers");
const constants_1 = require("../../../../src/constants");
const fs_1 = require("../../../../src/util/fs");
const util_1 = require("../../../../src/util/util");
const projectPathA = (0, helpers_1.getDataDir)("test-project-a");
const modulePathA = (0, path_1.resolve)(projectPathA, "module-a");
const projectPathMultipleModules = (0, helpers_1.getDataDir)("test-projects", "multiple-module-config");
const modulePathAMultiple = (0, path_1.resolve)(projectPathMultipleModules, "module-a");
const projectPathDuplicateProjects = (0, helpers_1.getDataDir)("test-project-duplicate-project-config");
// TODO: remove this describe block in 0.14
describe("prepareProjectResource", () => {
    const projectResourceTemplate = {
        apiVersion: constants_1.DEFAULT_API_VERSION,
        kind: "Project",
        name: "test",
        path: "/tmp/",
        defaultEnvironment: "default",
        environments: [{ name: "default", defaultNamespace: null, variables: {} }],
        providers: [{ name: "foo" }],
        variables: {},
    };
    it("no changes if new `dotIgnoreFile` field is provided explicitly", () => {
        const projectResource = {
            ...projectResourceTemplate,
            dotIgnoreFile: ".somedotignore",
        };
        const migratedProjectResource = (0, base_1.prepareProjectResource)(projectResource);
        (0, chai_1.expect)(migratedProjectResource).to.eql(projectResource);
    });
    it("no changes if neither new `dotIgnoreFile` nor `dotIgnoreFiles` fields are defined in the project config", () => {
        const projectResource = {
            ...projectResourceTemplate,
        };
        const migratedProjectResource = (0, base_1.prepareProjectResource)(projectResource);
        (0, chai_1.expect)(migratedProjectResource).to.eql(projectResource);
    });
    it("empty `dotIgnoreFiles` array is automatically remapped to the default `dotIgnoreFile`", () => {
        const projectResource = {
            ...projectResourceTemplate,
            dotIgnoreFiles: [],
        };
        const migratedProjectResource = (0, base_1.prepareProjectResource)(projectResource);
        const expectedProjectResource = {
            ...projectResource,
            dotIgnoreFile: fs_1.defaultDotIgnoreFile,
        };
        (0, chai_1.expect)(migratedProjectResource).to.eql(expectedProjectResource);
    });
    it("singe-valued `dotIgnoreFiles` array is automatically remapped to scalar `dotIgnoreFile`", () => {
        const projectResource = {
            ...projectResourceTemplate,
            dotIgnoreFiles: [".somedotignore"],
        };
        const migratedProjectResource = (0, base_1.prepareProjectResource)(projectResource);
        const expectedProjectResource = {
            ...projectResource,
            dotIgnoreFile: ".somedotignore",
        };
        (0, chai_1.expect)(migratedProjectResource).to.eql(expectedProjectResource);
    });
    it("throw an error is multi-valued `dotIgnoreFiles` array is defined in the project config", () => {
        const projectResource = {
            ...projectResourceTemplate,
            dotIgnoreFiles: [".somedotignore", ".gitignore"],
        };
        const processConfigAction = () => (0, base_1.prepareProjectResource)(projectResource);
        (0, chai_1.expect)(processConfigAction).to.throw("Cannot auto-convert array-field `dotIgnoreFiles` to scalar `dotIgnoreFile`: multiple values found in the array [.somedotignore, .gitignore]");
    });
});
describe("loadConfigResources", () => {
    it("should throw a config error if the file couldn't be parsed", async () => {
        const projectPath = (0, helpers_1.getDataDir)("test-project-invalid-config");
        await (0, helpers_1.expectError)(async () => await (0, base_1.loadConfigResources)(projectPath, (0, path_1.resolve)(projectPath, "invalid-syntax-module", "garden.yml")), { contains: ["Could not parse", "duplicated mapping key"] });
    });
    it("should throw if a config doesn't specify a kind", async () => {
        const projectPath = (0, helpers_1.getDataDir)("test-project-invalid-config");
        await (0, helpers_1.expectError)(async () => await (0, base_1.loadConfigResources)(projectPath, (0, path_1.resolve)(projectPath, "missing-kind", "garden.yml")), { contains: "Missing `kind` field in config at missing-kind/garden.yml" });
    });
    it("should throw if a config specifies an invalid kind", async () => {
        const projectPath = (0, helpers_1.getDataDir)("test-project-invalid-config");
        await (0, helpers_1.expectError)(async () => await (0, base_1.loadConfigResources)(projectPath, (0, path_1.resolve)(projectPath, "invalid-config-kind", "garden.yml")), { contains: "Unknown config kind banana in invalid-config-kind/garden.yml" });
    });
    it("should throw if a module config doesn't specify a type", async () => {
        const projectPath = (0, helpers_1.getDataDir)("test-project-invalid-config");
        await (0, helpers_1.expectError)(async () => await (0, base_1.loadConfigResources)(projectPath, (0, path_1.resolve)(projectPath, "missing-type", "garden.yml")), {
            contains: "Error validating module (missing-type/garden.yml): key .type is required",
        });
    });
    it("should throw if a module config doesn't specify a name", async () => {
        const projectPath = (0, helpers_1.getDataDir)("test-project-invalid-config");
        await (0, helpers_1.expectError)(async () => await (0, base_1.loadConfigResources)(projectPath, (0, path_1.resolve)(projectPath, "missing-name", "garden.yml")), {
            contains: "Error validating module (missing-name/garden.yml): key .name is required",
        });
    });
    it("throws if basic fields contain template strings", async () => {
        for (const field of base_1.noTemplateFields) {
            const basicProjectConfig = (0, helpers_1.getDefaultProjectConfig)();
            basicProjectConfig[field] = '${camelCase("No templating should be allowed here")}';
            const configRaw = (0, util_1.safeDumpYaml)(basicProjectConfig);
            await (0, helpers_1.expectError)(async () => (0, base_1.validateRawConfig)({ rawConfig: configRaw, configPath: "fake/path", projectRoot: "fake/projec/root" }), { contains: "does not allow templating" });
        }
    });
    // TODO: test more cases
    it("should load and parse a project config", async () => {
        const configPath = (0, path_1.resolve)(projectPathA, "garden.yml");
        const parsed = await (0, base_1.loadConfigResources)(projectPathA, configPath);
        (0, chai_1.expect)(parsed).to.eql([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Project",
                path: projectPathA,
                configPath,
                name: "test-project-a",
                environments: [
                    {
                        name: "local",
                    },
                    {
                        name: "other",
                    },
                ],
                providers: [{ name: "test-plugin" }, { name: "test-plugin-b", environments: ["local"] }],
                outputs: [
                    {
                        name: "taskName",
                        value: "task-a",
                    },
                ],
                variables: { some: "variable" },
            },
        ]);
    });
    it("should load and parse a module config", async () => {
        const configPath = (0, path_1.resolve)(modulePathA, "garden.yml");
        const parsed = await (0, base_1.loadConfigResources)(projectPathA, configPath);
        (0, chai_1.expect)(parsed).to.eql([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Module",
                name: "module-a",
                type: "test",
                configPath,
                description: undefined,
                disabled: undefined,
                generateFiles: undefined,
                include: undefined,
                exclude: undefined,
                repositoryUrl: undefined,
                allowPublish: undefined,
                build: { dependencies: [] },
                path: modulePathA,
                variables: { msg: "OK" },
                varfile: undefined,
                spec: {
                    build: {
                        command: ["echo", "A"],
                        dependencies: [],
                    },
                    services: [{ name: "service-a" }],
                    tasks: [
                        {
                            name: "task-a",
                            command: ["echo", "${var.msg}"],
                        },
                        {
                            name: "task-a2",
                            command: ["echo", "${environment.name}-${var.msg}"],
                        },
                    ],
                    tests: [
                        {
                            name: "unit",
                            command: ["echo", "${var.msg}"],
                        },
                        {
                            name: "integration",
                            command: ["echo", "${var.msg}"],
                            dependencies: ["service-a"],
                        },
                    ],
                },
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            },
        ]);
    });
    it("should load and parse a module template", async () => {
        const projectPath = (0, helpers_1.getDataDir)("test-projects", "module-templates");
        const configPath = (0, path_1.resolve)(projectPath, "templates.garden.yml");
        const parsed = await (0, base_1.loadConfigResources)(projectPath, configPath);
        (0, chai_1.expect)(parsed).to.eql([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                configPath,
                path: projectPath,
                kind: "ModuleTemplate",
                name: "combo",
                inputsSchemaPath: "module-templates.json",
                modules: [
                    {
                        type: "test",
                        name: "${parent.name}-${inputs.name}-a",
                        include: [],
                        build: {
                            command: ["${inputs.value}"],
                        },
                        generateFiles: [
                            {
                                targetPath: "module-a.log",
                                value: "hellow",
                            },
                        ],
                    },
                    {
                        type: "test",
                        name: "${parent.name}-${inputs.name}-b",
                        include: [],
                        build: {
                            dependencies: ["${parent.name}-${inputs.name}-a"],
                        },
                        generateFiles: [
                            {
                                targetPath: "module-b.log",
                                sourcePath: "source.txt",
                            },
                        ],
                    },
                    {
                        type: "test",
                        name: "${parent.name}-${inputs.name}-c",
                        include: [],
                        build: {
                            dependencies: ["${parent.name}-${inputs.name}-a"],
                        },
                        generateFiles: [
                            {
                                targetPath: ".garden/subdir/module-c.log",
                                value: 'Hello I am string!\ninput: ${inputs.value}\nmodule reference: ${modules["${parent.name}-${inputs.name}-a"].path}\n',
                            },
                        ],
                    },
                ],
            },
        ]);
    });
    it("should load and parse a config file defining a project and a module", async () => {
        const configPath = (0, path_1.resolve)(projectPathMultipleModules, "garden.yml");
        const parsed = await (0, base_1.loadConfigResources)(projectPathMultipleModules, configPath);
        (0, chai_1.expect)(parsed).to.eql([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Project",
                configPath,
                path: projectPathMultipleModules,
                environments: [
                    {
                        name: "local",
                    },
                    {
                        name: "other",
                    },
                ],
                providers: [
                    { name: "test-plugin", environments: ["local"] },
                    { name: "test-plugin-b", environments: ["local"] },
                ],
                name: "test-project-multiple-modules",
                variables: { some: "variable" },
            },
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Module",
                name: "module-from-project-config",
                type: "test",
                configPath,
                description: undefined,
                disabled: undefined,
                generateFiles: undefined,
                include: ["*"],
                exclude: undefined,
                repositoryUrl: undefined,
                allowPublish: undefined,
                build: { dependencies: [] },
                path: projectPathMultipleModules,
                serviceConfigs: [],
                spec: {
                    build: {
                        command: ["echo", "project"],
                        dependencies: [],
                    },
                },
                testConfigs: [],
                taskConfigs: [],
                variables: undefined,
                varfile: undefined,
            },
        ]);
    });
    it("should load and parse a config file defining multiple modules", async () => {
        const configPath = (0, path_1.resolve)(modulePathAMultiple, "garden.yml");
        const parsed = await (0, base_1.loadConfigResources)(projectPathMultipleModules, configPath);
        (0, chai_1.expect)(parsed).to.eql([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Module",
                name: "module-a1",
                type: "test",
                configPath,
                allowPublish: undefined,
                description: undefined,
                disabled: undefined,
                generateFiles: undefined,
                include: ["*"],
                exclude: undefined,
                repositoryUrl: undefined,
                build: {
                    dependencies: [{ name: "module-from-project-config", copy: [] }],
                },
                path: modulePathAMultiple,
                serviceConfigs: [],
                spec: {
                    build: {
                        command: ["echo", "A1"],
                        dependencies: [{ name: "module-from-project-config", copy: [] }],
                    },
                    services: [{ name: "service-a1" }],
                    tests: [{ name: "unit", command: ["echo", "OK"] }],
                    tasks: [{ name: "task-a1", command: ["echo", "OK"] }],
                },
                testConfigs: [],
                taskConfigs: [],
                variables: undefined,
                varfile: undefined,
            },
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Module",
                name: "module-a2",
                type: "test",
                configPath,
                allowPublish: undefined,
                description: undefined,
                disabled: undefined,
                generateFiles: undefined,
                include: ["*"],
                exclude: undefined,
                repositoryUrl: undefined,
                build: { dependencies: [] },
                path: modulePathAMultiple,
                serviceConfigs: [],
                spec: {
                    build: {
                        command: ["echo", "A2"],
                        dependencies: [],
                    },
                    services: [{ name: "service-a2" }],
                    tests: [{ name: "unit", command: ["echo", "OK"] }],
                    tasks: [{ name: "task-a2", command: ["echo", "OK"] }],
                },
                testConfigs: [],
                taskConfigs: [],
                variables: undefined,
                varfile: undefined,
            },
        ]);
    });
    it("should load a project config with a top-level provider field", async () => {
        const projectPath = (0, helpers_1.getDataDir)("test-projects", "new-provider-spec");
        const configPath = (0, path_1.resolve)(projectPath, "garden.yml");
        const parsed = await (0, base_1.loadConfigResources)(projectPath, configPath);
        (0, chai_1.expect)(parsed).to.eql([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Project",
                path: projectPath,
                configPath,
                name: "test-project-a",
                environments: [{ name: "local" }, { name: "other" }],
                providers: [{ name: "test-plugin", environments: ["local"] }, { name: "test-plugin-b" }],
            },
        ]);
    });
    it("should throw if config file is not found", async () => {
        await (0, helpers_1.expectError)(async () => await (0, base_1.loadConfigResources)("/thisdoesnotexist", "/thisdoesnotexist"), {
            contains: "Could not find configuration file at /thisdoesnotexist",
        });
    });
    it("should ignore empty documents in multi-doc YAML", async () => {
        const path = (0, helpers_1.getDataDir)("test-projects", "empty-doc");
        const configPath = (0, path_1.resolve)(path, "garden.yml");
        const parsed = await (0, base_1.loadConfigResources)(path, configPath);
        (0, chai_1.expect)(parsed).to.eql([
            {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Project",
                name: "foo",
                environments: [{ name: "local" }],
                path,
                configPath,
            },
        ]);
    });
});
describe("prepareModuleResource", () => {
    it("should normalize build dependencies", async () => {
        const moduleConfigPath = (0, path_1.resolve)(modulePathA, "garden.yml");
        const parsed = (await (0, base_1.loadConfigResources)(projectPathA, moduleConfigPath))[0];
        parsed.build.dependencies = [{ name: "apple" }, "banana", null];
        const prepared = (0, base_1.prepareModuleResource)(parsed, moduleConfigPath, projectPathA);
        (0, chai_1.expect)(prepared.build.dependencies).to.eql([
            { name: "apple", copy: [] },
            { name: "banana", copy: [] },
        ]);
    });
});
describe("findProjectConfig", async () => {
    const customConfigPath = (0, helpers_1.getDataDir)("test-projects", "custom-config-names");
    it("should find the project config when path is projectRoot", async () => {
        const project = await (0, base_1.findProjectConfig)(projectPathA);
        (0, chai_1.expect)(project && project.path).to.eq(projectPathA);
    });
    it("should find the project config when path is a subdir of projectRoot", async () => {
        // modulePathA is a subdir of projectPathA
        const project = await (0, base_1.findProjectConfig)(modulePathA);
        (0, chai_1.expect)(project && project.path).to.eq(projectPathA);
    });
    it("should find the project config when path is projectRoot and config is in a custom-named file", async () => {
        const project = await (0, base_1.findProjectConfig)(customConfigPath);
        (0, chai_1.expect)(project && project.path).to.eq(customConfigPath);
    });
    it("should find the project root from a subdir of projectRoot and config is in a custom-named file", async () => {
        const modulePath = (0, path_1.join)(customConfigPath, "module-a");
        const project = await (0, base_1.findProjectConfig)(modulePath);
        (0, chai_1.expect)(project && project.path).to.eq(customConfigPath);
    });
    it("should throw an error if multiple projects are found", async () => {
        await (0, helpers_1.expectError)(async () => await (0, base_1.findProjectConfig)(projectPathDuplicateProjects), {
            contains: "Multiple project declarations found",
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0Isc0RBT29DO0FBQ3BDLCtCQUFvQztBQUNwQyw4Q0FBbUY7QUFDbkYseURBQStEO0FBQy9ELGdEQUE4RDtBQUM5RCxvREFBd0Q7QUFFeEQsTUFBTSxZQUFZLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDakQsTUFBTSxXQUFXLEdBQUcsSUFBQSxjQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBRXJELE1BQU0sMEJBQTBCLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGVBQWUsRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO0FBQ3hGLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSxjQUFPLEVBQUMsMEJBQTBCLEVBQUUsVUFBVSxDQUFDLENBQUE7QUFFM0UsTUFBTSw0QkFBNEIsR0FBRyxJQUFBLG9CQUFVLEVBQUMsdUNBQXVDLENBQUMsQ0FBQTtBQUV4RiwyQ0FBMkM7QUFDM0MsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtJQUN0QyxNQUFNLHVCQUF1QixHQUFHO1FBQzlCLFVBQVUsRUFBRSwrQkFBbUI7UUFDL0IsSUFBSSxFQUFFLFNBQVM7UUFDZixJQUFJLEVBQUUsTUFBTTtRQUNaLElBQUksRUFBRSxPQUFPO1FBQ2Isa0JBQWtCLEVBQUUsU0FBUztRQUM3QixZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUMxRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUM1QixTQUFTLEVBQUUsRUFBRTtLQUNkLENBQUE7SUFFRCxFQUFFLENBQUMsZ0VBQWdFLEVBQUUsR0FBRyxFQUFFO1FBQ3hFLE1B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