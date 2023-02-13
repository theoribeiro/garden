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
const chai_1 = require("chai");
const hide_warning_1 = require("../../../../../src/commands/util/hide-warning");
const string_1 = require("../../../../../src/util/string");
const testing_1 = require("../../../../../src/util/testing");
describe("HideWarningCommand", () => {
    it("should hide a warning message", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA);
        const log = garden.log.placeholder();
        const cmd = new hide_warning_1.HideWarningCommand();
        const key = (0, string_1.randomString)(10);
        try {
            await cmd.action({
                garden,
                args: { key },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
                log: garden.log,
                headerLog: garden.log,
                footerLog: garden.log,
            });
            await garden.emitWarning({
                key,
                log,
                message: "foo",
            });
            (0, chai_1.expect)((0, testing_1.getLogMessages)(log).length).to.equal(0);
        }
        finally {
            await garden.configStore.delete("warnings", key);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlkZS13YXJuaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaGlkZS13YXJuaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsaURBQXlGO0FBQ3pGLCtCQUE2QjtBQUM3QixnRkFBa0Y7QUFDbEYsMkRBQTZEO0FBQzdELDZEQUFnRTtBQUVoRSxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO0lBQ2xDLEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3QyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxzQkFBWSxDQUFDLENBQUE7UUFDakQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNwQyxNQUFNLEdBQUcsR0FBRyxJQUFJLGlDQUFrQixFQUFFLENBQUE7UUFDcEMsTUFBTSxHQUFHLEdBQUcsSUFBQSxxQkFBWSxFQUFDLEVBQUUsQ0FBQyxDQUFBO1FBRTVCLElBQUk7WUFDRixNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUM7Z0JBQ2YsTUFBTTtnQkFDTixJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2IsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUMsRUFBRSxDQUFDO2dCQUMvQixHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUc7Z0JBQ2YsU0FBUyxFQUFFLE1BQU0sQ0FBQyxHQUFHO2dCQUNyQixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUc7YUFDdEIsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDO2dCQUN2QixHQUFHO2dCQUNILEdBQUc7Z0JBQ0gsT0FBTyxFQUFFLEtBQUs7YUFDZixDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxJQUFBLHdCQUFjLEVBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUMvQztnQkFBUztZQUNSLE1BQU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1NBQ2pEO0lBQ0gsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9