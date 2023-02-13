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
const string_1 = require("../../../../src/util/string");
const api_1 = require("../../../../src/cloud/api");
const logger_1 = require("../../../../src/logger/logger");
const logout_1 = require("../../../../src/commands/logout");
const testing_1 = require("../../../../src/util/testing");
const global_1 = require("../../../../src/config-store/global");
describe("LogoutCommand", () => {
    let tmpDir;
    let globalConfigStore;
    beforeEach(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)();
        globalConfigStore = new global_1.GlobalConfigStore(tmpDir.path);
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    it("should logout from Garden Cloud", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new logout_1.LogOutCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        await api_1.CloudApi.saveAuthToken(garden.log, garden.globalConfigStore, testToken, garden.cloudDomain);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "checkClientAuthToken", async () => true);
        testdouble_1.default.replace(api_1.CloudApi.prototype, "startInterval", async () => { });
        testdouble_1.default.replace(api_1.CloudApi.prototype, "post", async () => { });
        // Double check token actually exists
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const tokenAfterLogout = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level === logger_1.LogLevel.info).join("\n");
        (0, chai_1.expect)(tokenAfterLogout).to.not.exist;
        (0, chai_1.expect)(logOutput).to.include("Succesfully logged out from Garden Enterprise.");
    });
    it("should be a no-op if the user is already logged out", async () => {
        const command = new logout_1.LogOutCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level === logger_1.LogLevel.info).join("\n");
        (0, chai_1.expect)(logOutput).to.include("You're already logged out from Garden Enterprise.");
    });
    it("should remove token even if Enterprise API can't be initialised", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new logout_1.LogOutCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        await api_1.CloudApi.saveAuthToken(garden.log, garden.globalConfigStore, testToken, garden.cloudDomain);
        // Throw when initializing Enterprise API
        testdouble_1.default.replace(api_1.CloudApi.prototype, "factory", async () => {
            throw new Error("Not tonight");
        });
        // Double check token actually exists
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const tokenAfterLogout = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level === logger_1.LogLevel.info).join("\n");
        (0, chai_1.expect)(tokenAfterLogout).to.not.exist;
        (0, chai_1.expect)(logOutput).to.include("Succesfully logged out from Garden Enterprise.");
    });
    it("should remove token even if API calls fail", async () => {
        const postfix = (0, string_1.randomString)();
        const testToken = {
            token: `dummy-token-${postfix}`,
            refreshToken: `dummy-refresh-token-${postfix}`,
            tokenValidity: 60,
        };
        const command = new logout_1.LogOutCommand();
        const cli = new helpers_1.TestGardenCli();
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-projects", "login", "has-domain-and-id"), {
            noEnterprise: false,
            commandInfo: { name: "foo", args: {}, opts: {} },
            globalConfigStore,
        });
        await api_1.CloudApi.saveAuthToken(garden.log, garden.globalConfigStore, testToken, garden.cloudDomain);
        // Throw when using Enterprise API to call call logout endpoint
        testdouble_1.default.replace(api_1.CloudApi.prototype, "post", async () => {
            throw new Error("Not tonight");
        });
        // Double check token actually exists
        const savedToken = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        (0, chai_1.expect)(savedToken).to.exist;
        (0, chai_1.expect)(savedToken.token).to.eql(testToken.token);
        (0, chai_1.expect)(savedToken.refreshToken).to.eql(testToken.refreshToken);
        await command.action((0, helpers_1.makeCommandParams)({ cli, garden, args: {}, opts: {} }));
        const tokenAfterLogout = await api_1.CloudApi.getStoredAuthToken(garden.log, garden.globalConfigStore, garden.cloudDomain);
        const logOutput = (0, testing_1.getLogMessages)(garden.log, (entry) => entry.level === logger_1.LogLevel.info).join("\n");
        (0, chai_1.expect)(tokenAfterLogout).to.not.exist;
        (0, chai_1.expect)(logOutput).to.include("Succesfully logged out from Garden Enterprise.");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nb3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nb3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQTZCO0FBQzdCLDREQUEyQjtBQUMzQiw4Q0FPeUI7QUFDekIsd0RBQTBEO0FBQzFELG1EQUFvRDtBQUNwRCwwREFBd0Q7QUFDeEQsNERBQStEO0FBQy9ELDBEQUE2RDtBQUM3RCxnRUFBdUU7QUFFdkUsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsSUFBSSxNQUFxQixDQUFBO0lBQ3pCLElBQUksaUJBQW9DLENBQUE7SUFFeEMsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQVcsR0FBRSxDQUFBO1FBQzVCLGlCQUFpQixHQUFHLElBQUksMEJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3hELENBQUMsQ0FBQyxDQUFBO0lBRUYsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ3hCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGlDQUFpQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQy9DLE1BQU0sT0FBTyxHQUFHLElBQUEscUJBQVksR0FBRSxDQUFBO1FBQzlCLE1BQU0sU0FBUyxHQUFHO1lBQ2hCLEtBQUssRUFBRSxlQUFlLE9BQU8sRUFBRTtZQUMvQixZQUFZLEVBQUUsdUJBQXVCLE9BQU8sRUFBRTtZQUM5QyxhQUFhLEVBQUUsRUFBRTtTQUNsQixDQUFBO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBYSxFQUFFLENBQUE7UUFDbkMsTUFBTSxHQUFHLEdBQUcsSUFBSSx1QkFBYSxFQUFFLENBQUE7UUFDL0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsSUFBQSxvQkFBVSxFQUFDLGVBQWUs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