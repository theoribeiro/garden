"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../../src/util/util");
const helpers_1 = require("../../../helpers");
const chai_1 = require("chai");
const plugin_1 = require("../../../../src/plugin/plugin");
const tools_1 = require("../../../../src/commands/tools");
const logger_1 = require("../../../../src/logger/logger");
const string_1 = require("../../../../src/util/string");
const cli_1 = require("../../../../src/cli/cli");
const testing_1 = require("../../../../src/util/testing");
describe("ToolsCommand", () => {
    let tmpDir;
    let garden;
    let log;
    const pluginA = (0, plugin_1.createGardenPlugin)({
        name: "test-a",
        dependencies: [],
        tools: [
            {
                name: "tool",
                description: "foo",
                type: "binary",
                _includeInGardenImage: false,
                builds: [
                    {
                        platform: (0, util_1.getPlatform)(),
                        architecture: (0, util_1.getArchitecture)(),
                        url: "file://" + (0, helpers_1.getDataDir)("tools", "tool-a.sh"),
                        sha256: "90b5248d2fc6106bdf3e5a66e8efd54383b6c4258725e9d455efb7ee32a64223",
                    },
                ],
            },
            {
                name: "lib",
                description: "foo",
                type: "library",
                _includeInGardenImage: false,
                builds: [
                    {
                        platform: (0, util_1.getPlatform)(),
                        architecture: (0, util_1.getArchitecture)(),
                        url: "file://" + (0, helpers_1.getDataDir)("tools", "tool-a.sh"),
                        sha256: "90b5248d2fc6106bdf3e5a66e8efd54383b6c4258725e9d455efb7ee32a64223",
                    },
                ],
            },
        ],
    });
    const pluginB = (0, plugin_1.createGardenPlugin)({
        name: "test-b",
        dependencies: [],
        tools: [
            {
                name: "tool",
                description: "foo",
                type: "binary",
                _includeInGardenImage: false,
                builds: [
                    {
                        platform: (0, util_1.getPlatform)(),
                        architecture: (0, util_1.getArchitecture)(),
                        url: "file://" + (0, helpers_1.getDataDir)("tools", "tool-b.sh"),
                        sha256: "b770f87151d8be76214960ecaa45de1b4a892930f1989f28de02bc2f44047ef5",
                    },
                ],
            },
        ],
    });
    const command = new tools_1.ToolsCommand();
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        garden = await helpers_1.TestGarden.factory(tmpDir.path, {
            plugins: [pluginA, pluginB],
            config: (0, helpers_1.createProjectConfig)({
                path: tmpDir.path,
                providers: [{ name: "test-a" }],
            }),
        });
        log = garden.log;
        const _garden = garden;
        _garden.providerConfigs = [{ name: "test-a" }];
        _garden.registeredPlugins = [pluginA, pluginB];
    });
    it("should list tools with no name specified", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { tool: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false }),
        });
        const infoLog = (0, testing_1.getLogMessages)(log, (entry) => entry.level === logger_1.LogLevel.info)
            .join("\n")
            .trim()
            .split("\n")
            .map((line) => line.trimEnd())
            .join("\n");
        (0, chai_1.expect)(infoLog).to.equal((0, string_1.dedent) `
    USAGE

      garden [global options] <tool> -- [args ...]
      garden [global options] <tool> --get-path

    PLUGIN TOOLS
      test-a.tool  [binary]   foo
      test-a.lib   [library]  foo
      test-b.tool  [binary]   foo
    `);
        (0, chai_1.expect)(result.tools).to.eql([
            {
                name: "tool",
                description: "foo",
                type: "binary",
                builds: pluginA.tools[0].builds,
                pluginName: "test-a",
            },
            {
                name: "lib",
                description: "foo",
                type: "library",
                builds: pluginA.tools[0].builds,
                pluginName: "test-a",
            },
            {
                name: "tool",
                description: "foo",
                type: "binary",
                builds: pluginB.tools[0].builds,
                pluginName: "test-b",
            },
        ]);
    });
    it("should run a configured provider's tool when using name only", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "tool": "tool", "--": ["0"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        });
        (0, chai_1.expect)(result.exitCode).to.equal(0);
        (0, chai_1.expect)(result.stdout).to.equal("test-a");
        (0, chai_1.expect)(result.stderr).to.equal("");
    });
    it("should throw on an invalid tool name", async () => {
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "tool": "51616ok3xnnz....361.2362&123", "--": ["0"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        }), {
            contains: "Invalid tool name argument. Please specify either a tool name (no periods) or <plugin name>.<tool name>.",
        });
    });
    it("should throw when plugin name is not found", async () => {
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "tool": "bla.tool", "--": ["0"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        }), { contains: "Could not find plugin bla." });
    });
    it("should throw when tool name is not found", async () => {
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "tool": "bla", "--": ["0"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        }), { contains: "Could not find tool bla." });
    });
    it("should run a tool by name when run outside of a project", async () => {
        const _garden = await (0, cli_1.makeDummyGarden)(tmpDir.path, {
            noEnterprise: true,
            commandInfo: { name: "foo", args: {}, opts: {} },
        });
        _garden.registeredPlugins = [pluginA, pluginB];
        const { result } = await command.action({
            garden: _garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "tool": "tool", "--": ["0"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        });
        (0, chai_1.expect)(result.exitCode).to.equal(0);
        (0, chai_1.expect)(result.stdout).to.equal("test-a");
        (0, chai_1.expect)(result.stderr).to.equal("");
    });
    it("should run a tool by plugin name and tool name", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "tool": "test-b.tool", "--": ["0"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        });
        (0, chai_1.expect)(result.exitCode).to.equal(0);
        (0, chai_1.expect)(result.stdout).to.equal("test-b");
        (0, chai_1.expect)(result.stderr).to.equal("");
    });
    it("should show the path of a library", async () => {
        var _a;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { tool: "test-a.lib" },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        });
        (0, chai_1.expect)((_a = result.path) === null || _a === void 0 ? void 0 : _a.endsWith("tool-a.sh")).to.be.true;
        (0, chai_1.expect)(result.exitCode).to.not.exist;
        (0, chai_1.expect)(result.stdout).to.not.exist;
        (0, chai_1.expect)(result.stderr).to.not.exist;
    });
    it("should show the path of a binary with --get-path", async () => {
        var _a;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { tool: "test-a.tool" },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": true, "output": "json" }),
        });
        (0, chai_1.expect)((_a = result.path) === null || _a === void 0 ? void 0 : _a.endsWith("tool-a.sh")).to.be.true;
        (0, chai_1.expect)(result.exitCode).to.not.exist;
        (0, chai_1.expect)(result.stdout).to.not.exist;
        (0, chai_1.expect)(result.stderr).to.not.exist;
    });
    it("should return the exit code from a command", async () => {
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { "tool": "tool", "--": ["1"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "get-path": false, "output": "json" }),
        });
        (0, chai_1.expect)(result.exitCode).to.equal(1);
        (0, chai_1.expect)(result.stdout).to.equal("test-a");
        (0, chai_1.expect)(result.stderr).to.equal("");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILG9EQUF3RTtBQUN4RSw4Q0FReUI7QUFDekIsK0JBQTZCO0FBQzdCLDBEQUFrRTtBQUNsRSwwREFBNkQ7QUFDN0QsMERBQXdEO0FBQ3hELHdEQUFvRDtBQUVwRCxpREFBeUQ7QUFDekQsMERBQTZEO0FBRTdELFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLElBQUksTUFBcUIsQ0FBQTtJQUN6QixJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxHQUFhLENBQUE7SUFFakIsTUFBTSxPQUFPLEdBQUcsSUFBQSwyQkFBa0IsRUFBQztRQUNqQyxJQUFJLEVBQUUsUUFBUTtRQUNkLFlBQVksRUFBRSxFQUFFO1FBQ2hCLEtBQUssRUFBRTtZQUNMO2dCQUNFLElBQUksRUFBRSxNQUFNO2dCQUNaLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxxQkFBcUIsRUFBRSxLQUFLO2dCQUM1QixNQUFNLEVBQUU7b0JBQ047d0JBQ0UsUUFBUSxFQUFFLElBQUEsa0JBQVcsR0FBRTt3QkFDdkIsWUFBWSxFQUFFLElBQUEsc0JBQWUsR0FBRTt3QkFDL0IsR0FBRyxFQUFFLFNBQVMsR0FBRyxJQUFBLG9CQUFVLEVBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQzt3QkFDakQsTUFBTSxFQUFFLGtFQUFrRTtxQkFDM0U7aUJBQ0Y7YUFDRjtZQUNEO2dCQUNFLElBQUksRUFBRSxLQUFLO2dCQUNYLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixJQUFJLEVBQUUsU0FBUztnQkFDZixxQkFBcUIsRUFBRSxLQUFLO2dCQUM1QixNQUFNLEVBQUU7b0JBQ047d0JBQ0UsUUFBUSxFQUFFLElBQUEsa0JBQVcsR0FBRTt3QkFDdkIsWUFBWSxFQUFFLElBQUEsc0JBQWUsR0FBRTt3QkFDL0IsR0FBRyxF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