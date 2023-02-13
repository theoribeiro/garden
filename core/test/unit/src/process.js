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
const process_1 = require("../../../src/process");
const helpers_1 = require("../../helpers");
describe("registerProcess", () => {
    let store;
    let tmpDir;
    let now;
    beforeEach(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)();
        store = new global_1.GlobalConfigStore(tmpDir.path);
        now = (0, helpers_1.freezeTime)();
    });
    afterEach(async () => {
        await (tmpDir === null || tmpDir === void 0 ? void 0 : tmpDir.cleanup());
    });
    it("registers the current process in the global config store", async () => {
        await (0, process_1.registerProcess)(store, "foo", ["foo", "bar"]);
        const record = await store.get("activeProcesses", String(process.pid));
        (0, chai_1.expect)(record).to.eql({
            pid: process.pid,
            startedAt: now,
            arguments: ["foo", "bar"],
            sessionId: null,
            projectRoot: null,
            projectName: null,
            environmentName: null,
            namespace: null,
            persistent: false,
            serverHost: null,
            serverAuthKey: null,
            command: "foo",
        });
    });
    it("cleans up any dead processes", async () => {
        const oldPid = 999999999;
        await store.set("activeProcesses", String(oldPid), {
            pid: oldPid,
            startedAt: now,
            arguments: ["foo", "bar"],
            sessionId: null,
            projectRoot: null,
            projectName: null,
            environmentName: null,
            namespace: null,
            persistent: false,
            serverHost: null,
            serverAuthKey: null,
            command: "foo",
        });
        await (0, process_1.registerProcess)(store, "foo", ["foo", "bar"]);
        const record = await store.get("activeProcesses", String(oldPid));
        (0, chai_1.expect)(record).to.be.undefined;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsNkRBQW9FO0FBQ3BFLGtEQUFzRDtBQUN0RCwyQ0FBc0U7QUFFdEUsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtJQUMvQixJQUFJLEtBQXdCLENBQUE7SUFDNUIsSUFBSSxNQUFxQixDQUFBO0lBQ3pCLElBQUksR0FBUyxDQUFBO0lBRWIsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQVcsR0FBRSxDQUFBO1FBQzVCLEtBQUssR0FBRyxJQUFJLDBCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMxQyxHQUFHLEdBQUcsSUFBQSxvQkFBVSxHQUFFLENBQUE7SUFDcEIsQ0FBQyxDQUFDLENBQUE7SUFFRixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxDQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxPQUFPLEVBQUUsQ0FBQSxDQUFBO0lBQ3pCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDBEQUEwRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hFLE1BQU0sSUFBQSx5QkFBZSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQTtRQUVuRCxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBRXRFLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDcEIsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHO1lBQ2hCLFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztZQUN6QixTQUFTLEVBQUUsSUFBSTtZQUNmLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsVUFBVSxFQUFFLEtBQUs7WUFDakIsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLElBQUk7WUFDbkIsT0FBTyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1QyxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUE7UUFDeEIsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNqRCxHQUFHLEVBQUUsTUFBTTtZQUNYLFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztZQUN6QixTQUFTLEVBQUUsSUFBSTtZQUNmLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsVUFBVSxFQUFFLEtBQUs7WUFDakIsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLElBQUk7WUFDbkIsT0FBTyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUE7UUFDRixNQUFNLElBQUEseUJBQWUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDbkQsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1FBQ2pFLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO0lBQ2hDLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==