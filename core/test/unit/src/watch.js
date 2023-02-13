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
const path_1 = require("path");
const chai_1 = require("chai");
const p_event_1 = __importDefault(require("p-event"));
const helpers_1 = require("../../helpers");
const cache_1 = require("../../../src/cache");
const fs_extra_1 = require("fs-extra");
const module_1 = require("../../../src/commands/link/module");
const source_1 = require("../../../src/commands/link/source");
const util_1 = require("../../../src/util/util");
function emitEvent(garden, name, payload) {
    garden["watcher"]["watcher"].emit(name, payload);
}
describe.skip("Watcher", () => {
    let garden;
    let modulePath;
    let doubleModulePath;
    let includeModulePath;
    let moduleContext;
    before(async () => {
        garden = await (0, helpers_1.makeTestGarden)((0, helpers_1.getDataDir)("test-project-watch"), { noTempDir: true, noCache: true });
        modulePath = (0, path_1.resolve)(garden.projectRoot, "module-a");
        doubleModulePath = (0, path_1.resolve)(garden.projectRoot, "double-module");
        includeModulePath = (0, path_1.resolve)(garden.projectRoot, "with-include");
        moduleContext = (0, cache_1.pathToCacheContext)(modulePath);
        await garden.startWatcher({
            graph: await garden.getConfigGraph({ log: garden.log, emit: false, noCache: true }),
            bufferInterval: 10,
        });
        await waitUntilReady(garden);
    });
    beforeEach(async () => {
        garden.events.clearLog();
        garden["watcher"]["addBuffer"] = {};
    });
    afterEach(async () => {
        // Wait for processing to complete
        await waitForProcessing();
    });
    after(async () => {
        await garden.close();
    });
    async function waitUntilReady(_garden) {
        if (_garden["watcher"].ready) {
            return;
        }
        return (0, p_event_1.default)(_garden["watcher"], "ready", { timeout: 5000 });
    }
    async function waitForEvent(name) {
        return (0, p_event_1.default)(garden.events, name, { timeout: 5000 });
    }
    async function waitForProcessing() {
        while (garden["watcher"].processing) {
            await (0, util_1.sleep)(100);
        }
    }
    function getEventLog() {
        // Filter out task events, which come from module resolution
        return garden.events.eventLog.filter((e) => !e.name.startsWith("task"));
    }
    function getConfigFilePath(path) {
        return (0, path_1.join)(path, "garden.yml");
    }
    it("should emit a actionConfigChanged changed event when module config is changed", async () => {
        const path = getConfigFilePath(modulePath);
        emitEvent(garden, "change", path);
        (0, chai_1.expect)(getEventLog()).to.eql([{ name: "actionConfigChanged", payload: { names: ["module-a"], path } }]);
    });
    it("should emit a actionConfigChanged event when module config is changed and include field is set", async () => {
        const path = getConfigFilePath(includeModulePath);
        emitEvent(garden, "change", path);
        (0, chai_1.expect)(getEventLog()).to.eql([
            {
                name: "actionConfigChanged",
                payload: { names: ["with-include"], path },
            },
        ]);
    });
    it("should clear all module caches when a module config is changed", async () => {
        const path = getConfigFilePath(modulePath);
        emitEvent(garden, "change", path);
        (0, chai_1.expect)(garden.cache.getByContext(moduleContext)).to.eql(new Map());
    });
    it("should emit a projectConfigChanged changed event when project config is changed", async () => {
        const path = getConfigFilePath(garden.projectRoot);
        emitEvent(garden, "change", path);
        (0, chai_1.expect)(getEventLog()).to.eql([{ name: "projectConfigChanged", payload: {} }]);
    });
    it("should emit a projectConfigChanged changed event when project config is removed", async () => {
        const path = getConfigFilePath(garden.projectRoot);
        emitEvent(garden, "unlink", path);
        await waitForEvent("projectConfigChanged");
        (0, chai_1.expect)(getEventLog()).to.eql([{ name: "projectConfigChanged", payload: {} }]);
    });
    it("should emit a projectConfigChanged changed event when ignore files are changed", async () => {
        const path = (0, path_1.join)(getConfigFilePath(garden.projectRoot), ".gardenignore");
        emitEvent(garden, "change", path);
        (0, chai_1.expect)(getEventLog()).to.eql([{ name: "projectConfigChanged", payload: {} }]);
    });
    it("should clear all module caches when project config is changed", async () => {
        const path = getConfigFilePath(garden.projectRoot);
        emitEvent(garden, "change", path);
        (0, chai_1.expect)(garden.cache.getByContext(moduleContext)).to.eql(new Map());
    });
    it("should emit a configAdded event when adding a garden.yml file", async () => {
        const path = getConfigFilePath((0, path_1.join)(garden.projectRoot, "module-b"));
        emitEvent(garden, "add", path);
        (0, chai_1.expect)(await waitForEvent("configAdded")).to.eql({ path });
    });
    it("should emit a configRemoved event when removing a garden.yml file", async () => {
        const path = getConfigFilePath((0, path_1.join)(garden.projectRoot, "module-a"));
        emitEvent(garden, "unlink", path);
        await waitForEvent("configRemoved");
        (0, chai_1.expect)(getEventLog()).to.eql([{ name: "configRemoved", payload: { path } }]);
    });
    context("should emit a actionSourcesChanged event", () => {
        it("containing the module's name when one of its files is changed", async () => {
            const pathsChanged = [(0, path_1.resolve)(modulePath, "foo.txt")];
            emitEvent(garden, "change", pathsChanged[0]);
            (0, chai_1.expect)(getEventLog()).to.eql([
                {
                    name: "actionSourcesChanged",
                    payload: { names: ["module-a"], pathsChanged },
                },
            ]);
        });
        it("if a file is changed and it matches a module's include list", async () => {
            const pathsChanged = [(0, path_1.resolve)(includeModulePath, "subdir", "foo2.txt")];
            emitEvent(garden, "change", pathsChanged[0]);
            (0, chai_1.expect)(getEventLog()).to.eql([
                {
                    name: "actionSourcesChanged",
                    payload: { names: ["with-include"], pathsChanged },
                },
            ]);
        });
        it("if a file is added to a module", async () => {
            const path = (0, path_1.resolve)(modulePath, "new.txt");
            try {
                await (0, fs_extra_1.writeFile)(path, "foo");
                (0, chai_1.expect)(await waitForEvent("actionSourcesChanged")).to.eql({
                    names: ["module-a"],
                    pathsChanged: [path],
                });
            }
            finally {
                const exists = await (0, fs_extra_1.pathExists)(path);
                exists && (await (0, fs_extra_1.remove)(path));
            }
        });
        it("containing both modules' names when a source file is changed for two co-located modules", async () => {
            const pathsChanged = [(0, path_1.resolve)(doubleModulePath, "foo.txt")];
            emitEvent(garden, "change", pathsChanged[0]);
            const event = getEventLog()[0];
            event.payload.names = event.payload.names.sort();
            (0, chai_1.expect)(event).to.eql({
                name: "actionSourcesChanged",
                payload: { names: ["module-b", "module-c"], pathsChanged },
            });
        });
    });
    it("should not emit actionSourcesChanged if file is changed and matches the modules.exclude list", async () => {
        const pathChanged = (0, path_1.resolve)(includeModulePath, "project-excluded.txt");
        emitEvent(garden, "change", pathChanged);
        (0, chai_1.expect)(getEventLog()).to.eql([]);
    });
    it("should not emit actionSourcesChanged if file is changed and doesn't match module's include list", async () => {
        const pathChanged = (0, path_1.resolve)(includeModulePath, "foo.txt");
        emitEvent(garden, "change", pathChanged);
        (0, chai_1.expect)(getEventLog()).to.eql([]);
    });
    it("should not emit actionSourcesChanged if file is changed and it's in a gardenignore in the module", async () => {
        const pathChanged = (0, path_1.resolve)(modulePath, "module-excluded.txt");
        emitEvent(garden, "change", pathChanged);
        (0, chai_1.expect)(getEventLog()).to.eql([]);
    });
    it("should not emit actionSourcesChanged if file is changed and it's in a gardenignore in the project", async () => {
        const pathChanged = (0, path_1.resolve)(modulePath, "gardenignore-excluded.txt");
        emitEvent(garden, "change", pathChanged);
        (0, chai_1.expect)(getEventLog()).to.eql([]);
    });
    it("should clear a module's cache when a module file is changed", async () => {
        const pathChanged = (0, path_1.resolve)(modulePath, "foo.txt");
        emitEvent(garden, "change", pathChanged);
        (0, chai_1.expect)(garden.cache.getByContext(moduleContext)).to.eql(new Map());
    });
    it("should emit a configAdded event when a directory is added that contains a garden.yml file", async () => {
        emitEvent(garden, "addDir", modulePath);
        (0, chai_1.expect)(await waitForEvent("configAdded")).to.eql({
            path: getConfigFilePath(modulePath),
        });
    });
    it("should emit a actionSourcesChanged event when a directory is added under a module directory", async () => {
        const pathsChanged = [(0, path_1.resolve)(modulePath, "subdir")];
        emitEvent(garden, "addDir", pathsChanged[0]);
        (0, chai_1.expect)(await waitForEvent("actionSourcesChanged")).to.eql({
            names: ["module-a"],
            pathsChanged,
        });
    });
    it("should clear a module's cache when a directory is added under a module directory", async () => {
        const pathChanged = (0, path_1.resolve)(modulePath, "subdir");
        emitEvent(garden, "addDir", pathChanged);
        await waitForEvent("actionSourcesChanged");
        (0, chai_1.expect)(garden.cache.getByContext(moduleContext)).to.eql(new Map());
    });
    it("should emit a moduleRemoved event if a directory containing a module is removed", async () => {
        emitEvent(garden, "unlinkDir", modulePath);
        await waitForEvent("moduleRemoved");
        (0, chai_1.expect)(getEventLog()).to.eql([{ name: "moduleRemoved", payload: {} }]);
    });
    it("should emit a actionSourcesChanged event if a directory within a module is removed", async () => {
        const pathsChanged = [(0, path_1.resolve)(modulePath, "subdir")];
        emitEvent(garden, "unlinkDir", pathsChanged[0]);
        await waitForEvent("actionSourcesChanged");
        (0, chai_1.expect)(getEventLog()).to.eql([
            {
                name: "actionSourcesChanged",
                payload: { names: ["module-a"], pathsChanged },
            },
        ]);
    });
    it("should emit a actionSourcesChanged event if a module's file is removed", async () => {
        const pathsChanged = [(0, path_1.resolve)(modulePath, "foo.txt")];
        emitEvent(garden, "unlink", pathsChanged[0]);
        await waitForEvent("actionSourcesChanged");
        (0, chai_1.expect)(getEventLog()).to.eql([
            {
                name: "actionSourcesChanged",
                payload: { names: ["module-a"], pathsChanged },
            },
        ]);
    });
    // Note: This is to ensure correct handling of version file lists and cache invalidation
    it("should correctly handle removing a file and then re-adding it", async () => {
        const pathsChanged = [(0, path_1.resolve)(modulePath, "foo.txt")];
        emitEvent(garden, "unlink", pathsChanged[0]);
        await waitForEvent("actionSourcesChanged");
        (0, chai_1.expect)(getEventLog()).to.eql([
            {
                name: "actionSourcesChanged",
                payload: { names: ["module-a"], pathsChanged },
            },
        ]);
        garden.events.eventLog = [];
        emitEvent(garden, "add", pathsChanged[0]);
        await waitForEvent("actionSourcesChanged");
        (0, chai_1.expect)(getEventLog()).to.eql([
            {
                name: "actionSourcesChanged",
                payload: { names: ["module-a"], pathsChanged },
            },
        ]);
    });
    context("linked module sources", () => {
        let localModuleSourceDir;
        let localModulePathA;
        let localModulePathB;
        before(async () => {
            await garden.close();
            garden = await (0, helpers_1.makeExtModuleSourcesGarden)({ noCache: true });
            localModuleSourceDir = garden.projectRoot;
            localModulePathA = (0, path_1.join)(localModuleSourceDir, "module-a");
            localModulePathB = (0, path_1.join)(localModuleSourceDir, "module-b");
            // Link some modules
            const linkCmd = new module_1.LinkModuleCommand();
            await linkCmd.action({
                garden,
                log: garden.log,
                headerLog: garden.log,
                footerLog: garden.log,
                args: {
                    module: "module-a",
                    path: localModulePathA,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            await linkCmd.action({
                garden,
                log: garden.log,
                headerLog: garden.log,
                footerLog: garden.log,
                args: {
                    module: "module-b",
                    path: localModulePathB,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            // We need to make a new instance of Garden after linking the sources
            // This is not an issue in practice because there are specific commands just for linking
            // so the user will always have a new instance of Garden when they run their next command.
            garden = await (0, helpers_1.makeExtModuleSourcesGarden)({ noCache: true });
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false, noCache: true });
            await garden.startWatcher({ graph });
            await waitUntilReady(garden);
        });
        after(async () => {
            await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
        });
        it("should watch all linked repositories", () => {
            const watcher = garden["watcher"]["watcher"];
            const shouldWatch = [garden.projectRoot, localModulePathA, localModulePathB];
            const watched = Object.keys(watcher.getWatched());
            (0, chai_1.expect)(shouldWatch.every((path) => watched.includes(path)), "Watched: " + watched.join(", ")).to.be.true;
        });
        it("should emit a actionSourcesChanged event when a linked module source is changed", async () => {
            const pathsChanged = [(0, path_1.resolve)(localModulePathA, "foo.txt")];
            emitEvent(garden, "change", pathsChanged[0]);
            await (0, util_1.sleep)(1000);
            await waitForProcessing();
            (0, chai_1.expect)(getEventLog()).to.eql([
                {
                    name: "actionSourcesChanged",
                    payload: { names: ["module-a"], pathsChanged },
                },
            ]);
        });
    });
    context("linked project sources", () => {
        let localProjectSourceDir;
        let localSourcePathA;
        let localSourcePathB;
        before(async () => {
            await garden.close();
            garden = await (0, helpers_1.makeExtProjectSourcesGarden)({ noCache: true });
            localProjectSourceDir = (0, helpers_1.getDataDir)("test-project-local-project-sources");
            localSourcePathA = (0, path_1.join)(localProjectSourceDir, "source-a");
            localSourcePathB = (0, path_1.join)(localProjectSourceDir, "source-b");
            // Link some projects
            const linkCmd = new source_1.LinkSourceCommand();
            await linkCmd.action({
                garden,
                log: garden.log,
                headerLog: garden.log,
                footerLog: garden.log,
                args: {
                    source: "source-a",
                    path: localSourcePathA,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            await linkCmd.action({
                garden,
                log: garden.log,
                headerLog: garden.log,
                footerLog: garden.log,
                args: {
                    source: "source-b",
                    path: localSourcePathB,
                },
                opts: (0, helpers_1.withDefaultGlobalOpts)({}),
            });
            // We need to make a new instance of Garden after linking the sources
            // This is not an issue in practice because there are specific commands just for linking
            // so the user will always have a new instance of Garden when they run their next command.
            garden = await (0, helpers_1.makeExtProjectSourcesGarden)({ noCache: true });
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false, noCache: true });
            await garden.startWatcher({ graph });
            await waitUntilReady(garden);
        });
        after(async () => {
            await (0, helpers_1.resetLocalConfig)(garden.gardenDirPath);
        });
        it("should watch all linked repositories", () => {
            const watcher = garden["watcher"]["watcher"];
            const shouldWatch = [garden.projectRoot, localSourcePathA, localSourcePathB];
            const watched = Object.keys(watcher.getWatched());
            (0, chai_1.expect)(shouldWatch.every((path) => watched.includes(path)), "Watched: " + watched.join(", ")).to.be.true;
        });
        it("should emit a actionSourcesChanged event when a linked project source is changed", async () => {
            const pathsChanged = [(0, path_1.resolve)(localProjectSourceDir, "source-a", "module-a", "foo.txt")];
            emitEvent(garden, "change", pathsChanged[0]);
            (0, chai_1.expect)(getEventLog()).to.eql([
                {
                    name: "actionSourcesChanged",
                    payload: { names: ["module-a"], pathsChanged },
                },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7OztBQUVILCtCQUFvQztBQUNwQywrQkFBNkI7QUFDN0Isc0RBQTRCO0FBRTVCLDJDQVFzQjtBQUN0Qiw4Q0FBcUU7QUFDckUsdUNBQXdEO0FBQ3hELDhEQUFxRTtBQUNyRSw4REFBcUU7QUFDckUsaURBQThDO0FBRzlDLFNBQVMsU0FBUyxDQUFDLE1BQWtCLEVBQUUsSUFBWSxFQUFFLE9BQVk7SUFDL0QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFDbkQsQ0FBQztBQUVELFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtJQUM1QixJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxVQUFrQixDQUFBO0lBQ3RCLElBQUksZ0JBQXdCLENBQUE7SUFDNUIsSUFBSSxpQkFBeUIsQ0FBQTtJQUM3QixJQUFJLGFBQTJCLENBQUE7SUFFL0IsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxJQUFBLG9CQUFVLEVBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7UUFDbkcsVUFBVSxHQUFHLElBQUEsY0FBTyxFQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDcEQsZ0JBQWdCLEdBQUcsSUFBQSxjQUFPLEVBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQTtRQUMvRCxpQkFBaUIsR0FBRyxJQUFBLGNBQU8sRUFBQyxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFBO1FBQy9ELGFBQWEsR0FBRyxJ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