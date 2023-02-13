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
const basic_terminal_writer_1 = require("../../../../../src/logger/writers/basic-terminal-writer");
const logger_1 = require("../../../../../src/logger/logger");
const renderers_1 = require("../../../../../src/logger/renderers");
const logger = (0, logger_1.getLogger)();
beforeEach(() => {
    logger["children"] = [];
});
describe("BasicTerminalWriter", () => {
    describe("render", () => {
        it("should return a formatted message if level is geq than entry level", () => {
            const writer = new basic_terminal_writer_1.BasicTerminalWriter();
            const entry = logger.info("hello logger");
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql((0, renderers_1.formatForTerminal)(entry, "basic"));
        });
        it("should return a new line if message is an empty string", () => {
            const writer = new basic_terminal_writer_1.BasicTerminalWriter();
            const entry = logger.info("");
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql("\n");
        });
        it("should return null if entry level is geq to writer level", () => {
            const writer = new basic_terminal_writer_1.BasicTerminalWriter();
            const entry = logger.verbose("abc");
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql(null);
        });
        it("should return an empty string if entry is empty", () => {
            const writer = new basic_terminal_writer_1.BasicTerminalWriter();
            const entry = logger.placeholder();
            const out = writer.render(entry, logger);
            (0, chai_1.expect)(out).to.eql("");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMtdGVybWluYWwtd3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFzaWMtdGVybWluYWwtd3JpdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBRTdCLG1HQUE2RjtBQUM3Riw2REFBb0U7QUFDcEUsbUVBQXVFO0FBRXZFLE1BQU0sTUFBTSxHQUFXLElBQUEsa0JBQVMsR0FBRSxDQUFBO0FBRWxDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7SUFDZCxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ3pCLENBQUMsQ0FBQyxDQUFBO0FBRUYsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtJQUNuQyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtRQUN0QixFQUFFLENBQUMsb0VBQW9FLEVBQUUsR0FBRyxFQUFFO1lBQzVFLE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQW1CLEVBQUUsQ0FBQTtZQUN4QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3hDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBQSw2QkFBaUIsRUFBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtRQUN2RCxDQUFDLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQyx3REFBd0QsRUFBRSxHQUFHLEVBQUU7WUFDaEUsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBbUIsRUFBRSxDQUFBO1lBQ3hDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDN0IsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDeEMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMxQixDQUFDLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQywwREFBMEQsRUFBRSxHQUFHLEVBQUU7WUFDbEUsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBbUIsRUFBRSxDQUFBO1lBQ3hDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDeEMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMxQixDQUFDLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxHQUFHLEVBQUU7WUFDekQsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBbUIsRUFBRSxDQUFBO1lBQ3hDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQTtZQUNsQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUN4QyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3hCLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9