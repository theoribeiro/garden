"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = exports.getBundledPlugins = void 0;
const util_1 = require("@garden-io/core/build/src/util/util");
const cli_1 = require("@garden-io/core/build/src/cli/cli");
const global_1 = require("@garden-io/core/build/src/config-store/global");
// These plugins are always registered
const getBundledPlugins = () => [
    { name: "conftest", callback: () => require("@garden-io/garden-conftest").gardenPlugin() },
    { name: "conftest-container", callback: () => require("@garden-io/garden-conftest-container").gardenPlugin() },
    { name: "conftest-kubernetes", callback: () => require("@garden-io/garden-conftest-kubernetes").gardenPlugin() },
    { name: "jib", callback: () => require("@garden-io/garden-jib").gardenPlugin() },
    { name: "terraform", callback: () => require("@garden-io/garden-terraform").gardenPlugin() },
    { name: "pulumi", callback: () => require("@garden-io/garden-pulumi").gardenPlugin() },
];
exports.getBundledPlugins = getBundledPlugins;
async function runCli({ args, cli, exitOnError = true, } = {}) {
    let code = 0;
    let result = undefined;
    if (!args) {
        args = process.argv.slice(2);
    }
    try {
        if (!cli) {
            cli = new cli_1.GardenCli({ plugins: (0, exports.getBundledPlugins)() });
        }
        // Note: We slice off the binary/script name from argv.
        result = await cli.run({ args, exitOnError });
        code = result.code;
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log(err.message);
        code = 1;
    }
    finally {
        if (cli === null || cli === void 0 ? void 0 : cli.processRecord) {
            const globalConfigStore = new global_1.GlobalConfigStore();
            await globalConfigStore.delete("activeProcesses", String(cli.processRecord.pid));
        }
        await (0, util_1.shutdown)(code);
    }
    return { cli, result };
}
exports.runCli = runCli;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILDhEQUE4RDtBQUM5RCwyREFBd0U7QUFFeEUsMEVBQWlGO0FBRWpGLHNDQUFzQztBQUMvQixNQUFNLGlCQUFpQixHQUFHLEdBQTRCLEVBQUUsQ0FBQztJQUM5RCxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFFO0lBQzFGLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsc0NBQXNDLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtJQUM5RyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLHVDQUF1QyxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7SUFDaEgsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtJQUNoRixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFFO0lBQzVGLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7Q0FDdkYsQ0FBQTtBQVBZLFFBQUEsaUJBQWlCLHFCQU83QjtBQUVNLEtBQUssVUFBVSxNQUFNLENBQUMsRUFDM0IsSUFBSSxFQUNKLEdBQUcsRUFDSCxXQUFXLEdBQUcsSUFBSSxNQUM2QyxFQUFFO0lBQ2pFLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQTtJQUNaLElBQUksTUFBTSxHQUEwQixTQUFTLENBQUE7SUFFN0MsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUM3QjtJQUVELElBQUk7UUFDRixJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1IsR0FBRyxHQUFHLElBQUksZUFBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUEseUJBQWlCLEdBQUUsRUFBRSxDQUFDLENBQUE7U0FDdEQ7UUFDRCx1REFBdUQ7UUFDdkQsTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFBO1FBQzdDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFBO0tBQ25CO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixzQ0FBc0M7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDeEIsSUFBSSxHQUFHLENBQUMsQ0FBQTtLQUNUO1lBQVM7UUFDUixJQUFJLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxhQUFhLEVBQUU7WUFDdEIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLDBCQUFpQixFQUFFLENBQUE7WUFDakQsTUFBTSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtTQUNqRjtRQUNELE1BQU0sSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUE7S0FDckI7SUFFRCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFBO0FBQ3hCLENBQUM7QUFoQ0Qsd0JBZ0NDIn0=