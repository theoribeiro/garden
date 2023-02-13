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
const provider_1 = require("../../../../../src/config/template-contexts/provider");
describe("ProviderConfigContext", () => {
    it("should set an empty namespace and environment.fullName to environment.name if no namespace is set", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { environmentName: "local" });
        const c = new provider_1.ProviderConfigContext(garden, await garden.resolveProviders(garden.log), garden.variables);
        (0, chai_1.expect)(c.resolve({ key: ["environment", "name"], nodePath: [], opts: {} })).to.eql({ resolved: "local" });
    });
    it("should set environment.namespace and environment.fullName to properly if namespace is set", async () => {
        const garden = await (0, helpers_1.makeTestGarden)(helpers_1.projectRootA, { environmentName: "foo.local" });
        const c = new provider_1.ProviderConfigContext(garden, await garden.resolveProviders(garden.log), garden.variables);
        (0, chai_1.expect)(c.resolve({ key: ["environment", "name"], nodePath: [], opts: {} })).to.eql({ resolved: "local" });
        (0, chai_1.expect)(c.resolve({ key: ["environment", "namespace"], nodePath: [], opts: {} })).to.eql({ resolved: "foo" });
        (0, chai_1.expect)(c.resolve({ key: ["environment", "fullName"], nodePath: [], opts: {} })).to.eql({ resolved: "foo.local" });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUU3QixpREFBa0U7QUFDbEUsbUZBQTRGO0FBUTVGLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsRUFBRSxDQUFDLG1HQUFtRyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2pILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLHNCQUFZLEVBQUUsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtRQUMvRSxNQUFNLENBQUMsR0FBRyxJQUFJLGdDQUFxQixDQUFDLE1BQU0sRUFBRSxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBRXhHLElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUMzRyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywyRkFBMkYsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN6RyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxzQkFBWSxFQUFFLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUE7UUFDbkYsTUFBTSxDQUFDLEdBQUcsSUFBSSxnQ0FBcUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUV4RyxJQUFBLGFBQU0sRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDekcsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQzVHLElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQTtJQUNuSCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=