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
const base_1 = require("../../../../src/commands/base");
const params_1 = require("../../../../src/cli/params");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const string_1 = require("../../../../src/util/string");
const helpers_1 = require("../../../helpers");
describe("Command", () => {
    describe("renderHelp", () => {
        it("renders the command help text", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                    this.arguments = {
                        foo: new params_1.StringsParameter({
                            help: "Some help text.",
                            required: true,
                        }),
                        bar: new params_1.StringsParameter({
                            help: "Another help text.",
                        }),
                    };
                    this.options = {
                        floop: new params_1.StringsParameter({
                            help: "Option help text.",
                        }),
                    };
                }
                printHeader() { }
                async action() {
                    return {};
                }
            }
            const cmd = new TestCommand();
            (0, chai_1.expect)((0, helpers_1.trimLineEnds)((0, strip_ansi_1.default)(cmd.renderHelp())).trim()).to.equal((0, string_1.dedent) `
      USAGE
        garden test-command <foo> [bar] [options]

      ARGUMENTS
        [bar]  Another help text.
               [array:string]
        <foo>  Some help text.
               [array:string]

      OPTIONS
        --floop   Option help text.
                  [array:string]
      `);
        });
    });
    describe("getPaths", () => {
        it("returns the command path if not part of a group", () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
                }
            }
            const cmd = new TestCommand();
            (0, chai_1.expect)(cmd.getPaths()).to.eql([["test-command"]]);
        });
        it("returns the command path and alias if set and not part of a group", () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["some-alias"];
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
                }
            }
            const cmd = new TestCommand();
            (0, chai_1.expect)(cmd.getPaths()).to.eql([["test-command"], ["some-alias"]]);
        });
        it("returns the full command path if part of a group", () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
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
            const cmd = new TestCommand(new TestGroup());
            (0, chai_1.expect)(cmd.getPaths()).to.eql([["test-group", "test-command"]]);
        });
        it("returns the full command path if part of a group that has an alias", () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
                }
            }
            class TestGroup extends base_1.CommandGroup {
                constructor() {
                    super(...arguments);
                    this.name = "test-group";
                    this.aliases = ["group-alias"];
                    this.help = "";
                    this.subCommands = [TestCommand];
                }
            }
            const cmd = new TestCommand(new TestGroup());
            (0, chai_1.expect)(cmd.getPaths()).to.eql([
                ["test-group", "test-command"],
                ["group-alias", "test-command"],
            ]);
        });
        it("returns the full command paths including command alias if part of a group", () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["command-alias"];
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
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
            const cmd = new TestCommand(new TestGroup());
            (0, chai_1.expect)(cmd.getPaths()).to.eql([
                ["test-group", "test-command"],
                ["test-group", "command-alias"],
            ]);
        });
        it("returns all permutations with aliases if both command and group have an alias", () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["command-alias"];
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
                }
            }
            class TestGroup extends base_1.CommandGroup {
                constructor() {
                    super(...arguments);
                    this.name = "test-group";
                    this.aliases = ["group-alias"];
                    this.help = "";
                    this.subCommands = [TestCommand];
                }
            }
            const cmd = new TestCommand(new TestGroup());
            (0, chai_1.expect)(cmd.getPaths()).to.eql([
                ["test-group", "test-command"],
                ["test-group", "command-alias"],
                ["group-alias", "test-command"],
                ["group-alias", "command-alias"],
            ]);
        });
    });
});
describe("CommandGroup", () => {
    describe("getSubCommands", () => {
        it("recursively returns all sub-commands", async () => {
            class TestCommandA extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command-a";
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
                }
            }
            class TestSubgroupA extends base_1.CommandGroup {
                constructor() {
                    super(...arguments);
                    this.name = "test-group-a";
                    this.help = "";
                    this.subCommands = [TestCommandA];
                }
            }
            class TestCommandB extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command-b";
                    this.help = "";
                }
                printHeader() { }
                async action() {
                    return {};
                }
            }
            class TestSubgroupB extends base_1.CommandGroup {
                constructor() {
                    super(...arguments);
                    this.name = "test-group-b";
                    this.help = "";
                    this.subCommands = [TestCommandB];
                }
            }
            class TestGroup extends base_1.CommandGroup {
                constructor() {
                    super(...arguments);
                    this.name = "test-group";
                    this.help = "";
                    this.subCommands = [TestSubgroupA, TestSubgroupB];
                }
            }
            const group = new TestGroup();
            const commands = group.getSubCommands();
            const fullNames = commands.map((cmd) => cmd.getFullName()).sort();
            (0, chai_1.expect)(commands.length).to.equal(2);
            (0, chai_1.expect)(fullNames).to.eql(["test-group test-group-a test-command-a", "test-group test-group-b test-command-b"]);
        });
    });
    describe("renderHelp", () => {
        it("renders the command help text", async () => {
            class TestCommand extends base_1.Command {
                constructor() {
                    super(...arguments);
                    this.name = "test-command";
                    this.aliases = ["command-alias"];
                    this.help = "Some help text.";
                }
                printHeader() { }
                async action() {
                    return {};
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
            const cmd = new TestGroup();
            (0, chai_1.expect)((0, helpers_1.trimLineEnds)((0, strip_ansi_1.default)(cmd.renderHelp())).trim()).to.equal((0, string_1.dedent) `
      USAGE
        garden test-group <command> [options]

      COMMANDS
        test-group test-command  Some help text.
      `);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCwrQkFBNkI7QUFDN0Isd0RBQXFFO0FBQ3JFLHVEQUE2RDtBQUM3RCw0REFBa0M7QUFDbEMsd0RBQW9EO0FBQ3BELDhDQUErQztBQUUvQyxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtJQUN2QixRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtRQUMxQixFQUFFLENBQUMsK0JBQStCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0MsTUFBTSxXQUFZLFNBQVEsY0FBTztnQkFBakM7O29CQUNFLFNBQUksR0FBRyxjQUFjLENBQUE7b0JBQ3JCLFlBQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO29CQUN4QixTQUFJLEdBQUcsRUFBRSxDQUFBO29CQUVULGNBQVMsR0FBRzt3QkFDVixHQUFHLEVBQUUsSUFBSSx5QkFBZ0IsQ0FBQzs0QkFDeEIsSUFBSSxFQUFFLGlCQUFpQjs0QkFDdkIsUUFBUSxFQUFFLElBQUk7eUJBQ2YsQ0FBQzt3QkFDRixHQUFHLEVBQUUsSUFBSSx5QkFBZ0IsQ0FBQzs0QkFDeEIsSUFBSSxFQUFFLG9CQUFvQjt5QkFDM0IsQ0FBQztxQkFDSCxDQUFBO29CQUVELFlBQU8sR0FBRzt3QkFDUixLQUFLLEVBQUUsSUFBSSx5QkFBZ0IsQ0FBQzs0QkFDMUIsSUFBSSxFQUFFLG1CQUFtQjt5QkFDMUIsQ0FBQztxQkFDSCxDQUFBO2dCQU9ILENBQUM7Z0JBTEMsV0FBVyxLQUFJLENBQUM7Z0JBRWhCLEtBQUssQ0FBQyxNQUFNO29CQUNWLE9BQU8sRUFBRSxDQUFBO2dCQUNYLENBQUM7YUFDRjtZQUVELE1BQU0sR0FBRyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUE7WUFFN0IsSUFBQSxhQUFNLEVBQUMsSUFBQSxzQkFBWSxFQUFDLElBQUEsb0JBQVMsRUFBQyxHQUFHLENB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