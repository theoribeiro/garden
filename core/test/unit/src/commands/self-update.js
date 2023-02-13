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
const finalhandler_1 = __importDefault(require("finalhandler"));
const serve_static_1 = __importDefault(require("serve-static"));
const chai_1 = require("chai");
const fs_extra_1 = require("fs-extra");
const get_port_1 = __importDefault(require("get-port"));
const path_1 = require("path");
const cli_1 = require("../../../../src/cli/cli");
const self_update_1 = require("../../../../src/commands/self-update");
const fs_1 = require("../../../../src/util/fs");
const util_1 = require("../../../../src/util/util");
const helpers_1 = require("../../../helpers");
const http_1 = require("http");
describe("SelfUpdateCommand", () => {
    const command = new self_update_1.SelfUpdateCommand();
    let server;
    let garden;
    let tempDir;
    before(async () => {
        garden = await (0, cli_1.makeDummyGarden)("/tmp", { commandInfo: { name: command.name, args: {}, opts: {} } });
        // Serve small static files to avoid slow HTTP requests during testing
        const staticServerPort = await (0, get_port_1.default)();
        const serve = (0, serve_static_1.default)((0, helpers_1.getDataDir)("self-update"));
        server = (0, http_1.createServer)((req, res) => {
            serve(req, res, (0, finalhandler_1.default)(req, res));
        });
        server.listen(staticServerPort);
        command._baseReleasesUrl = `http://127.0.0.1:${staticServerPort}/`;
    });
    beforeEach(async () => {
        tempDir = await (0, fs_1.makeTempDir)();
    });
    afterEach(async () => {
        try {
            if (tempDir) {
                await tempDir.cleanup();
            }
        }
        catch { }
    });
    after(() => {
        server === null || server === void 0 ? void 0 : server.close();
    });
    async function action(args, opts) {
        return command.action({
            garden,
            log: garden.log,
            headerLog: garden.log,
            footerLog: garden.log,
            args,
            opts: (0, helpers_1.withDefaultGlobalOpts)(opts),
        });
    }
    it(`detects the current installation directory if none is provided`, async () => {
        const { result } = await action({ version: "" }, { "force": false, "install-dir": "", "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installationDirectory).to.equal((0, path_1.dirname)(process.execPath));
    });
    it(`uses the specified --install-dir if set`, async () => {
        const { result } = await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installationDirectory).to.equal(tempDir.path);
    });
    it(`aborts if desired version is the same as the current version`, async () => {
        const { result } = await action({ version: (0, util_1.getPackageVersion)() }, { "force": false, "install-dir": "", "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installedVersion).to.be.undefined;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.abortReason).to.equal("Version already installed");
    });
    it(`proceeds if desired version is the same as the current version and --force is set`, async () => {
        const { result } = await action({ version: (0, util_1.getPackageVersion)() }, { "force": true, "install-dir": "", "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installedVersion).to.be.undefined;
        // The command will abort because we're running a dev build
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.abortReason).to.not.equal("Version already installed");
    });
    it(`aborts if trying to run from a dev build`, async () => {
        const { result } = await action({ version: "" }, { "force": true, "install-dir": "", "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installedVersion).to.be.undefined;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.abortReason).to.equal("Not running from binary installation");
    });
    it(`aborts cleanly if desired version isn't found`, async () => {
        const { result } = await action({ version: "foo" }, { "force": true, "install-dir": tempDir.path, "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installedVersion).to.be.undefined;
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.abortReason).to.equal("Version not found");
    });
    it(`installs successfully to an empty --install-dir`, async () => {
        const { result } = await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installedVersion).to.equal("edge");
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.abortReason).to.be.undefined;
        const extracted = await (0, fs_extra_1.readdir)(tempDir.path);
        (0, chai_1.expect)(extracted).to.include("garden");
        (0, chai_1.expect)(extracted).to.include("static");
    });
    it(`installs successfully to an --install-dir with a previous release and creates a backup`, async () => {
        await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "" });
        const { result } = await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installedVersion).to.equal("edge");
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.abortReason).to.be.undefined;
        const extracted = await (0, fs_extra_1.readdir)(tempDir.path);
        (0, chai_1.expect)(extracted).to.include("garden");
        (0, chai_1.expect)(extracted).to.include("static");
        (0, chai_1.expect)(extracted).to.include(".backup");
    });
    it(`installs successfully to an --install-dir with a previous release and overwrites a backup`, async () => {
        await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "" });
        await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "" });
        const { result } = await action({
            version: "edge",
        }, { "force": false, "install-dir": tempDir.path, "platform": "" });
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.installedVersion).to.equal("edge");
        (0, chai_1.expect)(result === null || result === void 0 ? void 0 : result.abortReason).to.be.undefined;
        const extracted = await (0, fs_extra_1.readdir)(tempDir.path);
        (0, chai_1.expect)(extracted).to.include("garden");
        (0, chai_1.expect)(extracted).to.include("static");
        (0, chai_1.expect)(extracted).to.include(".backup");
    });
    it(`handles --platform=windows and zip archives correctly`, async () => {
        await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "windows" });
        const extracted = await (0, fs_extra_1.readdir)(tempDir.path);
        (0, chai_1.expect)(extracted).to.include("garden.exe");
        (0, chai_1.expect)(extracted).to.include("static");
    });
    it(`handles --platform=macos and tar.gz archives correctly`, async () => {
        await action({ version: "edge" }, { "force": false, "install-dir": tempDir.path, "platform": "macos" });
        const extracted = await (0, fs_extra_1.readdir)(tempDir.path);
        (0, chai_1.expect)(extracted).to.include("garden");
        (0, chai_1.expect)(extracted).to.include("static");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZi11cGRhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWxmLXVwZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILGdFQUF1QztBQUN2QyxnRUFBc0M7QUFDdEMsK0JBQTZCO0FBQzdCLHVDQUFrQztBQUNsQyx3REFBOEI7QUFDOUIsK0JBQThCO0FBQzlCLGlEQUF5RDtBQUV6RCxzRUFBd0c7QUFFeEcsZ0RBQW9FO0FBQ3BFLG9EQUE2RDtBQUM3RCw4Q0FBb0U7QUFDcEUsK0JBQTJDO0FBRTNDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7SUFDakMsTUFBTSxPQUFPLEdBQUcsSUFBSSwrQkFBaUIsRUFBRSxDQUFBO0lBRXZDLElBQUksTUFBYyxDQUFBO0lBQ2xCLElBQUksTUFBbUIsQ0FBQTtJQUN2QixJQUFJLE9BQXNCLENBQUE7SUFFMUIsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQWUsRUFBQyxNQUFNLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFbkcsc0VBQXNFO1FBQ3RFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFBLGtCQUFPLEdBQUUsQ0FBQTtRQUN4QyxNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFXLEVBQUMsSUFBQSxvQkFBVSxFQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUE7UUFFcEQsTUFBTSxHQUFHLElBQUEsbUJBQVksRUFBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNqQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFBLHNCQUFZLEVBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDekMsQ0FBQyxD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