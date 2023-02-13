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
const service_1 = require("../../../../src/config/service");
const validation_1 = require("../../../../src/config/validation");
describe("baseServiceSpecSchema", () => {
    it("should filter falsy values from dependencies list", () => {
        const input = {
            name: "foo",
            dependencies: ["service-a", undefined, "service-b", null, "service-c"],
        };
        const output = (0, validation_1.validateSchema)(input, (0, service_1.baseServiceSpecSchema)());
        (0, chai_1.expect)(output.dependencies).to.eql(["service-a", "service-b", "service-c"]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsNERBQXNFO0FBQ3RFLGtFQUFrRTtBQUVsRSxRQUFRLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO0lBQ3JDLEVBQUUsQ0FBQyxtREFBbUQsRUFBRSxHQUFHLEVBQUU7UUFDM0QsTUFBTSxLQUFLLEdBQUc7WUFDWixJQUFJLEVBQUUsS0FBSztZQUNYLFlBQVksRUFBRSxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUM7U0FDdkUsQ0FBQTtRQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWMsRUFBQyxLQUFLLEVBQUUsSUFBQSwrQkFBcUIsR0FBRSxDQUFDLENBQUE7UUFDN0QsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUE7SUFDN0UsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9