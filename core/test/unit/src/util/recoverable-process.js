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
const env_var_1 = __importDefault(require("env-var"));
const chai_1 = require("chai");
const recoverable_process_1 = require("../../../../src/util/recoverable-process");
const logger_1 = require("../../../../src/logger/logger");
const util_1 = require("../../../../src/util/util");
const helpers_1 = require("../../../helpers");
describe("validateRetryConfig", () => {
    it("must fail on negative minTimeoutMs", () => {
        (0, chai_1.expect)(() => (0, recoverable_process_1.validateRetryConfig)({
            minTimeoutMs: -1,
            maxRetries: 10,
        })).to.throw("Value minTimeoutMs cannot be negative: -1");
    });
    it("must pass on zero minTimeoutMs", () => {
        (0, chai_1.expect)(() => (0, recoverable_process_1.validateRetryConfig)({
            minTimeoutMs: 0,
            maxRetries: 10,
        })).to.not.throw;
    });
    it("must pass on positive minTimeoutMs", () => {
        (0, chai_1.expect)(() => (0, recoverable_process_1.validateRetryConfig)({
            minTimeoutMs: 0,
            maxRetries: 10,
        })).to.not.throw;
    });
    it("must fail on negative maxRetries", () => {
        (0, chai_1.expect)(() => (0, recoverable_process_1.validateRetryConfig)({
            minTimeoutMs: 1000,
            maxRetries: -1,
        })).to.throw("Value maxRetries cannot be negative: -1");
    });
    it("must pass on zero maxRetries", () => {
        (0, chai_1.expect)(() => (0, recoverable_process_1.validateRetryConfig)({
            minTimeoutMs: 1000,
            maxRetries: 0,
        })).to.not.throw;
    });
    it("must pass on positive maxRetries", () => {
        (0, chai_1.expect)(() => (0, recoverable_process_1.validateRetryConfig)({
            minTimeoutMs: 1000,
            maxRetries: 10,
        })).to.not.throw;
    });
});
describe("RecoverableProcess", async () => {
    (0, helpers_1.initTestLogger)();
    const log = (0, logger_1.getLogger)().placeholder();
    const doNothingForeverOsCommand = { command: "tail -f /dev/null" };
    const badOsCommand = { command: "bad_os_command_which_does_not_exists_and_must_fail_the_process" };
    const longTimeMs = 10000000;
    const longSleepOsCommand = { command: `sleep ${longTimeMs}` };
    /**
     * FIXME: some tests are skipped because child-processes are not getting killed in CircleCI pipeline for some reason.
     * This function is used to skip some tests and modify some expectations in CircleCI pipeline.
     */
    function isCiEnv() {
        const ciEnv = env_var_1.default.get("CI").required(false).asBool();
        const circleCiEnv = env_var_1.default.get("CIRCLECI").required(false).asBool();
        return ciEnv || circleCiEnv;
    }
    function killNode(node) {
        var _a;
        const untypedNode = node;
        (_a = untypedNode.proc) === null || _a === void 0 ? void 0 : _a.kill();
    }
    function infiniteProcess(maxRetries, minTimeoutMs) {
        return new recoverable_process_1.RecoverableProcess({
            osCommand: doNothingForeverOsCommand,
            retryConfig: {
                maxRetries,
                minTimeoutMs,
            },
            log,
        });
    }
    function failingProcess(maxRetries, minTimeoutMs) {
        return new recoverable_process_1.RecoverableProcess({
            osCommand: badOsCommand,
            retryConfig: {
                maxRetries,
                minTimeoutMs,
            },
            log,
        });
    }
    function longSleepingProcess(maxRetries, minTimeoutMs) {
        return new recoverable_process_1.RecoverableProcess({
            osCommand: longSleepOsCommand,
            retryConfig: {
                maxRetries,
                minTimeoutMs,
            },
            log,
        });
    }
    function infiniteProcessTree(maxRetries, minTimeoutMs) {
        const root = infiniteProcess(maxRetries, minTimeoutMs);
        const left = infiniteProcess(maxRetries, minTimeoutMs);
        const right = infiniteProcess(maxRetries, minTimeoutMs);
        const rightChild1 = infiniteProcess(maxRetries, minTimeoutMs);
        const rightChild2 = infiniteProcess(maxRetries, minTimeoutMs);
        root.addDescendants(left, right);
        right.addDescendants(rightChild1, rightChild2);
        return [root, left, right, rightChild1, rightChild2];
    }
    function longSleepingProcessTree(maxRetries, minTimeoutMs) {
        const root = longSleepingProcess(maxRetries, minTimeoutMs);
        const left = longSleepingProcess(maxRetries, minTimeoutMs);
        const right = longSleepingProcess(maxRetries, minTimeoutMs);
        const rightChild1 = longSleepingProcess(maxRetries, minTimeoutMs);
        const rightChild2 = longSleepingProcess(maxRetries, minTimeoutMs);
        root.addDescendants(left, right);
        right.addDescendants(rightChild1, rightChild2);
        return [root, left, right, rightChild1, rightChild2];
    }
    async function yieldToRetry(maxRetries, minTimeoutMs) {
        // wait for while background retrying is finished
        let retryTimeoutMs = maxRetries * minTimeoutMs;
        log.info(`Sleep for ${retryTimeoutMs}ms while background retry is in progress`);
        await (0, util_1.sleep)(retryTimeoutMs);
    }
    function expectRunnable(node) {
        (0, chai_1.expect)(node.getCurrentState()).to.eql("runnable");
        (0, chai_1.expect)(node.getCurrentPid()).to.be.undefined;
        (0, chai_1.expect)(node.getLastKnownPid()).to.be.undefined;
    }
    function expectRunning(node) {
        (0, chai_1.expect)(node.getCurrentState()).to.eql("running");
        (0, chai_1.expect)(node.getCurrentPid()).to.be.not.undefined;
        (0, chai_1.expect)(node.getLastKnownPid()).to.be.not.undefined;
        (0, chai_1.expect)(node.getCurrentPid()).to.be.eql(node.getLastKnownPid());
    }
    function expectStopped(node) {
        (0, chai_1.expect)(node.getCurrentState()).to.eql("stopped");
        if (!isCiEnv()) {
            (0, chai_1.expect)(node.getCurrentPid()).to.be.undefined;
        }
        (0, chai_1.expect)(node.getLastKnownPid()).to.be.not.undefined;
    }
    function expectFailed(node) {
        (0, chai_1.expect)(node.getCurrentState()).to.eql("failed");
        (0, chai_1.expect)(node.getCurrentPid()).to.be.undefined;
        (0, chai_1.expect)(node.getLastKnownPid()).to.be.not.undefined;
        (0, chai_1.expect)(node.hasFailures()).to.be.true;
    }
    it("new instance has state 'runnable'", () => {
        const p = new recoverable_process_1.RecoverableProcess({
            osCommand: { command: "pwd" },
            retryConfig: { maxRetries: 1, minTimeoutMs: 1000 },
            log,
        });
        expectRunnable(p);
    });
    context("addDescendantProcesses", async () => {
        const maxRetries = 0;
        const minTimeoutMs = 0;
        let parent = longSleepingProcess(maxRetries, minTimeoutMs);
        let child = longSleepingProcess(maxRetries, minTimeoutMs);
        beforeEach(() => {
            parent = longSleepingProcess(maxRetries, minTimeoutMs);
            child = longSleepingProcess(maxRetries, minTimeoutMs);
        });
        function expectDescendantRejection(parentProc, childProc) {
            (0, chai_1.expect)(() => parentProc.addDescendants(childProc)).to.throw("Cannot attach a descendant to already running, stopped or failed process.");
            expectRunnable(childProc);
        }
        function setState(process, state) {
            process["state"] = state;
        }
        it('child processes can be added to a "runnable" parent', () => {
            (0, chai_1.expect)(() => parent.addDescendants(child)).to.not.throw();
            expectRunnable(parent);
            expectRunnable(child);
        });
        it('child processes can not be added to a "running" parent', async () => {
            setState(parent, "running");
            expectDescendantRejection(parent, child);
        });
        it('child processes can not be added to a "retrying" parent', async () => {
            setState(parent, "retrying");
            expectDescendantRejection(parent, child);
        });
        it('child processes can not be added to a "stopped" parent', async () => {
            setState(parent, "stopped");
            expectDescendantRejection(parent, child);
        });
        it('child processes can not be added to a "failed" parent', async () => {
            setState(parent, "failed");
            expectDescendantRejection(parent, child);
        });
    });
    it("startAll call is idempotent on success", () => {
        const p = infiniteProcess(0, 0);
        const running = p.startAll();
        expectRunning(p);
        const runningAgain = p.startAll();
        expectRunning(p);
        (0, chai_1.expect)(running).to.equal(runningAgain);
        p.stopAll();
        expectStopped(p);
    });
    it("stopAll call is idempotent", () => {
        const p = infiniteProcess(0, 0);
        p.startAll();
        expectRunning(p);
        p.stopAll();
        expectStopped(p);
        p.stopAll();
        expectStopped(p);
    });
    it("errorless process tree starts and stops on call from the root node", () => {
        const [root, left, right, rightChild1, rightChild2] = infiniteProcessTree(0, 0);
        root.startAll();
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        root.stopAll();
        expectStopped(root);
        expectStopped(left);
        expectStopped(right);
        expectStopped(rightChild1);
        expectStopped(rightChild2);
    });
    it("errorless process tree starts and stops on call from a leaf node", () => {
        const [root, left, right, rightChild1, rightChild2] = infiniteProcessTree(0, 0);
        rightChild1.startAll();
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        left.stopAll();
        expectStopped(root);
        expectStopped(left);
        expectStopped(right);
        expectStopped(rightChild1);
        expectStopped(rightChild2);
    });
    it("process subtree restarts on its root failure", async () => {
        if (isCiEnv()) {
            return;
        }
        const maxRetries = 5;
        const minTimeoutMs = 500;
        const [root, left, right, rightChild1, rightChild2] = longSleepingProcessTree(maxRetries, minTimeoutMs);
        root.startAll();
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        const rootPid = root.getCurrentPid();
        const leftPid = left.getCurrentPid();
        const rightPid = right.getCurrentPid();
        const rightChild1Pid = rightChild1.getCurrentPid();
        const rightChild2Pid = rightChild2.getCurrentPid();
        // kill right subtree's root process with external command
        killNode(right);
        await yieldToRetry(maxRetries, minTimeoutMs * 2);
        // all processes should be running again
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        // restarted processes should have different PIDs
        (0, chai_1.expect)(root.getCurrentPid()).to.eql(rootPid);
        (0, chai_1.expect)(left.getCurrentPid()).to.eql(leftPid);
        (0, chai_1.expect)(right.getCurrentPid()).to.not.eql(rightPid);
        (0, chai_1.expect)(rightChild1.getCurrentPid()).to.not.eql(rightChild1Pid);
        (0, chai_1.expect)(rightChild2.getCurrentPid()).to.not.eql(rightChild2Pid);
        root.stopAll();
        expectStopped(root);
        expectStopped(left);
        expectStopped(right);
        expectStopped(rightChild1);
        expectStopped(rightChild2);
    });
    it("entire process tree restarts on root process failure", async () => {
        if (isCiEnv()) {
            return;
        }
        const maxRetries = 5;
        const minTimeoutMs = 500;
        const root = longSleepingProcess(maxRetries, minTimeoutMs);
        const left = infiniteProcess(maxRetries, minTimeoutMs);
        const right = infiniteProcess(maxRetries, minTimeoutMs);
        const rightChild1 = infiniteProcess(maxRetries, minTimeoutMs);
        const rightChild2 = infiniteProcess(maxRetries, minTimeoutMs);
        root.addDescendants(left, right);
        right.addDescendants(rightChild1, rightChild2);
        root.startAll();
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        const rootPid = root.getCurrentPid();
        const leftPid = left.getCurrentPid();
        const rightPid = right.getCurrentPid();
        const rightChild1Pid = rightChild1.getCurrentPid();
        const rightChild2Pid = rightChild2.getCurrentPid();
        // kill tree's root process with external command
        killNode(root);
        await yieldToRetry(maxRetries, minTimeoutMs * 2);
        // all processes should be running again
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        // restarted processes should have different PIDs
        (0, chai_1.expect)(root.getCurrentPid()).to.not.eql(rootPid);
        (0, chai_1.expect)(left.getCurrentPid()).to.not.eql(leftPid);
        (0, chai_1.expect)(right.getCurrentPid()).to.not.eql(rightPid);
        (0, chai_1.expect)(rightChild1.getCurrentPid()).to.not.eql(rightChild1Pid);
        (0, chai_1.expect)(rightChild2.getCurrentPid()).to.not.eql(rightChild2Pid);
        root.stopAll();
        expectStopped(root);
        expectStopped(left);
        expectStopped(right);
        expectStopped(rightChild1);
        expectStopped(rightChild2);
    });
    it("entire process tree restarts when all processes are killed (root-to-leaf)", async () => {
        if (isCiEnv()) {
            return;
        }
        const maxRetries = 5;
        const minTimeoutMs = 500;
        const [root, left, right, rightChild1, rightChild2] = longSleepingProcessTree(maxRetries, minTimeoutMs);
        root.startAll();
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        const rootPid = root.getCurrentPid();
        const leftPid = left.getCurrentPid();
        const rightPid = right.getCurrentPid();
        const rightChild1Pid = rightChild1.getCurrentPid();
        const rightChild2Pid = rightChild2.getCurrentPid();
        // kill all processes in the tree starting from the root
        killNode(root);
        killNode(left);
        killNode(right);
        killNode(rightChild1);
        killNode(rightChild2);
        await yieldToRetry(maxRetries, minTimeoutMs * 2);
        // all processes should be running again
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        // restarted processes should have different PIDs
        (0, chai_1.expect)(root.getCurrentPid()).to.not.eql(rootPid);
        (0, chai_1.expect)(left.getCurrentPid()).to.not.eql(leftPid);
        (0, chai_1.expect)(right.getCurrentPid()).to.not.eql(rightPid);
        (0, chai_1.expect)(rightChild1.getCurrentPid()).to.not.eql(rightChild1Pid);
        (0, chai_1.expect)(rightChild2.getCurrentPid()).to.not.eql(rightChild2Pid);
        root.stopAll();
        expectStopped(root);
        expectStopped(left);
        expectStopped(right);
        expectStopped(rightChild1);
        expectStopped(rightChild2);
    });
    it("entire process tree restarts when all processes are killed (leaf-to-root)", async () => {
        if (isCiEnv()) {
            return;
        }
        const maxRetries = 5;
        const minTimeoutMs = 500;
        const [root, left, right, rightChild1, rightChild2] = longSleepingProcessTree(maxRetries, minTimeoutMs);
        root.startAll();
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        const rootPid = root.getCurrentPid();
        const leftPid = left.getCurrentPid();
        const rightPid = right.getCurrentPid();
        const rightChild1Pid = rightChild1.getCurrentPid();
        const rightChild2Pid = rightChild2.getCurrentPid();
        // kill all processes in the tree starting from the root
        killNode(rightChild2);
        killNode(rightChild1);
        killNode(right);
        killNode(left);
        killNode(root);
        await yieldToRetry(maxRetries, minTimeoutMs * 2);
        // all processes should be running again
        expectRunning(root);
        expectRunning(left);
        expectRunning(right);
        expectRunning(rightChild1);
        expectRunning(rightChild2);
        // restarted processes should have different PIDs
        (0, chai_1.expect)(root.getCurrentPid()).to.not.eql(rootPid);
        (0, chai_1.expect)(left.getCurrentPid()).to.not.eql(leftPid);
        (0, chai_1.expect)(right.getCurrentPid()).to.not.eql(rightPid);
        (0, chai_1.expect)(rightChild1.getCurrentPid()).to.not.eql(rightChild1Pid);
        (0, chai_1.expect)(rightChild2.getCurrentPid()).to.not.eql(rightChild2Pid);
        root.stopAll();
        expectStopped(root);
        expectStopped(left);
        expectStopped(right);
        expectStopped(rightChild1);
        expectStopped(rightChild2);
    });
    it("entire tree should fail on the root process failure", async () => {
        const maxRetries = 3;
        const minTimeoutMs = 500;
        const root = failingProcess(maxRetries, minTimeoutMs);
        const left = longSleepingProcess(maxRetries, minTimeoutMs);
        const right = longSleepingProcess(maxRetries, minTimeoutMs);
        root.addDescendants(left, right);
        root.startAll();
        await yieldToRetry(maxRetries, minTimeoutMs * 2);
        expectFailed(root);
        expectStopped(left);
        expectStopped(right);
        (0, chai_1.expect)(() => root.startAll()).to.throw("Cannot start the process tree. Some processes failed with no retries left.");
    });
    it("entire tree should fail on a node process failure", async () => {
        const maxRetries = 3;
        const minTimeoutMs = 500;
        const root = longSleepingProcess(maxRetries, minTimeoutMs);
        const left = longSleepingProcess(maxRetries, minTimeoutMs);
        const right = failingProcess(maxRetries, minTimeoutMs);
        const rightChild = longSleepingProcess(maxRetries, minTimeoutMs);
        root.addDescendants(left, right);
        right.addDescendants(rightChild);
        root.startAll();
        await yieldToRetry(maxRetries, minTimeoutMs * 2);
        expectStopped(root);
        expectStopped(left);
        expectFailed(right);
        expectStopped(rightChild);
        (0, chai_1.expect)(() => root.startAll()).to.throw("Cannot start the process tree. Some processes failed with no retries left.");
    });
    it("entire tree should fail on a leaf process failure", async () => {
        const maxRetries = 3;
        const minTimeoutMs = 500;
        const root = longSleepingProcess(maxRetries, minTimeoutMs);
        const left = longSleepingProcess(maxRetries, minTimeoutMs);
        const right = longSleepingProcess(maxRetries, minTimeoutMs);
        const rightChild = failingProcess(maxRetries, minTimeoutMs);
        root.addDescendants(left, right);
        right.addDescendants(rightChild);
        root.startAll();
        await yieldToRetry(maxRetries, minTimeoutMs * 2);
        expectStopped(root);
        expectStopped(left);
        expectStopped(right);
        expectFailed(rightChild);
        (0, chai_1.expect)(() => root.startAll()).to.throw("Cannot start the process tree. Some processes failed with no retries left.");
    });
    it("stopped process cannot be started", async () => {
        const maxRetries = 0;
        const minTimeoutMs = 500;
        const root = infiniteProcess(maxRetries, minTimeoutMs);
        root.startAll();
        root.stopAll();
        (0, chai_1.expect)(() => root.startAll()).to.throw("Cannot start already stopped process.");
    });
    it("failed process cannot be started", async () => {
        const maxRetries = 0;
        const minTimeoutMs = 500;
        const root = infiniteProcess(maxRetries, minTimeoutMs);
        const unsafeRoot = root;
        unsafeRoot.fail();
        (0, chai_1.expect)(() => unsafeRoot.startNode()).to.throw("Cannot start failed process with no retries left.");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3ZlcmFibGUtcHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlY292ZXJhYmxlLXByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCxzREFBeUI7QUFDekIsK0JBQTZCO0FBQzdCLGtGQUlpRDtBQUNqRCwwREFBeUQ7QUFDekQsb0RBQWlEO0FBQ2pELDhDQUFpRDtBQUVqRCxRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO0lBQ25DLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxFQUFFLENBQ1YsSUFBQSx5Q0FBbUIsRUFBQztZQUNsQixZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2hCLFVBQVUsRUFBRSxFQUFFO1NBQ2YsQ0FBQyxDQUNILENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFBO0lBQ3pELENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUN4QyxJQUFBLGFBQU0sRUFBQyxHQUFHLEVBQUUsQ0FDVixJQUFBLHlDQUFtQixFQUFDO1lBQ2xCLFlBQVksRUFBRSxDQUFDO1lBQ2YsVUFBVSxFQUFFLEVBQUU7U0FDZixDQUFDLENBQ0gsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUNoQixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxFQUFFLENBQ1YsSUFBQSx5Q0FBbUIsRUFBQztZQUNsQixZQUFZLEVBQUUsQ0FBQztZQUNmLFVBQVUsRUFBRSxFQUFFO1NBQ2YsQ0FBQyxDQUNILENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUE7SUFDaEIsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsa0NBQWtDLEVB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