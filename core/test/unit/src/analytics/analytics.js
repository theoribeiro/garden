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
const nock_1 = __importDefault(require("nock"));
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const helpers_1 = require("../../../helpers");
const analytics_1 = require("../../../../src/analytics/analytics");
const constants_1 = require("../../../../src/constants");
const api_1 = require("../../../../src/cloud/api");
const logger_1 = require("../../../../src/logger/logger");
const global_1 = require("../../../../src/config-store/global");
class FakeCloudApi extends api_1.CloudApi {
    static async factory(params) {
        return new FakeCloudApi(params.log, "https://garden.io", new global_1.GlobalConfigStore());
    }
    async getProfile() {
        return {
            id: 1,
            createdAt: new Date().toString(),
            updatedAt: new Date().toString(),
            name: "gordon",
            vcsUsername: "gordon@garden.io",
            serviceAccount: false,
            organization: {
                id: 1,
                name: "garden",
            },
            cachedPermissions: {},
            accessTokens: [],
            groups: [],
        };
    }
}
describe("AnalyticsHandler", () => {
    const remoteOriginUrl = "git@github.com:garden-io/garden.git";
    const host = "https://api.segment.io";
    const scope = (0, nock_1.default)(host);
    // The sha512 hash of "test-project-a"
    const projectName = "95048f63dc14db38ed4138ffb6ff89992abdc19b8c899099c52a94f8fcc0390eec6480385cfa5014f84c0a14d4984825ce3bf25db1386d2b5382b936899df675";
    // The codenamize version + the sha512 hash of "test-project-a"
    const projectNameV2 = "discreet-sudden-struggle_95048f63dc14db38ed4138ffb6ff8999";
    const time = new Date();
    const basicConfig = {
        anonymousUserId: "6d87dd61-0feb-4373-8c78-41cd010907e7",
        firstRunAt: time,
        latestRunAt: time,
        optedOut: false,
        cloudProfileEnabled: false,
    };
    let analytics;
    let garden;
    let resetAnalyticsConfig;
    let ciInfo = {
        isCi: false,
        ciName: null,
    };
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        resetAnalyticsConfig = await (0, helpers_1.enableAnalytics)(garden);
    });
    after(async () => {
        await resetAnalyticsConfig();
        nock_1.default.cleanAll();
    });
    describe("factory", () => {
        beforeEach(async () => {
            garden = await (0, helpers_1.makeTestGardenA)();
            garden.vcsInfo.originUrl = remoteOriginUrl;
            await (0, helpers_1.enableAnalytics)(garden);
        });
        afterEach(async () => {
            // Flush so queued events don't leak between tests
            await analytics.flush();
            analytics_1.AnalyticsHandler.clearInstance();
        });
        it("should initialize the analytics config if missing", async () => {
            await garden.globalConfigStore.set("analytics", {});
            const currentConfig = await garden.globalConfigStore.get("analytics");
            //  Verify that it was deleted
            (0, chai_1.expect)(currentConfig).to.eql({});
            const now = (0, helpers_1.freezeTime)();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const newConfig = await garden.globalConfigStore.get("analytics");
            (0, chai_1.expect)(newConfig.anonymousUserId).to.be.a("string");
            (0, chai_1.expect)(newConfig).to.eql({
                anonymousUserId: newConfig.anonymousUserId,
                firstRunAt: now,
                latestRunAt: now,
                cloudProfileEnabled: false,
            });
        });
        it("should create a valid anonymous user ID on first run", async () => {
            await garden.globalConfigStore.set("analytics", {});
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const config = await garden.globalConfigStore.get("analytics");
            (0, chai_1.expect)((0, uuid_1.validate)(config.anonymousUserId)).to.eql(true);
        });
        it("should set user ID to ci-user if in CI", async () => {
            await garden.globalConfigStore.set("analytics", {});
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo: { isCi: true, ciName: "foo" } });
            const config = await garden.globalConfigStore.get("analytics");
            (0, chai_1.expect)(config.anonymousUserId).to.eql("ci-user");
        });
        it("should not override anonymous user ID on subsequent runs", async () => {
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const config = await garden.globalConfigStore.get("analytics");
            (0, chai_1.expect)(config.anonymousUserId).to.eql(basicConfig.anonymousUserId);
        });
        it("should update the analytics config if it already exists", async () => {
            await garden.globalConfigStore.set("analytics", basicConfig);
            const now = (0, helpers_1.freezeTime)();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const config = await garden.globalConfigStore.get("analytics");
            (0, chai_1.expect)(config).to.eql({
                anonymousUserId: basicConfig.anonymousUserId,
                firstRunAt: basicConfig.firstRunAt,
                latestRunAt: now,
                cloudProfileEnabled: false,
                optedOut: false,
            });
        });
        it("should print an info message if first Garden run", async () => {
            await garden.globalConfigStore.set("analytics", {});
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const msgs = garden.log.root.getLogEntries().map((l) => l.getMessages());
            const infoMsg = msgs.find((messageArr) => { var _a; return (_a = messageArr[0].msg) === null || _a === void 0 ? void 0 : _a.includes("Thanks for installing Garden!"); });
            (0, chai_1.expect)(infoMsg).to.exist;
        });
        it("should NOT print an info message on subsequent runs", async () => {
            // The existens of base config suggests it's not the first run
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const msgs = garden.log.root.getLogEntries().map((l) => l.getMessages());
            const infoMsg = msgs.find((messageArr) => { var _a; return (_a = messageArr[0].msg) === null || _a === void 0 ? void 0 : _a.includes("Thanks for installing Garden!"); });
            (0, chai_1.expect)(infoMsg).not.to.exist;
        });
        it("should identify the user with an anonymous ID", async () => {
            var _a;
            let payload;
            scope
                .post(`/v1/batch`, (body) => {
                const events = body.batch.map((event) => event.type);
                payload = body.batch;
                return (0, lodash_1.isEqual)(events, ["identify"]);
            })
                .reply(200);
            const now = (0, helpers_1.freezeTime)();
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            await analytics.flush();
            (0, chai_1.expect)(analytics.isEnabled).to.equal(true);
            (0, chai_1.expect)(scope.isDone()).to.equal(true);
            // This is the important part
            (0, chai_1.expect)(payload.userId).to.be.undefined;
            (0, chai_1.expect)(payload[0].traits.platform).to.be.a("string");
            (0, chai_1.expect)(payload[0].traits.platformVersion).to.be.a("string");
            (0, chai_1.expect)(payload[0].traits.gardenVersion).to.be.a("string");
            (0, chai_1.expect)(payload).to.eql([
                {
                    anonymousId: "6d87dd61-0feb-4373-8c78-41cd010907e7",
                    traits: {
                        userIdV2: analytics_1.AnalyticsHandler.hashV2("6d87dd61-0feb-4373-8c78-41cd010907e7"),
                        platform: payload[0].traits.platform,
                        platformVersion: payload[0].traits.platformVersion,
                        gardenVersion: payload[0].traits.gardenVersion,
                        isCI: payload[0].traits.isCI,
                        // While the internal representation in objects is a Date object, API returns strings
                        firstRunAt: (_a = basicConfig.firstRunAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
                        latestRunAt: now.toISOString(),
                        isRecurringUser: false,
                    },
                    type: "identify",
                    context: payload[0].context,
                    _metadata: payload[0]._metadata,
                    timestamp: payload[0].timestamp,
                    messageId: payload[0].messageId,
                },
            ]);
        });
        it("should not identify the user if analytics is disabled", async () => {
            let payload;
            scope
                .post(`/v1/batch`, (body) => {
                const events = body.batch.map((event) => event.type);
                payload = body.batch;
                return (0, lodash_1.isEqual)(events, ["identify"]);
            })
                .reply(200);
            await garden.globalConfigStore.set("analytics", {
                ...basicConfig,
                optedOut: true,
            });
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            await analytics.flush();
            (0, chai_1.expect)(analytics.isEnabled).to.equal(false);
            (0, chai_1.expect)(scope.isDone()).to.equal(false);
            (0, chai_1.expect)(payload).to.be.undefined;
        });
        it("should be enabled by default", async () => {
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            (0, chai_1.expect)(analytics.isEnabled).to.be.true;
        });
        it("should be disabled if env var for disabling analytics is set", async () => {
            const originalEnvVar = constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS;
            constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS = true;
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS = originalEnvVar;
            (0, chai_1.expect)(analytics.isEnabled).to.be.false;
        });
        it("should be disabled if user opted out", async () => {
            await garden.globalConfigStore.set("analytics", {
                ...basicConfig,
                optedOut: true,
            });
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            (0, chai_1.expect)(analytics.isEnabled).to.be.false;
        });
    });
    describe("factory (user is logged in)", async () => {
        beforeEach(async () => {
            const logger = new logger_1.Logger({
                level: logger_1.LogLevel.info,
                writers: [],
                storeEntries: false,
            });
            const cloudApi = await FakeCloudApi.factory({ log: logger.placeholder() });
            garden = await (0, helpers_1.makeTestGardenA)(undefined, { cloudApi });
            garden.vcsInfo.originUrl = remoteOriginUrl;
            await (0, helpers_1.enableAnalytics)(garden);
        });
        afterEach(async () => {
            await analytics.flush();
            analytics_1.AnalyticsHandler.clearInstance();
        });
        it("should not replace the anonymous user ID with the Cloud user ID", async () => {
            await garden.globalConfigStore.set("analytics", basicConfig);
            const now = (0, helpers_1.freezeTime)();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const newConfig = await garden.globalConfigStore.get("analytics");
            (0, chai_1.expect)(newConfig).to.eql({
                anonymousUserId: "6d87dd61-0feb-4373-8c78-41cd010907e7",
                firstRunAt: basicConfig.firstRunAt,
                latestRunAt: now,
                optedOut: false,
                cloudProfileEnabled: true,
            });
        });
        it("should be enabled unless env var for disabling is set", async () => {
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const isEnabledWhenNoEnvVar = analytics.isEnabled;
            const originalEnvVar = constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS;
            constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS = true;
            // Create a fresh instance after setting env var
            analytics_1.AnalyticsHandler.clearInstance();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const isEnabledWhenEnvVar = analytics.isEnabled;
            constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS = originalEnvVar;
            (0, chai_1.expect)(isEnabledWhenNoEnvVar).to.eql(true);
            (0, chai_1.expect)(isEnabledWhenEnvVar).to.eql(false);
        });
        it("should identify the user with a Cloud ID", async () => {
            var _a;
            let payload;
            scope
                .post(`/v1/batch`, (body) => {
                const events = body.batch.map((event) => event.type);
                payload = body.batch;
                return (0, lodash_1.isEqual)(events, ["identify"]);
            })
                .reply(200);
            const now = (0, helpers_1.freezeTime)();
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            await analytics.flush();
            (0, chai_1.expect)(analytics.isEnabled).to.equal(true);
            (0, chai_1.expect)(scope.isDone()).to.equal(true);
            (0, chai_1.expect)(payload).to.eql([
                {
                    userId: "garden_1",
                    anonymousId: "6d87dd61-0feb-4373-8c78-41cd010907e7",
                    traits: {
                        userIdV2: analytics_1.AnalyticsHandler.hashV2("6d87dd61-0feb-4373-8c78-41cd010907e7"),
                        customer: "garden",
                        platform: payload[0].traits.platform,
                        platformVersion: payload[0].traits.platformVersion,
                        gardenVersion: payload[0].traits.gardenVersion,
                        isCI: payload[0].traits.isCI,
                        // While the internal representation in objects is a Date object, API returns strings
                        firstRunAt: (_a = basicConfig.firstRunAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
                        latestRunAt: now.toISOString(),
                        isRecurringUser: false,
                    },
                    type: "identify",
                    context: payload[0].context,
                    _metadata: payload[0]._metadata,
                    timestamp: payload[0].timestamp,
                    messageId: payload[0].messageId,
                },
            ]);
        });
        it("should not identify the user if analytics is disabled via env var", async () => {
            let payload;
            scope
                .post(`/v1/batch`, (body) => {
                const events = body.batch.map((event) => event.type);
                payload = body.batch;
                return (0, lodash_1.isEqual)(events, ["identify"]);
            })
                .reply(200);
            const originalEnvVar = constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS;
            constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS = true;
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            constants_1.gardenEnv.GARDEN_DISABLE_ANALYTICS = originalEnvVar;
            await analytics.flush();
            (0, chai_1.expect)(analytics.isEnabled).to.equal(false);
            (0, chai_1.expect)(scope.isDone()).to.equal(false);
            (0, chai_1.expect)(payload).to.be.undefined;
        });
    });
    describe("trackCommand", () => {
        beforeEach(async () => {
            garden = await (0, helpers_1.makeTestGardenA)();
            garden.vcsInfo.originUrl = remoteOriginUrl;
            await (0, helpers_1.enableAnalytics)(garden);
        });
        afterEach(async () => {
            // Flush so queued events don't leak between tests
            await analytics.flush();
            analytics_1.AnalyticsHandler.clearInstance();
        });
        it("should return the event with the correct project metadata", async () => {
            scope.post(`/v1/batch`).reply(200);
            await garden.globalConfigStore.set("analytics", basicConfig);
            const now = (0, helpers_1.freezeTime)();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const event = analytics.trackCommand("testCommand");
            (0, chai_1.expect)(event).to.eql({
                type: "Run Command",
                properties: {
                    name: "testCommand",
                    projectId: analytics_1.AnalyticsHandler.hash(remoteOriginUrl),
                    projectIdV2: analytics_1.AnalyticsHandler.hashV2(remoteOriginUrl),
                    projectName,
                    projectNameV2,
                    enterpriseProjectId: undefined,
                    enterpriseProjectIdV2: undefined,
                    enterpriseDomain: undefined,
                    enterpriseDomainV2: undefined,
                    isLoggedIn: false,
                    customer: undefined,
                    ciName: analytics["ciName"],
                    system: analytics["systemConfig"],
                    isCI: analytics["isCI"],
                    sessionId: analytics["sessionId"],
                    firstRunAt: basicConfig.firstRunAt,
                    latestRunAt: now,
                    isRecurringUser: false,
                    projectMetadata: {
                        modulesCount: 3,
                        moduleTypes: ["test"],
                        tasksCount: 4,
                        servicesCount: 3,
                        testsCount: 5,
                    },
                },
            });
        });
        it("should set the CI info if applicable", async () => {
            scope.post(`/v1/batch`).reply(200);
            await garden.globalConfigStore.set("analytics", basicConfig);
            const now = (0, helpers_1.freezeTime)();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo: { isCi: true, ciName: "foo" } });
            const event = analytics.trackCommand("testCommand");
            (0, chai_1.expect)(event).to.eql({
                type: "Run Command",
                properties: {
                    name: "testCommand",
                    projectId: analytics_1.AnalyticsHandler.hash(remoteOriginUrl),
                    projectIdV2: analytics_1.AnalyticsHandler.hashV2(remoteOriginUrl),
                    projectName,
                    projectNameV2,
                    enterpriseProjectId: undefined,
                    enterpriseProjectIdV2: undefined,
                    enterpriseDomain: undefined,
                    enterpriseDomainV2: undefined,
                    isLoggedIn: false,
                    customer: undefined,
                    system: analytics["systemConfig"],
                    isCI: true,
                    ciName: "foo",
                    sessionId: analytics["sessionId"],
                    firstRunAt: basicConfig.firstRunAt,
                    latestRunAt: now,
                    isRecurringUser: false,
                    projectMetadata: {
                        modulesCount: 3,
                        moduleTypes: ["test"],
                        tasksCount: 4,
                        servicesCount: 3,
                        testsCount: 5,
                    },
                },
            });
        });
        it("should handle projects with no services, tests, or tasks", async () => {
            scope.post(`/v1/batch`).reply(200);
            garden.setActionConfigs([
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "module-a",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: "",
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {}, // <-------
                },
            ]);
            await garden.globalConfigStore.set("analytics", basicConfig);
            const now = (0, helpers_1.freezeTime)();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const event = analytics.trackCommand("testCommand");
            (0, chai_1.expect)(event).to.eql({
                type: "Run Command",
                properties: {
                    name: "testCommand",
                    projectId: analytics_1.AnalyticsHandler.hash(remoteOriginUrl),
                    projectIdV2: analytics_1.AnalyticsHandler.hashV2(remoteOriginUrl),
                    projectName,
                    projectNameV2,
                    enterpriseProjectId: undefined,
                    enterpriseProjectIdV2: undefined,
                    enterpriseDomain: undefined,
                    enterpriseDomainV2: undefined,
                    isLoggedIn: false,
                    customer: undefined,
                    ciName: analytics["ciName"],
                    system: analytics["systemConfig"],
                    isCI: analytics["isCI"],
                    sessionId: analytics["sessionId"],
                    firstRunAt: basicConfig.firstRunAt,
                    latestRunAt: now,
                    isRecurringUser: false,
                    projectMetadata: {
                        modulesCount: 1,
                        moduleTypes: ["test"],
                        tasksCount: 0,
                        servicesCount: 0,
                        testsCount: 0,
                    },
                },
            });
        });
        it("should include enterprise metadata", async () => {
            scope.post(`/v1/batch`).reply(200);
            const root = (0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id");
            garden = await (0, helpers_1.makeTestGarden)(root);
            garden.vcsInfo.originUrl = remoteOriginUrl;
            await garden.globalConfigStore.set("analytics", basicConfig);
            const now = (0, helpers_1.freezeTime)();
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            const event = analytics.trackCommand("testCommand");
            (0, chai_1.expect)(event).to.eql({
                type: "Run Command",
                properties: {
                    name: "testCommand",
                    projectId: analytics_1.AnalyticsHandler.hash(remoteOriginUrl),
                    projectIdV2: analytics_1.AnalyticsHandler.hashV2(remoteOriginUrl),
                    projectName: analytics_1.AnalyticsHandler.hash("has-domain-and-id"),
                    projectNameV2: analytics_1.AnalyticsHandler.hashV2("has-domain-and-id"),
                    enterpriseDomain: analytics_1.AnalyticsHandler.hash("http://example.invalid"),
                    enterpriseDomainV2: analytics_1.AnalyticsHandler.hashV2("http://example.invalid"),
                    enterpriseProjectId: analytics_1.AnalyticsHandler.hash("dummy-id"),
                    enterpriseProjectIdV2: analytics_1.AnalyticsHandler.hashV2("dummy-id"),
                    isLoggedIn: false,
                    customer: undefined,
                    ciName: analytics["ciName"],
                    system: analytics["systemConfig"],
                    isCI: analytics["isCI"],
                    sessionId: analytics["sessionId"],
                    firstRunAt: basicConfig.firstRunAt,
                    latestRunAt: now,
                    isRecurringUser: false,
                    projectMetadata: {
                        modulesCount: 0,
                        moduleTypes: [],
                        tasksCount: 0,
                        servicesCount: 0,
                        testsCount: 0,
                    },
                },
            });
        });
    });
    // NOTE: Segement always flushes on the first event, then queues and flushes subsequent events.
    // That's why there are usually two mock requests per test below.
    describe("flush", () => {
        const getEvents = (body) => body.batch.map((event) => ({
            event: event.event,
            type: event.type,
            name: event.properties.name,
        }));
        beforeEach(async () => {
            garden = await (0, helpers_1.makeTestGardenA)();
            garden.vcsInfo.originUrl = remoteOriginUrl;
            await (0, helpers_1.enableAnalytics)(garden);
        });
        afterEach(async () => {
            // Flush so queued events don't leak between tests
            await analytics.flush();
            analytics_1.AnalyticsHandler.clearInstance();
        });
        it("should wait for pending events on network delays", async () => {
            scope
                .post(`/v1/batch`, (body) => {
                // Assert that the event batch contains a single "track" event
                return (0, lodash_1.isEqual)(getEvents(body), [
                    {
                        event: "Run Command",
                        type: "track",
                        name: "test-command-A",
                    },
                ]);
            })
                .delay(1500)
                .reply(200);
            await garden.globalConfigStore.set("analytics", basicConfig);
            analytics = await analytics_1.AnalyticsHandler.factory({ garden, log: garden.log, ciInfo });
            analytics.trackCommand("test-command-A");
            await analytics.flush();
            (0, chai_1.expect)(analytics["pendingEvents"].size).to.eql(0);
            (0, chai_1.expect)(scope.isDone()).to.equal(true);
        });
    });
    describe("getAnonymousUserId", () => {
        it("should create a new valid anonymous user ID if none exists", async () => {
            const anonymousUserId = (0, analytics_1.getAnonymousUserId)({ analyticsConfig: undefined, isCi: false });
            (0, chai_1.expect)((0, uuid_1.validate)(anonymousUserId)).to.eql(true);
        });
        it("should return existing anonymous user ID if set", async () => {
            const anonymousUserId = (0, analytics_1.getAnonymousUserId)({ analyticsConfig: basicConfig, isCi: false });
            (0, chai_1.expect)(anonymousUserId).to.eql("6d87dd61-0feb-4373-8c78-41cd010907e7");
        });
        it("should return existing anonymous user ID if set and in CI", async () => {
            const anonymousUserId = (0, analytics_1.getAnonymousUserId)({ analyticsConfig: basicConfig, isCi: false });
            (0, chai_1.expect)(anonymousUserId).to.eql("6d87dd61-0feb-4373-8c78-41cd010907e7");
        });
        it("should return 'ci-user' if anonymous user ID is not already set and in CI", async () => {
            const anonymousUserId = (0, analytics_1.getAnonymousUserId)({ analyticsConfig: undefined, isCi: true });
            (0, chai_1.expect)(anonymousUserId).to.eql("ci-user");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl0aWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYW5hbHl0aWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQTZCO0FBQzdCLGdEQUF1QjtBQUN2QixtQ0FBZ0M7QUFDaEMsK0JBQStDO0FBRS9DLDhDQUF1SDtBQUN2SCxtRUFBMEY7QUFDMUYseURBQTBFO0FBQzFFLG1EQUFvRDtBQUVwRCwwREFBZ0U7QUFDaEUsZ0VBQThGO0FBRzlGLE1BQU0sWUFBYSxTQUFRLGNBQVE7SUFDakMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBaUY7UUFDcEcsT0FBTyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLG1CQUFtQixFQUFFLElBQUksMEJBQWlCLEVBQUUsQ0FBQyxDQUFBO0lBQ25GLENBQUM7SUFDRCxLQUFLLENBQUMsVUFBVTtRQUNkLE9BQU87WUFDTCxFQUFFLEVBQUUsQ0FBQztZQUNMLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtZQUNoQyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7WUFDaEMsSUFBSSxFQUFFLFFBQVE7WUFDZCxXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLFlBQVksRUFBRTtnQkFDWixFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsUUFBUTthQUNmO1lBQ0QsaUJBQWlCLEVBQUUsRUFBRTtZQUNyQixZQUFZLEVBQUUsRUFBRTtZQUNoQixNQUFNLEVBQUUsRUFBRTtTQUNYLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLE1BQU0sZUFBZSxHQUFHLHFDQUFxQyxDQUFBO0lBQzdELE1BQU0sSUFBSSxHQUFHLHdCQUF3QixDQUFBO0lBQ3JDLE1BQU0sS0FBSyxHQUFHLElBQUEs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