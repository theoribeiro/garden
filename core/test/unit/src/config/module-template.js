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
const module_template_1 = require("../../../../src/config/module-template");
const path_1 = require("path");
const common_1 = require("../../../../src/config/common");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
describe("module templates", () => {
    let garden;
    before(async () => {
        garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "module-templates"));
    });
    describe("resolveModuleTemplate", () => {
        let defaults;
        before(() => {
            defaults = {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "ModuleTemplate",
                name: "test",
                path: garden.projectRoot,
                configPath: (0, path_1.resolve)(garden.projectRoot, "templates.garden.yml"),
            };
        });
        it("resolves template strings for fields other than modules and files", async () => {
            const config = {
                ...defaults,
                inputsSchemaPath: "${project.name}.json",
            };
            const resolved = await (0, module_template_1.resolveModuleTemplate)(garden, config);
            (0, chai_1.expect)(resolved.inputsSchemaPath).to.eql("module-templates.json");
        });
        it("ignores template strings in modules", async () => {
            const config = {
                ...defaults,
                modules: [
                    {
                        type: "test",
                        name: "${inputs.foo}",
                    },
                ],
            };
            const resolved = await (0, module_template_1.resolveModuleTemplate)(garden, config);
            (0, chai_1.expect)(resolved.modules).to.eql(config.modules);
        });
        it("throws on an invalid schema", async () => {
            const config = {
                ...defaults,
                foo: "bar",
            };
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveModuleTemplate)(garden, config), {
                contains: 'Error validating ModuleTemplate (templates.garden.yml): key "foo" is not allowed at path [foo]',
            });
        });
        it("defaults to an empty object schema for inputs", async () => {
            const config = {
                ...defaults,
            };
            const resolved = await (0, module_template_1.resolveModuleTemplate)(garden, config);
            (0, chai_1.expect)(resolved.inputsSchema._rules[0].args.jsonSchema.schema).to.eql({
                type: "object",
                additionalProperties: false,
            });
        });
        it("parses a valid JSON inputs schema", async () => {
            const config = {
                ...defaults,
                inputsSchemaPath: "module-templates.json",
            };
            const resolved = await (0, module_template_1.resolveModuleTemplate)(garden, config);
            (0, chai_1.expect)(resolved.inputsSchema).to.exist;
        });
        it("throws if inputs schema cannot be found", async () => {
            const config = {
                ...defaults,
                inputsSchemaPath: "foo.json",
            };
            const path = (0, path_1.resolve)(config.path, config.inputsSchemaPath);
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveModuleTemplate)(garden, config), {
                contains: `Unable to read inputs schema for ModuleTemplate test: Error: ENOENT: no such file or directory, open '${path}'`,
            });
        });
        it("throws if an invalid JSON schema is provided", async () => {
            const config = {
                ...defaults,
                inputsSchemaPath: "invalid.json",
            };
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveModuleTemplate)(garden, config), {
                contains: `Inputs schema for ModuleTemplate test has type string, but should be "object".`,
            });
        });
    });
    describe("resolveTemplatedModule", () => {
        let template;
        let defaults;
        const templates = {};
        before(() => {
            template = {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "ModuleTemplate",
                name: "test",
                path: garden.projectRoot,
                configPath: (0, path_1.resolve)(garden.projectRoot, "modules.garden.yml"),
                inputsSchema: common_1.joi.object().keys({
                    foo: common_1.joi.string(),
                }),
                modules: [],
            };
            templates.test = template;
            defaults = {
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Module",
                name: "test",
                type: "templated",
                path: garden.projectRoot,
                configPath: (0, path_1.resolve)(garden.projectRoot, "modules.garden.yml"),
                spec: {
                    template: "test",
                },
                allowPublish: false,
                build: { dependencies: [] },
                disabled: false,
                modules: [],
                serviceConfigs: [],
                taskConfigs: [],
                testConfigs: [],
            };
        });
        it("resolves template strings on the templated module config", async () => {
            var _a;
            const config = {
                ...defaults,
                spec: {
                    ...defaults.spec,
                    inputs: {
                        foo: "${project.name}",
                    },
                },
            };
            const { resolvedSpec } = await (0, module_template_1.resolveTemplatedModule)(garden, config, templates);
            (0, chai_1.expect)((_a = resolvedSpec.inputs) === null || _a === void 0 ? void 0 : _a.foo).to.equal("module-templates");
        });
        it("resolves all parent, template and input template strings, ignoring others", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "${parent.name}-${template.name}-${inputs.foo}",
                            build: {
                                dependencies: [{ name: "${parent.name}-${template.name}-foo", copy: [] }],
                            },
                            image: "${modules.foo.outputs.bar || inputs.foo}",
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
                spec: {
                    ...defaults.spec,
                    inputs: {
                        foo: "bar",
                    },
                },
            };
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            const module = resolved.modules[0];
            (0, chai_1.expect)(module.name).to.equal("test-test-bar");
            (0, chai_1.expect)(module.build.dependencies).to.eql([{ name: "test-test-foo", copy: [] }]);
            (0, chai_1.expect)(module.spec.image).to.equal("${modules.foo.outputs.bar || inputs.foo}");
        });
        it("throws if module is invalid", async () => {
            const config = {
                ...defaults,
                spec: {
                    ...defaults.spec,
                    foo: "bar",
                },
            };
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveTemplatedModule)(garden, config, templates), {
                contains: 'Error validating templated module test (modules.garden.yml): key "foo" is not allowed at path [foo]',
            });
        });
        it("throws if template cannot be found", async () => {
            const config = {
                ...defaults,
                spec: { ...defaults.spec, template: "foo" },
            };
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveTemplatedModule)(garden, config, templates), {
                contains: "Templated module test references template foo, which cannot be found. Available templates: test",
            });
        });
        it("fully resolves the source path on module files", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "foo",
                            generateFiles: [{ sourcePath: "foo/bar.txt", targetPath: "foo.txt", resolveTemplates: true }],
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
                spec: {
                    ...defaults.spec,
                    inputs: {
                        foo: "bar",
                    },
                },
            };
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            const absPath = (0, path_1.resolve)(config.path, "foo", "bar.txt");
            (0, chai_1.expect)(resolved.modules[0].generateFiles[0].sourcePath).to.equal(absPath);
        });
        it("creates the module path directory, if necessary", async () => {
            const absPath = (0, path_1.resolve)(garden.projectRoot, ".garden", "foo");
            await (0, fs_extra_1.remove)(absPath);
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "foo",
                            path: `.garden/foo`,
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
                spec: {
                    ...defaults.spec,
                    inputs: {
                        foo: "bar",
                    },
                },
            };
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            const module = resolved.modules[0];
            (0, chai_1.expect)(module.path).to.equal(absPath);
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(module.path)).to.be.true;
        });
        it("attaches parent module and template metadata to the output modules", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "foo",
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
                spec: {
                    ...defaults.spec,
                    inputs: {
                        foo: "bar",
                    },
                },
            };
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            (0, chai_1.expect)(resolved.modules[0].parentName).to.equal(config.name);
            (0, chai_1.expect)(resolved.modules[0].templateName).to.equal(template.name);
            (0, chai_1.expect)(resolved.modules[0].inputs).to.eql(config.spec.inputs);
        });
        it("resolves template strings in template module names", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "${inputs.foo}",
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
                spec: {
                    ...defaults.spec,
                    inputs: {
                        foo: "bar",
                    },
                },
            };
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            (0, chai_1.expect)(resolved.modules[0].name).to.equal("bar");
        });
        it("returns no modules if templated module is disabled", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "foo",
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
                disabled: true,
            };
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            (0, chai_1.expect)(resolved.modules.length).to.equal(0);
        });
        it("throws if an invalid module spec is in the template", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: 123,
                            name: "foo",
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
            };
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveTemplatedModule)(garden, config, _templates), {
                contains: "ModuleTemplate test returned an invalid module (named foo) for templated module test: Error validating module (modules.garden.yml): key .type must be a string",
            });
        });
        it("throws if a module spec has an invalid name", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: 123,
                        },
                    ],
                },
            };
            const config = {
                ...defaults,
            };
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveTemplatedModule)(garden, config, _templates), {
                contains: "ModuleTemplate test returned an invalid module (named 123) for templated module test: Error validating module (modules.garden.yml): key .name must be a string",
            });
        });
        it("resolves project variable references in input fields", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "${inputs.name}-test",
                        },
                    ],
                },
            };
            const config = (0, lodash_1.cloneDeep)(defaults);
            config.spec.inputs = { name: "${var.test}" };
            garden.variables.test = "test-value";
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            (0, chai_1.expect)(resolved.modules[0].name).to.equal("test-value-test");
        });
        it("passes through unresolvable template strings in inputs field", async () => {
            var _a;
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "test",
                        },
                    ],
                },
            };
            const templateString = "version-${modules.foo.version}";
            const config = (0, lodash_1.cloneDeep)(defaults);
            config.spec.inputs = { version: templateString };
            const resolved = await (0, module_template_1.resolveTemplatedModule)(garden, config, _templates);
            (0, chai_1.expect)((_a = resolved.modules[0].inputs) === null || _a === void 0 ? void 0 : _a.version).to.equal(templateString);
        });
        it("throws if an unresolvable template string is used for a templated module name", async () => {
            const _templates = {
                test: {
                    ...template,
                    modules: [
                        {
                            type: "test",
                            name: "${inputs.name}-test",
                        },
                    ],
                },
            };
            const config = (0, lodash_1.cloneDeep)(defaults);
            config.spec.inputs = { name: "module-${modules.foo.version}" };
            await (0, helpers_1.expectError)(() => (0, module_template_1.resolveTemplatedModule)(garden, config, _templates), {
                contains: [
                    'ModuleTemplate test returned an invalid module (named module-${modules.foo.version}-test) for templated module test: Error validating module (modules.garden.yml): key .name with value "module-${modules.foo.version}-test" fails to match the required pattern: /^(?!garden)(?=.{1,63}$)[a-z][a-z0-9]*(-[a-z0-9]+)*$/.',
                    "Note that if a template string is used in the name of a module in a template, then the template string must be fully resolvable at the time of module scanning. This means that e.g. references to other modules or runtime outputs cannot be used.",
                ],
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLXRlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kdWxlLXRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHlEQUErRDtBQUMvRCw4Q0FBc0Y7QUFDdEYsNEVBSytDO0FBQy9DLCtCQUE4QjtBQUM5QiwwREFBbUQ7QUFDbkQsdUNBQTZDO0FBRTdDLG1DQUFrQztBQUVsQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLElBQUksTUFBa0IsQ0FBQTtJQUV0QixNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLElBQUEsb0JBQVUsRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFBO0lBQ2hGLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUNyQyxJQUFJLFFBQWEsQ0FBQTtRQUVqQixNQUFNLENBQUMsR0FBRyxFQUFFO1lBQ1YsUUFBUSxHQUFHO2dCQUNULFVBQVUsRUFBRSwrQkFBbUI7Z0JBQy9CLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxNQUFNLENBQUMsV0FBVztnQkFDeEIsVUFBVSxFQUFFLElBQUEsY0FBTyxFQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsc0JBQXNCLENBQUM7YUFDaEUsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLG1FQUFtRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2pGLE1BQU0sTUFBTSxHQUEyQjtnQkFDckMsR0FBRyxRQUFRO2dCQUNYLGdCQUFnQixFQUFFLHNCQUFzQjthQUN6QyxDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLHVDQUFxQixFQUFDLE1BQU0sRUFBRSxNQUFNLENB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