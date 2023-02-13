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
const dev_1 = require("../../../../src/commands/dev");
// TODO-G2: rename test cases to match the new graph model semantics
describe("DevCommand", () => {
    const command = new dev_1.DevCommand();
    // async function waitForEvent(garden: TestGarden, name: string) {
    //   return pEvent(<any>garden.events, name, { timeout: 10000 })
    // }
    // async function completeFirstTasks(
    //   garden: TestGarden,
    //   args: ParameterValues<DevCommandArgs>,
    //   opts: ParameterValues<GlobalOptions & DevCommandOpts>
    // ) {
    //   const log = garden.log
    //   await command.prepare({ log, footerLog: log, headerLog: log, args, opts })
    //   const promise = command
    //     .action({
    //       garden,
    //       log,
    //       headerLog: log,
    //       footerLog: log,
    //       args,
    //       opts,
    //     })
    //     .then(({ errors }) => {
    //       if (errors) {
    //         throw errors[0]
    //       }
    //     })
    //     .catch((err) => {
    //       // eslint-disable-next-line no-console
    //       console.error(err)
    //     })
    //   await waitForEvent(garden, "watchingForChanges")
    //   garden.events.emit("_exit", {})
    //   const completedTasks = garden.events.eventLog
    //     .filter((e) => e.name === "taskComplete")
    //     .map((e) => e.payload["key"])
    //     .filter((key) => !key.startsWith("resolve-module."))
    //     .sort()
    //   return { promise, completedTasks }
    // }
    it("should be protected", async () => {
        (0, chai_1.expect)(command.protected).to.be.true;
    });
    // TODO-G2
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGV2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHNEQUF5RDtBQUV6RCxvRUFBb0U7QUFDcEUsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFDMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBVSxFQUFFLENBQUE7SUFFaEMsa0VBQWtFO0lBQ2xFLGdFQUFnRTtJQUNoRSxJQUFJO0lBRUoscUNBQXFDO0lBQ3JDLHdCQUF3QjtJQUN4QiwyQ0FBMkM7SUFDM0MsMERBQTBEO0lBQzFELE1BQU07SUFDTiwyQkFBMkI7SUFFM0IsK0VBQStFO0lBRS9FLDRCQUE0QjtJQUM1QixnQkFBZ0I7SUFDaEIsZ0JBQWdCO0lBQ2hCLGFBQWE7SUFDYix3QkFBd0I7SUFDeEIsd0JBQXdCO0lBQ3hCLGNBQWM7SUFDZCxjQUFjO0lBQ2QsU0FBUztJQUNULDhCQUE4QjtJQUM5QixzQkFBc0I7SUFDdEIsMEJBQTBCO0lBQzFCLFVBQVU7SUFDVixTQUFTO0lBQ1Qsd0JBQXdCO0lBQ3hCLCtDQUErQztJQUMvQywyQkFBMkI7SUFDM0IsU0FBUztJQUVULHFEQUFxRDtJQUVyRCxvQ0FBb0M7SUFFcEMsa0RBQWtEO0lBQ2xELGdEQUFnRDtJQUNoRCxvQ0FBb0M7SUFDcEMsMkRBQTJEO0lBQzNELGNBQWM7SUFFZCx1Q0FBdUM7SUFDdkMsSUFBSTtJQUVKLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNuQyxJQUFBLGFBQU0sRUFBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7SUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFFRixVQUFVO0FBQ1osQ0FBQyxDQUFDLENBQUEifQ==