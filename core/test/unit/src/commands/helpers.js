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
const helpers_1 = require("../../../../src/commands/helpers");
const helpers_2 = require("../../../helpers");
// TODO-G2: rename test cases to match the new graph model semantics
describe("getMatchingServiceNames", () => {
    let graph;
    before(async () => {
        const garden = await (0, helpers_2.makeTestGardenA)();
        graph = await garden.getConfigGraph({ log: garden.log, emit: false });
    });
    it("should return all services if --dev-mode=* is set", async () => {
        const result = (0, helpers_1.getMatchingDeployNames)(["*"], graph);
        (0, chai_1.expect)(result).to.eql(graph.getDeploys().map((s) => s.name));
    });
    it("should return all services if --dev-mode is set with no value", async () => {
        const result = (0, helpers_1.getMatchingDeployNames)([], graph);
        (0, chai_1.expect)(result).to.eql(graph.getDeploys().map((s) => s.name));
    });
    it("should return specific service if --dev-mode is set with a service name", async () => {
        const result = (0, helpers_1.getMatchingDeployNames)(["service-a"], graph);
        (0, chai_1.expect)(result).to.eql(["service-a"]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsOERBQXlFO0FBRXpFLDhDQUFrRDtBQUVsRCxvRUFBb0U7QUFDcEUsUUFBUSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtJQUN2QyxJQUFJLEtBQWtCLENBQUE7SUFFdEIsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7UUFDdEMsS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLG1EQUFtRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2pFLE1BQU0sTUFBTSxHQUFHLElBQUEsZ0NBQXNCLEVBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNuRCxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO0lBQzlELENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLCtEQUErRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzdFLE1BQU0sTUFBTSxHQUFHLElBQUEsZ0NBQXNCLEVBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ2hELElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7SUFDOUQsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMseUVBQXlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdkYsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQ0FBc0IsRUFBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzNELElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==