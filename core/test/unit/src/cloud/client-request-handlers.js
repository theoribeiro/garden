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
const client_router_1 = require("../../../../src/server/client-router");
const helpers_1 = require("../../../helpers");
describe("clientRequestHandlers", () => {
    let garden;
    let graph;
    let log;
    let params;
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        log = garden.log;
        graph = await garden.getConfigGraph({ log, emit: false });
        params = { garden, log, graph };
    });
    describe("build", () => {
        it("should return a build task for the requested module", async () => {
            const buildTask = await client_router_1.clientRequestHandlers.build({
                ...params,
                request: { moduleName: "module-a", force: false },
            });
            (0, chai_1.expect)(buildTask).to.exist;
            (0, chai_1.expect)(buildTask.getName()).to.eql("module-a");
            (0, chai_1.expect)(buildTask.force).to.eql(false);
        });
        it("should optionally return a build task with force = true for the requested module", async () => {
            const buildTask = await client_router_1.clientRequestHandlers.build({
                ...params,
                request: { moduleName: "module-a", force: true },
            });
            (0, chai_1.expect)(buildTask).to.exist;
            (0, chai_1.expect)(buildTask.getName()).to.eql("module-a");
            (0, chai_1.expect)(buildTask.force).to.eql(true);
        });
    });
    describe("deploy", () => {
        it("should return a deploy task for the requested service", async () => {
            const deployTask = await client_router_1.clientRequestHandlers.deploy({
                ...params,
                request: {
                    serviceName: "service-a",
                    force: false,
                    forceBuild: false,
                    devMode: false,
                    hotReload: false,
                    localMode: false,
                    skipDependencies: true,
                },
            });
            (0, chai_1.expect)(deployTask.devModeDeployNames).to.eql([]);
            (0, chai_1.expect)(deployTask.localModeDeployNames).to.eql([]);
            (0, chai_1.expect)(deployTask.action.name).to.eql("service-a");
        });
        it("should return a dev-mode deploy task for the requested service", async () => {
            const deployTask = await client_router_1.clientRequestHandlers.deploy({
                ...params,
                request: {
                    serviceName: "service-a",
                    force: false,
                    forceBuild: false,
                    devMode: true,
                    hotReload: false,
                    localMode: false,
                    skipDependencies: true,
                },
            });
            (0, chai_1.expect)(deployTask.action.name).to.eql("service-a");
            // todo
            // expect(deployTask.devModeDeployNames).to.eql(["service-a"])
        });
        it("should return a local-mode deploy task for the requested service", async () => {
            const deployTask = await client_router_1.clientRequestHandlers.deploy({
                ...params,
                request: {
                    serviceName: "service-a",
                    force: false,
                    forceBuild: false,
                    devMode: false,
                    localMode: true,
                    hotReload: false,
                    skipDependencies: true,
                },
            });
            (0, chai_1.expect)(deployTask.action.name).to.eql("service-a");
            // todo
            // expect(deployTask.localModeDeployNames).to.eql(["service-a"])
        });
    });
    describe("test", () => {
        it("should return test tasks for the requested module", async () => {
            const testTasks = await client_router_1.clientRequestHandlers.test({
                ...params,
                request: { moduleName: "module-a", force: false, forceBuild: false, skipDependencies: true },
            });
            (0, chai_1.expect)(testTasks.map((t) => t.action.name).sort()).to.eql(["module-a-integration", "module-a-unit"]);
        });
        it("should return test tasks for the requested module and test names", async () => {
            const testTasks = await client_router_1.clientRequestHandlers.test({
                ...params,
                request: {
                    moduleName: "module-a",
                    force: false,
                    forceBuild: false,
                    testNames: ["module-a-unit"],
                    skipDependencies: true,
                },
            });
            (0, chai_1.expect)(testTasks.map((t) => t.action.name).sort()).to.eql(["module-a-unit"]);
        });
    });
    describe("run", () => {
        it("should return test tasks for the requested module", async () => {
            const runTask = await client_router_1.clientRequestHandlers.run({
                ...params,
                request: { taskName: "task-a", force: false, forceBuild: false },
            });
            (0, chai_1.expect)(runTask.action.name).to.eql("task-a");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LXJlcXVlc3QtaGFuZGxlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjbGllbnQtcmVxdWVzdC1oYW5kbGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUc3Qix3RUFBOEc7QUFDOUcsOENBQThEO0FBRTlELFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksS0FBa0IsQ0FBQTtJQUN0QixJQUFJLEdBQWEsQ0FBQTtJQUNqQixJQUFJLE1BQXdDLENBQUE7SUFFNUMsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBQ2hDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ2hCLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFDekQsTUFBTSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQTtJQUNqQyxDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1FBQ3JCLEVBQUUsQ0FBQyxxREFBcUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNuRSxNQUFNLFNBQVMsR0FBRyxNQUFNLHFDQUFxQixDQUFDLEtBQUssQ0FBQztnQkFDbEQsR0FBRyxNQUFNO2dCQUNULE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTthQUNsRCxDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO1lBQzFCLElBQUEsYUFBTSxFQUFDLFNBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FB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