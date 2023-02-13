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
const path_1 = require("path");
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const string_1 = require("../../../../src/util/string");
const lodash_1 = require("lodash");
const helpers_1 = require("../../../helpers");
const migrate_1 = require("../../../../src/commands/migrate");
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = require("fs-extra");
describe("commands", () => {
    describe("migrate", () => {
        let tmpDir;
        const projectPath = (0, helpers_1.getDataDir)("test-projects", "v10-configs");
        const projectPathErrors = (0, helpers_1.getDataDir)("test-projects", "v10-configs-errors");
        const command = new migrate_1.MigrateCommand();
        let garden;
        let log;
        before(async () => {
            garden = await (0, helpers_1.makeTestGardenA)();
            log = garden.log;
            tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
        });
        after(async () => {
            await tmpDir.cleanup();
        });
        context("convert config", () => {
            let result;
            before(async () => {
                // The Garden class is not used by the command so we just use any test Garden
                const res = await command.action({
                    garden,
                    log,
                    headerLog: log,
                    footerLog: log,
                    args: { configPaths: [] },
                    opts: (0, helpers_1.withDefaultGlobalOpts)({
                        root: projectPath,
                        write: false,
                    }),
                });
                result = res.result;
            });
            it("should scan for garden.yml files and convert them to v11 config", () => {
                (0, chai_1.expect)(result.updatedConfigs.map((c) => c.path).sort()).to.eql([
                    (0, path_1.join)(projectPath, "garden.yml"),
                    (0, path_1.join)(projectPath, "module-a", "garden.yml"),
                    (0, path_1.join)(projectPath, "module-b", "garden.yml"),
                    (0, path_1.join)(projectPath, "nested", "module-c", "garden.yml"),
                ]);
            });
            it("should ignore configs that are already valid", () => {
                (0, chai_1.expect)(result.updatedConfigs.map((c) => c.path)).to.not.contain([
                    (0, path_1.join)(projectPath, "module-noop", "garden.yml"),
                ]);
            });
            it("should not modify specs that are already valid", () => {
                const noop = result.updatedConfigs[0].specs[0];
                (0, chai_1.expect)(noop).to.eql({
                    kind: "Project",
                    name: "test-project-v10-config-noop",
                    environments: [
                        {
                            name: "local",
                        },
                        {
                            name: "other",
                        },
                    ],
                    providers: [
                        {
                            name: "test-plugin",
                            environments: ["local"],
                        },
                        {
                            name: "test-plugin-b",
                            environments: ["other"],
                        },
                    ],
                });
            });
            it("should convert nested configs to the flat style", () => {
                const nested = result.updatedConfigs[0].specs[1];
                (0, chai_1.expect)(nested).to.eql({
                    kind: "Project",
                    name: "test-project-v10-config-nested",
                    environments: [
                        {
                            name: "local",
                            providers: [
                                {
                                    name: "test-plugin",
                                },
                                {
                                    name: "test-plugin-b",
                                },
                            ],
                        },
                        {
                            name: "other",
                        },
                    ],
                });
            });
            it("should convert nested project configs to the flat style", () => {
                const envDefaults = result.updatedConfigs[0].specs[2];
                (0, chai_1.expect)(envDefaults).to.eql({
                    kind: "Project",
                    name: "test-project-v10-config-env-defaults",
                    varfile: "foobar",
                    variables: {
                        some: "var",
                        foo: "bar",
                    },
                    providers: [
                        {
                            name: "test-plugin-c",
                            context: "foo",
                            environments: ["local", "dev"],
                        },
                    ],
                    environments: [
                        {
                            name: "local",
                            providers: [
                                {
                                    name: "test-plugin",
                                },
                                {
                                    name: "test-plugin-b",
                                },
                            ],
                        },
                        {
                            name: "other",
                        },
                    ],
                });
            });
            it("should convert nested module configs to the flat style", () => {
                const moduleNested = result.updatedConfigs[0].specs[3];
                (0, chai_1.expect)(moduleNested).to.eql({
                    kind: "Module",
                    name: "module-nested",
                    type: "test",
                    build: {
                        command: ["echo", "project"],
                    },
                });
            });
            it("should convert modules in their own config files", () => {
                const modules = (0, lodash_1.sortBy)(result.updatedConfigs, "path").slice(1);
                (0, chai_1.expect)(modules).to.eql([
                    {
                        path: (0, path_1.join)(projectPath, "module-a", "garden.yml"),
                        specs: [
                            {
                                kind: "Module",
                                name: "module-a",
                                type: "exec",
                                build: {
                                    command: ["echo", "project"],
                                },
                            },
                        ],
                    },
                    {
                        path: (0, path_1.join)(projectPath, "module-b", "garden.yml"),
                        specs: [
                            {
                                kind: "Module",
                                name: "module-b",
                                type: "exec",
                                build: {
                                    command: ["echo", "project"],
                                },
                            },
                        ],
                    },
                    {
                        path: (0, path_1.join)(projectPath, "nested", "module-c", "garden.yml"),
                        specs: [
                            {
                                kind: "Module",
                                name: "module-c",
                                type: "exec",
                                build: {
                                    command: ["echo", "project"],
                                },
                            },
                        ],
                    },
                ]);
            });
        });
        it("should throw if it can't re-assign the environmentDefaults.varfile field", async () => {
            await (0, helpers_1.expectError)(() => command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { configPaths: ["./project-varfile/garden.yml"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({
                    root: projectPathErrors,
                    write: false,
                }),
            }), (err) => {
                (0, chai_1.expect)(err.message).to.include("Found a project level `varfile` field");
            });
        });
        it("should abort write if config file is dirty", async () => {
            await (0, execa_1.default)("git", ["init", "--initial-branch=main"], { cwd: tmpDir.path });
            await (0, fs_extra_1.writeFile)((0, path_1.join)(tmpDir.path, "garden.yml"), (0, string_1.dedent) `
          kind: Project
          name: test-exec
          environments:
            - name: local
          ---
          module:
            name: module-a
            type: exec
            build:
              command: [echo, project]
        `);
            await (0, helpers_1.expectError)(() => command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { configPaths: [] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({
                    write: true,
                    root: tmpDir.path,
                }),
            }), (err) => {
                (0, chai_1.expect)(err.message).to.eql((0, string_1.dedent) `
          Config files at the following paths are dirty:\n
          ${(0, path_1.join)(tmpDir.path, "garden.yml")}

          Please commit them before applying this command with the --write flag
          `);
            });
        });
        describe("dumpConfig", () => {
            it("should return multiple specs as valid YAML", async () => {
                const res = await command.action({
                    garden,
                    log,
                    headerLog: log,
                    footerLog: log,
                    args: { configPaths: ["./garden.yml"] },
                    opts: (0, helpers_1.withDefaultGlobalOpts)({
                        root: projectPath,
                        write: false,
                    }),
                });
                const specs = res.result.updatedConfigs[0].specs;
                (0, chai_1.expect)((0, migrate_1.dumpSpec)(specs)).to.eql((0, string_1.dedent) `
        kind: Project
        name: test-project-v10-config-noop
        environments:
          - name: local
          - name: other
        providers:
          - name: test-plugin
            environments:
              - local
          - name: test-plugin-b
            environments:
              - other

        ---

        kind: Project
        name: test-project-v10-config-nested
        environments:
          - name: local
            providers:
              - name: test-plugin
              - name: test-plugin-b
          - name: other

        ---

        kind: Project
        name: test-project-v10-config-env-defaults
        variables:
          some: var
          foo: bar
        environments:
          - name: local
            providers:
              - name: test-plugin
              - name: test-plugin-b
          - name: other
        varfile: foobar
        providers:
          - name: test-plugin-c
            context: foo
            environments:
              - local
              - dev

        ---

        kind: Module
        name: module-nested
        type: test
        build:
          command:
            - echo
            - project\n
        `);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCwrQkFBNkI7QUFDN0IsK0JBQTJCO0FBQzNCLDhEQUE2QjtBQUM3Qix3REFBb0Q7QUFDcEQsbUNBQStCO0FBQy9CLDhDQUFrRztBQUNsRyw4REFBaUc7QUFHakcsa0RBQXlCO0FBQ3pCLHVDQUFvQztBQUVwQyxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUN2QixJQUFJLE1BQTJCLENBQUE7UUFDL0IsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQTtRQUM5RCxNQUFNLGlCQUFpQixHQUFHLElBQUEsb0JBQVUsRUFBQyxlQUFlLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtRQUMzRSxNQUFNLE9BQU8sR0FBRyxJQUFJLHdCQUFjLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLE1BQWMsQ0FBQTtRQUNsQixJQUFJLEdBQWEsQ0FBQTtRQUVqQixNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7WUFDaEMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7WUFDaEIsTUFBTSxHQUFHLE1BQU0scUJBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUNqRCxDQUFDLENBQUMsQ0FBQTtRQUVGLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNmLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3hCLENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUM3QixJQUFJLE1BQTRCLENBQUE7WUFFaEMsTUFB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