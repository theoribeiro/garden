"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const enumerate_1 = require("../../../../src/util/enumerate");
const chai_1 = require("chai");
describe("enumerate", () => {
    const list = ["a", "b", "c"];
    it("counts from 0 if no start parameter defined", () => {
        const enumeratedArray = Array.from((0, enumerate_1.enumerate)(list));
        (0, chai_1.expect)(enumeratedArray).to.deep.equal([
            [0, "a"],
            [1, "b"],
            [2, "c"],
        ]);
    });
    it("counts from custom start value if it's defined", () => {
        const start = 5;
        let counter = start;
        const enumeratedArray = Array.from((0, enumerate_1.enumerate)(list, start));
        (0, chai_1.expect)(enumeratedArray).to.deep.equal([
            [counter++, "a"],
            [counter++, "b"],
            [counter, "c"],
        ]);
    });
    it("returns empty array for empty input", () => {
        const enumeratedArray = Array.from((0, enumerate_1.enumerate)([]));
        (0, chai_1.expect)(enumeratedArray).to.deep.equal([]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bWVyYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW51bWVyYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsOERBQTBEO0FBQzFELCtCQUE2QjtBQUU3QixRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtJQUN6QixNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDNUIsRUFBRSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtRQUNyRCxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEscUJBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBQ25ELElBQUEsYUFBTSxFQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztZQUNSLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztZQUNSLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztTQUNULENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtRQUN4RCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUE7UUFDZixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUE7UUFDbkIsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLHFCQUFTLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDMUQsSUFBQSxhQUFNLEVBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDcEMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUM7WUFDaEIsQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUM7WUFDaEIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDO1NBQ2YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBQzdDLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBQSxxQkFBUyxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDakQsSUFBQSxhQUFNLEVBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDM0MsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9