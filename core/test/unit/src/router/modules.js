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
const _helpers_1 = require("./_helpers");
describe("module actions", () => {
    let garden;
    let actionRouter;
    let log;
    before(async () => {
        const data = await (0, _helpers_1.getRouterTestData)();
        garden = data.garden;
        actionRouter = data.actionRouter;
        log = data.log;
    });
    describe("configureModule", () => {
        it("should consolidate the declared build dependencies", async () => {
            const moduleConfigA = (await garden.getRawModuleConfigs(["module-a"]))[0];
            const moduleConfig = {
                ...moduleConfigA,
                build: {
                    dependencies: [
                        { name: "module-b", copy: [{ source: "1", target: "1" }] },
                        { name: "module-b", copy: [{ source: "2", target: "2" }] },
                        { name: "module-b", copy: [{ source: "2", target: "2" }] },
                        { name: "module-c", copy: [{ source: "3", target: "3" }] },
                    ],
                },
            };
            const result = await actionRouter.module.configureModule({ log, moduleConfig });
            (0, chai_1.expect)(result.moduleConfig.build.dependencies).to.eql([
                {
                    name: "module-b",
                    copy: [
                        { source: "1", target: "1" },
                        { source: "2", target: "2" },
                    ],
                },
                {
                    name: "module-c",
                    copy: [{ source: "3", target: "3" }],
                },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZHVsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFJN0IseUNBQThDO0FBRTlDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7SUFDOUIsSUFBSSxNQUFrQixDQUFBO0lBQ3RCLElBQUksWUFBMEIsQ0FBQTtJQUM5QixJQUFJLEdBQWEsQ0FBQTtJQUVqQixNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLDRCQUFpQixHQUFFLENBQUE7UUFDdEMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDcEIsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUE7UUFDaEMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7SUFDaEIsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBQy9CLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRSxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRXpFLE1BQU0sWUFBWSxHQUFHO2dCQUNuQixHQUFHLGFBQWE7Z0JBQ2hCLEtBQUssRUFBRTtvQkFDTCxZQUFZLEVBQUU7d0JBQ1osRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTt3QkFDMUQsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTt3QkFDMUQsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTt3QkFDMUQsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtxQkFDM0Q7aUJBQ0Y7YUFDRixDQUFBO1lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFBO1lBQy9FLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BEO29CQUNFLElBQUksRUFBRSxVQUFVO29CQUNoQixJQUFJLEVBQUU7d0JBQ0osRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7d0JBQzVCLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO3FCQUM3QjtpQkFDRjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsVUFBVTtvQkFDaEIsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztpQkFDckM7YUFDRixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==