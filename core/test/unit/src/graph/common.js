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
const common_1 = require("../../../../src/graph/common");
const helpers_1 = require("../../../helpers");
const exceptions_1 = require("../../../../src/exceptions");
const constants_1 = require("../../../../src/constants");
const modules_1 = require("../../../../src/graph/modules");
describe("graph common", () => {
    describe("detectMissingDependencies", () => {
        it("should return an error when a build dependency is missing", async () => {
            const moduleConfigs = [
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "test",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [{ name: "missing", copy: [] }] },
                    disabled: false,
                    path: "/tmp",
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
            ];
            (0, chai_1.expect)(() => (0, modules_1.detectMissingDependencies)(moduleConfigs)).to.throw();
        });
        it("should return an error when a service dependency is missing", async () => {
            const moduleConfigs = [
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "test",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: "/tmp",
                    serviceConfigs: [
                        {
                            name: "test",
                            dependencies: ["missing"],
                            disabled: false,
                            spec: {},
                        },
                    ],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
            ];
            (0, chai_1.expect)(() => (0, modules_1.detectMissingDependencies)(moduleConfigs)).to.throw();
        });
        it("should return an error when a task dependency is missing", async () => {
            const moduleConfigs = [
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "test",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: "/tmp",
                    serviceConfigs: [],
                    taskConfigs: [
                        {
                            name: "test",
                            cacheResult: true,
                            dependencies: ["missing"],
                            disabled: false,
                            spec: {},
                            timeout: null,
                        },
                    ],
                    testConfigs: [],
                    spec: {},
                },
            ];
            (0, chai_1.expect)(() => (0, modules_1.detectMissingDependencies)(moduleConfigs)).to.throw();
        });
        it("should return an error when a test dependency is missing", async () => {
            const moduleConfigs = [
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "test",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: "/tmp",
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [
                        {
                            name: "test",
                            dependencies: ["missing"],
                            disabled: false,
                            spec: {},
                            timeout: null,
                        },
                    ],
                    spec: {},
                },
            ];
            (0, chai_1.expect)(() => (0, modules_1.detectMissingDependencies)(moduleConfigs)).to.throw();
        });
        it("should return null when no dependencies are missing", async () => {
            const moduleConfigs = [
                {
                    apiVersion: constants_1.DEFAULT_API_VERSION,
                    name: "test",
                    type: "test",
                    allowPublish: false,
                    build: { dependencies: [] },
                    disabled: false,
                    path: "/tmp",
                    serviceConfigs: [],
                    taskConfigs: [],
                    testConfigs: [],
                    spec: {},
                },
            ];
            (0, chai_1.expect)(() => (0, modules_1.detectMissingDependencies)(moduleConfigs));
        });
    });
    describe("DependencyValidationGraph", () => {
        describe("detectCircularDependencies", () => {
            it("should return an empty cycle array when no nodes or dependencies have been added", async () => {
                const validationGraph = new common_1.DependencyGraph();
                const cycles = validationGraph.detectCircularDependencies();
                (0, chai_1.expect)(cycles).to.be.empty;
            });
            it("should return a cycle when circular dependencies have been added", async () => {
                const vg = new common_1.DependencyGraph();
                vg.addNode("a");
                vg.addNode("b");
                vg.addNode("c");
                vg.addDependency("b", "a");
                vg.addDependency("c", "b");
                vg.addDependency("a", "c");
                const cycles = vg.detectCircularDependencies();
                (0, chai_1.expect)(cycles).to.eql([["a", "c", "b"]]);
            });
            it("should return null when no circular dependencies have been added", async () => {
                const vg = new common_1.DependencyGraph();
                vg.addNode("a");
                vg.addNode("b");
                vg.addNode("c");
                vg.addDependency("b", "a");
                vg.addDependency("c", "b");
                vg.addDependency("c", "a");
                const cycles = vg.detectCircularDependencies();
                (0, chai_1.expect)(cycles).to.be.empty;
            });
            it("should return null when no circular config dependencies are present", async () => {
                const nonCircularProjectRoot = (0, helpers_1.getDataDir)("test-project-b");
                const garden = await (0, helpers_1.makeTestGarden)(nonCircularProjectRoot);
                const configGraph = await garden.getConfigGraph({ log: garden.log, emit: false });
                const validationGraph = common_1.DependencyGraph.fromGraphNodes(configGraph["dependencyGraph"]);
                const cycles = validationGraph.detectCircularDependencies();
                (0, chai_1.expect)(cycles).to.be.empty;
            });
        });
        describe("overallOrder", () => {
            it("should return the overall dependency order when circular dependencies are present", async () => {
                const vg = new common_1.DependencyGraph();
                vg.addNode("a");
                vg.addNode("b");
                vg.addNode("c");
                vg.addNode("d");
                vg.addDependency("b", "a");
                vg.addDependency("c", "b");
                vg.addDependency("c", "a");
                vg.addDependency("d", "c");
                (0, chai_1.expect)(vg.overallOrder()).to.eql(["a", "b", "c", "d"]);
            });
            it("should throw an error when circular dependencies are present", async () => {
                const vg = new common_1.DependencyGraph();
                vg.addNode("a");
                vg.addNode("b");
                vg.addNode("c");
                vg.addDependency("b", "a");
                vg.addDependency("c", "b");
                vg.addDependency("a", "c");
                await (0, helpers_1.expectError)(() => vg.overallOrder(), (e) => (0, chai_1.expect)(e).to.be.instanceOf(exceptions_1.ConfigurationError));
            });
        });
    });
    describe("detectCycles", () => {
        it("should detect self-to-self cycles", () => {
            const cycles = (0, common_1.detectCycles)([{ from: "a", to: "a" }]);
            (0, chai_1.expect)(cycles).to.deep.eq([["a"]]);
        });
        it("should preserve dependency order when returning cycles", () => {
            const cycles = (0, common_1.detectCycles)([
                { from: "foo", to: "bar" },
                { from: "bar", to: "baz" },
                { from: "baz", to: "foo" },
            ]);
            (0, chai_1.expect)(cycles).to.deep.eq([["foo", "bar", "baz"]]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHlEQUE0RTtBQUM1RSw4Q0FBMEU7QUFFMUUsMkRBQStEO0FBQy9ELHlEQUErRDtBQUMvRCwyREFBeUU7QUFFekUsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7SUFDNUIsUUFBUSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUN6QyxFQUFFLENBQUMsMkRBQTJELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekUsTUFBTSxhQUFhLEdBQW1CO2dCQUNwQztvQkFDRSxVQUFVLEVBQUUsK0JBQW1CO29CQUMvQixJQUFJLEVBQUUsTUFBTTtvQkFDWixJQUFJLEVBQUUsTUFBTTtvQkFDWixZQUFZLEVBQUUsS0FBSztvQkFDbkIsS0FBSyxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO29CQUN4RCxRQUFRLEVBQUUsS0FBSztvQkFDZixJQUFJLEVBQUUsTUFBTTtvQkFDWixjQUFjLEVBQUUsRUFBRTtvQkFDbEIsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsSUFBSSxFQUFFLEVBQUU7aUJBQ1Q7YUFDRixDQUFBO1lBQ0QsSUFBQSxhQUFNLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxtQ0FBeUIsRUFBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUNuRSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRSxNQUFNLGFBQWEsR0FBbUI7Z0JBQ3BDO29CQUNFLFVBQVUsRUFBRSwrQkFBbUI7b0JBQy9CLElBQUksRUFBRSxNQUFNO29CQUNaLElB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