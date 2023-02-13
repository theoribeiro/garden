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
const _helpers_1 = require("./_helpers");
describe("build actions", () => {
    let garden;
    let graph;
    let log;
    let actionRouter;
    // eslint-disable-next-line no-unused
    let returnWrongOutputsCfgKey;
    let resolvedBuildAction;
    let module;
    before(async () => {
        const data = await (0, _helpers_1.getRouterTestData)();
        garden = data.garden;
        graph = data.graph;
        log = data.log;
        actionRouter = data.actionRouter;
        returnWrongOutputsCfgKey = data.returnWrongOutputsCfgKey;
        resolvedBuildAction = data.resolvedBuildAction;
        module = data.module;
    });
    after(async () => {
        await garden.close();
    });
    describe("build.getStatus", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const result = await actionRouter.build.getStatus({ log, action: resolvedBuildAction, graph });
            (0, chai_1.expect)(result.outputs.foo).to.eql("bar");
        });
        it("should emit a buildStatus event", async () => {
            garden.events.eventLog = [];
            await actionRouter.build.getStatus({ log, action: resolvedBuildAction, graph });
            const event = garden.events.eventLog[0];
            (0, chai_1.expect)(event).to.exist;
            (0, chai_1.expect)(event.name).to.eql("buildStatus");
            (0, chai_1.expect)(event.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event.payload.moduleVersion).to.eql(module.version.versionString);
            (0, chai_1.expect)(event.payload.actionUid).to.be.undefined;
            (0, chai_1.expect)(event.payload.status.state).to.eql("fetched");
        });
    });
    describe("build", () => {
        it("should correctly call the corresponding plugin handler", async () => {
            const result = await actionRouter.build.build({ log, action: resolvedBuildAction, graph });
            (0, chai_1.expect)(result).to.eql({
                detail: {},
                outputs: {
                    foo: "bar",
                    isTestPluginABuildActionBuildHandlerReturn: true,
                },
                state: "ready",
            });
        });
        it("should emit buildStatus events", async () => {
            garden.events.eventLog = [];
            await actionRouter.build.build({ log, action: resolvedBuildAction, graph });
            const event1 = garden.events.eventLog[0];
            const event2 = garden.events.eventLog[1];
            const moduleVersion = module.version.versionString;
            (0, chai_1.expect)(event1).to.exist;
            (0, chai_1.expect)(event1.name).to.eql("buildStatus");
            (0, chai_1.expect)(event1.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event1.payload.moduleVersion).to.eql(moduleVersion);
            (0, chai_1.expect)(event1.payload.status.state).to.eql("building");
            (0, chai_1.expect)(event1.payload.actionUid).to.be.ok;
            (0, chai_1.expect)(event2).to.exist;
            (0, chai_1.expect)(event2.name).to.eql("buildStatus");
            (0, chai_1.expect)(event2.payload.moduleName).to.eql("module-a");
            (0, chai_1.expect)(event2.payload.moduleVersion).to.eql(moduleVersion);
            (0, chai_1.expect)(event2.payload.status.state).to.eql("built");
            (0, chai_1.expect)(event2.payload.actionUid).to.eql(event1.payload.actionUid);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQU83Qix5Q0FBOEM7QUFFOUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksS0FBa0IsQ0FBQTtJQUN0QixJQUFJLEdBQWEsQ0FBQTtJQUNqQixJQUFJLFlBQTBCLENBQUE7SUFDOUIscUNBQXFDO0lBQ3JDLElBQUksd0JBQWdDLENBQUE7SUFDcEMsSUFBSSxtQkFBd0MsQ0FBQTtJQUM1QyxJQUFJLE1BQW9CLENBQUE7SUFFeEIsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSw0QkFBaUIsR0FBRSxDQUFBO1FBQ3RDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQ3BCLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBQ2xCLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO1FBQ2QsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUE7UUFDaEMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFBO1FBQ3hELG1CQUFtQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQTtRQUM5QyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQUN0QixDQUFDLENBQUMsQ0FBQTtJQUVGLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNmLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFBO0lBQ3RCLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUMvQixFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMs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