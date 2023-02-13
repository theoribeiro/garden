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
const common_1 = require("../../../src/config/common");
const logger_1 = require("../../../src/logger/logger");
const plugin_1 = require("../../../src/plugin/plugin");
const plugins_1 = require("../../../src/plugins");
const helpers_1 = require("../../helpers");
describe("resolvePlugins", () => {
    const log = (0, logger_1.getLogger)().placeholder();
    it("throws if action type staticOutputsSchema and runtimeOutputsSchema have overlapping keys", async () => {
        const plugin = (0, plugin_1.createGardenPlugin)({ name: "test" });
        plugin.createActionTypes.Build = [
            {
                name: "test",
                docs: "foo",
                schema: common_1.joi.object(),
                staticOutputsSchema: common_1.joi.object().keys({
                    commonKey: common_1.joi.string(),
                }),
                runtimeOutputsSchema: common_1.joi.object().keys({
                    commonKey: common_1.joi.string(),
                }),
                handlers: {},
            },
        ];
        await (0, helpers_1.expectError)(async () => (0, plugins_1.resolvePlugins)(log, { test: plugin }, [{ name: "test" }]), {
            contains: "has overlapping keys in staticoutputsschema and runtimeoutputsschema",
        });
    });
    it("throws if action type staticOutputsSchema allows unknown keys", async () => {
        const plugin = (0, plugin_1.createGardenPlugin)({ name: "test" });
        plugin.createActionTypes.Build = [
            {
                name: "test",
                docs: "foo",
                schema: common_1.joi.object(),
                staticOutputsSchema: common_1.joi
                    .object()
                    .keys({
                    foo: common_1.joi.string(),
                })
                    .unknown(true),
                handlers: {},
            },
        ];
        await (0, helpers_1.expectError)(async () => (0, plugins_1.resolvePlugins)(log, { test: plugin }, [{ name: "test" }]), {
            contains: "allows unknown keys in the staticoutputsschema",
        });
    });
    it("inherits created action type from base plugin", async () => {
        var _a;
        const base = (0, plugin_1.createGardenPlugin)({ name: "base" });
        base.createActionTypes.Build = [
            {
                name: "base",
                docs: "foo",
                schema: common_1.joi.object(),
                handlers: {
                    build: async ({}) => ({
                        detail: {},
                        outputs: {
                            foo: "bar",
                        },
                        state: "ready",
                    }),
                },
            },
        ];
        const dependant = (0, plugin_1.createGardenPlugin)({ name: "dependant", base: "base" });
        const result = (0, plugins_1.resolvePlugins)(log, { base, dependant }, [{ name: "test" }]);
        const inheritedActionType = (_a = result.find((plugin) => plugin.name === "dependant")) === null || _a === void 0 ? void 0 : _a.createActionTypes.Build[0];
        (0, chai_1.expect)(inheritedActionType).to.exist;
        (0, chai_1.expect)(inheritedActionType === null || inheritedActionType === void 0 ? void 0 : inheritedActionType.name).to.eql("base");
    });
    it("throws if redefining an action type created in base", async () => {
        const base = (0, plugin_1.createGardenPlugin)({ name: "base" });
        base.createActionTypes.Build = [
            {
                name: "base",
                docs: "foo",
                schema: common_1.joi.object(),
                handlers: {
                    build: async ({}) => ({
                        detail: {},
                        outputs: {
                            foo: "bar",
                        },
                        state: "ready",
                    }),
                },
            },
        ];
        const dependant = (0, plugin_1.createGardenPlugin)({ name: "dependant", base: "base" });
        dependant.createActionTypes.Build = [
            {
                name: "base",
                docs: "foo",
                schema: common_1.joi.object(),
                handlers: {
                    build: async ({}) => ({
                        detail: {},
                        outputs: {
                            foo: "bar",
                        },
                        state: "ready",
                    }),
                },
            },
        ];
        await (0, helpers_1.expectError)(async () => (0, plugins_1.resolvePlugins)(log, { base, dependant }, [{ name: "test" }]), {
            contains: "plugin 'dependant' redeclares the 'base' build type, already declared by its base.",
        });
    });
    it("inherits action type extension from base plugin", async () => {
        var _a;
        const base = (0, plugin_1.createGardenPlugin)({ name: "base" });
        base.createActionTypes.Build = [
            {
                name: "base",
                docs: "asd",
                schema: common_1.joi.object(),
                handlers: {
                    build: async ({}) => ({
                        detail: {},
                        outputs: {
                            foo: "bar",
                        },
                        state: "ready",
                    }),
                },
            },
        ];
        base.extendActionTypes.Build = [
            {
                name: "extension",
                handlers: {
                    validate: async ({}) => ({}),
                },
            },
        ];
        const dependant = (0, plugin_1.createGardenPlugin)({ name: "dependant", base: "base" });
        const result = (0, plugins_1.resolvePlugins)(log, { base, dependant }, [{ name: "test" }]);
        const inheritedExtendActionType = (_a = result.find((plugin) => plugin.name === "dependant")) === null || _a === void 0 ? void 0 : _a.extendActionTypes.Build[0];
        (0, chai_1.expect)(inheritedExtendActionType).to.exist;
        (0, chai_1.expect)(inheritedExtendActionType === null || inheritedExtendActionType === void 0 ? void 0 : inheritedExtendActionType.name).to.eql("extension");
    });
    context("base is not configured", () => {
        it("pulls created action type from base", async () => {
            throw "TODO";
        });
        it("pulls action type extension from base if not defined in plugin", async () => {
            throw "TODO";
        });
        it("coalesces action type extension from base if both define one", async () => {
            throw "TODO";
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2lucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBsdWdpbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsdURBQWdEO0FBQ2hELHVEQUFzRDtBQUN0RCx1REFBK0Q7QUFDL0Qsa0RBQXFEO0FBQ3JELDJDQUEyQztBQUUzQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0lBQzlCLE1BQU0sR0FBRyxHQUFHLElBQUEsa0JBQVMsR0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBRXJDLEVBQUUsQ0FBQywwRkFBMEYsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN4RyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFrQixFQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDbkQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEtBQUssR0FBRztZQUMvQjtnQkFDRSxJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsS0FBSztnQkFDWCxNQUFNLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsbUJBQW1CLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQztvQkFDckMsU0FBUyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUU7aUJBQ3hCLENBQUM7Z0JBQ0Ysb0JBQW9CLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQztvQkFDdEMsU0FBUyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUU7aUJBQ3hCLENBQUM7Z0JBQ0YsUUFBUSxFQUFFLEVBQUU7YUFDYjtTQUNGLENBQUE7UUFFRCxNQUFNLElBQUEscUJBQVcsRUFBQyxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEsd0JBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDdkYsUUFBUSxFQUFFLHNFQUFzRTtTQUNqRixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrREFBK0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3RSxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFrQixFQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDbkQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEtBQUssR0FBRztZQUMvQjtnQkFDRSxJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsS0FBSztnQkFDWCxNQUFNLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsbUJBQW1CLEVBQUUsWUFBRztxQkFDckIsTUFBTSxFQUFFO3FCQUNSLElBQUksQ0FBQztvQkFDSixHQUFHLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTtpQkFDbEIsQ0FBQztxQkFDRCxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNoQixRQUFRLEVBQUUsRUFBRTthQUNiO1NBQ0YsQ0FBQTtRQUVELE1BQU0sSUFBQSxxQkFBVyxFQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsSUFBQSx3QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRTtZQUN2RixRQUFRLEVBQUUsZ0RBQWdEO1NBQzNELENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLCtDQUErQyxFQUFFLEtBQUssSUFBSSxFQUFFOztRQUM3RCxNQUFNLElBQUksR0FBRyxJQUFBLDJCQUFrQixFQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDakQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssR0FBRztZQUM3QjtnQkFDRSxJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsS0FBSztnQkFDWCxNQUFNLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsUUFBUSxFQUFFO29CQUNSLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUNwQixNQUFNLEVBQUUsRUFBRTt3QkFDVixPQUFPLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLEtBQUs7eUJBQ1g7d0JBQ0QsS0FBSyxFQUFFLE9BQU87cUJBQ2YsQ0FBQztpQkFDSDthQUNGO1NBQ0YsQ0FBQTtRQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQWtCLEVBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO1FBRXpFLE1BQU0sTUFBTSxHQUFHLElBQUEsd0JBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDM0UsTUFBTSxtQkFBbUIsR0FBRyxNQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssV0FBVyxDQUFDLDBDQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM1RyxJQUFBLGFBQU0sRUFBQyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7UUFDcEMsSUFBQSxhQUFNLEVBQUMsbUJBQW1CLGFBQW5CLG1CQUFtQix1QkFBbkIsbUJBQW1CLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsRCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxxREFBcUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNuRSxNQUFNLElBQUksR0FBRyxJQUFBLDJCQUFrQixFQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDakQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssR0FBRztZQUM3QjtnQkFDRSxJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsS0FBSztnQkFDWCxNQUFNLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsUUFBUSxFQUFFO29CQUNSLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUNwQixNQUFNLEVBQUUsRUFBRTt3QkFDVixPQUFPLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLEtBQUs7eUJBQ1g7d0JBQ0QsS0FBSyxFQUFFLE9BQU87cUJBQ2YsQ0FBQztpQkFDSDthQUNGO1NBQ0YsQ0FBQTtRQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQWtCLEVBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO1FBQ3pFLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUc7WUFDbEM7Z0JBQ0UsSUFBSSxFQUFFLE1BQU07Z0JBQ1osSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsTUFBTSxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLFFBQVEsRUFBRTtvQkFDUixLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDcEIsTUFBTSxFQUFFLEVBQUU7d0JBQ1YsT0FBTyxFQUFFOzRCQUNQLEdBQUcsRUFBRSxLQUFLO3lCQUNYO3dCQUNELEtBQUssRUFBRSxPQUFPO3FCQUNmLENBQUM7aUJBQ0g7YUFDRjtTQUNGLENBQUE7UUFFRCxNQUFNLElBQUEscUJBQVcsRUFBQyxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEsd0JBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDMUYsUUFBUSxFQUFFLG9GQUFvRjtTQUMvRixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTs7UUFDL0QsTUFBTSxJQUFJLEdBQUcsSUFBQSwyQkFBa0IsRUFBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO1FBQ2pELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUc7WUFDN0I7Z0JBQ0UsSUFBSSxFQUFFLE1BQU07Z0JBQ1osSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsTUFBTSxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLFFBQVEsRUFBRTtvQkFDUixLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDcEIsTUFBTSxFQUFFLEVBQUU7d0JBQ1YsT0FBTyxFQUFFOzRCQUNQLEdBQUcsRUFBRSxLQUFLO3lCQUNYO3dCQUNELEtBQUssRUFBRSxPQUFPO3FCQUNmLENBQUM7aUJBQ0g7YUFDRjtTQUNGLENBQUE7UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxHQUFHO1lBQzdCO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixRQUFRLEVBQUU7b0JBQ1IsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2lCQUM3QjthQUNGO1NBQ0YsQ0FBQTtRQUNELE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQWtCLEVBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO1FBRXpFLE1BQU0sTUFBTSxHQUFHLElBQUEsd0JBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDM0UsTUFBTSx5QkFBeUIsR0FBRyxNQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssV0FBVyxDQUFDLDBDQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsSCxJQUFBLGFBQU0sRUFBQyx5QkFBeUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7UUFDMUMsSUFBQSxhQUFNLEVBQUMseUJBQXlCLGFBQXpCLHlCQUF5Qix1QkFBekIseUJBQXlCLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtJQUM3RCxDQUFDLENBQUMsQ0FBQTtJQUVGLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7UUFDckMsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25ELE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsZ0VBQWdFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUUsTUFBTSxNQUFNLENBQUE7UUFDZCxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RSxNQUFNLE1BQU0sQ0FBQTtRQUNkLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9