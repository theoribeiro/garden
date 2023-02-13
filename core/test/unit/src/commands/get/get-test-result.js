"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../../../helpers");
const get_test_result_1 = require("../../../../../src/commands/get/get-test-result");
const chai_1 = require("chai");
const artifacts_1 = require("../../../../../src/util/artifacts");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const now = new Date();
describe("GetTestResultCommand", () => {
    let garden;
    let log;
    const command = new get_test_result_1.GetTestResultCommand();
    const moduleName = "module-a";
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGardenA)(undefined, { noCache: true });
        log = garden.log;
    });
    afterEach(async () => {
        await (0, helpers_1.cleanProject)(garden.gardenDirPath);
    });
    it("should throw error if test not found", async () => {
        const testName = "banana";
        await (0, helpers_1.expectError)(async () => await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { name: moduleName, moduleTestName: testName },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        }), { type: "parameter", contains: `Could not find test "${testName}" in module ${moduleName}` });
    });
    it("should return the test result", async () => {
        const status = {
            detail: { success: true, startedAt: now, completedAt: now, log: "bla" },
            outputs: {
                log: "bla",
            },
            state: "ready",
        };
        await garden.setTestActionStatus({
            log,
            kind: "Test",
            name: "module-a-unit",
            status,
        });
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { name: "module-a-unit", moduleTestName: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        (0, chai_1.expect)(res.result).to.eql({
            ...status,
            artifacts: [],
        });
    });
    it("should return test result with module name as first argument", async () => {
        const status = {
            detail: { success: true, startedAt: now, completedAt: now, log: "bla" },
            outputs: {
                log: "bla",
            },
            state: "ready",
        };
        await garden.setTestActionStatus({
            log,
            kind: "Test",
            name: "module-a-unit",
            status,
        });
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { name: moduleName, moduleTestName: "unit" },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        (0, chai_1.expect)(res.result).to.eql({
            ...status,
            artifacts: [],
        });
    });
    it("should include paths to artifacts if artifacts exist", async () => {
        const status = {
            detail: { success: true, startedAt: now, completedAt: now, log: "bla" },
            outputs: {
                log: "bla",
            },
            state: "ready",
        };
        await garden.setTestActionStatus({
            log,
            kind: "Test",
            name: "module-a-unit",
            status,
        });
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false, noCache: true });
        const testAction = graph.getTest("module-a-unit");
        const artifactKey = (0, artifacts_1.getArtifactKey)("test", "module-a-unit", testAction.versionString());
        const metadataPath = (0, path_1.join)(garden.artifactsPath, `.metadata.${artifactKey}.json`);
        const metadata = {
            key: artifactKey,
            files: ["/foo/bar.txt", "/bas/bar.txt"],
        };
        await (0, fs_extra_1.writeFile)(metadataPath, JSON.stringify(metadata));
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { name: moduleName, moduleTestName: "unit" },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(res.result).to.eql({
            ...status,
            artifacts: ["/foo/bar.txt", "/bas/bar.txt"],
        });
    });
    it("should return empty result if test result does not exist", async () => {
        const testName = "integration";
        const res = await command.action({
            garden,
            log,
            footerLog: log,
            headerLog: log,
            args: { name: moduleName, moduleTestName: testName },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(res.result).to.eql({
            artifacts: [],
            state: "not-ready",
            detail: null,
            outputs: {},
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXRlc3QtcmVzdWx0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0LXRlc3QtcmVzdWx0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsaURBQW1IO0FBQ25ILHFGQUFzRjtBQUN0RiwrQkFBNkI7QUFFN0IsaUVBQWtFO0FBQ2xFLCtCQUEyQjtBQUMzQix1Q0FBb0M7QUFHcEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQTtBQUV0QixRQUFRLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO0lBQ3BDLElBQUksTUFBa0IsQ0FBQTtJQUN0QixJQUFJLEdBQWEsQ0FBQTtJQUNqQixNQUFNLE9BQU8sR0FBRyxJQUFJLHNDQUFvQixFQUFFLENBQUE7SUFDMUMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFBO0lBRTdCLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEVBQUMsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7UUFDNUQsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7SUFDbEIsQ0FBQyxDQUFDLENBQUE7SUFFRixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxJQUFBLHNCQUFZLEVBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBQzFDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3BELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQTtRQUV6QixNQUFNLElBQUEscUJBQVcsRUFDZixLQUFLLElBQUksRUFBRSxDQUNULE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNuQixNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLEdBQUc7WUFDZCxJQUFJLEVBQUUsRUFB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