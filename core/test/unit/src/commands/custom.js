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
const cli_1 = require("../../../../src/cli/cli");
const params_1 = require("../../../../src/cli/params");
const custom_1 = require("../../../../src/commands/custom");
const constants_1 = require("../../../../src/constants");
const testing_1 = require("../../../../src/util/testing");
const helpers_1 = require("../../../helpers");
describe("CustomCommandWrapper", () => {
    let garden;
    let log;
    const cli = new cli_1.GardenCli();
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        log = garden.log;
    });
    it("correctly converts arguments from spec", () => {
        var _a, _b, _c, _d;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test A",
            },
            args: [
                { type: "string", name: "a", description: "Arg A", required: true },
                { type: "integer", name: "b", description: "Arg B" },
            ],
            opts: [],
            variables: {},
        });
        (0, chai_1.expect)(Object.keys(cmd.arguments)).to.eql(["a", "b"]);
        (0, chai_1.expect)((_a = cmd.arguments) === null || _a === void 0 ? void 0 : _a["a"]).to.be.instanceOf(params_1.StringParameter);
        (0, chai_1.expect)((_b = cmd.arguments) === null || _b === void 0 ? void 0 : _b["a"].required).to.be.true;
        (0, chai_1.expect)((_c = cmd.arguments) === null || _c === void 0 ? void 0 : _c["b"]).to.be.instanceOf(params_1.IntegerParameter);
        (0, chai_1.expect)((_d = cmd.arguments) === null || _d === void 0 ? void 0 : _d["b"].required).to.be.false;
    });
    it("correctly converts options from spec", () => {
        var _a, _b, _c, _d, _e, _f;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test A",
            },
            args: [],
            opts: [
                { type: "string", name: "a", description: "Arg A", required: true },
                { type: "integer", name: "b", description: "Arg B" },
                { type: "boolean", name: "c", description: "Arg C" },
            ],
            variables: {},
        });
        (0, chai_1.expect)(Object.keys(cmd.options)).to.eql(["a", "b", "c"]);
        (0, chai_1.expect)((_a = cmd.options) === null || _a === void 0 ? void 0 : _a["a"]).to.be.instanceOf(params_1.StringParameter);
        (0, chai_1.expect)((_b = cmd.options) === null || _b === void 0 ? void 0 : _b["a"].required).to.be.true;
        (0, chai_1.expect)((_c = cmd.options) === null || _c === void 0 ? void 0 : _c["b"]).to.be.instanceOf(params_1.IntegerParameter);
        (0, chai_1.expect)((_d = cmd.options) === null || _d === void 0 ? void 0 : _d["b"].required).to.be.false;
        (0, chai_1.expect)((_e = cmd.options) === null || _e === void 0 ? void 0 : _e["c"]).to.be.instanceOf(params_1.BooleanParameter);
        (0, chai_1.expect)((_f = cmd.options) === null || _f === void 0 ? void 0 : _f["c"].required).to.be.false;
    });
    it("sets name and help text from spec", () => {
        const short = "Test";
        const long = "Here's the full description";
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short,
                long,
            },
            args: [],
            opts: [],
            variables: {},
        });
        (0, chai_1.expect)(cmd.name).to.equal("test");
        (0, chai_1.expect)(cmd.help).to.equal(short);
        (0, chai_1.expect)(cmd.description).to.equal(long);
    });
    it("sets the ${args.$rest} variable correctly", async () => {
        var _a, _b;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [
                { type: "string", name: "a", description: "Arg A", required: true },
                { type: "integer", name: "b", description: "Arg B" },
            ],
            opts: [
                { type: "string", name: "a", description: "Opt A", required: true },
                { type: "boolean", name: "b", description: "Opt B" },
            ],
            variables: {},
            exec: {
                command: ["echo", "${join(args.$rest, ' ')}"],
            },
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                a: "A",
                b: "B",
                $all: ["test", "foo", "bar", "bla", "--bla=blop", "-c", "d"],
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.exec) === null || _a === void 0 ? void 0 : _a.command).to.eql(["echo", "bla --bla=blop -c d"]);
        (0, chai_1.expect)((_b = result === null || result === void 0 ? void 0 : result.exec) === null || _b === void 0 ? void 0 : _b.exitCode).to.equal(0);
    });
    it("resolves template strings in command variables", async () => {
        var _a, _b;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [],
            opts: [],
            variables: {
                foo: "${project.name}",
            },
            exec: {
                command: ["echo", "${var.foo}"],
            },
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.exec) === null || _a === void 0 ? void 0 : _a.command).to.eql(["echo", "test-project-a"]);
        (0, chai_1.expect)((_b = result === null || result === void 0 ? void 0 : result.exec) === null || _b === void 0 ? void 0 : _b.exitCode).to.equal(0);
    });
    it("runs an exec command with resolved templates", async () => {
        var _a, _b;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [],
            opts: [],
            variables: {
                foo: "test",
            },
            exec: {
                command: ["echo", "${project.name}-${var.foo}"],
            },
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.exec) === null || _a === void 0 ? void 0 : _a.command).to.eql(["echo", "test-project-a-test"]);
        (0, chai_1.expect)((_b = result === null || result === void 0 ? void 0 : result.exec) === null || _b === void 0 ? void 0 : _b.exitCode).to.equal(0);
    });
    it("runs a Garden command with resolved templates", async () => {
        var _a, _b;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [],
            opts: [],
            variables: {
                foo: "test",
            },
            gardenCommand: ["get", "doddi"],
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.gardenCommand) === null || _a === void 0 ? void 0 : _a.command).to.eql(["get", "doddi"]);
        (0, chai_1.expect)((_b = result === null || result === void 0 ? void 0 : result.gardenCommand) === null || _b === void 0 ? void 0 : _b.result.image).to.exist;
    });
    it("runs exec command before Garden command if both are specified", async () => {
        var _a, _b;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [],
            opts: [],
            variables: {},
            exec: {
                command: ["sleep", "1"],
            },
            gardenCommand: ["get", "eysi"],
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.gardenCommand) === null || _a === void 0 ? void 0 : _a.startedAt).to.be.greaterThan((_b = result === null || result === void 0 ? void 0 : result.exec) === null || _b === void 0 ? void 0 : _b.startedAt);
    });
    it("exposes arguments and options correctly in command templates", async () => {
        var _a;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [
                { type: "string", name: "a", description: "Arg A", required: true },
                { type: "integer", name: "b", description: "Arg B" },
            ],
            opts: [
                { type: "string", name: "a", description: "Opt A", required: true },
                { type: "boolean", name: "b", description: "Opt B" },
            ],
            variables: {
                foo: "test",
            },
            exec: {
                command: [
                    "sh",
                    "-c",
                    "echo ALL: ${args.$all}\necho ARG A: ${args.a}\necho ARG B: ${args.b}\necho OPT A: ${opts.a}\necho OPT B: ${opts.b}",
                ],
            },
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { a: "test-a", b: 123 },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ a: "opt-a", b: true }),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.exec) === null || _a === void 0 ? void 0 : _a.command).to.eql([
            "sh",
            "-c",
            "echo ALL: \necho ARG A: test-a\necho ARG B: 123\necho OPT A: opt-a\necho OPT B: true",
        ]);
    });
    it("defaults to global options passed in for Garden commands but allows overriding in the command spec", async () => {
        var _a;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [],
            opts: [],
            variables: {},
            gardenCommand: ["echo", "foo", "bar", "-l=5"],
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "log-level": "error", "logger-type": "basic" }),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.gardenCommand) === null || _a === void 0 ? void 0 : _a.command).to.eql(["--logger-type", "basic", "echo", "foo", "bar", "-l=5"]);
    });
    it("can run nested custom commands", async () => {
        var _a, _b;
        const cmd = new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [],
            opts: [],
            variables: {},
            gardenCommand: ["echo", "foo", "bar"],
        });
        const { result } = await cmd.action({
            cli,
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)((_a = result === null || result === void 0 ? void 0 : result.gardenCommand) === null || _a === void 0 ? void 0 : _a.command).to.eql(["echo", "foo", "bar"]);
        (0, chai_1.expect)((_b = result === null || result === void 0 ? void 0 : result.gardenCommand) === null || _b === void 0 ? void 0 : _b.result.exec.command).to.eql(["sh", "-c", "echo foo bar"]);
    });
    it("throws on invalid argument type", () => {
        (0, testing_1.expectError)(() => new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [{ type: "blorg" }],
            opts: [],
            variables: {},
            exec: {
                command: ["sleep", "1"],
            },
        }), { contains: "Unexpected parameter type 'blorg'" });
    });
    it("throws on invalid option type", () => {
        (0, testing_1.expectError)(() => new custom_1.CustomCommandWrapper({
            apiVersion: constants_1.DEFAULT_API_VERSION,
            kind: "Command",
            name: "test",
            path: "/tmp",
            description: {
                short: "Test",
            },
            args: [],
            opts: [{ type: "blorg" }],
            variables: {},
            exec: {
                command: ["sleep", "1"],
            },
        }), { contains: "Unexpected parameter type 'blorg'" });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3VzdG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLGlEQUFtRDtBQUNuRCx1REFBZ0c7QUFDaEcsNERBQXNFO0FBQ3RFLHlEQUErRDtBQUUvRCwwREFBc0U7QUFDdEUsOENBQXlFO0FBRXpFLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7SUFDcEMsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksR0FBYSxDQUFBO0lBQ2pCLE1BQU0sR0FBRyxHQUFHLElBQUksZUFBUyxFQUFFLENBQUE7SUFFM0IsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBQ2hDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO0lBQ2xCLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHdDQUF3QyxFQUFFLEdBQUcsRUFBRTs7UUFDaEQsTUFBTSxHQUFHLEdBQUcsSUFBSSw2QkFBb0IsQ0FBQztZQUNuQyxVQUFVLEVBQUUsK0JBQW1CO1lBQy9CLElBQUksRUFBRSxTQUFTO1lBQ2YsSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRTtnQkFDWCxLQUFLLEVBQUUsUUFBUTthQUNoQjtZQUNELElBQUksRUFBRTtnQkFDSixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7Z0JBQ25FLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUU7YUFDckQ7WUFDRCxJQUFJLEVBQUUsRUFBRTtZQUNSLFNBQVMsRUFBRSxFQUFFO1NBQ2QsQ0FBQyxDQUFBO1FBRUYs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