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
const get_outputs_1 = require("../../../../../src/commands/get/get-outputs");
const plugin_1 = require("../../../../../src/plugin/plugin");
describe("GetOutputsCommand", () => {
    let tmpDir;
    let projectConfig;
    before(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        projectConfig = (0, helpers_1.createProjectConfig)({
            path: tmpDir.path,
            providers: [{ name: "test" }],
        });
    });
    after(async () => {
        await tmpDir.cleanup();
    });
    it("should resolve and return defined project outputs", async () => {
        const plugin = (0, plugin_1.createGardenPlugin)({
            name: "test",
            handlers: {
                async getEnvironmentStatus() {
                    return { ready: true, outputs: { test: "test-value" } };
                },
            },
        });
        projectConfig.outputs = [{ name: "test", value: "${providers.test.outputs.test}" }];
        const garden = await helpers_1.TestGarden.factory(tmpDir.path, {
            plugins: [plugin],
            config: projectConfig,
        });
        const log = garden.log;
        const command = new get_outputs_1.GetOutputsCommand();
        const res = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({}),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(res.result).error).to.be.undefined;
        (0, chai_1.expect)(res.result).to.eql({
            test: "test-value",
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LW91dHB1dHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtb3V0cHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUU3QixpREFBeUc7QUFDekcsNkVBQStFO0FBRS9FLDZEQUFxRTtBQUVyRSxRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLElBQUksTUFBMkIsQ0FBQTtJQUMvQixJQUFJLGFBQTRCLENBQUE7SUFFaEMsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQVcsRUFBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFFL0QsYUFBYSxHQUFHLElBQUEsNkJBQW1CLEVBQUM7WUFDbEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO1lBQ2pCLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO1NBQzlCLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2YsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDeEIsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDakUsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBa0IsRUFBQztZQUNoQyxJQUFJLEVBQUUsTUFBTTtZQUNaLFFBQVEsRUFBRTtnQkFDUixLQUFLLENBQUMsb0JBQW9CO29CQUN4QixPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBQTtnQkFDekQsQ0FBQzthQUNGO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsYUFBYSxDQUFDLE9BQU8sR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQyxDQUFBO1FBRW5GLE1BQU0sTUFBTSxHQUFHLE1BQU0sb0JBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtZQUNuRCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDakIsTUFBTSxFQUFFLGFBQWE7U0FDdEIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtRQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLCtCQUFpQixFQUFFLENBQUE7UUFFdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQy9CLE1BQU07WUFDTixHQUFHO1lBQ0gsU0FBUyxFQUFFLEdBQUc7WUFDZCxTQUFTLEVBQUUsR0FBRztZQUNkLElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUMsRUFBRSxDQUFDO1NBQ2hDLENBQUMsQ0FBQTtRQUVGLElBQUEsYUFBTSxFQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO1FBRTFFLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ3hCLElBQUksRUFBRSxZQUFZO1NBQ25CLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==