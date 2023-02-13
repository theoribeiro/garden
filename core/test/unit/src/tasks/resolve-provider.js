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
const plugin_1 = require("../../../../src/plugin/plugin");
const plugins_1 = require("../../../../src/plugins");
const chai_1 = require("chai");
const lodash_1 = require("lodash");
const helpers_1 = require("../../../helpers");
const resolve_provider_1 = require("../../../../src/tasks/resolve-provider");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const v8_1 = require("v8");
const moment_1 = __importDefault(require("moment"));
const results_1 = require("../../../../src/graph/results");
describe("ResolveProviderTask", () => {
    let tmpDir;
    let garden;
    let task;
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    beforeEach(async () => {
        await (0, fs_extra_1.remove)((0, path_1.join)(tmpDir.path, "cache"));
        garden = await (0, helpers_1.makeTestGarden)(tmpDir.path, {
            config: (0, helpers_1.createProjectConfig)({
                path: tmpDir.path,
                providers: [{ name: "test-plugin" }],
            }),
        });
        const plugin = await garden.getPlugin("test-plugin");
        const config = garden.getRawProviderConfigs(["test-plugin"])[0];
        task = new resolve_provider_1.ResolveProviderTask({
            garden,
            log: garden.log,
            plugin,
            config,
            version: garden.version,
            forceRefresh: false,
            forceInit: false,
            allPlugins: await garden.getAllPlugins(),
            force: false,
        });
    });
    it("should resolve status if no cached status exists", async () => {
        const provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        (0, chai_1.expect)(provider.status.cached).to.be.undefined;
    });
    it("should cache the provider status", async () => {
        await task.process({ dependencyResults: new results_1.GraphResults([]) });
        const cachePath = task["getCachePath"]();
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(cachePath)).to.be.true;
    });
    it("should not cache the provider status if disableCache=true", async () => {
        await (0, helpers_1.stubProviderAction)(garden, "test-plugin", "getEnvironmentStatus", async () => {
            return { ready: true, disableCache: true, outputs: {} };
        });
        await task.process({ dependencyResults: new results_1.GraphResults([]) });
        const cachePath = task["getCachePath"]();
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(cachePath)).to.be.true;
    });
    it("should return with cached provider status if the config hash matches and TTL is within range", async () => {
        await task.process({ dependencyResults: new results_1.GraphResults([]) });
        const provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        (0, chai_1.expect)(provider.status.cached).to.be.true;
    });
    it("should not use cached status if the cached data is invalid", async () => {
        const cachePath = task["getCachePath"]();
        await (0, fs_extra_1.writeFile)(cachePath, (0, v8_1.serialize)({ foo: "bla" }));
        const provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        (0, chai_1.expect)(provider.status.cached).to.be.undefined;
    });
    it("should not use cached status if the config hash doesn't match", async () => {
        let provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        const cachedStatus = await task["getCachedStatus"](provider.config);
        const cachePath = task["getCachePath"]();
        await (0, fs_extra_1.writeFile)(cachePath, (0, v8_1.serialize)({ ...cachedStatus, configHash: "abcdef", resolvedAt: new Date() }));
        provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        (0, chai_1.expect)(provider.status.cached).to.be.undefined;
    });
    it("should use cached status if the cache is just within the TTL", async () => {
        let provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        const cachedStatus = await task["getCachedStatus"](provider.config);
        // Just over one hour, which is the default TTL
        const resolvedAt = (0, moment_1.default)().subtract(3500, "seconds").toDate();
        const configHash = task["hashConfig"](provider.config);
        const cachePath = task["getCachePath"]();
        await (0, fs_extra_1.writeFile)(cachePath, (0, v8_1.serialize)({ ...cachedStatus, configHash, resolvedAt }));
        provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        (0, chai_1.expect)(provider.status.cached).to.be.true;
    });
    it("should not use cached status if the cache is expired", async () => {
        let provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        const cachedStatus = await task["getCachedStatus"](provider.config);
        // Just over one hour, which is the default TTL
        const resolvedAt = (0, moment_1.default)().subtract(3601, "seconds").toDate();
        const configHash = task["hashConfig"](provider.config);
        const cachePath = task["getCachePath"]();
        await (0, fs_extra_1.writeFile)(cachePath, (0, v8_1.serialize)({ ...cachedStatus, configHash, resolvedAt }));
        provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        (0, chai_1.expect)(provider.status.cached).to.be.undefined;
    });
    it("should not use cached status if forceRefresh=true", async () => {
        await task.process({ dependencyResults: new results_1.GraphResults([]) });
        task["forceRefresh"] = true;
        const provider = await task.process({ dependencyResults: new results_1.GraphResults([]) });
        (0, chai_1.expect)(provider.status.cached).to.be.undefined;
    });
});
describe("getPluginBases", () => {
    it("should return an empty list if plugin has no base", () => {
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "foo",
        });
        const plugins = {
            foo: plugin,
        };
        (0, chai_1.expect)((0, plugins_1.getPluginBases)(plugin, plugins)).to.eql([]);
    });
    it("should return the base if there is a single base", () => {
        const base = (0, plugin_1.createGardenPlugin)({
            name: "base",
        });
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "foo",
            base: "base",
        });
        const plugins = {
            foo: plugin,
            base,
        };
        (0, chai_1.expect)((0, plugins_1.getPluginBases)(plugin, plugins)).to.eql([base]);
    });
    it("should recursively return all bases for a plugin", () => {
        const baseA = (0, plugin_1.createGardenPlugin)({
            name: "base-a",
        });
        const baseB = (0, plugin_1.createGardenPlugin)({
            name: "base-b",
            base: "base-a",
        });
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "foo",
            base: "base-b",
        });
        const plugins = {
            "foo": plugin,
            "base-a": baseA,
            "base-b": baseB,
        };
        (0, chai_1.expect)((0, lodash_1.sortBy)((0, plugins_1.getPluginBases)(plugin, plugins), "name")).to.eql([baseA, baseB]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlc29sdmUtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCwwREFBNkU7QUFDN0UscURBQXdEO0FBQ3hELCtCQUE2QjtBQUM3QixtQ0FBK0I7QUFDL0IsOENBT3lCO0FBQ3pCLDZFQUE0RTtBQUM1RSx1Q0FBd0Q7QUFDeEQsK0JBQTJCO0FBQzNCLDJCQUE4QjtBQUM5QixvREFBMkI7QUFDM0IsMkRBQTREO0FBRTVELFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkMsSUFBSSxNQUFxQixDQUFBO0lBQ3pCLElBQUksTUFBa0IsQ0FBQTtJQUN0QixJQUFJLElBQXlCLENBQUE7SUFFN0IsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQVcsRUFBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDakUsQ0FBQyxDQUFDLENBQUE7SUFFRixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDZixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUN4QixDQUFDLENBQUMsQ0FBQTtJQUVGLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLElBQUEsaUJBQU0sRUFBQyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUE7UUFFeEMsTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDekMsTUFBTSxFQUFFLElBQUEsNkJBQW1CLEVBQUM7Z0JBQzFCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtnQkFDakIsU0FBUyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUM7YUFD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