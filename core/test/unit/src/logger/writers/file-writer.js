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
const chalk_1 = __importDefault(require("chalk"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const logger_1 = require("../../../../../src/logger/logger");
const renderers_1 = require("../../../../../src/logger/renderers");
const file_writer_1 = require("../../../../../src/logger/writers/file-writer");
const logger = (0, logger_1.getLogger)();
beforeEach(() => {
    logger["children"] = [];
});
describe("FileWriter", () => {
    describe("render", () => {
        it("should render message without ansi characters", () => {
            const entry = logger.info(chalk_1.default.red("hello"));
            (0, chai_1.expect)((0, file_writer_1.render)(logger_1.LogLevel.info, entry)).to.equal("hello");
        });
        it("should render error message if entry level is error", () => {
            const entry = logger.error("error");
            const expectedOutput = (0, strip_ansi_1.default)((0, renderers_1.renderError)(entry));
            (0, chai_1.expect)((0, file_writer_1.render)(logger_1.LogLevel.info, entry)).to.equal(expectedOutput);
        });
        it("should return null if entry level is geq to writer level", () => {
            const entry = logger.silly("silly");
            (0, chai_1.expect)((0, file_writer_1.render)(logger_1.LogLevel.info, entry)).to.equal(null);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS13cml0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmaWxlLXdyaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILCtCQUE2QjtBQUM3QixrREFBeUI7QUFDekIsNERBQWtDO0FBRWxDLDZEQUE4RTtBQUM5RSxtRUFBaUU7QUFDakUsK0VBQXNFO0FBRXRFLE1BQU0sTUFBTSxHQUFXLElBQUEsa0JBQVMsR0FBRSxDQUFBO0FBRWxDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7SUFDZCxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ3pCLENBQUMsQ0FBQyxDQUFBO0FBRUYsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFDMUIsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFDdEIsRUFBRSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtZQUM3QyxJQUFBLGFBQU0sRUFBQyxJQUFBLG9CQUFNLEVBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3hELENBQUMsQ0FBQyxDQUFBO1FBQ0YsRUFBRSxDQUFDLHFEQUFxRCxFQUFFLEdBQUcsRUFBRTtZQUM3RCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ25DLE1BQU0sY0FBYyxHQUFHLElBQUEsb0JBQVMsRUFBQyxJQUFBLHVCQUFXLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtZQUNwRCxJQUFBLGFBQU0sRUFBQyxJQUFBLG9CQUFNLEVBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQy9ELENBQUMsQ0FBQyxDQUFBO1FBQ0YsRUFBRSxDQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtZQUNsRSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ25DLElBQUEsYUFBTSxFQUFDLElBQUEsb0JBQU0sRUFBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckQsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=