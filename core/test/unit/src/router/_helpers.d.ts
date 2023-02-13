import { BuildActionConfig } from "../../../../src/actions/build";
export declare function getRouterTestData(): Promise<{
    resolvedBuildAction: import("../../../../src/actions/build").ResolvedBuildAction<BuildActionConfig<any, any>, any>;
    resolvedDeployAction: import("../../../../src/actions/deploy").ResolvedDeployAction<any, any>;
    resolvedRunAction: import("../../../../src/actions/run").ResolvedRunAction<import("../../../../src/actions/run").RunActionConfig<any, any>, any>;
    garden: import("../../../helpers").TestGarden;
    log: import("../../../../src/logger/log-entry").LogEntry;
    graph: import("../../../../src/graph/config-graph").ConfigGraph;
    actionRouter: import("../../../../src/router/router").ActionRouter;
    module: import("../../../../src/types/module").GardenModule<any, any, any, any, any>;
    dateUsedForCompleted: Date;
    returnWrongOutputsCfgKey: string;
    plugins: {
        basePlugin: import("../../../../src/plugin/plugin").GardenPlugin;
        testPluginA: import("../../../../src/plugin/plugin").GardenPlugin;
        testPluginB: import("../../../../src/plugin/plugin").GardenPlugin;
    };
}>;
//# sourceMappingURL=_helpers.d.ts.map