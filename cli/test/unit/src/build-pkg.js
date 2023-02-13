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
const build_pkg_1 = require("../../../src/build-pkg");
describe("build-pkg", () => {
    const version = "0.12.44";
    const errorMsg = (errDetails) => {
        return `The format of the release package name SHOULD NOT be changed since other tools we use depend on it, unless you absolutely know what you're doing. Test failed with error: ${errDetails}`;
    };
    context("tarball-filenames", () => {
        const errorDetails = "Tarball filename must be in kebab-case format `garden-${version}-${platform}.tar.gz`.";
        function expectTarballFilenameFormat(platformName) {
            const tarballFilename = (0, build_pkg_1.getTarballFilename)(version, platformName);
            (0, chai_1.expect)(tarballFilename).to.equal(`garden-${version}-${platformName}.tar.gz`, errorMsg(errorDetails));
        }
        it("ensure filename format for tar packages", async () => {
            expectTarballFilenameFormat("alpine-amd64");
        });
    });
    context("zip-filenames", () => {
        const errorDetails = "ZIP filename must be in kebab-case format `garden-${version}-${platform}.zip`.";
        function expectZipFilenameFormat(platformName) {
            const tarballFilename = (0, build_pkg_1.getZipFilename)(version, platformName);
            (0, chai_1.expect)(tarballFilename).to.equal(`garden-${version}-${platformName}.zip`, errorMsg(errorDetails));
        }
        it("ensure filename format for alpine package", async () => {
            expectZipFilenameFormat("windows-amd64");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtcGtnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVpbGQtcGtnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHNEQUEyRTtBQUUzRSxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtJQUN6QixNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUE7SUFDekIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxVQUFrQixFQUFVLEVBQUU7UUFDOUMsT0FBTyw2S0FBNkssVUFBVSxFQUFFLENBQUE7SUFDbE0sQ0FBQyxDQUFBO0lBRUQsT0FBTyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxNQUFNLFlBQVksR0FBRyx1RkFBdUYsQ0FBQTtRQUU1RyxTQUFTLDJCQUEyQixDQUFDLFlBQW9CO1lBQ3ZELE1BQU0sZUFBZSxHQUFHLElBQUEsOEJBQWtCLEVBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFBO1lBQ2pFLElBQUEsYUFBTSxFQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxPQUFPLElBQUksWUFBWSxTQUFTLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUE7UUFDdEcsQ0FBQztRQUVELEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RCwyQkFBMkIsQ0FBQyxjQUFjLENBQUMsQ0FBQTtRQUM3QyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDNUIsTUFBTSxZQUFZLEdBQUcsZ0ZBQWdGLENBQUE7UUFFckcsU0FBUyx1QkFBdUIsQ0FBQyxZQUFvQjtZQUNuRCxNQUFNLGVBQWUsR0FBRyxJQUFBLDBCQUFjLEVBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFBO1lBQzdELElBQUEsYUFBTSxFQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxPQUFPLElBQUksWUFBWSxNQUFNLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUE7UUFDbkcsQ0FBQztRQUVELEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN6RCx1QkFBdUIsQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUMxQyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==