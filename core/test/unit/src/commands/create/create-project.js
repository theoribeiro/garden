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
const create_project_1 = require("../../../../../src/commands/create/create-project");
const cli_1 = require("../../../../../src/cli/cli");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const js_yaml_1 = require("js-yaml");
const util_1 = require("../../../../../src/util/util");
describe("CreateProjectCommand", () => {
    const command = new create_project_1.CreateProjectCommand();
    let tmp;
    let garden;
    beforeEach(async () => {
        tmp = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        garden = await (0, cli_1.makeDummyGarden)(tmp.path, { commandInfo: { name: "create project", args: {}, opts: {} } });
    });
    afterEach(async () => {
        await (tmp === null || tmp === void 0 ? void 0 : tmp.cleanup());
    });
    it("should create a project config and a .gardenignore", async () => {
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: undefined,
                filename: create_project_1.defaultProjectConfigFilename,
            }),
        });
        const { name, configPath, ignoreFileCreated, ignoreFilePath } = result;
        (0, chai_1.expect)(name).to.equal((0, path_1.basename)(tmp.path));
        (0, chai_1.expect)(ignoreFileCreated).to.be.true;
        (0, chai_1.expect)(configPath).to.equal((0, path_1.join)(tmp.path, "project.garden.yml"));
        (0, chai_1.expect)(ignoreFilePath).to.equal((0, path_1.join)(tmp.path, ".gardenignore"));
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(configPath)).to.be.true;
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(ignoreFilePath)).to.be.true;
        const parsed = (0, js_yaml_1.safeLoadAll)((await (0, fs_extra_1.readFile)(configPath)).toString());
        (0, chai_1.expect)(parsed).to.eql([
            {
                kind: "Project",
                name,
                environments: [{ name: "default" }],
                providers: [{ name: "local-kubernetes" }],
            },
        ]);
    });
    it("should leave existing .gardenignore if one already exists", async () => {
        const ignoreContent = "node_modules/\n";
        await (0, fs_extra_1.writeFile)((0, path_1.join)(tmp.path, ".gardenignore"), ignoreContent);
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: undefined,
                filename: create_project_1.defaultProjectConfigFilename,
            }),
        });
        const { ignoreFileCreated, ignoreFilePath } = result;
        (0, chai_1.expect)(ignoreFileCreated).to.be.false;
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(ignoreFilePath)).to.be.true;
        (0, chai_1.expect)((await (0, fs_extra_1.readFile)(ignoreFilePath)).toString()).to.equal(ignoreContent);
    });
    it("should copy existing .gitignore to .gardenignore if it exists", async () => {
        const ignoreContent = "node_modules/\n";
        await (0, fs_extra_1.writeFile)((0, path_1.join)(tmp.path, ".gitignore"), ignoreContent);
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: undefined,
                filename: create_project_1.defaultProjectConfigFilename,
            }),
        });
        const { ignoreFileCreated, ignoreFilePath } = result;
        (0, chai_1.expect)(ignoreFileCreated).to.be.true;
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(ignoreFilePath)).to.be.true;
        (0, chai_1.expect)((await (0, fs_extra_1.readFile)(ignoreFilePath)).toString()).to.equal(ignoreContent);
    });
    it("should optionally set a project name", async () => {
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: "foo",
                filename: create_project_1.defaultProjectConfigFilename,
            }),
        });
        const { name, configPath } = result;
        (0, chai_1.expect)(name).to.equal("foo");
        const parsed = (0, js_yaml_1.safeLoadAll)((await (0, fs_extra_1.readFile)(configPath)).toString());
        (0, chai_1.expect)(parsed).to.eql([
            {
                kind: "Project",
                name: "foo",
                environments: [{ name: "default" }],
                providers: [{ name: "local-kubernetes" }],
            },
        ]);
    });
    it("should add to an existing garden.yml if one exists", async () => {
        const existing = {
            kind: "Module",
            type: "foo",
            name: "foo",
        };
        await (0, fs_extra_1.writeFile)((0, path_1.join)(tmp.path, "garden.yml"), (0, util_1.safeDumpYaml)(existing));
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: undefined,
                filename: "garden.yml",
            }),
        });
        const { name, configPath } = result;
        const parsed = (0, js_yaml_1.safeLoadAll)((await (0, fs_extra_1.readFile)(configPath)).toString());
        (0, chai_1.expect)(parsed).to.eql([
            existing,
            {
                kind: "Project",
                name,
                environments: [{ name: "default" }],
                providers: [{ name: "local-kubernetes" }],
            },
        ]);
    });
    it("should allow overriding the default generated filename", async () => {
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: undefined,
                filename: "custom.garden.yml",
            }),
        });
        const { configPath } = result;
        (0, chai_1.expect)(configPath).to.equal((0, path_1.join)(tmp.path, "custom.garden.yml"));
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(configPath)).to.be.true;
    });
    it("should throw if a project is already in the directory", async () => {
        const existing = {
            kind: "Project",
            name: "foo",
        };
        const configPath = (0, path_1.join)(tmp.path, create_project_1.defaultProjectConfigFilename);
        await (0, fs_extra_1.writeFile)(configPath, (0, util_1.safeDumpYaml)(existing));
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: undefined,
                filename: create_project_1.defaultProjectConfigFilename,
            }),
        }), { contains: `A Garden project already exists in ${configPath}` });
    });
    it("should throw if target directory doesn't exist", async () => {
        const dir = (0, path_1.join)(tmp.path, "bla");
        await (0, helpers_1.expectError)(() => command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir,
                interactive: false,
                name: undefined,
                filename: create_project_1.defaultProjectConfigFilename,
            }),
        }), { contains: `Path ${dir} does not exist` });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXByb2plY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGUtcHJvamVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3QixpREFBb0c7QUFDcEcsc0ZBQXNIO0FBQ3RILG9EQUE0RDtBQUU1RCwrQkFBcUM7QUFDckMsdUNBQTBEO0FBQzFELHFDQUFxQztBQUNyQyx1REFBMkQ7QUFFM0QsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtJQUNwQyxNQUFNLE9BQU8sR0FBRyxJQUFJLHFDQUFvQixFQUFFLENBQUE7SUFDMUMsSUFBSSxHQUFrQixDQUFBO0lBQ3RCLElBQUksTUFBYyxDQUFBO0lBRWxCLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixHQUFHLEdBQUcsTUFBTSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQzVELE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQWUsRUFBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUMzRyxDQUFDLENBQUMsQ0FBQTtJQUVGLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLE9BQU8sRUFBRSxDQUFBLENBQUE7SUFDdEIsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0RBQW9ELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDbEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN0QyxNQUFNO1lBQ04sU0FBUyxFQUFFLE1BQU0s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