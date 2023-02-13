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
const helpers_1 = require("../../../../src/cli/helpers");
const helpers_2 = require("../../../helpers");
const util_1 = require("../../../../src/util/util");
const constants_1 = require("../../../../src/constants");
const path_1 = require("path");
const helpers_3 = require("../../../helpers");
const deploy_1 = require("../../../../src/commands/deploy");
const helpers_4 = require("../../../../src/cli/helpers");
const delete_1 = require("../../../../src/commands/delete");
const get_outputs_1 = require("../../../../src/commands/get/get-outputs");
const test_1 = require("../../../../src/commands/test");
const run_1 = require("../../../../src/commands/run");
const publish_1 = require("../../../../src/commands/publish");
const build_1 = require("../../../../src/commands/build");
const logs_1 = require("../../../../src/commands/logs");
const commands_1 = require("../../../../src/commands/commands");
const logger_1 = require("../../../../src/logger/logger");
const exec_1 = require("../../../../src/commands/exec");
const validLogLevels = (0, logger_1.getLogLevelChoices)();
describe("getPackageVersion", () => {
    it("should return the version in package.json", async () => {
        const version = require((0, path_1.join)(constants_1.GARDEN_CORE_ROOT, "package.json")).version;
        (0, chai_1.expect)((0, util_1.getPackageVersion)()).to.eq(version);
    });
});
describe("getLogLevelChoices", () => {
    it("should return all valid log levels as strings", async () => {
        const choices = (0, logger_1.getLogLevelChoices)().sort();
        const sorted = [...validLogLevels].sort();
        (0, chai_1.expect)(choices).to.eql(sorted);
    });
});
describe("parseLogLevel", () => {
    it("should return a level integer if valid", async () => {
        const parsed = validLogLevels.map((el) => (0, logger_1.parseLogLevel)(el));
        (0, chai_1.expect)(parsed).to.eql([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);
    });
    it("should throw if level is not valid", async () => {
        await (0, helpers_2.expectError)(() => (0, logger_1.parseLogLevel)("banana"), "internal");
    });
    it("should throw if level is not valid", async () => {
        await (0, helpers_2.expectError)(() => (0, logger_1.parseLogLevel)("-1"), "internal");
    });
    it("should throw if level is not valid", async () => {
        await (0, helpers_2.expectError)(() => (0, logger_1.parseLogLevel)(""), "internal");
    });
});
describe("pickCommand", () => {
    const commands = (0, commands_1.getBuiltinCommands)();
    it("picks a command and returns the rest of arguments", () => {
        const { command, rest } = (0, helpers_1.pickCommand)(commands, ["build", "foo", "--force"]);
        (0, chai_1.expect)(command === null || command === void 0 ? void 0 : command.getPath()).to.eql(["build"]);
        (0, chai_1.expect)(rest).to.eql(["foo", "--force"]);
    });
    it("picks a subcommand and returns the rest of arguments", () => {
        const { command, rest } = (0, helpers_1.pickCommand)(commands, ["run-workflow", "foo", "--force"]);
        (0, chai_1.expect)(command === null || command === void 0 ? void 0 : command.getPath()).to.eql(["run-workflow"]);
        (0, chai_1.expect)(rest).to.eql(["foo", "--force"]);
    });
    it("picks a command with an alias", () => {
        const { command, rest } = (0, helpers_1.pickCommand)(commands, ["delete", "ns", "foo", "--force"]);
        (0, chai_1.expect)(command === null || command === void 0 ? void 0 : command.getPath()).to.eql(["cleanup", "namespace"]);
        (0, chai_1.expect)(rest).to.eql(["foo", "--force"]);
    });
    it("returns undefined command if none is found", () => {
        const args = ["bla", "ble"];
        const { command, rest } = (0, helpers_1.pickCommand)(commands, args);
        (0, chai_1.expect)(command).to.be.undefined;
        (0, chai_1.expect)(rest).to.eql(args);
    });
});
describe("parseCliArgs", () => {
    it("parses string arguments and returns a mapping", () => {
        const argv = (0, helpers_4.parseCliArgs)({ stringArgs: ["build", "my-module", "--force", "-l=5"], cli: true });
        (0, chai_1.expect)(argv._).to.eql(["build", "my-module"]);
        (0, chai_1.expect)(argv.force).to.be.true;
        (0, chai_1.expect)(argv["log-level"]).to.equal("5");
    });
    it("returns an array for a parameter if multiple instances are specified", () => {
        const argv = (0, helpers_4.parseCliArgs)({ stringArgs: ["test", "--name", "foo", "--name", "bar"], cli: true });
        (0, chai_1.expect)(argv._).to.eql(["test"]);
        (0, chai_1.expect)(argv.name).to.eql(["foo", "bar"]);
    });
    it("correctly handles global boolean options", () => {
        const argv = (0, helpers_4.parseCliArgs)({
            stringArgs: ["build", "my-module", "--force-refresh", "--silent=false", "-y"],
            cli: true,
        });
        (0, chai_1.expect)(argv["force-refresh"]).to.be.true;
        (0, chai_1.expect)(argv.silent).to.be.false;
        (0, chai_1.expect)(argv.yes).to.be.true;
    });
    it("correctly handles command boolean options", () => {
        const cmd = new build_1.BuildCommand();
        const argv = (0, helpers_4.parseCliArgs)({
            stringArgs: ["build", "my-module", "-f", "--with-dependants"],
            command: cmd,
            cli: true,
        });
        (0, chai_1.expect)(argv.force).to.be.true;
        (0, chai_1.expect)(argv["with-dependants"]).to.be.true;
    });
    it("sets empty string value instead of boolean for string options", () => {
        const cmd = new deploy_1.DeployCommand();
        const argv = (0, helpers_4.parseCliArgs)({ stringArgs: ["deploy", "--dev"], command: cmd, cli: true });
        (0, chai_1.expect)(argv["dev-mode"]).to.equal("");
    });
    it("sets default global option values", () => {
        const cmd = new deploy_1.DeployCommand();
        const argv = (0, helpers_4.parseCliArgs)({ stringArgs: [], command: cmd, cli: true });
        (0, chai_1.expect)(argv.silent).to.be.false;
        (0, chai_1.expect)(argv["log-level"]).to.equal(logger_1.LogLevel[logger_1.LogLevel.info]);
    });
    it("sets default command option values", () => {
        const cmd = new build_1.BuildCommand();
        const argv = (0, helpers_4.parseCliArgs)({ stringArgs: [], command: cmd, cli: true });
        (0, chai_1.expect)(argv.force).to.be.false;
        (0, chai_1.expect)(argv.watch).to.be.false;
    });
    it("sets prefers cliDefault over defaultValue when cli=true", () => {
        const cmd = new exec_1.ExecCommand();
        const argv = (0, helpers_4.parseCliArgs)({ stringArgs: [], command: cmd, cli: true });
        (0, chai_1.expect)(argv.interactive).to.be.true;
    });
    it("sets prefers defaultValue over cliDefault when cli=false", () => {
        const cmd = new exec_1.ExecCommand();
        const argv = (0, helpers_4.parseCliArgs)({ stringArgs: [], command: cmd, cli: false });
        (0, chai_1.expect)(argv.interactive).to.be.false;
    });
});
function parseAndProcess(args, command, cli = true) {
    const rawArgs = [...command.getPath(), ...args];
    return (0, helpers_1.processCliArgs)({ rawArgs, parsedArgs: (0, helpers_4.parseCliArgs)({ stringArgs: args, command, cli }), command, cli });
}
describe("processCliArgs", () => {
    let garden;
    let log;
    let defaultActionParams;
    before(async () => {
        garden = await (0, helpers_3.makeTestGardenA)();
        log = garden.log;
        defaultActionParams = {
            garden,
            log,
            headerLog: log,
            footerLog: log,
        };
    });
    it("correctly handles blank arguments", () => {
        const cmd = new build_1.BuildCommand();
        const { args } = parseAndProcess([], cmd);
        (0, chai_1.expect)(args.$all).to.eql([]);
        (0, chai_1.expect)(args["--"]).to.eql([]);
        (0, chai_1.expect)(args.names).to.be.undefined;
    });
    it("populates the $all argument, omitting the command name", () => {
        const cmd = new build_1.BuildCommand();
        // Note: The command name is implicitly added in this helper
        const { args } = parseAndProcess(["module-name", "--force"], cmd);
        (0, chai_1.expect)(args.$all).to.eql(["module-name", "--force"]);
    });
    it("populates the -- argument", () => {
        const cmd = new build_1.BuildCommand();
        const { args } = parseAndProcess(["module-name", "--", "foo", "bla"], cmd);
        (0, chai_1.expect)(args["--"]).to.eql(["foo", "bla"]);
    });
    it("correctly handles command option flags", () => {
        const cmd = new deploy_1.DeployCommand();
        const { opts } = parseAndProcess(["--force-build=true", "--forward"], cmd);
        (0, chai_1.expect)(opts["force-build"]).to.be.true;
        (0, chai_1.expect)(opts.forward).to.be.true;
    });
    it("correctly handles option aliases", () => {
        const cmd = new deploy_1.DeployCommand();
        const { opts } = parseAndProcess(["--dev", "--force-build=false"], cmd);
        (0, chai_1.expect)(opts["dev-mode"]).to.eql([]);
        (0, chai_1.expect)(opts["force-build"]).to.be.false;
    });
    it("correctly handles multiple instances of a string array parameter", () => {
        const cmd = new test_1.TestCommand();
        const { opts } = parseAndProcess(["--name", "foo", "-n", "bar"], cmd);
        (0, chai_1.expect)(opts.name).to.eql(["foo", "bar"]);
    });
    it("correctly handles multiple instances of a string array parameter where one uses string-delimited values", () => {
        const cmd = new test_1.TestCommand();
        const { opts } = parseAndProcess(["--name", "foo,bar", "-n", "baz"], cmd);
        (0, chai_1.expect)(opts.name).to.eql(["foo", "bar", "baz"]);
    });
    it("uses value of last option when non-array option is repeated", () => {
        const cmd = new deploy_1.DeployCommand();
        const { opts } = parseAndProcess(["--force-build=false", "--force-build=true"], cmd);
        (0, chai_1.expect)(opts["force-build"]).to.be.true;
    });
    it("correctly handles positional arguments", () => {
        const cmd = new build_1.BuildCommand();
        const { args } = parseAndProcess(["my-module"], cmd);
        (0, chai_1.expect)(args.names).to.eql(["my-module"]);
    });
    it("correctly handles global option flags", () => {
        const cmd = new build_1.BuildCommand();
        const { opts } = parseAndProcess(["--log-level", "debug", "--logger-type=basic"], cmd);
        (0, chai_1.expect)(opts["logger-type"]).to.equal("basic");
        (0, chai_1.expect)(opts["log-level"]).to.equal("debug");
    });
    // TODO: do this after the refactor is done and tested
    // it("should handle a variadic argument spec", async () => {
    //   const argSpec = {
    //     first: new StringParameter({
    //       help: "Some help text.",
    //     }),
    //     rest: new StringsParameter({
    //       help: "Some help text.",
    //       variadic: true,
    //     }),
    //   }
    //   class VarCommand extends Command<typeof argSpec> {
    //     name = "var-command"
    //     help = "halp!"
    //     noProject = true
    //     arguments = argSpec
    //     async action(params) {
    //       return { result: params }
    //     }
    //   }
    //   const cmd = new VarCommand()
    //   const { args } = parseAndProcess(["test-command", "something", "a", "b", "c"], cmd)
    //   expect(args.first).to.equal("something")
    //   expect(args.rest).to.eql(["a", "b", "c"])
    // })
    it("throws an error when a required positional argument is missing", () => {
        const cmd = new exec_1.ExecCommand();
        (0, helpers_2.expectError)(() => parseAndProcess([], cmd), { contains: "Missing required argument" });
    });
    it("throws an error when an unexpected positional argument is given", () => {
        const cmd = new delete_1.DeleteDeployCommand();
        (0, helpers_2.expectError)(() => parseAndProcess(["my-service", "bla"], cmd), { contains: 'Unexpected positional argument "bla"' });
    });
    it("throws an error when an unrecognized option is set", () => {
        const cmd = new build_1.BuildCommand();
        (0, helpers_2.expectError)(() => parseAndProcess(["--foo=bar"], cmd), { contains: "Unrecognized option flag --foo" });
    });
    it("throws an error when an invalid argument is given to a choice option", () => {
        const cmd = new build_1.BuildCommand();
        (0, helpers_2.expectError)(() => parseAndProcess(["--logger-type=foo"], cmd), {
            contains: 'Invalid value for option --logger-type: "foo" is not a valid argument (should be any of "quiet", "basic", "fancy", "json")',
        });
    });
    it("throws an error when an invalid argument is given to an integer option", () => {
        const cmd = new logs_1.LogsCommand();
        (0, helpers_2.expectError)(() => parseAndProcess(["--tail=foo"], cmd), {
            contains: 'Invalid value for option --tail: Could not parse "foo" as integer',
        });
    });
    it("ignores cliOnly options when cli=false", () => {
        const cmd = new exec_1.ExecCommand();
        const { opts } = parseAndProcess(["my-service", "echo 'test'", "--interactive=true"], cmd, false);
        (0, chai_1.expect)(opts.interactive).to.be.false;
    });
    it("sets default values for command flags", () => {
        const cmd = new build_1.BuildCommand();
        const { opts } = parseAndProcess([], cmd);
        (0, chai_1.expect)(opts.force).to.be.false;
    });
    it("sets default values for global flags", () => {
        const cmd = new build_1.BuildCommand();
        const { opts } = parseAndProcess([], cmd);
        (0, chai_1.expect)(opts.silent).to.be.false;
        (0, chai_1.expect)(opts["log-level"]).to.equal(logger_1.LogLevel[logger_1.LogLevel.info]);
    });
    it("prefers defaultValue value over cliDefault when cli=false", () => {
        const cmd = new exec_1.ExecCommand();
        const { opts } = parseAndProcess(["my-service", "echo 'test'"], cmd, false);
        (0, chai_1.expect)(opts.interactive).to.be.false;
    });
    it("prefers cliDefault value over defaultValue when cli=true", () => {
        const cmd = new exec_1.ExecCommand();
        const { opts } = parseAndProcess(["my-service", "echo 'test'"], cmd, true);
        (0, chai_1.expect)(opts.interactive).to.be.true;
    });
    it("throws with all found errors if applicable", () => {
        const cmd = new run_1.RunCommand();
        (0, helpers_2.expectError)(() => parseAndProcess(["--foo=bar", "--interactive=9", "--force"], cmd), {
            contains: ["Unrecognized option flag --foo", "Unrecognized option flag --interactive"],
        });
    });
    it("parses args and opts for a DeployCommand", async () => {
        const cmd = new deploy_1.DeployCommand();
        const { args, opts } = parseAndProcess(["service-a,service-b", "--force-build=true"], cmd);
        await cmd.action({
            ...defaultActionParams,
            args,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts),
        });
        const { args: args2, opts: opts2 } = parseAndProcess(["service-a", "--skip-dependencies=true"], cmd);
        await cmd.action({
            ...defaultActionParams,
            args: args2,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts2),
        });
    });
    it("parses args and opts for a DeleteServiceCommand", async () => {
        const cmd = new delete_1.DeleteDeployCommand();
        const { args, opts } = parseAndProcess(["service-a"], cmd);
        await cmd.action({
            ...defaultActionParams,
            args,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts),
        });
    });
    it("parses args and opts for a GetOutputsCommand", async () => {
        const cmd = new get_outputs_1.GetOutputsCommand();
        const { args, opts } = parseAndProcess([], cmd);
        await cmd.action({
            ...defaultActionParams,
            args,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts),
        });
    });
    it("parses args and opts for a TestCommand", async () => {
        const cmd = new test_1.TestCommand();
        const { args, opts } = parseAndProcess(["module-a,module-b", "-n unit"], cmd);
        await cmd.action({
            ...defaultActionParams,
            args,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts),
        });
    });
    it("parses args and opts for a RunCommand", async () => {
        const cmd = new run_1.RunCommand();
        const { args, opts } = parseAndProcess(["task-b"], cmd);
        await cmd.action({
            ...defaultActionParams,
            args,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts),
        });
    });
    it("parses args and opts for a RunCommand", async () => {
        const cmd = new run_1.RunCommand();
        const { args, opts } = parseAndProcess(["*", "--force"], cmd);
        await cmd.action({
            ...defaultActionParams,
            args,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts),
        });
    });
    it("parses args and opts for a PublishCommand", async () => {
        const cmd = new publish_1.PublishCommand();
        const { args, opts } = parseAndProcess(["module-a,module-b", "--force-build"], cmd);
        await cmd.action({
            ...defaultActionParams,
            args,
            opts: (0, helpers_3.withDefaultGlobalOpts)(opts),
        });
    });
});
describe("optionsWithAliasValues", () => {
    it("populates alias keys when option values are provided", async () => {
        const cmd = new deploy_1.DeployCommand();
        const { opts } = parseAndProcess(["service-a,service-b", "--dev=service-a,service-b"], cmd);
        const withAliasValues = (0, helpers_1.optionsWithAliasValues)(cmd, opts);
        (0, chai_1.expect)(withAliasValues["dev-mode"]).to.eql(["service-a", "service-b"]);
        (0, chai_1.expect)(withAliasValues["dev"]).to.eql(["service-a", "service-b"]); // We expect the alias to be populated too
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IseURBQWlHO0FBRWpHLDhDQUFnRTtBQUNoRSxvREFBNkQ7QUFDN0QseURBQTREO0FBQzVELCtCQUEyQjtBQUMzQiw4Q0FBcUY7QUFDckYsNERBQStEO0FBQy9ELHlEQUEwRDtBQUUxRCw0REFBcUU7QUFDckUsMEVBQTRFO0FBQzVFLHdEQUEyRDtBQUMzRCxzREFBeUQ7QUFDekQsOERBQWlFO0FBQ2pFLDBEQUE2RDtBQUU3RCx3REFBMkQ7QUFDM0QsZ0VBQXNFO0FBRXRFLDBEQUEyRjtBQUMzRix3REFBMkQ7QUFFM0QsTUFBTSxjQUFjLEdBQUcsSUFBQSwyQkFBa0IsR0FBRSxDQUFBO0FBRTNDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7SUFDakMsRUFBRSxDQUFDLDJDQUEyQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3pELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFBLFdBQUksRUFBQyw0QkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtRQUN2RSxJQUFBLGFBQU0sRUFBQyxJQUFBLHdCQUFpQixHQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzVDLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO0lBQ2xDLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3RCxNQUFNLE9BQU8sR0FBRyxJQUFBLDJCQUFrQixHQUFFLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDM0MsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ3pD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