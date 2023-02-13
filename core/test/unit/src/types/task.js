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
const helpers_1 = require("../../../helpers");
const task_1 = require("../../../../src/types/task");
describe("taskFromConfig", () => {
    it("should propagate the disabled flag from the config", async () => {
        const config = {
            name: "test",
            cacheResult: true,
            dependencies: [],
            disabled: true,
            spec: {},
            timeout: null,
        };
        const garden = await (0, helpers_1.makeTestGardenA)();
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const module = graph.getModule("module-a");
        const task = (0, task_1.taskFromConfig)(module, config);
        (0, chai_1.expect)(task.disabled).to.be.true;
    });
    it("should set disabled=true if the module is disabled", async () => {
        const config = {
            name: "test",
            cacheResult: true,
            dependencies: [],
            disabled: false,
            spec: {},
            timeout: null,
        };
        const garden = await (0, helpers_1.makeTestGardenA)();
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const module = graph.getModule("module-a");
        module.disabled = true;
        const task = (0, task_1.taskFromConfig)(module, config);
        (0, chai_1.expect)(task.disabled).to.be.true;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsOENBQWtEO0FBRWxELHFEQUEyRDtBQUUzRCxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0lBQzlCLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsRSxNQUFNLE1BQU0sR0FBZTtZQUN6QixJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFlBQVksRUFBRSxFQUFFO1lBQ2hCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsSUFBSSxFQUFFLEVBQUU7WUFDUixPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUE7UUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBQ3RDLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQzNFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDMUMsTUFBTSxJQUFJLEdBQUcsSUFBQSxxQkFBYyxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUUzQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7SUFDbEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0RBQW9ELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDbEUsTUFBTSxNQUFNLEdBQWU7WUFDekIsSUFBSSxFQUFFLE1BQU07WUFDWixXQUFXLEVBQUUsSUFBSTtZQUNqQixZQUFZLEVBQUUsRUFBRTtZQUNoQixRQUFRLEVBQUUsS0FBSztZQUNmLElBQUksRUFBRSxFQUFFO1lBQ1IsT0FBTyxFQUFFLElBQUk7U0FDZCxDQUFBO1FBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUN0QyxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUMzRSxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQzFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO1FBQ3RCLE1BQU0sSUFBSSxHQUFHLElBQUEscUJBQWMsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFFM0MsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFBO0lBQ2xDLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==