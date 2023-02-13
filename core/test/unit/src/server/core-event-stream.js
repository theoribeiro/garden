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
const helpers_1 = require("../../../helpers");
const server_1 = require("../../../../src/server/server");
const core_event_stream_1 = require("../../../../src/server/core-event-stream");
const p_event_1 = __importDefault(require("p-event"));
const process_1 = __importDefault(require("process"));
const serve_1 = require("../../../../src/commands/serve");
describe("CoreEventStream", () => {
    let streamer;
    let garden;
    const command = new serve_1.ServeCommand();
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
    });
    afterEach(async () => {
        await (streamer === null || streamer === void 0 ? void 0 : streamer.close());
    });
    after(async () => {
        await (garden === null || garden === void 0 ? void 0 : garden.close());
    });
    it("posts events to the configured target hosts", async () => {
        const serverEventBusA = new helpers_1.TestEventBus();
        const serverEventBusB = new helpers_1.TestEventBus();
        const serverA = new server_1.GardenServer({ log: garden.log, command });
        const serverB = new server_1.GardenServer({ log: garden.log, command });
        serverA["incomingEvents"] = serverEventBusA;
        serverB["incomingEvents"] = serverEventBusB;
        await serverA.start();
        await serverB.start();
        await serverA.setGarden(garden);
        await serverB.setGarden(garden);
        streamer = new core_event_stream_1.CoreEventStream({
            log: garden.log,
            sessionId: garden.sessionId,
            globalConfigStore: garden.globalConfigStore,
        });
        streamer.connect({
            garden,
            streamEvents: true,
            streamLogEntries: true,
            targets: [
                { host: serverA.getBaseUrl(), clientAuthToken: serverA.authKey, enterprise: false },
                { host: serverB.getBaseUrl(), clientAuthToken: serverB.authKey, enterprise: false },
            ],
        });
        garden.events.emit("_test", "foo");
        // Make sure events are flushed
        await streamer.close();
        (0, chai_1.expect)(serverEventBusA.eventLog).to.eql([{ name: "_test", payload: "foo" }]);
        (0, chai_1.expect)(serverEventBusB.eventLog).to.eql([{ name: "_test", payload: "foo" }]);
    });
    describe("updateTargets", () => {
        it("updates and returns the current list of active servers", async () => {
            // Correctly matched
            const recordA = {
                pid: process_1.default.pid,
                startedAt: new Date(),
                command: "serve",
                arguments: [],
                sessionId: garden.sessionId,
                persistent: true,
                serverHost: "http://localhost:123456",
                serverAuthKey: "foo",
                projectRoot: garden.projectRoot,
                projectName: garden.projectName,
                environmentName: garden.environmentName,
                namespace: garden.namespace,
            };
            await garden.globalConfigStore.set("activeProcesses", String(recordA.pid), recordA);
            // Inactive
            const recordB = {
                ...recordA,
                pid: 9999999,
            };
            await garden.globalConfigStore.set("activeProcesses", String(recordB.pid), recordB);
            // Different namespace
            const recordC = {
                ...recordA,
                namespace: "foo",
            };
            await garden.globalConfigStore.set("activeProcesses", String(recordC.pid), recordC);
            streamer = new core_event_stream_1.CoreEventStream({
                log: garden.log,
                sessionId: garden.sessionId,
                globalConfigStore: garden.globalConfigStore,
            });
            streamer.connect({
                garden,
                streamEvents: true,
                streamLogEntries: true,
                targets: [],
            });
            const processes = await streamer.updateTargets();
            (0, chai_1.expect)(processes.length).to.equal(1);
            (0, chai_1.expect)(processes[0]).to.eql(recordA);
        });
        it("emits a serversUpdated event when a server is removed", async () => {
            // Correctly matched
            const proc = {
                pid: process_1.default.pid,
                startedAt: new Date(),
                command: "serve",
                arguments: [],
                sessionId: garden.sessionId,
                persistent: true,
                serverHost: "http://localhost:123456",
                serverAuthKey: "foo",
                projectRoot: garden.projectRoot,
                projectName: garden.projectName,
                environmentName: garden.environmentName,
                namespace: garden.namespace,
            };
            await garden.globalConfigStore.set("activeProcesses", String(proc.pid), proc);
            streamer = new core_event_stream_1.CoreEventStream({
                log: garden.log,
                sessionId: garden.sessionId,
                globalConfigStore: garden.globalConfigStore,
            });
            streamer.connect({
                garden,
                streamEvents: true,
                streamLogEntries: true,
                targets: [],
            });
            await streamer.updateTargets();
            await garden.globalConfigStore.delete("activeProcesses", String(proc.pid));
            await streamer.updateTargets();
            garden.events.expectEvent("serversUpdated", { servers: [] });
        });
        it("emits a serversUpdated event when a server is added", async () => {
            const proc = {
                pid: process_1.default.pid,
                startedAt: new Date(),
                command: "serve",
                arguments: [],
                sessionId: garden.sessionId,
                persistent: true,
                serverHost: "http://localhost:123456",
                serverAuthKey: "foo",
                projectRoot: garden.projectRoot,
                projectName: garden.projectName,
                environmentName: garden.environmentName,
                namespace: garden.namespace,
            };
            streamer = new core_event_stream_1.CoreEventStream({
                log: garden.log,
                sessionId: garden.sessionId,
                globalConfigStore: garden.globalConfigStore,
            });
            streamer.connect({
                garden,
                streamEvents: true,
                streamLogEntries: true,
                targets: [],
            });
            await streamer.updateTargets();
            await garden.globalConfigStore.set("activeProcesses", String(proc.pid), proc);
            await streamer.updateTargets();
            garden.events.expectEvent("serversUpdated", {
                servers: [{ host: proc.serverHost, command: "serve", serverAuthKey: "foo" }],
            });
        });
        it("ignores servers matching ignoreHost", async () => {
            const proc = {
                pid: process_1.default.pid,
                startedAt: new Date(),
                command: "serve",
                arguments: [],
                sessionId: garden.sessionId,
                persistent: true,
                serverHost: "http://localhost:123456",
                serverAuthKey: "foo",
                projectRoot: garden.projectRoot,
                projectName: garden.projectName,
                environmentName: garden.environmentName,
                namespace: garden.namespace,
            };
            streamer = new core_event_stream_1.CoreEventStream({
                log: garden.log,
                sessionId: garden.sessionId,
                globalConfigStore: garden.globalConfigStore,
            });
            streamer.connect({
                garden,
                targets: [],
                streamEvents: true,
                streamLogEntries: true,
                ignoreHost: proc.serverHost,
            });
            await garden.globalConfigStore.set("activeProcesses", String(proc.pid), proc);
            const processes = await streamer.updateTargets();
            (0, chai_1.expect)(processes.length).to.equal(0);
        });
        it("returns an empty list when no Garden instance is connected", async () => {
            streamer = new core_event_stream_1.CoreEventStream({
                log: garden.log,
                sessionId: garden.sessionId,
                globalConfigStore: garden.globalConfigStore,
            });
            const processes = await streamer.updateTargets();
            (0, chai_1.expect)(processes).to.eql([]);
        });
    });
    it("polls to update the list of target hosts", async () => {
        // Start with no targets and initiate polling
        streamer = new core_event_stream_1.CoreEventStream({
            log: garden.log,
            sessionId: garden.sessionId,
            globalConfigStore: garden.globalConfigStore,
        });
        streamer.connect({
            garden,
            streamEvents: true,
            streamLogEntries: true,
            targets: [],
        });
        // Create a new process record
        await garden.globalConfigStore.set("activeProcesses", String(process_1.default.pid), {
            pid: process_1.default.pid,
            startedAt: new Date(),
            command: "serve",
            arguments: [],
            sessionId: garden.sessionId,
            persistent: true,
            serverHost: "http://localhost:123456",
            serverAuthKey: "foo",
            projectRoot: garden.projectRoot,
            projectName: garden.projectName,
            environmentName: garden.environmentName,
            namespace: garden.namespace,
        });
        // Wait for it to come up
        await (0, p_event_1.default)(garden.events, "serversUpdated", { timeout: 5000 });
    });
    it.skip("removes target hosts that are unreachable", async () => {
        // TODO: let's see if we need this on top of the polling
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1ldmVudC1zdHJlYW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb3JlLWV2ZW50LXN0cmVhbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILCtCQUE2QjtBQUM3Qiw4Q0FBNEU7QUFDNUUsMERBQTREO0FBQzVELGdGQUEwRTtBQUMxRSxzREFBNEI7QUFFNUIsc0RBQTZCO0FBQzdCLDBEQUE2RDtBQUU3RCxRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO0lBQy9CLElBQUksUUFBeUIsQ0FBQTtJQUM3QixJQUFJLE1BQWtCLENBQUE7SUFFdEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxvQkFBWSxFQUFFLENBQUE7SUFFbEMsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO0lBQ2xDLENBQUMsQ0FBQyxDQUFBO0lBRUYsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLE1BQU0sQ0FBQSxRQUFRLGFBQVIsUUFBUSx1QkFBUixRQUFRLENBQUUsS0FBSyxFQUFFLENBQUEsQ0FBQTtJQUN6QixDQUFDLENBQUMsQ0FBQTtJQUVGLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNmLE1BQU0sQ0FBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsS0FBSyxFQUFFLENBQUEsQ0FBQTtJQUN2QixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMzRCxNQUFNLGVBQWUsR0FBRyxJQUFJLHNCQUFZLEVBQUUsQ0FBQTtRQUMxQyxNQUFNLGVBQWUsR0FBRyxJQUFJLHNCQUFZLEVBQUUsQ0FBQTtRQUUxQyxNQUFNLE9BQU8sR0FBRyxJQUFJLHFCQUFZLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FB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