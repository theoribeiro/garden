"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const profiling_1 = require("../../../../src/util/profiling");
const chai_1 = require("chai");
describe("profiling", () => {
    let profiler;
    beforeEach(() => {
        profiler = new profiling_1.Profiler(true);
    });
    describe("Profile", () => {
        it("should collect timing on a basic class method", () => {
            let TestClass = class TestClass {
                someMethod() {
                    return 123;
                }
            };
            TestClass = __decorate([
                (0, profiling_1.Profile)(profiler)
            ], TestClass);
            const instance = new TestClass();
            const value = instance.someMethod();
            (0, chai_1.expect)(value).to.equal(123);
            const profiling = profiler.getData();
            const invocations = profiling["TestClass#someMethod"];
            (0, chai_1.expect)(invocations).to.exist;
            (0, chai_1.expect)(invocations.length).to.equal(1);
        });
        it("should collect timing on an async class method", async () => {
            let TestClass = class TestClass {
                async someMethod() {
                    return 123;
                }
            };
            TestClass = __decorate([
                (0, profiling_1.Profile)(profiler)
            ], TestClass);
            const instance = new TestClass();
            const value = await instance.someMethod();
            (0, chai_1.expect)(value).to.equal(123);
            const profiling = profiler.getData();
            const invocations = profiling["TestClass#someMethod"];
            (0, chai_1.expect)(invocations).to.exist;
            (0, chai_1.expect)(invocations.length).to.equal(1);
        });
    });
    describe("profile", () => {
        it("should collect timing on a function call", () => {
            const func = (0, profiling_1.profile)(function fn() {
                return 123;
            }, profiler);
            const value = func();
            (0, chai_1.expect)(value).to.equal(123);
            const profiling = profiler.getData();
            const invocations = profiling["fn"];
            (0, chai_1.expect)(invocations).to.exist;
            (0, chai_1.expect)(invocations.length).to.equal(1);
        });
    });
    describe("profile", () => {
        it("should collect timing on an async function call", async () => {
            const func = (0, profiling_1.profileAsync)(async function fn() {
                return 123;
            }, profiler);
            const value = await func();
            (0, chai_1.expect)(value).to.equal(123);
            const profiling = profiler.getData();
            const invocations = profiling["fn"];
            (0, chai_1.expect)(invocations).to.exist;
            (0, chai_1.expect)(invocations.length).to.equal(1);
        });
    });
    describe("reportProfiling", () => {
        it("should return a profiling summary", async () => {
            let TestClass = class TestClass {
                someMethod() {
                    return 123;
                }
                async asyncMethod() {
                    return 123;
                }
            };
            TestClass = __decorate([
                (0, profiling_1.Profile)(profiler)
            ], TestClass);
            const instance = new TestClass();
            for (let i = 0; i < 10; i++) {
                instance.someMethod();
                await instance.asyncMethod();
            }
            profiler.report();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvZmlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7O0FBRUgsOERBQXlGO0FBQ3pGLCtCQUE2QjtBQUU3QixRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtJQUN6QixJQUFJLFFBQWtCLENBQUE7SUFFdEIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUN2QixFQUFFLENBQUMsK0NBQStDLEVBQUUsR0FBRyxFQUFFO1lBRXZELElBQU0sU0FBUyxHQUFmLE1BQU0sU0FBUztnQkFDYixVQUFVO29CQUNSLE9BQU8sR0FBRyxDQUFBO2dCQUNaLENBQUM7YUFDRixDQUFBO1lBSkssU0FBUztnQkFEZCxJQUFBLG1CQUFPLEVBQUMsUUFBUSxDQUFDO2VBQ1osU0FBUyxDQUlkO1lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQTtZQUVoQyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUE7WUFDbkMsSUFBQSxhQUFNLEVBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUUzQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUE7WUFDcEMsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLHNCQUFzQixDQUFDLENBQUE7WUFFckQsSUFBQSxhQUFNLEVBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtZQUM1QixJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FB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