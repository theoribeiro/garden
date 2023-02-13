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
const ext_source_util_1 = require("../../../../src/util/ext-source-util");
const helpers_1 = require("../../../helpers");
const path_1 = require("path");
describe("ext-source-util", () => {
    let garden;
    const sourcesObj = {
        "name-a": { name: "name-a", path: "path-a" },
        "name-b": { name: "name-b", path: "path-b" },
    };
    const sourcesList = [
        { name: "name-a", path: "path-a" },
        { name: "name-b", path: "path-b" },
    ];
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
    });
    describe("getExtSourcesDirName", () => {
        it("should return the relative path to the remote projects directory", () => {
            const dirName = (0, ext_source_util_1.getRemoteSourcesDirname)("project");
            (0, chai_1.expect)(dirName).to.equal((0, path_1.join)("sources", "project"));
        });
        it("should return the relative path to the remote modules directory", () => {
            const dirName = (0, ext_source_util_1.getRemoteSourcesDirname)("module");
            (0, chai_1.expect)(dirName).to.equal((0, path_1.join)("sources", "module"));
        });
    });
    describe("getRemoteSourceRelPath", () => {
        it("should return the relative path to a remote project source", () => {
            const url = "banana";
            const urlHash = (0, ext_source_util_1.hashRepoUrl)(url);
            const path = (0, ext_source_util_1.getRemoteSourceRelPath)({
                url,
                name: "my-source",
                sourceType: "project",
            });
            (0, chai_1.expect)(path).to.equal((0, path_1.join)("sources", "project", `my-source--${urlHash}`));
        });
        it("should return the relative path to a remote module source", () => {
            const url = "banana";
            const urlHash = (0, ext_source_util_1.hashRepoUrl)(url);
            const path = (0, ext_source_util_1.getRemoteSourceRelPath)({
                url,
                name: "my-module",
                sourceType: "module",
            });
            (0, chai_1.expect)(path).to.equal((0, path_1.join)("sources", "module", `my-module--${urlHash}`));
        });
    });
    describe("getLinkedSources", () => {
        it("should get linked project sources", async () => {
            await garden.configStore.set("linkedProjectSources", sourcesObj);
            (0, chai_1.expect)(await (0, ext_source_util_1.getLinkedSources)(garden, "project")).to.eql(sourcesList);
        });
        it("should get linked module sources", async () => {
            await garden.configStore.set("linkedModuleSources", sourcesObj);
            (0, chai_1.expect)(await (0, ext_source_util_1.getLinkedSources)(garden, "module")).to.eql(sourcesList);
        });
    });
    describe("addLinkedSources", () => {
        it("should add linked project sources to local config", async () => {
            await (0, ext_source_util_1.addLinkedSources)({ garden, sourceType: "project", sources: sourcesList });
            (0, chai_1.expect)(await garden.configStore.get("linkedProjectSources")).to.eql(sourcesObj);
        });
        it("should add linked module sources to local config", async () => {
            await (0, ext_source_util_1.addLinkedSources)({ garden, sourceType: "module", sources: sourcesList });
            (0, chai_1.expect)(await garden.configStore.get("linkedModuleSources")).to.eql(sourcesObj);
        });
        it("should append sources to local config if key already has value", async () => {
            const { configStore: localConfigStore } = garden;
            await localConfigStore.set("linkedModuleSources", sourcesObj);
            await (0, ext_source_util_1.addLinkedSources)({
                garden,
                sourceType: "module",
                sources: [{ name: "name-c", path: "path-c" }],
            });
            (0, chai_1.expect)(await garden.configStore.get("linkedModuleSources")).to.eql({
                ...sourcesObj,
                "name-c": {
                    name: "name-c",
                    path: "path-c",
                },
            });
        });
    });
    describe("removeLinkedSources", () => {
        it("should remove linked project sources from local config", async () => {
            await garden.configStore.set("linkedModuleSources", sourcesObj);
            const names = ["name-a"];
            await (0, ext_source_util_1.removeLinkedSources)({ garden, sourceType: "module", names });
            (0, chai_1.expect)(await garden.configStore.get("linkedModuleSources")).to.eql({
                "name-b": {
                    name: "name-b",
                    path: "path-b",
                },
            });
        });
        it("should remove linked module sources from local config", async () => {
            await garden.configStore.set("linkedProjectSources", sourcesObj);
            const names = ["name-a"];
            await (0, ext_source_util_1.removeLinkedSources)({ garden, sourceType: "project", names });
            (0, chai_1.expect)(await garden.configStore.get("linkedProjectSources")).to.eql({
                "name-b": {
                    name: "name-b",
                    path: "path-b",
                },
            });
        });
        it("should remove multiple sources from local config", async () => {
            await garden.configStore.set("linkedModuleSources", {
                ...sourcesObj,
                "name-c": {
                    name: "name-c",
                    path: "path-c",
                },
            });
            const names = ["name-a", "name-b"];
            await (0, ext_source_util_1.removeLinkedSources)({ garden, sourceType: "module", names });
            (0, chai_1.expect)(await garden.configStore.get("linkedModuleSources")).to.eql({
                "name-c": {
                    name: "name-c",
                    path: "path-c",
                },
            });
        });
        it("should throw if source not currently linked", async () => {
            const names = ["banana"];
            await (0, helpers_1.expectError)(async () => await (0, ext_source_util_1.removeLinkedSources)({ garden, sourceType: "project", names }), "parameter");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0LXNvdXJjZS11dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXh0LXNvdXJjZS11dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBRTdCLDBFQU82QztBQUM3Qyw4Q0FBK0Q7QUFFL0QsK0JBQTJCO0FBRTNCLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsSUFBSSxNQUFjLENBQUE7SUFDbEIsTUFBTSxVQUFVLEdBQUc7UUFDakIsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzVDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtLQUM3QyxDQUFBO0lBQ0QsTUFBTSxXQUFXLEdBQUc7UUFDbEIsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDbEMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7S0FDbkMsQ0FBQTtJQUVELFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtJQUNsQyxDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFDcEMsRUFBRSxDQUFDLGtFQUFrRSxFQUFFLEdBQUcsRUFBRTtZQUMxRSxNQUFNLE9BQU8sR0FBRyxJQUFBLHlDQUF1QixFQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQ2xELElBQUEsYUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUE7UUFDdEQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsaUVBQWlFLEVBQUUsR0FB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