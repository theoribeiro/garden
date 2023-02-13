"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestTask = void 0;
const chai_1 = require("chai");
const base_1 = require("../../../../src/tasks/base");
const helpers_1 = require("../../../helpers");
const vcs_1 = require("../../../../src/vcs/vcs");
const projectRoot = (0, helpers_1.getDataDir)("test-project-empty");
// TODO-G2: Implement equivalent test cases for the new graph
class TestTask extends base_1.BaseTask {
    constructor(params) {
        super(params);
        this.type = "test";
        this.name = params.name || "a";
        this.state = params.state || "not-ready";
        this.callback = params.callback || null;
        this.dependencies = params.dependencies || [];
        this.statusDependencies = params.statusDependencies || [];
        this.throwError = !!params.throwError;
    }
    resolveStatusDependencies() {
        return this.statusDependencies;
    }
    resolveProcessDependencies() {
        return this.dependencies;
    }
    getName() {
        return this.name;
    }
    getBaseKey() {
        return this.name;
    }
    getId() {
        return this.uid ? `${this.name}.${this.uid}` : this.name;
    }
    getDescription() {
        return this.getId();
    }
    async getStatus(params) {
        let callbackResult = undefined;
        if (this.statusCallback) {
            callbackResult = await this.statusCallback({ task: this, params });
        }
        if (this.throwError) {
            throw new Error();
        }
        return {
            state: this.state,
            outputs: {
                id: this.getId(),
                processed: false,
                callbackResult,
            },
        };
    }
    async process(params) {
        let callbackResult = undefined;
        if (this.callback) {
            callbackResult = await this.callback({ task: this, params });
        }
        if (this.throwError) {
            throw new Error();
        }
        return {
            state: "ready",
            outputs: {
                id: this.getId(),
                processed: true,
                callbackResult,
            },
        };
    }
}
exports.TestTask = TestTask;
describe("GraphSolver", () => {
    let now;
    let garden;
    beforeEach(async () => {
        now = (0, helpers_1.freezeTime)();
        garden = await (0, helpers_1.makeTestGarden)(projectRoot);
    });
    function makeTask(params) {
        const _garden = params.garden || garden;
        return new TestTask({
            ...params,
            garden: _garden,
            log: params.log || _garden.log,
            version: params.version || vcs_1.NEW_RESOURCE_VERSION,
            force: params.force || false,
        });
    }
    async function processTask(task, opts = {}) {
        return garden.processTask(task, garden.log, opts);
    }
    it("processes a single task without dependencies", async () => {
        var _a;
        const task = makeTask({});
        const result = await processTask(task, { throwOnError: true });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)(result.type).to.equal("test");
        (0, chai_1.expect)(result.name).to.equal("a");
        (0, chai_1.expect)(result.startedAt).to.eql(now);
        (0, chai_1.expect)(result.completedAt).to.eql(now);
        (0, chai_1.expect)(result.version).to.equal(task.version);
        (0, chai_1.expect)((_a = result.result) === null || _a === void 0 ? void 0 : _a.state).to.equal("ready");
        (0, chai_1.expect)(result.outputs["processed"]).to.equal(true);
    });
    it("returns status for task without processing if it's status is ready and force=false", async () => {
        var _a;
        const task = makeTask({ state: "ready" });
        const result = await processTask(task, { throwOnError: true });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)((_a = result.result) === null || _a === void 0 ? void 0 : _a.state).to.equal("ready");
        (0, chai_1.expect)(result.outputs["processed"]).to.equal(false);
    });
    it("processes task if it's status is ready and force=true", async () => {
        var _a;
        const task = makeTask({ state: "ready", force: true });
        const result = await processTask(task, { throwOnError: true });
        (0, chai_1.expect)(result).to.exist;
        (0, chai_1.expect)((_a = result.result) === null || _a === void 0 ? void 0 : _a.state).to.equal("ready");
        (0, chai_1.expect)(result.outputs["processed"]).to.equal(true);
    });
    it("processes two tasks in dependency order", async () => {
        const taskA = makeTask({ name: "a" });
        const taskB = makeTask({
            name: "b",
            dependencies: [taskA],
            callback: async ({ params }) => {
                var _a;
                return (_a = params.dependencyResults.getResult(taskA)) === null || _a === void 0 ? void 0 : _a.outputs.id;
            },
        });
        const { error, results } = await garden.processTasks({ tasks: [taskA, taskB], throwOnError: true });
        (0, chai_1.expect)(error).to.not.exist;
        (0, chai_1.expect)(results).to.exist;
        // const resultA = results.getResult(taskA)
        const resultB = results.getResult(taskB);
        (0, chai_1.expect)(resultB === null || resultB === void 0 ? void 0 : resultB.outputs.callbackResult).to.equal(taskA.getId());
    });
    it("processes a complex graph correctly", async () => {
        throw "TODO";
    });
    it("returns an error when task processing fails", async () => {
        throw "TODO";
    });
    it("returns an error when task status fails", async () => {
        throw "TODO";
    });
    it("cascades an error from dependency to dependant and fails the execution", async () => {
        throw "TODO";
    });
    it("cascades an error recursively from dependency and fails the execution", async () => {
        throw "TODO";
    });
    // it("should emit a taskPending event when adding a task", async () => {
    //   const now = freezeTime()
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const task = new TestTask(garden, "a", false)
    //   const result = await graph.process([task])
    //   const generatedBatchId = result?.a?.batchId || uuidv4()
    //   expect(garden.events.eventLog).to.eql([
    //     { name: "taskGraphProcessing", payload: { startedAt: now } },
    //     {
    //       name: "taskPending",
    //       payload: {
    //         addedAt: now,
    //         batchId: generatedBatchId,
    //         key: task.getBaseKey(),
    //         name: task.name,
    //         type: task.type,
    //       },
    //     },
    //     {
    //       name: "taskProcessing",
    //       payload: {
    //         startedAt: now,
    //         batchId: generatedBatchId,
    //         key: task.getBaseKey(),
    //         name: task.name,
    //         type: task.type,
    //         versionString: task.version,
    //       },
    //     },
    //     { name: "taskComplete", payload: toGraphResultEventPayload(result["a"]!) },
    //     { name: "taskGraphComplete", payload: { completedAt: now } },
    //   ])
    // })
    // it("should throw if tasks have circular dependencies", async () => {
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const taskA = new TestTask(garden, "a", false)
    //   const taskB = new TestTask(garden, "b", false, { dependencies: [taskA] })
    //   const taskC = new TestTask(garden, "c", false, { dependencies: [taskB] })
    //   taskA["dependencies"] = [taskC]
    //   const errorMsg = "Circular task dependencies detected:\n\nb <- a <- c <- b\n"
    //   await expectError(
    //     () => graph.process([taskB]),
    //     (err) => expect(err.message).to.eql(errorMsg)
    //   )
    // })
    // it("should emit events when processing and completing a task", async () => {
    //   const now = freezeTime()
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const task = new TestTask(garden, "a", false)
    //   await graph.process([task])
    //   garden.events.eventLog = []
    //   // repeatedTask has the same key and version as task, so its result is already cached
    //   const repeatedTask = new TestTask(garden, "a", false)
    //   const results = await graph.process([repeatedTask])
    //   expect(garden.events.eventLog).to.eql([
    //     { name: "taskGraphProcessing", payload: { startedAt: now } },
    //     {
    //       name: "taskComplete",
    //       payload: toGraphResultEventPayload(results["a"]!),
    //     },
    //     { name: "taskGraphComplete", payload: { completedAt: now } },
    //   ])
    // })
    // it("should emit a taskError event when failing a task", async () => {
    //   const now = freezeTime()
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const task = new TestTask(garden, "a", false, { throwError: true })
    //   const result = await graph.process([task])
    //   const generatedBatchId = result?.a?.batchId || uuidv4()
    //   expect(garden.events.eventLog).to.eql([
    //     { name: "taskGraphProcessing", payload: { startedAt: now } },
    //     {
    //       name: "taskPending",
    //       payload: {
    //         addedAt: now,
    //         batchId: generatedBatchId,
    //         key: task.getBaseKey(),
    //         name: task.name,
    //         type: task.type,
    //       },
    //     },
    //     {
    //       name: "taskProcessing",
    //       payload: {
    //         startedAt: now,
    //         batchId: generatedBatchId,
    //         key: task.getBaseKey(),
    //         name: task.name,
    //         type: task.type,
    //         versionString: task.version,
    //       },
    //     },
    //     { name: "taskError", payload: sanitizeValue(result["a"]) },
    //     { name: "taskGraphComplete", payload: { completedAt: now } },
    //   ])
    // })
    // it("should have error property inside taskError event when failing a task", async () => {
    //   freezeTime()
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const task = new TestTask(garden, "a", false, { throwError: true })
    //   await graph.process([task])
    //   const taskError = garden.events.eventLog.find((obj) => obj.name === "taskError")
    //   expect(taskError && taskError.payload["error"]).to.exist
    // })
    // it("should throw on task error if throwOnError is set", async () => {
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const task = new TestTask(garden, "a", false, { throwError: true })
    //   await expectError(
    //     () => graph.process([task], { throwOnError: true }),
    //     (err) => expect(err.message).to.include("action(s) failed")
    //   )
    // })
    // it("should include any task errors in task results", async () => {
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const taskA = new TestTask(garden, "a", false, { throwError: true })
    //   const taskB = new TestTask(garden, "b", false, { throwError: true })
    //   const taskC = new TestTask(garden, "c", false)
    //   const results = await graph.process([taskA, taskB, taskC])
    //   expect(results.a!.error).to.exist
    //   expect(results.b!.error).to.exist
    //   expect(results.c!.error).to.not.exist
    // })
    // it("should process multiple tasks in dependency order", async () => {
    //   const now = freezeTime()
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const callbackResults = {}
    //   const resultOrder: string[] = []
    //   const callback = async (key: string, result: any) => {
    //     resultOrder.push(key)
    //     callbackResults[key] = result
    //   }
    //   const opts = { callback }
    //   const taskA = new TestTask(garden, "a", false, { ...opts, dependencies: [], uid: "a1" })
    //   const taskB = new TestTask(garden, "b", false, { ...opts, dependencies: [taskA], uid: "b1" })
    //   const taskC = new TestTask(garden, "c", false, { ...opts, dependencies: [taskB], uid: "c1" })
    //   const taskD = new TestTask(garden, "d", false, { ...opts, dependencies: [taskB, taskC], uid: "d1" })
    //   // we should be able to add tasks multiple times and in any order
    //   const results = await graph.process([taskA, taskB, taskC, taskC, taskD, taskA, taskD, taskB, taskD, taskA])
    //   const generatedBatchId = results?.a?.batchId || uuidv4()
    //   // repeat
    //   const repeatCallbackResults = {}
    //   const repeatResultOrder: string[] = []
    //   const repeatCallback = async (key: string, result: any) => {
    //     repeatResultOrder.push(key)
    //     repeatCallbackResults[key] = result
    //   }
    //   const repeatOpts = { callback: repeatCallback }
    //   const repeatTaskA = new TestTask(garden, "a", false, { ...repeatOpts, dependencies: [], uid: "a2" })
    //   const repeatTaskB = new TestTask(garden, "b", false, { ...repeatOpts, dependencies: [repeatTaskA], uid: "b2" })
    //   const repeatTaskC = new TestTask(garden, "c", true, { ...repeatOpts, dependencies: [repeatTaskB], uid: "c2" })
    //   const repeatTaskAforced = new TestTask(garden, "a", true, { ...repeatOpts, dependencies: [], uid: "a2f" })
    //   const repeatTaskBforced = new TestTask(garden, "b", true, {
    //     ...repeatOpts,
    //     dependencies: [repeatTaskA],
    //     uid: "b2f",
    //   })
    //   await graph.process([repeatTaskBforced, repeatTaskAforced, repeatTaskC])
    //   const resultA: GraphResult = {
    //     type: "test",
    //     description: "a.a1",
    //     key: "a",
    //     name: "a",
    //     startedAt: now,
    //     completedAt: now,
    //     batchId: generatedBatchId,
    //     result: {
    //       result: "result-a.a1",
    //       dependencyResults: {},
    //     },
    //     dependencyResults: {},
    //     version: taskA.version,
    //   }
    //   const resultB: GraphResult = {
    //     type: "test",
    //     key: "b",
    //     name: "b",
    //     description: "b.b1",
    //     startedAt: now,
    //     completedAt: now,
    //     batchId: generatedBatchId,
    //     result: {
    //       result: "result-b.b1",
    //       dependencyResults: { a: resultA },
    //     },
    //     dependencyResults: { a: resultA },
    //     version: taskB.version,
    //   }
    //   const resultC: GraphResult = {
    //     type: "test",
    //     description: "c.c1",
    //     key: "c",
    //     name: "c",
    //     startedAt: now,
    //     completedAt: now,
    //     batchId: generatedBatchId,
    //     result: {
    //       result: "result-c.c1",
    //       dependencyResults: { b: resultB },
    //     },
    //     dependencyResults: { b: resultB },
    //     version: taskC.version,
    //   }
    //   const expected: GraphResults = {
    //     a: resultA,
    //     b: resultB,
    //     c: resultC,
    //     d: {
    //       type: "test",
    //       description: "d.d1",
    //       key: "d",
    //       name: "d",
    //       startedAt: now,
    //       completedAt: now,
    //       batchId: generatedBatchId,
    //       result: {
    //         result: "result-d.d1",
    //         dependencyResults: {
    //           b: resultB,
    //           c: resultC,
    //         },
    //       },
    //       dependencyResults: {
    //         b: resultB,
    //         c: resultC,
    //       },
    //       version: taskD.version,
    //     },
    //   }
    //   expect(results).to.eql(expected, "Wrong results after initial add and process")
    //   expect(resultOrder).to.eql(["a.a1", "b.b1", "c.c1", "d.d1"], "Wrong result order after initial add and process")
    //   expect(callbackResults).to.eql(
    //     {
    //       "a.a1": "result-a.a1",
    //       "b.b1": "result-b.b1",
    //       "c.c1": "result-c.c1",
    //       "d.d1": "result-d.d1",
    //     },
    //     "Wrong callbackResults after initial add and process"
    //   )
    //   expect(repeatResultOrder).to.eql(["a.a2f", "b.b2f", "c.c2"], "Wrong result order after repeat add & process")
    //   expect(repeatCallbackResults).to.eql(
    //     {
    //       "a.a2f": "result-a.a2f",
    //       "b.b2f": "result-b.b2f",
    //       "c.c2": "result-c.c2",
    //     },
    //     "Wrong callbackResults after repeat add & process"
    //   )
    // })
    // it("should add at most one pending task for a given key", async () => {
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const processedVersions: string[] = []
    //   const { promise: t1StartedPromise, resolver: t1StartedResolver } = defer()
    //   const { promise: t1DonePromise, resolver: t1DoneResolver } = defer()
    //   const t1 = new TestTask(garden, "a", false, {
    //     versionString: "1",
    //     uid: "1",
    //     callback: async () => {
    //       t1StartedResolver()
    //       processedVersions.push("1")
    //       await t1DonePromise
    //     },
    //   })
    //   const repeatedCallback = (version: string) => {
    //     return async () => {
    //       processedVersions.push(version)
    //     }
    //   }
    //   const t2 = new TestTask(garden, "a", false, { uid: "2", versionString: "2", callback: repeatedCallback("2") })
    //   const t3 = new TestTask(garden, "a", false, { uid: "3", versionString: "3", callback: repeatedCallback("3") })
    //   const firstProcess = graph.process([t1])
    //   // We make sure t1 is being processed before adding t2 and t3. Since t3 is added after t2,
    //   // only t1 and t3 should be processed (since t2 and t3 have the same key, "a").
    //   await t1StartedPromise
    //   const secondProcess = graph.process([t2])
    //   const thirdProcess = graph.process([t3])
    //   await sleep(200) // TODO: Get rid of this?
    //   t1DoneResolver()
    //   await Bluebird.all([firstProcess, secondProcess, thirdProcess])
    //   expect(processedVersions).to.eql(["1", "3"])
    // })
    // TODO-G2: not implemented
    // it("should process requests with unrelated tasks concurrently", async () => {
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const resultOrder: string[] = []
    //   const callback = async (key: string) => {
    //     resultOrder.push(key)
    //   }
    //   const { resolver: aStartedResolver } = defer()
    //   const { promise: aDonePromise, resolver: aDoneResolver } = defer()
    //   const opts = { callback }
    //   const taskADep1 = new TestTask(garden, "a-dep1", false, { ...opts })
    //   const taskADep2 = new TestTask(garden, "a-dep2", false, { ...opts })
    //   const taskA = new TestTask(garden, "a", false, {
    //     dependencies: [taskADep1, taskADep2],
    //     callback: async () => {
    //       aStartedResolver()
    //       resultOrder.push("a")
    //       await aDonePromise
    //     },
    //   })
    //   const taskBDep = new TestTask(garden, "b-dep", false, { ...opts })
    //   const taskB = new TestTask(garden, "b", false, { ...opts, dependencies: [taskBDep] })
    //   const taskC = new TestTask(garden, "c", false, { ...opts })
    //   const firstProcess = graph.process([taskA, taskADep1, taskADep2])
    //   const secondProcess = graph.process([taskB, taskBDep])
    //   const thirdProcess = graph.process([taskC])
    //   aDoneResolver()
    //   await Bluebird.all([firstProcess, secondProcess, thirdProcess])
    //   expect(resultOrder).to.eql(["c", "a-dep1", "a-dep2", "b-dep", "a", "b"])
    // })
    // it("should process two requests with related tasks sequentially", async () => {
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const resultOrder: string[] = []
    //   const callback = async (key: string) => {
    //     resultOrder.push(key)
    //   }
    //   const { resolver: aStartedResolver } = defer()
    //   const { promise: aDonePromise, resolver: aDoneResolver } = defer()
    //   const opts = { callback }
    //   const taskADep = new TestTask(garden, "a-dep1", true, { ...opts })
    //   const taskA = new TestTask(garden, "a", true, {
    //     dependencies: [taskADep],
    //     callback: async () => {
    //       aStartedResolver()
    //       resultOrder.push("a")
    //       await aDonePromise
    //     },
    //   })
    //   const repeatTaskBDep = new TestTask(garden, "b-dep", true, { ...opts })
    //   const firstProcess = graph.process([taskA, taskADep])
    //   const secondProcess = graph.process([repeatTaskBDep])
    //   aDoneResolver()
    //   await Bluebird.all([firstProcess, secondProcess])
    //   expect(resultOrder).to.eql(["b-dep", "a-dep1", "a"])
    // })
    // it("should enforce a hard concurrency limit on task processing", async () => {
    //   const garden = await getGarden()
    //   const tasks = range(0, 10).map((n) => new TestTask(garden, "task-" + n, false))
    //   const limit = 3
    //   const graph = new TaskGraph(garden, garden.log, limit)
    //   let gotEvents = false
    //   graph.on("process", (event) => {
    //     gotEvents = true
    //     // Ensure we never go over the hard limit
    //     expect(event.keys.length + event.inProgress.length).to.lte(limit)
    //   })
    //   await graph.process(tasks)
    //   expect(gotEvents).to.be.true
    // })
    // it("should enforce a concurrency limit per task type", async () => {
    //   const garden = await getGarden()
    //   const limit = 2
    //   class TaskTypeA extends TestTask {
    //     type = "a"
    //     concurrencyLimit = limit
    //   }
    //   class TaskTypeB extends TestTask {
    //     type = "b"
    //     concurrencyLimit = limit
    //   }
    //   const tasks = [
    //     ...range(0, 10).map((n) => new TaskTypeA(garden, "a-" + n, false)),
    //     ...range(0, 10).map((n) => new TaskTypeB(garden, "b-" + n, false)),
    //   ]
    //   const graph = new TaskGraph(garden, garden.log)
    //   let gotEvents = false
    //   graph.on("process", (event) => {
    //     gotEvents = true
    //     // Ensure not more than two of each task type run concurrently
    //     for (const type of ["a", "b"]) {
    //       const keys = [...event.keys, ...event.inProgress].filter((key) => key.startsWith(type))
    //       expect(keys.length).to.lte(limit)
    //     }
    //   })
    //   await graph.process(tasks)
    //   expect(gotEvents).to.be.true
    // })
    // it("should recursively cancel a task's dependants when it throws an error", async () => {
    //   const now = freezeTime()
    //   const garden = await getGarden()
    //   const graph = new TaskGraph(garden, garden.log)
    //   const resultOrder: string[] = []
    //   const callback = async (key: string) => {
    //     resultOrder.push(key)
    //   }
    //   const opts = { callback }
    //   const taskA = new TestTask(garden, "a", true, { ...opts })
    //   const taskB = new TestTask(garden, "b", true, { callback, throwError: true, dependencies: [taskA] })
    //   const taskC = new TestTask(garden, "c", true, { ...opts, dependencies: [taskB] })
    //   const taskD = new TestTask(garden, "d", true, { ...opts, dependencies: [taskB, taskC] })
    //   const results = await graph.process([taskA, taskB, taskC, taskD])
    //   const generatedBatchId = results?.a?.batchId || uuidv4()
    //   const resultA: GraphResult = {
    //     type: "test",
    //     description: "a",
    //     key: "a",
    //     name: "a",
    //     startedAt: now,
    //     completedAt: now,
    //     batchId: generatedBatchId,
    //     result: {
    //       result: "result-a",
    //       dependencyResults: {},
    //     },
    //     dependencyResults: {},
    //     version: taskA.version,
    //   }
    //   const filteredKeys: Set<string | number> = new Set([
    //     "version",
    //     "versionString",
    //     "error",
    //     "addedAt",
    //     "startedAt",
    //     "cancelledAt",
    //     "completedAt",
    //   ])
    //   const filteredEventLog = garden.events.eventLog.map((e) => {
    //     return deepFilter(e, (_, key) => !filteredKeys.has(key))
    //   })
    //   expect(results.a).to.eql(resultA)
    //   expect(results.b).to.have.property("error")
    //   expect(resultOrder).to.eql(["a", "b"])
    //   expect(filteredEventLog).to.eql([
    //     { name: "taskGraphProcessing", payload: {} },
    //     { name: "taskPending", payload: { key: "a", name: "a", type: "test", batchId: generatedBatchId } },
    //     { name: "taskPending", payload: { key: "b", name: "b", type: "test", batchId: generatedBatchId } },
    //     { name: "taskPending", payload: { key: "c", name: "c", type: "test", batchId: generatedBatchId } },
    //     { name: "taskPending", payload: { key: "d", name: "d", type: "test", batchId: generatedBatchId } },
    //     { name: "taskProcessing", payload: { key: "a", name: "a", type: "test", batchId: generatedBatchId } },
    //     {
    //       name: "taskComplete",
    //       payload: {
    //         description: "a",
    //         key: "a",
    //         name: "a",
    //         type: "test",
    //         batchId: generatedBatchId,
    //         output: { result: "result-a" },
    //       },
    //     },
    //     { name: "taskProcessing", payload: { key: "b", name: "b", type: "test", batchId: generatedBatchId } },
    //     {
    //       name: "taskError",
    //       payload: { description: "b", key: "b", name: "b", type: "test", batchId: generatedBatchId },
    //     },
    //     { name: "taskCancelled", payload: { key: "c", name: "c", type: "test", batchId: generatedBatchId } },
    //     { name: "taskCancelled", payload: { key: "d", name: "d", type: "test", batchId: generatedBatchId } },
    //     { name: "taskCancelled", payload: { key: "d", name: "d", type: "test", batchId: generatedBatchId } },
    //     { name: "taskGraphComplete", payload: {} },
    //   ])
    // })
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtCQUE2QjtBQUM3QixxREFBeUc7QUFDekcsOENBQXFGO0FBSXJGLGlEQUE4RDtBQUU5RCxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsb0JBQW9CLENBQUMsQ0FBQTtBQXFCcEQsNkRBQTZEO0FBRTdELE1BQWEsUUFBUyxTQUFRLGVBQXdCO0lBV3BELFlBQVksTUFBc0I7UUFDaEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBWGYsU0FBSSxHQUFHLE1BQU0sQ0FBQTtRQVlYLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksSUFBSSxHQUFHLENBQUE7UUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxJQUFJLFdBQVcsQ0FBQTtRQUN4QyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFBO1FBQ3ZDLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUE7UUFDN0MsSUFBSSxDQUFDLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsSUFBSSxFQUFFLENBQUE7UUFDekQsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtJQUN2QyxDQUFDO0lBRUQseUJBQXlCO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFBO0lBQ2hDLENBQUM7SUFFRCwwQkFBMEI7UUFDeEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFBO0lBQzFCLENBQUM7SUFFRCxPQUFPO1FBQ0wsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ2xCLENBQUM7SUFFRCxVQUFVO1FBQ1IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ2xCLENBQUM7SUFFRCxL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