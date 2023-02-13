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
const buffered_event_stream_1 = require("../../../../src/cloud/buffered-event-stream");
const logger_1 = require("../../../../src/logger/logger");
const helpers_1 = require("../../../helpers");
const lodash_1 = require("lodash");
function makeDummyRecord(sizeKb) {
    return { someKey: (0, lodash_1.repeat)("a", sizeKb * 1024) };
}
describe("BufferedEventStream", () => {
    const getConnectionParams = (garden) => ({
        garden,
        streamEvents: true,
        streamLogEntries: true,
        targets: [
            {
                host: "dummy-platform_url",
                clientAuthToken: "dummy-client-token",
                enterprise: true,
            },
        ],
    });
    it("should flush events and log entries emitted by a connected event emitter", async () => {
        const flushedEvents = [];
        const flushedLogEntries = [];
        const log = (0, logger_1.getLogger)().placeholder();
        const bufferedEventStream = new buffered_event_stream_1.BufferedEventStream({ log, sessionId: "dummy-session-id" });
        bufferedEventStream["flushEvents"] = (events) => {
            flushedEvents.push(...events);
            return Promise.resolve();
        };
        bufferedEventStream["flushLogEntries"] = (logEntries) => {
            flushedLogEntries.push(...logEntries);
            return Promise.resolve();
        };
        const garden = await (0, helpers_1.makeTestGardenA)();
        bufferedEventStream.connect(getConnectionParams(garden));
        garden.events.emit("_test", "event");
        log.root.events.emit("_test", "log");
        await bufferedEventStream.flushAll();
        (0, chai_1.expect)((0, lodash_1.find)(flushedEvents, (e) => (0, lodash_1.isMatch)(e, { name: "_test", payload: "event" }))).to.exist;
        (0, chai_1.expect)(flushedLogEntries).to.include("log");
    });
    it("should only flush events or log entries emitted by the last connected Garden bus", async () => {
        const flushedEvents = [];
        const flushedLogEntries = [];
        const log = (0, logger_1.getLogger)().placeholder();
        const bufferedEventStream = new buffered_event_stream_1.BufferedEventStream({ log, sessionId: "dummy-session-id" });
        bufferedEventStream["flushEvents"] = (events) => {
            flushedEvents.push(...events);
            return Promise.resolve();
        };
        bufferedEventStream["flushLogEntries"] = (logEntries) => {
            flushedLogEntries.push(...logEntries);
            return Promise.resolve();
        };
        const gardenA = await (0, helpers_1.makeTestGardenA)();
        const gardenB = await (0, helpers_1.makeTestGardenA)();
        bufferedEventStream.connect(getConnectionParams(gardenA));
        bufferedEventStream.connect(getConnectionParams(gardenB));
        log.root.events.emit("_test", "log");
        gardenA.events.emit("_test", "event");
        await bufferedEventStream.flushAll();
        (0, chai_1.expect)(flushedEvents.length).to.eql(0);
        (0, chai_1.expect)(flushedLogEntries).to.include("log");
        gardenB.events.emit("_test", "event");
        await bufferedEventStream.flushAll();
        (0, chai_1.expect)((0, lodash_1.find)(flushedEvents, (e) => (0, lodash_1.isMatch)(e, { name: "_test", payload: "event" }))).to.exist;
    });
    describe("makeBatch", () => {
        const maxBatchBytes = 3 * 1024; // Set this to a low value (3 Kb) to keep the memory use of the test suite low.
        it("should pick records until the batch size reaches MAX_BATCH_BYTES", async () => {
            const recordSizeKb = 0.5;
            const log = (0, logger_1.getLogger)().placeholder();
            const bufferedEventStream = new buffered_event_stream_1.BufferedEventStream({ log, sessionId: "dummy-session-id" });
            bufferedEventStream["maxBatchBytes"] = maxBatchBytes;
            // Total size is ~3MB, which exceeds MAX_BATCH_BYTES
            const records = (0, lodash_1.range)(100).map((_) => makeDummyRecord(recordSizeKb));
            const batch = bufferedEventStream.makeBatch(records);
            const batchSize = Buffer.from(JSON.stringify(batch)).length;
            (0, chai_1.expect)(batch.length).to.be.lte(records.length);
            (0, chai_1.expect)(batch.length).to.be.lte(maxBatchBytes / (recordSizeKb * 1024));
            (0, chai_1.expect)(batchSize).to.be.lte(maxBatchBytes);
        });
        it("should drop individual records whose payload size exceeds MAX_BATCH_BYTES", async () => {
            const recordSizeKb = 0.5;
            const log = (0, logger_1.getLogger)().placeholder();
            const bufferedEventStream = new buffered_event_stream_1.BufferedEventStream({ log, sessionId: "dummy-session-id" });
            bufferedEventStream["maxBatchBytes"] = maxBatchBytes;
            // This record's size, exceeds MAX_BATCH_BYTES, so it should be dropped by `makeBatch`.
            const tooLarge = {
                ...makeDummyRecord(maxBatchBytes / 1024 + 3),
                tag: "tooLarge",
            };
            const records = [tooLarge, ...(0, lodash_1.range)(100).map((_) => makeDummyRecord(recordSizeKb))];
            const batch = bufferedEventStream.makeBatch(records);
            const batchSize = Buffer.from(JSON.stringify(batch)).length;
            (0, chai_1.expect)(batch.find((r) => r["tag"] === "tooLarge")).to.be.undefined; // We expect `tooLarge` to have been dropped.
            (0, chai_1.expect)(batch.length).to.be.gte(3);
            (0, chai_1.expect)(batch.length).to.be.lte(records.length);
            (0, chai_1.expect)(batch.length).to.be.lte(maxBatchBytes / (recordSizeKb * 1024));
            (0, chai_1.expect)(batchSize).to.be.lte(maxBatchBytes);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyZWQtZXZlbnQtc3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyZWQtZXZlbnQtc3RyZWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHVGQUFvSDtBQUNwSCwwREFBeUQ7QUFFekQsOENBQWtEO0FBQ2xELG1DQUFxRDtBQUVyRCxTQUFTLGVBQWUsQ0FBQyxNQUFjO0lBQ3JDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBQSxlQUFNLEVBQUMsR0FBRyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO0FBQ2hELENBQUM7QUFFRCxRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO0lBQ25DLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDL0MsTUFBTTtRQUNOLFlBQVksRUFBRSxJQUFJO1FBQ2xCLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsT0FBTyxFQUFFO1lBQ1A7Z0JBQ0UsSUFBSSxFQUFFLG9CQUFvQjtnQkFDMUIsZUFBZSxFQUFFLG9CQUFvQjtnQkFDckMsVUFBVSxFQUFFLElBQUk7YUFDakI7U0FDRjtLQUNGLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywwRUFBMEUsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN4RixNQUFNLGFBQWEsR0FBa0IsRUFBRSxDQUFBO1FBQ3ZDLE1BQU0saUJBQWlCLEdBQTJCLEVBQUUsQ0FBQTtRQUVwRCxNQUFNLEdBQUcsR0FBRyxJQUFBLGtCQUFTLEdBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUVyQyxNQUFNLG1CQUFtQixHQUFHLElBQUksMkNBQW1CLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtRQUUzRixtQkFBbUIsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE1BQXFCLEVBQUUsRUFBRTtZQUM3RCxhQUFh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