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
const global_1 = require("../../../src/config-store/global");
const helpers_1 = require("../../helpers");
const string_1 = require("../../../src/util/string");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const local_1 = require("../../../src/config-store/local");
describe("ConfigStore", () => {
    let store;
    let tmpDir;
    beforeEach(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)();
        store = new global_1.GlobalConfigStore(tmpDir.path);
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    describe("set", () => {
        it("sets a whole config section if no key is set", async () => {
            const input = { lastRun: new Date() };
            await store.set("versionCheck", input);
            const output = await store.get("versionCheck");
            (0, chai_1.expect)(input).to.eql(output);
        });
        it("sets a specific key in a section if specified", async () => {
            const input = { lastRun: new Date() };
            await store.set("versionCheck", "lastRun", input.lastRun);
            const output = await store.get("versionCheck");
            (0, chai_1.expect)(input).to.eql(output);
        });
    });
    describe("get", () => {
        it("implicitly initializes the config if needed", async () => {
            const empty = await store.get();
            (0, chai_1.expect)(empty).to.eql(global_1.emptyGlobalConfig);
        });
        it("returns full config if no section or key specified", async () => {
            const versionCheck = { lastRun: new Date() };
            await store.set("versionCheck", versionCheck);
            const output = await store.get();
            (0, chai_1.expect)(output).to.eql({
                ...global_1.emptyGlobalConfig,
                versionCheck,
            });
        });
        it("returns config section if no key is specified", async () => {
            const versionCheck = { lastRun: new Date() };
            await store.set("versionCheck", versionCheck);
            const output = await store.get("versionCheck");
            (0, chai_1.expect)(output).to.eql(versionCheck);
        });
        it("returns specific key if specified", async () => {
            const versionCheck = { lastRun: new Date() };
            await store.set("versionCheck", versionCheck);
            const output = await store.get("versionCheck", "lastRun");
            (0, chai_1.expect)(output).to.eql(versionCheck.lastRun);
        });
    });
    describe("clear", () => {
        it("clears the configuration", async () => {
            const empty = await store.get();
            await store.set("analytics", "firstRunAt", new Date());
            await store.clear();
            (0, chai_1.expect)(await store.get()).to.eql(empty);
        });
    });
    describe("LocalConfigStore", () => {
        const legacyLocalConfig = (0, string_1.dedent) `
      analytics:
        projectId: foo
      linkedModuleSources:
        - name: name-a
          path: path-a
      linkedProjectSources:
        - name: name-b
          path: path-b
    `;
        it("correctly migrates legacy config if new config is missing", async () => {
            const localStore = new local_1.LocalConfigStore(tmpDir.path);
            const legacyPath = (0, path_1.resolve)(tmpDir.path, local_1.legacyLocalConfigFilename);
            await (0, fs_extra_1.writeFile)(legacyPath, legacyLocalConfig);
            const config = await localStore.get();
            (0, chai_1.expect)(config).to.eql({
                analytics: {
                    projectId: "foo",
                },
                linkedModuleSources: {
                    "name-a": { name: "name-a", path: "path-a" },
                },
                linkedProjectSources: {
                    "name-b": { name: "name-b", path: "path-b" },
                },
                warnings: {},
            });
        });
        it("doesn't migrate legacy config if new config file already exists", async () => {
            const localStore = new local_1.LocalConfigStore(tmpDir.path);
            await localStore.set("analytics", {});
            const legacyPath = (0, path_1.resolve)(tmpDir.path, local_1.legacyLocalConfigFilename);
            await (0, fs_extra_1.writeFile)(legacyPath, legacyLocalConfig);
            const config = await localStore.get();
            (0, chai_1.expect)(config).to.eql({
                analytics: {},
                linkedModuleSources: {},
                linkedProjectSources: {},
                warnings: {},
            });
        });
    });
    describe("GlobalConfigStore", () => {
        const legacyGlobalConfig = (0, string_1.dedent) `
      analytics:
        firstRunAt: 'Sun, 29 Jan 2023 00:59:37 GMT'
        lastRunAt: 'Sun, 29 Jan 2023 00:59:57 GMT'
        anonymousUserId: fasgdjhfgaskfjhsdgfkjas
        cloudVersion: 0
        # optedIn: # empty value
        cloudProfileEnabled: false
      versionCheck:
        lastRun: '2023-01-29T01:00:41.999Z'
      requirementsCheck:
        lastRunDateUNIX: 1674954074151
        lastRunGardenVersion: "0.12.48"
        passed: true
    `;
        it("correctly migrates legacy config if new config is missing", async () => {
            const legacyPath = (0, path_1.resolve)(tmpDir.path, global_1.legacyGlobalConfigFilename);
            await (0, fs_extra_1.writeFile)(legacyPath, legacyGlobalConfig);
            const config = await store.get();
            (0, chai_1.expect)(config).to.eql({
                activeProcesses: {},
                analytics: {
                    anonymousUserId: "fasgdjhfgaskfjhsdgfkjas",
                    cloudProfileEnabled: false,
                    firstRunAt: new Date("Sun, 29 Jan 2023 00:59:37 GMT"),
                    optedOut: false,
                },
                clientAuthTokens: {},
                requirementsCheck: {
                    lastRunDateUNIX: 1674954074151,
                    lastRunGardenVersion: "0.12.48",
                    passed: true,
                },
                versionCheck: {},
            });
        });
        it("doesn't migrate legacy config if new config file already exists", async () => {
            await store.set("analytics", {});
            const legacyPath = (0, path_1.resolve)(tmpDir.path, global_1.legacyGlobalConfigFilename);
            await (0, fs_extra_1.writeFile)(legacyPath, legacyGlobalConfig);
            const config = await store.get();
            (0, chai_1.expect)(config).to.eql(global_1.emptyGlobalConfig);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLDZEQUFtSDtBQUNuSCwyQ0FBMEQ7QUFDMUQscURBQWlEO0FBQ2pELCtCQUE4QjtBQUM5Qix1Q0FBb0M7QUFDcEMsMkRBQTZGO0FBRTdGLFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO0lBQzNCLElBQUksS0FBd0IsQ0FBQTtJQUM1QixJQUFJLE1BQXFCLENBQUE7SUFFekIsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQVcsR0FBRSxDQUFBO1FBQzVCLEtBQUssR0FBRyxJQUFJLDBCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM1QyxDQUFDLENBQUMsQ0FBQTtJQUVGLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUN4QixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1FBQ25CLEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RCxNQUFNLEtBQUssR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLENBQUE7WUFDckMsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN0QyxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUE7WUFDOUMsSUFBQSxhQUFNLEVBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUM5QixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQywrQ0FB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