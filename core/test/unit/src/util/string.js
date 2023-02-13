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
const string_1 = require("../../../../src/util/string");
describe("tailString", () => {
    it("should return string unchanged if it's shorter than maxLength", () => {
        const str = "123456789";
        (0, chai_1.expect)((0, string_1.tailString)(str, 10)).to.equal(str);
    });
    it("should trim off first bytes if string is longer than maxLength", () => {
        const str = "1234567890";
        (0, chai_1.expect)((0, string_1.tailString)(str, 5)).to.equal("67890");
    });
    it("should trim until next newline if string is longer than maxLength and nextLine=true", () => {
        const str = "1234567\n890";
        (0, chai_1.expect)((0, string_1.tailString)(str, 5, true)).to.equal("890");
    });
    it("should trim the last line if it is longer than maxLength and nextLine=true", () => {
        const str = "123\n4567890";
        (0, chai_1.expect)((0, string_1.tailString)(str, 5, true)).to.equal("67890");
    });
});
describe("stripQuotes", () => {
    it("should strip double quotes from string", () => {
        (0, chai_1.expect)((0, string_1.stripQuotes)('"test"')).to.equal("test");
    });
    it("should strip single quotes from string", () => {
        (0, chai_1.expect)((0, string_1.stripQuotes)("'test'")).to.equal("test");
    });
    it("should pass through unquoted string", () => {
        (0, chai_1.expect)((0, string_1.stripQuotes)("test")).to.equal("test");
    });
    it("should not strip mismatched quotes", () => {
        (0, chai_1.expect)((0, string_1.stripQuotes)("'test\"")).to.equal("'test\"");
        (0, chai_1.expect)((0, string_1.stripQuotes)("\"test'")).to.equal("\"test'");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RyaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHdEQUFxRTtBQUVyRSxRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtJQUMxQixFQUFFLENBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO1FBQ3ZFLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQTtRQUN2QixJQUFBLGFBQU0sRUFBQyxJQUFBLG1CQUFVLEVBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUMzQyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7UUFDeEUsTUFBTSxHQUFHLEdBQUcsWUFBWSxDQUFBO1FBQ3hCLElBQUEsYUFBTSxFQUFDLElBQUEsbUJBQVUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzlDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHFGQUFxRixFQUFFLEdBQUcsRUFBRTtRQUM3RixNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUE7UUFDMUIsSUFBQSxhQUFNLEVBQUMsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ2xELENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDRFQUE0RSxFQUFFLEdBQUcsRUFBRTtRQUNwRixNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUE7UUFDMUIsSUFBQSxhQUFNLEVBQUMsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3BELENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixFQUFFLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1FBQ2hELElBQUEsYUFBTSxFQUFDLElBQUEsb0JBQVcsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDaEQsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1FBQ2hELElBQUEsYUFBTSxFQUFDLElBQUEsb0JBQVcsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDaEQsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBQzdDLElBQUEsYUFBTSxFQUFDLElBQUEsb0JBQVcsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDOUMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO1FBQzVDLElBQUEsYUFBTSxFQUFDLElBQUEsb0JBQVcsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDbEQsSUFBQSxhQUFNLEVBQUMsSUFBQSxvQkFBVyxFQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUNwRCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=