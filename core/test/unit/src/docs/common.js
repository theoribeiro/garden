"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../../../src/config/common");
const joi_schema_1 = require("../../../../src/docs/joi-schema");
const common_2 = require("../../../../src/docs/common");
const chai_1 = require("chai");
describe("flattenSchema", () => {
    it("should return all keys in an object schema", async () => {
        const schema = common_1.joi.object().keys({
            a: common_1.joi.string(),
            b: common_1.joi.number(),
            c: common_1.joi.object().keys({
                c1: common_1.joi.string(),
                c2: common_1.joi.number(),
            }),
        });
        const desc = new joi_schema_1.JoiKeyDescription({
            joiDescription: schema.describe(),
            name: undefined,
            level: 0,
        });
        const result = (0, common_2.flattenSchema)(desc);
        (0, chai_1.expect)(result.length).to.equal(5);
        (0, chai_1.expect)(result[0].fullKey()).to.equal("a");
        (0, chai_1.expect)(result[1].fullKey()).to.equal("b");
        (0, chai_1.expect)(result[2].fullKey()).to.equal("c");
        (0, chai_1.expect)(result[3].fullKey()).to.equal("c.c1");
        (0, chai_1.expect)(result[4].fullKey()).to.equal("c.c2");
    });
    it("should correctly handle nested object schemas on arrays", async () => {
        const schema = common_1.joi.object().keys({
            a: common_1.joi.string(),
            b: common_1.joi.array().items(common_1.joi.object().keys({
                b1: common_1.joi.string(),
                b2: common_1.joi.number(),
            })),
        });
        const desc = new joi_schema_1.JoiKeyDescription({
            joiDescription: schema.describe(),
            name: undefined,
            level: 0,
        });
        const result = (0, common_2.flattenSchema)(desc);
        (0, chai_1.expect)(result.length).to.equal(4);
        (0, chai_1.expect)(result[0].fullKey()).to.equal("a");
        (0, chai_1.expect)(result[1].fullKey()).to.equal("b[]");
        (0, chai_1.expect)(result[2].parent).to.equal(result[1]);
        (0, chai_1.expect)(result[3].parent).to.equal(result[1]);
        (0, chai_1.expect)(result[2].fullKey()).to.equal("b[].b1");
        (0, chai_1.expect)(result[3].fullKey()).to.equal("b[].b2");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsMERBQW1FO0FBQ25FLGdFQUFtRTtBQUNuRSx3REFBMkQ7QUFDM0QsK0JBQTZCO0FBRTdCLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO0lBQzdCLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMxRCxNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQy9CLENBQUMsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFO1lBQ2YsQ0FBQyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUU7WUFDZixDQUFDLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDbkIsRUFBRSxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLEVBQUUsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFO2FBQ2pCLENBQUM7U0FDSCxDQUFDLENBQUE7UUFFRixNQUFNLElBQUksR0FBRyxJQUFJLDhCQUFpQixDQUFDO1lBQ2pDLGNBQWMsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFvQjtZQUNuRCxJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSxDQUFDO1NBQ1QsQ0FBQyxDQUFBO1FBRUYsTUFBTSxNQUFNLEdBQUcsSUFBQSxzQkFBYSxFQUFDLElBQUksQ0FBQyxDQUFBO1FBRWxDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2pDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDekMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUN6QyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ3pDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDNUMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUM5QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx5REFBeUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN2RSxNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQy9CLENBQUMsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFO1lBQ2YsQ0FBQyxFQUFFLFlBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQ2xCLFlBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUM7Z0JBQ2hCLEVBQUUsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFO2dCQUNoQixFQUFFLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTthQUNqQixDQUFDLENBQ0g7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLElBQUksR0FBRyxJQUFJLDhCQUFpQixDQUFDO1lBQ2pDLGNBQWMsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFvQjtZQUNuRCxJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSxDQUFDO1NBQ1QsQ0FBQyxDQUFBO1FBRUYsTUFBTSxNQUFNLEdBQUcsSUFBQSxzQkFBYSxFQUFDLElBQUksQ0FBQyxDQUFBO1FBRWxDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2pDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDekMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMzQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM1QyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM1QyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDaEQsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9