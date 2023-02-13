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
const plugins_1 = require("../../../../src/commands/plugins");
const helpers_1 = require("../../../helpers");
const plugin_1 = require("../../../../src/plugin/plugin");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const string_1 = require("../../../../src/util/string");
const logger_1 = require("../../../../src/logger/logger");
const chai_1 = require("chai");
const chalk_1 = __importDefault(require("chalk"));
const testing_1 = require("../../../../src/util/testing");
const _loggerUtil = require("../../../../src/logger/util");
describe("PluginsCommand", () => {
    let tmpDir;
    const command = new plugins_1.PluginsCommand();
    const chalkLevel = chalk_1.default.level;
    const testPluginA = (0, plugin_1.createGardenPlugin)({
        name: "test-plugin-a",
        commands: [
            {
                name: "command-a",
                description: "Description for command A",
                handler: async ({ args }) => ({ result: { args } }),
            },
            {
                // Making this command name longer than the other, to test the justification
                name: "command-a-2",
                description: "Description for command A-2",
                handler: async ({ args }) => ({ result: { args } }),
            },
        ],
    });
    const testPluginB = (0, plugin_1.createGardenPlugin)({
        name: "test-plugin-b",
        commands: [
            {
                name: "command-b",
                description: "Description for command B. After quite a bit of thinking, I've decided to make it really very long and unnecessarily verbose to properly test the table justification.",
                handler: async ({ args }) => ({ result: { args } }),
            },
        ],
    });
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true });
        await (0, fs_extra_1.writeFile)((0, path_1.join)(tmpDir.path, "garden.yml"), (0, string_1.dedent) `
      kind: Project
      name: test
      environments:
        - name: default
      providers:
        - name: test-plugin-a
        - name: test-plugin-b
      `);
        _loggerUtil.overrideTerminalWidth = 100;
        chalk_1.default.level = 0;
    });
    after(async () => {
        await tmpDir.cleanup();
        _loggerUtil.overrideTerminalWidth = undefined;
        chalk_1.default.level = chalkLevel;
    });
    it(`should print a nice help text`, async () => {
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, { plugins: [testPluginA, testPluginB] });
        const log = garden.log;
        await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { plugin: undefined, command: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        const infoLog = (0, testing_1.getLogMessages)(log, (entry) => entry.level === logger_1.LogLevel.info)
            .join("\n")
            .trim()
            .split("\n")
            .map((line) => line.trimEnd())
            .join("\n");
        (0, chai_1.expect)(infoLog).to.equal((0, string_1.dedent) `
    USAGE

      garden [global options] <command> -- [args ...]

    PLUGIN COMMANDS
      test-plugin-a command-a    Description for command A
      test-plugin-a command-a-2  Description for command A-2

      test-plugin-b command-b  Description for command B. After quite a bit of thinking, I've decided to
                               make it really very long and unnecessarily verbose to properly test the
                               table justification.
    `);
    });
    it(`should pass unparsed args to the plugin command`, async () => {
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, { plugins: [testPluginA, testPluginB] });
        const log = garden.log;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "plugin": "test-plugin-a", "command": "command-a", "--": ["foo"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(result).to.eql({ args: ["foo"] });
    });
    it(`ignore the env flag when printing help text`, async () => {
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, { plugins: [testPluginA, testPluginB] });
        const log = garden.log;
        const result = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { plugin: undefined, command: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ env: "invalid-env" }),
        });
        (0, chai_1.expect)(result.errors).to.be.undefined;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2lucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBsdWdpbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCw4REFBaUU7QUFDakUsOENBQWdHO0FBQ2hHLDBEQUFrRTtBQUNsRSx1Q0FBb0M7QUFDcEMsK0JBQTJCO0FBQzNCLHdEQUFvRDtBQUNwRCwwREFBd0Q7QUFDeEQsK0JBQTZCO0FBQzdCLGtEQUF5QjtBQUN6QiwwREFBNkQ7QUFDN0QsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUE7QUFFMUQsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixJQUFJLE1BQXFCLENBQUE7SUFDekIsTUFBTSxPQUFPLEdBQUcsSUFBSSx3QkFBYyxFQUFFLENBQUE7SUFDcEMsTUFBTSxVQUFVLEdBQUcsZUFBSyxDQUFDLEtBQUssQ0FBQTtJQUU5QixNQUFNLFdBQVcsR0FBRyxJQUFBLDJCQUFrQixFQUFDO1FBQ3JDLElBQUksRUFBRSxlQUFlO1FBQ3JCLFFBQVEsRUFBRTtZQUNSO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixXQUFXLEVBQUUsMkJBQTJCO2dCQUN4QyxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO2FBQ3BEO1lBQ0Q7Z0JBQ0UsNEVBQTRFO2dCQUM1RSxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFLDZCQUE2QjtnQkFDMUMsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQzthQUNwRDtTQUNGO0tBQ0YsQ0FBQyxDQUFBO0lBRUYsTUFBTSxXQUFXLEdBQUcsSUFBQSwyQkFBa0IsRUFBQztR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