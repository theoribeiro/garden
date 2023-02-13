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
const logger_1 = require("../../../../src/logger/logger");
const constants_1 = require("../../../../src/constants");
const api_1 = require("../../../../src/cloud/api");
const util_1 = require("../../../../src/util/util");
const string_1 = require("../../../../src/util/string");
const global_1 = require("../../../../src/config-store/global");
describe("CloudApi", () => {
    const log = (0, logger_1.getLogger)().placeholder();
    const domain = "https://garden." + (0, string_1.randomString)();
    const globalConfigStore = new global_1.GlobalConfigStore();
    describe("getAuthToken", () => {
        it("should return null when no auth token is present", async () => {
            const savedToken = await api_1.CloudApi.getAuthToken(log, globalConfigStore, domain);
            (0, chai_1.expect)(savedToken).to.be.undefined;
        });
        it("should return a saved auth token when one exists", async () => {
            const testToken = {
                token: (0, util_1.uuidv4)(),
                refreshToken: (0, util_1.uuidv4)(),
                tokenValidity: 9999,
            };
            await api_1.CloudApi.saveAuthToken(log, globalConfigStore, testToken, domain);
            const savedToken = await api_1.CloudApi.getAuthToken(log, globalConfigStore, domain);
            (0, chai_1.expect)(savedToken).to.eql(testToken.token);
        });
        it("should return the value of GARDEN_AUTH_TOKEN if it's present", async () => {
            const tokenBackup = constants_1.gardenEnv.GARDEN_AUTH_TOKEN;
            const testToken = "token-from-env";
            constants_1.gardenEnv.GARDEN_AUTH_TOKEN = testToken;
            try {
                const savedToken = await api_1.CloudApi.getAuthToken(log, globalConfigStore, domain);
                (0, chai_1.expect)(savedToken).to.eql(testToken);
            }
            finally {
                constants_1.gardenEnv.GARDEN_AUTH_TOKEN = tokenBackup;
            }
        });
    });
    describe("clearAuthToken", () => {
        it("should delete a saved auth token", async () => {
            const testToken = {
                token: (0, util_1.uuidv4)(),
                refreshToken: (0, util_1.uuidv4)(),
                tokenValidity: 9999,
            };
            await api_1.CloudApi.saveAuthToken(log, globalConfigStore, testToken, domain);
            await api_1.CloudApi.clearAuthToken(log, globalConfigStore, domain);
            const savedToken = await api_1.CloudApi.getAuthToken(log, globalConfigStore, domain);
            (0, chai_1.expect)(savedToken).to.be.undefined;
        });
        it("should not throw an exception if no auth token exists", async () => {
            await api_1.CloudApi.clearAuthToken(log, globalConfigStore, domain);
            await api_1.CloudApi.clearAuthToken(log, globalConfigStore, domain);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLDBEQUF5RDtBQUN6RCx5REFBcUQ7QUFDckQsbURBQW9EO0FBQ3BELG9EQUFrRDtBQUNsRCx3REFBMEQ7QUFDMUQsZ0VBQXVFO0FBRXZFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO0lBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUEsa0JBQVMsR0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixHQUFHLElBQUEscUJBQVksR0FBRSxDQUFBO0lBQ2pELE1BQU0saUJBQWlCLEdBQUcsSUFBSSwwQkFBaUIsRUFBRSxDQUFBO0lBRWpELFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBQzVCLEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRSxNQUFNLFVBQVUsR0FBRyxNQUFNLGNBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQzlFLElBQUEsYUFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO1FBQ3BDLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGtEQUFrRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hFLE1BQU0sU0FBUyxHQUFHO2dCQUNoQixLQUFLLEVBQUUsSUFBQSxhQUFNLEdBQUU7Z0JBQ2YsWUFBWSxFQUFFLElBQUEsYUFBTSxHQUFFO2dCQUN0QixhQUFhLEVBQUUsSUFBSTthQUNwQixDQUFBO1lBQ0QsTUFBTSxjQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDdkUsTUFBTSxVQUFVLEdBQUcsTUFBTSxjQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUM5RSxJQUFBLGFBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM1QyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RSxNQUFNLFdBQVcsR0FBRyxxQkFBUyxDQUFDLGlCQUFpQixDQUFBO1lBQy9DLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFBO1lBQ2xDLHFCQUFTLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFBO1lBQ3ZDLElBQUk7Z0JBQ0YsTUFBTSxVQUFVLEdBQUcsTUFBTSxjQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDOUUsSUFBQSxhQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTthQUNyQztvQkFBUztnQkFDUixxQkFBUyxDQUFDLGlCQUFpQixHQUFHLFdBQVcsQ0FBQTthQUMxQztRQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBQzlCLEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRCxNQUFNLFNBQVMsR0FBRztnQkFDaEIsS0FBSyxFQUFFLElBQUEsYUFBTSxHQUFFO2dCQUNmLFlBQVksRUFBRSxJQUFBLGFBQU0sR0FBRTtnQkFDdEIsYUFBYSxFQUFFLElBQUk7YUFDcEIsQ0FBQTtZQUNELE1BQU0sY0FBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3ZFLE1BQU0sY0FBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDN0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxjQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUM5RSxJQUFBLGFBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtRQUNwQyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyRSxNQUFNLGNBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQzdELE1BQU0sY0FBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDL0QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=