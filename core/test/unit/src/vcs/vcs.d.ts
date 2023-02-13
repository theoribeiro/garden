import { VcsHandler, TreeVersion, GetFilesParams, VcsFile } from "../../../../src/vcs/vcs";
import { ModuleConfig } from "../../../../src/config/module";
import { LogEntry } from "../../../../src/logger/log-entry";
export declare class TestVcsHandler extends VcsHandler {
    name: string;
    private testTreeVersions;
    getRepoRoot(): Promise<string>;
    getFiles(_: GetFilesParams): Promise<VcsFile[]>;
    getPathInfo(): Promise<{
        branch: string;
        commitHash: string;
        originUrl: string;
    }>;
    getTreeVersion(log: LogEntry, projectName: string, moduleConfig: ModuleConfig): Promise<TreeVersion>;
    setTestTreeVersion(path: string, version: TreeVersion): void;
    setTestModuleVersion(path: string, version: TreeVersion): void;
    ensureRemoteSource(): Promise<string>;
    updateRemoteSource(): Promise<void>;
}
//# sourceMappingURL=vcs.d.ts.map