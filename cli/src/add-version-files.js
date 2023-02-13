"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const git_1 = require("@garden-io/core/build/src/vcs/git");
const garden_1 = require("@garden-io/core/build/src/garden");
const logger_1 = require("@garden-io/core/build/src/logger/logger");
const path_1 = require("path");
const bluebird_1 = __importDefault(require("bluebird"));
const constants_1 = require("@garden-io/core/build/src/constants");
const vcs_1 = require("@garden-io/core/build/src/vcs/vcs");
const cache_1 = require("@garden-io/core/build/src/cache");
require("source-map-support").install();
// make sure logger is initialized
try {
    logger_1.Logger.initialize({ level: logger_1.LogLevel.info, type: "quiet", storeEntries: false });
}
catch (_) { }
/**
 * Write .garden-version files for modules in garden-system/static.
 */
async function addVersionFiles() {
    const garden = await garden_1.Garden.factory(constants_1.STATIC_DIR, { commandInfo: { name: "add-version-files", args: {}, opts: {} } });
    const moduleConfigs = await garden.getRawModuleConfigs();
    return bluebird_1.default.map(moduleConfigs, async (config) => {
        const path = config.path;
        const versionFilePath = (0, path_1.resolve)(path, constants_1.GARDEN_VERSIONFILE_NAME);
        const vcsHandler = new git_1.GitHandler({
            garden,
            projectRoot: constants_1.STATIC_DIR,
            gardenDirPath: garden.gardenDirPath,
            ignoreFile: garden.dotIgnoreFile,
            cache: new cache_1.TreeCache(),
        });
        const treeVersion = await vcsHandler.getTreeVersion(garden.log, garden.projectName, config);
        // eslint-disable-next-line no-console
        console.log(`${config.name} -> ${(0, path_1.relative)(constants_1.STATIC_DIR, versionFilePath)}`);
        return (0, vcs_1.writeTreeVersionFile)(path, treeVersion);
    });
}
addVersionFiles().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkLXZlcnNpb24tZmlsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhZGQtdmVyc2lvbi1maWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILDJEQUE4RDtBQUM5RCw2REFBeUQ7QUFDekQsb0VBQTBFO0FBQzFFLCtCQUF3QztBQUN4Qyx3REFBK0I7QUFDL0IsbUVBQXlGO0FBQ3pGLDJEQUF3RTtBQUN4RSwyREFBMkQ7QUFFM0QsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUE7QUFFdkMsa0NBQWtDO0FBQ2xDLElBQUk7SUFDRixlQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7Q0FDaEY7QUFBQyxPQUFPLENBQUMsRUFBRSxHQUFFO0FBRWQ7O0dBRUc7QUFDSCxLQUFLLFVBQVUsZUFBZTtJQUM1QixNQUFNLE1BQU0sR0FBRyxNQUFNLGVBQU0sQ0FBQyxPQUFPLENBQUMsc0JBQVUsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFbkgsTUFBTSxhQUFhLEdBQUcsTUFBTSxNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtJQUV4RCxPQUFPLGtCQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDbEQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQTtRQUN4QixNQUFNLGVBQWUsR0FBRyxJQUFBLGNBQU8sRUFBQyxJQUFJLEVBQUUsbUNBQXVCLENBQUMsQ0FBQTtRQUU5RCxNQUFNLFVBQVUsR0FBRyxJQUFJLGdCQUFVLENBQUM7WUFDaEMsTUFBTTtZQUNOLFdBQVcsRUFBRSxzQkFBVTtZQUN2QixhQUFhLEVBQUUsTUFBTSxDQUFDLGFBQWE7WUFDbkMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxhQUFhO1lBQ2hDLEtBQUssRUFBRSxJQUFJLGlCQUFTLEVBQUU7U0FDdkIsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxXQUFXLEdBQUcsTUFBTSxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUUzRixzQ0FBc0M7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLE9BQU8sSUFBQSxlQUFRLEVBQUMsc0JBQVUsRUFBRSxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFekUsT0FBTyxJQUFBLDBCQUFvQixFQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUNoRCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFRCxlQUFlLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUM5QixzQ0FBc0M7SUFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ2pCLENBQUMsQ0FBQyxDQUFBIn0=