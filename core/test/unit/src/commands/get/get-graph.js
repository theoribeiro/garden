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
const helpers_1 = require("../../../../helpers");
const get_graph_1 = require("../../../../../src/commands/get/get-graph");
describe("GetGraphCommand", () => {
    // TODO: Switch to a stable topological sorting algorithm that's more amenable to testing.
    it("should get the project's serialized dependency graph", async () => {
        const garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-dependants"));
        const log = garden.log;
        const command = new get_graph_1.GetGraphCommand();
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(Object.keys(res.result).sort()).to.eql(["nodes", "relationships"]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWdyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0LWdyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLGlEQUF1RjtBQUN2Rix5RUFBMkU7QUFFM0UsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtJQUMvQiwwRkFBMEY7SUFDMUYsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3BFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLElBQUEsb0JBQVUsRUFBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUE7UUFDMUUsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQTtRQUVyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDL0IsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLENBQUM7U0FDaEMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUE7SUFDNUUsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9