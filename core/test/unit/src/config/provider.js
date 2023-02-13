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
const provider_1 = require("../../../../src/config/provider");
const helpers_1 = require("../../../helpers");
const plugin_1 = require("../../../../src/plugin/plugin");
describe("getProviderDependencies", () => {
    const plugin = (0, plugin_1.createGardenPlugin)({
        name: "test",
    });
    it("should extract implicit provider dependencies from template strings", async () => {
        const config = {
            name: "my-provider",
            someKey: "${providers.other-provider.foo}",
            anotherKey: "foo-${providers.another-provider.bar}",
        };
        (0, chai_1.expect)(await (0, provider_1.getAllProviderDependencyNames)(plugin, config)).to.eql(["another-provider", "other-provider"]);
    });
    it("should ignore template strings that don't reference providers", async () => {
        const config = {
            name: "my-provider",
            someKey: "${providers.other-provider.foo}",
            anotherKey: "foo-${some.other.ref}",
        };
        (0, chai_1.expect)(await (0, provider_1.getAllProviderDependencyNames)(plugin, config)).to.eql(["other-provider"]);
    });
    it("should throw on provider-scoped template strings without a provider name", async () => {
        const config = {
            name: "my-provider",
            someKey: "${providers}",
        };
        await (0, helpers_1.expectError)(() => (0, provider_1.getAllProviderDependencyNames)(plugin, config), {
            contains: "Invalid template key 'providers' in configuration for provider 'my-provider'. You must specify a provider name as well (e.g. \\${providers.my-provider}).",
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3Qiw4REFBc0c7QUFDdEcsOENBQThDO0FBQzlDLDBEQUFrRTtBQUVsRSxRQUFRLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO0lBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWtCLEVBQUM7UUFDaEMsSUFBSSxFQUFFLE1BQU07S0FDYixDQUFDLENBQUE7SUFFRixFQUFFLENBQUMscUVBQXFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDbkYsTUFBTSxNQUFNLEdBQTBCO1lBQ3BDLElBQUksRUFBRSxhQUFhO1lBQ25CLE9BQU8sRUFBRSxpQ0FBaUM7WUFDMUMsVUFBVSxFQUFFLHVDQUF1QztTQUNwRCxDQUFBO1FBQ0QsSUFBQSxhQUFNLEVBQUMsTUFBTSxJQUFBLHdDQUE2QixFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUE7SUFDNUcsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0RBQStELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDN0UsTUFBTSxNQUFNLEdBQTBCO1lBQ3BDLElBQUksRUFBRSxhQUFhO1lBQ25CLE9BQU8sRUFBRSxpQ0FBaUM7WUFDMUMsVUFBVSxFQUFFLHVCQUF1QjtTQUNwQyxDQUFBO1FBQ0QsSUFBQSxhQUFNLEVBQUMsTUFBTSxJQUFBLHdDQUE2QixFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUE7SUFDeEYsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsMEVBQTBFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDeEYsTUFBTSxNQUFNLEdBQTBCO1lBQ3BDLElBQUksRUFBRSxhQUFhO1lBQ25CLE9BQU8sRUFBRSxjQUFjO1NBQ3hCLENBQUE7UUFFRCxNQUFNLElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLHdDQUE2QixFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNyRSxRQUFRLEVBQ04sMkpBQTJKO1NBQzlKLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==