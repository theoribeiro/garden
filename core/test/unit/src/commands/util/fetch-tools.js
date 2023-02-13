"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../../../src/util/util");
const helpers_1 = require("../../../../helpers");
const fetch_tools_1 = require("../../../../../src/commands/util/fetch-tools");
const chai_1 = require("chai");
const constants_1 = require("../../../../../src/constants");
const plugin_1 = require("../../../../../src/plugin/plugin");
const path_1 = require("path");
describe("FetchToolsCommand", () => {
    let tmpDir;
    const plugin = (0, plugin_1.createGardenPlugin)({
        name: "test",
        dependencies: [],
        tools: [
            {
                name: "tool-a",
                description: "foo",
                type: "binary",
                _includeInGardenImage: true,
                builds: [
                    {
                        platform: (0, util_1.getPlatform)(),
                        architecture: (0, util_1.getArchitecture)(),
                        url: "https://raw.githubusercontent.com/garden-io/garden/v0.11.14/.editorconfig",
                        sha256: "11f041ba6de46f9f4816afce861f0832e12ede015933f3580d0f6322d3906972",
                    },
                ],
            },
            {
                name: "tool-b",
                description: "foo",
                type: "binary",
                _includeInGardenImage: false,
                builds: [
                    {
                        platform: (0, util_1.getPlatform)(),
                        architecture: (0, util_1.getArchitecture)(),
                        url: "https://raw.githubusercontent.com/garden-io/garden/v0.12.3/.dockerignore",
                        sha256: "39d86a6cd966898b56f9ac5c701055287433db6418694fc2d95f04ac05817881",
                    },
                ],
            },
        ],
    });
    const expectedPathA = (0, path_1.join)(constants_1.GARDEN_GLOBAL_PATH, "tools", "tool-a", "058921ab05f721bb", ".editorconfig");
    const expectedPathB = (0, path_1.join)(constants_1.GARDEN_GLOBAL_PATH, "tools", "tool-b", "a8601675b580d777", ".dockerignore");
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
    });
    it("should fetch tools for configured providers", async () => {
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, {
            plugins: [plugin],
            config: (0, helpers_1.createProjectConfig)({
                path: tmpDir.path,
                providers: [{ name: "test" }],
            }),
        });
        garden.providerConfigs = [{ name: "test" }];
        garden.registeredPlugins = [plugin];
        await garden.resolveProviders(garden.log);
        const log = garden.log;
        const command = new fetch_tools_1.FetchToolsCommand();
        const result = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "all": false, "garden-image-build": false }),
        });
        (0, chai_1.expect)(result).to.eql({
            result: {
                "test.tool-a": {
                    type: "binary",
                    path: expectedPathA,
                },
                "test.tool-b": {
                    type: "binary",
                    path: expectedPathB,
                },
            },
        });
    });
    it("should fetch no tools when no providers are configured", async () => {
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, {
            plugins: [plugin],
            config: (0, helpers_1.createProjectConfig)({
                path: tmpDir.path,
                providers: [{ name: "test" }],
            }),
        });
        garden.providerConfigs = [];
        garden.registeredPlugins = [plugin];
        await garden.resolveProviders(garden.log);
        const log = garden.log;
        const command = new fetch_tools_1.FetchToolsCommand();
        const result = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "all": false, "garden-image-build": false }),
        });
        (0, chai_1.expect)(result).to.eql({
            result: {},
        });
    });
    it("should fetch tools for all providers with --all", async () => {
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, {
            plugins: [plugin],
            config: (0, helpers_1.createProjectConfig)({
                path: tmpDir.path,
            }),
        });
        garden.providerConfigs = [];
        garden.registeredPlugins = [plugin];
        await garden.resolveProviders(garden.log);
        const log = garden.log;
        const command = new fetch_tools_1.FetchToolsCommand();
        const result = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "all": true, "garden-image-build": false }),
        });
        (0, chai_1.expect)(result).to.eql({
            result: {
                "test.tool-a": {
                    type: "binary",
                    path: expectedPathA,
                },
                "test.tool-b": {
                    type: "binary",
                    path: expectedPathB,
                },
            },
        });
    });
    it("should fetch only tools marked for pre-fetch when --garden-image-build is set", async () => {
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, {
            plugins: [plugin],
            config: (0, helpers_1.createProjectConfig)({
                path: tmpDir.path,
            }),
        });
        garden.providerConfigs = [];
        garden.registeredPlugins = [plugin];
        await garden.resolveProviders(garden.log);
        const log = garden.log;
        const command = new fetch_tools_1.FetchToolsCommand();
        const result = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "all": true, "garden-image-build": true }),
        });
        (0, chai_1.expect)(result).to.eql({
            result: {
                "test.tool-a": {
                    type: "binary",
                    path: expectedPathA,
                },
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmV0Y2gtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmZXRjaC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILHVEQUEyRTtBQUMzRSxpREFBd0g7QUFDeEgsOEVBQWdGO0FBQ2hGLCtCQUE2QjtBQUM3Qiw0REFBaUU7QUFDakUsNkRBQXFFO0FBQ3JFLCtCQUEyQjtBQUUzQixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLElBQUksTUFBcUIsQ0FBQTtJQUV6QixNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFrQixFQUFDO1FBQ2hDLElBQUksRUFBRSxNQUFNO1FBQ1osWUFBWSxFQUFFLEVBQUU7UUFDaEIsS0FBSyxFQUFFO1lBQ0w7Z0JBQ0UsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLElBQUksRUFBRSxRQUFRO2dCQUNkLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLE1BQU0sRUFBRTtvQkFDTjt3QkFDRSxRQUFRLEVBQUUsSUFBQSxrQkFBVyxHQUFFO3dCQUN2QixZQUFZLEVBQUUsSUFBQSxzQkFBZSxHQUFFO3dCQUMvQixHQUFHLEVBQUUsMkVBQTJFO3dCQUNoRixNQUFNLEVBQUUsa0VBQWtFO3FCQUMzRTtpQkFDRjthQUNGO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLElBQUksRUFBRSxRQUFRO2dCQUNkLHFCQUFxQixFQUFFLEtBQUs7Z0JBQzVCLE1BQU0sRUFBRTtvQkFDTjt3QkFDRSxRQUFRLEVBQUUsSUFBQSxrQkFBVyxHQUFFO3dCQUN2QixZQUFZLEVBQUUsSUFBQSxzQkFBZSxHQUFFO3dCQUMvQixHQUFHLEVBQUUsMEVBQTBFO3dCQUMvRSxNQUFNLEVBQUUsa0VBQWtFO3FCQUMzRTtpQkFDRjthQUNGO1NBQ0Y7S0FDRixDQUFDLENBQUE7SUFFRixNQUFNLGFBQWEsR0FBRyxJ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