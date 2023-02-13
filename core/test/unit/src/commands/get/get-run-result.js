"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const helpers_1 = require("../../../../helpers");
const get_run_result_1 = require("../../../../../src/commands/get/get-run-result");
const chai_1 = require("chai");
const artifacts_1 = require("../../../../../src/util/artifacts");
const fs_extra_1 = require("fs-extra");
const now = new Date();
describe("GetRunResultCommand", () => {
    let garden;
    let log;
    const projectRootB = (0, helpers_1.getDataDir)("test-project-b");
    const command = new get_run_result_1.GetRunResultCommand();
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGarden)(projectRootB, { noCache: true });
        log = garden.log;
    });
    afterEach(async () => {
        await (0, helpers_1.cleanProject)(garden.gardenDirPath);
    });
    it("throws error if action is not found", async () => {
        const name = "banana";
        await (0, helpers_1.expectError)(async () => await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { name },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        }), { type: "graph", contains: `Could not find Run action ${name}` });
    });
    it("should return the Run result", async () => {
        const name = "task-a";
        const status = {
            detail: { success: true, startedAt: now, completedAt: now, log: "bla" },
            outputs: {
                log: "bla",
            },
            state: "ready",
        };
        await garden.setTestActionStatus({
            log,
            kind: "Run",
            name,
            status,
        });
        const res = await command.action({
            garden,
            log,
            footerLog: log,
            headerLog: log,
            args: { name },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        (0, chai_1.expect)(res.result).to.be.eql({
            ...status,
            artifacts: [],
        });
    });
    it("should include paths to artifacts if artifacts exist", async () => {
        const name = "task-a";
        const status = {
            detail: { success: true, startedAt: now, completedAt: now, log: "bla" },
            outputs: {
                log: "bla",
            },
            state: "ready",
        };
        await garden.setTestActionStatus({
            log,
            kind: "Run",
            name,
            status,
        });
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const runAction = graph.getRun(name);
        const artifactKey = (0, artifacts_1.getArtifactKey)("run", name, runAction.versionString());
        const metadataPath = (0, path_1.join)(garden.artifactsPath, `.metadata.${artifactKey}.json`);
        const metadata = {
            key: artifactKey,
            files: ["/foo/bar.txt", "/bas/bar.txt"],
        };
        await (0, fs_extra_1.writeFile)(metadataPath, JSON.stringify(metadata));
        const res = await command.action({
            garden,
            log,
            footerLog: log,
            headerLog: log,
            args: { name },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(res.result).to.be.eql({
            ...status,
            artifacts: ["/foo/bar.txt", "/bas/bar.txt"],
        });
    });
    it("should return empty result if task result does not exist", async () => {
        const name = "task-c";
        const res = await command.action({
            garden,
            log,
            footerLog: log,
            headerLog: log,
            args: { name },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXJ1bi1yZXN1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtcnVuLXJlc3VsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUEyQjtBQUMzQixpREFPNEI7QUFDNUIsbUZBQW9GO0FBQ3BGLCtCQUE2QjtBQUU3QixpRUFBa0U7QUFDbEUsdUNBQW9DO0FBR3BDLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUE7QUFFdEIsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtJQUNuQyxJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxHQUFhLENBQUE7SUFDakIsTUFBTSxZQUFZLEdBQUcsSUFBQSxvQkFBVSxFQUFDLGdCQUFnQixDQUFDLENBQUE7SUFDakQsTUFBTSxPQUFPLEdBQUcsSUFBSSxvQ0FBbUIsRUFBRSxDQUFBO0lBRXpDLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7UUFDOUQsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7SUFDbEIsQ0FBQyxDQUFDLENBQUE7SUFFRixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxJQUFBLHNCQUFZLEVBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBQzFDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ25ELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQTtRQUVyQixNQUFNLElBQUEscUJBQVcsRUFDZixLQUFLLElBQUksRUFBRSxDQUNULE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNuQixNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLEdB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