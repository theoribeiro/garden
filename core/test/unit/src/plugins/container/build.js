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
const testdouble_1 = __importDefault(require("testdouble"));
const build_1 = require("../../../../../src/plugins/container/build");
const container_1 = require("../../../../../src/plugins/container/container");
const helpers_1 = require("../../../../../src/plugins/container/helpers");
const fs_1 = require("../../../../../src/util/fs");
const helpers_2 = require("../../../../helpers");
context("build.ts", () => {
    const projectRoot = (0, helpers_2.getDataDir)("test-project-container");
    let garden;
    let ctx;
    let log;
    let containerProvider;
    let graph;
    beforeEach(async () => {
        garden = await (0, helpers_2.makeTestGarden)(projectRoot, { plugins: [(0, container_1.gardenPlugin)()] });
        log = garden.log;
        containerProvider = await garden.resolveProvider(garden.log, "container");
        ctx = await garden.getPluginContext({ provider: containerProvider, templateContext: undefined, events: undefined });
        graph = await garden.getConfigGraph({ log, emit: false });
    });
    const getAction = async () => await garden.resolveAction({ action: graph.getBuild("module-a"), log, graph });
    describe("getContainerBuildStatus", () => {
        it("should return ready if build exists locally", async () => {
            const action = await getAction();
            testdouble_1.default.replace(helpers_1.containerHelpers, (0, helpers_2.getPropertyName)(helpers_1.containerHelpers, (c) => c.imageExistsLocally), async () => "fake image identifier string");
            const result = await (0, build_1.getContainerBuildStatus)({ ctx, log, action });
            (0, chai_1.expect)(result.state).to.eql("ready");
        });
        it("should return not-ready if build does not exist locally", async () => {
            const action = await getAction();
            testdouble_1.default.replace(helpers_1.containerHelpers, (0, helpers_2.getPropertyName)(helpers_1.containerHelpers, (c) => c.imageExistsLocally), async () => null);
            const result = await (0, build_1.getContainerBuildStatus)({ ctx, log, action });
            (0, chai_1.expect)(result.state).to.eql("not-ready");
        });
    });
    describe("buildContainer", () => {
        beforeEach(() => {
            testdouble_1.default.replace(helpers_1.containerHelpers, "checkDockerServerVersion", () => null);
        });
        function getCmdArgs(action, buildPath) {
            return [
                "build",
                "-t",
                "some/image",
                "--build-arg",
                `GARDEN_MODULE_VERSION=${action.versionString()}`,
                "--build-arg",
                `GARDEN_BUILD_VERSION=${action.versionString()}`,
                "--file",
                (0, fs_1.joinWithPosix)(action.getBuildPath(), action.getSpec().dockerfile),
                buildPath,
            ];
        }
        it("should build image if module contains Dockerfile", async () => {
            var _a, _b;
            const action = await getAction();
            testdouble_1.default.replace(action, "getOutputs", () => ({ localImageId: "some/image" }));
            const buildPath = action.getBuildPath();
            const cmdArgs = getCmdArgs(action, buildPath);
            testdouble_1.default.replace(helpers_1.containerHelpers, "dockerCli", async ({ cwd, args, ctx: _ctx }) => {
                (0, chai_1.expect)(cwd).to.equal(buildPath);
                (0, chai_1.expect)(args).to.eql(cmdArgs);
                (0, chai_1.expect)(_ctx).to.exist;
                return { all: "log" };
            });
            const result = await (0, build_1.buildContainer)({ ctx, log, action });
            (0, chai_1.expect)(result.state).to.eql("ready");
            (0, chai_1.expect)((_a = result.detail) === null || _a === void 0 ? void 0 : _a.buildLog).to.eql("log");
            (0, chai_1.expect)((_b = result.detail) === null || _b === void 0 ? void 0 : _b.fresh).to.eql(true);
            (0, chai_1.expect)(result.outputs.localImageId).to.eql("some/image");
        });
        it("should build image using the user specified Dockerfile path", async () => {
            var _a, _b;
            const action = await getAction();
            action.getSpec().dockerfile = "docker-dir/Dockerfile";
            testdouble_1.default.replace(action, "getOutputs", () => ({ localImageId: "some/image" }));
            const buildPath = action.getBuildPath();
            const cmdArgs = getCmdArgs(action, buildPath);
            testdouble_1.default.replace(helpers_1.containerHelpers, "dockerCli", async ({ cwd, args, ctx: _ctx }) => {
                (0, chai_1.expect)(cwd).to.equal(buildPath);
                (0, chai_1.expect)(args).to.eql(cmdArgs);
                (0, chai_1.expect)(_ctx).to.exist;
                return { all: "log" };
            });
            const result = await (0, build_1.buildContainer)({ ctx, log, action });
            (0, chai_1.expect)(result.state).to.eql("ready");
            (0, chai_1.expect)((_a = result.detail) === null || _a === void 0 ? void 0 : _a.buildLog).to.eql("log");
            (0, chai_1.expect)((_b = result.detail) === null || _b === void 0 ? void 0 : _b.fresh).to.eql(true);
            (0, chai_1.expect)(result.outputs.localImageId).to.eql("some/image");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILCtCQUE2QjtBQUM3Qiw0REFBMkI7QUFLM0Isc0VBQW9HO0FBQ3BHLDhFQUFnRztBQUNoRywwRUFBK0U7QUFDL0UsbURBQTBEO0FBQzFELGlEQUE2RjtBQUU3RixPQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN2QixNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsd0JBQXdCLENBQUMsQ0FBQTtJQUN4RCxJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxHQUFrQixDQUFBO0lBQ3RCLElBQUksR0FBYSxDQUFBO0lBQ2pCLElBQUksaUJBQW9DLENBQUE7SUFDeEMsSUFBSSxLQUFrQixDQUFBO0lBRXRCLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsSUFBQSx3QkFBWSxHQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDekUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFDaEIsaUJBQWlCLEdBQUcsTUFBTSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUE7UUFDekUsR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUE7UUFDbkgsS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtJQUMzRCxDQUFDLENBQUMsQ0FBQTtJQUVGLE1BQU0sU0FBUyxHQUFHLEtB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