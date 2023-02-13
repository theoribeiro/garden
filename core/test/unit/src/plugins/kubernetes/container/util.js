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
const util_1 = require("../../../../../../src/plugins/kubernetes/container/util");
describe("getResourceRequirements", () => {
    it("should return resources", () => {
        (0, chai_1.expect)((0, util_1.getResourceRequirements)({ cpu: { max: 1, min: 1 }, memory: { max: 1, min: 1 } })).to.eql({
            requests: {
                cpu: "1m",
                memory: "1Mi",
            },
            limits: {
                cpu: "1m",
                memory: "1Mi",
            },
        });
    });
    it("should return resources without limits if max values are null", () => {
        (0, chai_1.expect)((0, util_1.getResourceRequirements)({ cpu: { max: null, min: 1 }, memory: { max: null, min: 1 } })).to.eql({
            requests: {
                cpu: "1m",
                memory: "1Mi",
            },
        });
    });
    it("should return resources with one limit if one max value is set", () => {
        (0, chai_1.expect)((0, util_1.getResourceRequirements)({ cpu: { max: 1, min: 1 }, memory: { max: null, min: 1 } })).to.eql({
            requests: {
                cpu: "1m",
                memory: "1Mi",
            },
            limits: {
                cpu: "1m",
            },
        });
    });
    it("should prioritize deprecated limits param", () => {
        (0, chai_1.expect)((0, util_1.getResourceRequirements)({ cpu: { max: 1, min: 1 }, memory: { max: null, min: 1 } }, { cpu: 50, memory: 50 })).to.eql({
            requests: {
                cpu: "1m",
                memory: "1Mi",
            },
            limits: {
                cpu: "50m",
                memory: "50Mi",
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0Isa0ZBQWlHO0FBRWpHLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7SUFDdkMsRUFBRSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUNqQyxJQUFBLGFBQU0sRUFBQyxJQUFBLDhCQUF1QixFQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUM5RixRQUFRLEVBQUU7Z0JBQ1IsR0FBRyxFQUFFLElBQUk7Z0JBQ1QsTUFBTSxFQUFFLEtBQUs7YUFDZDtZQUNELE1BQU0sRUFBRTtnQkFDTixHQUFHLEVBQUUsSUFBSTtnQkFDVCxNQUFNLEVBQUUsS0FBSzthQUNkO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO1FBQ3ZFLElBQUEsYUFBTSxFQUFDLElBQUEsOEJBQXVCLEVBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ3BHLFFBQVEsRUFBRTtnQkFDUixHQUFHLEVBQUUsSUFBSTtnQkFDVCxNQUFNLEVBQUUsS0FBSzthQUNkO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsZ0VBQWdFLEVBQUUsR0FBRyxFQUFFO1FBQ3hFLElBQUEsYUFBTSxFQUFDLElBQUEsOEJBQXVCLEVBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ2pHLFFBQVEsRUFBRTtnQkFDUixHQUFHLEVBQUUsSUFBSTtnQkFDVCxNQUFNLEVBQUUsS0FBSzthQUNkO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLEdBQUcsRUFBRSxJQUFJO2FBQ1Y7U0FDRixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7UUFDbkQsSUFBQSxhQUFNLEVBQ0osSUFBQSw4QkFBdUIsRUFBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUM3RyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDUCxRQUFRLEVBQUU7Z0JBQ1IsR0FBRyxFQUFFLElBQUk7Z0JBQ1QsTUFBTSxFQUFFLEtBQUs7YUFDZDtZQUNELE1BQU0sRUFBRTtnQkFDTixHQUFHLEVBQUUsS0FBSztnQkFDVixNQUFNLEVBQUUsTUFBTTthQUNmO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9