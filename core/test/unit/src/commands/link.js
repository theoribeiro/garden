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
const helpers_1 = require("../../../helpers");
const source_1 = require("../../../../src/commands/link/source");
const fs_extra_1 = require("fs-extra");
describe("LinkCommand", () => {
    let garden;
    let log;
    describe("LinkModuleCommand", () => {
        const cmd = new module_1.LinkModuleCommand();
        beforeEach(async () => {
            garden = await (0, helpers_1.makeExtModuleSourcesGarden)();
            log = garden.log;
        });
        afterEach(async () => {
            await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
        });
        it("should link external modules", async () => {
            const localModulePath = (0, path_1.join)((0, helpers_1.getDataDir)("test-project-local-module-sources"), "module-a");
            await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    module: "module-a",
                    path: localModulePath,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            const linkedModuleSources = await garden.configStore.get("linkedModuleSources");
            (0, chai_1.expect)(linkedModuleSources).to.eql({
                "module-a": {
                    name: "module-a",
                    path: localModulePath,
                },
            });
        });
        it("should handle relative paths", async () => {
            const localModulePath = (0, path_1.resolve)(garden.projectRoot, "..", "test-project-local-module-sources", "module-a");
            await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    module: "module-a",
                    path: (0, path_1.join)("..", "test-project-local-module-sources", "module-a"),
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            const linkedModuleSources = await garden.configStore.get("linkedModuleSources");
            (0, chai_1.expect)(linkedModuleSources).to.eql({
                "module-a": {
                    name: "module-a",
                    path: localModulePath,
                },
            });
        });
        it("should throw if module to link does not have an external source", async () => {
            await (0, helpers_1.expectError)(async () => cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    module: "banana",
                    path: "",
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            }), "parameter");
        });
        it("should return linked module sources", async () => {
            const path = (0, path_1.resolve)("..", "test-project-local-module-sources", "module-a");
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    module: "module-a",
                    path,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            (0, chai_1.expect)(cmd.outputsSchema().validate(result).error).to.be.undefined;
            (0, chai_1.expect)(result).to.eql({
                sources: [
                    {
                        name: "module-a",
                        path,
                    },
                ],
            });
        });
    });
    describe("LinkSourceCommand", () => {
        const cmd = new source_1.LinkSourceCommand();
        let localSourcePath;
        before(async () => {
            garden = await (0, helpers_1.makeExtProjectSourcesGarden)();
            localSourcePath = (0, path_1.resolve)(garden.projectRoot, "..", "test-project-local-project-sources");
            await (0, fs_extra_1.copy)((0, helpers_1.getDataDir)("test-project-local-project-sources"), localSourcePath);
            log = garden.log;
        });
        afterEach(async () => {
            await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
        });
        it("should link external sources", async () => {
            await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    source: "source-a",
                    path: localSourcePath,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            const linkedProjectSources = await garden.configStore.get("linkedProjectSources");
            (0, chai_1.expect)(linkedProjectSources).to.eql({
                "source-a": {
                    name: "source-a",
                    path: localSourcePath,
                },
            });
        });
        it("should handle relative paths", async () => {
            await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    source: "source-a",
                    path: (0, path_1.join)("..", "test-project-local-project-sources"),
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            const linkedProjectSources = await garden.configStore.get("linkedProjectSources");
            (0, chai_1.expect)(linkedProjectSources).to.eql({
                "source-a": {
                    name: "source-a",
                    path: localSourcePath,
                },
            });
        });
        it("should return linked sources", async () => {
            const path = localSourcePath;
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {
                    source: "source-a",
                    path,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            (0, chai_1.expect)(cmd.outputsSchema().validate(result).error).to.be.undefined;
            (0, chai_1.expect)(result).to.eql({
                sources: [
                    {
                        name: "source-a",
                        path,
                    },
                ],
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpbmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsK0JBQW9DO0FBRXBDLGlFQUF3RTtBQUN4RSw4Q0FPeUI7QUFDekIsaUVBQXdFO0FBR3hFLHVDQUErQjtBQUUvQixRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixJQUFJLE1BQWMsQ0FBQTtJQUNsQixJQUFJLEdBQWEsQ0FBQTtJQUVqQixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLE1BQU0sR0FBRyxHQUFHLElBQUksMEJBQWlCLEVBQUUsQ0FBQTtRQUVuQyxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDcEIsTUFBTSxHQUFHLE1BQU0sSUFBQSxvQ0FBMEIsR0FBRSxDQUFBO1lBQzNDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ2xCLENBQUMsQ0FBQyxDQUFBO1FBRUYsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sSUFBQSwwQkFBZ0IsRUFBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDOUMsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsOEJBQThCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUMsTUFBTSxlQUFlLEdBQUcsSUFBQSxXQUFJLEVBQUMsSUFBQSxvQkFBVSxFQUFDLG1DQUFtQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUE7WUFFekYsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDO2dCQUNmLE1BQU07Z0JBQ04sR0FBRztnQkFDSCxTQUFTLEVBQUUsR0FBRztnQkFDZCxTQUFTLEVBQUUsR0FBRztnQkFDZCxJQUFJLEVBQUU7b0JBQ0osTUFBTSxFQUFFLFVBQVU7b0JBQ2xCLElBQUksRUFBRSxlQUFlO2lCQUN0QjtnQkFDRCxJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxF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