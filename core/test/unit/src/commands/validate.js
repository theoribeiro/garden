"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const validate_1 = require("../../../../src/commands/validate");
const helpers_1 = require("../../../helpers");
describe("commands.validate", () => {
    it(`should successfully validate a test project`, async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const command = new validate_1.ValidateCommand();
        await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
    });
    it("should fail validating the bad-project project", async () => {
        const root = (0, helpers_1.getDataDir)("validate", "bad-project");
        await (0, helpers_1.expectError)(async () => await (0, helpers_1.makeTestGarden)(root, { noTempDir: true, noCache: true }), "configuration");
    });
    it("should fail validating the bad-module project", async () => {
        const root = (0, helpers_1.getDataDir)("validate", "bad-module");
        const garden = await (0, helpers_1.makeTestGarden)(root);
        const log = garden.log;
        const command = new validate_1.ValidateCommand();
        await (0, helpers_1.expectError)(async () => await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        }), "configuration");
    });
    it("should fail validating the bad-workflow project", async () => {
        const root = (0, helpers_1.getDataDir)("validate", "bad-workflow");
        const garden = await (0, helpers_1.makeTestGarden)(root, { noTempDir: true, noCache: true });
        const log = garden.log;
        const command = new validate_1.ValidateCommand();
        await (0, helpers_1.expectError)(async () => await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        }), "configuration");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2YWxpZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILGdFQUFtRTtBQUNuRSw4Q0FBa0g7QUFFbEgsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxFQUFFLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDM0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUN0QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ3RCLE1BQU0sT0FBTyxHQUFHLElBQUksMEJBQWUsRUFBRSxDQUFBO1FBRXJDLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNuQixNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLEdBQUc7WUFDZCxJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxJQUFBLCtCQUFxQixFQUFDLEVBQUUsQ0FBQztTQUNoQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM5RCxNQUFNLElBQUksR0FBRyxJQUFBLG9CQUFVLEVBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFBO1FBRWxELE1BQU0sSUFBQSxxQkFBVyxFQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxJQUFBLHdCQUFjLEVBQUMsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQTtJQUNoSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3RCxNQUFNLElBQUksR0FBRyxJQUFBLG9CQUFVLEVBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBQ2pELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3pDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFDdEIsTUFBTSxPQUFPLEdBQUcsSUFBSSwwQkFBZSxFQUFFLENBQUE7UUFFckMsTUFBTSxJQUFBLHFCQUFXLEVBQ2YsS0FBSyxJQUFJLEVBQUUsQ0FDVCxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDbkIsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLENBQUM7U0FDaEMsQ0FBQyxFQUNKLGVBQWUsQ0FDaEIsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQy9ELE1BQU0sSUFBSSxHQUFHLElBQUEsb0JBQVUsRUFBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUE7UUFDbkQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUM3RSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ3RCLE1BQU0sT0FBTyxHQUFHLElBQUksMEJBQWUsRUFBRSxDQUFBO1FBRXJDLE1BQU0sSUFBQSxxQkFBVyxFQUNmLEtBQUssSUFBSSxFQUFFLENBQ1QsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ25CLE1BQU07WUFDTixHQUFHO1lBQ0gsU0FBUyxFQUFFLEdBQUc7WUFDZCxTQUFTLEVBQUUsR0FBRztZQUNkLElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUMsRUFBRSxDQUFDO1NBQ2hDLENBQUMsRUFDSixlQUFlLENBQ2hCLENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=