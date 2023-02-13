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
const minimist_1 = require("../../../../src/lib/minimist");
describe("customMinimist", () => {
    it("collects unspecified options and arguments to _unknown", () => {
        const args = ["pos-a", "pos-b", "--defined", "123", "--undefined", "foo", "--a=b"];
        const parsed = (0, minimist_1.customMinimist)(args, { string: ["defined"] });
        (0, chai_1.expect)(parsed._unknown).to.eql(["pos-a", "pos-b", "--undefined", "foo", "--a=b"]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1pc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtaW5pbWlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3QiwyREFBNkQ7QUFFN0QsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixFQUFFLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO1FBQ2hFLE1BQU0sSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDbEYsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBYyxFQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM1RCxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFBO0lBQ25GLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==