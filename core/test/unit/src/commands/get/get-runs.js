"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../../../helpers");
const get_runs_1 = require("../../../../../src/commands/get/get-runs");
describe("GetRunsCommand", () => {
    const projectRoot = (0, helpers_1.getDataDir)("test-project-b");
    it("should run without errors when called without arguments", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        const log = garden.log;
        const command = new get_runs_1.GetRunsCommand();
        await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
    });
    it("should run without errors when called with a list of task names", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        const log = garden.log;
        const command = new get_runs_1.GetRunsCommand();
        await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { names: ["task-a"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXJ1bnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtcnVucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILGlEQUF1RjtBQUN2Rix1RUFBeUU7QUFFekUsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQTtJQUVoRCxFQUFFLENBQUMseURBQXlELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdkUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxDQUFDLENBQUE7UUFDaEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFjLEVBQUUsQ0FBQTtRQUVwQyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDbkIsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUMxQixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLENBQUM7U0FDaEMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsaUVBQWlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDL0UsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxDQUFDLENBQUE7UUFDaEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFjLEVBQUUsQ0FBQTtRQUVwQyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDbkIsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDM0IsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUMsRUFBRSxDQUFDO1NBQ2hDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==