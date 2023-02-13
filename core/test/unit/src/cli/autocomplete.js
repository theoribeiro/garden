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
const autocomplete_1 = require("../../../../src/cli/autocomplete");
const params_1 = require("../../../../src/cli/params");
const build_1 = require("../../../../src/commands/build");
const commands_1 = require("../../../../src/commands/commands");
const helpers_1 = require("../../../helpers");
describe("Autocompleter", () => {
    let garden;
    let configDump;
    let ac;
    const globalFlags = Object.keys(params_1.globalOptions);
    const buildFlags = Object.keys(new build_1.BuildCommand().options);
    const flags = [...globalFlags, ...buildFlags].map((f) => "--" + f);
    const commands = (0, commands_1.getBuiltinCommands)();
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        configDump = await garden.dumpConfig({ log: garden.log });
        ac = new autocomplete_1.Autocompleter({ log: garden.log, commands, debug: true });
    });
    it("suggests nothing with empty input", () => {
        const result = ac.getSuggestions("");
        (0, chai_1.expect)(result).to.eql([]);
    });
    it("suggests nothing with all-space input", () => {
        const result = ac.getSuggestions("  ");
        (0, chai_1.expect)(result).to.eql([]);
    });
    it("returns one command on close match", () => {
        const result = ac.getSuggestions("buil");
        (0, chai_1.expect)(result.length).to.equal(1);
        (0, chai_1.expect)(result[0]).to.eql({
            type: "command",
            line: "build",
            command: ["build"],
            priority: 1,
        });
    });
    it("returns many command names including subcommands with short input", () => {
        const result = ac.getSuggestions("lo");
        // Not testing for the ordering here, easiest to sort alphabetically
        (0, chai_1.expect)(result.map((s) => s.line).sort()).to.eql(["login", "logout", "logs"]);
    });
    it("returns command names sorted by length", () => {
        const result = ac.getSuggestions("lo");
        // Not testing for the ordering here, easiest to sort alphabetically
        (0, chai_1.expect)(result.map((s) => s.line)).to.eql(["logs", "login", "logout"]);
    });
    it("returns subcommands when matching on command group", () => {
        const result = ac.getSuggestions("link");
        (0, chai_1.expect)(result.map((s) => s.line).sort()).to.eql(["link module", "link source"]);
    });
    it("filters option flags", () => {
        const result = ac.getSuggestions("build --f");
        const lines = result.map((s) => s.line);
        (0, chai_1.expect)(lines).to.eql(["build --force", "build --force-refresh"]);
    });
    context("without config dump", () => {
        it("returns option flags after matched command", () => {
            const result = ac.getSuggestions("build");
            const lines = result.map((s) => s.line);
            for (const s of flags) {
                (0, chai_1.expect)(lines).to.include("build " + s);
            }
        });
        it("skips global option flags when ignoreGlobalFlags=true", () => {
            const result = ac.getSuggestions("build");
            const lines = result.map((s) => s.line);
            for (const s of buildFlags.map((f) => "--" + f)) {
                (0, chai_1.expect)(lines).to.include("build " + s);
            }
        });
    });
    context("with config dump", () => {
        beforeEach(() => {
            ac = new autocomplete_1.Autocompleter({ log: garden.log, commands, configDump, debug: true });
        });
        it("returns suggested positional args and option flags after matched command", () => {
            const result = ac.getSuggestions("build");
            const lines = result.map((s) => s.line);
            for (const s of [...flags, ...Object.keys(configDump.actionConfigs.Build)]) {
                (0, chai_1.expect)(lines).to.include("build " + s);
            }
        });
        it("ranks positional args above option flags", () => {
            const result = ac.getSuggestions("build");
            const lines = result.map((s) => s.line);
            (0, chai_1.expect)(lines[0]).to.equal("build module-a");
            (0, chai_1.expect)(lines[1]).to.equal("build module-b");
            (0, chai_1.expect)(lines[2]).to.equal("build module-c");
            (0, chai_1.expect)(lines[3].startsWith("build --")).to.be.true;
        });
        it("returns suggested positional args and option flags after matched command and space", () => {
            const result = ac.getSuggestions("build ");
            const lines = result.map((s) => s.line);
            for (const s of [...flags, ...Object.keys(configDump.actionConfigs.Build)]) {
                (0, chai_1.expect)(lines).to.include("build " + s);
            }
        });
        it("returns nothing if typing a positional argument that matches no suggested value", () => {
            const result = ac.getSuggestions("build z");
            (0, chai_1.expect)(result).to.eql([]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXV0b2NvbXBsZXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLG1FQUFnRTtBQUNoRSx1REFBMEQ7QUFDMUQsMERBQTZEO0FBQzdELGdFQUFzRTtBQUV0RSw4Q0FBOEQ7QUFFOUQsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksVUFBc0IsQ0FBQTtJQUMxQixJQUFJLEVBQWlCLENBQUE7SUFFckIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxzQkFBYSxDQUFDLENBQUE7SUFDOUMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUMxRCxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsV0FBVyxFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFFbEUsTUFBTSxRQUFRLEdBQUcsSUFBQSw2QkFBa0IsR0FBRSxDQUFBO0lBRXJDLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQixNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUNoQyxVQUFVLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO1FBQ3pELEVBQUUsR0FBRyxJQUFJLDRCQUFhLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDcEUsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENB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