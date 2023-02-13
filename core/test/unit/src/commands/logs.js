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
const logs_1 = require("../../../../src/commands/logs");
const testing_1 = require("../../../../src/util/testing");
const helpers_1 = require("../../../helpers");
const constants_1 = require("../../../../src/constants");
const renderers_1 = require("../../../../src/logger/renderers");
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../../../../src/logger/logger");
const config_1 = require("../../../../src/plugins/exec/config");
// TODO-G2: rename test cases to match the new graph model semantics
function makeCommandParams({ garden, args = { services: undefined }, opts = {}, }) {
    const log = garden.log;
    return {
        garden,
        log,
        headerLog: log,
        footerLog: log,
        args,
        opts: (0, helpers_1.withDefaultGlobalOpts)({
            ...opts,
        }),
    };
}
const makeDeployAction = (basePath, name) => ({
    apiVersion: constants_1.DEFAULT_API_VERSION,
    kind: "Deploy",
    name,
    type: "test",
    disabled: false,
    internal: {
        basePath,
    },
    spec: {
        deployCommand: ["echo", "ok"],
    },
});
async function makeGarden(tmpDir, plugin) {
    const config = (0, helpers_1.createProjectConfig)({
        path: tmpDir.path,
        providers: [{ name: "test" }],
    });
    const garden = await testing_1.TestGarden.factory(tmpDir.path, { config, plugins: [plugin] });
    garden.setActionConfigs([], [makeDeployAction(tmpDir.path, "test-service-a")]);
    return garden;
}
// Returns all entries that match the logMsg as string, sorted by service name.
function getLogOutput(garden, msg, extraFilter = () => true) {
    const entries = garden.log
        .getChildEntries()
        .filter(extraFilter)
        .filter((e) => { var _a; return (_a = e.getLatestMessage().msg) === null || _a === void 0 ? void 0 : _a.includes(msg); });
    return entries.map((e) => (0, renderers_1.formatForTerminal)(e, "basic").trim());
}
describe("LogsCommand", () => {
    let tmpDir;
    const timestamp = new Date();
    const msgColor = chalk_1.default.bgRedBright;
    const logMsg = "Yes, this is log";
    const logMsgWithColor = msgColor(logMsg);
    const color = chalk_1.default[logs_1.colors[0]];
    const defaultLogsHandler = async ({ stream }) => {
        void stream.write({
            tags: { container: "my-container" },
            name: "test-service-a",
            msg: logMsgWithColor,
            timestamp,
        });
        return {};
    };
    const makeTestPlugin = (logsHandler = defaultLogsHandler) => {
        return (0, helpers_1.customizedTestPlugin)({
            name: "test",
            createActionTypes: {
                Deploy: [
                    {
                        name: "test",
                        docs: "Test Deploy action",
                        schema: (0, config_1.execDeployActionSchema)(),
                        handlers: {
                            getLogs: logsHandler,
                        },
                    },
                ],
            },
        });
    };
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    context("follow=false", () => {
        it("should return service logs", async () => {
            const garden = await makeGarden(tmpDir, makeTestPlugin());
            const command = new logs_1.LogsCommand();
            const res = await command.action(makeCommandParams({ garden }));
            (0, chai_1.expect)(res).to.eql({
                result: [
                    {
                        tags: { container: "my-container" },
                        name: "test-service-a",
                        msg: logMsgWithColor,
                        timestamp,
                    },
                ],
            });
        });
        it("should sort entries by timestamp", async () => {
            const getServiceLogsHandler = async (params) => {
                void params.stream.write({
                    tags: { container: "my-container" },
                    name: "test-service-a",
                    msg: "3",
                    timestamp: new Date("2021-05-13T20:03:00.000Z"),
                });
                void params.stream.write({
                    tags: { container: "my-container" },
                    name: "test-service-a",
                    msg: "4",
                    timestamp: new Date("2021-05-13T20:04:00.000Z"),
                });
                void params.stream.write({
                    tags: { container: "my-container" },
                    name: "test-service-a",
                    msg: "2",
                    timestamp: new Date("2021-05-13T20:02:00.000Z"),
                });
                void params.stream.write({
                    tags: { container: "my-container" },
                    name: "test-service-a",
                    msg: "1",
                    timestamp: new Date("2021-05-13T20:01:00.000Z"),
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            const command = new logs_1.LogsCommand();
            const res = await command.action(makeCommandParams({ garden }));
            (0, chai_1.expect)(res).to.eql({
                result: [
                    {
                        tags: { container: "my-container" },
                        name: "test-service-a",
                        msg: "1",
                        timestamp: new Date("2021-05-13T20:01:00.000Z"),
                    },
                    {
                        tags: { container: "my-container" },
                        name: "test-service-a",
                        msg: "2",
                        timestamp: new Date("2021-05-13T20:02:00.000Z"),
                    },
                    {
                        tags: { container: "my-container" },
                        name: "test-service-a",
                        msg: "3",
                        timestamp: new Date("2021-05-13T20:03:00.000Z"),
                    },
                    {
                        tags: { container: "my-container" },
                        name: "test-service-a",
                        timestamp: new Date("2021-05-13T20:04:00.000Z"),
                        msg: "4",
                    },
                ],
            });
        });
        it("should skip empty entries", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                // Empty message and invalid date
                void stream.write({
                    tags: { container: "my-container" },
                    name: "test-service-a",
                    msg: "",
                    timestamp: new Date(""),
                });
                // Empty message and empty date
                void stream.write({
                    tags: { container: "my-container" },
                    name: "test-service-a",
                    msg: "",
                    timestamp: undefined,
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            const command = new logs_1.LogsCommand();
            const res = await command.action(makeCommandParams({ garden }));
            (0, chai_1.expect)(res).to.eql({ result: [] });
        });
        it("should render the service name by default", async () => {
            const garden = await makeGarden(tmpDir, makeTestPlugin());
            const command = new logs_1.LogsCommand();
            await command.action(makeCommandParams({ garden }));
            const out = getLogOutput(garden, logMsg);
            (0, chai_1.expect)(out[0]).to.eql(`${color.bold("test-service-a")} → ${msgColor("Yes, this is log")}`);
        });
        it("should optionally skip rendering the service name", async () => {
            const garden = await makeGarden(tmpDir, makeTestPlugin());
            const command = new logs_1.LogsCommand();
            await command.action(makeCommandParams({ garden, opts: { "hide-name": true } }));
            const out = getLogOutput(garden, logMsg);
            (0, chai_1.expect)(out[0]).to.eql(msgColor("Yes, this is log"));
        });
        it("should optionally show timestamps", async () => {
            const garden = await makeGarden(tmpDir, makeTestPlugin());
            const command = new logs_1.LogsCommand();
            await command.action(makeCommandParams({ garden, opts: { timestamps: true } }));
            const out = getLogOutput(garden, logMsg);
            (0, chai_1.expect)(out[0]).to.eql(`${color.bold("test-service-a")} → ${chalk_1.default.gray(timestamp.toISOString())} → ${msgColor("Yes, this is log")}`);
        });
        it("should render entries with no ansi color white", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                void stream.write({
                    tags: { container: "my-container" },
                    name: "test-service-a",
                    msg: logMsg,
                    timestamp: undefined,
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            const command = new logs_1.LogsCommand();
            await command.action(makeCommandParams({ garden }));
            const out = getLogOutput(garden, logMsg);
            (0, chai_1.expect)(out[0]).to.eql(`${color.bold("test-service-a")} → ${chalk_1.default.white("Yes, this is log")}`);
        });
        context("mutliple services", () => {
            it("should align content for visible entries", async () => {
                const getServiceLogsHandler = async ({ action, stream }) => {
                    if (action.name === "a-short") {
                        void stream.write({
                            tags: { container: "short" },
                            name: "a-short",
                            msg: logMsgWithColor,
                            timestamp: new Date("2021-05-13T20:01:00.000Z"), // <--- 1
                        });
                        void stream.write({
                            tags: { container: "short" },
                            name: "a-short",
                            msg: logMsgWithColor,
                            timestamp: new Date("2021-05-13T20:03:00.000Z"), // <--- 3
                        });
                        void stream.write({
                            tags: { container: "short" },
                            name: "a-short",
                            msg: logMsgWithColor,
                            timestamp: new Date("2021-05-13T20:06:00.000Z"), // <--- 6
                        });
                    }
                    else if (action.name === "b-not-short") {
                        void stream.write({
                            tags: { container: "not-short" },
                            name: "b-not-short",
                            msg: logMsgWithColor,
                            timestamp: new Date("2021-05-13T20:02:00.000Z"), // <--- 2
                        });
                    }
                    else if (action.name === "c-by-far-the-longest-of-the-bunch") {
                        void stream.write({
                            tags: { container: "by-far-the-longest-of-the-bunch" },
                            name: "c-by-far-the-longest-of-the-bunch",
                            msg: logMsgWithColor,
                            timestamp: new Date("2021-05-13T20:04:00.000Z"),
                            level: logger_1.LogLevel.verbose,
                        });
                    }
                    else if (action.name === "d-very-very-long") {
                        void stream.write({
                            tags: { container: "very-very-long" },
                            name: "d-very-very-long",
                            msg: logMsgWithColor,
                            timestamp: new Date("2021-05-13T20:05:00.000Z"), // <--- 5
                        });
                    }
                    return {};
                };
                const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
                garden.setActionConfigs([], [
                    makeDeployAction(tmpDir.path, "a-short"),
                    makeDeployAction(tmpDir.path, "b-not-short"),
                    makeDeployAction(tmpDir.path, "c-by-far-the-longest-of-the-bunch"),
                    makeDeployAction(tmpDir.path, "d-very-very-long"),
                ]);
                // Entries are color coded by their alphabetical order
                const colA = chalk_1.default[logs_1.colors[0]];
                const colB = chalk_1.default[logs_1.colors[1]];
                const colD = chalk_1.default[logs_1.colors[3]];
                const dc = msgColor;
                const command = new logs_1.LogsCommand();
                await command.action(makeCommandParams({ garden, opts: { "show-tags": true } }));
                const out = getLogOutput(garden, logMsg, (entry) => entry.level === logger_1.LogLevel.info);
                (0, chai_1.expect)(out[0]).to.eql(`${colA.bold("a-short")} → ${chalk_1.default.gray("[container=short] ")}${dc(logMsg)}`);
                (0, chai_1.expect)(out[1]).to.eql(`${colB.bold("b-not-short")} → ${chalk_1.default.gray("[container=not-short] ")}${dc(logMsg)}`);
                (0, chai_1.expect)(out[2]).to.eql(`${colA.bold("a-short    ")} → ${chalk_1.default.gray("[container=short] ")}${dc(logMsg)}`);
                (0, chai_1.expect)(out[3]).to.eql(`${colD.bold("d-very-very-long")} → ${chalk_1.default.gray("[container=very-very-long] ")}${dc(logMsg)}`);
                (0, chai_1.expect)(out[4]).to.eql(`${colA.bold("a-short         ")} → ${chalk_1.default.gray("[container=short] ")}${dc(logMsg)}`);
            });
        });
        it("should assign the same color to each service, regardless of which service logs are streamed", async () => {
            const getServiceLogsHandler = async ({ action, stream }) => {
                if (action.name === "test-service-a") {
                    void stream.write({
                        tags: { container: "my-container" },
                        name: "test-service-a",
                        msg: logMsgWithColor,
                        timestamp: new Date("2021-05-13T20:00:00.000Z"),
                    });
                }
                else {
                    void stream.write({
                        tags: { container: "my-container" },
                        name: "test-service-b",
                        msg: logMsgWithColor,
                        timestamp: new Date("2021-05-13T20:01:00.000Z"),
                    });
                }
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            garden.setActionConfigs([], [makeDeployAction(tmpDir.path, "test-service-a"), makeDeployAction(tmpDir.path, "test-service-b")]);
            const command = new logs_1.LogsCommand();
            // Only get logs for test-service-b.
            await command.action(makeCommandParams({ garden, args: { names: ["test-service-b"] } }));
            const out = getLogOutput(garden, logMsg);
            const color2 = chalk_1.default[logs_1.colors[1]];
            // Assert that the service gets the "second" color, even though its the only one we're fetching logs for.
            (0, chai_1.expect)(out[0]).to.eql(`${color2.bold("test-service-b")} → ${msgColor("Yes, this is log")}`);
        });
        const actionConfigsForTags = () => [
            makeDeployAction(tmpDir.path, "api"),
            makeDeployAction(tmpDir.path, "frontend"),
        ];
        it("should optionally print tags with --show-tags", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                void stream.write({
                    tags: { container: "api" },
                    name: "api",
                    msg: logMsgWithColor,
                    timestamp: new Date(),
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            garden.setActionConfigs([], actionConfigsForTags());
            const command = new logs_1.LogsCommand();
            await command.action(makeCommandParams({ garden, opts: { "show-tags": true } }));
            const out = getLogOutput(garden, logMsg);
            (0, chai_1.expect)(out[0]).to.eql(`${color.bold("api")} → ${chalk_1.default.gray("[container=api] ")}${msgColor("Yes, this is log")}`);
        });
        // These tests use tags as emitted by `container`/`kubernetes`/`helm` services, which use the `container` tag.
        const filterByTag = (entries, tag) => {
            return entries.filter((e) => e.tags["container"] === tag);
        };
        it("should apply a basic --tag filter", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                void stream.write({
                    tags: { container: "api" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "frontend" },
                    name: "frontend",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            garden.setActionConfigs([], actionConfigsForTags());
            const command = new logs_1.LogsCommand();
            const res = await command.action(makeCommandParams({ garden, opts: { tag: ["container=api"] } }));
            (0, chai_1.expect)(filterByTag(res.result, "api").length).to.eql(2);
            (0, chai_1.expect)(filterByTag(res.result, "frontend").length).to.eql(0);
        });
        it("should throw when passed an invalid --tag filter", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                void stream.write({
                    tags: { container: "api-main" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            garden.setActionConfigs([], actionConfigsForTags());
            const command = new logs_1.LogsCommand();
            await (0, helpers_1.expectError)(() => command.action(makeCommandParams({ garden, opts: { tag: ["*-main"] } })), {
                contains: "Unable to parse the given --tag flags. Format should be key=value.",
            });
        });
        it("should AND together tag filters in a given --tag option instance", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                void stream.write({
                    tags: { container: "api", myTag: "1" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "api", myTag: "2" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "frontend", myTag: "1" },
                    name: "frontend",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            garden.setActionConfigs([], actionConfigsForTags());
            const command = new logs_1.LogsCommand();
            const res = await command.action(makeCommandParams({ garden, opts: { tag: ["container=api,myTag=1"] } }));
            const matching = filterByTag(res.result, "api");
            (0, chai_1.expect)(matching.length).to.eql(2); // The same log line is emitted for each service in this test setup (here: 2)
            (0, chai_1.expect)(matching[0].tags).to.eql({ container: "api", myTag: "1" });
            (0, chai_1.expect)(matching[1].tags).to.eql({ container: "api", myTag: "1" });
        });
        it("should OR together tag filters from all provided --tag option instances", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                void stream.write({
                    tags: { container: "api", myTag: "1" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "api", myTag: "2" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "frontend", myTag: "1" },
                    name: "frontend",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "frontend", myTag: "2" },
                    name: "frontend",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            garden.setActionConfigs([], actionConfigsForTags());
            const command = new logs_1.LogsCommand();
            const res = await command.action(makeCommandParams({ garden, opts: { tag: ["container=api,myTag=1", "container=frontend"] } }));
            const apiMatching = filterByTag(res.result, "api");
            const frontendMatching = filterByTag(res.result, "frontend");
            (0, chai_1.expect)(apiMatching.length).to.eql(2); // The same log line is emitted for each service in this test setup (here: 2)
            (0, chai_1.expect)(apiMatching[0].tags).to.eql({ container: "api", myTag: "1" });
            (0, chai_1.expect)(apiMatching[1].tags).to.eql({ container: "api", myTag: "1" });
            (0, chai_1.expect)(frontendMatching.length).to.eql(4);
            (0, chai_1.expect)(frontendMatching[0].tags).to.eql({ container: "frontend", myTag: "1" });
            (0, chai_1.expect)(frontendMatching[1].tags).to.eql({ container: "frontend", myTag: "2" });
        });
        it("should apply a wildcard --tag filter", async () => {
            const getServiceLogsHandler = async ({ stream }) => {
                void stream.write({
                    tags: { container: "api-main" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "api-sidecar" },
                    name: "api",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "frontend-main" },
                    name: "frontend",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                void stream.write({
                    tags: { container: "frontend-sidecar" },
                    name: "frontend",
                    msg: logMsg,
                    timestamp: new Date(),
                });
                return {};
            };
            const garden = await makeGarden(tmpDir, makeTestPlugin(getServiceLogsHandler));
            garden.setActionConfigs([], actionConfigsForTags());
            const command = new logs_1.LogsCommand();
            const res = await command.action(makeCommandParams({ garden, opts: { tag: ["container=*-main"] } }));
            (0, chai_1.expect)(filterByTag(res.result, "api-main").length).to.eql(2);
            (0, chai_1.expect)(filterByTag(res.result, "frontend-main").length).to.eql(2);
            (0, chai_1.expect)(filterByTag(res.result, "api-sidecar").length).to.eql(0);
            (0, chai_1.expect)(filterByTag(res.result, "frontend-sidecar").length).to.eql(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxvZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFHSCwrQkFBNkI7QUFFN0Isd0RBQW1FO0FBR25FLDBEQUF5RDtBQUN6RCw4Q0FNeUI7QUFDekIseURBQStEO0FBQy9ELGdFQUFvRTtBQUNwRSxrREFBeUI7QUFFekIsMERBQXdEO0FBRXhELGdFQUE0RTtBQUk1RSxvRUFBb0U7QUFFcEUsU0FBUyxpQkFBaUIsQ0FBQyxFQUN6QixNQUFNLEVBQ04sSUFBSSxHQUFHLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxFQUM5QixJQUFJLEdBQUcsRUFBRSxHQUtWO0lBQ0MsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtJQUN0QixPQUFPO1FBQ0wsTUFBTTtRQUNOLEdBQUc7UUFDSCxTQUFTLEVBQUUsR0FBRztRQUNkLFNBQVMsRUFBRSxHQUFHO1FBQ2QsSUFBSTtRQUNKLElBQUksRUFBRSxJQUFBLCtCQUFxQixFQUFDO1lBQzFCLEdBQUcsSUFBSTtTQUNSLENBQUM7S0FDSCxDQUFBO0FBQ0gsQ0FBQztBQUVELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLElBQVksRUFBb0IsRUFBRSxDQUFDLENBQUM7SUFDOUUsVUFBVSxFQUFFLCtCQUFtQjtJQUMvQixJQUFJLEVBQUUsUUFBUTtJQUNkLElBQUk7SUFDSixJQUFJLEVBQUUsTUFBTTtJQUNaLFFBQVEsRUFBRSxLQUFLO0lBQ2YsUUFBUSxFQUFFO1FBQ1IsUUFBUTtLQUNUO0lBQ0QsSUFBSSxFQUFFO1FBQ0osYUFBYSxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQztLQUM5QjtDQUNGLENBQUMsQ0FBQTtBQUVGLEtBQUssVUFBVSxVQUFVLENBQUMsTUFBMkIsRUFBRSxNQUFvQjtJQUN6RSxNQUFNLE1BQU0sR0FBa0IsSUFBQSw2QkFBbUIsRUFBQztRQUNoRCxJQUFJLEVBQUUs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