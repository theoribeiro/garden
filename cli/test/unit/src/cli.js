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
const lodash_1 = require("lodash");
const path_1 = require("path");
const cli_1 = require("../../../src/cli");
const helpers_1 = require("../../helpers");
const cli_2 = require("@garden-io/core/build/src/cli/cli");
const helpers_2 = require("@garden-io/core/build/test/helpers");
const base_1 = require("@garden-io/core/build/src/commands/base");
const string_1 = require("@garden-io/core/build/src/util/string");
const global_1 = require("@garden-io/core/src/config-store/global");
describe("runCli", () => {
    const globalConfigStore = new global_1.GlobalConfigStore();
    it("should add bundled plugins", async () => {
        var _a, _b;
        const projectRoot = (0, path_1.resolve)(helpers_1.testRoot, "test-projects", "bundled-projects");
        const { cli, result } = await (0, cli_1.runCli)({ args: ["tools", "--root", projectRoot], exitOnError: false });
        (0, chai_1.expect)(cli["plugins"].map((p) => p.name)).to.eql((0, cli_1.getBundledPlugins)().map((p) => p.name));
        const conftestTool = (_b = (_a = result === null || result === void 0 ? void 0 : result.result) === null || _a === void 0 ? void 0 : _a.tools) === null || _b === void 0 ? void 0 : _b.find((t) => t.pluginName === "conftest");
        (0, chai_1.expect)(conftestTool).to.exist;
    });
    it("should register a GardenProcess entry and pass to cli.run()", (done) => {
        class TestCommand extends base_1.Command {
            constructor() {
                super(...arguments);
                this.name = (0, string_1.randomString)(10);
                this.help = "halp!";
            }
            printHeader() { }
            async action({}) {
                const allProcesses = Object.values(await globalConfigStore.get("activeProcesses"));
                const record = (0, lodash_1.find)(allProcesses, (p) => p.command);
                if (record) {
                    done();
                }
                else {
                    done("Couldn't find process record");
                }
                return { result: {} };
            }
        }
        const cli = new cli_2.GardenCli();
        const cmd = new TestCommand();
        cli.addCommand(cmd);
        (0, cli_1.runCli)({ args: [cmd.name, "--root", helpers_2.projectRootA], cli }).catch(done);
    });
    it("should clean up the GardenProcess entry on exit", async () => {
        class TestCommand extends base_1.Command {
            constructor() {
                super(...arguments);
                this.name = (0, string_1.randomString)(10);
                this.help = "halp!";
            }
            printHeader() { }
            async action({}) {
                return { result: {} };
            }
        }
        const cli = new cli_2.GardenCli();
        const cmd = new TestCommand();
        cli.addCommand(cmd);
        await (0, cli_1.runCli)({ args: [cmd.name, "--root", helpers_2.projectRootA], cli });
        const allProcesses = Object.values(await globalConfigStore.get("activeProcesses"));
        const record = (0, lodash_1.find)(allProcesses, (p) => p.command);
        (0, chai_1.expect)(record).to.be.undefined;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLG1DQUE2QjtBQUM3QiwrQkFBOEI7QUFFOUIsMENBQTREO0FBQzVELDJDQUF3QztBQUV4QywyREFBNkQ7QUFDN0QsZ0VBQWlFO0FBQ2pFLGtFQUFnRjtBQUNoRixrRUFBb0U7QUFDcEUsb0VBQTJFO0FBRTNFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO0lBQ3RCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSwwQkFBaUIsRUFBRSxDQUFBO0lBRWpELEVBQUUsQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLElBQUksRUFBRTs7UUFDMUMsTUFBTSxXQUFXLEdBQUcsSUFBQSxjQUFPLEVBQUMsa0JBQVEsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtRQUMxRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBQSxZQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBRXBHLElBQUEsYUFBTSxFQUFDLEdBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBQSx1QkFBaUIsR0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFFekYsTUFBTSxZQUFZLEdBQUcsTUFBQSxNQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxNQUFNLDBDQUFFLEtBQUssMENBQUUsSUFBSSxDQUFDLENBQUMsQ0FB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