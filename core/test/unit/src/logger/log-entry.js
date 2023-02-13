/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
// import { expect } from "chai"
// 
// import { getLogger, Logger } from "../../../../src/logger/logger"
// import { freezeTime } from "../../../helpers"
// import { LogEntryMetadata, TaskMetadata } from "../../../../src/logger/log-entry"
// 
// const logger: Logger = getLogger()
// 
// beforeEach(() => {
//   logger["children"] = []
// })
// 
// describe("LogEntry", () => {
//   const emptyState = {
//     msg: undefined,
//     emoji: undefined,
//     section: undefined,
//     symbol: undefined,
//     status: undefined,
//     data: undefined,
//     dataFormat: undefined,
//     append: undefined,
//   }
//   it("should create log entries with the appropriate fields set", () => {
//     const timestamp = freezeTime()
//     const entry = logger.info({
//       id: "my-id",
//       msg: "hello",
//       emoji: "alien",
//       status: "error",
//       section: "80",
//       symbol: "info",
//       append: true,
//       data: { foo: "bar" },
//       dataFormat: "json",
//       metadata: {
//         workflowStep: {
//           index: 2,
//         },
//       },
//     })
//     expect(entry.getMetadata()).to.eql({
//       workflowStep: {
//         index: 2,
//       },
//     })
//     expect(entry.getMessages()).to.eql([
//       {
//         msg: "hello",
//         emoji: "alien",
//         status: "error",
//         section: "80",
//         symbol: "info",
//         append: true,
//         data: { foo: "bar" },
//         dataFormat: "json",
//         timestamp,
//       },
//     ])
//     expect(entry.isPlaceholder).to.be.false
//     expect(entry.revision).to.eql(0)
//     expect(entry.id).to.eql("my-id")
//   })
//   it("should indent nested log entries", () => {
//     const entry = logger.info("hello")
//     const nested = entry.info("nested")
//     const deepNested = nested.info("deep nested")
//     const deepDeepNested = deepNested.info("deep deep inside")
//     const deepDeepPh = deepDeepNested.placeholder()
//     const deepDeepNested2 = deepDeepPh.info("")
//     const indents = [
//       entry.indent,
//       nested.indent,
//       deepNested.indent,
//       deepDeepNested.indent,
//       deepDeepPh.indent,
//       deepDeepNested2.indent,
//     ]
//     expect(indents).to.eql([undefined, 1, 2, 3, 2, 3])
//   })
//   context("placeholders", () => {
//     it("should dedent placeholder log entries", () => {
//       const ph1 = logger.placeholder()
//       const ph2 = ph1.placeholder()
//       const nonEmpty = ph1.info("foo")
//       const nested = nonEmpty.info("foo")
//       const nestedPh = nested.placeholder()
//       const indents = [ph1.indent, ph2.indent, nonEmpty.indent, nested.indent, nestedPh.indent]
//       expect(indents).to.eql([-1, -1, 0, 1, 0])
//     })
//     it("should initialize placeholders with an empty message and a timestamp", () => {
//       const timestamp = freezeTime()
//       const ph = logger.placeholder()
//       expect(ph.isPlaceholder).to.be.true
//       expect(ph.getMessages()).to.eql([{ timestamp }])
//     })
//     it("should correctly update placeholders", () => {
//       const timestamp = freezeTime()
//       const ph = logger.placeholder()
//       const hello = ph.info("hello")
//       ph.setState("world")
//       expect(hello.getMessages()).to.eql([{ ...emptyState, timestamp, msg: "hello" }])
//       expect(hello.isPlaceholder).to.be.false
//       expect(ph.getMessages()).to.eql([{ ...emptyState, timestamp, msg: "world" }])
//       expect(ph.isPlaceholder).to.be.false
//     })
//   })
//   context("metadata", () => {
//     const metadata: LogEntryMetadata = { workflowStep: { index: 1 } }
//     it("should pass on any metadata to placeholder or child nodes", () => {
//       const ph1 = logger.placeholder({ metadata })
//       const ph2 = ph1.placeholder()
//       const entry = logger.info({ msg: "hello", metadata })
//       const ph3 = entry.placeholder()
//       const nested = entry.info("nested")
//       const entry2 = logger.info("hello")
//       const ph4 = entry2.placeholder({ metadata })
//       expect(ph1.getMetadata()).to.eql(metadata)
//       expect(ph2.getMetadata()).to.eql(metadata)
//       expect(ph3.getMetadata()).to.eql(metadata)
//       expect(ph4.getMetadata()).to.eql(metadata)
//       expect(entry.getMetadata()).to.eql(metadata)
//       expect(entry2.getMetadata()).to.eql(undefined)
//       expect(nested.getMetadata()).to.eql(metadata)
//     })
//     it("should not set metadata on parent when creating placeholders or child nodes", () => {
//       const entry = logger.info("hello")
//       const ph = entry.placeholder({ metadata })
//       expect(entry.getMetadata()).to.eql(undefined)
//       expect(ph.getMetadata()).to.eql(metadata)
//     })
//     it("should not set empty metadata objects on child entries", () => {
//       const entry = logger.info("hello")
//       const child = entry.info("world")
//       expect(entry.getMetadata()).to.eql(undefined)
//       expect(child.getMetadata()).to.eql(undefined)
//     })
//   })
//   context("childEntriesInheritLevel is set to true", () => {
//     it("should create a log entry whose children inherit the parent level", () => {
//       const verbose = logger.verbose({ childEntriesInheritLevel: true })
//       const error = verbose.error("")
//       const silly = verbose.silly("")
//       const deepError = error.error("")
//       const deepSillyError = silly.error("")
//       const deepSillySilly = silly.silly("")
//       const levels = [
//         verbose.warn("").level,
//         verbose.info("").level,
//         verbose.verbose("").level,
//         verbose.debug("").level,
//         verbose.silly("").level,
//         deepError.level,
//         deepSillyError.level,
//         deepSillySilly.level,
//       ]
//       expect(levels).to.eql([3, 3, 3, 4, 5, 3, 3, 5])
//     })
//   })
//   describe("setState", () => {
//     it("should update entry state", () => {
//       const timestamp = freezeTime()
//       const taskMetadata: TaskMetadata = {
//         type: "a",
//         key: "a",
//         status: "active",
//         uid: "1",
//         versionString: "123",
//       }
//       const entry = logger.placeholder()
//       entry.setState({
//         msg: "hello",
//         emoji: "haircut",
//         section: "caesar",
//         symbol: "info",
//         status: "done",
//         data: { some: "data" },
//         dataFormat: "json",
//         metadata: { task: taskMetadata },
//       })
// 
//       expect(entry.getMessages()).to.eql([
//         {
//           msg: "hello",
//           emoji: "haircut",
//           section: "caesar",
//           symbol: "info",
//           status: "done",
//           data: { some: "data" },
//           dataFormat: "json",
//           append: undefined,
//           timestamp,
//         },
//       ])
//       expect(entry.getMetadata()).to.eql({ task: taskMetadata })
//     })
//     it("should overwrite previous values", () => {
//       const timestamp = freezeTime()
//       const entry = logger.placeholder()
//       entry.setState({
//         msg: "hello",
//         emoji: "haircut",
//         section: "caesar",
//         symbol: "info",
//         status: "done",
//         data: { some: "data" },
//       })
//       entry.setState({
//         msg: "world",
//         emoji: "hamburger",
//         data: { some: "data_updated" },
//       })
// 
//       expect(entry.getMessages()).to.eql([
//         {
//           msg: "hello",
//           emoji: "haircut",
//           section: "caesar",
//           symbol: "info",
//           status: "done",
//           data: { some: "data" },
//           dataFormat: undefined,
//           append: undefined,
//           timestamp,
//         },
//         {
//           msg: "world",
//           emoji: "hamburger",
//           section: "caesar",
//           symbol: "info",
//           status: "done",
//           data: { some: "data_updated" },
//           dataFormat: undefined,
//           append: undefined,
//           timestamp,
//         },
//       ])
//     })
//     it("should set the 'append' field separately for each message state", () => {
//       const timestamp = freezeTime()
//       const entry = logger.placeholder()
// 
//       entry.setState({ append: true })
//       expect(entry.getMessages()).to.eql([{ ...emptyState, append: true, timestamp }])
// 
//       entry.setState({ msg: "boo" })
//       expect(entry.getMessages()).to.eql([
//         { ...emptyState, append: true, timestamp },
//         { ...emptyState, append: undefined, msg: "boo", timestamp },
//       ])
// 
//       entry.setState({ append: true })
//       expect(entry.getMessages()).to.eql([
//         { ...emptyState, append: true, timestamp },
//         { ...emptyState, append: undefined, msg: "boo", timestamp },
//         { ...emptyState, append: true, msg: "boo", timestamp },
//       ])
//     })
//     it("should preserve status", () => {
//       const entry = logger.info("")
//       entry.setSuccess()
//       entry.setState("change text")
//       expect(entry.getLatestMessage().status).to.equal("success")
//     })
//     it("should set symbol to empty if entry has section and spinner disappears (to preserve alignment)", () => {
//       const entry = logger.info({ status: "active", section: "foo" })
//       entry.setState({ status: "error" })
//       expect(entry.getLatestMessage().symbol).to.equal("empty")
// 
//       const newEntry = logger.info({
//         status: "active",
//         section: "foo",
//         symbol: "info",
//       })
//       newEntry.setState({ status: "error" })
//       expect(newEntry.getLatestMessage().symbol).to.equal("info")
//     })
//     it("should update the metadata property", () => {
//       const timestamp = freezeTime()
//       const taskMetadataA: TaskMetadata = {
//         type: "a",
//         key: "a",
//         status: "active",
//         uid: "1",
//         versionString: "123",
//       }
//       const taskMetadataB: TaskMetadata = {
//         ...taskMetadataA,
//         status: "error",
//       }
//       const entry = logger.placeholder()
//       entry.setState({ metadata: { task: taskMetadataA } })
//       expect(entry.getMetadata()).to.eql({ task: taskMetadataA })
//       // Message states should not change
//       expect(entry.getMessages()).to.eql([{ ...emptyState, timestamp }])
// 
//       entry.setState({ metadata: { task: taskMetadataB } })
//       expect(entry.getMetadata()).to.eql({ task: taskMetadataB })
//       expect(entry.getMessages()).to.eql([
//         { ...emptyState, timestamp },
//         { ...emptyState, timestamp },
//       ])
//     })
//   })
//   describe("setDone", () => {
//     it("should update entry state and set status to done", () => {
//       const entry = logger.info("")
//       entry.setDone()
//       expect(entry.getLatestMessage().status).to.equal("done")
//     })
//   })
//   describe("setSuccess", () => {
//     it("should update entry state and set status and symbol to success", () => {
//       const entry = logger.info("")
//       entry.setSuccess()
//       expect(entry.getLatestMessage().status).to.equal("success")
//       expect(entry.getLatestMessage().symbol).to.equal("success")
//     })
//   })
//   describe("setError", () => {
//     it("should update entry state and set status and symbol to error", () => {
//       const entry = logger.info("")
//       entry.setError()
//       expect(entry.getLatestMessage().status).to.equal("error")
//       expect(entry.getLatestMessage().symbol).to.equal("error")
//     })
//   })
//   describe("setWarn", () => {
//     it("should update entry state and set status and symbol to warn", () => {
//       const entry = logger.info("")
//       entry.setWarn()
//       expect(entry.getLatestMessage().status).to.equal("warn")
//       expect(entry.getLatestMessage().symbol).to.equal("warning")
//     })
//   })
// })
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLWVudHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nLWVudHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILGdDQUFnQztBQUNoQyxHQUFHO0FBQ0gsb0VBQW9FO0FBQ3BFLGdEQUFnRDtBQUNoRCxvRkFBb0Y7QUFDcEYsR0FBRztBQUNILHFDQUFxQztBQUNyQyxHQUFHO0FBQ0gscUJBQXFCO0FBQ3JCLDRCQUE0QjtBQUM1QixLQUFLO0FBQ0wsR0FBRztBQUNILCtCQUErQjtBQUMvQix5QkFBeUI7QUFDekIsc0JBQXNCO0FBQ3RCLHdCQUF3QjtBQUN4QiwwQkFBMEI7QUFDMUIseUJBQXlCO0FBQ3pCLHlCQUF5QjtBQUN6Qix1QkFBdUI7QUFDdkIsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QixNQUFNO0FBQ04sNEVBQTRFO0FBQzVFLHFDQUFxQztBQUNyQyxrQ0FBa0M7QUFDbEMscUJBQXFCO0FBQ3JCLHNCQUFzQjtBQUN0Qix3QkFBd0I7QUFDeEIseUJBQXlCO0FBQ3pCLHVCQUF1QjtBQUN2Qix3QkFBd0I7QUFDeEIsc0JBQXNCO0FBQ3RCLDhCQUE4QjtBQUM5Qiw0QkFBNEI7QUFDNUIsb0JBQW9CO0FBQ3BCLDBCQUEwQjtBQUMxQixzQkFBc0I7QUFDdEIsYUFBYTtBQUNiLFdBQVc7QUFDWCxTQUFTO0FBQ1QsMkNBQTJDO0FBQzNDLHdCQUF3QjtBQUN4QixvQkFBb0I7QUFDcEIsV0FBVztBQUNYLFNBQVM7QUFDVCwyQ0FBMkM7QUFDM0MsVUFBVTtBQUNWLHdCQUF3QjtBQUN4QiwwQkFBMEI7QUFDMUIsMkJBQTJCO0FBQzNCLHlCQUF5QjtBQUN6QiwwQkFBMEI7QUFDMUIsd0JBQXdCO0FBQ3hCLGdDQUFnQztBQUNoQyw4QkFBOEI7QUFDOUIscUJBQXFCO0FBQ3JCLFdBQVc7QUFDWCxTQUFTO0FBQ1QsOENBQThDO0FBQzlDLHVDQUF1QztBQUN2Qyx1Q0FBdUM7QUFDdkMsT0FBTztBQUNQLG1EQUFt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