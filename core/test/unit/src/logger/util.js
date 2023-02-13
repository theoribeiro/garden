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
const util_1 = require("../../../../src/logger/util");
describe("util", () => {
    describe("getChildNodes", () => {
        it("should convert an n-ary tree into an ordered list of child nodes (skipping the root)", () => {
            const graph = {
                children: [
                    {
                        children: [
                            {
                                children: [{ children: [], id: 3 }],
                                id: 2,
                            },
                            { children: [], id: 4 },
                            { children: [], id: 5 },
                        ],
                        id: 1,
                    },
                    {
                        children: [],
                        id: 6,
                    },
                ],
                id: 0,
            };
            const nodeList = (0, util_1.getChildNodes)(graph);
            (0, chai_1.expect)(nodeList.map((n) => n.id)).to.eql([1, 2, 3, 4, 5, 6]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFFN0Isc0RBQTJEO0FBRTNELFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO0lBQ3BCLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQzdCLEVBQUUsQ0FBQyxzRkFBc0YsRUFBRSxHQUFHLEVBQUU7WUFLOUYsTUFBTSxLQUFLLEdBQUc7Z0JBQ1osUUFBUSxFQUFFO29CQUNSO3dCQUNFLFFBQVEsRUFBRTs0QkFDUjtnQ0FDRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dDQUNuQyxFQUFFLEVBQUUsQ0FBQzs2QkFDTjs0QkFDRCxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTs0QkFDdkIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7eUJBQ3hCO3dCQUNELEVBQUUsRUFBRSxDQUFDO3FCQUNOO29CQUNEO3dCQUNFLFFBQVEsRUFBRSxFQUFFO3dCQUNaLEVBQUUsRUFBRSxDQUFDO3FCQUNOO2lCQUNGO2dCQUNELEVBQUUsRUFBRSxDQUFDO2FBQ04sQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUFHLElBQUEsb0JBQWEsRUFBcUIsS0FBSyxDQUFDLENBQUE7WUFDekQsSUFBQSxhQUFNLEVBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM5RCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==