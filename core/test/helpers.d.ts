/// <reference types="mocha" />
import { GardenPluginSpec, ProviderHandlers, RegisterPluginParam } from "../src/plugin/plugin";
import { Garden, GardenOpts } from "../src/garden";
import { ModuleConfig } from "../src/config/module";
import { ModuleVersion } from "../src/vcs/vcs";
import { Parameters, ParameterValues } from "../src/cli/params";
import { ConfigureModuleParams } from "../src/plugin/handlers/Module/configure";
import { CommandParams, ProcessCommandResult } from "../src/commands/base";
import { EventLogEntry, TestGarden, TestGardenOpts } from "../src/util/testing";
import { GardenCli } from "../src/cli/cli";
import { DirectoryResult } from "tmp-promise";
import { ProjectConfig } from "../src/config/project";
import { GraphResultMap } from "../src/graph/results";
export { TempDirectory, makeTempDir } from "../src/util/fs";
export { TestGarden, TestError, TestEventBus, expectError, expectFuzzyMatch } from "../src/util/testing";
export declare const testModuleVersion: ModuleVersion;
export declare const testGitUrl = "https://my-git-server.com/my-repo.git#main";
export declare const testGitUrlHash: string;
/**
 * Returns a fully resolved path of a concrete subdirectory located in the {@link testDataDir}.
 * The concrete subdirectory path is defined as a varargs list of its directory names.
 * E.g. `"project", "service-1"` stands for the path `project/service-1`.
 *
 * @param names the subdirectory path
 */
export declare function getDataDir(...names: string[]): string;
export declare function getExampleDir(name: string): string;
export declare function profileBlock(description: string, block: () => Promise<any>): Promise<any>;
export declare const projectRootA: string;
export declare const projectRootBuildDependants: string;
export declare const testModuleSpecSchema: () => import("../src/config/common").CustomObjectSchema;
export declare const testDeploySchema: import("../src/config/common").CreateSchemaOutput;
export declare const testRunSchema: import("../src/config/common").CreateSchemaOutput;
export declare const testTestSchema: import("../src/config/common").CreateSchemaOutput;
export declare function configureTestModule({ moduleConfig }: ConfigureModuleParams): Promise<{
    moduleConfig: ModuleConfig<any, any, any, any>;
}>;
export declare const testPlugin: () => import("../src/plugin/plugin").GardenPlugin;
export declare const customizedTestPlugin: (partialCustomSpec: Partial<GardenPluginSpec>) => import("../src/plugin/plugin").GardenPlugin;
export declare const testPluginB: () => import("../src/plugin/plugin").GardenPlugin;
export declare const testPluginC: () => import("../src/plugin/plugin").GardenPlugin;
export declare const getDefaultProjectConfig: () => ProjectConfig;
export declare const createProjectConfig: (partialCustomConfig: Partial<ProjectConfig>) => ProjectConfig;
export declare const defaultModuleConfig: ModuleConfig;
export declare class TestGardenCli extends GardenCli {
    getGarden(workingDir: string, opts: GardenOpts): Promise<TestGarden>;
}
export declare const makeTestModule: (params?: Partial<ModuleConfig>) => ModuleConfig;
/**
 * Similar to {@link makeTestModule}, but uses a more minimal default config.
 * @param path the project root path
 * @param from the partial module config to override the default values
 */
export declare function makeModuleConfig<M extends ModuleConfig = ModuleConfig>(path: string, from: Partial<M>): ModuleConfig;
export declare const testPlugins: () => import("../src/plugin/plugin").GardenPlugin[];
export declare const testProjectTempDirs: {
    [root: string]: DirectoryResult;
};
/**
 * Create a garden instance for testing and setup a project if it doesn't exist already.
 */
export declare const makeTestGarden: (projectRoot: string, opts?: TestGardenOpts | undefined) => Promise<TestGarden>;
export declare const makeTestGardenA: (extraPlugins?: RegisterPluginParam[] | undefined, opts?: TestGardenOpts | undefined) => Promise<TestGarden>;
export declare const makeTestGardenBuildDependants: (extraPlugins?: RegisterPluginParam[] | undefined, opts?: TestGardenOpts | undefined) => Promise<TestGarden>;
export declare function stubProviderAction<T extends keyof ProviderHandlers>(garden: Garden, pluginName: string, type: T, handler?: ProviderHandlers[T]): Promise<any>;
/**
 * Returns an alphabetically sorted list of all processed actions including dependencies from a GraphResultMap.
 */
