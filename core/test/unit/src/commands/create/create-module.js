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
const create_module_1 = require("../../../../../src/commands/create/create-module");
const cli_1 = require("../../../../../src/cli/cli");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const js_yaml_1 = require("js-yaml");
const util_1 = require("../../../../../src/util/util");
const stripAnsi = require("strip-ansi");
const plugins_1 = require("../../../../../src/plugins");
const plugins_2 = require("../../../../../src/plugins/plugins");
const inquirer = require("inquirer");
const fs_1 = require("../../../../../src/util/fs");
const common_1 = require("../../../../../src/plugins/kubernetes/helm/common");
describe("CreateModuleCommand", () => {
    const command = new create_module_1.CreateModuleCommand();
    let tmp;
    let garden;
    beforeEach(async () => {
        tmp = await (0, helpers_1.makeTempDir)({ git: true, initialCommit: false });
        garden = await (0, cli_1.makeDummyGarden)(tmp.path, { commandInfo: { name: "create module", args: {}, opts: {} } });
    });
    afterEach(async () => {
        await (tmp === null || tmp === void 0 ? void 0 : tmp.cleanup());
    });
    it("should create a module config", async () => {
        const dir = (0, path_1.join)(tmp.path, "test");
        await (0, fs_extra_1.mkdirp)(dir);
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir,
                interactive: false,
                name: undefined,
                type: "exec",
                filename: fs_1.defaultConfigFilename,
            }),
        });
        const { name, configPath } = result;
        (0, chai_1.expect)(name).to.equal("test");
        (0, chai_1.expect)(configPath).to.equal((0, path_1.join)(dir, "garden.yml"));
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(configPath)).to.be.true;
        const parsed = (0, js_yaml_1.safeLoadAll)((await (0, fs_extra_1.readFile)(configPath)).toString());
        (0, chai_1.expect)(parsed).to.eql([
            {
                kind: "Module",
                name,
                type: "exec",
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
                name: "test",
                type: "exec",
                filename: "custom.garden.yml",
            }),
        });
        const { configPath } = result;
        (0, chai_1.expect)(configPath).to.equal((0, path_1.join)(tmp.path, "custom.garden.yml"));
        (0, chai_1.expect)(await (0, fs_extra_1.pathExists)(configPath)).to.be.true;
    });
    it("should optionally set a module name", async () => {
        const { result } = await command.action({
            garden,
            footerLog: garden.log,
            headerLog: garden.log,
            log: garden.log,
            args: {},
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                dir: tmp.path,
                interactive: false,
                name: "test",
                type: "exec",
                filename: fs_1.defaultConfigFilename,
            }),
        });
        const { name, configPath } = result;
        (0, chai_1.expect)(name).to.equal("test");
        const parsed = (0, js_yaml_1.safeLoadAll)((await (0, fs_extra_1.readFile)(configPath)).toString());
        (0, chai_1.expect)(parsed).to.eql([
            {
                kind: "Module",
                name: "test",
                type: "exec",
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
                name: "test",
                type: "exec",
                filename: fs_1.defaultConfigFilename,
            }),
        });
        const { name, configPath } = result;
        const parsed = (0, js_yaml_1.safeLoadAll)((await (0, fs_extra_1.readFile)(configPath)).toString());
        (0, chai_1.expect)(parsed).to.eql([
            existing,
            {
                kind: "Module",
                name,
                type: "exec",
            },
        ]);
    });
    it("should throw if a module with the same name is already in the directory", async () => {
        const existing = {
            kind: "Module",
            name: "test",
            type: "exec",
        };
        const configPath = (0, path_1.join)(tmp.path, "garden.yml");
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
                name: "test",
                type: "exec",
                filename: fs_1.defaultConfigFilename,
            }),
        }), {
            contains: `A Garden module named test already exists in ${configPath}`,
        });
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
                name: "test",
                type: "exec",
                filename: fs_1.defaultConfigFilename,
            }),
        }), { contains: `Path ${dir} does not exist` });
    });
    it("should throw if the module type doesn't exist", async () => {
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
                type: "foo",
                filename: fs_1.defaultConfigFilename,
            }),
        }), { contains: "Could not find module type foo" });
    });
    describe("getModuleTypeSuggestions", () => {
        const moduleTypes = (0, plugins_1.getModuleTypes)((0, plugins_2.getSupportedPlugins)().map((f) => f.callback()));
        it("should return a list of all supported module types", async () => {
            const result = await (0, create_module_1.getModuleTypeSuggestions)(garden.log, moduleTypes, tmp.path, "test");
            (0, chai_1.expect)(result).to.eql([
                ...Object.keys(moduleTypes).map((type) => ({ name: type, value: { kind: "Module", type, name: "test" } })),
            ]);
        });
        it("should include suggestions from providers if applicable", async () => {
            await (0, fs_extra_1.writeFile)((0, path_1.join)(tmp.path, "Dockerfile"), "");
            await (0, fs_extra_1.writeFile)((0, path_1.join)(tmp.path, common_1.helmChartYamlFilename), "");
            await (0, fs_extra_1.writeFile)((0, path_1.join)(tmp.path, "foo.tf"), "");
            const result = await (0, create_module_1.getModuleTypeSuggestions)(garden.log, moduleTypes, tmp.path, "test");
            const stripped = result.map((r) => (r instanceof inquirer.Separator ? r : { ...r, name: stripAnsi(r.name) }));
            (0, chai_1.expect)(stripped).to.eql([
                {
                    name: "container (based on found Dockerfile, suggested by container)",
                    short: "container",
                    value: {
                        kind: "Module",
                        type: "container",
                        name: "test",
                        dockerfile: "Dockerfile",
                    },
                },
                {
                    name: "helm (based on found Chart.yaml, suggested by kubernetes)",
                    short: "helm",
                    value: { type: "helm", name: "test", chartPath: "." },
                },
                new inquirer.Separator(),
                ...Object.keys(moduleTypes).map((type) => ({ name: type, value: { kind: "Module", type, name: "test" } })),
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNyZWF0ZS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsaURBQW9HO0FBQ3BHLG9GQUFnSDtBQUNoSCxvREFBNEQ7QUFFNUQsK0JBQTJCO0FBQzNCLHVDQUFrRTtBQUNsRSxxQ0FBcUM7QUFDckMsdURBQTJEO0FBQzNELHdDQUF3QztBQUN4Qyx3REFBMkQ7QUFDM0QsZ0VBQXdFO0FBQ3hFLHFDQUFxQztBQUNyQyxtREFBa0U7QUFDbEUsOEVBQXlGO0FBRXpGLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkMsTUFBTSxPQUFPLEdBQUcsSUFBSSxtQ0FBbUIsRUFBRSxDQUFBO0lBQ3pDLElBQUksR0FBa0IsQ0FBQTtJQUN0QixJQUFJLE1BQWMsQ0FBQTtJQUVsQixVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDcEIsR0FBRyxHQUFHLE1BQU0sSUFBQSxxQkFBVyxFQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUM1RCxNQUFNLEdBQUcsTUFBTSxJQUFBLHFCQUFlLEVBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQzFHLENBQUMsQ0FBQyxDQUFBO0lBRUYsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLE1BQU0sQ0FBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsT0FBTyxFQUFFLENBQUEsQ0FBQTtJQUN0QixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3QyxNQUFNLEdBQUcsR0FBRyxJQUFBLFdBQUksRUFBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2xDLE1BQU0sSUFBQSxpQkFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRWpCLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDdEMsTUFBTTtZQUNOLFNBQVMsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNyQixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDckIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1lBQ2YsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztnQkFDMUIsR0FBRztnQkFDSCxXQUFXLEVBQUUsS0FBSztnQkFDbEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsSUFBSSxFQUFFLE1BQU07Z0JBQ1osUUFBUSxFQUFFLDBCQUFxQjthQUNoQyxDQUFDO1NBQ0gsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFPLENBQUE7UUFFcEMsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUM3QixJQUFBLGFBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUEsV0FBSSxFQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFBO1FBQ3BELElBQUEsYUFBTSxFQUFDLE1BQU0sSUFBQSxxQkFBVSxFQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFFL0MsTUFBTSxNQUFNLEdBQUcsSUFBQSxxQkFBVyxFQUFDLENBQUMsTUFBTSxJQUFBLG1CQUFRLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBRW5FLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDcEI7Z0JBQ0UsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSTtnQkFDSixJQUFJLEVBQUUsTUFBTTthQUNiO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN0QyxNQUFNO1lBQ04sU0FBUyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1lBQ3JCLFNBQVMsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNyQixHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDZixJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxJQUFBLCtCQUFxQixFQUFDO2dCQUMxQixHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUk7Z0JBQ2IsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxNQUFNO2dCQUNaLFFBQVEsRUFBRSxtQkFBbUI7YUFDOUIsQ0FBQztTQUNILENBQUMsQ0FBQTtRQUNGLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFPLENBQUE7UUFFOUIsSUFBQSxhQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFBLFdBQUksRUFBQyxHQUFHLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQTtRQUNoRSxJQUFBLGFBQU0sRUFBQyxNQUFNLElBQUEscUJBQVUsRUFBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFBO0lBQ2pELENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ25ELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDdEMsTUFBTTtZQUNOLFNBQVMsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNyQixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDckIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1lBQ2YsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztnQkFDMUIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJO2dCQUNiLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsTUFBTTtnQkFDWixRQUFRLEVBQUUsMEJBQXFCO2FBQ2hDLENBQUM7U0FDSCxDQUFDLENBQUE7UUFDRixNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLE1BQU8sQ0FBQTtRQUVwQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUEscUJBQVcsRUFBQyxDQUFDLE1BQU0sSUFBQSxtQkFBUSxFQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNuRSxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ3BCO2dCQUNFLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxNQUFNO2FBQ2I7U0FDRixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsRSxNQUFNLFFBQVEsR0FBRztZQUNmLElBQUksRUFBRSxRQUFRO1lBQ2QsSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUUsS0FBSztTQUNaLENBQUE7UUFDRCxNQUFNLElBQUEsb0JBQVMsRUFBQyxJQUFBLFdBQUksRUFBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxFQUFFLElBQUEsbUJBQVksRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBRXJFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDdEMsTUFBTTtZQUNOLFNBQVMsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNyQixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDckIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1lBQ2YsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztnQkFDMUIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJO2dCQUNiLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsTUFBTTtnQkFDWixRQUFRLEVBQUUsMEJBQXFCO2FBQ2hDLENBQUM7U0FDSCxDQUFDLENBQUE7UUFDRixNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLE1BQU8sQ0FBQTtRQUVwQyxNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFXLEVBQUMsQ0FBQyxNQUFNLElBQUEsbUJBQVEsRUFBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDbkUsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUNwQixRQUFRO1lBQ1I7Z0JBQ0UsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSTtnQkFDSixJQUFJLEVBQUUsTUFBTTthQUNiO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMseUVBQXlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdkYsTUFBTSxRQUFRLEdBQUc7WUFDZixJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxNQUFNO1lBQ1osSUFBSSxFQUFFLE1BQU07U0FDYixDQUFBO1FBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBQSxXQUFJLEVBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQTtRQUMvQyxNQUFNLElBQUEsb0JBQVMsRUFBQyxVQUFVLEVBQUUsSUFBQSxtQkFBWSxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7UUFFbkQsTUFBTSxJQUFBLHFCQUFXLEVBQ2YsR0FBRyxFQUFFLENBQ0gsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNiLE1BQU07WUFDTixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDckIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1lBQ3JCLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNmLElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUM7Z0JBQzFCLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSTtnQkFDYixXQUFXLEVBQUUsS0FBSztnQkFDbEIsSUFBSSxFQUFFLE1BQU07Z0JBQ1osSUFBSSxFQUFFLE1BQU07Z0JBQ1osUUFBUSxFQUFFLDBCQUFxQjthQUNoQyxDQUFDO1NBQ0gsQ0FBQyxFQUNKO1lBQ0UsUUFBUSxFQUFFLGdEQUFnRCxVQUFVLEVBQUU7U0FDdkUsQ0FDRixDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsZ0RBQWdELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDOUQsTUFBTSxHQUFHLEdBQUcsSUFBQSxXQUFJLEVBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNqQyxNQUFNLElBQUEscUJBQVcsRUFDZixHQUFHLEVBQUUsQ0FDSCxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ2IsTUFBTTtZQUNOLFNBQVMsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNyQixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDckIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1lBQ2YsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBQSwrQkFBcUIsRUFBQztnQkFDMUIsR0FBRztnQkFDSCxXQUFXLEVBQUUsS0FBSztnQkFDbEIsSUFBSSxFQUFFLE1BQU07Z0JBQ1osSUFBSSxFQUFFLE1BQU07Z0JBQ1osUUFBUSxFQUFFLDBCQUFxQjthQUNoQyxDQUFDO1NBQ0gsQ0FBQyxFQUNKLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRyxpQkFBaUIsRUFBRSxDQUMzQyxDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0NBQStDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDN0QsTUFBTSxJQUFBLHFCQUFXLEVBQ2YsR0FBRyxFQUFFLENBQ0gsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNiLE1BQU07WUFDTixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDckIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1lBQ3JCLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRztZQUNmLElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLElBQUEsK0JBQXFCLEVBQUM7Z0JBQzFCLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSTtnQkFDYixXQUFXLEVBQUUsS0FBSztnQkFDbEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsUUFBUSxFQUFFLDBCQUFxQjthQUNoQyxDQUFDO1NBQ0gsQ0FBQyxFQUNKLEVBQUUsUUFBUSxFQUFFLGdDQUFnQyxFQUFFLENBQy9DLENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsTUFBTSxXQUFXLEdBQUcsSUFBQSx3QkFBYyxFQUFDLElBQUEsNkJBQW1CLEdBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFFbEYsRUFBRSxDQUFDLG9EQUFvRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3Q0FBd0IsRUFBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRXhGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BCLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDM0csQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMseURBQXlELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkUsTUFBTSxJQUFBLG9CQUFTLEVBQUMsSUFBQSxXQUFJLEVBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNqRCxNQUFNLElBQUEsb0JBQVMsRUFBQyxJQUFBLFdBQUksRUFBQyxHQUFHLENBQUMsSUFBSSxFQUFFLDhCQUFxQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDMUQsTUFBTSxJQUFBLG9CQUFTLEVBQUMsSUFBQSxXQUFJLEVBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUU3QyxNQUFNLE1BQU0sR0FBUSxNQUFNLElBQUEsd0NBQXdCLEVBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUU3RixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFFN0csSUFBQSxhQUFNLEVBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDdEI7b0JBQ0UsSUFBSSxFQUFFLCtEQUErRDtvQkFDckUsS0FBSyxFQUFFLFdBQVc7b0JBQ2xCLEtBQUssRUFBRTt3QkFDTCxJQUFJLEVBQUUsUUFBUTt3QkFDZCxJQUFJLEVBQUUsV0FBVzt3QkFDakIsSUFBSSxFQUFFLE1BQU07d0JBQ1osVUFBVSxFQUFFLFlBQVk7cUJBQ3pCO2lCQUNGO2dCQUNEO29CQUNFLElBQUksRUFBRSwyREFBMkQ7b0JBQ2pFLEtBQUssRUFBRSxNQUFNO29CQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFO2lCQUN0RDtnQkFDRCxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUU7Z0JBQ3hCLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDM0csQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=