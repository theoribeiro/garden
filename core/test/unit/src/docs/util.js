"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("../../../../src/util/string");
const chai_1 = require("chai");
const common_1 = require("../../../../src/docs/common");
describe("convertMarkdownLinks", () => {
    it("should convert all markdown links in the given text to plain links", () => {
        const text = (0, string_1.dedent) `
    For a full reference, see the [Output configuration context](https://docs.garden.io/reference/template-strings/project-outputs) section in the Template String Reference.

    See the [Configuration Files guide](https://docs.garden.io/using-garden/configuration-overview#including-excluding-files-and-directories) for details.
    `;
        (0, chai_1.expect)((0, common_1.convertMarkdownLinks)(text)).to.equal((0, string_1.dedent) `
    For a full reference, see the Output configuration context (https://docs.garden.io/reference/template-strings/project-outputs) section in the Template String Reference.

    See the Configuration Files guide (https://docs.garden.io/using-garden/configuration-overview#including-excluding-files-and-directories) for details.
    `);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCx3REFBb0Q7QUFDcEQsK0JBQTZCO0FBQzdCLHdEQUFrRTtBQUVsRSxRQUFRLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO0lBQ3BDLEVBQUUsQ0FBQyxvRUFBb0UsRUFBRSxHQUFHLEVBQUU7UUFDNUUsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFNLEVBQUE7Ozs7S0FJbEIsQ0FBQTtRQUVELElBQUEsYUFBTSxFQUFDLElBQUEsNkJBQW9CLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUEsZUFBTSxFQUFBOzs7O0tBSWpELENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==