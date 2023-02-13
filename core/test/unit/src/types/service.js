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
const service_1 = require("../../../../src/types/service");
const helpers_1 = require("../../../helpers");
describe("combineStates", () => {
    it("should return ready if all states are ready", () => {
        const result = (0, service_1.combineStates)(["ready", "ready"]);
        (0, chai_1.expect)(result).to.equal("ready");
    });
    it("should return the common state if all states are the same", () => {
        for (const state of service_1.serviceStates) {
            const result = (0, service_1.combineStates)([state, state, state]);
            (0, chai_1.expect)(result).to.equal(state);
        }
    });
    it("should return unhealthy if any state is unhealthy", () => {
        const result = (0, service_1.combineStates)(["ready", "deploying", "unhealthy"]);
        (0, chai_1.expect)(result).to.equal("unhealthy");
    });
    it("should return deploying if no state is unhealthy and any state is deploying", () => {
        const result = (0, service_1.combineStates)(["ready", "missing", "deploying"]);
        (0, chai_1.expect)(result).to.equal("deploying");
    });
    it("should return outdated none of the above applies", () => {
        const result = (0, service_1.combineStates)(["ready", "missing", "unknown"]);
        (0, chai_1.expect)(result).to.equal("outdated");
    });
});
describe("serviceFromConfig", () => {
    it("should propagate the disabled flag from the config", async () => {
        const config = {
            name: "test",
            dependencies: [],
            disabled: true,
            spec: {},
        };
        const garden = await (0, helpers_1.makeTestGardenA)();
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const module = graph.getModule("module-a");
        const service = (0, service_1.serviceFromConfig)(graph.moduleGraph, module, config);
        (0, chai_1.expect)(service.disabled).to.be.true;
    });
    it("should set disabled=true if the module is disabled", async () => {
        const config = {
            name: "test",
            dependencies: [],
            disabled: false,
            spec: {},
        };
        const garden = await (0, helpers_1.makeTestGardenA)();
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const module = graph.getModule("module-a");
        module.disabled = true;
        const service = (0, service_1.serviceFromConfig)(graph.moduleGraph, module, config);
        (0, chai_1.expect)(service.disabled).to.be.true;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsMkRBQStGO0FBRS9GLDhDQUFrRDtBQUVsRCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUM3QixFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1FBQ3JELE1BQU0sTUFBTSxHQUFHLElBQUEsdUJBQWEsRUFBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFBO1FBQ2hELElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDbEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsMkRBQTJELEVBQUUsR0FBRyxFQUFFO1FBQ25FLEtBQUssTUFBTSxLQUFLLElBQUksdUJBQWEsRUFBRTtZQUNqQyxNQUFNLE1BQU0sR0FBRyxJQUFBLHVCQUFhLEVBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDbkQsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUMvQjtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtRQUMzRCxNQUFNLE1BQU0sR0FBRyxJQUFBLHVCQUFhLEVBQUMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUE7UUFDakUsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw2RUFBNkUsRUFBRSxHQUFHLEVBQUU7UUFDckYsTUFB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