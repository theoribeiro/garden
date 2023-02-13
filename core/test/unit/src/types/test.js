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
const helpers_1 = require("../../../helpers");
const test_1 = require("../../../../src/types/test");
const lodash_1 = require("lodash");
describe("testFromConfig", () => {
    it("should propagate the disabled flag from the config", async () => {
        const config = {
            name: "test",
            dependencies: [],
            disabled: true,
            spec: {},
            timeout: null,
        };
        const garden = await (0, helpers_1.makeTestGardenA)();
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const module = graph.getModule("module-a");
        const test = (0, test_1.testFromConfig)(module, config, graph.moduleGraph);
        (0, chai_1.expect)(test.disabled).to.be.true;
    });
    it("should set disabled=true if the module is disabled", async () => {
        const config = {
            name: "test",
            dependencies: [],
            disabled: false,
            spec: {},
            timeout: null,
        };
        const garden = await (0, helpers_1.makeTestGardenA)();
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const module = graph.getModule("module-a");
        module.disabled = true;
        const test = (0, test_1.testFromConfig)(module, config, graph.moduleGraph);
        (0, chai_1.expect)(test.disabled).to.be.true;
    });
    it("should include dependencies in version calculation", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-test-deps"));
        let graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        let moduleA = graph.getModule("module-a");
        const testConfig = moduleA.testConfigs[0];
        const versionBeforeChange = (0, test_1.testFromConfig)(moduleA, testConfig, graph.moduleGraph).version;
        const backup = (0, lodash_1.cloneDeep)(graph.moduleGraph.getModule("module-b"));
        // Verify that changed build version is reflected in the test version
        graph.moduleGraph["modules"]["module-b"].version.versionString = "12345";
        moduleA = graph.getModule("module-a");
        const testAfterBuildChange = (0, test_1.testFromConfig)(moduleA, testConfig, graph.moduleGraph);
        (0, chai_1.expect)(versionBeforeChange).to.not.eql(testAfterBuildChange.version);
        // Verify that changed service dependency config is reflected in the test version
        graph.moduleGraph["modules"]["module-b"] = backup;
        graph.moduleGraph["serviceConfigs"]["service-b"].config.spec["command"] = ["echo", "something-else"];
        moduleA = graph.getModule("module-a");
        const testAfterServiceConfigChange = (0, test_1.testFromConfig)(moduleA, testConfig, graph.moduleGraph);
        (0, chai_1.expect)(versionBeforeChange).to.not.eql(testAfterServiceConfigChange.version);
        // Verify that changed task dependency config is reflected in the test version
        graph.moduleGraph["modules"]["module-b"] = backup;
        graph.moduleGraph["taskConfigs"]["task-a"].config.spec["command"] = ["echo", "something-else"];
        moduleA = graph.getModule("module-a");
        const testAfterTaskConfigChange = (0, test_1.testFromConfig)(moduleA, testConfig, graph.moduleGraph);
        (0, chai_1.expect)(versionBeforeChange).to.not.eql(testAfterTaskConfigChange.version);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsOENBQThFO0FBRTlFLHFEQUEyRDtBQUMzRCxtQ0FBa0M7QUFFbEMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixFQUFFLENBQUMsb0RBQW9ELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDbEUsTUFBTSxNQUFNLEdBQWU7WUFDekIsSUFBSSxFQUFFLE1BQU07WUFDWixZQUFZLEVBQUUsRUFBRTtZQUNoQixRQUFRLEVBQUUsSUFBSTtZQUNkLElBQUksRUFBRSxFQUFFO1lBQ1IsT0FBTyxFQUFFLElBQUk7U0FDZCxDQUFBO1FBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUN0QyxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUMzRSxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQzFDLE1BQU0sSUFBSSxHQUFHLElBQUEscUJBQWMsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUU5RCxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7SUFDbEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0RBQW9ELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDbEUsTUFBTSxNQUFNLEdBQWU7WUFDekIsSUFBSSxFQUFFLE1BQU07WUFDWixZQUFZLEVBQUUsRUFBRTtZQUNoQixRQUFRLEVBQUUsS0FBSztZQUNmLElBQUks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