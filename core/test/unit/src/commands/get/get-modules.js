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
const lodash_1 = require("lodash");
const helpers_1 = require("../../../../helpers");
const get_modules_1 = require("../../../../../src/commands/get/get-modules");
const logger_1 = require("../../../../../src/logger/logger");
describe("GetModulesCommand", () => {
    const command = new get_modules_1.GetModulesCommand();
    it("returns all modules in a project", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { modules: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "full": false }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        const expected = (0, lodash_1.mapValues)((0, lodash_1.keyBy)(await garden.resolveModules({ log }), "name"), logger_1.withoutInternalFields);
        (0, chai_1.expect)(res.result).to.eql({ modules: expected });
    });
    it("skips disabled modules if exclude-disabled=true", async () => {
        var _a, _b;
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        await garden.scanAndAddConfigs();
        garden["moduleConfigs"]["module-a"].disabled = true;
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { modules: undefined },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": true, "full": false }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        (0, chai_1.expect)((_a = res.result) === null || _a === void 0 ? void 0 : _a.modules["module-a"]).to.not.exist;
        (0, chai_1.expect)((_b = res.result) === null || _b === void 0 ? void 0 : _b.modules["module-b"]).to.exist;
    });
    it("returns specified module in a project", async () => {
        const garden = await (0, helpers_1.makeTestGardenA)();
        const log = garden.log;
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: { modules: ["module-a"] },
            opts: (0, helpers_1.withDefaultGlobalOpts)({ "exclude-disabled": false, "full": false }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        const graph = await garden.getConfigGraph({ log, emit: false });
        const moduleA = graph.getModule("module-a");
        (0, chai_1.expect)(res.result).to.eql({ modules: { "module-a": (0, logger_1.withoutInternalFields)(moduleA) } });
        (0, chai_1.expect)(res.result.modules["module-a"]["buildDependencies"]).to.be.undefined;
        (0, chai_1.expect)(res.result.modules["module-a"].version.dependencyVersions).to.be.undefined;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LW1vZHVsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtbW9kdWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3QixtQ0FBeUM7QUFDekMsaURBQTRFO0FBQzVFLDZFQUErRTtBQUMvRSw2REFBd0U7QUFFeEUsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxNQUFNLE9BQU8sR0FBRyxJQUFJLCtCQUFpQixFQUFFLENBQUE7SUFFdkMsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2hELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7UUFDdEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUV0QixNQUFNLEdBQUcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDL0IsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRTtZQUM1QixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7U0FDMUUsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7UUFFMUUsTUFBTSxRQUFRLEdBQUcsSUFBQSxrQkFBUyxFQUFDLElBQUEsY0FBSyxFQUFDLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsOEJBQXFCLENBQUMsQ0FBQTtRQUV0RyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBQ2xELENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFOztRQUMvRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBQ3RDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUE7UUFFdEIsTUFBTSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtRQUNoQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQTtRQUVuRCxNQUFNLEdBQUcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDL0IsTUFBTTtZQUNOLEdBQUc7WUFDSCxTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRTtZQUM1QixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7U0FDekUsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7UUFFMUUsSUFBQSxhQUFNLEVBQUMsTUFBQSxHQUFHLENBQUMsTUFBTSwwQ0FBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQTtRQUNwRCxJQUFBLGFBQU0sRUFBQyxNQUFBLEdBQUcsQ0FBQyxNQUFNLDBDQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7SUFDbEQsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDckQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlCQUFlLEdBQUUsQ0FBQTtRQUN0QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBRXRCLE1BQU0sR0FBRyxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUMvQixNQUFNO1lBQ04sR0FBRztZQUNILFNBQVMsRUFBRSxHQUFHO1lBQ2QsU0FBUyxFQUFFLEdBQUc7WUFDZCxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMvQixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7U0FDMUUsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7UUFFMUUsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQy9ELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUE7UUFFM0MsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBQSw4QkFBcUIsRUFBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUN0RixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7UUFDM0UsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7SUFDbkYsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9