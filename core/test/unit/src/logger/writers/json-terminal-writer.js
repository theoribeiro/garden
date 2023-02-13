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
const json_terminal_writer_1 = require("../../../../../src/logger/writers/json-terminal-writer");
const logger_1 = require("../../../../../src/logger/logger");
const helpers_1 = require("../../../../helpers");
const logger = (0, logger_1.getLogger)();
beforeEach(() => {
    logger["children"] = [];
});
describe("JsonTerminalWriter", () => {
    describe("render", () => {
        it("should return a JSON-formatted message if level is geq than entry level", () => {
            const now = (0, helpers_1.freezeTime)();
            const writer = new json_terminal_writer_1.JsonTerminalWriter();
            const entry = logger.info("hello logger");
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql(`{"msg":"hello logger","section":"","timestamp":"${now.toISOString()}","level":"info","allSections":[]}`);
        });
        it("should chain messages with 'append' set to true", () => {
            const now = (0, helpers_1.freezeTime)();
            const writer = new json_terminal_writer_1.JsonTerminalWriter();
            const entry = logger.info("hello logger");
            entry.info({ msg: "hello again", append: true });
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql(`{"msg":"hello logger - hello again","section":"","timestamp":"${now.toISOString()}","level":"info","allSections":[]}`);
        });
        it("should return null if message is an empty string", () => {
            const writer = new json_terminal_writer_1.JsonTerminalWriter();
            const entry = logger.info("");
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql(null);
        });
        it("should return null if entry is empty", () => {
            const writer = new json_terminal_writer_1.JsonTerminalWriter();
            const entry = logger.placeholder();
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql(null);
        });
        it("should return null if entry level is geq to writer level", () => {
            const writer = new json_terminal_writer_1.JsonTerminalWriter();
            const entry = logger.verbose("abc");
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql(null);
        });
        it("should render valid JSON if input message is a JSON string", () => {
            const now = (0, helpers_1.freezeTime)();
            const writer = new json_terminal_writer_1.JsonTerminalWriter();
            const entry = logger.info(JSON.stringify({ message: "foo" }));
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql(`{"msg":"{\\"message\\":\\"foo\\"}","section":"","timestamp":"${now.toISOString()}","level":"info","allSections":[]}`);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi10ZXJtaW5hbC13cml0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJqc29uLXRlcm1pbmFsLXdyaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUU3QixpR0FBMkY7QUFDM0YsNkRBQW9FO0FBQ3BFLGlEQUFnRDtBQUVoRCxNQUFNLE1BQU0sR0FBVyxJQUFBLGtCQUFTLEdBQUUsQ0FBQTtBQUVsQyxVQUFVLENBQUMsR0FBRyxFQUFFO0lBQ2QsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUN6QixDQUFDLENBQUMsQ0FBQTtBQUVGLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFDdEIsRUFBRSxDQUFDLHlFQUF5RSxFQUFFLEdBQUcsRUFBRTtZQUNqRixNQUFNLEdBQUcsR0FBRyxJQUFBLG9CQUFVLEdBQUUsQ0FBQTtZQUN4QixNQUFNLE1BQU0sR0FBRyxJQUFJLHlDQUFrQixFQUFFLENBQUE7WUFDdkMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTtZQUN6QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUN4QyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUNoQixtREFBbUQsR0FBRyxDQUFDLFdBQVcsRUFBRSxvQ0FBb0MsQ0FDekcsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtZQUN6RCxNQUFNLEdBQUcsR0FBRyxJQUFBLG9CQUFVLEdBQUUsQ0FBQTtZQUN4QixNQUFNLE1BQU0sR0FBRyxJQUFJLHlDQUFrQixFQUFFLENBQUE7WUFDdkMsTUFBTSxLQUFLLEdB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