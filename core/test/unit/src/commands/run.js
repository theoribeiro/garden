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
const run_1 = require("../../../../src/commands/run");
const helpers_1 = require("../../../helpers");
// TODO-G2: fill in test implementations. use TestCommand tests for reference.
describe("RunCommand", () => {
    const command = new run_1.RunCommand();
    let garden;
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
    });
    it("should perform a single Run", async () => {
        const { result } = await garden.runCommand({
            command,
            args: { names: ["task-a"] },
            opts: {
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": undefined,
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["run.task-a"]);
    });
    it("should optionally skip tests by name", async () => {
        const { result } = await garden.runCommand({
            command,
            args: { names: ["task*"] },
            opts: {
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": ["*-a*"],
                "skip-dependencies": false,
                "module": undefined,
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["run.task-b", "run.task-c"]);
    });
    // it("handles --interactive option if single test name is specified", async () => {
    //   throw "TODO"
    // })
    // it("throws if --interactive option is set and no test name is specified in arguments", async () => {
    //   throw "TODO"
    // })
    // it("throws if --interactive option is set and multiple test names are specified in arguments", async () => {
    //   throw "TODO"
    // })
    it("throws if no name and no --module flag is set", async () => {
        await (0, helpers_1.expectError)(() => garden.runCommand({
            command,
            args: { names: undefined },
            opts: {
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": undefined,
            },
        }), {
            contains: "A name argument or --module must be specified. If you really want to perform every Run in the project, please specify '*' as an argument.",
        });
    });
    it("supports '*' as an argument to select all Runs", async () => {
        const { result } = await garden.runCommand({
            command,
            args: { names: ["*"] },
            opts: {
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": undefined,
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["run.task-a", "run.task-a2", "run.task-b", "run.task-c"]);
    });
    it("should be protected", async () => {
        (0, chai_1.expect)(command.protected).to.be.true;
    });
    it("should skip disabled actions if --force is not set", async () => {
        garden.addAction({
            kind: "Run",
            type: "test",
            name: "task-disabled",
            disabled: true,
            internal: {
                basePath: "/foo",
            },
            spec: {
                command: ["echo", "ok"],
            },
        });
        const { result } = await garden.runCommand({
            command,
            args: { names: ["*"] },
            opts: {
                "force": false,
                "force-build": false,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": undefined,
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults)).to.not.include("task-disabled");
    });
    it("should run disabled actions if --force is set", async () => {
        await garden.scanAndAddConfigs();
        garden.addAction({
            kind: "Run",
            type: "test",
            name: "task-disabled",
            disabled: true,
            internal: {
                basePath: "/foo",
            },
            spec: {
                command: ["echo", "ok"],
            },
        });
        const { result } = await garden.runCommand({
            command,
            args: { names: ["*"] },
            opts: {
                "force": true,
                "force-build": false,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": undefined,
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults)).to.include("run.task-disabled");
    });
    it("should skip actions from disabled modules", async () => {
        await garden.scanAndAddConfigs();
        garden["moduleConfigs"]["module-c"].disabled = true;
        const { result } = await garden.runCommand({
            command,
            args: { names: ["*"] },
            opts: {
                "force": false,
                "force-build": false,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": undefined,
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults)).to.not.include("run.task-c");
    });
    it("applies --module filter", async () => {
        const { result } = await garden.runCommand({
            command,
            args: { names: undefined },
            opts: {
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": ["module-c"],
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["run.task-c"]);
    });
    it("applies --module filter combined with name argument", async () => {
        const { result } = await garden.runCommand({
            command,
            args: { names: ["task*"] },
            opts: {
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": ["module-b"],
            },
        });
        (0, chai_1.expect)(Object.keys(result.graphResults).sort()).to.eql(["run.task-b"]);
    });
    it("throws if --module filter specifies module that does not exist", async () => {
        await (0, helpers_1.expectError)(() => garden.runCommand({
            command,
            args: { names: undefined },
            opts: {
                "force": true,
                "force-build": true,
                "watch": false,
                "skip": [],
                "skip-dependencies": false,
                "module": ["foo"],
            },
        }), { contains: "Could not find module(s): foo" });
    });
    context("when --skip-dependencies is passed", () => {
        it("should not process runtime dependencies", async () => {
            await garden.scanAndAddConfigs();
            garden["moduleConfigs"]["module-c"].spec.tasks[0].dependencies = ["service-b"];
            const { result } = await garden.runCommand({
                command,
                args: { names: ["task-c"] },
                opts: {
                    "force": true,
                    "force-build": true,
                    "watch": false,
                    "skip": [],
                    "skip-dependencies": true,
                    "module": undefined,
                },
            });
            const processed = (0, helpers_1.getAllProcessedTaskNames)(result.graphResults);
            (0, chai_1.expect)(processed).to.eql([
                "build.module-a",
                "build.module-b",
                "build.module-c",
                "resolve-action.build.module-a",
                "resolve-action.build.module-b",
                "resolve-action.build.module-c",
                "resolve-action.deploy.service-a",
                "resolve-action.deploy.service-b",
                "resolve-action.run.task-c",
                "run.task-c",
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHNEQUF5RDtBQUN6RCw4Q0FBcUc7QUFFckcsOEVBQThFO0FBRTlFLFFBQVEsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO0lBQzFCLE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQVUsRUFBRSxDQUFBO0lBRWhDLElBQUksTUFBa0IsQ0FBQTtJQUV0QixVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDcEIsTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7SUFDbEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDM0MsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUN6QyxPQUFPO1lBQ1AsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDM0IsSUFBSSxFQUFFO2dCQUNKLE9BQU8sRUFBRSxJQUFJO2dCQUNiLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixPQUFPLEVBQUUsS0FBSztnQkFDZCxNQUFNLEVBQUUsRUFBRTtnQkFDVixtQkFBbUIsRUFBRSxLQUFLO2dCQUMxQixRQUFRLEVBQUUsU0FBUzthQUNwQjtTQUNGLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUE7SUFDekUsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDcEQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFH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