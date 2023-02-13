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
const fancy_terminal_writer_1 = require("../../../../../src/logger/writers/fancy-terminal-writer");
const logger_1 = require("../../../../../src/logger/logger");
const logger = (0, logger_1.getLogger)();
beforeEach(() => {
    logger["children"] = [];
});
describe("FancyTerminalWriter", () => {
    describe("toTerminalEntries", () => {
        const writer = new fancy_terminal_writer_1.FancyTerminalWriter();
        writer.stop();
        it("should map a LogNode into an array of entries with line numbers and spinner positions", () => {
            logger.info("1 line"); // 0
            logger.info("2 lines\n"); // 1
            logger.info("1 line"); // 3
            logger.info("3 lines\n\n"); // 4
            const spinner = logger.info({ msg: "spinner", status: "active" }); // 7
            spinner.info({ msg: "nested spinner", status: "active" }); // 8
            const terminalEntries = writer.toTerminalEntries(logger);
            const lineNumbers = terminalEntries.map((e) => e.lineNumber);
            const spinners = terminalEntries.filter((e) => !!e.spinnerCoords).map((e) => e.spinnerCoords);
            (0, chai_1.expect)(lineNumbers).to.eql([0, 1, 3, 4, 7, 8]);
            (0, chai_1.expect)(spinners).to.eql([
                [0, 7],
                [3, 8],
            ]);
        });
        it("should skip entry if entry level is geq to writer level", () => {
            logger.verbose("");
            const terminalEntries = writer.toTerminalEntries(logger);
            (0, chai_1.expect)(terminalEntries).to.eql([]);
        });
        it("should skip entry if entry is empty", () => {
            logger.placeholder();
            const terminalEntries = writer.toTerminalEntries(logger);
            (0, chai_1.expect)(terminalEntries).to.eql([]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFuY3ktdGVybWluYWwtd3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmFuY3ktdGVybWluYWwtd3JpdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBRTdCLG1HQUE2RjtBQUM3Riw2REFBb0U7QUFFcEUsTUFBTSxNQUFNLEdBQVcsSUFBQSxrQkFBUyxHQUFFLENBQUE7QUFFbEMsVUFBVSxDQUFDLEdBQUcsRUFBRTtJQUNkLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDekIsQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO0lBQ25DLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBbUIsRUFBRSxDQUFBO1FBQ3hDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNiLEVBQUUsQ0FBQyx1RkFBdUYsRUFBRSxHQUFHLEVBQUU7WUFDL0YsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDL0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUEsQ0FBQyxJQUFJO1lBQ3RFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUEsQ0FBQyxJQUFJO1lBQzlELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUN4RCxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDNUQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQTtZQUM3RixJQUFBLGFBQU0sRUFBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQzlDLElBQUEsYUFBTSxFQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDTixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDUCxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7WUFDakUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNsQixNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDeEQsSUFBQSxhQUFNLEVBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNwQyxDQUFDLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7WUFDN0MsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBQ3BCLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUN4RCxJQUFBLGFBQU0sRUFBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3BDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9