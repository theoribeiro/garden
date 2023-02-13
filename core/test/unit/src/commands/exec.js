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
const exec_1 = require("../../../../src/commands/exec");
const helpers_1 = require("../../../helpers");
describe("ExecCommand", () => {
    const command = new exec_1.ExecCommand();
    it("should exec a command in a running service", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const args = { deploy: "service-a", command: "echo ok" };
        command.printHeader({ headerLog: log, args });
        const { result, errors } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args,
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                interactive: false,
            }),
        });
        if (errors) {
            throw errors[0];
        }
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.output).to.equal("Ran command: echo ok");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4ZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0Isd0RBQTJEO0FBQzNELDhDQUF5RTtBQUV6RSxRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixNQUFNLE9BQU8sR0FBRyxJQUFJLGtCQUFXLEVBQUUsQ0FBQTtJQUVqQyxFQUFFLENBQUMsNENBQTRDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDMUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUN0QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBRXRCLE1BQU0sSUFBSSxHQUFHLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUE7UUFFeEQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUU3QyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QyxNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLEdBQUc7WUFDZCxJQUFJO1lBQ0osSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUM7Z0JBQzFCLFdBQVcsRUFBRSxLQUFLO2FBQ25CLENBQUM7U0FDSCxDQUFDLENBQUE7UUFFRixJQUFJLE1BQU0sRUFBRTtZQUNWLE1BQU0sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ2hCO1FBRUQsSUFBQSxhQUFNLEVBQUMsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtJQUN6RCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=