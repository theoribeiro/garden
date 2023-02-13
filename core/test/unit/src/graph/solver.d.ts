import { BaseTask, BaseTaskParams, TaskProcessParams, ValidResultType } from "../../../../src/tasks/base";
import { ActionState } from "../../../../src/actions/types";
export declare type TestTaskCallback = (params: {
    task: BaseTask;
    params: TaskProcessParams;
}) => Promise<any>;
interface TestTaskParams extends BaseTaskParams {
    name?: string;
    state?: ActionState;
    callback?: TestTaskCallback;
    dependencies?: BaseTask[];
    statusDependencies?: BaseTask[];
    throwError?: boolean;
}
interface TestTaskResult extends ValidResultType {
    outputs: {
        id: string;
        processed: boolean;
        callbackResult: any;
    };
}
export declare class TestTask extends BaseTask<TestTaskResult> {
    type: string;
    name: string;
    state: ActionState;
    callback: TestTaskCallback | null;
    statusCallback: TestTaskCallback | null;
    throwError: boolean;
    dependencies: BaseTask[];
    statusDependencies: BaseTask[];
    constructor(params: TestTaskParams);
    resolveStatusDependencies(): BaseTask<ValidResultType, ValidResultType>[];
    resolveProcessDependencies(): BaseTask<ValidResultType, ValidResultType>[];
    getName(): string;
    getBaseKey(): string;
    getId(): string;
    getDescription(): string;
    getStatus(params: TaskProcessParams): Promise<{
        state: "unknown" | "ready" | "outdated" | "failed" | "not-ready";
        outputs: {
            id: string;
            processed: boolean;
            callbackResult: any;
        };
    }>;
    process(params: TaskProcessParams): Promise<{
        state: "unknown" | "ready" | "outdated" | "failed" | "not-ready";
        outputs: {
            id: string;
            processed: boolean;
            callbackResult: any;
        };
    }>;
}
export {};
//# sourceMappingURL=solver.d.ts.map