export declare function getAllProcessedTaskNames(results: GraphResultMap): string[];
/**
 * Returns a map of all task results including dependencies from a GraphResultMap.
 */
export declare function getAllTaskResults(results: GraphResultMap): {
    [x: string]: import("../src/graph/results").GraphResultFromTask<import("../src/tasks/base").Task> | null;
};
export declare function taskResultOutputs(results: ProcessCommandResult): {
    [x: string]: any;
};
export declare const cleanProject: (gardenDirPath: string) => Promise<void>;
export declare function withDefaultGlobalOpts<T extends object>(opts: T): ParameterValues<{
    root: import("../src/cli/params").PathParameter;
    silent: import("../src/cli/params").BooleanParameter;
    env: import("../src/cli/params").EnvironmentOption;
    "logger-type": import("../src/cli/params").ChoicesParameter;
    "log-level": import("../src/cli/params").ChoicesParameter;
    output: import("../src/cli/params").ChoicesParameter;
    emoji: import("../src/cli/params").BooleanParameter;
    "show-timestamps": import("../src/cli/params").BooleanParameter;
    yes: import("../src/cli/params").BooleanParameter;
    "force-refresh": import("../src/cli/params").BooleanParameter;
    var: import("../src/cli/params").StringsParameter;
    version: import("../src/cli/params").BooleanParameter;
    help: import("../src/cli/params").BooleanParameter;
    "disable-port-forwards": import("../src/cli/params").BooleanParameter;
}> & T;
export declare function setPlatform(platform: string): void;
export declare function freezeTime(date?: Date): Date;
export declare function resetLocalConfig(gardenDirPath: string): Promise<void>;
/**
 * Idempotently initializes the test-project-ext-project-sources project and returns
 * the Garden class.
 */
export declare function makeExtProjectSourcesGarden(opts?: TestGardenOpts): Promise<TestGarden>;
/**
 * Idempotently initializes the test-project-ext-project-sources project and returns
 * the Garden class.
 */
export declare function makeExtModuleSourcesGarden(opts?: TestGardenOpts): Promise<TestGarden>;
/**
 * Trims the ends of each line of the given input string (useful for multi-line string comparisons)
 */
export declare function trimLineEnds(str: string): string;
/**
 * Helper function that wraps mocha functions and assigns them to one or more groups.
 *
 * If any of the specified `groups` are included in the `GARDEN_SKIP_TESTS` environment variable
 * (which should be specified as a space-delimited string, e.g. `GARDEN_SKIP_TESTS="group-a group-b"`),
 * the test or suite is skipped.
 *
 * Usage example:
 *
 *   // Skips the test if GARDEN_SKIP_TESTS=some-group
 *   grouped("some-group").it("should do something", () => { ... })
 *
 * @param groups   The group or groups of the test/suite (specify one string or array of strings)
 */
export declare function grouped(...groups: string[]): {
    it: Mocha.PendingTestFunction;
    describe: Mocha.PendingSuiteFunction;
    context: Mocha.PendingSuiteFunction;
};
/**
 * Helper function that enables analytics while testing by updating the global config
 * and setting the appropriate environment variables.
 *
 * Returns a reset function that resets the config and environment variables to their
 * previous state.
 *
 * Call this function in a `before` hook and the reset function in an `after` hook.
 *
 * NOTE: Network calls to the analytics endpoint should be mocked when unit testing analytics.
 */
export declare function enableAnalytics(garden: TestGarden): Promise<() => Promise<void>>;
export declare function getRuntimeStatusEvents(eventLog: EventLogEntry[]): {
    name: string;
    payload: any;
}[];
/**
 * Initialise test logger.
 *
 * It doesn't register any writers so it only collects logs but doesn't write them.
 */
export declare function initTestLogger(): void;
export declare function makeCommandParams<T extends Parameters = {}, U extends Parameters = {}>({ cli, garden, args, opts, }: {
    cli?: GardenCli;
    garden: Garden;
    args: T;
    opts: U;
}): CommandParams<T, U>;
declare type NameOfProperty = string;
export declare function getPropertyName<T>(obj: T, expression: (x: {
    [Property in keyof T]: () => string;
}) => () => NameOfProperty): string;
//# sourceMappingURL=helpers.d.ts.map