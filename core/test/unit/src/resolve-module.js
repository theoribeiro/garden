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
const path_1 = require("path");
const helpers_1 = require("../../helpers");
describe("ModuleResolver", () => {
    // Note: We test the ModuleResolver via the TestGarden.resolveModule method, for convenience.
    it("handles a project template reference in a build dependency name", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        garden.setActionConfigs([
            {
                name: "test-project-a",
                type: "test",
                path: (0, path_1.join)(garden.projectRoot, "module-a"),
                build: {
                    dependencies: [],
                },
            },
            {
                name: "module-b",
                type: "test",
                path: (0, path_1.join)(garden.projectRoot, "module-b"),
                build: {
                    dependencies: [{ name: "${project.name}", copy: [] }],
                },
            },
        ]);
        const module = await garden.resolveModule("module-b");
        (0, chai_1.expect)(module.build.dependencies[0].name).to.equal("test-project-a");
    });
    it("handles a module template reference in a build dependency name", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        garden.setActionConfigs([
            {
                name: "module-a",
                type: "test",
                path: (0, path_1.join)(garden.projectRoot, "module-a"),
                build: {
                    dependencies: [],
                },
            },
            {
                name: "module-b",
                type: "test",
                path: (0, path_1.join)(garden.projectRoot, "module-b"),
                build: {
                    dependencies: [{ name: "${modules.module-a.name}", copy: [] }],
                },
            },
        ]);
        const module = await garden.resolveModule("module-b");
        (0, chai_1.expect)(module.build.dependencies[0].name).to.equal("module-a");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNvbHZlLW1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3QiwrQkFBMkI7QUFDM0IsMkNBQStDO0FBRS9DLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7SUFDOUIsNkZBQTZGO0lBRTdGLEVBQUUsQ0FBQyxpRUFBaUUsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMvRSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBRXRDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztZQUN0QjtnQkFDRSxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7Z0JBQzFDLEtBQUssRUFBRTtvQkFDTCxZQUFZLEVBQUUsRUFBRTtpQkFDakI7YUFDRjtZQUNEO2dCQUNFLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7Z0JBQzFDLEtBQUssRUFBRTtvQkFDTCxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7aUJBQ3REO2FBQ0Y7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDckQsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0lBQ3RFLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGdFQUFnRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzlFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7UUFFdEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO1lBQ3RCO2dCQUNFLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7Z0JBQzFDLEtBQUssRUFBRTtvQkFDTCxZQUFZLEVBQUUsRUFBRTtpQkFDakI7YUFDRjtZQUNEO2dCQUNFLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7Z0JBQzFDLEtBQUssRUFBRTtvQkFDTCxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSwwQkFBMEIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7aUJBQy9EO2FBQ0Y7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDckQsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUNoRSxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=