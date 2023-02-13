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
const nock_1 = __importDefault(require("nock"));
const lodash_1 = require("lodash");
const testdouble_1 = __importDefault(require("testdouble"));
const cli_1 = require("../../../../src/cli/cli");
const helpers_1 = require("../../../helpers");
const constants_1 = require("../../../../src/constants");
const path_1 = require("path");
const base_1 = require("../../../../src/commands/base");
const util_1 = require("../../../../src/util/util");
const util_2 = require("../../../../src/commands/util/util");
const params_1 = require("../../../../src/cli/params");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const tools_1 = require("../../../../src/commands/tools");
const logger_1 = require("../../../../src/logger/logger");
const js_yaml_1 = require("js-yaml");
const server_1 = require("../../../../src/server/server");
const fancy_terminal_writer_1 = require("../../../../src/logger/writers/fancy-terminal-writer");
const basic_terminal_writer_1 = require("../../../../src/logger/writers/basic-terminal-writer");
const util_3 = require("../../../../src/logger/util");
const testing_1 = require("../../../../src/util/testing");
const global_1 = require("../../../../src/config-store/global");
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const cloud_1 = require("../../../../src/commands/cloud/cloud");
const process_1 = require("../../../../src/process");
const serve_1 = require("../../../../src/commands/serve");
describe("cli", () => {
    let cli;
    const globalConfigStore = new global_1.GlobalConfigStore();
    beforeEach(() => {
        cli = new cli_1.GardenCli();
    });
    afterEach(async () => {
        if (cli.processRecord && cli.processRecord.pid) {
            await globalConfigStore.delete("activeProcesses", String(cli.processRecord.pid));
        }
    });
    describe("run", () => {
        it("aborts with help text if no positional argument is provided", async () => {
            const { code, consoleOutput } = await cli.run({ args: [], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal(await cli.renderHelp("/"));
        });
        it("aborts with default help text if -h option is set and no command", async () => {
            const { code, consoleOutput } = await cli.run({ args: ["-h"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal(await cli.renderHelp("/"));
        });
        it("aborts with default help text if --help option is set and no command", async () => {
            const { code, consoleOutput } = await cli.run({ args: ["-h"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal(await cli.renderHelp("/"));
        });
        it("aborts with command help text if --help option is set and command is specified", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ args }) {
                    return { result: { args } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const { code, consoleOutput } = await cli.run({ args: ["test-command", "--help"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal(cmd.renderHelp());
        });
        it("aborts with version text if -V is set", async () => {
            const { code, consoleOutput } = await cli.run({ args: ["-V"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal((0, util_1.getPackageVersion)());
        });
        it("aborts with version text if --version is set", async () => {
            const { code, consoleOutput } = await cli.run({ args: ["--version"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal((0, util_1.getPackageVersion)());
        });
        it("aborts with version text if version is first argument", async () => {
            const { code, consoleOutput } = await cli.run({ args: ["version"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal((0, util_1.getPackageVersion)());
        });
        it("throws if --root is set, pointing to a non-existent path", async () => {
            const path = "/tmp/hauweighaeighuawek";
            const { code, consoleOutput } = await cli.run({ args: ["--root", path], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(1);
            (0, chai_1.expect)((0, strip_ansi_1.default)(consoleOutput)).to.equal(`Could not find specified root path (${path})`);
        });
        context("custom commands", () => {
            const root = (0, helpers_1.getDataDir)("test-projects", "custom-commands");
            it("picks up all commands in project root", async () => {
                const commands = await cli["getCustomCommands"](root);
                (0, chai_1.expect)(commands.map((c) => c.name).sort()).to.eql(["combo", "echo", "run-task", "script"]);
            });
            it("runs a custom command", async () => {
                const res = await cli.run({ args: ["echo", "foo"], exitOnError: false, cwd: root });
                (0, chai_1.expect)(res.code).to.equal(0);
            });
            it("warns and ignores custom command with same name as built-in command", async () => {
                const commands = await cli["getCustomCommands"](root);
                // The plugin(s) commands are defined in nope.garden.yml
                (0, chai_1.expect)(commands.map((c) => c.name)).to.not.include("plugins");
            });
            it("warns if a custom command is provided with same name as alias for built-in command", async () => {
                const commands = await cli["getCustomCommands"](root);
                // The plugin(s) commands are defined in nope.garden.yml
                (0, chai_1.expect)(commands.map((c) => c.name)).to.not.include("plugin");
            });
            it("doesn't pick up commands outside of project root", async () => {
                const commands = await cli["getCustomCommands"](root);
                // The nope command is defined in the `nope` directory in the test project.
                (0, chai_1.expect)(commands.map((c) => c.name)).to.not.include("nope");
            });
            it("prints custom commands in help text", async () => {
                const helpText = (0, strip_ansi_1.default)(await cli.renderHelp(root));
                (0, chai_1.expect)(helpText).to.include("CUSTOM COMMANDS");
                (0, chai_1.expect)(helpText).to.include("combo     A complete example using most");
                (0, chai_1.expect)(helpText).to.include("available features"); // There's a line break
                (0, chai_1.expect)(helpText).to.include("echo      Just echo a string");
                (0, chai_1.expect)(helpText).to.include("run-task  Run the specified task");
            });
            it("prints help text for a custom command", async () => {
                const res = await cli.run({ args: ["combo", "--help"], exitOnError: false, cwd: root });
                const commands = await cli["getCustomCommands"](root);
                const command = commands.find((c) => c.name === "combo");
                const helpText = command.renderHelp();
                (0, chai_1.expect)(res.code).to.equal(0);
                (0, chai_1.expect)(res.consoleOutput).to.equal(helpText);
            });
            it("errors if a Command resource is invalid", async () => {
                return (0, testing_1.expectError)(() => cli.run({
                    args: ["echo", "foo"],
                    exitOnError: false,
                    cwd: (0, helpers_1.getDataDir)("test-projects", "custom-commands-invalid"),
                }), { contains: "Error validating custom Command 'invalid'" });
            });
            it("exits with code from exec command if it fails", async () => {
                const res = await cli.run({ args: ["script", "exit 2"], exitOnError: false, cwd: root });
                (0, chai_1.expect)(res.code).to.equal(2);
            });
            it("exits with code 1 if Garden command fails", async () => {
                const res = await cli.run({ args: ["run", "fail"], exitOnError: false, cwd: root });
                (0, chai_1.expect)(res.code).to.equal(1);
            });
        });
        context("test logger initialization", () => {
            const envLoggerType = process.env.GARDEN_LOGGER_TYPE;
            // Logger is a singleton and we need to reset it between these tests as we're testing
            // that it's initialised correctly in this block.
            beforeEach(() => {
                delete process.env.GARDEN_LOGGER_TYPE;
                logger_1.Logger.clearInstance();
            });
            // Re-initialise the test logger
            after(() => {
                process.env.GARDEN_LOGGER_TYPE = envLoggerType;
                logger_1.Logger.clearInstance();
                (0, helpers_1.initTestLogger)();
            });
            it("uses the fancy logger by default", async () => {
                class TestCommand extends base_1.Command {
                    constructor() {
                        super(...arguments);
                        this.name = "test-command";
                        this.help = "halp!";
                        this.noProject = true;
                    }
                    printHeader() { }
                    async action({}) {
                        return { result: { something: "important" } };
                    }
                }
                const cmd = new TestCommand();
                cli.addCommand(cmd);
                await cli.run({ args: ["test-command"], exitOnError: false });
                const logger = (0, logger_1.getLogger)();
                (0, chai_1.expect)(logger.getWriters()[0]).to.be.instanceOf(fancy_terminal_writer_1.FancyTerminalWriter);
            });
            it("uses the basic logger if log level > info", async () => {
                class TestCommand extends base_1.Command {
                    constructor() {
                        super(...arguments);
                        this.name = "test-command";
                        this.help = "halp!";
                        this.noProject = true;
                    }
                    printHeader() { }
                    async action({}) {
                        return { result: { something: "important" } };
                    }
                }
                const cmd = new TestCommand();
                cli.addCommand(cmd);
                await cli.run({
                    args: ["--logger-type=fancy", "--log-level=3", "test-command"],
                    exitOnError: false,
                });
                const logger = (0, logger_1.getLogger)();
                (0, chai_1.expect)(logger.getWriters()[0]).to.be.instanceOf(basic_terminal_writer_1.BasicTerminalWriter);
            });
            it("uses the basic logger if --show-timestamps flag is set to true", async () => {
                class TestCommand extends base_1.Command {
                    constructor() {
                        super(...arguments);
                        this.name = "test-command";
                        this.help = "halp!";
                        this.noProject = true;
                    }
                    printHeader() { }
                    async action({}) {
                        return { result: { something: "important" } };
                    }
                }
                const cmd = new TestCommand();
                cli.addCommand(cmd);
                await cli.run({ args: ["--logger-type=fancy", "--show-timestamps", "test-command"], exitOnError: false });
                const logger = (0, logger_1.getLogger)();
                (0, chai_1.expect)(logger.getWriters()[0]).to.be.instanceOf(basic_terminal_writer_1.BasicTerminalWriter);
            });
        });
        it("shows group help text if specified command is a group", async () => {
            const cmd = new util_2.UtilCommand();
            const { code, consoleOutput } = await cli.run({ args: ["util"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal(cmd.renderHelp());
        });
        it("shows nested subcommand help text if provided subcommand is a group", async () => {
            const cmd = new cloud_1.CloudCommand();
            const secrets = new cmd.subCommands[0]();
            const { code, consoleOutput } = await cli.run({ args: ["cloud", "secrets"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal(secrets.renderHelp());
        });
        it("shows nested subcommand help text if requested", async () => {
            const cmd = new cloud_1.CloudCommand();
            const secrets = new cmd.subCommands[0]();
            const { code, consoleOutput } = await cli.run({ args: ["cloud", "secrets", "--help"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(consoleOutput).to.equal(secrets.renderHelp());
        });
        it("errors and shows general help if nonexistent command is given", async () => {
            const { code, consoleOutput } = await cli.run({ args: ["nonexistent"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(1);
            (0, chai_1.expect)(consoleOutput).to.equal(await cli.renderHelp("/"));
        });
        it("errors and shows general help if nonexistent command is given with --help", async () => {
            const { code, consoleOutput } = await cli.run({ args: ["nonexistent", "--help"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(1);
            (0, chai_1.expect)(consoleOutput).to.equal(await cli.renderHelp("/"));
        });
        it("picks and runs a command", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({}) {
                    return { result: { something: "important" } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const { code, result } = await cli.run({ args: ["test-command"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(result).to.eql({ something: "important" });
        });
        it("handles params specified before the command", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({}) {
                    return { result: { something: "important" } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const { code, result } = await cli.run({ args: ["--logger-type=basic", "test-command"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(result).to.eql({ something: "important" });
        });
        it("updates the GardenProcess entry if given with command info before running (no server)", async () => {
            const args = ["test-command", "--root", helpers_1.projectRootA];
            const record = await (0, process_1.registerProcess)(globalConfigStore, "test-command", args);
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                }
                printHeader() { }
                async action({ garden }) {
                    (0, chai_1.expect)(record.command).to.equal(this.name);
                    (0, chai_1.expect)(record.sessionId).to.equal(garden.sessionId);
                    (0, chai_1.expect)(record.persistent).to.equal(false);
                    (0, chai_1.expect)(record.serverHost).to.equal(null);
                    (0, chai_1.expect)(record.serverAuthKey).to.equal(null);
                    (0, chai_1.expect)(record.projectRoot).to.equal(garden.projectRoot);
                    (0, chai_1.expect)(record.projectName).to.equal(garden.projectName);
                    (0, chai_1.expect)(record.environmentName).to.equal(garden.environmentName);
                    (0, chai_1.expect)(record.namespace).to.equal(garden.namespace);
                    return { result: {} };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            try {
                await cli.run({ args, exitOnError: false, processRecord: record });
            }
            finally {
                await globalConfigStore.delete("activeProcesses", String(record.pid));
            }
        });
        it("updates the GardenProcess entry if given with command info before running (with server)", async () => {
            const args = ["test-command", "--root", helpers_1.projectRootA];
            const record = await (0, process_1.registerProcess)(globalConfigStore, "test-command", args);
            class TestCommand extends serve_1.ServeCommand {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                }
                async prepare({ footerLog }) {
                    this.server = await (0, server_1.startServer)({ log: footerLog, command: this });
                }
                printHeader() { }
                async action({ garden }) {
                    (0, chai_1.expect)(record.command).to.equal(this.name);
                    (0, chai_1.expect)(record.sessionId).to.equal(garden.sessionId);
                    (0, chai_1.expect)(record.persistent).to.equal(true);
                    (0, chai_1.expect)(record.serverHost).to.equal(this.server.getUrl());
                    (0, chai_1.expect)(record.serverAuthKey).to.equal(this.server.authKey);
                    (0, chai_1.expect)(record.projectRoot).to.equal(garden.projectRoot);
                    (0, chai_1.expect)(record.projectName).to.equal(garden.projectName);
                    (0, chai_1.expect)(record.environmentName).to.equal(garden.environmentName);
                    (0, chai_1.expect)(record.namespace).to.equal(garden.namespace);
                    return { result: {} };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            try {
                await cli.run({ args, exitOnError: false, processRecord: record });
            }
            finally {
                await globalConfigStore.delete("activeProcesses", String(record.pid));
            }
        });
        it("connects the process to an external server instance if available", async () => {
            // Spin up test server and register.
            // Note: We're using test-project-a and the default env+namespace both here and in the CLI run
            const serverGarden = await (0, helpers_1.makeTestGardenA)();
            const serverEventBus = new helpers_1.TestEventBus();
            const server = new server_1.GardenServer({ log: serverGarden.log, command: new serve_1.ServeCommand() });
            server["incomingEvents"] = serverEventBus;
            await server.start();
            await server.setGarden(serverGarden);
            const record = await (0, process_1.registerProcess)(serverGarden.globalConfigStore, "serve", ["serve"]);
            await serverGarden.globalConfigStore.update("activeProcesses", String(record.pid), {
                command: "serve",
                sessionId: serverGarden.sessionId,
                persistent: true,
                serverHost: server.getBaseUrl(),
                serverAuthKey: server.authKey,
                projectRoot: serverGarden.projectRoot,
                projectName: serverGarden.projectName,
                environmentName: serverGarden.environmentName,
                namespace: serverGarden.namespace,
            });
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.streamEvents = true;
                    this.streamLogEntries = true;
                }
                printHeader() { }
                async action({ garden }) {
                    garden.events.emit("_test", "funky functional test");
                    return { result: {} };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const args = ["test-command", "--root", serverGarden.projectRoot];
            try {
                await cli.run({ args, exitOnError: false });
            }
            finally {
                await serverGarden.globalConfigStore.delete("activeProcesses", String(record.pid));
                await server.close();
            }
            serverEventBus.expectEvent("_test", "funky functional test");
        });
        it("tells the CoreEventStream to ignore the local server URL", async () => {
            const testEventBus = new helpers_1.TestEventBus();
            class TestCommand extends serve_1.ServeCommand {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                }
                async prepare({ footerLog }) {
                    this.server = await (0, server_1.startServer)({ log: footerLog, command: this });
                    this.server["incomingEvents"] = testEventBus;
                }
                printHeader() { }
                async action({ garden }) {
                    garden.events.emit("_test", "nope");
                    return { result: {} };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const args = ["test-command", "--root", helpers_1.projectRootA];
            await cli.run({ args, exitOnError: false });
            (0, chai_1.expect)(testEventBus.eventLog).to.eql([]);
        });
        it("shows the URL of the Garden Cloud dashboard", async () => {
            throw "TODO-G2";
        });
        it("picks and runs a subcommand in a group", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({}) {
                    return { result: { something: "important" } };
                }
            }
            class TestGroup extends base_1.CommandGroup {
                constructor() {
                    super(...arguments);
                    this.name = "test-group";
                    this.help = "";
                    this.subCommands = [TestCommand];
                }
            }
            const group = new TestGroup();
            for (const cmd of group.getSubCommands()) {
                cli.addCommand(cmd);
            }
            const { code, result } = await cli.run({ args: ["test-group", "test-command"], exitOnError: false });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(result).to.eql({ something: "important" });
        });
        it("correctly parses and passes global options", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ args, opts }) {
                    return { result: { args, opts } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const _args = [
                "test-command",
                "--root",
                "..",
                "--silent",
                "--env=default",
                "--logger-type",
                "basic",
                "-l=4",
                "--output",
                "json",
                "--yes",
                "--emoji=false",
                "--show-timestamps=false",
                "--force-refresh",
                "--var",
                "my=value,other=something",
                "--disable-port-forwards",
            ];
            const { code, result } = await cli.run({
                args: _args,
                exitOnError: false,
            });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(result).to.eql({
                args: { "$all": _args.slice(1), "--": [] },
                opts: {
                    "root": (0, path_1.resolve)(process.cwd(), ".."),
                    "silent": true,
                    "env": "default",
                    "logger-type": "basic",
                    "log-level": "4",
                    "output": "json",
                    "emoji": false,
                    "show-timestamps": false,
                    "yes": true,
                    "force-refresh": true,
                    "var": ["my=value", "other=something"],
                    "version": false,
                    "help": false,
                    "disable-port-forwards": true,
                },
            });
        });
        it("allows setting env through GARDEN_ENVIRONMENT env variable", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ args, opts }) {
                    return { result: { args, opts } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const saveEnv = constants_1.gardenEnv.GARDEN_ENVIRONMENT;
            try {
                constants_1.gardenEnv.GARDEN_ENVIRONMENT = "foo";
                const { code, result } = await cli.run({
                    args: ["test-command"],
                    exitOnError: false,
                });
                (0, chai_1.expect)(code).to.equal(0);
                (0, chai_1.expect)(result.opts.env).to.equal("foo");
            }
            finally {
                constants_1.gardenEnv.GARDEN_ENVIRONMENT = saveEnv;
            }
        });
        it("prefers --env over GARDEN_ENVIRONMENT env variable", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ args, opts }) {
                    return { result: { args, opts } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const saveEnv = constants_1.gardenEnv.GARDEN_ENVIRONMENT;
            try {
                constants_1.gardenEnv.GARDEN_ENVIRONMENT = "bar";
                const { code, result } = await cli.run({
                    args: ["test-command", "--env", "foo"],
                    exitOnError: false,
                });
                (0, chai_1.expect)(code).to.equal(0);
                (0, chai_1.expect)(result.opts.env).to.equal("foo");
            }
            finally {
                constants_1.gardenEnv.GARDEN_ENVIRONMENT = saveEnv;
            }
        });
        it("correctly parses and passes arguments and options for a command", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                    this.noProject = true;
                    this.arguments = {
                        foo: new params_1.StringParameter({
                            help: "Some help text.",
                            required: true,
                        }),
                        bar: new params_1.StringParameter({
                            help: "Another help text.",
                        }),
                    };
                    this.options = {
                        floop: new params_1.StringParameter({
                            help: "Option help text.",
                        }),
                    };
                }
                printHeader() { }
                async action({ args, opts }) {
                    return { result: { args, opts } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const { code, result } = await cli.run({
                args: ["test-command", "foo-arg", "bar-arg", "--floop", "floop-opt", "--", "extra"],
                exitOnError: false,
            });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(result).to.eql({
                args: {
                    "$all": ["foo-arg", "bar-arg", "--floop", "floop-opt", "--", "extra"],
                    "--": ["extra"],
                    "foo": "foo-arg",
                    "bar": "bar-arg",
                },
                opts: {
                    "silent": false,
                    "log-level": "info",
                    "emoji": (0, util_3.envSupportsEmoji)(),
                    "show-timestamps": false,
                    "yes": false,
                    "force-refresh": false,
                    "version": false,
                    "help": false,
                    "floop": "floop-opt",
                    "disable-port-forwards": false,
                },
            });
        });
        it("correctly parses and passes arguments and options for a subcommand", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                    this.noProject = true;
                    this.arguments = {
                        foo: new params_1.StringParameter({
                            help: "Some help text.",
                            required: true,
                        }),
                        bar: new params_1.StringParameter({
                            help: "Another help text.",
                        }),
                    };
                    this.options = {
                        floop: new params_1.StringParameter({
                            help: "Option help text.",
                        }),
                    };
                }
                printHeader() { }
                async action({ args, opts }) {
                    return { result: { args, opts } };
                }
            }
            class TestGroup extends base_1.CommandGroup {
                constructor() {
                    super(...arguments);
                    this.name = "test-group";
                    this.help = "";
                    this.subCommands = [TestCommand];
                }
            }
            const group = new TestGroup();
            for (const cmd of group.getSubCommands()) {
                cli.addCommand(cmd);
            }
            const { code, result } = await cli.run({
                args: ["test-group", "test-command", "foo-arg", "bar-arg", "--floop", "floop-opt"],
                exitOnError: false,
            });
            (0, chai_1.expect)(code).to.equal(0);
            (0, chai_1.expect)(result).to.eql({
                args: {
                    "$all": ["foo-arg", "bar-arg", "--floop", "floop-opt"],
                    "--": [],
                    "foo": "foo-arg",
                    "bar": "bar-arg",
                },
                opts: {
                    "silent": false,
                    "log-level": "info",
                    "emoji": (0, util_3.envSupportsEmoji)(),
                    "show-timestamps": false,
                    "yes": false,
                    "force-refresh": false,
                    "version": false,
                    "help": false,
                    "floop": "floop-opt",
                    "disable-port-forwards": false,
                },
            });
        });
        it("aborts with usage information on invalid global options", async () => {
            const cmd = new tools_1.ToolsCommand();
            const { code, consoleOutput } = await cli.run({ args: ["tools", "--logger-type", "bla"], exitOnError: false });
            const stripped = (0, strip_ansi_1.default)(consoleOutput).trim();
            (0, chai_1.expect)(code).to.equal(1);
            (0, chai_1.expect)(stripped.startsWith('Invalid value for option --logger-type: "bla" is not a valid argument (should be any of "quiet", "basic", "fancy", "json")')).to.be.true;
            (0, chai_1.expect)(consoleOutput).to.include(cmd.renderHelp());
        });
        it("aborts with usage information on missing/invalid command arguments and options", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                    this.noProject = true;
                    this.arguments = {
                        foo: new params_1.StringParameter({
                            help: "Some help text.",
                            required: true,
                        }),
                    };
                }
                printHeader() { }
                async action({ args, opts }) {
                    return { result: { args, opts } };
                }
            }
            const cmd = new TestCommand();
            cli.addCommand(cmd);
            const { code, consoleOutput } = await cli.run({ args: ["test-command"], exitOnError: false });
            const stripped = (0, strip_ansi_1.default)(consoleOutput).trim();
            (0, chai_1.expect)(code).to.equal(1);
            (0, chai_1.expect)(stripped.startsWith("Missing required argument foo")).to.be.true;
            (0, chai_1.expect)(consoleOutput).to.include(cmd.renderHelp());
        });
        it("should pass array of all arguments to commands as $all", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ args }) {
                    return { result: { args } };
                }
            }
            const command = new TestCommand();
            cli.addCommand(command);
            const { result } = await cli.run({ args: ["test-command", "--", "-v", "--flag", "arg"], exitOnError: false });
            (0, chai_1.expect)(result.args.$all).to.eql(["--", "-v", "--flag", "arg"]);
        });
        it("should not parse args after -- and instead pass directly to commands", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ args }) {
                    return { result: { args } };
                }
            }
            const command = new TestCommand();
            cli.addCommand(command);
            const { result } = await cli.run({ args: ["test-command", "--", "-v", "--flag", "arg"], exitOnError: false });
            (0, chai_1.expect)(result.args["--"]).to.eql(["-v", "--flag", "arg"]);
        });
        it("should correctly parse --var flag", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command-var";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ garden }) {
                    return { result: { variables: garden.variables } };
                }
            }
            const command = new TestCommand();
            cli.addCommand(command);
            const { result } = await cli.run({
                args: ["test-command-var", "--var", 'key-a=value-a,key-b="value with quotes"'],
                exitOnError: false,
            });
            (0, chai_1.expect)(result).to.eql({ variables: { "key-a": "value-a", "key-b": "value with quotes" } });
        });
        it("should output JSON if --output=json", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action() {
                    return { result: { some: "output" } };
                }
            }
            const command = new TestCommand();
            cli.addCommand(command);
            const { consoleOutput } = await cli.run({ args: ["test-command", "--output=json"], exitOnError: false });
            (0, chai_1.expect)(JSON.parse(consoleOutput)).to.eql({ result: { some: "output" }, success: true });
        });
        it("should output YAML if --output=json", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action() {
                    return { result: { some: "output" } };
                }
            }
            const command = new TestCommand();
            cli.addCommand(command);
            const { consoleOutput } = await cli.run({ args: ["test-command", "--output=yaml"], exitOnError: false });
            (0, chai_1.expect)((0, js_yaml_1.safeLoad)(consoleOutput)).to.eql({ result: { some: "output" }, success: true });
        });
        it("should disable port forwards if --disable-port-forwards is set", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ garden }) {
                    return { result: { garden } };
                }
            }
            const command = new TestCommand();
            cli.addCommand(command);
            const { result } = await cli.run({ args: ["test-command", "--disable-port-forwards"], exitOnError: false });
            (0, chai_1.expect)(result.garden.disablePortForwards).to.be.true;
        });
        it(`should configure a dummy environment when command has noProject=true and --env is specified`, async () => {
            class TestCommand2 extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command-2";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ garden }) {
                    return { result: { environmentName: garden.environmentName } };
                }
            }
            const command = new TestCommand2();
            cli.addCommand(command);
            const { result, errors } = await cli.run({ args: ["test-command-2", "--env", "missing-env"], exitOnError: false });
            (0, chai_1.expect)(errors).to.eql([]);
            (0, chai_1.expect)(result).to.eql({ environmentName: "missing-env" });
        });
        it("should error if an invalid --env parameter is passed", async () => {
            class TestCommand3 extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command-3";
                    this.help = "halp!";
                    this.noProject = true;
                }
                printHeader() { }
                async action({ garden }) {
                    return { result: { environmentName: garden.environmentName } };
                }
            }
            const command = new TestCommand3();
            cli.addCommand(command);
            const { errors } = await cli.run({ args: ["test-command-3", "--env", "$.%"], exitOnError: false });
            (0, chai_1.expect)(errors.length).to.equal(1);
            (0, chai_1.expect)((0, strip_ansi_1.default)(errors[0].message)).to.equal("Invalid value for option --env: Invalid environment specified ($.%): must be a valid environment name or <namespace>.<environment>");
        });
        context("test analytics", () => {
            const host = "https://api.segment.io";
            const scope = (0, nock_1.default)(host);
            let garden;
            let resetAnalyticsConfig;
            before(async () => {
                garden = await (0, helpers_1.makeTestGardenA)();
                resetAnalyticsConfig = await (0, helpers_1.enableAnalytics)(garden);
            });
            after(async () => {
                await resetAnalyticsConfig();
                nock_1.default.cleanAll();
            });
            // TODO: @eysi This test always passes locally but fails consistently in CI.
            // I'm pretty stumped so simply skipping this for now but definitely revisiting.
            // Let's make sure we keep an eye on our analytics data after we release this.
            // If nothing looks off there, we can assume the test was bad. Otherwise
            // we'll need to revert.
            it.skip("should wait for queued analytic events to flush", async () => {
                class TestCommand extends base_1.Command {
                    constructor() {
                        super(...arguments);
                        this.name = "test-command";
                        this.help = "hilfe!";
                        this.noProject = true;
                    }
                    printHeader() { }
                    async action({ args }) {
                        return { result: { args } };
                    }
                }
                const command = new TestCommand();
                cli.addCommand(command);
                scope
                    .post(`/v1/batch`, (body) => {
                    const events = body.batch.map((event) => ({
                        event: event.event,
                        type: event.type,
                        name: event.properties.name,
                    }));
                    return (0, lodash_1.isEqual)(events, [
                        {
                            event: "Run Command",
                            type: "track",
                            name: "test-command",
                        },
                    ]);
                })
                    .reply(200);
                await cli.run({ args: ["test-command"], exitOnError: false });
                (0, chai_1.expect)(scope.isDone()).to.equal(true);
            });
        });
    });
    describe("makeDummyGarden", () => {
        it("should initialise and resolve config graph in a directory with no project", async () => {
            const garden = await (0, cli_1.makeDummyGarden)((0, path_1.join)(constants_1.GARDEN_CORE_ROOT, "tmp", "foobarbas"), {
                commandInfo: { name: "foo", args: {}, opts: {} },
            });
            const dg = await garden.getConfigGraph({ log: garden.log, emit: false });
            (0, chai_1.expect)(garden).to.be.ok;
            (0, chai_1.expect)(dg.getModules()).to.not.throw;
        });
        it("should correctly configure a dummy environment when a namespace is set", async () => {
            const garden = await (0, cli_1.makeDummyGarden)((0, path_1.join)(constants_1.GARDEN_CORE_ROOT, "tmp", "foobarbas"), {
                environmentName: "test.foo",
                commandInfo: { name: "foo", args: {}, opts: {} },
            });
            (0, chai_1.expect)(garden).to.be.ok;
            (0, chai_1.expect)(garden.environmentName).to.equal("foo");
        });
        it("should initialise and resolve config graph in a project with invalid config", async () => {
            const root = (0, helpers_1.getDataDir)("test-project-invalid-config");
            const garden = await (0, cli_1.makeDummyGarden)(root, { commandInfo: { name: "foo", args: {}, opts: {} } });
            const dg = await garden.getConfigGraph({ log: garden.log, emit: false });
            (0, chai_1.expect)(garden).to.be.ok;
            (0, chai_1.expect)(dg.getModules()).to.not.throw;
        });
        it("should initialise and resolve config graph in a project with template strings", async () => {
            const root = (0, helpers_1.getDataDir)("test-project-templated");
            const garden = await (0, cli_1.makeDummyGarden)(root, { commandInfo: { name: "foo", args: {}, opts: {} } });
            const dg = await garden.getConfigGraph({ log: garden.log, emit: false });
            (0, chai_1.expect)(garden).to.be.ok;
            (0, chai_1.expect)(dg.getModules()).to.not.throw;
        });
    });
    describe("runtime dependency check", () => {
        describe("validateRuntimeRequirementsCached", () => {
            let config;
            let tmpDir;
            const log = (0, logger_1.getLogger)();
            before(async () => {
                tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
                config = new global_1.GlobalConfigStore(tmpDir.path);
            });
            after(async () => {
                await tmpDir.cleanup();
            });
            afterEach(async () => {
                await config.clear();
            });
            it("should call requirementCheckFunction if requirementsCheck hasn't been populated", async () => {
                const requirementCheckFunction = testdouble_1.default.func();
                await (0, cli_1.validateRuntimeRequirementsCached)(log, config, requirementCheckFunction);
                (0, chai_1.expect)(testdouble_1.default.explain(requirementCheckFunction).callCount).to.equal(1);
            });
            it("should call requirementCheckFunction if requirementsCheck hasn't passed", async () => {
                await config.set("requirementsCheck", { passed: false });
                const requirementCheckFunction = testdouble_1.default.func();
                await (0, cli_1.validateRuntimeRequirementsCached)(log, config, requirementCheckFunction);
                (0, chai_1.expect)(testdouble_1.default.explain(requirementCheckFunction).callCount).to.equal(1);
            });
            it("should populate config if requirementCheckFunction passes", async () => {
                const requirementCheckFunction = testdouble_1.default.func();
                await (0, cli_1.validateRuntimeRequirementsCached)(log, config, requirementCheckFunction);
                const requirementsCheckConfig = await config.get("requirementsCheck");
                (0, chai_1.expect)(requirementsCheckConfig.passed).to.equal(true);
            });
            it("should not call requirementCheckFunction if requirementsCheck has been passed", async () => {
                await config.set("requirementsCheck", { passed: true });
                const requirementCheckFunction = testdouble_1.default.func();
                await (0, cli_1.validateRuntimeRequirementsCached)(log, config, requirementCheckFunction);
                (0, chai_1.expect)(testdouble_1.default.explain(requirementCheckFunction).callCount).to.equal(0);
            });
            it("should throw if requirementCheckFunction throws", async () => {
                async function requirementCheckFunction() {
                    throw new Error("broken");
                }
                await (0, testing_1.expectError)(() => (0, cli_1.validateRuntimeRequirementsCached)(log, config, requirementCheckFunction), {
                    contains: "broken",
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQTZCO0FBQzdCLGdEQUF1QjtBQUN2QixtQ0FBZ0M7QUFDaEMsNERBQTJCO0FBRTNCLGlEQUF1RztBQUN2Ryw4Q0FReUI7QUFDekIseURBQXVFO0FBQ3ZFLCtCQUFvQztBQUNwQyx3REFBbUc7QUFDbkcsb0RBQTZEO0FBQzdELDZEQUFnRTtBQUNoRSx1REFBNEQ7QUFDNUQsNERBQWtDO0FBQ2xDLDBEQUE2RDtBQUM3RCwwREFBaUU7QUFDakUscUNBQWtDO0FBQ2xDLDBEQUF5RTtBQUN6RSxnR0FBMEY7QUFDMUYsZ0dBQTBGO0FBQzFGLHNEQUE4RDtBQUM5RCwwREFBMEQ7QUFDMUQsZ0VBQXVFO0FBQ3ZFLDhEQUE2QjtBQUM3QixnRUFBbUU7QUFDbkUscURBQXlEO0FBQ3pELDBEQUE2RDtBQUU3RCxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtJQUNuQixJQUFJLEdBQWMsQ0FBQTtJQUNsQixNQUFNLGlCQUFpQixHQUFHLElBQUksMEJBQWlCLEVBQUUsQ0FBQTtJQUVqRCxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsR0FBRyxHQUFHLElBQUksZUFBUyxFQUFFLENBQUE7SUFDdkIsQ0FBQyxDQUFDLENBQUE7SUFFRixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsSUFBSSxHQUFHLENBQUMsYUFBYSxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFO1lBQzlDLE1BQU0saUJBQWlCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7U0FDakY7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1FBQ25CLEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFL0UsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN4QixJQUFBLGFBQU0sRUFBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQzNELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGtFQUFrRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hGLE1BQU0sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFbkYsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN4QixJQUFBLGFBQU0sRUFBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQzNELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHNFQUFzRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BGLE1BQU0sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFbkYsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN4QixJQUFBLGFBQU0sRUFBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQzNELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGdGQUFnRixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlGLE1BQU0sV0FBWSxTQUFRLGNBQU87Z0JBQWpDOztvQkFDRSxTQUFJLEdBQUcsY0FBYyxDQUFBO29CQUNyQixTQUFJLEdBQUcsT0FBTyxDQUFBO29CQUNkLGNBQVMsR0FBRyxJQUFJLENBQUE7Z0JBT2xCLENBQUM7Z0JBTEMsV0FBVyxLQUFJLENBQUM7Z0JBRWhCLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUU7b0JBQ25CLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFBO2dCQUM3QixDQUFDO2FBQ0Y7WUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFBO1lBQzdCLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7WUFFbkIsTUFBTSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsR0FBRyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFdkcsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN4QixJQUFBLGFBQU0sRUFBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFBO1FBQ2xELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JELE1BQU0sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFbkYsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN4QixJQUFBLGFBQU0sRUFBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUEsd0JBQWlCLEdBQUUsQ0FBQyxDQUFBO1FBQ3JELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVELE1BQU0sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFMUYsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN4QixJQUFBLGFBQU0sRUFBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUEsd0JBQWlCLEdBQUUsQ0FBQyxDQUFBO1FBQ3JELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHVEQUF1RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JFLE1BQU0sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFFeEYsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMs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