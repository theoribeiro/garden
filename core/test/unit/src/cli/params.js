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
const params_1 = require("../../../../src/cli/params");
describe("StringsParameter", () => {
    const param = new params_1.StringsParameter({ help: "" });
    it("should by default split on a comma", () => {
        (0, chai_1.expect)(param.coerce("service-a,service-b")).to.eql(["service-a", "service-b"]);
    });
    it("should not split on commas within double-quoted strings", () => {
        (0, chai_1.expect)(param.coerce('key-a="comma,in,value",key-b=foo,key-c=bar')).to.eql([
            'key-a="comma,in,value"',
            "key-b=foo",
            "key-c=bar",
        ]);
    });
    it("should handle multiple input values", () => {
        (0, chai_1.expect)(param.coerce(["service-a", "service-b"])).to.eql(["service-a", "service-b"]);
    });
    it("should split on delimiter for each input value", () => {
        (0, chai_1.expect)(param.coerce(["service-a", "service-b,service-c"])).to.eql(["service-a", "service-b", "service-c"]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGFyYW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHVEQUE2RDtBQUU3RCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLE1BQU0sS0FBSyxHQUFHLElBQUkseUJBQWdCLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUVoRCxFQUFFLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO1FBQzVDLElBQUEsYUFBTSxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQTtJQUNoRixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7UUFDakUsSUFBQSxhQUFNLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUN4RSx3QkFBd0I7WUFDeEIsV0FBVztZQUNYLFdBQVc7U0FDWixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFDN0MsSUFBQSxhQUFNLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFBO0lBQ3JGLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtRQUN4RCxJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUE7SUFDNUcsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9