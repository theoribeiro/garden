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
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const chai_1 = require("chai");
const path_1 = require("path");
const moment_1 = __importDefault(require("moment"));
const exec_1 = require("../../../../../src/plugins/exec/exec");
const helpers_1 = require("../../../../helpers");
const fs_extra_1 = require("fs-extra");
const string_1 = require("../../../../../src/util/string");
const logs_1 = require("../../../../../src/plugins/exec/logs");
const ts_stream_1 = __importDefault(require("ts-stream"));
const util_1 = require("../../../../../src/util/util");
const range = (length) => [...Array(length).keys()];
const defaultSleep = 1000;
function getStream() {
    const logBuffer = [];
    const stream = new ts_stream_1.default();
    void stream.forEach((entry) => {
        logBuffer.push(entry);
    });
    return [stream, logBuffer];
}
async function writeLogFile(path, entries, append = false) {
    const data = entries.map((e) => JSON.stringify(e)).join("\n") + "\n"; // File ends on a new line
    if (append) {
        return (0, fs_extra_1.appendFile)(path, data);
    }
    else {
        return (0, fs_extra_1.writeFile)(path, data);
    }
}
describe("ExecLogsFollower", () => {
    let tmpDir;
    const projectRoot = (0, helpers_1.getDataDir)("test-project-exec");
    let garden;
    let log;
    before(async () => {
        garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, exec_1.gardenPlugin)()] });
        log = garden.log;
        tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    describe("streamLogs", () => {
        it("should stream logs from file", async () => {
            const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
            const [stream, logs] = getStream();
            const execLogsFollower = new logs_1.ExecLogsFollower({
                stream,
                deployName: "foo",
                log,
                logFilePath,
            });
            const entries = range(100).map((el) => ({
                msg: String(el),
                timestamp: new Date(),
                name: "foo",
                level: 2,
            }));
            await writeLogFile(logFilePath, entries);
            await execLogsFollower.streamLogs({ follow: false });
            (0, chai_1.expect)(logs).to.eql(entries);
        });
        it("should include error entries", async () => {
            const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
            const [stream, logs] = getStream();
            const execLogsFollower = new logs_1.ExecLogsFollower({
                stream,
                deployName: "foo",
                log,
                logFilePath,
            });
            const entries = range(10).map((el) => ({
                msg: String(el),
                timestamp: new Date(),
                name: "foo",
                level: 0,
            }));
            await writeLogFile(logFilePath, entries);
            await execLogsFollower.streamLogs({ follow: false });
            (0, chai_1.expect)(logs).to.eql(entries);
        });
        it("should optionally stream last N entries", async () => {
            const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
            const [stream, logs] = getStream();
            const execLogsFollower = new logs_1.ExecLogsFollower({
                stream,
                deployName: "foo",
                log,
                logFilePath,
            });
            const entries = range(100).map((el) => ({
                msg: String(el),
                timestamp: new Date(),
                name: "foo",
                level: 2,
            }));
            await writeLogFile(logFilePath, entries);
            await execLogsFollower.streamLogs({ tail: 50, follow: false });
            (0, chai_1.expect)(logs).to.eql(entries.slice(50));
        });
        it("should optionally stream entries from a given duration", async () => {
            const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
            const [stream, logs] = getStream();
            const execLogsFollower = new logs_1.ExecLogsFollower({
                stream,
                deployName: "foo",
                log,
                logFilePath,
            });
            const entries = [
                {
                    msg: "Hello 1",
                    timestamp: (0, moment_1.default)().subtract(2, "h").toDate(),
                    name: "foo",
                    level: 2,
                },
                {
                    msg: "Hello 2",
                    timestamp: (0, moment_1.default)().subtract(2, "h").toDate(),
                    name: "foo",
                    level: 2,
                },
                {
                    msg: "Hello 3",
                    timestamp: (0, moment_1.default)().subtract(1, "h").toDate(),
                    name: "foo",
                    level: 2,
                },
                {
                    msg: "Hello 4",
                    timestamp: (0, moment_1.default)().subtract(1, "h").toDate(),
                    name: "foo",
                    level: 2,
                },
            ];
            await writeLogFile(logFilePath, entries);
            // We use a parse library to parse the durations so there's no real need
            // To test different values.
            await execLogsFollower.streamLogs({ since: "65m", follow: false });
            (0, chai_1.expect)(logs).to.eql(entries.slice(2));
        });
        it("should skip invalid entries", async () => {
            const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
            const [stream, logs] = getStream();
            const execLogsFollower = new logs_1.ExecLogsFollower({
                stream,
                deployName: "foo",
                log,
                logFilePath,
            });
            const entries = [
                {
                    msg: "Invalid - Missing service name",
                    timestamp: (0, moment_1.default)().subtract(2, "h").toDate(),
                    level: 2,
                },
                {
                    msg: "Invalid - Missing timestamp",
                    name: "foo",
                    level: 2,
                },
                {
                    msg: "Valid 1",
                    timestamp: (0, moment_1.default)().subtract(1, "h").toDate(),
                    name: "foo",
                    level: 2,
                },
                {
                    msg: "Valid 2",
                    timestamp: (0, moment_1.default)().subtract(1, "h").toDate(),
                    name: "foo",
                    level: 2,
                },
            ];
            await writeLogFile(logFilePath, entries);
            await execLogsFollower.streamLogs({ follow: false });
            (0, chai_1.expect)(logs).to.eql(entries.slice(2));
        });
        it("should abort without error if log file doesn't exist", async () => {
            const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
            const [stream, logs] = getStream();
            const execLogsFollower = new logs_1.ExecLogsFollower({
                stream,
                deployName: "foo",
                log,
                logFilePath,
            });
            // Skip writing log file
            await execLogsFollower.streamLogs({ follow: false });
            (0, chai_1.expect)(logs).to.eql([]);
        });
        // This will require some nasty async stuff
        context("follow logs", () => {
            let execLogsFollower;
            afterEach(async () => {
                execLogsFollower && execLogsFollower.stop();
            });
            it("should stream initial batch", async () => {
                const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
                const [stream, logs] = getStream();
                execLogsFollower = new logs_1.ExecLogsFollower({
                    stream,
                    deployName: "foo",
                    log,
                    logFilePath,
                    retryIntervalMs: 250,
                });
                execLogsFollower.streamLogs({ follow: true }).catch((_err) => { });
                const entries = range(100).map((el) => ({
                    msg: String(el),
                    timestamp: new Date(),
                    name: "foo",
                    level: 2,
                }));
                await writeLogFile(logFilePath, entries);
                await (0, util_1.sleep)(defaultSleep);
                (0, chai_1.expect)(logs).to.eql(entries);
            });
            it("should follow logs and stream new entries", async () => {
                const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
                const [stream, logs] = getStream();
                execLogsFollower = new logs_1.ExecLogsFollower({
                    stream,
                    deployName: "foo",
                    log,
                    logFilePath,
                    retryIntervalMs: 250,
                });
                execLogsFollower.streamLogs({ follow: true }).catch((_err) => { });
                const firstBatch = range(100).map((el) => ({
                    msg: `first-batch-${String(el)}`,
                    timestamp: new Date(),
                    name: "foo",
                    level: 2,
                }));
                await writeLogFile(logFilePath, firstBatch);
                await (0, util_1.sleep)(defaultSleep);
                (0, chai_1.expect)(logs).to.eql(firstBatch);
                const secondBatch = range(100).map((el) => ({
                    msg: `second-batch-${String(el)}`,
                    timestamp: new Date(),
                    name: "foo",
                    level: 2,
                }));
                await writeLogFile(logFilePath, secondBatch, true);
                await (0, util_1.sleep)(defaultSleep);
                (0, chai_1.expect)(logs).to.eql([...firstBatch, ...secondBatch]);
            });
            it("should handle log file being reset while watching", async () => {
                const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
                const [stream, logs] = getStream();
                execLogsFollower = new logs_1.ExecLogsFollower({
                    stream,
                    deployName: "foo",
                    log,
                    logFilePath,
                    retryIntervalMs: 250,
                });
                execLogsFollower.streamLogs({ follow: true }).catch((_err) => { });
                const firstBatch = range(100).map((el) => ({
                    msg: `first-batch-${String(el)}`,
                    timestamp: new Date(),
                    name: "foo",
                    level: 2,
                }));
                await writeLogFile(logFilePath, firstBatch);
                await (0, util_1.sleep)(defaultSleep);
                (0, chai_1.expect)(logs).to.eql(firstBatch);
                // Reset the log file. Note that this deletes the entire file so that subsequent incoming
                // entries are written to the beginning of the new file.
                await (0, fs_extra_1.remove)(logFilePath);
                await (0, fs_extra_1.ensureFile)(logFilePath);
                const secondBatch = range(100).map((el) => ({
                    msg: `second-batch-${String(el)}`,
                    timestamp: new Date(),
                    name: "foo",
                    level: 2,
                }));
                await writeLogFile(logFilePath, secondBatch);
                await (0, util_1.sleep)(defaultSleep);
                (0, chai_1.expect)(logs).to.eql([...firstBatch, ...secondBatch]);
            });
            it("should abide its time and not crash if no log file is found", async () => {
                const logFilePath = (0, path_1.join)(tmpDir.path, `log-${(0, string_1.randomString)(8)}.jsonl`);
                const [stream, logs] = getStream();
                execLogsFollower = new logs_1.ExecLogsFollower({
                    stream,
                    deployName: "foo",
                    log,
                    logFilePath,
                    retryIntervalMs: 250,
                });
                execLogsFollower.streamLogs({ follow: true }).catch((_err) => { });
                await (0, util_1.sleep)(defaultSleep);
                (0, chai_1.expect)(logs).to.eql([]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxvZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCw4REFBNkI7QUFDN0IsK0JBQTZCO0FBQzdCLCtCQUEyQjtBQUMzQixvREFBMkI7QUFFM0IsK0RBQW1FO0FBRW5FLGlEQUFnRTtBQUNoRSx1Q0FBb0U7QUFDcEUsMkRBQTZEO0FBQzdELCtEQUE2RjtBQUM3RiwwREFBOEI7QUFDOUIsdURBQW9EO0FBRXBELE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7QUFDM0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFBO0FBRXpCLFNBQVMsU0FBUztJQUNoQixNQUFNLFNBQVMsR0FBVSxFQUFFLENBQUE7SUFDM0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBTSxFQUF3QixDQUFBO0lBRWpELEtBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzVCLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDdkIsQ0FBQyxDQUFDLENBQUE7SUFFRixPQUFPLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQzVCLENBQUM7QUFFRCxLQUFLLFVBQVUsWUFBWSxDQUFDLElBQVksRUFBRSxPQUErQixFQUFFLFNBQWtCLEtBQUs7SUFDaEcsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUEsQ0FBQywwQkFBMEI7SUFDL0YsSUFBSSxNQUFNLEVBQUU7UUFDVixPQUFPLElBQUEscUJBQVUsRUFBQyxJQUFJ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