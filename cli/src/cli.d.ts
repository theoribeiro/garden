import { GardenCli, RunOutput } from "@garden-io/core/build/src/cli/cli";
import { GardenPluginReference } from "@garden-io/core/build/src/plugin/plugin";
export declare const getBundledPlugins: () => GardenPluginReference[];
export declare function runCli({ args, cli, exitOnError, }?: {
    args?: string[];
    cli?: GardenCli;
    exitOnError?: boolean;
}): Promise<{
    cli: GardenCli | undefined;
    result: RunOutput | undefined;
}>;
//# sourceMappingURL=cli.d.ts.map