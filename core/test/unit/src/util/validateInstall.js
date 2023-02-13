"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const testing_1 = require("../../../../src/util/testing");
const validateInstall_1 = require("../../../../src/util/validateInstall");
const vcs_1 = require("../../../../src/vcs/vcs");
(0, mocha_1.describe)("validateInstall", () => {
    it("should validate a binary version", async () => {
        await (0, validateInstall_1.validateInstall)({
            minVersion: "1.0.0",
            name: "git",
            versionCommand: { cmd: "git", args: ["--version"] },
            versionRegex: vcs_1.gitVersionRegex,
        });
    });
    it("should throw if a version is too old", async () => {
        await (0, testing_1.expectError)(() => (0, validateInstall_1.validateInstall)({
            minVersion: "100.0.0",
            name: "git",
            versionCommand: { cmd: "git", args: ["--version"] },
            versionRegex: vcs_1.gitVersionRegex,
        }), { contains: "version is too old" });
    });
    it("should throw if binary is not installed", async () => {
        await (0, testing_1.expectError)(() => (0, validateInstall_1.validateInstall)({
            minVersion: "1.0.0",
            name: "non existing thing",
            versionCommand: { cmd: "this-binary-does-not-exist", args: ["--version"] },
            versionRegex: vcs_1.gitVersionRegex,
        }), { contains: "is installed and on your PATH" });
    });
    it("should include name in error message", async () => {
        await (0, testing_1.expectError)(() => (0, validateInstall_1.validateInstall)({
            minVersion: "1.0.0",
            name: "name-of-the-thing",
            versionCommand: { cmd: "this-binary-does-not-exist", args: ["--version"] },
            versionRegex: vcs_1.gitVersionRegex,
        }), { contains: "Could not find name-of-the-thing binary." });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGVJbnN0YWxsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmFsaWRhdGVJbnN0YWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBR0gsaUNBQWdDO0FBQ2hDLDBEQUEwRDtBQUMxRCwwRUFBc0U7QUFDdEUsaURBQXlEO0FBRXpELElBQUEsZ0JBQVEsRUFBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2hELE1BQU0sSUFBQSxpQ0FBZSxFQUFDO1lBQ3BCLFVBQVUsRUFBRSxPQUFPO1lBQ25CLElBQUksRUFBRSxLQUFLO1lBQ1gsY0FBYyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNuRCxZQUFZLEVBQUUscUJBQWU7U0FDOUIsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFDRixFQUFFLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDcEQsTUFBTSxJQUFBLHFCQUFXLEVBQ2YsR0FBRyxFQUFFLENBQ0gsSUFBQSxpQ0FBZSxFQUFDO1lBQ2QsVUFBVSxFQUFFLFNBQVM7WUFDckIsSUFBSSxFQUFFLEtBQUs7WUFDWCxjQUFjLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ25ELFlBQVksRUFBRSxxQkFBZTtTQUM5QixDQUFDLEVBQ0osRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsQ0FDbkMsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0YsRUFBRSxDQUFDLHlDQUF5QyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3ZELE1BQU0sSUFBQSxxQkFBVyxFQUNmLEdBQUcsRUFBRSxDQUNILElBQUEsaUNBQWUsRUFBQztZQUNkLFVBQVUsRUFBRSxPQUFPO1lBQ25CLElBQUksRUFBRSxvQkFBb0I7WUFDMUIsY0FBYyxFQUFFLEVBQUUsR0FBRyxFQUFFLDRCQUE0QixFQUFFLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzFFLFlBQVksRUFBRSxxQkFBZTtTQUM5QixDQUFDLEVBQ0osRUFBRSxRQUFRLEVBQUUsK0JBQStCLEVBQUUsQ0FDOUMsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0YsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3BELE1BQU0sSUFBQSxxQkFBVyxFQUNmLEdBQUcsRUFBRSxDQUNILElBQUEsaUNBQWUsRUFBQztZQUNkLFVBQVUsRUFBRSxPQUFPO1lBQ25CLElBQUksRUFBRSxtQkFBbUI7WUFDekIsY0FBYyxFQUFFLEVBQUUsR0FBRyxFQUFFLDRCQUE0QixFQUFFLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzFFLFlBQVksRUFBRSxxQkFBZTtTQUM5QixDQUFDLEVBQ0osRUFBRSxRQUFRLEVBQUUsMENBQTBDLEVBQUUsQ0FDekQsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==