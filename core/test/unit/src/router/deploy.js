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
const ts_stream_1 = __importDefault(require("ts-stream"));
const helpers_1 = require("../../../helpers");
const _helpers_1 = require("./_helpers");
describe("deploy actions", () => {
    let garden;
    let graph;
    let log;
    let actionRouter;
    let resolvedDeployAction;
    let returnWrongOutputsCfgKey;
    before(async () => {
        const data = await (0, _helpers_1.getRouterTestData)();
        garden = data.garden;
        graph = data.graph;
        log = data.log;
        actionRouter = data.actionRouter;
        resolvedDeployAction = data.resolvedDeployAction;
        returnWrongOutputsCfgKey = data.returnWrongOutputsCfgKey;
    });
    after(async () => {
        await garden.close();
    });
    afterEach(() => {
        resolvedDeployAction._config[returnWrongOutputsCfgKey] = false;
    });
    describe("deploy.getStatus", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const result = await actionRouter.deploy.getStatus({
                log,
                action: resolvedDeployAction,
                graph,
                devMode: false,
                localMode: false,
            });
            (0, chai_1.expect)(result).to.eql({
                detail: { forwardablePorts: [], state: "ready", outputs: {}, detail: {} },
                outputs: { base: "ok", foo: "ok" },
                state: "ready",
            });
        });
        it("should emit a serviceStatus event", async () => {
            garden.events.eventLog = [];
            await actionRouter.deploy.getStatus({
                log,
                action: resolvedDeployAction,
                graph,
                devMode: false,
                localMode: false,
            });
            const event = garden.events.eventLog[0];
            (0, chai_1.expect)(event).to.exist;
            (0, chai_1.expect)(event.name).to.eql("serviceStatus");
            (0, chai_1.expect)(event.payload.serviceName).to.eql("service-a");
            (0, chai_1.expect)(event.payload.actionVersion).to.eql(resolvedDeployAction.versionString());
            (0, chai_1.expect)(event.payload.serviceVersion).to.eql(resolvedDeployAction.versionString());
            (0, chai_1.expect)(event.payload.actionUid).to.be.undefined;
            (0, chai_1.expect)(event.payload.status.state).to.eql("ready");
        });
        it("should throw if the outputs don't match the service outputs schema of the plugin", async () => {
            resolvedDeployAction._config[returnWrongOutputsCfgKey] = true;
            await (0, helpers_1.expectError)(() => actionRouter.deploy.getStatus({
                log,
                action: resolvedDeployAction,
                graph,
                devMode: false,
                localMode: false,
            }), { contains: "Error validating runtime action outputs from Deploy 'service-a': key .foo must be a string." });
        });
    });
    describe("deploy.deploy", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const result = await actionRouter.deploy.deploy({
                log,
                action: resolvedDeployAction,
                graph,
                force: true,
                devMode: false,
                localMode: false,
            });
            (0, chai_1.expect)(result).to.eql({
                detail: { forwardablePorts: [], state: "ready", outputs: {}, detail: {} },
                outputs: { base: "ok", foo: "ok" },
                state: "ready",
            });
        });
        it("should emit serviceStatus events", async () => {
            garden.events.eventLog = [];
            await actionRouter.deploy.deploy({
                log,
                action: resolvedDeployAction,
                graph,
                force: true,
                devMode: false,
                localMode: false,
            });
            const moduleVersion = resolvedDeployAction.moduleVersion().versionString;
            const event1 = garden.events.eventLog[0];
            const event2 = garden.events.eventLog[1];
            (0, chai_1.expect)(event1).to.exist;
            (0, chai_1.expect)(event1.name).to.eql("serviceStatus");
            (0, chai_1.expect)(event1.payload.serviceName).to.eql("service-a");
            (0, chai_1.expect)(event1.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event1.payload.moduleVersion).to.eql(moduleVersion);
            (0, chai_1.expect)(event1.payload.serviceVersion).to.eql(resolvedDeployAction.versionString());
            (0, chai_1.expect)(event1.payload.actionUid).to.be.ok;
            (0, chai_1.expect)(event1.payload.status.state).to.eql("deploying");
            (0, chai_1.expect)(event2).to.exist;
            (0, chai_1.expect)(event2.name).to.eql("serviceStatus");
            (0, chai_1.expect)(event2.payload.serviceName).to.eql("service-a");
            (0, chai_1.expect)(event2.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event2.payload.moduleVersion).to.eql(moduleVersion);
            (0, chai_1.expect)(event2.payload.serviceVersion).to.eql(resolvedDeployAction.versionString());
            (0, chai_1.expect)(event2.payload.actionUid).to.eql(event2.payload.actionUid);
            (0, chai_1.expect)(event2.payload.status.state).to.eql("ready");
        });
        it("should throw if the outputs don't match the service outputs schema of the plugin", async () => {
            resolvedDeployAction._config[returnWrongOutputsCfgKey] = true;
            await (0, helpers_1.expectError)(() => actionRouter.deploy.deploy({
                log,
                action: resolvedDeployAction,
                graph,
                force: true,
                devMode: false,
                localMode: false,
            }), { contains: "Error validating runtime action outputs from Deploy 'service-a': key .foo must be a string." });
        });
    });
    describe("deploy.delete", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const result = await actionRouter.deploy.delete({ log, action: resolvedDeployAction, graph });
            (0, chai_1.expect)(result).to.eql({
                state: "ready",
                detail: {
                    forwardablePorts: [],
                    outputs: {},
                    detail: {},
                    state: "ready",
                },
                outputs: {},
            });
        });
    });
    describe("deploy.exec", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const executedAction = await garden.executeAction({ action: resolvedDeployAction, log, graph });
            const result = await actionRouter.deploy.exec({
                log,
                action: executedAction,
                graph,
                command: ["foo"],
                interactive: false,
            });
            (0, chai_1.expect)(result).to.eql({ code: 0, output: "bla bla" });
        });
    });
    describe("deploy.getLogs", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const stream = new ts_stream_1.default();
            const result = await actionRouter.deploy.getLogs({
                log,
                action: resolvedDeployAction,
                graph,
                stream,
                follow: false,
                tail: -1,
            });
            (0, chai_1.expect)(result).to.eql({});
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVwbG95LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQTZCO0FBQzdCLDBEQUE4QjtBQU05Qiw4Q0FBMEQ7QUFDMUQseUNBQThDO0FBRTlDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7SUFDOUIsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksS0FBa0IsQ0FBQTtJQUN0QixJQUFJLEdBQWEsQ0FBQTtJQUNqQixJQUFJLFlBQTBCLENBQUE7SUFDOUIsSUFBSSxvQkFBMEMsQ0FBQTtJQUM5QyxJQUFJLHdCQUFnQyxDQUFBO0lBRXBDLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQixNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtRQUN0QyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUNwQixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtRQUNsQixHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtRQUNkLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFBO1FBQ2hDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQTtRQUNoRCx3QkFBd0IsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUE7SUFDMUQsQ0FBQyxDQUFDLENBQUE7SUFFRixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDZixNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUN0QixDQUFDLENBQUMsQ0FBQTtJQUVGLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixvQkFBb0IsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsR0FBRyxLQUFLLENBQUE7SUFDaEUsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLEVBQUUsQ0FBQyx3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