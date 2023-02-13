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
const helpers_1 = require("../../../../helpers");
const source_1 = require("../../../../../src/commands/link/source");
const module_1 = require("../../../../../src/commands/link/module");
const get_linked_repos_1 = require("../../../../../src/commands/get/get-linked-repos");
describe("GetLinkedReposCommand", () => {
    let garden;
    afterEach(async () => {
        await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
    });
    it("should list all linked project sources in the project", async () => {
        garden = await (0, helpers_1.makeExtProjectSourcesGarden)();
        const log = garden.log;
        const sourcesDir = (0, helpers_1.getDataDir)("test-project-local-project-sources");
        const linkSourceCmd = new source_1.LinkSourceCommand();
        const sourceNames = ["source-a", "source-b", "source-c"];
        for (const sourceName of sourceNames) {
            await linkSourceCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { source: sourceName, path: (0, path_1.join)(sourcesDir, sourceName) },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
        }
        const getLinkedReposCommand = new get_linked_repos_1.GetLinkedReposCommand();
        const results = await getLinkedReposCommand.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        const expected = sourceNames.map((name) => {
            return { name, path: (0, path_1.join)(sourcesDir, name) };
        });
        (0, chai_1.expect)(results.result).to.eql(expected);
    });
    it("should list all linked modules in the project", async () => {
        garden = await (0, helpers_1.makeExtModuleSourcesGarden)();
        const log = garden.log;
        const sourcesDir = (0, helpers_1.getDataDir)("test-project-local-module-sources");
        const linkModuleCmd = new module_1.LinkModuleCommand();
        const sourceNames = ["module-a", "module-b", "module-c"];
        for (const moduleName of sourceNames) {
            await linkModuleCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { module: moduleName, path: (0, path_1.join)(sourcesDir, moduleName) },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
        }
        const getLinkedReposCommand = new get_linked_repos_1.GetLinkedReposCommand();
        const results = await getLinkedReposCommand.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        const expected = sourceNames.map((name) => {
            return { name, path: (0, path_1.join)(sourcesDir, name) };
        });
        (0, chai_1.expect)(results.result).to.eql(expected);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWxpbmtlZC1yZXBvcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC1saW5rZWQtcmVwb3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsK0JBQTJCO0FBQzNCLGlEQU80QjtBQUM1QixvRUFBMkU7QUFDM0Usb0VBQTJFO0FBQzNFLHVGQUF3RjtBQUV4RixRQUFRLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO0lBQ3JDLElBQUksTUFBa0IsQ0FBQTtJQUV0QixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxJQUFBLDBCQUFnQixFQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQTtJQUM5QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyRSxNQUFNLEdBQUcsTUFBTSxJQUFBLHFDQUEyQixHQUFFLENBQUE7UUFDNUMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUN0QixNQUFNLFVBQVUsR0FBRyxJQUFBLG9CQUFVLEVBQUMsb0NBQW9DLENBQUMsQ0FBQTtRQUNuRSxNQUFNLGFBQWEsR0FBRyxJQUFJLDBCQUFpQixFQUFFLENBQUE7UUFDN0MsTUFBTSxXQUFXLEdBQUcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1FBQ3hELEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFO1lBQ3BDLE1BQU0sYUFBYSxDQUFDLE1BQU0sQ0FBQztnQkFDekIsTUFBTTtnQkFDTixHQUFHO2dCQUNILFNBQVMsRUFBRSxHQUFHO2dCQUNkLFNBQVMsRUFBRSxHQUFHO2dCQUNkLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRTtnQkFDaEUsSUFBSSxFQUFFLElB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