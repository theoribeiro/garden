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
const chalk_1 = __importDefault(require("chalk"));
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const publish_1 = require("../../../../src/commands/publish");
const helpers_1 = require("../../../helpers");
const helpers_2 = require("../../../helpers");
const lodash_1 = require("lodash");
const config_1 = require("../../../../src/plugins/exec/config");
const plugin_1 = require("../../../../src/plugin/plugin");
const projectRootB = (0, helpers_1.getDataDir)("test-project-b");
const publishAction = async ({ tag }) => {
    return { published: true, identifier: tag };
};
const testProvider = (0, plugin_1.createGardenPlugin)({
    name: "test-plugin",
    createModuleTypes: [
        {
            name: "test",
            docs: "asd",
            needsBuild: true,
            handlers: {
                convert: async (params) => {
                    return {
                        group: {
                            kind: "Group",
                            path: params.module.path,
                            name: params.module.name,
                            actions: [
                                {
                                    kind: "Build",
                                    type: "test",
                                    name: params.module.name,
                                    internal: {
                                        basePath: params.module.path,
                                        groupName: params.module.name,
                                    },
                                    spec: {},
                                },
                            ],
                        },
                    };
                },
            },
        },
    ],
    createActionTypes: {
        Build: [
            {
                name: "test",
                docs: "Test plugin",
                schema: (0, config_1.execBuildActionSchema)(),
                handlers: {
                    publish: async (params) => {
                        return {
                            state: "ready",
                            detail: await publishAction(params),
                            outputs: {},
                        };
                    },
                    build: async (_params) => ({
                        state: "ready",
                        detail: {},
                        outputs: {},
                    }),
                },
            },
        ],
    },
});
async function getTestGarden(plugin = testProvider) {
    const garden = await (0, helpers_1.makeTestGarden)(projectRootB, { plugins: [plugin], onlySpecifiedPlugins: true });
    await garden.clearBuilds();
    return garden;
}
describe("PublishCommand", () => {
    // TODO: Verify that services don't get redeployed when same version is already deployed.
    const command = new publish_1.PublishCommand();
    (0, mocha_1.it)("should build and publish builds in a project", async () => {
        const garden = await getTestGarden();
        const log = garden.log;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "force-build": false,
                "tag": undefined,
            }),
        });
        (0, chai_1.expect)(command.outputsSchema().validate(result).error).to.be.undefined;
        (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
            "publish.module-a": {
                detail: {
                    identifier: undefined,
                    published: true,
                },
                outputs: {},
                state: "ready",
            },
            "publish.module-b": {
                detail: {
                    identifier: undefined,
                    published: true,
                },
                outputs: {},
                state: "ready",
            },
            "publish.module-c": {
                detail: {
                    published: false,
                },
                outputs: {},
                state: "ready",
            },
        });
    });
    (0, mocha_1.it)("should apply the specified tag to the published builds", async () => {
        const garden = await getTestGarden();
        const log = garden.log;
        const tag = "foo";
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "force-build": false,
                "tag": tag,
            }),
        });
        const publishActionResult = (0, helpers_2.taskResultOutputs)(result);
        (0, chai_1.expect)(publishActionResult["publish.module-a"].detail.published).to.be.true;
        (0, chai_1.expect)(publishActionResult["publish.module-a"].detail.identifier).to.equal(tag);
        (0, chai_1.expect)(publishActionResult["publish.module-b"].detail.published).to.be.true;
        (0, chai_1.expect)(publishActionResult["publish.module-b"].detail.identifier).to.equal(tag);
    });
    (0, mocha_1.it)("should resolve a templated tag and apply to the builds", async () => {
        const garden = await getTestGarden();
        const log = garden.log;
        const tag = "v1.0-${module.name}-${module.version}";
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "force-build": false,
                "tag": tag,
            }),
        });
        const publishActionResult = (0, helpers_2.taskResultOutputs)(result);
        const actions = (await garden.getConfigGraph({ log, emit: false })).getBuilds();
        const verA = actions.find((a) => a.name === "module-a").versionString();
        const verB = actions.find((a) => a.name === "module-b").versionString();
        (0, chai_1.expect)(publishActionResult["publish.module-a"].detail.published).to.be.true;
        (0, chai_1.expect)(publishActionResult["publish.module-a"].detail.identifier).to.equal(`v1.0-module-a-${verA}`);
        (0, chai_1.expect)(publishActionResult["publish.module-b"].detail.published).to.be.true;
        (0, chai_1.expect)(publishActionResult["publish.module-b"].detail.identifier).to.equal(`v1.0-module-b-${verB}`);
    });
    (0, mocha_1.it)("should optionally force new build", async () => {
        var _a, _b;
        const garden = await getTestGarden();
        const log = garden.log;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: undefined,
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "force-build": true,
                "tag": undefined,
            }),
        });
        const allResults = (0, helpers_1.getAllTaskResults)(result === null || result === void 0 ? void 0 : result.graphResults);
        // Errors due to a bug in the solver
        (0, chai_1.expect)((_a = allResults["build.module-a"]) === null || _a === void 0 ? void 0 : _a.task.force).to.be.true;
        (0, chai_1.expect)((_b = allResults["build.module-b"]) === null || _b === void 0 ? void 0 : _b.task.force).to.be.true;
    });
    (0, mocha_1.it)("should optionally build a selected build", async () => {
        const garden = await getTestGarden();
        const log = garden.log;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: ["module-a"],
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "force-build": false,
                "tag": undefined,
            }),
        });
        (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
            "publish.module-a": {
                detail: {
                    identifier: undefined,
                    published: true,
                },
                outputs: {},
                state: "ready",
            },
        });
    });
    (0, mocha_1.it)("should respect allowPublish flag", async () => {
        const garden = await getTestGarden();
        const log = garden.log;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: ["module-c"],
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "force-build": false,
                "tag": undefined,
            }),
        });
        (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
            "publish.module-c": {
                detail: {
                    published: false,
                },
                outputs: {},
                state: "ready",
            },
        });
    });
    (0, mocha_1.it)("should fail gracefully if action type does not have a provider for publish", async () => {
        const noHandlerPlugin = (0, lodash_1.cloneDeep)(testProvider);
        delete noHandlerPlugin.createActionTypes.Build[0].handlers.publish;
        const garden = await getTestGarden(noHandlerPlugin);
        const log = garden.log;
        const { result } = await command.action({
            garden,
            log,
            headerLog: log,
            footerLog: log,
            args: {
                names: ["module-a"],
            },
            opts: (0, helpers_1.withDefaultGlobalOpts)({
                "force-build": false,
                "tag": undefined,
            }),
        });
        (0, chai_1.expect)((0, helpers_2.taskResultOutputs)(result)).to.eql({
            "publish.module-a": {
                outputs: {},
                state: "unknown",
                detail: {
                    published: false,
                    message: chalk_1.default.yellow("No publish handler available for type test"),
                },
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInB1Ymxpc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCxrREFBeUI7QUFDekIsaUNBQTBCO0FBQzFCLCtCQUE2QjtBQUM3Qiw4REFBaUU7QUFDakUsOENBQXVHO0FBQ3ZHLDhDQUFvRDtBQUNwRCxtQ0FBa0M7QUFDbEMsZ0VBQTJFO0FBRTNFLDBEQUFnRjtBQUdoRixNQUFNLFlBQVksR0FBRyxJQUFBLG9CQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQTtBQUtqRCxNQUFNLGFBQWEsR0FBRyxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQXVCLEVBQXNDLEVBQUU7SUFDL0YsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFBO0FBQzdDLENBQUMsQ0FBQTtBQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsMkJBQWtCLEVBQUM7SUFDdEMsSUFBSSxFQUFFLGFBQWE7SUFDbkIsaUJBQWlCLEVBQUU7UUFDakI7WUFDRSxJQUFJLEVBQUUsTUFBTTtZQUNaLElBQUksRUFBRSxLQUFLO1lBQ1gsVUFBVSxFQUFFLElBQUk7WUFDaEIsUUFBUSxFQUFFO2dCQUNSLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBMkIsRUFBRSxFQUFFO29CQUM3QyxPQUFPO3dCQUNMLEtBQUssRUFBRTs0QkFDTCxJQUFJLEVBQVcsT0FBTzs0QkFDdEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSTs0QkFDeEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSTs0QkFDeEIsT0FBTyxFQUFFO2dDQUNQO29DQUNFLElBQUksRUFBRSxPQUFPO29DQUNiLElBQUksRUFBRSxNQUFNO29DQUNaLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUk7b0NBQ3hCLFFBQVEsRUFBRTt3Q0FDUixRQUFRLEVBQUUsTUFBTSxD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