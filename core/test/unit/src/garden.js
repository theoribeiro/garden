"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testdouble_1 = __importDefault(require("testdouble"));
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const path_1 = require("path");
const garden_1 = require("../../../src/garden");
const helpers_1 = require("../../helpers");
const util_1 = require("../../../src/util/util");
const vcs_1 = require("../../../src/vcs/vcs");
const module_1 = require("../../../src/types/module");
const plugin_1 = require("../../../src/plugin/plugin");
const project_1 = require("../../../src/config/project");
const module_2 = require("../../../src/config/module");
const constants_1 = require("../../../src/constants");
const provider_1 = require("../../../src/config/provider");
const lodash_1 = require("lodash");
const common_1 = require("../../../src/config/common");
const fs_1 = require("../../../src/util/fs");
const fs_extra_1 = require("fs-extra");
const string_1 = require("../../../src/util/string");
const ext_source_util_1 = require("../../../src/util/ext-source-util");
const js_yaml_1 = require("js-yaml");
const vcs_2 = require("./vcs/vcs");
const exec_1 = require("../../../src/plugins/exec/exec");
const testing_1 = require("../../../src/util/testing");
// TODO-G2: change all module config based tests to be action-based.
describe("Garden", () => {
    let tmpDir;
    let pathFoo;
    let projectConfigFoo;
    before(async () => {
        tmpDir = await (0, fs_1.makeTempDir)({ git: true });
        pathFoo = tmpDir.path;
        projectConfigFoo = (0, helpers_1.createProjectConfig)({
            name: "test",
            path: pathFoo,
            providers: [{ name: "foo" }],
        });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    beforeEach(async () => {
        testdouble_1.default.replace(garden_1.Garden.prototype, "resolveModuleVersion", async () => helpers_1.testModuleVersion);
    });
    const providerActionHandlerTypes = [
        "configureProvider",
        "augmentGraph",
        "getEnvironmentStatus",
        "prepareEnvironment",
        "cleanupEnvironment",
        "getDashboardPage",
        "getDebugInfo",
    ];
    describe("factory", () => {
        function getProviderActionHandler(router, handlerType, pluginName) {
            return router.provider.getPluginHandler({ handlerType, pluginName });
        }
        function ensureProviderActionHandlers(router, pluginName) {
            providerActionHandlerTypes.forEach((h) => (0, chai_1.expect)(getProviderActionHandler(router, h, pluginName)).to.be.ok);
        }
        it("should initialize and add the action handlers for a plugin", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const actions = await garden.getActionRouter();
            ensureProviderActionHandlers(actions, "test-plugin");
            ensureProviderActionHandlers(actions, "test-plugin-b");
        });
        it("should initialize a project with config files with yaml and yml extensions", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-yaml-file-extensions"));
            (0, chai_1.expect)(garden).to.be.ok;
        });
        it("should always exclude the garden dir", async () => {
            const gardenA = await (0, helpers_1.makeTestGardenA)();
            const gardenCustomDir = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-a"), {
                gardenDirPath: "custom/garden-dir",
            });
            (0, chai_1.expect)(gardenA.moduleExcludePatterns).to.include(".garden/**/*");
            (0, chai_1.expect)(gardenCustomDir.moduleExcludePatterns).to.include("custom/garden-dir/**/*");
        });
        it("should parse and resolve the config from the project root", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const projectRoot = garden.projectRoot;
            const testPluginProvider = {
                name: "test-plugin",
                config: {
                    name: "test-plugin",
                    dependencies: [],
                    path: projectRoot,
                },
                dependencies: {},
                moduleConfigs: [],
                status: {
                    ready: true,
                    outputs: {},
                },
            };
            (0, chai_1.expect)(garden.projectName).to.equal("test-project-a");
            const providers = await garden.resolveProviders(garden.log);
            const configs = (0, lodash_1.mapValues)(providers, (p) => p.config);
            (0, chai_1.expect)(configs).to.eql({
                "exec": {
                    name: "exec",
                    dependencies: [],
                    path: projectRoot,
                },
                "container": {
                    name: "container",
                    dependencies: [],
                    path: projectRoot,
                },
                "templated": {
                    name: "templated",
                    path: projectRoot,
                },
                "test-plugin": testPluginProvider.config,
                "test-plugin-b": {
                    name: "test-plugin-b",
                    dependencies: [],
                    environments: ["local"],
                    path: projectRoot,
                },
            });
            (0, chai_1.expect)(garden.variables).to.eql({
                some: "variable",
            });
        });
        it("should load a project config in a custom-named config file", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "custom-config-names");
            const garden = await helpers_1.TestGarden.factory(projectRoot);
            (0, chai_1.expect)(garden.projectRoot).to.equal(projectRoot);
        });
        it("should resolve templated env variables in project config", async () => {
            process.env.TEST_PROVIDER_TYPE = "test-plugin";
            process.env.TEST_VARIABLE = "banana";
            const projectRoot = (0, helpers_1.getDataDir)("test-project-templated");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, { forceRefresh: true });
            delete process.env.TEST_PROVIDER_TYPE;
            delete process.env.TEST_VARIABLE;
            const providers = await garden.resolveProviders(garden.log);
            const configs = (0, lodash_1.mapValues)(providers, (p) => p.config);
            (0, chai_1.expect)(configs).to.eql({
                "exec": {
                    name: "exec",
                    dependencies: [],
                    path: garden.projectRoot,
                },
                "container": {
                    name: "container",
                    dependencies: [],
                    path: garden.projectRoot,
                },
                "templated": {
                    name: "templated",
                    path: garden.projectRoot,
                },
                "test-plugin": {
                    name: "test-plugin",
                    dependencies: [],
                    path: garden.projectRoot,
                },
            });
            (0, chai_1.expect)(garden.variables).to.eql({
                "some": "banana",
                "service-a-build-command": "OK",
            });
        });
        it("should throw if the specified environment isn't configured", async () => {
            await (0, helpers_1.expectError)(async () => (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { environmentName: "bla" }), { type: "parameter" });
        });
        it("should throw if environment starts with 'garden-'", async () => {
            await (0, helpers_1.expectError)(async () => (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { environmentName: "garden-bla" }), {
                type: "parameter",
            });
        });
        it("should throw if project.environments is not an array", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-project-malformed-environments");
            await (0, helpers_1.expectError)(async () => (0, helpers_1.makeTestGarden)(projectRoot), {
                contains: "Error validating project environments: value must be an array",
            });
        });
        it("should throw if project.environments is an empty array", async () => {
            const config = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: pathFoo,
                providers: [{ name: "foo" }],
            });
            config.environments = []; // <--
            await (0, helpers_1.expectError)(async () => await helpers_1.TestGarden.factory(pathFoo, { config }), {
                contains: "Error validating project environments: value must contain at least 1 items",
            });
        });
        it("should throw if project.environments is not set", async () => {
            let config = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: pathFoo,
                environments: [],
                providers: [{ name: "foo" }],
            });
            config.environments = []; // this is omitted later to simulate a config where envs are not set
            config = (0, lodash_1.omit)(config, "environments");
            await (0, helpers_1.expectError)(async () => await helpers_1.TestGarden.factory(pathFoo, { config }), {
                contains: "Error validating project environments: value is required",
            });
        });
        it("should set .garden as the default cache dir", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-project-empty");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, helpers_1.testPlugin)()] });
            (0, chai_1.expect)(garden.gardenDirPath).to.eql((0, path_1.join)(garden.projectRoot, ".garden"));
        });
        it("should optionally set a custom cache dir relative to project root", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-project-empty");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, {
                plugins: [(0, helpers_1.testPlugin)()],
                gardenDirPath: "my/cache/dir",
            });
            (0, chai_1.expect)(garden.gardenDirPath).to.eql((0, path_1.join)(garden.projectRoot, "my/cache/dir"));
        });
        it("should optionally set a custom cache dir with an absolute path", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-project-empty");
            const gardenDirPath = (0, helpers_1.getDataDir)("test-garden-dir");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, {
                plugins: [(0, helpers_1.testPlugin)()],
                gardenDirPath,
            });
            (0, chai_1.expect)(garden.gardenDirPath).to.eql(gardenDirPath);
        });
        it("should load default varfiles if they exist", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "varfiles");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, {});
            (0, chai_1.expect)(garden.variables).to.eql({
                a: "a",
                b: "B",
                c: "c",
            });
        });
        it("should load custom varfiles if specified", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "varfiles-custom");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, {});
            (0, chai_1.expect)(garden.variables).to.eql({
                a: "a",
                b: "B",
                c: "c",
            });
        });
        it("should respect the module variables < module varfile < CLI var precedence order", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "module-varfiles");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            // In the normal flow, `garden.cliVariables` is populated with variables passed via the `--var` CLI option.
            garden.cliVariables["d"] = "from-cli-var";
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const module = graph.getModule("module-a");
            (0, chai_1.expect)({ ...garden.variables, ...module.variables }).to.eql({
                a: "from-project-varfile",
                b: "from-module-vars",
                c: "from-module-varfile",
                d: "from-cli-var",
            });
        });
        it("should throw if project root is not in a git repo root", async () => {
            const dir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
            try {
                const tmpPath = await (0, fs_extra_1.realpath)(dir.path);
                await (0, fs_extra_1.writeFile)((0, path_1.join)(tmpPath, "garden.yml"), (0, string_1.dedent) `
          kind: Project
          name: foo
          environments:
            - name: local
        `);
                await (0, helpers_1.expectError)(async () => garden_1.Garden.factory(tmpPath, { commandInfo: { name: "test", args: {}, opts: {} } }), {
                    type: "runtime",
                });
            }
            finally {
                await dir.cleanup();
            }
        });
        it("should set the namespace attribute, if specified", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-project-empty");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, helpers_1.testPlugin)()], environmentName: "foo.local" });
            (0, chai_1.expect)(garden.environmentName).to.equal("local");
            (0, chai_1.expect)(garden.namespace).to.equal("foo");
        });
        it("should set the namespace attribute to the defaultNamespace, if applicable", async () => {
            const config = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: pathFoo,
                environments: [{ name: "default", defaultNamespace: "foo", variables: {} }],
                providers: [{ name: "foo" }],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, { config, environmentName: "default" });
            (0, chai_1.expect)(garden.environmentName).to.equal("default");
            (0, chai_1.expect)(garden.namespace).to.equal("foo");
        });
        it("should throw if a namespace is not specified and the specified environment requires namespacing", async () => {
            const config = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: pathFoo,
                environments: [{ name: "default", defaultNamespace: null, variables: {} }],
                providers: [{ name: "foo" }],
            });
            await (0, helpers_1.expectError)(() => helpers_1.TestGarden.factory(pathFoo, { config, environmentName: "default" }), {
                contains: "Environment default has defaultNamespace set to null, and no explicit namespace was specified. Please either set a defaultNamespace or explicitly set a namespace at runtime (e.g. --env=some-namespace.default).",
            });
        });
        it("should optionally override project variables", async () => {
            const config = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: pathFoo,
                environments: [{ name: "default", defaultNamespace: "foo", variables: {} }],
                providers: [{ name: "foo" }],
                variables: { foo: "default", bar: "something" },
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                config,
                environmentName: "default",
                variables: { foo: "override" },
            });
            (0, chai_1.expect)(garden.variables).to.eql({ foo: "override", bar: "something" });
        });
    });
    describe("getAllPlugins", () => {
        it("should attach base from createModuleTypes when overriding a handler via extendModuleTypes", async () => {
            const base = (0, plugin_1.createGardenPlugin)({
                name: "base",
                createModuleTypes: [
                    {
                        name: "foo",
                        docs: "foo",
                        schema: common_1.joi.object(),
                        needsBuild: true,
                        handlers: {
                            convert: async ({}) => ({}),
                        },
                    },
                ],
            });
            const foo = (0, plugin_1.createGardenPlugin)({
                name: "foo",
                dependencies: [{ name: "base" }],
                extendModuleTypes: [
                    {
                        name: "foo",
                        needsBuild: true,
                        handlers: {
                            convert: async ({}) => ({}),
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [base, foo],
                config: {
                    ...projectConfigFoo,
                    providers: [...projectConfigFoo.providers, { name: "base" }],
                },
            });
            const parsed = await garden.getPlugin("foo");
            const extended = (0, util_1.findByName)(parsed.extendModuleTypes, "foo");
            (0, chai_1.expect)(extended).to.exist;
            (0, chai_1.expect)(extended.name).to.equal("foo");
            const convertHandler = extended.handlers.convert;
            (0, chai_1.expect)(convertHandler).to.exist;
            (0, chai_1.expect)(convertHandler.base).to.exist;
            (0, chai_1.expect)(convertHandler.base.handlerType).to.equal("convert");
            (0, chai_1.expect)(convertHandler.base.moduleType).to.equal("foo");
            (0, chai_1.expect)(convertHandler.base.pluginName).to.equal("base");
            (0, chai_1.expect)(convertHandler.base.base).to.not.exist;
        });
        it("should throw if plugin module exports invalid name", async () => {
            const pluginPath = (0, path_1.join)(__dirname, "plugins", "invalid-name.js");
            const plugins = [pluginPath];
            const projectRoot = (0, helpers_1.getDataDir)("test-project-empty");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins });
            await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                contains: `Unable to load plugin: Error: Error validating plugin module \"${pluginPath}\": key .gardenPlugin must be of type object`,
            });
        });
        it("should throw if plugin module doesn't contain plugin", async () => {
            const pluginPath = (0, path_1.join)(__dirname, "plugins", "missing-plugin.js");
            const plugins = [pluginPath];
            const projectRoot = (0, helpers_1.getDataDir)("test-project-empty");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins });
            await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                contains: `Unable to load plugin: Error: Error validating plugin module "${pluginPath}": key .gardenPlugin is required`,
            });
        });
        it("should throw if multiple plugins declare the same module type", async () => {
            const testPluginDupe = {
                ...(0, helpers_1.testPlugin)(),
                name: "test-plugin-dupe",
            };
            const garden = await (0, helpers_1.makeTestGardenA)([testPluginDupe]);
            garden["providerConfigs"].push({ name: "test-plugin-dupe" });
            await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                contains: "Module type 'test' is declared in multiple plugins: test-plugin, test-plugin-dupe.",
            });
        });
        context("module type declaration has a base", () => {
            it("should allow recursive inheritance when defining module types", async () => {
                const baseA = (0, plugin_1.createGardenPlugin)({
                    name: "base-a",
                    createModuleTypes: [
                        {
                            name: "foo-a",
                            title: "Foo A",
                            docs: "foo-a",
                            schema: (0, module_2.baseModuleSpecSchema)().keys({ foo: common_1.joi.string() }),
                            moduleOutputsSchema: common_1.joi.object().keys({ moduleOutput: common_1.joi.string() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => ({ moduleConfig }),
                                suggestModules: async () => ({ suggestions: [] }),
                            },
                        },
                    ],
                });
                const baseB = (0, plugin_1.createGardenPlugin)({
                    name: "base-b",
                    dependencies: [{ name: "base-a" }],
                    createModuleTypes: [
                        {
                            name: "foo-b",
                            base: "foo-a",
                            docs: "Foo B",
                            schema: (0, module_2.baseModuleSpecSchema)(),
                            needsBuild: true,
                            handlers: {
                                convert: async ({}) => ({}),
                            },
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    dependencies: [{ name: "base-b" }],
                    createModuleTypes: [
                        {
                            name: "foo-c",
                            base: "foo-b",
                            docs: "Foo C",
                            schema: (0, module_2.baseModuleSpecSchema)().keys({ taskOutput: common_1.joi.string() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => ({ moduleConfig }),
                                convert: async ({}) => ({}),
                                getModuleOutputs: async () => {
                                    return { outputs: { foo: "bar" } };
                                },
                            },
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [baseA, baseB, foo],
                    config: projectConfigFoo,
                });
                const parsed = await garden.getPlugin("foo");
                const spec = (0, util_1.findByName)(parsed.createModuleTypes, "foo-c");
                // Make sure properties are correctly inherited
                (0, chai_1.expect)(spec).to.exist;
                (0, chai_1.expect)(spec.name).to.equal("foo-c");
                (0, chai_1.expect)(spec.base).to.equal("foo-b");
                (0, chai_1.expect)(spec.docs).to.equal("Foo C");
                (0, chai_1.expect)(spec.title).to.not.exist;
                (0, chai_1.expect)(spec.schema).to.exist;
                (0, chai_1.expect)(spec.moduleOutputsSchema).to.not.exist;
                // Make sure handlers are correctly inherited and bases set
                const configureHandler = spec.handlers.configure;
                (0, chai_1.expect)(configureHandler).to.exist;
                (0, chai_1.expect)(configureHandler.base).to.exist;
                (0, chai_1.expect)(configureHandler.base.handlerType).to.equal("configure");
                (0, chai_1.expect)(configureHandler.base.moduleType).to.equal("foo-a");
                (0, chai_1.expect)(configureHandler.base.pluginName).to.equal("base-a");
                (0, chai_1.expect)(configureHandler.base.base).to.not.exist;
                const convertHandler = spec.handlers.convert;
                (0, chai_1.expect)(convertHandler).to.exist;
                (0, chai_1.expect)(convertHandler.base).to.exist;
                (0, chai_1.expect)(convertHandler.base.handlerType).to.equal("convert");
                (0, chai_1.expect)(convertHandler.base.moduleType).to.equal("foo-b");
                (0, chai_1.expect)(convertHandler.base.pluginName).to.equal("base-b");
                (0, chai_1.expect)(convertHandler.base.base).to.not.exist;
                const getModuleOutputsHandler = spec.handlers.getModuleOutputs;
                (0, chai_1.expect)(getModuleOutputsHandler).to.exist;
                (0, chai_1.expect)(getModuleOutputsHandler.base).to.not.exist;
                const suggestModulesHandler = spec.handlers.suggestModules;
                (0, chai_1.expect)(suggestModulesHandler).to.not.exist;
            });
            it("should throw when a module type has a base that is not defined", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            base: "bar",
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo],
                    config: projectConfigFoo,
                });
                await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                    contains: [
                        "Module type 'foo', defined in plugin 'foo', specifies base module type 'bar' which cannot be found.",
                        "The plugin is likely missing a dependency declaration. Please report an issue with the author.",
                    ],
                });
            });
            it("should throw when a module type has a base that is not declared in the plugin's dependencies", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    createModuleTypes: [
                        {
                            name: "bar",
                            docs: "bar",
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            base: "bar",
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: {
                        ...projectConfigFoo,
                        providers: [...projectConfigFoo.providers, { name: "base" }],
                    },
                });
                await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                    contains: [
                        "Module type 'foo', defined in plugin 'foo', specifies base module type 'bar' which is defined by 'base'",
                        "but 'foo' does not specify a dependency on that plugin. Plugins must explicitly declare dependencies on",
                        "plugins that define module types they reference. Please report an issue with the author.",
                    ],
                });
            });
            it("should throw on circular module type base definitions", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            base: "bar",
                            needsBuild: true,
                            handlers: {},
                        },
                        {
                            name: "bar",
                            docs: "bar",
                            base: "foo",
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo],
                    config: projectConfigFoo,
                });
                await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                    contains: [
                        "Found circular dependency between module type",
                        "bases:",
                        "foo (from plugin foo) <- bar (from plugin foo) <- foo (from plugin foo)",
                    ],
                });
            });
        });
        context("when a plugin has a base defined", () => {
            it("should add and deduplicate declared dependencies on top of the dependencies of the base", async () => {
                const depA = (0, plugin_1.createGardenPlugin)({
                    name: "test-plugin",
                    dependencies: [],
                });
                const depB = (0, plugin_1.createGardenPlugin)({
                    name: "test-plugin-b",
                    dependencies: [],
                });
                const depC = (0, plugin_1.createGardenPlugin)({
                    name: "test-plugin-c",
                    dependencies: [],
                });
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    dependencies: [{ name: "test-plugin" }, { name: "test-plugin-b" }],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    dependencies: [{ name: "test-plugin-b" }, { name: "test-plugin-c" }],
                    base: "base",
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [depA, depB, depC, base, foo],
                    config: projectConfigFoo,
                });
                const parsed = await garden.getPlugin("foo");
                (0, chai_1.expect)(parsed.dependencies.map((d) => d.name)).to.eql(["test-plugin", "test-plugin-b", "test-plugin-c"]);
            });
            it("should combine handlers from both plugins and attach base to the handler when overriding", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    handlers: {
                        configureProvider: async ({ config }) => ({ config }),
                        getEnvironmentStatus: async () => ({ ready: true, outputs: {} }),
                    },
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                    handlers: {
                        configureProvider: async ({ config }) => ({ config }),
                    },
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: projectConfigFoo,
                });
                const parsed = await garden.getPlugin("foo");
                (0, chai_1.expect)(parsed.handlers.getEnvironmentStatus).to.equal(base.handlers.getEnvironmentStatus);
                (0, chai_1.expect)(parsed.handlers.configureProvider.base).to.equal(base.handlers.configureProvider);
                (0, chai_1.expect)(parsed.handlers.configureProvider.base.handlerType).to.equal("configureProvider");
                (0, chai_1.expect)(parsed.handlers.configureProvider.base.pluginName).to.equal("base");
                (0, chai_1.expect)(parsed.handlers.configureProvider.base.base).to.be.undefined;
            });
            it("should inherit config schema from base, if none is specified", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    configSchema: common_1.joi.object().keys({ foo: common_1.joi.string().default("bar") }),
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: projectConfigFoo,
                });
                const parsed = await garden.getPlugin("foo");
                (0, chai_1.expect)(parsed.configSchema).to.eql(base.configSchema);
            });
            it("should combine commands from both plugins and attach base handler when overriding", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    commands: [
                        {
                            name: "foo",
                            description: "foo",
                            resolveGraph: false,
                            handler: () => ({ result: {} }),
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                    commands: [
                        {
                            name: "foo",
                            description: "foo",
                            handler: () => ({ result: {} }),
                            resolveGraph: false,
                        },
                        {
                            name: "bar",
                            description: "bar",
                            handler: () => ({ result: {} }),
                            resolveGraph: false,
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: projectConfigFoo,
                });
                const parsed = await garden.getPlugin("foo");
                (0, chai_1.expect)(parsed.commands.length).to.equal(2);
                (0, chai_1.expect)((0, util_1.findByName)(parsed.commands, "foo")).to.eql({
                    ...foo.commands[0],
                    base: base.commands[0],
                });
                (0, chai_1.expect)((0, util_1.findByName)(parsed.commands, "bar")).to.eql(foo.commands[1]);
            });
            it("should combine tools from both plugins, ignoring base tools when overriding", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    tools: [
                        {
                            name: "base-tool",
                            type: "binary",
                            _includeInGardenImage: false,
                            description: "Test",
                            builds: [],
                        },
                        {
                            name: "common-tool",
                            type: "binary",
                            _includeInGardenImage: false,
                            description: "Base description",
                            builds: [],
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                    tools: [
                        {
                            name: "common-tool",
                            type: "library",
                            _includeInGardenImage: false,
                            description: "Different description",
                            builds: [],
                        },
                        {
                            name: "different-tool",
                            type: "binary",
                            _includeInGardenImage: false,
                            description: "Test",
                            builds: [],
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: projectConfigFoo,
                });
                const parsed = await garden.getPlugin("foo");
                (0, chai_1.expect)(parsed.tools.length).to.equal(3);
                (0, chai_1.expect)((0, util_1.findByName)(parsed.tools, "base-tool")).to.eql({
                    ...base.tools[0],
                });
                (0, chai_1.expect)((0, util_1.findByName)(parsed.tools, "common-tool")).to.eql({
                    ...foo.tools[0],
                });
                (0, chai_1.expect)((0, util_1.findByName)(parsed.tools, "different-tool")).to.eql(foo.tools[1]);
            });
            it("should register module types from both plugins", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object(),
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                    createModuleTypes: [
                        {
                            name: "bar",
                            docs: "bar",
                            schema: common_1.joi.object(),
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: projectConfigFoo,
                });
                const moduleTypes = await garden.getModuleTypes();
                (0, chai_1.expect)(Object.keys(moduleTypes).sort()).to.eql(["bar", "container", "exec", "foo", "templated"]);
            });
            it("should throw if attempting to redefine a module type defined in the base", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object(),
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                    createModuleTypes: base.createModuleTypes,
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: projectConfigFoo,
                });
                await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                    contains: "Plugin 'foo' redeclares the 'foo' module type, already declared by its base.",
                });
            });
            it("should allow extending a module type from the base", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object(),
                            needsBuild: true,
                            handlers: {
                                convert: async ({}) => ({}),
                            },
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                    extendModuleTypes: [
                        {
                            name: "foo",
                            needsBuild: true,
                            handlers: {
                                convert: async ({}) => ({}),
                                configure: async ({ moduleConfig }) => ({ moduleConfig }),
                            },
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: projectConfigFoo,
                });
                const parsed = await garden.getPlugin("foo");
                const extended = (0, util_1.findByName)(parsed.extendModuleTypes, "foo");
                (0, chai_1.expect)(extended).to.exist;
                (0, chai_1.expect)(extended.name).to.equal("foo");
            });
            it("should only extend (and not also create) a module type if the base is also a configured plugin", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object(),
                            needsBuild: true,
                            handlers: {
                                convert: async ({}) => ({}),
                            },
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                    extendModuleTypes: [
                        {
                            name: "foo",
                            needsBuild: true,
                            handlers: {
                                convert: async ({}) => ({}),
                                configure: async ({ moduleConfig }) => ({ moduleConfig }),
                            },
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [base, foo],
                    config: {
                        ...projectConfigFoo,
                        providers: [...projectConfigFoo.providers, { name: "base" }],
                    },
                });
                const parsedFoo = await garden.getPlugin("foo");
                const parsedBase = await garden.getPlugin("base");
                (0, chai_1.expect)((0, util_1.findByName)(parsedBase.createModuleTypes, "foo")).to.exist;
                (0, chai_1.expect)((0, util_1.findByName)(parsedFoo.createModuleTypes, "foo")).to.not.exist;
                (0, chai_1.expect)((0, util_1.findByName)(parsedFoo.extendModuleTypes, "foo")).to.exist;
            });
            it("should throw if the base plugin is not registered", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "base",
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo],
                    config: projectConfigFoo,
                });
                await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                    contains: "Plugin 'foo' specifies plugin 'base' as a base, but that plugin has not been registered.",
                });
            });
            it("should throw if plugins have circular bases", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    base: "bar",
                });
                const bar = (0, plugin_1.createGardenPlugin)({
                    name: "bar",
                    base: "foo",
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo, bar],
                    config: projectConfigFoo,
                });
                await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                    contains: ["Found a circular dependency between registered plugins:", "foo <- bar <- foo"],
                });
            });
            context("when a plugin's base has a base defined", () => {
                it("should add and deduplicate declared dependencies for the whole chain", async () => {
                    const depA = (0, plugin_1.createGardenPlugin)({
                        name: "test-plugin",
                    });
                    const depB = (0, plugin_1.createGardenPlugin)({
                        name: "test-plugin-b",
                    });
                    const depC = (0, plugin_1.createGardenPlugin)({
                        name: "test-plugin-c",
                    });
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        dependencies: [{ name: "test-plugin" }],
                    });
                    const b = (0, plugin_1.createGardenPlugin)({
                        name: "b",
                        dependencies: [{ name: "test-plugin" }, { name: "test-plugin-b" }],
                        base: "base-a",
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        dependencies: [{ name: "test-plugin-c" }],
                        base: "b",
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [depA, depB, depC, baseA, b, foo],
                        config: projectConfigFoo,
                    });
                    const parsed = await garden.getPlugin("foo");
                    (0, chai_1.expect)(parsed.dependencies.map((d) => d.name)).to.eql(["test-plugin", "test-plugin-b", "test-plugin-c"]);
                });
                it("should combine handlers from both plugins and recursively attach base handlers", async () => {
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        handlers: {
                            configureProvider: async ({ config }) => ({ config }),
                            getEnvironmentStatus: async () => ({ ready: true, outputs: {} }),
                        },
                    });
                    const baseB = (0, plugin_1.createGardenPlugin)({
                        name: "base-b",
                        base: "base-a",
                        handlers: {
                            configureProvider: async ({ config }) => ({ config }),
                        },
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        base: "base-b",
                        handlers: {
                            configureProvider: async ({ config }) => ({ config }),
                        },
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [baseA, baseB, foo],
                        config: projectConfigFoo,
                    });
                    const parsed = await garden.getPlugin("foo");
                    (0, chai_1.expect)(parsed.handlers.getEnvironmentStatus).to.equal(baseA.handlers.getEnvironmentStatus);
                    (0, chai_1.expect)(parsed.handlers.configureProvider.base).to.equal(baseB.handlers.configureProvider);
                    (0, chai_1.expect)(parsed.handlers.configureProvider.base.base).to.equal(baseA.handlers.configureProvider);
                    (0, chai_1.expect)(parsed.handlers.configureProvider.base.base.base).to.be.undefined;
                });
                it("should combine commands from all plugins and recursively set base handlers when overriding", async () => {
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        commands: [
                            {
                                name: "foo",
                                description: "foo",
                                handler: () => ({ result: {} }),
                            },
                        ],
                    });
                    const baseB = (0, plugin_1.createGardenPlugin)({
                        name: "base-b",
                        base: "base-a",
                        commands: [
                            {
                                name: "foo",
                                description: "foo",
                                handler: () => ({ result: {} }),
                            },
                            {
                                name: "bar",
                                description: "bar",
                                handler: () => ({ result: {} }),
                            },
                        ],
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        base: "base-b",
                        commands: [
                            {
                                name: "foo",
                                description: "foo",
                                handler: () => ({ result: {} }),
                            },
                            {
                                name: "bar",
                                description: "bar",
                                handler: () => ({ result: {} }),
                            },
                        ],
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [baseA, baseB, foo],
                        config: projectConfigFoo,
                    });
                    const parsed = await garden.getPlugin("foo");
                    (0, chai_1.expect)(parsed.commands.length).to.equal(2);
                    const fooCommand = (0, util_1.findByName)(parsed.commands, "foo");
                    const barCommand = (0, util_1.findByName)(parsed.commands, "bar");
                    (0, chai_1.expect)(fooCommand).to.exist;
                    (0, chai_1.expect)(fooCommand.handler).to.equal(foo.commands[0].handler);
                    (0, chai_1.expect)(fooCommand.base).to.exist;
                    (0, chai_1.expect)(fooCommand.base.handler).to.equal(baseB.commands[0].handler);
                    (0, chai_1.expect)(fooCommand.base.base).to.exist;
                    (0, chai_1.expect)(fooCommand.base.base.handler).to.equal(baseA.commands[0].handler);
                    (0, chai_1.expect)(fooCommand.base.base.base).to.be.undefined;
                    (0, chai_1.expect)(barCommand).to.exist;
                    (0, chai_1.expect)(barCommand.handler).to.equal(foo.commands[1].handler);
                    (0, chai_1.expect)(barCommand.base).to.exist;
                    (0, chai_1.expect)(barCommand.base.handler).to.equal(baseB.commands[1].handler);
                    (0, chai_1.expect)(barCommand.base.base).to.be.undefined;
                });
                it("should register defined module types from all plugins in the chain", async () => {
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        createModuleTypes: [
                            {
                                name: "a",
                                docs: "foo",
                                schema: common_1.joi.object(),
                                needsBuild: true,
                                handlers: {},
                            },
                        ],
                    });
                    const baseB = (0, plugin_1.createGardenPlugin)({
                        name: "base-b",
                        base: "base-a",
                        createModuleTypes: [
                            {
                                name: "b",
                                docs: "foo",
                                schema: common_1.joi.object(),
                                needsBuild: true,
                                handlers: {},
                            },
                        ],
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        base: "base-b",
                        createModuleTypes: [
                            {
                                name: "c",
                                docs: "bar",
                                schema: common_1.joi.object(),
                                needsBuild: true,
                                handlers: {},
                            },
                        ],
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [baseA, baseB, foo],
                        config: projectConfigFoo,
                    });
                    const moduleTypes = await garden.getModuleTypes();
                    (0, chai_1.expect)(Object.keys(moduleTypes).sort()).to.eql(["a", "b", "c", "container", "exec", "templated"]);
                });
                it("should throw if attempting to redefine a module type defined in the base's base", async () => {
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        createModuleTypes: [
                            {
                                name: "foo",
                                docs: "foo",
                                schema: common_1.joi.object(),
                                needsBuild: true,
                                handlers: {},
                            },
                        ],
                    });
                    const baseB = (0, plugin_1.createGardenPlugin)({
                        name: "base-b",
                        base: "base-a",
                        createModuleTypes: [],
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        base: "base-b",
                        createModuleTypes: [
                            {
                                name: "foo",
                                docs: "foo",
                                schema: common_1.joi.object(),
                                needsBuild: true,
                                handlers: {},
                            },
                        ],
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [baseA, baseB, foo],
                        config: projectConfigFoo,
                    });
                    await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                        contains: "Plugin 'foo' redeclares the 'foo' module type, already declared by its base.",
                    });
                });
                it("should allow extending module types from the base's base", async () => {
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        createModuleTypes: [
                            {
                                name: "foo",
                                docs: "foo",
                                schema: common_1.joi.object(),
                                needsBuild: true,
                                handlers: {
                                    convert: async ({}) => ({}),
                                },
                            },
                        ],
                    });
                    const baseB = (0, plugin_1.createGardenPlugin)({
                        name: "base-b",
                        base: "base-a",
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        base: "base-b",
                        extendModuleTypes: [
                            {
                                name: "foo",
                                needsBuild: true,
                                handlers: {
                                    convert: async ({}) => ({}),
                                    configure: async ({ moduleConfig }) => ({ moduleConfig }),
                                },
                            },
                        ],
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [baseA, baseB, foo],
                        config: projectConfigFoo,
                    });
                    const parsed = await garden.getPlugin("foo");
                    (0, chai_1.expect)((0, util_1.findByName)(parsed.extendModuleTypes, "foo")).to.exist;
                });
                it("should coalesce module type extensions if base plugin is not configured", async () => {
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        createModuleTypes: [
                            {
                                name: "foo",
                                docs: "foo",
                                schema: common_1.joi.object(),
                                needsBuild: true,
                                handlers: {
                                    convert: async ({}) => ({}),
                                },
                            },
                        ],
                    });
                    const baseB = (0, plugin_1.createGardenPlugin)({
                        name: "base-b",
                        base: "base-a",
                        dependencies: [{ name: "base-a" }],
                        extendModuleTypes: [
                            {
                                name: "foo",
                                needsBuild: true,
                                handlers: {
                                    convert: async ({}) => ({}),
                                },
                            },
                        ],
                    });
                    const baseC = (0, plugin_1.createGardenPlugin)({
                        name: "base-c",
                        base: "base-b",
                        dependencies: [{ name: "base-a" }],
                        extendModuleTypes: [
                            {
                                name: "foo",
                                needsBuild: true,
                                handlers: {
                                    configure: async ({ moduleConfig }) => ({ moduleConfig }),
                                    convert: async ({}) => ({}),
                                },
                            },
                        ],
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        base: "base-c",
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [baseA, baseB, baseC, foo],
                        config: projectConfigFoo,
                    });
                    const parsed = await garden.getPlugin("foo");
                    // Module type extensions should be a combination of base-b and base-c extensions
                    const fooExtension = (0, util_1.findByName)(parsed.extendModuleTypes, "foo");
                    (0, chai_1.expect)(fooExtension).to.exist;
                    const configureHandler = fooExtension.handlers.configure;
                    (0, chai_1.expect)(configureHandler).to.exist;
                    const convertHandler = fooExtension.handlers.convert;
                    (0, chai_1.expect)(convertHandler).to.exist;
                    (0, chai_1.expect)(convertHandler.base).to.exist;
                    (0, chai_1.expect)(convertHandler.base.handlerType).to.equal("convert");
                    (0, chai_1.expect)(convertHandler.base.moduleType).to.equal("foo");
                    (0, chai_1.expect)(convertHandler.base.pluginName).to.equal("base-a");
                });
                it("should throw if plugins have circular bases", async () => {
                    const baseA = (0, plugin_1.createGardenPlugin)({
                        name: "base-a",
                        base: "foo",
                    });
                    const baseB = (0, plugin_1.createGardenPlugin)({
                        name: "base-b",
                        base: "base-a",
                    });
                    const foo = (0, plugin_1.createGardenPlugin)({
                        name: "foo",
                        base: "base-b",
                    });
                    const garden = await helpers_1.TestGarden.factory(pathFoo, {
                        plugins: [baseA, baseB, foo],
                        config: projectConfigFoo,
                    });
                    await (0, helpers_1.expectError)(() => garden.getAllPlugins(), {
                        contains: ["Found a circular dependency between registered plugins:", "base-a <- foo <- base-b <- base-a"],
                    });
                });
            });
        });
    });
    describe("resolveProviders", () => {
        it("should throw when plugins are missing", async () => {
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    providers: [{ name: "test-plugin" }],
                }),
            });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), {
                contains: "Configured provider 'test-plugin' has not been registered.",
            });
        });
        it("should pass through a basic provider config", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const projectRoot = garden.projectRoot;
            const testPluginProvider = {
                name: "test-plugin",
                config: {
                    name: "test-plugin",
                    dependencies: [],
                    path: projectRoot,
                },
                dependencies: [],
                moduleConfigs: [],
                status: {
                    ready: true,
                    outputs: {},
                },
            };
            const providers = await garden.resolveProviders(garden.log);
            const configs = (0, lodash_1.mapValues)(providers, (p) => p.config);
            (0, chai_1.expect)(configs["test-plugin"]).to.eql(testPluginProvider.config);
            (0, chai_1.expect)(configs["test-plugin-b"]).to.eql({
                name: "test-plugin-b",
                dependencies: [],
                environments: ["local"],
                path: projectRoot,
            });
        });
        it("should call a configureProvider handler if applicable", async () => {
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: pathFoo,
                providers: [{ name: "test", foo: "bar" }],
            });
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                handlers: {
                    async configureProvider({ config }) {
                        (0, chai_1.expect)(config).to.eql({
                            name: "test",
                            dependencies: [],
                            path: projectConfig.path,
                            foo: "bar",
                        });
                        return { config: { ...config, foo: "bla" } };
                    },
                },
            });
            const garden = await (0, helpers_1.makeTestGarden)(projectConfig.path, {
                plugins: [test],
                config: projectConfig,
            });
            const provider = await garden.resolveProvider(garden.log, "test");
            (0, chai_1.expect)(provider.config).to.eql({
                name: "test",
                dependencies: [],
                path: projectConfig.path,
                foo: "bla",
            });
        });
        it("should give a readable error if provider configs have invalid template strings", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test", foo: "${bla.ble}" }],
            });
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [test] });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), (err) => {
                (0, helpers_1.expectFuzzyMatch)(err.message, ["Failed resolving one or more providers:", "- test"]);
                (0, helpers_1.expectFuzzyMatch)(err.detail.messages[0], "Invalid template string (${bla.ble}): Could not find key bla. Available keys: command, datetime, environment, git, local, project, providers, secrets, var and variables.");
            });
        });
        it("should throw if providers reference non-existent providers in template strings", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test", foo: "${providers.foo.config.bla}" }],
            });
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [test] });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log));
        });
        it("should add plugin modules if returned by the provider", async () => {
            const pluginModule = (0, helpers_1.makeModuleConfig)(`${helpers_1.projectRootA}/tmp`, {
                name: "foo",
                type: "exec",
            });
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                handlers: {
                    async configureProvider({ config }) {
                        return { config, moduleConfigs: [pluginModule] };
                    },
                },
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "Test plugin",
                        schema: common_1.joi.object(),
                        needsBuild: true,
                        handlers: {},
                    },
                ],
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test", foo: "bar" }],
            });
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [test] });
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            (0, chai_1.expect)(graph.getModule("foo")).to.exist;
        });
        it("should throw if plugins have declared circular dependencies", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
                dependencies: [{ name: "test-b" }],
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
                dependencies: [{ name: "test-a" }],
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test-a" }, { name: "test-b" }],
            });
            const plugins = [testA, testB];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), {
                contains: ["Found a circular dependency between registered plugins:", "test-a <- test-b <- test-a"],
            });
        });
        it("should throw if plugins reference themselves as dependencies", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
                dependencies: [{ name: "test-a" }],
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test-a" }],
            });
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [testA] });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), {
                contains: ["Found a circular dependency between registered plugins:", "test-a <- test-a"],
            });
        });
        it("should throw if provider configs have implicit circular dependencies", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [
                    { name: "test-a", foo: "${providers.test-b.outputs.foo}" },
                    { name: "test-b", foo: "${providers.test-a.outputs.foo}" },
                ],
            });
            const plugins = [testA, testB];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), {
                contains: [
                    "One or more circular dependencies found between providers or their configurations:",
                    "test-a <- test-b <- test-a",
                ],
            });
        });
        it("should throw if provider configs have combined implicit and declared circular dependencies", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [
                    { name: "test-a", foo: "${providers.test-b.outputs.foo}" },
                    { name: "test-b", dependencies: ["test-a"] },
                ],
            });
            const plugins = [testA, testB];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), {
                contains: [
                    "One or more circular dependencies found between providers or their",
                    "configurations:",
                    "test-a <- test-b <- test-a",
                ],
            });
        });
        it("should throw if provider configs have combined implicit and plugin circular dependencies", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
                dependencies: [{ name: "test-a" }],
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test-a", foo: "${providers.test-b.outputs.foo}" }, { name: "test-b" }],
            });
            const plugins = [testA, testB];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), {
                contains: [
                    "One or more circular dependencies found between providers or their",
                    "configurations:",
                    "test-a <- test-b <- test-a",
                ],
            });
        });
        it("should apply default values from a plugin's configuration schema if specified", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                configSchema: (0, provider_1.providerConfigBaseSchema)().keys({
                    foo: common_1.joi.string().default("bar"),
                }),
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test" }],
            });
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [test] });
            const providers = (0, lodash_1.keyBy)(await garden.resolveProviders(garden.log), "name");
            (0, chai_1.expect)(providers.test).to.exist;
            (0, chai_1.expect)(providers.test.config["foo"]).to.equal("bar");
        });
        it("should throw if a config doesn't match a plugin's configuration schema", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                configSchema: (0, provider_1.providerConfigBaseSchema)().keys({
                    foo: common_1.joi.string(),
                }),
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test", foo: 123 }],
            });
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [test] });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), (err) => {
                (0, helpers_1.expectFuzzyMatch)(err.message, ["Failed resolving one or more providers:", "- test"]);
                (0, helpers_1.expectFuzzyMatch)(err.detail.messages[0], "Error validating provider configuration: key .foo must be a string");
            });
        });
        it("should throw if configureProvider returns a config that doesn't match a plugin's config schema", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                configSchema: (0, provider_1.providerConfigBaseSchema)().keys({
                    foo: common_1.joi.string(),
                }),
                handlers: {
                    configureProvider: async () => ({
                        config: { name: "test", foo: 123 },
                    }),
                },
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test" }],
            });
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [test] });
            await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), (err) => {
                (0, helpers_1.expectFuzzyMatch)(err.message, ["Failed resolving one or more providers:", "- test"]);
                (0, helpers_1.expectFuzzyMatch)(err.detail.messages[0], "Error validating provider configuration: key .foo must be a string");
            });
        });
        it("should allow providers to reference each others' outputs", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
                handlers: {
                    getEnvironmentStatus: async () => {
                        return {
                            ready: true,
                            outputs: { foo: "bar" },
                        };
                    },
                },
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test-a" }, { name: "test-b", foo: "${providers.test-a.outputs.foo}" }],
            });
            const plugins = [testA, testB];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            const providerB = await garden.resolveProvider(garden.log, "test-b");
            (0, chai_1.expect)(providerB.config["foo"]).to.equal("bar");
        });
        it("should allow providers to reference outputs from a disabled provider", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
                handlers: {
                    getEnvironmentStatus: async () => {
                        return {
                            ready: true,
                            outputs: { foo: "bar" },
                        };
                    },
                },
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                defaultEnvironment: "dev",
                environments: [
                    { name: "dev", defaultNamespace: project_1.defaultNamespace, variables: {} },
                    { name: "prod", defaultNamespace: project_1.defaultNamespace, variables: {} },
                ],
                providers: [
                    { name: "test-a", environments: ["prod"] },
                    { name: "test-b", foo: "${providers.test-a.outputs.foo || 'default'}" },
                ],
            });
            const plugins = [testA, testB];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            const providerB = await garden.resolveProvider(garden.log, "test-b");
            (0, chai_1.expect)(providerB.config["foo"]).to.equal("default");
        });
        it("should allow providers to reference variables", async () => {
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { "my-variable": "bar" } }],
                providers: [{ name: "test-a", foo: "${var.my-variable}" }],
            });
            const plugins = [testA];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            const providerB = await garden.resolveProvider(garden.log, "test-a");
            (0, chai_1.expect)(providerB.config["foo"]).to.equal("bar");
        });
        it("should match a dependency to a plugin base", async () => {
            const baseA = (0, plugin_1.createGardenPlugin)({
                name: "base-a",
                handlers: {
                    getEnvironmentStatus: async () => {
                        return {
                            ready: true,
                            outputs: { foo: "bar" },
                        };
                    },
                },
            });
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
                base: "base-a",
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
                dependencies: [{ name: "base-a" }],
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test-a" }, { name: "test-b" }],
            });
            const plugins = [baseA, testA, testB];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            const providerA = await garden.resolveProvider(garden.log, "test-a");
            const providerB = await garden.resolveProvider(garden.log, "test-b");
            (0, chai_1.expect)(providerB.dependencies).to.eql({ "test-a": providerA });
        });
        it("should match a dependency to a plugin base that's declared by multiple plugins", async () => {
            const baseA = (0, plugin_1.createGardenPlugin)({
                name: "base-a",
                handlers: {
                    getEnvironmentStatus: async () => {
                        return {
                            ready: true,
                            outputs: { foo: "bar" },
                        };
                    },
                },
            });
            // test-a and test-b share one base
            const testA = (0, plugin_1.createGardenPlugin)({
                name: "test-a",
                base: "base-a",
            });
            const testB = (0, plugin_1.createGardenPlugin)({
                name: "test-b",
                base: "base-a",
            });
            const testC = (0, plugin_1.createGardenPlugin)({
                name: "test-c",
                dependencies: [{ name: "base-a" }],
            });
            const projectConfig = (0, helpers_1.createProjectConfig)({
                name: "test",
                path: helpers_1.projectRootA,
                providers: [{ name: "test-a" }, { name: "test-b" }, { name: "test-c" }],
            });
            const plugins = [baseA, testA, testB, testC];
            const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins });
            const providerA = await garden.resolveProvider(garden.log, "test-a");
            const providerB = await garden.resolveProvider(garden.log, "test-b");
            const providerC = await garden.resolveProvider(garden.log, "test-c");
            (0, chai_1.expect)(providerC.dependencies).to.eql({ "test-a": providerA, "test-b": providerB });
        });
        context("when a plugin has a base", () => {
            it("should throw if the config for the plugin doesn't match the base's config schema", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    configSchema: (0, provider_1.providerConfigBaseSchema)().keys({
                        foo: common_1.joi.string(),
                    }),
                });
                const test = (0, plugin_1.createGardenPlugin)({
                    name: "test",
                    base: "base",
                });
                const projectConfig = (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: helpers_1.projectRootA,
                    providers: [{ name: "test", foo: 123 }],
                });
                const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [base, test] });
                await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), (err) => {
                    (0, helpers_1.expectFuzzyMatch)(err.message, ["Failed resolving one or more providers:", "- test"]);
                    (0, helpers_1.expectFuzzyMatch)(err.detail.messages[0], "Error validating provider configuration: key .foo must be a string");
                });
            });
            it("should throw if the configureProvider handler doesn't return a config matching the base", async () => {
                const base = (0, plugin_1.createGardenPlugin)({
                    name: "base",
                    configSchema: (0, provider_1.providerConfigBaseSchema)().keys({
                        foo: common_1.joi.string(),
                    }),
                });
                const test = (0, plugin_1.createGardenPlugin)({
                    name: "test",
                    base: "base",
                    configSchema: common_1.joi.object(),
                    handlers: {
                        configureProvider: async () => ({
                            config: { name: "test", foo: 123 },
                        }),
                    },
                });
                const projectConfig = (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: helpers_1.projectRootA,
                    providers: [{ name: "test" }],
                });
                const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { config: projectConfig, plugins: [base, test] });
                await (0, helpers_1.expectError)(() => garden.resolveProviders(garden.log), (err) => {
                    (0, helpers_1.expectFuzzyMatch)(err.message, ["Failed resolving one or more providers:", "- test"]);
                    (0, helpers_1.expectFuzzyMatch)(err.detail.messages[0], "Error validating provider configuration (base schema from 'base' plugin): key .foo must be a string");
                });
            });
        });
    });
    describe("getProjectSources", () => {
        it("should correctly resolve template strings in remote source configs", async () => {
            const remoteTag = "feature-branch";
            process.env.TEST_ENV_VAR = "foo";
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { remoteTag } }],
                    providers: [{ name: "test-plugin" }],
                    variables: { sourceName: "${local.env.TEST_ENV_VAR}" },
                    sources: [
                        {
                            name: "${var.sourceName}",
                            repositoryUrl: "git://github.com/foo/bar.git#${var.remoteTag}",
                        },
                    ],
                }),
            });
            const sources = garden.getProjectSources();
            (0, chai_1.expect)(sources).to.eql([{ name: "foo", repositoryUrl: "git://github.com/foo/bar.git#feature-branch" }]);
            delete process.env.TEST_ENV_VAR;
        });
        it("should validate the resolved remote sources", async () => {
            const remoteTag = "feature-branch";
            process.env.TEST_ENV_VAR = "foo";
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { remoteTag } }],
                    providers: [{ name: "test-plugin" }],
                    variables: { sourceName: 123 },
                    sources: [
                        {
                            name: "${var.sourceName}",
                            repositoryUrl: "git://github.com/foo/bar.git#${var.remoteTag}",
                        },
                    ],
                }),
            });
            (0, helpers_1.expectError)(() => garden.getProjectSources(), {
                contains: "Error validating remote source: key [0][name] must be a string",
            });
            delete process.env.TEST_ENV_VAR;
        });
    });
    describe("scanForConfigs", () => {
        it("should find all garden configs in the project directory", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const files = await garden.scanForConfigs(garden.projectRoot);
            (0, chai_1.expect)(files).to.eql([
                (0, path_1.join)(garden.projectRoot, "commands.garden.yml"),
                (0, path_1.join)(garden.projectRoot, "garden.yml"),
                (0, path_1.join)(garden.projectRoot, "module-a", "garden.yml"),
                (0, path_1.join)(garden.projectRoot, "module-b", "garden.yml"),
                (0, path_1.join)(garden.projectRoot, "module-c", "garden.yml"),
            ]);
        });
        it("should respect the include option, if specified", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            (0, lodash_1.set)(garden, "moduleIncludePatterns", ["module-a/**/*"]);
            const files = await garden.scanForConfigs(garden.projectRoot);
            (0, chai_1.expect)(files).to.eql([(0, path_1.join)(garden.projectRoot, "module-a", "garden.yml")]);
        });
        it("should respect the exclude option, if specified", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            (0, lodash_1.set)(garden, "moduleExcludePatterns", ["module-a/**/*"]);
            const files = await garden.scanForConfigs(garden.projectRoot);
            (0, chai_1.expect)(files).to.eql([
                (0, path_1.join)(garden.projectRoot, "commands.garden.yml"),
                (0, path_1.join)(garden.projectRoot, "garden.yml"),
                (0, path_1.join)(garden.projectRoot, "module-b", "garden.yml"),
                (0, path_1.join)(garden.projectRoot, "module-c", "garden.yml"),
            ]);
        });
        it("should respect the include and exclude options, if both are specified", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            (0, lodash_1.set)(garden, "moduleIncludePatterns", ["module*/**/*"]);
            (0, lodash_1.set)(garden, "moduleExcludePatterns", ["module-a/**/*"]);
            const files = await garden.scanForConfigs(garden.projectRoot);
            (0, chai_1.expect)(files).to.eql([
                (0, path_1.join)(garden.projectRoot, "module-b", "garden.yml"),
                (0, path_1.join)(garden.projectRoot, "module-c", "garden.yml"),
            ]);
        });
    });
    describe("scanAndAddConfigs", () => {
        // TODO: assert that gitignore in project root is respected
        it("should scan the project root for modules and add to the context", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            await garden.scanAndAddConfigs();
            const modules = await garden.resolveModules({ log: garden.log });
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-b", "module-c"]);
        });
        it("should scan and add modules for projects with configs defining multiple modules", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "multiple-module-config"));
            await garden.scanAndAddConfigs();
            const modules = await garden.resolveModules({ log: garden.log });
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql([
                "module-a1",
                "module-a2",
                "module-b1",
                "module-b2",
                "module-c",
                "module-from-project-config",
            ]);
        });
        it("should scan and add modules contained in custom-named config files", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "custom-config-names"));
            await garden.scanAndAddConfigs();
            const modules = await garden.resolveModules({ log: garden.log });
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-b"]);
        });
        it("should scan and add workflows contained in custom-named config files", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "custom-config-names"));
            await garden.scanAndAddConfigs();
            const workflows = await garden.getRawWorkflowConfigs();
            (0, chai_1.expect)((0, util_1.getNames)(workflows)).to.eql(["workflow-a", "workflow-b"]);
        });
        it("should scan and add modules for projects with external project sources", async () => {
            const garden = await (0, helpers_1.makeExtProjectSourcesGarden)();
            await garden.scanAndAddConfigs();
            const modules = await garden.resolveModules({ log: garden.log });
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-b", "module-c"]);
        });
        it("should resolve template strings in project source definitions", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-ext-project-sources"));
            const sourcesPath = (0, path_1.join)(garden.gardenDirPath, "sources");
            if (await (0, fs_extra_1.pathExists)(sourcesPath)) {
                await (0, fs_extra_1.remove)(sourcesPath);
                await (0, fs_extra_1.mkdirp)(sourcesPath);
            }
            const localSourcePath = (0, helpers_1.getDataDir)("test-project-local-project-sources", "source-a");
            const _tmpDir = await (0, fs_1.makeTempDir)();
            try {
                // Create a temporary git repo to clone
                const repoPath = (0, path_1.resolve)(_tmpDir.path, garden.projectName);
                await (0, fs_extra_1.copy)(localSourcePath, repoPath);
                await (0, util_1.exec)("git", ["init", "--initial-branch=main"], { cwd: repoPath });
                await (0, util_1.exec)("git", ["add", "."], { cwd: repoPath });
                await (0, util_1.exec)("git", ["commit", "-m", "foo"], { cwd: repoPath });
                garden.variables.sourceBranch = "main";
                const _garden = garden;
                _garden["projectSources"] = [
                    {
                        name: "source-a",
                        // Use a couple of template strings in the repo path
                        repositoryUrl: "file://" + _tmpDir.path + "/${project.name}#${var.sourceBranch}",
                    },
                ];
                await garden.scanAndAddConfigs();
                const modules = await garden.resolveModules({ log: garden.log });
                (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a"]);
            }
            finally {
                await _tmpDir.cleanup();
            }
        });
        it("should resolve module templates and any modules referencing them", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "module-templates"));
            await garden.scanAndAddConfigs();
            const configA = (await garden.getRawModuleConfigs(["foo-test-a"]))[0];
            const configB = (await garden.getRawModuleConfigs(["foo-test-b"]))[0];
            (0, chai_1.expect)((0, util_1.omitUndefined)(configA)).to.eql({
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Module",
                build: {
                    dependencies: [],
                },
                include: [],
                configPath: (0, path_1.resolve)(garden.projectRoot, "modules.garden.yml"),
                name: "foo-test-a",
                path: garden.projectRoot,
                serviceConfigs: [],
                spec: {
                    build: {
                        command: ["${providers.test-plugin.outputs.testKey}"],
                        dependencies: [],
                    },
                },
                testConfigs: [],
                type: "test",
                taskConfigs: [],
                generateFiles: [
                    {
                        sourcePath: undefined,
                        targetPath: "module-a.log",
                        value: "hellow",
                    },
                ],
                parentName: "foo",
                templateName: "combo",
                inputs: {
                    name: "test",
                    value: "${providers.test-plugin.outputs.testKey}",
                },
            });
            (0, chai_1.expect)((0, util_1.omitUndefined)(configB)).to.eql({
                apiVersion: constants_1.DEFAULT_API_VERSION,
                kind: "Module",
                build: {
                    dependencies: [{ name: "foo-test-a", copy: [] }],
                },
                include: [],
                configPath: (0, path_1.resolve)(garden.projectRoot, "modules.garden.yml"),
                name: "foo-test-b",
                path: garden.projectRoot,
                serviceConfigs: [],
                spec: {
                    build: {
                        dependencies: [{ name: "foo-test-a", copy: [] }],
                    },
                },
                testConfigs: [],
                type: "test",
                taskConfigs: [],
                generateFiles: [
                    {
                        targetPath: "module-b.log",
                        sourcePath: (0, path_1.resolve)(garden.projectRoot, "source.txt"),
                    },
                ],
                parentName: "foo",
                templateName: "combo",
                inputs: {
                    name: "test",
                    value: "${providers.test-plugin.outputs.testKey}",
                },
            });
        });
        it("should throw on duplicate module template names", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "duplicate-module-templates"));
            await (0, helpers_1.expectError)(() => garden.scanAndAddConfigs(), {
                contains: [
                    "Found duplicate names of ModuleTemplates:",
                    "Name combo is used at templates.garden.yml and templates.garden.yml",
                ],
            });
        });
        it("should throw when two modules have the same name", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "duplicate-module"));
            await (0, helpers_1.expectError)(() => garden.scanAndAddConfigs(), {
                contains: "Module module-a is declared multiple times (in 'module-a/garden.yml' and 'module-b/garden.yml')",
            });
        });
        it("should respect the modules.include and modules.exclude fields, if specified", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "project-include-exclude");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const modules = await garden.resolveModules({ log: garden.log });
            // Should NOT include "nope" and "module-c"
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-b"]);
        });
        it("should respect .gitignore and .gardenignore files", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "dotignore");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const modules = await garden.resolveModules({ log: garden.log });
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a"]);
        });
        it("should respect custom dotignore files", async () => {
            // In this project we have custom dotIgnoreFile: .customignore which overrides the default .gardenignore.
            // Thus, all exclusions from .gardenignore will be skipped.
            // TODO: amend the config core/test/data/test-projects/dotignore-custom/garden.yml in 0.14
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "dotignore-custom");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const modules = await garden.resolveModules({ log: garden.log });
            // Root-level .customignore excludes "module-b",
            // and .customignore from "module-c" retains garden.yml file, so the "module-c" is still active.
            (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-c"]);
        });
        // TODO: Delete this context AND core/test/data/test-projects/dotignore-custom-legacy directory oin 0.14
        context("dotignore files migration to 0.13", async () => {
            it("should remap singleton array `dotIgnoreFiles` to scalar `dotIgnoreFile`", async () => {
                // In this project we have custom dotIgnoreFile: .customignore which overrides the default .gardenignore.
                // Thus, all exclusions from .gardenignore will be skipped.
                const projectRoot = (0, helpers_1.getDataDir)("test-projects", "dotignore-custom-legacy", "with-supported-legacy-config");
                const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
                const modules = await garden.resolveModules({ log: garden.log });
                // Root-level .customignore excludes "module-b",
                // and .customignore from "module-c" retains garden.yml file, so the "module-c" is still active.
                (0, chai_1.expect)((0, util_1.getNames)(modules).sort()).to.eql(["module-a", "module-c"]);
            });
            it("should throw and error if multi-valued `dotIgnoreFiles` is defined in the config", async () => {
                // In this project we have custom dotIgnoreFile: .customignore which overrides the default .gardenignore.
                // Thus, all exclusions from .gardenignore will be skipped.
                const projectRoot = (0, helpers_1.getDataDir)("test-projects", "dotignore-custom-legacy", "with-unsupported-legacy-config");
                await (0, helpers_1.expectError)(() => (0, helpers_1.makeTestGarden)(projectRoot), {
                    contains: "Cannot auto-convert array-field `dotIgnoreFiles` to scalar `dotIgnoreFile`: multiple values found in the array [.customignore, .gitignore]",
                });
            });
        });
        it("should throw a nice error if module paths overlap", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "multiple-module-config-bad");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                contains: [
                    "found multiple enabled modules that share the same garden.yml file or are nested within another",
                    "Module module-no-include-b overlaps with module(s) module-a1 (nested), module-a2 (nested) and module-no-include-a (same path).",
                    "Module module-no-include-a overlaps with module(s) module-a1 (nested), module-a2 (nested) and module-no-include-b (same path).",
                    "if this was intentional, there are two options to resolve this error",
                    "you can add include and/or exclude directives on the affected modules",
                    "you can use the disabled directive to make sure that only one of the modules is enabled",
                ],
            });
        });
        it.skip("should throw an error if references to missing secrets are present in a module config", async () => {
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("missing-secrets", "module"));
            await (0, helpers_1.expectError)(() => garden.scanAndAddConfigs(), { contains: "Module module-a: missing" });
        });
    });
    describe("resolveModules", () => {
        it("should throw if a module references itself in a template string", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "module-self-ref");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const key = "${modules.module-a.version}";
            await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                contains: [
                    "Failed resolving one or more modules:",
                    `module-a: Invalid template string (${key}): config module-a cannot reference itself.`,
                ],
            });
        });
        it("should resolve module path to external sources dir if module has a remote source", async () => {
            const garden = await (0, helpers_1.makeExtModuleSourcesGarden)();
            const module = await garden.resolveModule("module-a");
            (0, chai_1.expect)(module.path).to.equal((0, path_1.join)(garden.projectRoot, ".garden", "sources", "module", `module-a--${helpers_1.testGitUrlHash}`));
        });
        it("should handle template variables for non-string fields", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "non-string-template-values");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const module = await garden.resolveModule("module-a");
            // We template in the value for the module's allowPublish field to test this
            (0, chai_1.expect)(module.allowPublish).to.equal(false);
        });
        it("should filter out null build dependencies after resolving template strings", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "dynamic-build-dependencies");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const module = await garden.resolveModule("module-a");
            const moduleCDep = { name: "module-c", copy: [] };
            (0, chai_1.expect)(module.build.dependencies).to.eql([moduleCDep]);
            (0, chai_1.expect)(module.spec.build.dependencies).to.eql([moduleCDep]);
        });
        it("should correctly resolve template strings referencing nested variables", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object().keys({ bla: common_1.joi.string() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [test],
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { some: { nested: { key: "my value" } } } }],
                    providers: [{ name: "test" }],
                }),
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: { bla: "${var.some.nested.key}" },
                },
            ]);
            const module = await garden.resolveModule("module-a");
            (0, chai_1.expect)(module.spec.bla).to.equal("my value");
        });
        it("should correctly resolve template strings referencing objects", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object().keys({ bla: common_1.joi.object() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [test],
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { some: { nested: { key: "my value" } } } }],
                    providers: [{ name: "test" }],
                }),
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: { bla: "${var.some}" },
                },
            ]);
            const module = await garden.resolveModule("module-a");
            (0, chai_1.expect)(module.spec.bla).to.eql({ nested: { key: "my value" } });
        });
        it("should pass through runtime template strings when no runtimeContext is provider", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object().keys({ bla: common_1.joi.string() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [test],
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    providers: [{ name: "test" }],
                }),
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: { bla: "${runtime.services.foo.bar || 'default'}" },
                },
            ]);
            const module = await garden.resolveModule("module-a");
            (0, chai_1.expect)(module.spec.bla).to.equal("${runtime.services.foo.bar || 'default'}");
        });
        it("should resolve conditional strings with missing variables", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object().keys({ bla: common_1.joi.string() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [test],
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    providers: [{ name: "test" }],
                }),
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: { bla: "${var.foo || 'default'}" },
                },
            ]);
            const module = await garden.resolveModule("module-a");
            (0, chai_1.expect)(module.spec.bla).to.equal("default");
        });
        it("should correctly resolve template strings with $merge keys", async () => {
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object().keys({ bla: common_1.joi.object() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [test],
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { obj: { b: "B", c: "c" } } }],
                    providers: [{ name: "test" }],
                }),
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {
                        bla: {
                            a: "a",
                            b: "b",
                            $merge: "${var.obj}",
                        },
                    },
                },
            ]);
            const module = await garden.resolveModule("module-a");
            (0, chai_1.expect)(module.spec.bla).to.eql({ a: "a", b: "B", c: "c" });
        });
        it("should correctly handle build dependencies added by module configure handlers", async () => {
            var _a;
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object(),
                        needsBuild: true,
                        handlers: {
                            async configure({ moduleConfig }) {
                                if (moduleConfig.name === "module-b") {
                                    moduleConfig.build.dependencies = [{ name: "module-a", copy: [] }];
                                }
                                return { moduleConfig };
                            },
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [test],
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    providers: [{ name: "test" }],
                }),
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    include: [],
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-b",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    include: [],
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
            ]);
            const module = await garden.resolveModule("module-b");
            (0, chai_1.expect)((_a = module.buildDependencies["module-a"]) === null || _a === void 0 ? void 0 : _a.name).to.equal("module-a");
        });
        it("should handle module references within single file", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "1067-module-ref-within-file");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            // This should just complete successfully
            await garden.resolveModules({ log: garden.log });
        });
        context("module variables", () => {
            let garden;
            const test = (0, plugin_1.createGardenPlugin)({
                name: "test",
                createModuleTypes: [
                    {
                        name: "test",
                        docs: "test",
                        schema: common_1.joi.object().keys({ bla: common_1.joi.any() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            beforeEach(async () => {
                garden = await helpers_1.TestGarden.factory(pathFoo, {
                    noCache: true,
                    plugins: [test],
                    config: (0, helpers_1.createProjectConfig)({
                        name: "test",
                        path: pathFoo,
                        environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { some: "variable" } }],
                        providers: [{ name: "test" }],
                    }),
                });
            });
            it("resolves referenced project variables", async () => {
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-a",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {
                            bla: "${var.some}",
                        },
                    },
                ]);
                const module = await garden.resolveModule("module-a");
                (0, chai_1.expect)(module.spec.bla).to.equal("variable");
            });
            it("resolves referenced module variables", async () => {
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-a",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {
                            bla: "${var.foo}",
                        },
                        variables: {
                            foo: "bar",
                        },
                    },
                ]);
                const module = await garden.resolveModule("module-a");
                (0, chai_1.expect)(module.spec.bla).to.equal("bar");
            });
            it("prefers module variables over project variables", async () => {
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-a",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {
                            bla: "${var.some}",
                        },
                        variables: {
                            some: "foo",
                        },
                    },
                ]);
                const module = await garden.resolveModule("module-a");
                (0, chai_1.expect)(module.spec.bla).to.equal("foo");
            });
            it("resolves project variables in module variables", async () => {
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-a",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {
                            bla: "${var.some}",
                        },
                        variables: {
                            some: "prefix-${var.some}",
                        },
                    },
                ]);
                const module = await garden.resolveModule("module-a");
                (0, chai_1.expect)(module.spec.bla).to.equal("prefix-variable");
            });
            it("exposes module vars to other modules", async () => {
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-a",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        include: [],
                        disabled: false,
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {},
                        variables: {
                            foo: "bar",
                        },
                    },
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-b",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        include: [],
                        disabled: false,
                        path: garden.projectRoot,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {
                            bla: "${modules.module-a.var.foo}",
                        },
                    },
                ]);
                const module = await garden.resolveModule("module-b");
                (0, chai_1.expect)(module.spec.bla).to.equal("bar");
            });
        });
        it("resolves and writes a module file with a string value", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "module-templates");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            garden.cacheKey = ""; // Disable caching
            const filePath = (0, path_1.resolve)(garden.projectRoot, "module-a.log");
            await (0, fs_extra_1.remove)(filePath);
            await garden.resolveModules({ log: garden.log });
            const fileContents = await (0, fs_extra_1.readFile)(filePath);
            (0, chai_1.expect)(fileContents.toString()).to.equal("hellow");
        });
        it("resolves and writes a module file with a source file", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "module-templates");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            garden["cacheKey"] = ""; // Disable caching
            const filePath = (0, path_1.resolve)(garden.projectRoot, "module-b.log");
            await (0, fs_extra_1.remove)(filePath);
            await garden.resolveModules({ log: garden.log });
            const fileContents = await (0, fs_extra_1.readFile)(filePath);
            (0, chai_1.expect)(fileContents.toString().trim()).to.equal((0, string_1.dedent) `
        Hello I am file!
        input: testValue
        module reference: ${garden.projectRoot}
      `);
        });
        it("resolves and writes a module file to a subdirectory and creates the directory", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-projects", "module-templates");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const filePath = (0, path_1.resolve)(garden.projectRoot, ".garden", "subdir", "module-c.log");
            await (0, fs_extra_1.remove)(filePath);
            await garden.resolveModules({ log: garden.log });
            const fileContents = await (0, fs_extra_1.readFile)(filePath);
            (0, chai_1.expect)(fileContents.toString().trim()).to.equal((0, string_1.dedent) `
        Hello I am string!
        input: testValue
        module reference: ${garden.projectRoot}
      `);
        });
        it("passes escaped template strings through when rendering a file", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const targetPath = "targetfile.log";
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    include: [],
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                    generateFiles: [
                        {
                            value: "Project name: ${project.name}, Escaped string: $${var.foo}",
                            targetPath,
                            resolveTemplates: true,
                        },
                    ],
                },
            ]);
            const module = await garden.resolveModule("module-a");
            const expectedTargetPath = (0, path_1.join)(module.path, targetPath);
            const contents = await (0, fs_extra_1.readFile)(expectedTargetPath);
            (0, chai_1.expect)(contents.toString()).to.equal("Project name: test-project-a, Escaped string: ${var.foo}");
        });
        it("optionally skips resolving template strings when reading a source file", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const sourcePath = (0, string_1.randomString)(8) + ".log";
            const sourceFullPath = (0, path_1.join)(pathFoo, sourcePath);
            const value = "Project name: ${project.name}, Escaped string: $${var.foo}";
            await (0, fs_extra_1.writeFile)(sourceFullPath, value);
            const targetPath = "targetfile.log";
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    include: [],
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                    generateFiles: [
                        {
                            sourcePath,
                            targetPath,
                            resolveTemplates: false,
                        },
                    ],
                },
            ]);
            const module = await garden.resolveModule("module-a");
            const expectedTargetPath = (0, path_1.join)(module.path, targetPath);
            const contents = await (0, fs_extra_1.readFile)(expectedTargetPath);
            (0, chai_1.expect)(contents.toString()).to.equal(value);
        });
        it("throws helpful error is sourcePath doesn't contain globs and can't be found", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    include: [],
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                    generateFiles: [
                        {
                            sourcePath: "blorg",
                            targetPath: "targetfile.log",
                            resolveTemplates: false,
                        },
                    ],
                },
            ]);
            await (0, helpers_1.expectError)(() => garden.resolveModule("module-a"), {
                contains: [
                    "Failed resolving one or more modules:",
                    `module-a: Unable to read file at ${pathFoo}/blorg, specified under generateFiles in module module-a: Error: ENOENT: no such file or directory, open '${pathFoo}/blorg'`,
                ],
            });
        });
        it("resolves and writes a module file in a remote module", async () => {
            const garden = await (0, helpers_1.makeTestGarden)(pathFoo, {
                noTempDir: true,
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    providers: [{ name: "test-plugin" }],
                }),
            });
            const sourcePath = (0, string_1.randomString)(8) + ".log";
            const sourceFullPath = (0, path_1.join)(pathFoo, sourcePath);
            const tmpRepo = await (0, fs_1.makeTempDir)({ git: true });
            try {
                const targetPath = "targetfile.log";
                await (0, fs_extra_1.writeFile)(sourceFullPath, "hello ${project.name}");
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-a",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        include: [],
                        configPath: (0, path_1.join)(pathFoo, "module-a.garden.yml"),
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {},
                        repositoryUrl: "file://" + tmpRepo.path + "#main",
                        generateFiles: [
                            {
                                sourcePath,
                                targetPath,
                                resolveTemplates: true,
                            },
                        ],
                    },
                ]);
                const module = await garden.resolveModule("module-a");
                // Make sure the resolved module path is in the .garden directory because it's a remote module
                (0, chai_1.expect)(module.path.startsWith(garden.gardenDirPath)).to.be.true;
                const expectedTargetPath = (0, path_1.join)(module.path, targetPath);
                const contents = await (0, fs_extra_1.readFile)(expectedTargetPath);
                (0, chai_1.expect)(contents.toString()).to.equal("hello test");
            }
            finally {
                await (0, fs_extra_1.remove)(sourceFullPath);
                await tmpRepo.cleanup();
            }
        });
        it("resolves and writes a module file in a linked remote module", async () => {
            const garden = await (0, helpers_1.makeTestGarden)(pathFoo, {
                noTempDir: true,
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    providers: [{ name: "test-plugin" }],
                }),
            });
            const sourcePath = (0, string_1.randomString)(8) + ".log";
            const sourceFullPath = (0, path_1.join)(pathFoo, sourcePath);
            const tmpRepo = await (0, fs_1.makeTempDir)({ git: true });
            try {
                const targetPath = "targetfile.log";
                await (0, fs_extra_1.writeFile)(sourceFullPath, "hello ${project.name}");
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "module-a",
                        type: "test",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        include: [],
                        configPath: (0, path_1.join)(pathFoo, "module-a.garden.yml"),
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {},
                        repositoryUrl: "file://" + tmpRepo.path + "#main",
                        generateFiles: [
                            {
                                sourcePath,
                                targetPath,
                                resolveTemplates: true,
                            },
                        ],
                    },
                ]);
                await (0, ext_source_util_1.addLinkedSources)({
                    garden,
                    sourceType: "module",
                    sources: [{ name: "module-a", path: tmpRepo.path }],
                });
                const module = await garden.resolveModule("module-a");
                (0, chai_1.expect)(module.path).to.equal(tmpRepo.path);
                const expectedTargetPath = (0, path_1.join)(module.path, targetPath);
                const contents = await (0, fs_extra_1.readFile)(expectedTargetPath);
                (0, chai_1.expect)(contents.toString()).to.equal("hello test");
            }
            finally {
                await (0, fs_extra_1.remove)(sourceFullPath);
                await tmpRepo.cleanup();
            }
        });
        it("resolves and writes a module file in a module from a remote source", async () => {
            const targetPath = "targetfile.log";
            const tmpRepo = await (0, fs_1.makeTempDir)({ git: true });
            const sourcePath = (0, string_1.randomString)(8) + ".log";
            const sourceFullPath = (0, path_1.join)(tmpRepo.path, sourcePath);
            try {
                await (0, fs_extra_1.writeFile)(sourceFullPath, "hello ${project.name}");
                const moduleConfig = {
                    kind: "Module",
                    name: "module-a",
                    type: "test",
                    generateFiles: [
                        {
                            sourcePath,
                            targetPath,
                        },
                    ],
                };
                await (0, fs_extra_1.writeFile)((0, path_1.join)(tmpRepo.path, "module-a.garden.yml"), (0, js_yaml_1.safeDump)(moduleConfig));
                await (0, util_1.exec)("git", ["add", "."], { cwd: tmpRepo.path });
                await (0, util_1.exec)("git", ["commit", "-m", "add module"], { cwd: tmpRepo.path });
                const garden = await (0, helpers_1.makeTestGarden)(pathFoo, {
                    noTempDir: true,
                    config: (0, helpers_1.createProjectConfig)({
                        name: "test",
                        path: pathFoo,
                        providers: [{ name: "test-plugin" }],
                        sources: [{ name: "remote-module", repositoryUrl: "file://" + tmpRepo.path + "#main" }],
                    }),
                });
                const module = await garden.resolveModule("module-a");
                // Make sure the resolved module path is in the .garden directory because it's in a remote source
                (0, chai_1.expect)(module.path.startsWith(garden.gardenDirPath)).to.be.true;
                const expectedTargetPath = (0, path_1.join)(module.path, targetPath);
                const contents = await (0, fs_extra_1.readFile)(expectedTargetPath);
                (0, chai_1.expect)(contents.toString()).to.equal("hello test");
            }
            finally {
                await (0, fs_extra_1.remove)(sourceFullPath);
                await tmpRepo.cleanup();
            }
        });
        it("resolves and writes a module file in a module from a linked remote source", async () => {
            const targetPath = "targetfile.log";
            const tmpRepo = await (0, fs_1.makeTempDir)({ git: true });
            const sourcePath = (0, string_1.randomString)(8) + ".log";
            const sourceFullPath = (0, path_1.join)(tmpRepo.path, sourcePath);
            try {
                await (0, fs_extra_1.writeFile)(sourceFullPath, "hello ${project.name}");
                const moduleConfig = {
                    kind: "Module",
                    name: "module-a",
                    type: "test",
                    generateFiles: [
                        {
                            sourcePath,
                            targetPath,
                        },
                    ],
                };
                await (0, fs_extra_1.writeFile)((0, path_1.join)(tmpRepo.path, "module-a.garden.yml"), (0, js_yaml_1.safeDump)(moduleConfig));
                await (0, util_1.exec)("git", ["add", "."], { cwd: tmpRepo.path });
                await (0, util_1.exec)("git", ["commit", "-m", "add module"], { cwd: tmpRepo.path });
                const garden = await (0, helpers_1.makeTestGarden)(pathFoo, {
                    noTempDir: true,
                    config: (0, helpers_1.createProjectConfig)({
                        name: "test",
                        path: pathFoo,
                        providers: [{ name: "test-plugin" }],
                        sources: [{ name: "remote-module", repositoryUrl: "file://" + tmpRepo.path + "#main" }],
                    }),
                });
                await (0, ext_source_util_1.addLinkedSources)({
                    garden,
                    sourceType: "project",
                    sources: [{ name: "remote-module", path: tmpRepo.path }],
                });
                const module = await garden.resolveModule("module-a");
                (0, chai_1.expect)(module.path).to.equal(tmpRepo.path);
                const expectedTargetPath = (0, path_1.join)(module.path, targetPath);
                const contents = await (0, fs_extra_1.readFile)(expectedTargetPath);
                (0, chai_1.expect)(contents.toString()).to.equal("hello test");
            }
            finally {
                await (0, fs_extra_1.remove)(sourceFullPath);
                await tmpRepo.cleanup();
            }
        });
        it("should throw if a module type is not recognized", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const config = (await garden.getRawModuleConfigs(["module-a"]))[0];
            config.type = "foo";
            await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                contains: [
                    "Failed resolving one or more modules",
                    "module-a: Unrecognized module type 'foo' (defined at module-a/garden.yml). Are you missing a provider configuration?",
                ],
            });
        });
        it("should throw if the module config doesn't match the declared schema", async () => {
            const foo = (0, plugin_1.createGardenPlugin)({
                name: "foo",
                createModuleTypes: [
                    {
                        name: "foo",
                        docs: "foo",
                        schema: common_1.joi.object().keys({ foo: common_1.joi.string() }),
                        needsBuild: true,
                        handlers: {},
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [foo],
                config: projectConfigFoo,
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "foo",
                    type: "foo",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: { bla: "fla" },
                },
            ]);
            await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                contains: [
                    "Failed resolving one or more modules",
                    "foo: Error validating Module 'foo': key \"bla\" is not allowed at path [bla]",
                ],
            });
        });
        it("should throw if the module outputs don't match the declared outputs schema", async () => {
            const foo = (0, plugin_1.createGardenPlugin)({
                name: "foo",
                createModuleTypes: [
                    {
                        name: "foo",
                        docs: "foo",
                        moduleOutputsSchema: common_1.joi.object().keys({ foo: common_1.joi.string() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                            getModuleOutputs: async () => ({
                                outputs: { foo: 123 },
                            }),
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [foo],
                config: projectConfigFoo,
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "foo",
                    type: "foo",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
            ]);
            await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                contains: [
                    "Failed resolving one or more modules:",
                    "foo: Error validating outputs for module 'foo': key .foo must be a string",
                ],
            });
        });
    });
    describe("getConfigGraph", () => {
        it("should throw an error if modules have circular build dependencies", async () => {
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                config: (0, helpers_1.createProjectConfig)({
                    name: "test",
                    path: pathFoo,
                    providers: [],
                }),
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "exec",
                    allowPublish: false,
                    build: { dependencies: [{ name: "module-b", copy: [] }] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-b",
                    type: "exec",
                    allowPublish: false,
                    build: { dependencies: [{ name: "module-a", copy: [] }] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
            ]);
            await (0, helpers_1.expectError)(() => garden.getConfigGraph({ log: garden.log, emit: false }), {
                contains: ["Detected circular dependencies between module configurations:", "module-a <- module-b <- module-a"],
            });
        });
        it("fully resolves module template inputs before resolving templated modules", async () => {
            const root = (0, helpers_1.getDataDir)("test-projects", "module-templates");
            const garden = await (0, helpers_1.makeTestGarden)(root);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const moduleA = graph.getModule("foo-test-a");
            (0, chai_1.expect)(moduleA.spec.build.command).to.eql(["testValue"]);
        });
        it("throws if templated module inputs don't match the template inputs schema", async () => {
            const root = (0, helpers_1.getDataDir)("test-projects", "module-templates");
            const garden = await (0, helpers_1.makeTestGarden)(root);
            await garden.scanAndAddConfigs();
            const moduleA = garden["moduleConfigs"]["foo-test-a"];
            moduleA.inputs = { name: "test", value: 123 };
            await (0, helpers_1.expectError)(() => garden.getConfigGraph({ log: garden.log, emit: false }), {
                contains: [
                    "Failed resolving one or more modules",
                    "foo-test-a: Error validating inputs for module foo-test-a (modules.garden.yml)",
                    "value at ./value must be string",
                ],
            });
        });
    });
    context("module type has a base", () => {
        it("should throw if the configure handler output doesn't match the module type's base schema", async () => {
            const base = (0, plugin_1.createGardenPlugin)({
                name: "base",
                createModuleTypes: [
                    {
                        name: "base",
                        docs: "base",
                        schema: common_1.joi.object().keys({ base: common_1.joi.string().required() }),
                        needsBuild: true,
                        handlers: {},
                    },
                ],
            });
            const foo = (0, plugin_1.createGardenPlugin)({
                name: "foo",
                dependencies: [{ name: "base" }],
                createModuleTypes: [
                    {
                        name: "foo",
                        base: "base",
                        docs: "foo",
                        schema: common_1.joi.object().keys({ foo: common_1.joi.string().required() }),
                        needsBuild: true,
                        handlers: {
                            configure: async ({ moduleConfig }) => ({
                                moduleConfig: {
                                    ...moduleConfig,
                                    spec: {
                                        ...moduleConfig.spec,
                                        foo: "bar",
                                    },
                                },
                            }),
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [base, foo],
                config: {
                    ...projectConfigFoo,
                    providers: [...projectConfigFoo.providers, { name: "base" }],
                },
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "foo",
                    type: "foo",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: { foo: "bar" },
                },
            ]);
            await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                contains: [
                    "Failed resolving one or more modules:",
                    "foo: Error validating configuration for module 'foo' (base schema from 'base' plugin): key .base is required",
                ],
            });
        });
        it("should throw if the module outputs don't match the base's declared outputs schema", async () => {
            const base = (0, plugin_1.createGardenPlugin)({
                name: "base",
                createModuleTypes: [
                    {
                        name: "base",
                        docs: "base",
                        moduleOutputsSchema: common_1.joi.object().keys({ foo: common_1.joi.string() }),
                        needsBuild: true,
                        handlers: {
                            convert: exec_1.convertExecModule,
                        },
                    },
                ],
            });
            const foo = (0, plugin_1.createGardenPlugin)({
                name: "foo",
                dependencies: [{ name: "base" }],
                createModuleTypes: [
                    {
                        name: "foo",
                        base: "base",
                        docs: "foo",
                        needsBuild: true,
                        handlers: {
                            getModuleOutputs: async () => ({
                                outputs: { foo: 123 },
                            }),
                        },
                    },
                ],
            });
            const garden = await helpers_1.TestGarden.factory(pathFoo, {
                plugins: [base, foo],
                config: {
                    ...projectConfigFoo,
                    providers: [...projectConfigFoo.providers, { name: "base" }],
                },
            });
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "foo",
                    type: "foo",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: pathFoo,
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
            ]);
            await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                contains: [
                    "Failed resolving one or more modules:",
                    "foo: Error validating outputs for module 'foo' (base schema from 'base' plugin): key .foo must be a string",
                ],
            });
        });
        context("module type's base has a base", () => {
            it("should throw if the configure handler output doesn't match the schema of the base's base", async () => {
                const baseA = (0, plugin_1.createGardenPlugin)({
                    name: "base-a",
                    createModuleTypes: [
                        {
                            name: "base-a",
                            docs: "base-a",
                            schema: common_1.joi.object().keys({ base: common_1.joi.string().required() }),
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const baseB = (0, plugin_1.createGardenPlugin)({
                    name: "base-b",
                    dependencies: [{ name: "base-a" }],
                    createModuleTypes: [
                        {
                            name: "base-b",
                            docs: "base-b",
                            base: "base-a",
                            schema: common_1.joi.object().keys({ foo: common_1.joi.string() }),
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    dependencies: [{ name: "base-b" }],
                    createModuleTypes: [
                        {
                            name: "foo",
                            base: "base-b",
                            docs: "foo",
                            schema: common_1.joi.object().keys({ foo: common_1.joi.string().required() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => ({
                                    moduleConfig: {
                                        ...moduleConfig,
                                        spec: {
                                            ...moduleConfig.spec,
                                            foo: "bar",
                                        },
                                    },
                                }),
                            },
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [baseA, baseB, foo],
                    config: {
                        ...projectConfigFoo,
                        providers: [...projectConfigFoo.providers, { name: "base-a" }, { name: "base-b" }],
                    },
                });
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "foo",
                        type: "foo",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: { foo: "bar" },
                    },
                ]);
                await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                    contains: [
                        "Failed resolving one or more modules:",
                        "foo: Error validating configuration for module 'foo' (base schema from 'base-a' plugin): key .base is required",
                    ],
                });
            });
            it("should throw if the module outputs don't match the base's base's declared outputs schema", async () => {
                const baseA = (0, plugin_1.createGardenPlugin)({
                    name: "base-a",
                    createModuleTypes: [
                        {
                            name: "base-a",
                            docs: "base-a",
                            moduleOutputsSchema: common_1.joi.object().keys({ foo: common_1.joi.string() }),
                            needsBuild: true,
                            handlers: {},
                        },
                    ],
                });
                const baseB = (0, plugin_1.createGardenPlugin)({
                    name: "base-b",
                    dependencies: [{ name: "base-a" }],
                    createModuleTypes: [
                        {
                            name: "base-b",
                            docs: "base-b",
                            base: "base-a",
                            needsBuild: true,
                            handlers: {
                                convert: exec_1.convertExecModule,
                            },
                        },
                    ],
                });
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    dependencies: [{ name: "base-b" }],
                    createModuleTypes: [
                        {
                            name: "foo",
                            base: "base-b",
                            docs: "foo",
                            needsBuild: true,
                            handlers: {
                                getModuleOutputs: async () => ({
                                    outputs: { foo: 123 },
                                }),
                            },
                        },
                    ],
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [baseA, baseB, foo],
                    config: {
                        ...projectConfigFoo,
                        providers: [...projectConfigFoo.providers, { name: "base-a" }, { name: "base-b" }],
                    },
                });
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "foo",
                        type: "foo",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: pathFoo,
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {},
                    },
                ]);
                await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                    contains: [
                        "Failed resolving one or more modules:",
                        "foo: Error validating outputs for module 'foo' (base schema from 'base-a' plugin): key .foo must be a string",
                    ],
                });
            });
        });
        context("when a provider has an augmentGraph handler", () => {
            it("should correctly add and resolve modules from the handler", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object().keys({ foo: common_1.joi.string(), build: (0, module_2.baseBuildSpecSchema)() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => {
                                    return { moduleConfig };
                                },
                            },
                        },
                    ],
                    handlers: {
                    // TODO-G2 check if this still makes sense
                    // augmentGraph: async () => {
                    //   return {
                    //     addModules: [
                    //       {
                    //         kind: "Module",
                    //         type: "foo",
                    //         name: "foo",
                    //         foo: "bar",
                    //         path: "/tmp",
                    //       },
                    //     ],
                    //   }
                    // },
                    },
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo],
                    config: projectConfigFoo,
                });
                const module = (0, util_1.findByName)(await garden.resolveModules({ log: garden.log }), "foo");
                (0, chai_1.expect)(module.type).to.equal("foo");
                (0, chai_1.expect)(module.spec.foo).to.eql("bar");
                (0, chai_1.expect)(module.path).to.eql("/tmp");
            });
            it("should add modules before applying dependencies", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object().keys({ foo: common_1.joi.string(), build: (0, module_2.baseBuildSpecSchema)() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => {
                                    moduleConfig.include = [];
                                    moduleConfig.serviceConfigs = [
                                        {
                                            name: moduleConfig.name,
                                            dependencies: [],
                                            disabled: false,
                                            spec: {},
                                        },
                                    ];
                                    return { moduleConfig };
                                },
                            },
                        },
                    ],
                    handlers: {
                    // TODO-G2 check if this still makes sense
                    // augmentGraph: async () => {
                    //   return {
                    //     addModules: [
                    //       {
                    //         kind: "Module",
                    //         type: "foo",
                    //         name: "foo",
                    //         foo: "bar",
                    //         path: "/tmp",
                    //       },
                    //       {
                    //         kind: "Module",
                    //         type: "foo",
                    //         name: "bar",
                    //         foo: "bar",
                    //         path: "/tmp",
                    //       },
                    //     ],
                    //     // This shouldn't work unless build deps are set in right order
                    //     addRuntimeDependencies: [{ by: "foo", on: "bar" }],
                    //   }
                    // },
                    },
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo],
                    config: projectConfigFoo,
                });
                const module = (0, util_1.findByName)(await garden.resolveModules({ log: garden.log }), "foo");
                (0, chai_1.expect)(module).to.exist;
                (0, chai_1.expect)(module.serviceConfigs).to.eql([
                    {
                        name: "foo",
                        dependencies: ["bar"],
                        disabled: false,
                        spec: {},
                    },
                ]);
                (0, chai_1.expect)(module.spec).to.eql({ foo: "bar", build: { dependencies: [], timeout: module_2.defaultBuildTimeout } });
            });
            it("should apply returned runtime dependency relationships", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object().keys({ foo: common_1.joi.string(), build: (0, module_2.baseBuildSpecSchema)() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => {
                                    moduleConfig.include = [];
                                    moduleConfig.serviceConfigs = [
                                        {
                                            name: moduleConfig.name,
                                            dependencies: [],
                                            disabled: false,
                                            spec: {},
                                        },
                                    ];
                                    return { moduleConfig };
                                },
                            },
                        },
                    ],
                    handlers: {
                    // TODO-G2 check if this still makes sense
                    // augmentGraph: async () => {
                    //   return {
                    //     addRuntimeDependencies: [{ by: "foo", on: "bar" }],
                    //   }
                    // },
                    },
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo],
                    config: projectConfigFoo,
                });
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "foo",
                        type: "foo",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: "/tmp",
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {},
                    },
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "bar",
                        type: "foo",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: "/tmp",
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {},
                    },
                ]);
                const module = (0, util_1.findByName)(await garden.resolveModules({ log: garden.log }), "foo");
                (0, chai_1.expect)(module).to.exist;
                (0, chai_1.expect)(module.serviceConfigs).to.eql([
                    {
                        name: "foo",
                        dependencies: ["bar"],
                        disabled: false,
                        spec: {},
                    },
                ]);
            });
            it("should throw if a runtime dependency's `by` reference can't be resolved", async () => {
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object().keys({ foo: common_1.joi.string(), build: (0, module_2.baseBuildSpecSchema)() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => {
                                    moduleConfig.serviceConfigs = [
                                        {
                                            name: moduleConfig.name,
                                            dependencies: [],
                                            disabled: false,
                                            spec: {},
                                        },
                                    ];
                                    return { moduleConfig };
                                },
                            },
                        },
                    ],
                    handlers: {
                    // TODO-G2 check if this still makes sense
                    // augmentGraph: async () => {
                    //   return {
                    //     addRuntimeDependencies: [{ by: "bar", on: "foo" }],
                    //   }
                    // },
                    },
                });
                const garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo],
                    config: projectConfigFoo,
                });
                garden.setActionConfigs([
                    {
                        apiVersion: constants_1.DEFAULT_API_VERSION,
                        name: "foo",
                        type: "foo",
                        allowPublish: false,
                        build: { dependencies: [] },
                        disabled: false,
                        path: "/tmp",
                        serviceConfigs: [],
                        taskConfigs: [],
                        testConfigs: [],
                        spec: {},
                    },
                ]);
                await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                    contains: [
                        "Provider 'foo' added a runtime dependency by 'bar' on 'foo'",
                        "but service or task 'bar' could not be found.",
                    ],
                });
            });
            it("should process augmentGraph handlers in dependency order", async () => {
                // Ensure modules added by the dependency are in place before adding dependencies in dependant.
                const foo = (0, plugin_1.createGardenPlugin)({
                    name: "foo",
                    dependencies: [],
                    createModuleTypes: [
                        {
                            name: "foo",
                            docs: "foo",
                            schema: common_1.joi.object().keys({ foo: common_1.joi.string(), build: (0, module_2.baseBuildSpecSchema)() }),
                            needsBuild: true,
                            handlers: {
                                configure: async ({ moduleConfig }) => {
                                    moduleConfig.serviceConfigs = [
                                        {
                                            name: moduleConfig.name,
                                            disabled: false,
                                            dependencies: [],
                                            spec: {},
                                        },
                                    ];
                                    return { moduleConfig };
                                },
                            },
                        },
                    ],
                    handlers: {
                    // TODO-G2 check if this still makes sense
                    // augmentGraph: async () => {
                    //   return {
                    //     addModules: [
                    //       {
                    //         kind: "Module",
                    //         type: "foo",
                    //         name: "foo",
                    //         foo: "bar",
                    //         path: "/tmp",
                    //       },
                    //       {
                    //         kind: "Module",
                    //         type: "foo",
                    //         name: "bar",
                    //         path: "/tmp",
                    //       },
                    //     ],
                    //   }
                    // },
                    },
                });
                const bar = (0, plugin_1.createGardenPlugin)({
                    name: "bar",
                    dependencies: [{ name: "foo" }],
                    handlers: {
                    // TODO-G2 check if this still makes sense
                    // augmentGraph: async () => {
                    //   return {
                    //     // This doesn't work unless providers are processed in right order
                    //     addRuntimeDependencies: [{ by: "foo", on: "bar" }],
                    //   }
                    // },
                    },
                });
                const config = {
                    ...projectConfigFoo,
                    providers: [...projectConfigFoo.providers, { name: "bar" }],
                };
                // First test correct order
                let garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo, bar],
                    config,
                });
                const fooModule = (0, util_1.findByName)(await garden.resolveModules({ log: garden.log }), "foo");
                (0, chai_1.expect)(fooModule).to.exist;
                (0, chai_1.expect)(fooModule.serviceConfigs[0].dependencies).to.eql(["bar"]);
                // Then test wrong order and make sure it throws
                foo.dependencies = [{ name: "bar" }];
                bar.dependencies = [];
                garden = await helpers_1.TestGarden.factory(pathFoo, {
                    plugins: [foo, bar],
                    config,
                });
                await (0, helpers_1.expectError)(() => garden.resolveModules({ log: garden.log }), {
                    contains: "Provider 'bar' added a runtime dependency by 'foo' on 'bar' but service or task 'foo' could not be found.",
                });
            });
        });
    });
    describe("resolveModuleVersion", () => {
        beforeEach(() => testdouble_1.default.reset());
        it("should return result from cache if available", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const config = await garden.resolveModule("module-a");
            const version = {
                versionString: "banana",
                dependencyVersions: {},
                files: [],
            };
            garden.cache.set(garden.log, ["moduleVersions", config.name], version, (0, module_1.getModuleCacheContext)(config));
            const result = await garden.resolveModuleVersion(garden.log, config, []);
            (0, chai_1.expect)(result).to.eql(version);
        });
        it("should otherwise calculate fresh version using VCS handler", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            await garden.scanAndAddConfigs();
            garden.cache.delete(garden.log, ["moduleVersions", "module-b"]);
            const config = await garden.resolveModule("module-b");
            garden.vcs.resolveTreeVersion = async () => ({
                contentHash: "banana",
                files: [],
            });
            const result = await garden.resolveModuleVersion(garden.log, config, []);
            (0, chai_1.expect)(result.versionString).not.to.eql(config.version.versionString, "should be different from first versionstring as svc returned different version");
        });
        it("should ignore cache if force=true", async () => {
            const garden = await (0, helpers_1.makeTestGardenA)();
            const config = await garden.resolveModule("module-a");
            const version = {
                versionString: "banana",
                dependencyVersions: {},
                files: [],
            };
            garden.cache.set(garden.log, ["moduleVersions", config.name], version, (0, module_1.getModuleCacheContext)(config));
            const result = await garden.resolveModuleVersion(garden.log, config, [], true);
            (0, chai_1.expect)(result).to.not.eql(version);
        });
        context("usage of TestVcsHandler", async () => {
            let handlerA;
            let gardenA;
            // note: module-a has a version file with this content
            const treeVersionA = {
                contentHash: "1234567890",
                files: [],
            };
            beforeEach(async () => {
                gardenA = await (0, helpers_1.makeTestGardenA)();
                handlerA = new vcs_2.TestVcsHandler({
                    garden: gardenA,
                    projectRoot: gardenA.projectRoot,
                    gardenDirPath: (0, path_1.join)(gardenA.projectRoot, ".garden"),
                    ignoreFile: fs_1.defaultDotIgnoreFile,
                    cache: gardenA.cache,
                });
            });
            it("should return module version if there are no dependencies", async () => {
                const module = await gardenA.resolveModule("module-a");
                gardenA.vcs = handlerA;
                const result = await gardenA.resolveModuleVersion(gardenA.log, module, []);
                (0, chai_1.expect)(result).to.eql({
                    versionString: (0, vcs_1.getModuleVersionString)(module, { ...treeVersionA, name: "module-a" }, []),
                    dependencyVersions: {},
                    files: [],
                });
            });
            it("should hash together the version of the module and all dependencies", async () => {
                const moduleConfigs = await gardenA.resolveModules({
                    log: gardenA.log,
                });
                gardenA.vcs = handlerA;
                const moduleA = (0, util_1.findByName)(moduleConfigs, "module-a");
                const moduleB = (0, util_1.findByName)(moduleConfigs, "module-b");
                const moduleC = (0, util_1.findByName)(moduleConfigs, "module-c");
                gardenA.clearCaches();
                const moduleVersionA = {
                    versionString: treeVersionA.contentHash,
                    files: [],
                    dependencyVersions: {},
                };
                moduleA.version = moduleVersionA;
                handlerA.setTestTreeVersion(moduleA.path, treeVersionA);
                const versionStringB = "qwerty";
                const moduleVersionB = {
                    versionString: versionStringB,
                    files: [],
                    dependencyVersions: { "module-a": moduleVersionA.versionString },
                };
                moduleB.version = moduleVersionB;
                const treeVersionB = { contentHash: versionStringB, files: [] };
                handlerA.setTestTreeVersion(moduleB.path, treeVersionB);
                const versionStringC = "asdfgh";
                const treeVersionC = { contentHash: versionStringC, files: [] };
                handlerA.setTestTreeVersion(moduleC.path, treeVersionC);
                const gardenResolvedModuleVersion = await gardenA.resolveModuleVersion(gardenA.log, moduleC, [moduleA, moduleB]);
                const manuallyResolvedModuleVersion = {
                    versionString: (0, vcs_1.getModuleVersionString)(moduleC, { ...treeVersionC, name: "module-c" }, [
                        { ...moduleVersionA, name: "module-a" },
                        { ...moduleVersionB, name: "module-b" },
                    ]),
                    dependencyVersions: {
                        "module-a": moduleVersionA.versionString,
                        "module-b": moduleVersionB.versionString,
                    },
                    files: [],
                };
                (0, chai_1.expect)(gardenResolvedModuleVersion).to.eql(manuallyResolvedModuleVersion);
            });
            it("should not include module's garden.yml in version file list", async () => {
                const moduleConfig = await gardenA.resolveModule("module-a");
                const version = await gardenA.resolveModuleVersion(gardenA.log, moduleConfig, []);
                (0, chai_1.expect)(version.files).to.not.include(moduleConfig.configPath);
            });
            it("should be affected by changes to the module's config", async () => {
                const moduleConfig = await gardenA.resolveModule("module-a");
                const version1 = await gardenA.resolveModuleVersion(gardenA.log, moduleConfig, []);
                moduleConfig.name = "foo";
                const version2 = await gardenA.resolveModuleVersion(gardenA.log, moduleConfig, []);
                (0, chai_1.expect)(version1).to.not.eql(version2);
            });
            it("should not be affected by unimportant changes to the module's garden.yml", async () => {
                const projectRoot = (0, helpers_1.getDataDir)("test-projects", "multiple-module-config");
                const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
                const moduleConfigA1 = await garden.resolveModule("module-a1");
                const configPath = moduleConfigA1.configPath;
                const orgConfig = await (0, fs_extra_1.readFile)(configPath);
                try {
                    const version1 = await gardenA.resolveModuleVersion(garden.log, moduleConfigA1, []);
                    await (0, fs_extra_1.writeFile)(configPath, orgConfig + "\n---");
                    const version2 = await gardenA.resolveModuleVersion(garden.log, moduleConfigA1, []);
                    (0, chai_1.expect)(version1).to.eql(version2);
                }
                finally {
                    await (0, fs_extra_1.writeFile)(configPath, orgConfig);
                }
            });
        });
        context("test against fixed version hashes", async () => {
            const moduleAVersionString = "v-6f85bdd407";
            const moduleBVersionString = "v-6e138410f5";
            const moduleCVersionString = "v-ea24adfffc";
            it("should return the same module versions between runtimes", async () => {
                const projectRoot = (0, helpers_1.getDataDir)("test-projects", "fixed-version-hashes-1");
                process.env.MODULE_A_TEST_ENV_VAR = "foo";
                const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
                const graph = await garden.getConfigGraph({ log: garden.log, emit: false, noCache: true });
                const moduleA = graph.getModule("module-a");
                const moduleB = graph.getModule("module-b");
                const moduleC = graph.getModule("module-c");
                (0, chai_1.expect)(moduleA.version.versionString).to.equal(moduleAVersionString);
                (0, chai_1.expect)(moduleB.version.versionString).to.equal(moduleBVersionString);
                (0, chai_1.expect)(moduleC.version.versionString).to.equal(moduleCVersionString);
                delete process.env.TEST_ENV_VAR;
            });
            it("should return the same module versions for identical modules in different projects", async () => {
                const projectRoot = (0, helpers_1.getDataDir)("test-projects", "fixed-version-hashes-2");
                process.env.MODULE_A_TEST_ENV_VAR = "foo";
                const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
                const graph = await garden.getConfigGraph({ log: garden.log, emit: false, noCache: true });
                const moduleA = graph.getModule("module-a");
                const moduleB = graph.getModule("module-b");
                const moduleC = graph.getModule("module-c");
                (0, chai_1.expect)(moduleA.version.versionString).to.equal(moduleAVersionString);
                (0, chai_1.expect)(moduleB.version.versionString).to.equal(moduleBVersionString);
                (0, chai_1.expect)(moduleC.version.versionString).to.equal(moduleCVersionString);
                delete process.env.MODULE_A_TEST_ENV_VAR;
            });
            it("should not return the same module versions if templated variables change", async () => {
                const projectRoot = (0, helpers_1.getDataDir)("test-projects", "fixed-version-hashes-1");
                process.env.MODULE_A_TEST_ENV_VAR = "bar";
                const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
                const graph = await garden.getConfigGraph({ log: garden.log, emit: false, noCache: true });
                const moduleA = graph.getModule("module-a");
                const moduleB = graph.getModule("module-b");
                const moduleC = graph.getModule("module-c");
                (0, chai_1.expect)(moduleA.version.versionString).to.not.equal(moduleAVersionString);
                (0, chai_1.expect)(moduleB.version.versionString).to.not.equal(moduleBVersionString); // B depends on A so it changes as well
                (0, chai_1.expect)(moduleC.version.versionString).to.not.equal(moduleCVersionString); // C depends on B so it changes as well
                delete process.env.MODULE_A_TEST_ENV_VAR;
            });
        });
    });
    describe("loadExtSourcePath", () => {
        let garden;
        let linkedSources;
        afterEach(async () => {
            await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
        });
        context("external project sources", () => {
            before(async () => {
                garden = await (0, helpers_1.makeExtProjectSourcesGarden)();
                linkedSources = await (0, ext_source_util_1.getLinkedSources)(garden, "module");
            });
            it("should return the path to the project source if source type is project", async () => {
                const path = await garden.loadExtSourcePath({
                    linkedSources,
                    repositoryUrl: helpers_1.testGitUrl,
                    name: "source-a",
                    sourceType: "project",
                });
                (0, chai_1.expect)(path).to.equal((0, path_1.join)(garden.projectRoot, ".garden", "sources", "project", `source-a--${helpers_1.testGitUrlHash}`));
            });
            it("should return the local path of the project source if linked", async () => {
                const localProjectSourceDir = (0, helpers_1.getDataDir)("test-project-local-project-sources");
                const linkedSourcePath = (0, path_1.join)(localProjectSourceDir, "source-a");
                const linked = [
                    {
                        name: "source-a",
                        path: linkedSourcePath,
                    },
                ];
                const path = await garden.loadExtSourcePath({
                    name: "source-a",
                    linkedSources: linked,
                    repositoryUrl: helpers_1.testGitUrl,
                    sourceType: "project",
                });
                (0, chai_1.expect)(path).to.equal(linkedSourcePath);
            });
        });
        context("external module sources", () => {
            before(async () => {
                garden = await (0, helpers_1.makeExtModuleSourcesGarden)();
                linkedSources = await (0, ext_source_util_1.getLinkedSources)(garden, "module");
            });
            it("should return the path to the module source if source type is module", async () => {
                const path = await garden.loadExtSourcePath({
                    linkedSources,
                    repositoryUrl: helpers_1.testGitUrl,
                    name: "module-a",
                    sourceType: "module",
                });
                (0, chai_1.expect)(path).to.equal((0, path_1.join)(garden.projectRoot, ".garden", "sources", "module", `module-a--${helpers_1.testGitUrlHash}`));
            });
            it("should return the local path of the module source if linked", async () => {
                const localModuleSourceDir = (0, helpers_1.getDataDir)("test-project-local-module-sources");
                const linkedModulePath = (0, path_1.join)(localModuleSourceDir, "module-a");
                const linked = [
                    {
                        name: "module-a",
                        path: linkedModulePath,
                    },
                ];
                const path = await garden.loadExtSourcePath({
                    name: "module-a",
                    linkedSources: linked,
                    repositoryUrl: helpers_1.testGitUrl,
                    sourceType: "module",
                });
                (0, chai_1.expect)(path).to.equal(linkedModulePath);
            });
        });
    });
    describe("warnings", () => {
        let garden;
        let key;
        beforeEach(async () => {
            garden = await (0, helpers_1.makeTestGardenA)();
            key = (0, string_1.randomString)();
        });
        describe("hideWarning", () => {
            it("should flag a warning key as hidden", async () => {
                await garden.hideWarning(key);
                const record = await garden.configStore.get("warnings", key);
                (0, chai_1.expect)(record.hidden).to.be.true;
            });
            it("should be a no-op if a key is already hidden", async () => {
                await garden.hideWarning(key);
                await garden.hideWarning(key);
            });
        });
        describe("emitWarning", () => {
            it("should log a warning if the key has not been hidden", async () => {
                const log = garden.log.placeholder();
                const message = "Oh noes!";
                await garden.emitWarning({ key, log, message });
                const logs = (0, testing_1.getLogMessages)(log);
                (0, chai_1.expect)(logs.length).to.equal(1);
                (0, chai_1.expect)(logs[0]).to.equal(message + `\nRun garden util hide-warning ${key} to disable this warning.`);
            });
            it("should not log a warning if the key has been hidden", async () => {
                const log = garden.log.placeholder();
                const message = "Oh noes!";
                await garden.hideWarning(key);
                await garden.emitWarning({ key, log, message });
                const logs = (0, testing_1.getLogMessages)(log);
                (0, chai_1.expect)(logs.length).to.equal(0);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FyZGVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2FyZGVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQTZCO0FBQzdCLDREQUEyQjtBQUMzQiw4REFBNkI7QUFDN0IsK0JBQW9DO0FBQ3BDLGdEQUE0QztBQUM1QywyQ0FpQnNCO0FBQ3RCLGlEQUFrRjtBQUVsRiw4Q0FBeUY7QUFDekYsc0RBQWlFO0FBQ2pFLHVEQUFxRztBQUVyRyx5REFBNkU7QUFDN0UsdURBS21DO0FBQ25DLHNEQUE0RDtBQUM1RCwyREFBdUU7QUFDdkUsbUNBQW9EO0FBQ3BELHVEQUFnRDtBQUNoRCw2Q0FBd0U7QUFDeEUsdUNBQTBGO0FBQzFGLHFEQUErRDtBQUMvRCx1RUFBc0Y7QUFDdEYscUNBQWtDO0FBQ2xDLG1DQUEwQztBQUUxQyx5REFBa0U7QUFDbEUsdURBQTBEO0FBRTFELG9FQUFvRTtBQUVwRSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtJQUN0QixJQUFJLE1BQTJCLENBQUE7SUFDL0IsSUFBSSxPQUFlLENBQUE7SUFDbkIsSUFBSSxnQkFBK0IsQ0FBQTtJQUVuQyxNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBQSxnQkFBVyxFQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7UUFDekMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUE7UUFFckIsZ0JBQWdCLEdBQUcsSUFBQSw2QkFBbUIsRUFBQztZQUNyQyxJQUFJLEVBQUUsTUFBTTtZQUNaLElBQUksRUFBRSxPQUFPO1lBQ2IsU0FBUyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7U0FDN0IsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDZixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVB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