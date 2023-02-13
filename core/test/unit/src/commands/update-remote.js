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
const testdouble_1 = __importDefault(require("testdouble"));
const chai_1 = require("chai");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const helpers_1 = require("../../../helpers");
const sources_1 = require("../../../../src/commands/update-remote/sources");
const modules_1 = require("../../../../src/commands/update-remote/modules");
function withDefaultOpts(opts) {
    return (0, helpers_1.withDefaultGlobalOpts)({ parallel: false, ...opts });
}
describe("UpdateRemoteCommand", () => {
    describe("UpdateRemoteSourcesCommand", () => {
        let garden;
        let log;
        const cmd = new sources_1.UpdateRemoteSourcesCommand();
        before(async () => {
            garden = await (0, helpers_1.makeExtProjectSourcesGarden)();
            log = garden.log;
        });
        beforeEach(async () => {
            testdouble_1.default.replace(garden.vcs, "updateRemoteSource", async () => undefined);
        });
        it("should update all project sources", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: undefined },
                opts: withDefaultOpts({}),
            });
            (0, chai_1.expect)(cmd.outputsSchema().validate(result).error).to.be.undefined;
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["source-a", "source-b", "source-c"]);
        });
        it("should update all project sources in parallel if supplied", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: undefined },
                opts: withDefaultOpts({ parallel: true }),
            });
            (0, chai_1.expect)(cmd.outputsSchema().validate(result).error).to.be.undefined;
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["source-a", "source-b", "source-c"]);
        });
        it("should update the specified project sources", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: ["source-a"] },
                opts: withDefaultOpts({}),
            });
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["source-a"]);
        });
        it("should update the specified project sources in parallel if supplied", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: ["source-a"] },
                opts: withDefaultOpts({ parallel: true }),
            });
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["source-a"]);
        });
        it("should remove stale remote project sources", async () => {
            const stalePath = (0, path_1.join)(garden.gardenDirPath, "sources", "project", "stale-source");
            await (0, fs_extra_1.mkdirp)(stalePath);
            await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: undefined },
                opts: withDefaultOpts({}),
            });
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(stalePath)).to.be.false;
        });
        it("should throw if project source is not found", async () => {
            await (0, helpers_1.expectError)(async () => await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { sources: ["banana"] },
                opts: withDefaultOpts({}),
            }), "parameter");
        });
    });
    describe("UpdateRemoteModulesCommand", () => {
        let garden;
        let log;
        const cmd = new modules_1.UpdateRemoteModulesCommand();
        beforeEach(async () => {
            garden = await (0, helpers_1.makeExtModuleSourcesGarden)();
            testdouble_1.default.replace(garden.vcs, "updateRemoteSource", async () => undefined);
            log = garden.log;
        });
        it("should update all modules sources", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: undefined },
                opts: withDefaultOpts({}),
            });
            (0, chai_1.expect)(cmd.outputsSchema().validate(result).error).to.be.undefined;
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["module-a", "module-b", "module-c"]);
        });
        it("should update all modules sources in parallel if supplied", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: undefined },
                opts: withDefaultOpts({ parallel: true }),
            });
            (0, chai_1.expect)(cmd.outputsSchema().validate(result).error).to.be.undefined;
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["module-a", "module-b", "module-c"]);
        });
        it("should update the specified module sources", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: ["module-a"] },
                opts: withDefaultOpts({}),
            });
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["module-a"]);
        });
        it("should update the specified module sources in parallel if supplied", async () => {
            const { result } = await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: ["module-a"] },
                opts: withDefaultOpts({ parallel: true }),
            });
            (0, chai_1.expect)(result.sources.map((s) => s.name).sort()).to.eql(["module-a"]);
        });
        it("should remove stale remote module sources", async () => {
            const stalePath = (0, path_1.join)(garden.gardenDirPath, "sources", "module", "stale-source");
            await (0, fs_extra_1.mkdirp)(stalePath);
            await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: undefined },
                opts: withDefaultOpts({}),
            });
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(stalePath)).to.be.false;
        });
        it("should throw if module source is not found", async () => {
            await (0, helpers_1.expectError)(async () => await cmd.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: { modules: ["banana"] },
                opts: withDefaultOpts({}),
            }), "parameter");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLXJlbW90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVwZGF0ZS1yZW1vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCw0REFBMkI7QUFDM0IsK0JBQTZCO0FBQzdCLCtCQUEyQjtBQUMzQix1Q0FBNkM7QUFFN0MsOENBS3lCO0FBQ3pCLDRFQUEyRjtBQUMzRiw0RUFBMkY7QUFJM0YsU0FBUyxlQUFlLENBQUMsSUFBUztJQUNoQyxPQUFPLElBQUEsK0JBQXFCLEVBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUM1RCxDQUFDO0FBRUQsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtJQUNuQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1FBQzFDLElBQUksTUFBYyxDQUFBO1FBQ2xCLElBQUksR0FBYSxDQUFBO1FBQ2pCLE1BQU0sR0FBRyxHQUFHLElBQUksb0NBQTBCLEVBQUUsQ0FBQTtRQUU1QyxNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBQSxxQ0FBMkIsR0FBRSxDQUFBO1lBQzVDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ2xCLENBQUMsQ0FBQyxDQUFBO1FBRUYsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ3BCLG9CQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUNyRSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDO2dCQUNsQyxNQUFNO2dCQUNOLEdBQUc7Z0JBQ0gsU0FB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