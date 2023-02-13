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
const module_1 = require("../../../../src/commands/link/module");
const module_2 = require("../../../../src/commands/unlink/module");
const helpers_1 = require("../../../helpers");
const source_1 = require("../../../../src/commands/link/source");
const source_2 = require("../../../../src/commands/unlink/source");
describe("UnlinkCommand", () => {
    let garden;
    let log;
    describe("UnlinkModuleCommand", () => {
        const linkCmd = new module_1.LinkModuleCommand();
        const unlinkCmd = new module_2.UnlinkModuleCommand();
        const linkedModulePathA = (0, path_1.join)((0, helpers_1.getDataDir)("test-project-local-module-sources"), "module-a");
        const linkedModulePathB = (0, path_1.join)((0, helpers_1.getDataDir)("test-project-local-module-sources"), "module-b");
        const linkedModulePathC = (0, path_1.join)((0, helpers_1.getDataDir)("test-project-local-module-sources"), "module-c");
        before(async () => {
            garden = await (0, helpers_1.makeExtModuleSourcesGarden)();
            log = garden.log;
        });
        beforeEach(async () => {
            await linkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    module: "module-a",
                    path: linkedModulePathA,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            await linkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    module: "module-b",
                    path: linkedModulePathB,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            await linkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    module: "module-c",
                    path: linkedModulePathC,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
        });
        afterEach(async () => {
            await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
        });
        it("should unlink the provided modules", async () => {
            await unlinkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: ["module-a", "module-b"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ all: false }),
            });
            const linkedModuleSources = await garden.configStore.get("linkedModuleSources");
            (0, chai_1.expect)(linkedModuleSources).to.eql({
                "module-c": {
                    name: "module-c",
                    path: linkedModulePathC,
                },
            });
        });
        it("should unlink all modules", async () => {
            await unlinkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: undefined },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ all: true }),
            });
            const linkedModuleSources = await garden.configStore.get("linkedModuleSources");
            (0, chai_1.expect)(linkedModuleSources).to.eql({});
        });
    });
    describe("UnlinkSourceCommand", () => {
        const linkCmd = new source_1.LinkSourceCommand();
        const unlinkCmd = new source_2.UnlinkSourceCommand();
        const linkedSourcePathA = (0, path_1.join)((0, helpers_1.getDataDir)("test-project-local-project-sources"), "source-a");
        const linkedSourcePathB = (0, path_1.join)((0, helpers_1.getDataDir)("test-project-local-project-sources"), "source-b");
        const linkedSourcePathC = (0, path_1.join)((0, helpers_1.getDataDir)("test-project-local-project-sources"), "source-c");
        before(async () => {
            garden = await (0, helpers_1.makeExtProjectSourcesGarden)();
            log = garden.log;
        });
        beforeEach(async () => {
            await linkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    source: "source-a",
                    path: linkedSourcePathA,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            await linkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    source: "source-b",
                    path: linkedSourcePathB,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            await linkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    source: "source-c",
                    path: linkedSourcePathC,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
        });
        afterEach(async () => {
            await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
        });
        it("should unlink the provided sources", async () => {
            await unlinkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: ["source-a", "source-b"] },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ all: false }),
            });
            const linkedProjectSources = await garden.configStore.get("linkedProjectSources");
            (0, chai_1.expect)(linkedProjectSources).to.eql({
                "source-c": {
                    name: "source-c",
                    path: linkedSourcePathC,
                },
            });
        });
        it("should unlink all sources", async () => {
            await unlinkCmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: undefined },
                opts: (0, helpers_1.withDefaultGlobalOpts)({ all: true }),
            });
            const linkedProjectSources = await garden.configStore.get("linkedProjectSources");
            (0, chai_1.expect)(linkedProjectSources).to.eql({});
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5saW5rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidW5saW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLCtCQUEyQjtBQUUzQixpRUFBd0U7QUFDeEUsbUVBQTRFO0FBQzVFLDhDQU15QjtBQUN6QixpRUFBd0U7QUFDeEUsbUVBQTRFO0FBSTVFLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO0lBQzdCLElBQUksTUFBYyxDQUFBO0lBQ2xCLElBQUksR0FBYSxDQUFBO0lBRWpCLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFDbkMsTUFBTSxPQUFPLEdBQUcsSUFBSSwwQkFBaUIsRUFBRSxDQUFBO1FBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUksNEJBQW1CLEVBQUUsQ0FBQTtRQUMzQyxNQUFNLGlCQUFpQixHQUFHLElBQUEsV0FBSSxFQUFDLElBQUEsb0JBQVUsRUFBQyxtQ0FBbUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFBO1FBQzNGLE1BQU0saUJBQWlCLEdBQUcsSUFBQSxXQUFJLEVBQUMsSUFBQSxvQkFBVSxFQUFDLG1DQUFtQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDM0YsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLFdBQUksRUFBQyxJQUFBLG9CQUFVLEVBQUMsbUNBQW1DLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQTtRQUUzRixNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBQSxvQ0FBMEIsR0FBRSxDQUFBO1lBQzNDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ2xCLENBQUMsQ0FBQyxDQUFBO1FBRUYsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ3BCLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFDbkIsTUFBTTtnQkFDTixHQUFHO2dCQUNILFNBQVMsRUFBRSxHQUFHO2dC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