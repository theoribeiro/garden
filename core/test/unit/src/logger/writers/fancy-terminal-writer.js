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
            const spinner = logger.info({ msg: "spinner" }); // 7
            spinner.info({ msg: "nested spinner" }); // 8
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFuY3ktdGVybWluYWwtd3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmFuY3ktdGVybWluYWwtd3JpdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBRTdCLG1HQUE2RjtBQUM3Riw2REFBb0U7QUFFcEUsTUFBTSxNQUFNLEdBQVcsSUFBQSxrQkFBUyxHQUFFLENBQUE7QUFFbEMsVUFBVSxDQUFDLEdBQUcsRUFBRTtJQUNkLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDekIsQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO0lBQ25DLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBbUIsRUFBRSxDQUFBO1FBQ3hDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNiLEVBQUUsQ0FBQyx1RkFBdUYsRUFBRSxHQUFHLEVBQUU7WUFDL0YsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDL0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFBLENBQUMsSUFBSTtZQUNwRCxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQSxDQUFDLElBQUk7WUFDNUMsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3hELE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM1RCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFBO1lBQzdGLElBQUEsYUFBTSxFQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDOUMsSUFBQSxhQUFNLEVBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNQLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBQ0YsRUFBRSxDQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtZQUNqRSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ2xCLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUN4RCxJQUFBLGFBQU0sRUFBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3BDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUE7WUFDcEIsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3hELElBQUEsYUFBTSxFQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDcEMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=