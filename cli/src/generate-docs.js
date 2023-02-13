"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const generate_1 = require("@garden-io/core/build/src/docs/generate");
const path_1 = require("path");
const logger_1 = require("@garden-io/core/build/src/logger/logger");
const constants_1 = require("@garden-io/core/build/src/constants");
const cli_1 = require("./cli");
const plugins_1 = require("@garden-io/core/build/src/plugins/plugins");
require("source-map-support").install();
// make sure logger is initialized
try {
    logger_1.Logger.initialize({
        level: logger_1.LogLevel.info,
        type: "quiet",
        storeEntries: false,
        // level: LogLevel.debug,
        // writers: [new BasicTerminalWriter()],
    });
}
catch (_) { }
const plugins = [...(0, cli_1.getBundledPlugins)(), ...(0, plugins_1.getSupportedPlugins)()];
(0, generate_1.generateDocs)((0, path_1.resolve)(constants_1.GARDEN_CLI_ROOT, "..", "docs"), plugins)
    .then(() => {
    // eslint-disable-next-line no-console
    console.log("Done!");
    process.exit(0);
})
    .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtZG9jcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdlbmVyYXRlLWRvY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxzRUFBc0U7QUFDdEUsK0JBQThCO0FBQzlCLG9FQUEwRTtBQUMxRSxtRUFBcUU7QUFDckUsK0JBQXlDO0FBQ3pDLHVFQUErRTtBQUUvRSxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUV2QyxrQ0FBa0M7QUFDbEMsSUFBSTtJQUNGLGVBQU0sQ0FBQyxVQUFVLENBQUM7UUFDaEIsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSTtRQUNwQixJQUFJLEVBQUUsT0FBTztRQUNiLFlBQVksRUFBRSxLQUFLO1FBQ25CLHlCQUF5QjtRQUN6Qix3Q0FBd0M7S0FDekMsQ0FBQyxDQUFBO0NBQ0g7QUFBQyxPQUFPLENBQUMsRUFBRSxHQUFFO0FBRWQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFHLElBQUEsdUJBQWlCLEdBQUUsRUFBRSxHQUFHLElBQUEsNkJBQW1CLEdBQUUsQ0FBQyxDQUFBO0FBRWxFLElBQUEsdUJBQVksRUFBQyxJQUFBLGNBQU8sRUFBQywyQkFBZSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUM7S0FDMUQsSUFBSSxDQUFDLEdBQUcsRUFBRTtJQUNULHNDQUFzQztJQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDakIsQ0FBQyxDQUFDO0tBQ0QsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7SUFDYixzQ0FBc0M7SUFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ2pCLENBQUMsQ0FBQyxDQUFBIn0=