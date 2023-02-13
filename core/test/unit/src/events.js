"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../../../src/events");
const chai_1 = require("chai");
describe("EventBus", () => {
    let events;
    beforeEach(() => {
        events = new events_1.EventBus();
    });
    it("should send+receive events", (done) => {
        events.on("_test", (payload) => {
            (0, chai_1.expect)(payload).to.equal("foo");
            done();
        });
        events.emit("_test", "foo");
    });
    describe("onAny", () => {
        it("should add listener for any supported event", (done) => {
            events.onAny((name, payload) => {
                (0, chai_1.expect)(name).to.equal("_test");
                (0, chai_1.expect)(payload).to.equal("foo");
                done();
            });
            events.emit("_test", "foo");
        });
    });
    describe("once", () => {
        it("should add a listener that only gets called once", (done) => {
            events.once("_test", (payload) => {
                (0, chai_1.expect)(payload).to.equal("foo");
                done();
            });
            events.emit("_test", "foo");
            events.emit("_test", "bar");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsZ0RBQThDO0FBQzlDLCtCQUE2QjtBQUU3QixRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixJQUFJLE1BQWdCLENBQUE7SUFFcEIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLE1BQU0sR0FBRyxJQUFJLGlCQUFRLEVBQUUsQ0FBQTtJQUN6QixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ3hDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDN0IsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUMvQixJQUFJLEVBQUUsQ0FBQTtRQUNSLENBQUMsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDN0IsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtRQUNyQixFQUFFLENBQUMsNkNBQTZDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUN6RCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO2dCQUM3QixJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUM5QixJQUFBLGFBQU0sRUFBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO2dCQUMvQixJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDN0IsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1FBQ3BCLEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzlELE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQy9CLElBQUEsYUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQy9CLElBQUksRUFBRSxDQUFBO1lBQ1IsQ0FBQyxDQUFDLENBQUE7WUFDRixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUM3QixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==