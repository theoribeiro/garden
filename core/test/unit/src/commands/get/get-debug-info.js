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
const chai_1 = require("chai");
const js_yaml_1 = __importDefault(require("js-yaml"));
const helpers_1 = require("../../../../helpers");
const get_debug_info_1 = require("../../../../../src/commands/get/get-debug-info");
const fs_extra_1 = require("fs-extra");
const constants_1 = require("../../../../../src/constants");
const path_1 = require("path");
const fs_1 = require("../../../../../src/util/fs");
const helpers_2 = require("../../../../helpers");
const helpers_3 = require("../../../../helpers");
const create_project_1 = require("../../../../../src/commands/create/create-project");
const debugZipFileRegex = new RegExp(/debug-info-.*?.zip/);
async function cleanupTmpDebugFiles(root, gardenDirPath) {
    const allFiles = await (0, fs_extra_1.readdir)(root);
    await (0, fs_extra_1.remove)((0, path_1.join)(gardenDirPath, get_debug_info_1.TEMP_DEBUG_ROOT));
    const deleteFilenames = allFiles.filter((fileName) => {
        return fileName.match(debugZipFileRegex);
    });
    for await (const name of deleteFilenames) {
        await (0, fs_extra_1.remove)((0, path_1.join)(root, name));
    }
}
describe("GetDebugInfoCommand", () => {
    let garden;
    let log;
    let gardenDebugTmp;
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        log = garden.log;
        gardenDebugTmp = (0, path_1.join)(garden.gardenDirPath, get_debug_info_1.TEMP_DEBUG_ROOT);
    });
    afterEach(async () => {
        await cleanupTmpDebugFiles(garden.projectRoot, garden.gardenDirPath);
    });
    after(async () => {
        await (0, helpers_1.cleanProject)(garden.gardenDirPath);
    });
    describe("generateDebugInfoReport", () => {
        it("should generate a zip file containing a debug info report in the root folder of the project", async () => {
            const command = new get_debug_info_1.GetDebugInfoCommand();
            const res = await command.action({
                garden,
                log,
                headerLog: log,
                footerLog: log,
                args: {},
                opts: (0, helpers_1.withDefaultGlobalOpts)({ "format": "json", "include-project": false }),
            });
            (0, chai_1.expect)(res.result).to.eql(0);
            const gardenProjectRootFiles = await (0, fs_extra_1.readdir)(garden.projectRoot);
            const zipFiles = gardenProjectRootFiles.filter((fileName) => {
                return fileName.match(debugZipFileRegex);
            });
            (0, chai_1.expect)(zipFiles.length).to.equal(1);
        });
    });
    describe("generateBasicDebugInfoReport", () => {
        it("should generate a zip file with a *basic* debug info report in the root folder of the project", async () => {
            await (0, get_debug_info_1.generateBasicDebugInfoReport)(garden.projectRoot, garden.gardenDirPath, log);
            const gardenProjectRootFiles = await (0, fs_extra_1.readdir)(garden.projectRoot);
            const zipFiles = gardenProjectRootFiles.filter((fileName) => {
                return fileName.match(debugZipFileRegex);
            });
            (0, chai_1.expect)(zipFiles.length).to.equal(1);
        });
    });
    describe("collectBasicDebugInfo", () => {
        it("should create a basic debug info report in a temporary folder", async () => {
            await (0, get_debug_info_1.collectBasicDebugInfo)(garden.projectRoot, garden.gardenDirPath, log);
            // we first check if the main garden.yml exists
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(gardenDebugTmp, fs_1.defaultConfigFilename))).to.equal(true);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            // Check that each module config files have been copied over and
            // the folder structure is maintained
            for (const module of graph.getModules()) {
                const moduleRelativePath = (0, path_1.relative)(garden.projectRoot, module.path);
                // Checks folder structure is maintained
                (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(gardenDebugTmp, moduleRelativePath))).to.equal(true);
                // Checks config file is copied over
                (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(gardenDebugTmp, moduleRelativePath, fs_1.defaultConfigFilename))).to.equal(true);
                // Checks error logs are copied over if they exist
                if (await (0, fs_extra_1.pathExists)((0, path_1.join)(module.path, constants_1.ERROR_LOG_FILENAME))) {
                    (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(gardenDebugTmp, moduleRelativePath, constants_1.ERROR_LOG_FILENAME))).to.equal(true);
                }
            }
        });
        it("should correctly handle custom-named config files", async () => {
            const _garden = await (0, helpers_2.makeTestGarden)((0, helpers_3.getDataDir)("test-projects", "custom-config-names"));
            const debugTmp = (0, path_1.join)(_garden.gardenDirPath, get_debug_info_1.TEMP_DEBUG_ROOT);
            try {
                await (0, get_debug_info_1.collectBasicDebugInfo)(_garden.projectRoot, _garden.gardenDirPath, log);
                // we first check if the project.garden.yml exists
                (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(debugTmp, create_project_1.defaultProjectConfigFilename))).to.equal(true);
                const graph = await _garden.getConfigGraph({ log: _garden.log, emit: false });
                // Check that each module config files have been copied over and
                // the folder structure is maintained
                for (const module of graph.getModules()) {
                    const moduleRelativePath = (0, path_1.relative)(_garden.projectRoot, module.path);
                    const configFilename = (0, path_1.basename)(module.configPath);
                    // Checks folder structure is maintained
                    (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(debugTmp, moduleRelativePath))).to.equal(true);
                    // Checks config file is copied over
                    (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(debugTmp, moduleRelativePath, configFilename))).to.equal(true);
                    // Checks error logs are copied over if they exist
                    if (await (0, fs_extra_1.pathExists)((0, path_1.join)(module.path, constants_1.ERROR_LOG_FILENAME))) {
                        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(debugTmp, moduleRelativePath, constants_1.ERROR_LOG_FILENAME))).to.equal(true);
                    }
                }
            }
            finally {
                await cleanupTmpDebugFiles(_garden.projectRoot, _garden.gardenDirPath);
            }
        });
    });
    describe("collectSystemDiagnostic", () => {
        it("should create a system info report in a temporary folder", async () => {
            const format = "json";
            await (0, get_debug_info_1.collectSystemDiagnostic)(garden.gardenDirPath, log, format);
            // Check if the temporary folder exists
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(gardenDebugTmp)).to.equal(true);
            // Checks if system debug file is created
            const systemInfoFilePath = (0, path_1.join)(gardenDebugTmp, `${get_debug_info_1.SYSTEM_INFO_FILENAME_NO_EXT}.${format}`);
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(systemInfoFilePath)).to.equal(true);
            // Check structure of systemInfoFile
            const systemInfoFile = await (0, fs_extra_1.readJSON)(systemInfoFilePath);
            (0, chai_1.expect)(systemInfoFile).to.have.property("gardenVersion");
            (0, chai_1.expect)(systemInfoFile).to.have.property("platform");
            (0, chai_1.expect)(systemInfoFile).to.have.property("platformVersion");
        });
        it("should create a system info report in a temporary folder with yaml format", async () => {
            const format = "yaml";
            await (0, get_debug_info_1.collectSystemDiagnostic)(garden.gardenDirPath, log, format);
            // Check if the temporary folder exists
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(gardenDebugTmp)).to.equal(true);
            // Checks if system debug file is created
            const systemInfoFilePath = (0, path_1.join)(gardenDebugTmp, `${get_debug_info_1.SYSTEM_INFO_FILENAME_NO_EXT}.${format}`);
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(systemInfoFilePath)).to.equal(true);
            // Check structure of systemInfoFile
            const systemInfoFile = js_yaml_1.default.safeLoad(await (0, fs_extra_1.readFile)(systemInfoFilePath, "utf8"));
            (0, chai_1.expect)(systemInfoFile).to.have.property("gardenVersion");
            (0, chai_1.expect)(systemInfoFile).to.have.property("platform");
            (0, chai_1.expect)(systemInfoFile).to.have.property("platformVersion");
        });
    });
    describe("collectProviderDebugInfo", () => {
        it("should create a test-plugin json report in a temporary folder", async () => {
            const format = "json";
            const expectedProviderFolderName = "test-plugin";
            const providerInfoFilePath = (0, path_1.join)(expectedProviderFolderName, `${get_debug_info_1.PROVIDER_INFO_FILENAME_NO_EXT}.${format}`);
            await (0, get_debug_info_1.collectProviderDebugInfo)(garden, log, format, false);
            // Check if the temporary folder exists
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(gardenDebugTmp)).to.equal(true);
            // Check if the test-plugin folder exists
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(gardenDebugTmp, expectedProviderFolderName))).to.equal(true);
            // Check if the test-plugin folder exists
            (0, chai_1.expect)(await (0, fs_extra_1.pathExists)((0, path_1.join)(gardenDebugTmp, providerInfoFilePath))).to.equal(true);
            // Check structure of provider info file
            const systemInfoFile = await (0, fs_extra_1.readJSON)((0, path_1.join)(gardenDebugTmp, providerInfoFilePath));
            (0, chai_1.expect)(systemInfoFile).to.have.property("info");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWRlYnVnLWluZm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtZGVidWctaW5mby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILCtCQUE2QjtBQUM3QixzREFBMEI7QUFDMUIsaURBQTBGO0FBQzFGLG1GQVN1RDtBQUN2RCx1Q0FBMEU7QUFDMUUsNERBQWlFO0FBQ2pFLCtCQUErQztBQUcvQyxtREFBa0U7QUFDbEUsaURBQW9EO0FBQ3BELGlEQUFnRDtBQUNoRCxzRkFBZ0c7QUFFaEcsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBRTFELEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsYUFBcUI7SUFDckUsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLGtCQUFPLEVBQUMsSUFBSSxDQUFDLENBQUE7SUFDcEMsTUFBTSxJQUFBLGlCQUFNLEVBQUMsSUFBQSxXQUFJLEVBQUMsYUFBYSxFQUFFLGdDQUFlLENBQUMsQ0FBQyxDQUFBO0lBQ2xELE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtRQUNuRCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtJQUMxQyxDQUFDLENBQUMsQ0FBQTtJQUNGLElBQUksS0FBSyxFQUFFLE1BQU0sSUFBSSxJQUFJLGVBQWUsRUFBRTtRQUN4QyxNQUFNLElBQUEsaUJBQU0sRUFBQyxJQUFBLFdBQUksRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTtLQUMvQjtBQUNILENBQUM7QUFFRCxRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO0lBQ25DLElBQUksTUFBYyxDQUFBO0lBQ2xCLElBQUksR0FBYSxDQUFBO0lBQ2pCLElBQUksY0FBc0IsQ0FBQTtJQUUxQixNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFD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