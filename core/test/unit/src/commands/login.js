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
const helpers_1 = require("../../../helpers");
const auth_1 = require("../../../../src/cloud/auth");
const login_1 = require("../../../../src/commands/login");
const string_1 = require("../../../../src/util/string");
const api_1 = require("../../../../src/cloud/api");
const logger_1 = require("../../../../src/logger/logger");
const constants_1 = require("../../../../src/constants");
const exceptions_1 = require("../../../../src/exceptions");
const testing_1 = require("../../../../src/util/testing");
const global_1 = require("../../../../src/config-store/global");
const cli_1 = require("../../../../src/cli/cli");
// In the tests below we stub out the auth redirect server but still emit the
// token received event.
describe("LoginCommand", () => {
    let tmpDir;
    let globalConfigStore;
    beforeEach(async () => {
        testdouble_1.default.replace(auth_1.AuthRedirectServer.prototype, "start", async () => { });
        testdouble_1.default.replace(auth_1.AuthRedirectServer.prototype, "close", async () => { });
        tmpDir = await (0, helpers_1.makeTempDir)();
        globalConfigStore = new global_1.GlobalConfigStore(tmpDir.path);
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    it("should log in if the project has a domain without an id", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new login_1.LoginCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        setTimeout(() => {
            garden.events.emit("receivedToken", testToken);
        }, 500);
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
    });
    it("should log in if the project has a domain and an id", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new login_1.LoginCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        setTimeout(() => {
            garden.events.emit("receivedToken", testToken);
        }, 500);
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
    });
    it("should be a no-op if the user is already logged in", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new login_1.LoginCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        await api_1.CloudApi.saveAuthToken(garden.log, garden.globalConfigStore, testToken, garden.cloudDomain);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "checkClientAuthToken", async () => true);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "startInterval", async () => { });
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level === logger_1.LogLevel.info).join("\n");
        (0, chai_1.expect)(logOutput).to.include("You're already logged in to Garden Enterprise.");
    });
    it("should log in if the project config uses secrets in project variables", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new login_1.LoginCommand();
        const cli = new helpers_1.TestGardenCli();
        // NOTE: if we use the garden instance from the TestGardenCli instead of makeDummyGarden
        // it would try to fully resolve the secrets which are not available unless we mock the
        // cloud API instance.
        const garden = await (0, cli_1.makeDummyGarden)((0, helpers_1.getDataDir)("test-projects", "login", "secret-in-project-variables"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        setTimeout(() => {
            garden.events.emit("receivedToken", testToken);
        }, 500);
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, "http://example.invalid");
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
    });
    it("should throw if the project doesn't have a domain", async () => {
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "missing-domain"), {
            commandInfo: { name: "foo", args: {}, opts: {} },
        });
        const command = new login_1.LoginCommand();
        await (0, helpers_1.expectError)(() => command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} })), {
            contains: "Project config is missing a cloud domain.",
        });
    });
    it("should throw if the user has an invalid auth token", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new login_1.LoginCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        await api_1.CloudApi.saveAuthToken(garden.log, garden.globalConfigStore, testToken, garden.cloudDomain);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "checkClientAuthToken", async () => false);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "refreshToken", async () => {
            throw new Error("bummer");
        });
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
        await (0, helpers_1.expectError)(() => command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} })), {
            contains: "bummer",
        });
    });
    it("should throw and print a helpful message on 401 errors", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new login_1.LoginCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        await api_1.CloudApi.saveAuthToken(garden.log, garden.globalConfigStore, testToken, garden.cloudDomain);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "checkClientAuthToken", async () => false);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "refreshToken", async () => {
            throw new exceptions_1.EnterpriseApiError("bummer", { statusCode: 401 });
        });
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
        await (0, helpers_1.expectError)(() => command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} })), {
            contains: "bummer",
        });
        const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level <= logger_1.LogLevel.info).join("\n");
        (0, chai_1.expect)(logOutput).to.include((0, string_1.dedent) `
      Looks like your session token is invalid. If you were previously logged into a different instance
      of Garden Enterprise, log out first before logging in.
    `);
    });
    context("GARDEN_AUTH_TOKEN set in env", () => {
        const saveEnv = constants_1.gardenEnv.GARDEN_AUTH_TOKEN;
        before(() => {
            constants_1.gardenEnv.GARDEN_AUTH_TOKEN = "my-auth-token";
        });
        it("should be a no-op if the user has a valid auth token in the environment", async () => {
            const command = new login_1.LoginCommand();
            const cli = new helpers_1.TestGardenCli();
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
                noEnterprise: false,
                commandInfo: { name: "foo", args: {}, opts: {} },
                globalConfigStore,
            });
            testdouble_1.default.replace(api_1.CloudApi.prototype, "checkClientAuthToken", async () => true);
            await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
            const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level === logger_1.LogLevel.info).join("\n");
            (0, chai_1.expect)(logOutput).to.include("You're already logged in to Garden Enterprise.");
        });
        it("should throw if the user has an invalid auth token in the environment", async () => {
            const command = new login_1.LoginCommand();
            const cli = new helpers_1.TestGardenCli();
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
                noEnterprise: false,
                commandInfo: { name: "foo", args: {}, opts: {} },
                globalConfigStore,
            });
            testdouble_1.default.replace(api_1.CloudApi.prototype, "checkClientAuthToken", async () => false);
            await (0, helpers_1.expectError)(() => command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} })), {
                contains: "The provided access token is expired or has been revoked, please create a new one from the Garden Enterprise UI.",
            });
        });
        after(() => {
            constants_1.gardenEnv.GARDEN_AUTH_TOKEN = saveEnv;
        });
    });
    context("GARDEN_CLOUD_DOMAIN set in env", () => {
        const saveEnv = constants_1.gardenEnv.GARDEN_CLOUD_DOMAIN;
        before(() => {
            constants_1.gardenEnv.GARDEN_CLOUD_DOMAIN = "https://gardencloud.example.com";
        });
        it("should log in even if the project config domain is empty", async () => {
            const postfix = (0, string_1.randomString)();
            const testToken = {
                token: `dummy-token-${postfix}`,
                refreshToken: `dummy-refresh-token-${postfix}`,
                tokenValidity: 60,
            };
            const command = new login_1.LoginCommand();
            const cli = new helpers_1.TestGardenCli();
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "missing-domain"), {
                noEnterprise: false,
                commandInfo: { name: "foo", args: {}, opts: {} },
                globalConfigStore,
            });
            setTimeout(() => {
                garden.events.emit("receivedToken", testToken);
            }, 500);
            await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
            const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, constants_1.gardenEnv.GARDEN_CLOUD_DOMAIN);
            (0, chai_1.expect)(savedToken).to.exist;
            (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
            (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
        });
        it("should log in using the domain in GARDEN_CLOUD_DOMAIN", async () => {
            const postfix = (0, string_1.randomString)();
            const testToken = {
                token: `dummy-token-${postfix}`,
                refreshToken: `dummy-refresh-token-${postfix}`,
                tokenValidity: 60,
            };
            const command = new login_1.LoginCommand();
            const cli = new helpers_1.TestGardenCli();
            const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain"), {
                noEnterprise: false,
                commandInfo: { name: "foo", args: {}, opts: {} },
                globalConfigStore,
            });
            setTimeout(() => {
                garden.events.emit("receivedToken", testToken);
            }, 500);
            await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
            const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, constants_1.gardenEnv.GARDEN_CLOUD_DOMAIN);
            (0, chai_1.expect)(savedToken).to.exist;
            (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
            (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
            const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level === logger_1.LogLevel.info).join("\n");
            (0, chai_1.expect)(logOutput).to.include(`Logging in to ${constants_1.gardenEnv.GARDEN_CLOUD_DOMAIN}`);
        });
        after(() => {
            constants_1.gardenEnv.GARDEN_CLOUD_DOMAIN = saveEnv;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsb2dpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILCtCQUE2QjtBQUM3Qiw0REFBMkI7QUFDM0IsOENBUXlCO0FBQ3pCLHFEQUErRDtBQUUvRCwwREFBNkQ7QUFFN0Qsd0RBQWtFO0FBQ2xFLG1EQUFvRDtBQUNwRCwwREFBd0Q7QUFDeEQseURBQXFEO0FBQ3JELDJEQUErRDtBQUMvRCwwREFBNkQ7QUFDN0QsZ0VBQXVFO0FBQ3ZFLGlEQUF5RDtBQUV6RCw2RUFBNkU7QUFDN0Usd0JBQXdCO0FBQ3hCLFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLElBQUksTUFBcUIsQ0FBQTtJQUN6QixJQUFJLGlCQUFvQyxDQUFBO0lBRXhDLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixvQkFBRSxDQUFDLE9BQU8sQ0FBQyx5QkFBa0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQUE7UUFDakUsb0JBQUUsQ0FBQyxPQUFPLENBQUMseUJBQWtCLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLElBQUksRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFBO1FBRWpFLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQVcsR0FBRSxDQUFBO1FBQzVCLGlCQUFpQixHQUFHLElBQUksMEJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3hELENBQUMsQ0FBQyxDQUFBO0lBRUYsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ3hCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHlEQUF5RCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3ZFLE1BQU0sT0FBTyxHQUFHLElBQUEscUJBQVksR0FBRSxDQUFB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