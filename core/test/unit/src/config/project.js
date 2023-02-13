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
const os_1 = require("os");
const chai_1 = require("chai");
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const project_1 = require("../../../../src/config/project");
const helpers_1 = require("../../../helpers");
const fs_extra_1 = require("fs-extra");
const string_1 = require("../../../../src/util/string");
const path_1 = require("path");
const enterpriseDomain = "https://garden.mydomain.com";
const commandInfo = { name: "test", args: {}, opts: {} };
const vcsInfo = {
    branch: "main",
    commitHash: "abcdefgh",
    originUrl: "https://example.com/foo",
};
describe("resolveProjectConfig", () => {
    it("should pass through a canonical project config", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            outputs: [],
            providers: [{ name: "some-provider", dependencies: [] }],
        });
        (0, chai_1.expect)((0, project_1.resolveProjectConfig)({
            defaultName: "default",
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            ...config,
            dotIgnoreFiles: [],
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {},
                },
            ],
            sources: [],
            varfile: project_1.defaultVarfilePath,
        });
    });
    it("should resolve template strings on fields other than environments, providers and remote sources", async () => {
        const repositoryUrl = "git://github.com/foo/bar.git#boo";
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        envVar: "${local.env.TEST_ENV_VAR}",
                        secretVar: "${secrets.foo}",
                    },
                },
            ],
            providers: [{ name: "some-provider", dependencies: [] }],
            sources: [
                {
                    name: "${local.env.TEST_ENV_VAR}",
                    repositoryUrl,
                },
            ],
            variables: {
                platform: "${local.platform}",
                secret: "${secrets.foo}",
                projectPath: "${local.projectPath}",
                envVar: "${local.env.TEST_ENV_VAR}",
            },
        });
        process.env.TEST_ENV_VAR = "foo";
        (0, chai_1.expect)((0, project_1.resolveProjectConfig)({
            defaultName: project_1.defaultEnvironment,
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: { foo: "banana" },
            commandInfo,
        })).to.eql({
            ...config,
            dotIgnoreFiles: [],
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        envVar: "${local.env.TEST_ENV_VAR}",
                        secretVar: "${secrets.foo}",
                    },
                },
            ],
            outputs: [],
            sources: [
                {
                    name: "${local.env.TEST_ENV_VAR}",
                    repositoryUrl,
                },
            ],
            varfile: project_1.defaultVarfilePath,
            variables: {
                platform: (0, os_1.platform)(),
                secret: "banana",
                projectPath: config.path,
                envVar: "foo",
            },
        });
        delete process.env.TEST_ENV_VAR;
    });
    it("should pass through templated fields on provider configs", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        envVar: "foo",
                    },
                },
            ],
            providers: [
                {
                    name: "provider-a",
                    someKey: "${local.env.TEST_ENV_VAR_A}",
                },
                {
                    name: "provider-b",
                    environments: ["default"],
                    someKey: "${local.env.TEST_ENV_VAR_B}",
                },
            ],
        });
        process.env.TEST_ENV_VAR_A = "foo";
        process.env.TEST_ENV_VAR_B = "boo";
        (0, chai_1.expect)((0, project_1.resolveProjectConfig)({
            defaultName: project_1.defaultEnvironment,
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            ...config,
            dotIgnoreFiles: [],
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        envVar: "foo",
                    },
                },
            ],
            outputs: [],
            providers: [
                {
                    name: "provider-a",
                    dependencies: [],
                    someKey: "${local.env.TEST_ENV_VAR_A}",
                },
                {
                    name: "provider-b",
                    dependencies: [],
                    environments: ["default"],
                    someKey: "${local.env.TEST_ENV_VAR_B}",
                },
            ],
            sources: [],
            varfile: project_1.defaultVarfilePath,
        });
        delete process.env.TEST_ENV_VAR_A;
        delete process.env.TEST_ENV_VAR_B;
    });
    it("should pass through templated fields on environment configs", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        envVar: "${var.foo}",
                    },
                },
            ],
        });
        const result = (0, project_1.resolveProjectConfig)({
            defaultName: project_1.defaultEnvironment,
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.environments[0].variables).to.eql(config.environments[0].variables);
    });
    it("should pass through templated fields on remote source configs", async () => {
        const repositoryUrl = "git://github.com/foo/bar.git#boo";
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            sources: [
                {
                    name: "${local.env.TEST_ENV_VAR}",
                    repositoryUrl,
                },
            ],
        });
        process.env.TEST_ENV_VAR = "foo";
        (0, chai_1.expect)((0, project_1.resolveProjectConfig)({
            defaultName: project_1.defaultEnvironment,
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            ...config,
            dotIgnoreFiles: [],
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {},
                },
            ],
            outputs: [],
            sources: [
                {
                    name: "${local.env.TEST_ENV_VAR}",
                    repositoryUrl,
                },
            ],
            varfile: project_1.defaultVarfilePath,
            variables: {},
        });
        delete process.env.TEST_ENV_VAR;
    });
    it("should set defaultEnvironment to first environment if not configured", async () => {
        const defaultName = "";
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            defaultEnvironment: defaultName,
            environments: [{ defaultNamespace: null, name: "first-env", variables: {} }],
            outputs: [],
            providers: [{ name: "some-provider", dependencies: [] }],
            variables: {},
        });
        (0, chai_1.expect)((0, project_1.resolveProjectConfig)({
            defaultName,
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            ...config,
            dotIgnoreFiles: [],
            defaultEnvironment: "first-env",
            environments: [{ defaultNamespace: null, name: "first-env", variables: {} }],
            sources: [],
            varfile: project_1.defaultVarfilePath,
        });
    });
    it("should populate default values in the schema", async () => {
        const defaultName = "";
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            defaultEnvironment: defaultName,
            environments: [{ defaultNamespace: null, name: "default", variables: {} }],
            outputs: [],
            providers: [{ name: "some-provider", dependencies: [] }],
            variables: {},
        });
        (0, chai_1.expect)((0, project_1.resolveProjectConfig)({
            defaultName,
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            ...config,
            dotIgnoreFiles: [],
            defaultEnvironment: "default",
            environments: [{ defaultNamespace: null, name: "default", variables: {} }],
            sources: [],
            varfile: project_1.defaultVarfilePath,
        });
    });
    it("should include providers in correct precedence order from all possible config keys", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        envVar: "foo",
                    },
                },
            ],
            outputs: [],
            providers: [
                {
                    name: "provider-a",
                },
                {
                    name: "provider-b",
                    environments: ["default"],
                },
                {
                    name: "provider-c",
                },
            ],
            variables: {},
        });
        (0, chai_1.expect)((0, project_1.resolveProjectConfig)({
            defaultName: project_1.defaultEnvironment,
            config,
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            ...config,
            dotIgnoreFiles: [],
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        envVar: "foo",
                    },
                },
            ],
            outputs: [],
            providers: [
                {
                    name: "provider-a",
                    dependencies: [],
                },
                {
                    name: "provider-b",
                    environments: ["default"],
                    dependencies: [],
                },
                {
                    name: "provider-c",
                    dependencies: [],
                },
            ],
            sources: [],
            varfile: project_1.defaultVarfilePath,
        });
    });
});
describe("pickEnvironment", () => {
    let tmpDir;
    let tmpPath;
    let artifactsPath;
    const username = "test";
    beforeEach(async () => {
        tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
        tmpPath = await (0, fs_extra_1.realpath)(tmpDir.path);
        artifactsPath = (0, path_1.join)(tmpPath, ".garden", "artifacts");
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    it("should throw if selected environment isn't configured", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
        });
        await (0, helpers_1.expectError)(() => (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "foo",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        }), "parameter");
    });
    it("should include fixed providers in output", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
        });
        (0, chai_1.expect)(await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            environmentName: "default",
            namespace: "default",
            providers: project_1.fixedPlugins.map((name) => ({ name })),
            production: false,
            variables: {},
        });
    });
    it("should remove null values in provider configs (as per the JSON Merge Patch spec)", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            providers: [
                { name: "container", newKey: "foo" },
                { name: "my-provider", a: "a" },
                { name: "my-provider", b: "b" },
                { name: "my-provider", a: null },
            ],
        });
        (0, chai_1.expect)(await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            environmentName: "default",
            namespace: "default",
            providers: [
                { name: "exec" },
                { name: "container", newKey: "foo" },
                { name: "templated" },
                { name: "my-provider", b: "b" },
            ],
            production: false,
            variables: {},
        });
    });
    it("should correctly merge project and environment variables", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        b: "env value B",
                        c: "env value C",
                        array: [{ envArrayKey: "env array value" }],
                        nested: {
                            nestedB: "nested env value B",
                            nestedC: "nested env value C",
                        },
                    },
                },
            ],
            providers: [],
            variables: {
                a: "project value A",
                b: "project value B",
                array: [{ projectArrayKey: "project array value" }],
                nested: {
                    nestedA: "nested project value A",
                    nestedB: "nested project value B",
                },
            },
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "project value A",
            b: "env value B",
            c: "env value C",
            array: [{ envArrayKey: "env array value", projectArrayKey: "project array value" }],
            nested: {
                nestedA: "nested project value A",
                nestedB: "nested env value B",
                nestedC: "nested env value C",
            },
        });
    });
    it("should load variables from default project varfile if it exists", async () => {
        const varfilePath = (0, path_1.resolve)(tmpPath, project_1.defaultVarfilePath);
        await (0, fs_extra_1.writeFile)(varfilePath, (0, string_1.dedent) `
      a=a
      b=b
    `);
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        b: "B",
                        c: "c",
                    },
                },
            ],
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "a",
            b: "B",
            c: "c",
        });
    });
    it("should load variables from default environment varfile if it exists", async () => {
        const varfilePath = (0, path_1.resolve)(tmpPath, (0, project_1.defaultEnvVarfilePath)("default"));
        await (0, fs_extra_1.writeFile)(varfilePath, (0, string_1.dedent) `
      b=B
      c=c
    `);
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {},
                },
            ],
            variables: {
                a: "a",
                b: "b",
            },
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "a",
            b: "B",
            c: "c",
        });
    });
    it("should load variables from custom project varfile if specified", async () => {
        const varfilePath = (0, path_1.resolve)(tmpPath, "foo.env");
        await (0, fs_extra_1.writeFile)(varfilePath, (0, string_1.dedent) `
      a=a
      b=b
    `);
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {
                        b: "B",
                        c: "c",
                    },
                },
            ],
            varfile: "foo.env",
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "a",
            b: "B",
            c: "c",
        });
    });
    it("should load variables from custom environment varfile if specified", async () => {
        const varfilePath = (0, path_1.resolve)(tmpPath, "foo.env");
        await (0, fs_extra_1.writeFile)(varfilePath, (0, string_1.dedent) `
      b=B
      c=c
    `);
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    varfile: "foo.env",
                    variables: {},
                },
            ],
            variables: {
                a: "a",
                b: "b",
            },
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "a",
            b: "B",
            c: "c",
        });
    });
    it("should load variables from YAML varfiles if specified", async () => {
        await (0, fs_extra_1.writeFile)((0, path_1.resolve)(tmpPath, "foo.yml"), (0, string_1.dedent) `
      a: value-a
      b:
        some: value
      c:
        - some
        - values
      `);
        await (0, fs_extra_1.writeFile)((0, path_1.resolve)(tmpPath, "foo.default.yaml"), (0, string_1.dedent) `
      a: new-value
      b:
        additional: value
      d: something
      `);
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {},
                    varfile: "foo.default.yaml",
                },
            ],
            varfile: "foo.yml",
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "new-value",
            b: { some: "value", additional: "value" },
            c: ["some", "values"],
            d: "something",
        });
    });
    it("should load variables from JSON varfiles if specified", async () => {
        await (0, fs_extra_1.writeFile)((0, path_1.resolve)(tmpPath, "foo.json"), (0, string_1.dedent) `
      {
        "a": "value-a",
        "b": { "some": "value" },
        "c": ["some", "values"]
      }
      `);
        await (0, fs_extra_1.writeFile)((0, path_1.resolve)(tmpPath, "foo.default.json"), (0, string_1.dedent) `
      {
        "a": "new-value",
        "b": { "additional": "value" },
        "d": "something"
      }
      `);
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {},
                    varfile: "foo.default.json",
                },
            ],
            varfile: "foo.json",
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "new-value",
            b: { some: "value", additional: "value" },
            c: ["some", "values"],
            d: "something",
        });
    });
    it("should resolve template strings in the picked environment", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [
                { name: "default", defaultNamespace: project_1.defaultNamespace, variables: { local: "${local.username}", secret: "${secrets.foo}" } },
            ],
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: { foo: "banana" },
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            local: username,
            secret: "banana",
        });
    });
    it("should ignore template strings in other environments", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [
                { name: "default", defaultNamespace: project_1.defaultNamespace, variables: {} },
                { name: "other", defaultNamespace: project_1.defaultNamespace, variables: { foo: "${var.missing}", secret: "${secrets.missing}" } },
            ],
        });
        await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
    });
    it("should allow referencing top-level variables", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [{ name: "default", defaultNamespace: project_1.defaultNamespace, variables: { foo: "${var.foo}" } }],
            variables: { foo: "value" },
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            foo: "value",
        });
    });
    it("should correctly merge all variable sources in precedence order (variables fields and varfiles)", async () => {
        // Precedence 1/4 (highest)
        await (0, fs_extra_1.writeFile)((0, path_1.resolve)(tmpPath, (0, project_1.defaultEnvVarfilePath)("default")), (0, string_1.dedent) `
      d=D
      e=e
    `);
        // Precedence 3/4
        await (0, fs_extra_1.writeFile)((0, path_1.resolve)(tmpPath, project_1.defaultVarfilePath), (0, string_1.dedent) `
      b=B
      c=c
    `);
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    // Precedence 2/4
                    variables: {
                        c: "C",
                        d: "d",
                    },
                },
            ],
            // Precedence 4/4 (lowest)
            variables: {
                a: "a",
                b: "b",
            },
        });
        const result = await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        });
        (0, chai_1.expect)(result.variables).to.eql({
            a: "a",
            b: "B",
            c: "C",
            d: "D",
            e: "e",
        });
    });
    it("should validate the picked environment", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: "${var.foo}",
                    variables: {},
                },
            ],
            variables: {
                foo: 123,
            },
        });
        await (0, helpers_1.expectError)(() => (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        }), { contains: "Error validating environment default: key .defaultNamespace must be a string" });
    });
    it("should throw if project varfile is set to non-default and it doesn't exist", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    variables: {},
                },
            ],
            varfile: "foo.env",
        });
        await (0, helpers_1.expectError)(() => (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        }), { contains: "Could not find varfile at path 'foo.env'" });
    });
    it("should throw if environment varfile is set to non-default and it doesn't exist", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: tmpPath,
            environments: [
                {
                    name: "default",
                    defaultNamespace: project_1.defaultNamespace,
                    varfile: "foo.env",
                    variables: {},
                },
            ],
        });
        await (0, helpers_1.expectError)(() => (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        }), { contains: "Could not find varfile at path 'foo.env'" });
    });
    it("should set environment namespace if specified and defaultNamespace=null", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
        });
        (0, chai_1.expect)(await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "foo.default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            environmentName: "default",
            namespace: "foo",
            providers: project_1.fixedPlugins.map((name) => ({ name })),
            production: false,
            variables: {},
        });
    });
    it("should use explicit namespace if specified and there is a default", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
        });
        (0, chai_1.expect)(await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "foo.default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            environmentName: "default",
            namespace: "foo",
            providers: project_1.fixedPlugins.map((name) => ({ name })),
            production: false,
            variables: {},
        });
    });
    it("should use defaultNamespace if set and no explicit namespace is specified", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
        });
        (0, chai_1.expect)(await (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            username,
            vcsInfo,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        })).to.eql({
            environmentName: "default",
            namespace: "default",
            providers: project_1.fixedPlugins.map((name) => ({ name })),
            production: false,
            variables: {},
        });
    });
    it("should throw if invalid environment is specified", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
        });
        await (0, helpers_1.expectError)(() => (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "$.%",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        }), { contains: "Invalid environment specified ($.%): must be a valid environment name or <namespace>.<environment>" });
    });
    it("should throw if environment requires namespace but none is specified and defaultNamespace=null", async () => {
        const config = (0, helpers_1.createProjectConfig)({
            name: "my-project",
            path: "/tmp/foo",
            environments: [{ name: "default", defaultNamespace: null, variables: {} }],
        });
        await (0, helpers_1.expectError)(() => (0, project_1.pickEnvironment)({
            projectConfig: config,
            envString: "default",
            artifactsPath,
            vcsInfo,
            username,
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo,
        }), {
            contains: "Environment default has defaultNamespace set to null, and no explicit namespace was specified. Please either set a defaultNamespace or explicitly set a namespace at runtime (e.g. --env=some-namespace.default).",
        });
    });
});
describe("parseEnvironment", () => {
    it("should correctly parse with no namespace", () => {
        const result = (0, project_1.parseEnvironment)("env");
        (0, chai_1.expect)(result).to.eql({ environment: "env" });
    });
    it("should correctly parse with a namespace", () => {
        const result = (0, project_1.parseEnvironment)("ns.env");
        (0, chai_1.expect)(result).to.eql({ environment: "env", namespace: "ns" });
    });
    it("should throw if string contains more than two segments", () => {
        (0, helpers_1.expectError)(() => (0, project_1.parseEnvironment)("a.b.c"), {
            contains: "Invalid environment specified (a.b.c): may only contain a single delimiter",
        });
    });
    it("should throw if string is not a valid hostname", () => {
        (0, helpers_1.expectError)(() => (0, project_1.parseEnvironment)("&.$"), {
            contains: "Invalid environment specified (&.$): must be a valid environment name or <namespace>.<environment>",
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByb2plY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCwyQkFBNkI7QUFDN0IsK0JBQTZCO0FBQzdCLDhEQUE2QjtBQUM3Qiw0REFVdUM7QUFDdkMsOENBQW1FO0FBQ25FLHVDQUE4QztBQUM5Qyx3REFBb0Q7QUFDcEQsK0JBQW9DO0FBRXBDLE1BQU0sZ0JBQWdCLEdBQUcsNkJBQTZCLENBQUE7QUFDdEQsTUFBTSxXQUFXLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFBO0FBRXhELE1BQU0sT0FBTyxHQUFHO0lBQ2QsTUFBTSxFQUFFLE1BQU07SUFDZCxVQUFVLEVBQUUsVUFBVTtJQUN0QixTQUFTLEVBQUUseUJBQXlCO0NBQ3JDLENBQUE7QUFFRCxRQUFRLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO0lBQ3BDLEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM5RCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUM7U0FDekQsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQ0osSUFBQSw4QkFBb0IsRUFBQztZQUNuQixXQUFXLEVBQUUsU0FBUztZQUN0QixNQUFNO1lBQ04sYUFBYSxFQUFFLE1BQU07WUFDckIsT0FBTztZQUNQLFFBQVEsRUFBRSxXQUFXO1lBQ3JCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxHQUFHLE1BQU07WUFDVCxjQUFjLEVBQUUsRUFBRTtZQUNsQixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQWhCLDBCQUFnQjtvQkFDaEIsU0FBUyxFQUFFLEVBQUU7aUJBQ2Q7YUFDRjtZQUNELE9BQU8sRUFBRSxFQUFFO1lBQ1gsT0FBTyxFQUFFLDRCQUFrQjtTQUM1QixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxpR0FBaUcsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMvRyxNQUFNLGFBQWEsR0FBRyxrQ0FBa0MsQ0FBQTtRQUV4RCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQWhCLDBCQUFnQjtvQkFDaEIsU0FBUyxFQUFFO3dCQUNULE1BQU0sRUFBRSwyQkFBMkI7d0JBQ25DLFNBQVMsRUFBRSxnQkFBZ0I7cUJBQzVCO2lCQUNGO2FBQ0Y7WUFDRCxTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQ3hELE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxJQUFJLEVBQUUsMkJBQTJCO29CQUNqQyxhQUFhO2lCQUNkO2FBQ0Y7WUFDRCxTQUFTLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLG1CQUFtQjtnQkFDN0IsTUFBTSxFQUFFLGdCQUFnQjtnQkFDeEIsV0FBVyxFQUFFLHNCQUFzQjtnQkFDbkMsTUFBTSxFQUFFLDJCQUEyQjthQUNwQztTQUNGLENBQUMsQ0FBQTtRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQTtRQUVoQyxJQUFBLGFBQU0sRUFDSixJQUFBLDhCQUFvQixFQUFDO1lBQ25CLFdBQVcsRUFBRSw0QkFBa0I7WUFDL0IsTUFBTTtZQUNOLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLE9BQU87WUFDUCxRQUFRLEVBQUUsV0FBVztZQUNyQixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFO1lBQzFCLFdBQVc7U0FDWixDQUFDLENBQ0gsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ1AsR0FBRyxNQUFNO1lBQ1QsY0FBYyxFQUFFLEVBQUU7WUFDbEIsWUFBWSxFQUFFO2dCQUNaO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGdCQUFnQixFQUFoQiwwQkFBZ0I7b0JBQ2hCLFNBQVMsRUFBRTt3QkFDVCxNQUFNLEVBQUUsMkJBQTJCO3dCQUNuQyxTQUFTLEVBQUUsZ0JBQWdCO3FCQUM1QjtpQkFDRjthQUNGO1lBQ0QsT0FBTyxFQUFFLEVBQUU7WUFDWCxPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsSUFBSSxFQUFFLDJCQUEyQjtvQkFDakMsYUFBYTtpQkFDZDthQUNGO1lBQ0QsT0FBTyxFQUFFLDRCQUFrQjtZQUMzQixTQUFTLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLElBQUEsYUFBUSxHQUFFO2dCQUNwQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUN4QixNQUFNLEVBQUUsS0FBSzthQUNkO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQTtJQUNqQyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywwREFBMEQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN4RSxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQWhCLDBCQUFnQjtvQkFDaEIsU0FBUyxFQUFFO3dCQUNULE1BQU0sRUFBRSxLQUFLO3FCQUNkO2lCQUNGO2FBQ0Y7WUFDRCxTQUFTLEVBQUU7Z0JBQ1Q7b0JBQ0UsSUFBSSxFQUFFLFlBQVk7b0JBQ2xCLE9BQU8sRUFBRSw2QkFBNkI7aUJBQ3ZDO2dCQUNEO29CQUNFLElBQUksRUFBRSxZQUFZO29CQUNsQixZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ3pCLE9BQU8sRUFBRSw2QkFBNkI7aUJBQ3ZDO2FBQ0Y7U0FDRixDQUFDLENBQUE7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUE7UUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFBO1FBRWxDLElBQUEsYUFBTSxFQUNKLElBQUEsOEJBQW9CLEVBQUM7WUFDbkIsV0FBVyxFQUFFLDRCQUFrQjtZQUMvQixNQUFNO1lBQ04sYUFBYSxFQUFFLE1BQU07WUFDckIsT0FBTztZQUNQLFFBQVEsRUFBRSxXQUFXO1lBQ3JCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxHQUFHLE1BQU07WUFDVCxjQUFjLEVBQUUsRUFBRTtZQUNsQixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQWhCLDBCQUFnQjtvQkFDaEIsU0FBUyxFQUFFO3dCQUNULE1BQU0sRUFBRSxLQUFLO3FCQUNkO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsRUFBRTtZQUNYLFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsWUFBWSxFQUFFLEVBQUU7b0JBQ2hCLE9BQU8sRUFBRSw2QkFBNkI7aUJBQ3ZDO2dCQUNEO29CQUNFLElBQUksRUFBRSxZQUFZO29CQUNsQixZQUFZLEVBQUUsRUFBRTtvQkFDaEIsWUFBWSxFQUFFLENBQUMsU0FBUyxDQUFDO29CQUN6QixPQUFPLEVBQUUsNkJBQTZCO2lCQUN2QzthQUNGO1lBQ0QsT0FBTyxFQUFFLEVBQUU7WUFDWCxPQUFPLEVBQUUsNEJBQWtCO1NBQzVCLENBQUMsQ0FBQTtRQUVGLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUE7UUFDakMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQTtJQUNuQyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMzRSxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQWhCLDBCQUFnQjtvQkFDaEIsU0FBUyxFQUFFO3dCQUNULE1BQU0sRUFBRSxZQUFZO3FCQUNyQjtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsTUFBTSxNQUFNLEdBQUcsSUFBQSw4QkFBb0IsRUFBQztZQUNsQyxXQUFXLEVBQUUsNEJBQWtCO1lBQy9CLE1BQU07WUFDTixhQUFhLEVBQUUsTUFBTTtZQUNyQixPQUFPO1lBQ1AsUUFBUSxFQUFFLFdBQVc7WUFDckIsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0I7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXO1NBQ1osQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDbkYsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0RBQStELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDN0UsTUFBTSxhQUFhLEdBQUcsa0NBQWtDLENBQUE7UUFFeEQsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLElBQUksRUFBRSwyQkFBMkI7b0JBQ2pDLGFBQWE7aUJBQ2Q7YUFDRjtTQUNGLENBQUMsQ0FBQTtRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQTtRQUVoQyxJQUFBLGFBQU0sRUFDSixJQUFBLDhCQUFvQixFQUFDO1lBQ25CLFdBQVcsRUFBRSw0QkFBa0I7WUFDL0IsTUFBTTtZQUNOLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLE9BQU87WUFDUCxRQUFRLEVBQUUsV0FBVztZQUNyQixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQ0gsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ1AsR0FBRyxNQUFNO1lBQ1QsY0FBYyxFQUFFLEVBQUU7WUFDbEIsWUFBWSxFQUFFO2dCQUNaO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGdCQUFnQixFQUFoQiwwQkFBZ0I7b0JBQ2hCLFNBQVMsRUFBRSxFQUFFO2lCQUNkO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsRUFBRTtZQUNYLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxJQUFJLEVBQUUsMkJBQTJCO29CQUNqQyxhQUFhO2lCQUNkO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsNEJBQWtCO1lBQzNCLFNBQVMsRUFBRSxFQUFFO1NBQ2QsQ0FBQyxDQUFBO1FBRUYsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQTtJQUNqQyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxzRUFBc0UsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNwRixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUE7UUFDdEIsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsa0JBQWtCLEVBQUUsV0FBVztZQUMvQixZQUFZLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUM1RSxPQUFPLEVBQUUsRUFBRTtZQUNYLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDeEQsU0FBUyxFQUFFLEVBQUU7U0FDZCxDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFDSixJQUFBLDhCQUFvQixFQUFDO1lBQ25CLFdBQVc7WUFDWCxNQUFNO1lBQ04sYUFBYSxFQUFFLE1BQU07WUFDckIsT0FBTztZQUNQLFFBQVEsRUFBRSxXQUFXO1lBQ3JCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxHQUFHLE1BQU07WUFDVCxjQUFjLEVBQUUsRUFBRTtZQUNsQixrQkFBa0IsRUFBRSxXQUFXO1lBQy9CLFlBQVksRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQzVFLE9BQU8sRUFBRSxFQUFFO1lBQ1gsT0FBTyxFQUFFLDRCQUFrQjtTQUM1QixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1RCxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUE7UUFDdEIsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsa0JBQWtCLEVBQUUsV0FBVztZQUMvQixZQUFZLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUMxRSxPQUFPLEVBQUUsRUFBRTtZQUNYLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDeEQsU0FBUyxFQUFFLEVBQUU7U0FDZCxDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFDSixJQUFBLDhCQUFvQixFQUFDO1lBQ25CLFdBQVc7WUFDWCxNQUFNO1lBQ04sYUFBYSxFQUFFLE1BQU07WUFDckIsT0FBTztZQUNQLFFBQVEsRUFBRSxXQUFXO1lBQ3JCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxHQUFHLE1BQU07WUFDVCxjQUFjLEVBQUUsRUFBRTtZQUNsQixrQkFBa0IsRUFBRSxTQUFTO1lBQzdCLFlBQVksRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQzFFLE9BQU8sRUFBRSxFQUFFO1lBQ1gsT0FBTyxFQUFFLDRCQUFrQjtTQUM1QixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvRkFBb0YsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsRyxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQWhCLDBCQUFnQjtvQkFDaEIsU0FBUyxFQUFFO3dCQUNULE1BQU0sRUFBRSxLQUFLO3FCQUNkO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsRUFBRTtZQUNYLFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxJQUFJLEVBQUUsWUFBWTtpQkFDbkI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFlBQVk7b0JBQ2xCLFlBQVksRUFBRSxDQUFDLFNBQVMsQ0FBQztpQkFDMUI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFlBQVk7aUJBQ25CO2FBQ0Y7WUFDRCxTQUFTLEVBQUUsRUFBRTtTQUNkLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUNKLElBQUEsOEJBQW9CLEVBQUM7WUFDbkIsV0FBVyxFQUFFLDRCQUFrQjtZQUMvQixNQUFNO1lBQ04sYUFBYSxFQUFFLE1BQU07WUFDckIsT0FBTztZQUNQLFFBQVEsRUFBRSxXQUFXO1lBQ3JCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxHQUFHLE1BQU07WUFDVCxjQUFjLEVBQUUsRUFBRTtZQUNsQixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQWhCLDBCQUFnQjtvQkFDaEIsU0FBUyxFQUFFO3dCQUNULE1BQU0sRUFBRSxLQUFLO3FCQUNkO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsRUFBRTtZQUNYLFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsWUFBWSxFQUFFLEVBQUU7aUJBQ2pCO2dCQUNEO29CQUNFLElBQUksRUFBRSxZQUFZO29CQUNsQixZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ3pCLFlBQVksRUFBRSxFQUFFO2lCQUNqQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsWUFBWSxFQUFFLEVBQUU7aUJBQ2pCO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsRUFBRTtZQUNYLE9BQU8sRUFBRSw0QkFBa0I7U0FDNUIsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQTtBQUVGLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsSUFBSSxNQUEyQixDQUFBO0lBQy9CLElBQUksT0FBZSxDQUFBO0lBQ25CLElBQUksYUFBcUIsQ0FBQTtJQUN6QixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUE7SUFFdkIsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE1BQU0sR0FBRyxNQUFNLHFCQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7UUFDL0MsT0FBTyxHQUFHLE1BQU0sSUFBQSxtQkFBUSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNyQyxhQUFhLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUN2RCxDQUFDLENBQUMsQ0FBQTtJQUVGLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUN4QixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyRSxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUE7UUFFRixNQUFNLElBQUEscUJBQVcsRUFDZixHQUFHLEVBQUUsQ0FDSCxJQUFBLHlCQUFlLEVBQUM7WUFDZCxhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsS0FBSztZQUNoQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLEVBQ0osV0FBVyxDQUNaLENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN4RCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFDSixNQUFNLElBQUEseUJBQWUsRUFBQztZQUNwQixhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQ0gsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ1AsZUFBZSxFQUFFLFNBQVM7WUFDMUIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsU0FBUyxFQUFFLHNCQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRCxVQUFVLEVBQUUsS0FBSztZQUNqQixTQUFTLEVBQUUsRUFBRTtTQUNkLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGtGQUFrRixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2hHLE1BQU0sTUFBTSxHQUFrQixJQUFBLDZCQUFtQixFQUFDO1lBQ2hELElBQUksRUFBRSxZQUFZO1lBQ2xCLElBQUksRUFBRSxVQUFVO1lBQ2hCLFNBQVMsRUFBRTtnQkFDVCxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDcEMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUU7Z0JBQy9CLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFO2dCQUMvQixFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRTthQUNqQztTQUNGLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUNKLE1BQU0sSUFBQSx5QkFBZSxFQUFDO1lBQ3BCLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLGFBQWE7WUFDYixPQUFPO1lBQ1AsUUFBUTtZQUNSLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxlQUFlLEVBQUUsU0FBUztZQUMxQixTQUFTLEVBQUUsU0FBUztZQUNwQixTQUFTLEVBQUU7Z0JBQ1QsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO2dCQUNoQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDcEMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO2dCQUNyQixFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRTthQUNoQztZQUNELFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFNBQVMsRUFBRSxFQUFFO1NBQ2QsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsMERBQTBELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDeEUsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsWUFBWSxFQUFFO2dCQUNaO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGdCQUFnQixFQUFoQiwwQkFBZ0I7b0JBQ2hCLFNBQVMsRUFBRTt3QkFDVCxDQUFDLEVBQUUsYUFBYTt3QkFDaEIsQ0FBQyxFQUFFLGFBQWE7d0JBQ2hCLEtBQUssRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLENBQUM7d0JBQzNDLE1BQU0sRUFBRTs0QkFDTixPQUFPLEVBQUUsb0JBQW9COzRCQUM3QixPQUFPLEVBQUUsb0JBQW9CO3lCQUM5QjtxQkFDRjtpQkFDRjthQUNGO1lBQ0QsU0FBUyxFQUFFLEVBQUU7WUFDYixTQUFTLEVBQUU7Z0JBQ1QsQ0FBQyxFQUFFLGlCQUFpQjtnQkFDcEIsQ0FBQyxFQUFFLGlCQUFpQjtnQkFDcEIsS0FBSyxFQUFFLENBQUMsRUFBRSxlQUFlLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxFQUFFO29CQUNOLE9BQU8sRUFBRSx3QkFBd0I7b0JBQ2pDLE9BQU8sRUFBRSx3QkFBd0I7aUJBQ2xDO2FBQ0Y7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsRUFBQztZQUNuQyxhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM5QixDQUFDLEVBQUUsaUJBQWlCO1lBQ3BCLENBQUMsRUFBRSxhQUFhO1lBQ2hCLENBQUMsRUFBRSxhQUFhO1lBQ2hCLEtBQUssRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxxQkFBcUIsRUFBRSxDQUFDO1lBQ25GLE1BQU0sRUFBRTtnQkFDTixPQUFPLEVBQUUsd0JBQXdCO2dCQUNqQyxPQUFPLEVBQUUsb0JBQW9CO2dCQUM3QixPQUFPLEVBQUUsb0JBQW9CO2FBQzlCO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsaUVBQWlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDL0UsTUFBTSxXQUFXLEdBQUcsSUFBQSxjQUFPLEVBQUMsT0FBTyxFQUFFLDRCQUFrQixDQUFDLENBQUE7UUFDeEQsTUFBTSxJQUFBLG9CQUFTLEVBQ2IsV0FBVyxFQUNYLElBQUEsZUFBTSxFQUFBOzs7S0FHUCxDQUNBLENBQUE7UUFFRCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsT0FBTztZQUNiLFlBQVksRUFBRTtnQkFDWjtvQkFDRSxJQUFJLEVBQUUsU0FBUztvQkFDZixnQkFBZ0IsRUFBaEIsMEJBQWdCO29CQUNoQixTQUFTLEVBQUU7d0JBQ1QsQ0FBQyxFQUFFLEdBQUc7d0JBQ04sQ0FBQyxFQUFFLEdBQUc7cUJBQ1A7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQTtRQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxFQUFDO1lBQ25DLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLGFBQWE7WUFDYixPQUFPO1lBQ1AsUUFBUTtZQUNSLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzlCLENBQUMsRUFBRSxHQUFHO1lBQ04sQ0FBQyxFQUFFLEdBQUc7WUFDTixDQUFDLEVBQUUsR0FBRztTQUNQLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHFFQUFxRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ25GLE1BQU0sV0FBVyxHQUFHLElBQUEsY0FBTyxFQUFDLE9BQU8sRUFBRSxJQUFBLCtCQUFxQixFQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUE7UUFDdEUsTUFBTSxJQUFBLG9CQUFTLEVBQ2IsV0FBVyxFQUNYLElBQUEsZUFBTSxFQUFBOzs7S0FHUCxDQUNBLENBQUE7UUFFRCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsT0FBTztZQUNiLFlBQVksRUFBRTtnQkFDWjtvQkFDRSxJQUFJLEVBQUUsU0FBUztvQkFDZixnQkFBZ0IsRUFBaEIsMEJBQWdCO29CQUNoQixTQUFTLEVBQUUsRUFBRTtpQkFDZDthQUNGO1lBQ0QsU0FBUyxFQUFFO2dCQUNULENBQUMsRUFBRSxHQUFHO2dCQUNOLENBQUMsRUFBRSxHQUFHO2FBQ1A7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsRUFBQztZQUNuQyxhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM5QixDQUFDLEVBQUUsR0FBRztZQUNOLENBQUMsRUFBRSxHQUFHO1lBQ04sQ0FBQyxFQUFFLEdBQUc7U0FDUCxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxnRUFBZ0UsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM5RSxNQUFNLFdBQVcsR0FBRyxJQUFBLGNBQU8sRUFBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDL0MsTUFBTSxJQUFBLG9CQUFTLEVBQ2IsV0FBVyxFQUNYLElBQUEsZUFBTSxFQUFBOzs7S0FHUCxDQUNBLENBQUE7UUFFRCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsT0FBTztZQUNiLFlBQVksRUFBRTtnQkFDWjtvQkFDRSxJQUFJLEVBQUUsU0FBUztvQkFDZixnQkFBZ0IsRUFBaEIsMEJBQWdCO29CQUNoQixTQUFTLEVBQUU7d0JBQ1QsQ0FBQyxFQUFFLEdBQUc7d0JBQ04sQ0FBQyxFQUFFLEdBQUc7cUJBQ1A7aUJBQ0Y7YUFDRjtZQUNELE9BQU8sRUFBRSxTQUFTO1NBQ25CLENBQUMsQ0FBQTtRQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxFQUFDO1lBQ25DLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLGFBQWE7WUFDYixPQUFPO1lBQ1AsUUFBUTtZQUNSLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzlCLENBQUMsRUFBRSxHQUFHO1lBQ04sQ0FBQyxFQUFFLEdBQUc7WUFDTixDQUFDLEVBQUUsR0FBRztTQUNQLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLG9FQUFvRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2xGLE1BQU0sV0FBVyxHQUFHLElBQUEsY0FBTyxFQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUMvQyxNQUFNLElBQUEsb0JBQVMsRUFDYixXQUFXLEVBQ1gsSUFBQSxlQUFNLEVBQUE7OztLQUdQLENBQ0EsQ0FBQTtRQUVELE1BQU0sTUFBTSxHQUFrQixJQUFBLDZCQUFtQixFQUFDO1lBQ2hELElBQUksRUFBRSxZQUFZO1lBQ2xCLElBQUksRUFBRSxPQUFPO1lBQ2IsWUFBWSxFQUFFO2dCQUNaO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGdCQUFnQixFQUFoQiwwQkFBZ0I7b0JBQ2hCLE9BQU8sRUFBRSxTQUFTO29CQUNsQixTQUFTLEVBQUUsRUFBRTtpQkFDZDthQUNGO1lBQ0QsU0FBUyxFQUFFO2dCQUNULENBQUMsRUFBRSxHQUFHO2dCQUNOLENBQUMsRUFBRSxHQUFHO2FBQ1A7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsRUFBQztZQUNuQyxhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM5QixDQUFDLEVBQUUsR0FBRztZQUNOLENBQUMsRUFBRSxHQUFHO1lBQ04sQ0FBQyxFQUFFLEdBQUc7U0FDUCxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyRSxNQUFNLElBQUEsb0JBQVMsRUFDYixJQUFBLGNBQU8sRUFBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLEVBQzNCLElBQUEsZUFBTSxFQUFBOzs7Ozs7O09BT0wsQ0FDRixDQUFBO1FBRUQsTUFBTSxJQUFBLG9CQUFTLEVBQ2IsSUFBQSxjQUFPLEVBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLEVBQ3BDLElBQUEsZUFBTSxFQUFBOzs7OztPQUtMLENBQ0YsQ0FBQTtRQUVELE1BQU0sTUFBTSxHQUFrQixJQUFBLDZCQUFtQixFQUFDO1lBQ2hELElBQUksRUFBRSxZQUFZO1lBQ2xCLElBQUksRUFBRSxPQUFPO1lBQ2IsWUFBWSxFQUFFO2dCQUNaO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGdCQUFnQixFQUFoQiwwQkFBZ0I7b0JBQ2hCLFNBQVMsRUFBRSxFQUFFO29CQUNiLE9BQU8sRUFBRSxrQkFBa0I7aUJBQzVCO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsU0FBUztTQUNuQixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsRUFBQztZQUNuQyxhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM5QixDQUFDLEVBQUUsV0FBVztZQUNkLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRTtZQUN6QyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDO1lBQ3JCLENBQUMsRUFBRSxXQUFXO1NBQ2YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdURBQXVELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDckUsTUFBTSxJQUFBLG9CQUFTLEVBQ2IsSUFBQSxjQUFPLEVBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxFQUM1QixJQUFBLGVBQU0sRUFBQTs7Ozs7O09BTUwsQ0FDRixDQUFBO1FBRUQsTUFBTSxJQUFBLG9CQUFTLEVBQ2IsSUFBQSxjQUFPLEVBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLEVBQ3BDLElBQUEsZUFBTSxFQUFBOzs7Ozs7T0FNTCxDQUNGLENBQUE7UUFFRCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsT0FBTztZQUNiLFlBQVksRUFBRTtnQkFDWjtvQkFDRSxJQUFJLEVBQUUsU0FBUztvQkFDZixnQkFBZ0IsRUFBaEIsMEJBQWdCO29CQUNoQixTQUFTLEVBQUUsRUFBRTtvQkFDYixPQUFPLEVBQUUsa0JBQWtCO2lCQUM1QjthQUNGO1lBQ0QsT0FBTyxFQUFFLFVBQVU7U0FDcEIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEVBQUM7WUFDbkMsYUFBYSxFQUFFLE1BQU07WUFDckIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsYUFBYTtZQUNiLE9BQU87WUFDUCxRQUFRO1lBQ1IsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0I7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXO1NBQ1osQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDOUIsQ0FBQyxFQUFFLFdBQVc7WUFDZCxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUU7WUFDekMsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztZQUNyQixDQUFDLEVBQUUsV0FBVztTQUNmLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDJEQUEyRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3pFLE1BQU0sTUFBTSxHQUFrQixJQUFBLDZCQUFtQixFQUFDO1lBQ2hELElBQUksRUFBRSxZQUFZO1lBQ2xCLElBQUksRUFBRSxVQUFVO1lBQ2hCLFlBQVksRUFBRTtnQkFDWixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQWhCLDBCQUFnQixFQUFFLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRTthQUMzRztTQUNGLENBQUMsQ0FBQTtRQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxFQUFDO1lBQ25DLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLGFBQWE7WUFDYixPQUFPO1lBQ1AsUUFBUTtZQUNSLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUU7WUFDMUIsV0FBVztTQUNaLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzlCLEtBQUssRUFBRSxRQUFRO1lBQ2YsTUFBTSxFQUFFLFFBQVE7U0FDakIsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsc0RBQXNELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDcEUsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsWUFBWSxFQUFFO2dCQUNaLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBaEIsMEJBQWdCLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtnQkFDcEQsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFoQiwwQkFBZ0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixFQUFFLEVBQUU7YUFDeEc7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLElBQUEseUJBQWUsRUFBQztZQUNwQixhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1RCxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQWhCLDBCQUFnQixFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsRUFBRSxDQUFDO1lBQ3ZGLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUU7U0FDNUIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEVBQUM7WUFDbkMsYUFBYSxFQUFFLE1BQU07WUFDckIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsYUFBYTtZQUNiLE9BQU87WUFDUCxRQUFRO1lBQ1IsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0I7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXO1NBQ1osQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDOUIsR0FBRyxFQUFFLE9BQU87U0FDYixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxpR0FBaUcsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMvRywyQkFBMkI7UUFDM0IsTUFBTSxJQUFBLG9CQUFTLEVBQ2IsSUFBQSxjQUFPLEVBQUMsT0FBTyxFQUFFLElBQUEsK0JBQXFCLEVBQUMsU0FBUyxDQUFDLENBQUMsRUFDbEQsSUFBQSxlQUFNLEVBQUE7OztLQUdQLENBQ0EsQ0FBQTtRQUVELGlCQUFpQjtRQUNqQixNQUFNLElBQUEsb0JBQVMsRUFDYixJQUFBLGNBQU8sRUFBQyxPQUFPLEVBQUUsNEJBQWtCLENBQUMsRUFDcEMsSUFBQSxlQUFNLEVBQUE7OztLQUdQLENBQ0EsQ0FBQTtRQUVELE1BQU0sTUFBTSxHQUFrQixJQUFBLDZCQUFtQixFQUFDO1lBQ2hELElBQUksRUFBRSxZQUFZO1lBQ2xCLElBQUksRUFBRSxPQUFPO1lBQ2IsWUFBWSxFQUFFO2dCQUNaO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGdCQUFnQixFQUFoQiwwQkFBZ0I7b0JBQ2hCLGlCQUFpQjtvQkFDakIsU0FBUyxFQUFFO3dCQUNULENBQUMsRUFBRSxHQUFHO3dCQUNOLENBQUMsRUFBRSxHQUFHO3FCQUNQO2lCQUNGO2FBQ0Y7WUFDRCwwQkFBMEI7WUFDMUIsU0FBUyxFQUFFO2dCQUNULENBQUMsRUFBRSxHQUFHO2dCQUNOLENBQUMsRUFBRSxHQUFHO2FBQ1A7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsRUFBQztZQUNuQyxhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM5QixDQUFDLEVBQUUsR0FBRztZQUNOLENBQUMsRUFBRSxHQUFHO1lBQ04sQ0FBQyxFQUFFLEdBQUc7WUFDTixDQUFDLEVBQUUsR0FBRztZQUNOLENBQUMsRUFBRSxHQUFHO1NBQ1AsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEQsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLE9BQU87WUFDYixZQUFZLEVBQUU7Z0JBQ1o7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsZ0JBQWdCLEVBQUUsWUFBWTtvQkFDOUIsU0FBUyxFQUFFLEVBQUU7aUJBQ2Q7YUFDRjtZQUNELFNBQVMsRUFBRTtnQkFDVCxHQUFHLEVBQUUsR0FBRzthQUNUO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsTUFBTSxJQUFBLHFCQUFXLEVBQ2YsR0FBRyxFQUFFLENBQ0gsSUFBQSx5QkFBZSxFQUFDO1lBQ2QsYUFBYSxFQUFFLE1BQU07WUFDckIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsYUFBYTtZQUNiLE9BQU87WUFDUCxRQUFRO1lBQ1IsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0I7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXO1NBQ1osQ0FBQyxFQUNKLEVBQUUsUUFBUSxFQUFFLDhFQUE4RSxFQUFFLENBQzdGLENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw0RUFBNEUsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMxRixNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsT0FBTztZQUNiLFlBQVksRUFBRTtnQkFDWjtvQkFDRSxJQUFJLEVBQUUsU0FBUztvQkFDZixnQkFBZ0IsRUFBaEIsMEJBQWdCO29CQUNoQixTQUFTLEVBQUUsRUFBRTtpQkFDZDthQUNGO1lBQ0QsT0FBTyxFQUFFLFNBQVM7U0FDbkIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxJQUFBLHFCQUFXLEVBQ2YsR0FBRyxFQUFFLENBQ0gsSUFBQSx5QkFBZSxFQUFDO1lBQ2QsYUFBYSxFQUFFLE1BQU07WUFDckIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsYUFBYTtZQUNiLE9BQU87WUFDUCxRQUFRO1lBQ1IsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0I7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXO1NBQ1osQ0FBQyxFQUNKLEVBQUUsUUFBUSxFQUFFLDBDQUEwQyxFQUFFLENBQ3pELENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxnRkFBZ0YsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM5RixNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsT0FBTztZQUNiLFlBQVksRUFBRTtnQkFDWjtvQkFDRSxJQUFJLEVBQUUsU0FBUztvQkFDZixnQkFBZ0IsRUFBaEIsMEJBQWdCO29CQUNoQixPQUFPLEVBQUUsU0FBUztvQkFDbEIsU0FBUyxFQUFFLEVBQUU7aUJBQ2Q7YUFDRjtTQUNGLENBQUMsQ0FBQTtRQUVGLE1BQU0sSUFBQSxxQkFBVyxFQUNmLEdBQUcsRUFBRSxDQUNILElBQUEseUJBQWUsRUFBQztZQUNkLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLGFBQWE7WUFDYixPQUFPO1lBQ1AsUUFBUTtZQUNSLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsRUFDSixFQUFFLFFBQVEsRUFBRSwwQ0FBMEMsRUFBRSxDQUN6RCxDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMseUVBQXlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdkYsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLFVBQVU7U0FDakIsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQ0osTUFBTSxJQUFBLHlCQUFlLEVBQUM7WUFDcEIsYUFBYSxFQUFFLE1BQU07WUFDckIsU0FBUyxFQUFFLGFBQWE7WUFDeEIsYUFBYTtZQUNiLE9BQU87WUFDUCxRQUFRO1lBQ1IsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0I7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXO1NBQ1osQ0FBQyxDQUNILENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUNQLGVBQWUsRUFBRSxTQUFTO1lBQzFCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFNBQVMsRUFBRSxzQkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakQsVUFBVSxFQUFFLEtBQUs7WUFDakIsU0FBUyxFQUFFLEVBQUU7U0FDZCxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxtRUFBbUUsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNqRixNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFDSixNQUFNLElBQUEseUJBQWUsRUFBQztZQUNwQixhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsYUFBYTtZQUN4QixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLENBQ0gsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ1AsZUFBZSxFQUFFLFNBQVM7WUFDMUIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsU0FBUyxFQUFFLHNCQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRCxVQUFVLEVBQUUsS0FBSztZQUNqQixTQUFTLEVBQUUsRUFBRTtTQUNkLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDJFQUEyRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3pGLE1BQU0sTUFBTSxHQUFrQixJQUFBLDZCQUFtQixFQUFDO1lBQ2hELElBQUksRUFBRSxZQUFZO1lBQ2xCLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUNKLE1BQU0sSUFBQSx5QkFBZSxFQUFDO1lBQ3BCLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLGFBQWE7WUFDYixRQUFRO1lBQ1IsT0FBTztZQUNQLFFBQVEsRUFBRSxJQUFJO1lBQ2QsZ0JBQWdCO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxlQUFlLEVBQUUsU0FBUztZQUMxQixTQUFTLEVBQUUsU0FBUztZQUNwQixTQUFTLEVBQUUsc0JBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFNBQVMsRUFBRSxFQUFFO1NBQ2QsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsa0RBQWtELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDaEUsTUFBTSxNQUFNLEdBQWtCLElBQUEsNkJBQW1CLEVBQUM7WUFDaEQsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLFVBQVU7U0FDakIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxJQUFBLHFCQUFXLEVBQ2YsR0FBRyxFQUFFLENBQ0gsSUFBQSx5QkFBZSxFQUFDO1lBQ2QsYUFBYSxFQUFFLE1BQU07WUFDckIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsYUFBYTtZQUNiLE9BQU87WUFDUCxRQUFRO1lBQ1IsUUFBUSxFQUFFLElBQUk7WUFDZCxnQkFBZ0I7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXO1NBQ1osQ0FBQyxFQUNKLEVBQUUsUUFBUSxFQUFFLG9HQUFvRyxFQUFFLENBQ25ILENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxnR0FBZ0csRUFBRSxLQUFLLElBQUksRUFBRTtRQUM5RyxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztZQUNoRCxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQztTQUMzRSxDQUFDLENBQUE7UUFFRixNQUFNLElBQUEscUJBQVcsRUFDZixHQUFHLEVBQUUsQ0FDSCxJQUFBLHlCQUFlLEVBQUM7WUFDZCxhQUFhLEVBQUUsTUFBTTtZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixhQUFhO1lBQ2IsT0FBTztZQUNQLFFBQVE7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGdCQUFnQjtZQUNoQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7U0FDWixDQUFDLEVBQ0o7WUFDRSxRQUFRLEVBQ04sbU5BQW1OO1NBQ3ROLENBQ0YsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7UUFDbEQsTUFBTSxNQUFNLEdBQUcsSUFBQSwwQkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtRQUN0QyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDL0MsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1FBQ2pELE1BQU0sTUFBTSxHQUFHLElBQUEsMEJBQWdCLEVBQUMsUUFBUSxDQUFDLENBQUE7UUFDekMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDaEUsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO1FBQ2hFLElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDBCQUFnQixFQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzNDLFFBQVEsRUFBRSw0RUFBNEU7U0FDdkYsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1FBQ3hELElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDBCQUFnQixFQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3pDLFFBQVEsRUFBRSxvR0FBb0c7U0FDL0csQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9