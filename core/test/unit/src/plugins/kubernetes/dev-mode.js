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
const dev_mode_1 = require("../../../../../src/plugins/kubernetes/dev-mode");
describe("k8s dev mode helpers", () => {
    describe("getLocalSyncPath", () => {
        context("relative source path", () => {
            it("should join the module root path with the source path", () => {
                const relativeSourcePath = "../relative/path";
                const basePath = "/this/is/module/path";
                const localPath = (0, dev_mode_1.getLocalSyncPath)(relativeSourcePath, basePath);
                (0, chai_1.expect)(localPath).to.equal("/this/is/module/relative/path");
            });
        });
        context("absolute source path", () => {
            it("should ignore the module root path and return the absolute source path", () => {
                const absoluteSourcePath = "/absolute/path";
                const basePath = "/this/is/module/path";
                const localPath = (0, dev_mode_1.getLocalSyncPath)(absoluteSourcePath, basePath);
                (0, chai_1.expect)(localPath).to.equal(absoluteSourcePath);
            });
        });
    });
    describe("makeSyncConfig", () => {
        const localPath = "/path/to/module/src";
        const remoteDestination = "exec:'various fun connection parameters'";
        it("should generate a simple sync config", () => {
            const config = (0, dev_mode_1.makeSyncConfig)({
                localPath,
                remoteDestination,
                actionDefaults: {},
                opts: {},
                providerDefaults: {},
            });
            (0, chai_1.expect)(config).to.eql({
                alpha: localPath,
                beta: remoteDestination,
                ignore: [...dev_mode_1.builtInExcludes],
                mode: "one-way-safe",
                defaultOwner: undefined,
                defaultGroup: undefined,
                defaultDirectoryMode: undefined,
                defaultFileMode: undefined,
            });
        });
        it("should apply provider-level defaults", () => {
            const config = (0, dev_mode_1.makeSyncConfig)({
                localPath,
                remoteDestination,
                actionDefaults: {
                    exclude: ["**/*.log"],
                    owner: "node",
                    group: "admin",
                    fileMode: 600,
                    directoryMode: 700,
                },
                opts: {
                    mode: "one-way",
                },
                providerDefaults: {},
            });
            (0, chai_1.expect)(config).to.eql({
                alpha: localPath,
                beta: remoteDestination,
                ignore: [...dev_mode_1.builtInExcludes, "**/*.log"],
                mode: "one-way",
                defaultOwner: "node",
                defaultGroup: "admin",
                defaultFileMode: 600,
                defaultDirectoryMode: 700,
            });
        });
        it("should override/extend provider-level defaults with settings on the sync spec", () => {
            const config = (0, dev_mode_1.makeSyncConfig)({
                localPath,
                remoteDestination,
                actionDefaults: {
                    exclude: ["**/*.log"],
                    owner: "node",
                    group: "admin",
                    fileMode: 600,
                    directoryMode: 700,
                },
                opts: {
                    mode: "one-way",
                    exclude: ["node_modules"],
                    defaultOwner: "owner_from_spec",
                    defaultGroup: "group_from_spec",
                    defaultFileMode: 700,
                    defaultDirectoryMode: 777,
                },
                providerDefaults: {},
            });
            (0, chai_1.expect)(config).to.eql({
                alpha: localPath,
                beta: remoteDestination,
                ignore: [...dev_mode_1.builtInExcludes, "**/*.log", "node_modules"],
                mode: "one-way",
                defaultOwner: "owner_from_spec",
                defaultGroup: "group_from_spec",
                defaultFileMode: 700,
                defaultDirectoryMode: 777,
            });
        });
        it("should return a remote alpha and a local beta when called with a reverse sync mode", () => {
            const config = (0, dev_mode_1.makeSyncConfig)({
                localPath,
                remoteDestination,
                actionDefaults: {},
                opts: {
                    mode: "one-way-replica-reverse",
                },
                providerDefaults: {},
            });
            (0, chai_1.expect)(config).to.eql({
                alpha: remoteDestination,
                beta: localPath,
                ignore: [...dev_mode_1.builtInExcludes],
                mode: "one-way-replica-reverse",
                defaultOwner: undefined,
                defaultGroup: undefined,
                defaultDirectoryMode: undefined,
                defaultFileMode: undefined,
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2LW1vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkZXYtbW9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3Qiw2RUFBa0g7QUFFbEgsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtJQUNwQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7WUFDbkMsRUFBRSxDQUFDLHVEQUF1RCxFQUFFLEdBQUcsRUFBRTtnQkFDL0QsTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQTtnQkFDN0MsTUFBTSxRQUFRLEdBQUcsc0JBQXNCLENBQUE7Z0JBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQWdCLEVBQUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLENBQUE7Z0JBQ2hFLElBQUEsYUFBTSxFQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQTtZQUM3RCxDQUFDLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtZQUNuQyxFQUFFLENBQUMsd0VBQXdFLEVBQUUsR0FBRyxFQUFFO2dCQUNoRixNQUFNLGtCQUFrQixHQUFHLGdCQUFnQixDQUFBO2dCQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBc0IsQ0FBQTtnQkFDdkMsTUFBTSxTQUFTLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsQ0FBQTtnQkFDaEUsSUFBQSxhQUFNLEVBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1lBQ2hELENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUE7UUFDdkMsTUFBTSxpQkFBaUIsR0FBRywwQ0FBMEMsQ0FBQTtRQUVwRSxFQUFFLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUEseUJBQWMsRUFBQztnQkFDNUIsU0FBUztnQkFDVCxpQkFBaUI7Z0JBQ2pCLGNBQWMsRUFBRSxFQUFFO2dCQUNsQixJQUFJLEVBQUUsRUFBRTtnQkFDUixnQkFBZ0IsRUFBRSxFQUFFO2FBQ3JCLENBQUMsQ0FBQTtZQUVGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BCLEtBQUssRUFBRSxTQUFTO2dCQUNoQixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixNQUFNLEVBQUUsQ0FBQyxHQUFHLDBCQUFlLENBQUM7Z0JBQzVCLElBQUksRUFBRSxjQUFjO2dCQUNwQixZQUFZLEVBQUUsU0FBUztnQkFDdkIsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLG9CQUFvQixFQUFFLFNBQVM7Z0JBQy9CLGVBQWUsRUFBRSxTQUFTO2FBQzNCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFBLHlCQUFjLEVBQUM7Z0JBQzVCLFNBQVM7Z0JBQ1QsaUJBQWlCO2dCQUNqQixjQUFjLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO29CQUNyQixLQUFLLEVBQUUsTUFBTTtvQkFDYixLQUFLLEVBQUUsT0FBTztvQkFDZCxRQUFRLEVBQUUsR0FBRztvQkFDYixhQUFhLEVBQUUsR0FBRztpQkFDbkI7Z0JBQ0QsSUFBSSxFQUFFO29CQUNKLElBQUksRUFBRSxTQUFTO2lCQUNoQjtnQkFDRCxnQkFBZ0IsRUFBRSxFQUFFO2FBQ3JCLENBQUMsQ0FBQTtZQUVGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BCLEtBQUssRUFBRSxTQUFTO2dCQUNoQixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixNQUFNLEVBQUUsQ0FBQyxHQUFHLDBCQUFlLEVBQUUsVUFBVSxDQUFDO2dCQUN4QyxJQUFJLEVBQUUsU0FBUztnQkFDZixZQUFZLEVBQUUsTUFBTTtnQkFDcEIsWUFBWSxFQUFFLE9BQU87Z0JBQ3JCLGVBQWUsRUFBRSxHQUFHO2dCQUNwQixvQkFBb0IsRUFBRSxHQUFHO2FBQzFCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLCtFQUErRSxFQUFFLEdBQUcsRUFBRTtZQUN2RixNQUFNLE1BQU0sR0FBRyxJQUFBLHlCQUFjLEVBQUM7Z0JBQzVCLFNBQVM7Z0JBQ1QsaUJBQWlCO2dCQUNqQixjQUFjLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO29CQUNyQixLQUFLLEVBQUUsTUFBTTtvQkFDYixLQUFLLEVBQUUsT0FBTztvQkFDZCxRQUFRLEVBQUUsR0FBRztvQkFDYixhQUFhLEVBQUUsR0FBRztpQkFDbkI7Z0JBQ0QsSUFBSSxFQUFFO29CQUNKLElBQUksRUFBRSxTQUFTO29CQUNmLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQztvQkFDekIsWUFBWSxFQUFFLGlCQUFpQjtvQkFDL0IsWUFBWSxFQUFFLGlCQUFpQjtvQkFDL0IsZUFBZSxFQUFFLEdBQUc7b0JBQ3BCLG9CQUFvQixFQUFFLEdBQUc7aUJBQzFCO2dCQUNELGdCQUFnQixFQUFFLEVBQUU7YUFDckIsQ0FBQyxDQUFBO1lBRUYsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDcEIsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLE1BQU0sRUFBRSxDQUFDLEdBQUcsMEJBQWUsRUFBRSxVQUFVLEVBQUUsY0FBYyxDQUFDO2dCQUN4RCxJQUFJLEVBQUUsU0FBUztnQkFDZixZQUFZLEVBQUUsaUJBQWlCO2dCQUMvQixZQUFZLEVBQUUsaUJBQWlCO2dCQUMvQixlQUFlLEVBQUUsR0FBRztnQkFDcEIsb0JBQW9CLEVBQUUsR0FBRzthQUMxQixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxvRkFBb0YsRUFBRSxHQUFHLEVBQUU7WUFDNUYsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBYyxFQUFDO2dCQUM1QixTQUFTO2dCQUNULGlCQUFpQjtnQkFDakIsY0FBYyxFQUFFLEVBQUU7Z0JBQ2xCLElBQUksRUFBRTtvQkFDSixJQUFJLEVBQUUseUJBQXlCO2lCQUNoQztnQkFDRCxnQkFBZ0IsRUFBRSxFQUFFO2FBQ3JCLENBQUMsQ0FBQTtZQUVGLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BCLEtBQUssRUFBRSxpQkFBaUI7Z0JBQ3hCLElBQUksRUFBRSxTQUFTO2dCQUNmLE1BQU0sRUFBRSxDQUFDLEdBQUcsMEJBQWUsQ0FBQztnQkFDNUIsSUFBSSxFQUFFLHlCQUF5QjtnQkFDL0IsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixvQkFBb0IsRUFBRSxTQUFTO2dCQUMvQixlQUFlLEVBQUUsU0FBUzthQUMzQixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==