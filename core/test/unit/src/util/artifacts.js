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
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const fs_extra_1 = require("fs-extra");
const normalize_path_1 = __importDefault(require("normalize-path"));
const path_1 = require("path");
const artifacts_1 = require("../../../../src/util/artifacts");
const logger_1 = require("../../../../src/logger/logger");
describe("artifacts", () => {
    describe("getArtifactKey", () => {
        it("should return the artifact key with format type.name.version", () => {
            (0, chai_1.expect)((0, artifacts_1.getArtifactKey)("run", "task-name", "v-123456")).to.equal("run.task-name.v-123456");
            (0, chai_1.expect)((0, artifacts_1.getArtifactKey)("test", "test-name", "v-123456")).to.equal("test.test-name.v-123456");
        });
    });
    describe("getArtifactFileList", () => {
        let tmpDir;
        let artifactsPath;
        const log = (0, logger_1.getLogger)().info("");
        beforeEach(async () => {
            tmpDir = await tmp_promise_1.default.dir({ unsafeCleanup: true });
            artifactsPath = (0, normalize_path_1.default)(await (0, fs_extra_1.realpath)(tmpDir.path));
        });
        afterEach(async () => {
            await tmpDir.cleanup();
        });
        it("should read the artifact metadata file and return the files", async () => {
            const key = "task.foo-bar.v-12345";
            const metadataPath = (0, path_1.join)(artifactsPath, `.metadata.${key}.json`);
            const metadata = {
                key,
                files: ["/foo/bar.txt", "/bas/bar.txt"],
            };
            await (0, fs_extra_1.writeFile)(metadataPath, JSON.stringify(metadata));
            const files = await (0, artifacts_1.getArtifactFileList)({
                key,
                artifactsPath,
                log,
            });
            (0, chai_1.expect)(files).to.eql(["/foo/bar.txt", "/bas/bar.txt"]);
        });
        it("should return an empty list if the metadata file is missing", async () => {
            const files = await (0, artifacts_1.getArtifactFileList)({
                key: "",
                artifactsPath,
                log,
            });
            (0, chai_1.expect)(files).to.eql([]);
        });
        it("should return an empty list if it can't parse the metadata file", async () => {
            const key = "task.foo-bar.v-12345";
            const metadataPath = (0, path_1.join)(artifactsPath, `.metadata.${key}.json`);
            await (0, fs_extra_1.writeFile)(metadataPath, "BAD JSON");
            const files = await (0, artifacts_1.getArtifactFileList)({
                key,
                artifactsPath,
                log,
            });
            (0, chai_1.expect)(files).to.eql([]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0aWZhY3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXJ0aWZhY3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQTZCO0FBQzdCLDhEQUE2QjtBQUM3Qix1Q0FBOEM7QUFDOUMsb0VBQTBDO0FBQzFDLCtCQUEyQjtBQUMzQiw4REFBb0Y7QUFDcEYsMERBQXlEO0FBRXpELFFBQVEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO0lBQ3pCLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsRUFBRSxDQUFDLDhEQUE4RCxFQUFFLEdBQUcsRUFBRTtZQUN0RSxJQUFBLGFBQU0sRUFBQyxJQUFBLDBCQUFjLEVBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQTtZQUN6RixJQUFBLGFBQU0sRUFBQyxJQUFBLDBCQUFjLEVBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQTtRQUM3RixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNuQyxJQUFJLE1BQTJCLENBQUE7UUFDL0IsSUFBSSxhQUFxQixDQUFBO1FBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUEsa0JBQVMsR0FBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUVoQyxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDcEIsTUFBTSxHQUFHLE1BQU0scUJBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtZQUMvQyxhQUFhLEdBQUcsSUFBQSx3QkFBYSxFQUFDLE1BQU0sSUFBQSxtQkFBUSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBQzVELENBQUMsQ0FBQyxDQUFBO1FBRUYsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3hCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDZEQUE2RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNFLE1BQU0sR0FBRyxHQUFHLHNCQUFzQixDQUFBO1lBQ2xDLE1BQU0sWUFBWSxHQUFHLElBQUEsV0FBSSxFQUFDLGFBQWEsRUFBRSxhQUFhLEdBQUcsT0FBTyxDQUFDLENBQUE7WUFDakUsTUFBTSxRQUFRLEdBQUc7Z0JBQ2YsR0FBRztnQkFDSCxLQUFLLEVBQUUsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDO2FBQ3hDLENBQUE7WUFDRCxNQUFNLElBQUEsb0JBQVMsRUFBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBRXZELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSwrQkFBbUIsRUFBQztnQkFDdEMsR0FBRztnQkFDSCxhQUFhO2dCQUNiLEdBQUc7YUFDSixDQUFDLENBQUE7WUFFRixJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUE7UUFDeEQsQ0FBQyxDQUFDLENBQUE7UUFDRixFQUFFLENBQUMsNkRBQTZELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0UsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLCtCQUFtQixFQUFDO2dCQUN0QyxHQUFHLEVBQUUsRUFBRTtnQkFDUCxhQUFhO2dCQUNiLEdBQUc7YUFDSixDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzFCLENBQUMsQ0FBQyxDQUFBO1FBQ0YsRUFBRSxDQUFDLGlFQUFpRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9FLE1BQU0sR0FBRyxHQUFHLHNCQUFzQixDQUFBO1lBQ2xDLE1BQU0sWUFBWSxHQUFHLElBQUEsV0FBSSxFQUFDLGFBQWEsRUFBRSxhQUFhLEdBQUcsT0FBTyxDQUFDLENBQUE7WUFDakUsTUFBTSxJQUFBLG9CQUFTLEVBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBRXpDLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSwrQkFBbUIsRUFBQztnQkFDdEMsR0FBRztnQkFDSCxhQUFhO2dCQUNiLEdBQUc7YUFDSixDQUFDLENBQUE7WUFDRixJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzFCLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9