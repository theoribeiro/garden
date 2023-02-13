/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
// import { expect } from "chai"
// 
// import { getLogger, Logger, LogLevel, sanitizeValue } from "../../../../src/logger/logger"
// import { LogEntryEventPayload } from "../../../../src/cloud/buffered-event-stream"
// import { freezeTime, projectRootA } from "../../../helpers"
// import { makeDummyGarden } from "../../../../src/cli/cli"
// import { joi } from "../../../../src/config/common"
// import { LogEntry } from "../../../../src/logger/log-entry"
// 
// const logger: Logger = getLogger()
// 
// describe("Logger", () => {
//   beforeEach(() => {
//     logger["children"] = []
//   })
// 
//   describe("events", () => {
//     let loggerEvents: LogEntryEventPayload[] = []
//     let listener = (event: LogEntryEventPayload) => loggerEvents.push(event)
// 
//     before(() => logger.events.on("logEntry", listener))
//     after(() => logger.events.off("logEntry", listener))
// 
//     beforeEach(() => {
//       loggerEvents = []
//     })
// 
//     describe("onGraphChange", () => {
//       it("should emit a loggerEvent event when an entry is created", () => {
//         const now = freezeTime()
//         const log = logger.info({
//           msg: "hello",
//           emoji: "admission_tickets",
//           status: "active",
//           section: "80",
//           symbol: "info",
//           append: true,
//           data: { foo: "bar" },
//           dataFormat: "json",
//           metadata: {
//             workflowStep: {
//               index: 2,
//             },
//           },
//         })
//         const e = loggerEvents[0]
//         expect(loggerEvents.length).to.eql(1)
//         expect(e).to.eql({
//           key: log.key,
//           parentKey: null,
//           revision: 0,
//           timestamp: now,
//           level: 2,
//           message: {
//             msg: "hello",
//             emoji: "admission_tickets",
//             status: "active",
//             section: "80",
//             symbol: "info",
//             append: true,
//             dataFormat: "json",
//             data: { foo: "bar" },
//           },
//           metadata: {
//             workflowStep: {
//               index: 2,
//             },
//           },
//         })
//       })
//       it("should include parent key on nested entries", () => {
//         const now = freezeTime()
//         const log = logger.info("hello")
//         const nested = log.warn("world")
//         const emptyMsg = {
//           emoji: undefined,
//           status: undefined,
//           section: undefined,
//           symbol: undefined,
//           append: undefined,
//           dataFormat: undefined,
//           data: undefined,
//         }
// 
//         const [e1, e2] = loggerEvents
//         expect(loggerEvents.length).to.eql(2)
//         expect(e1).to.eql({
//           key: log.key,
//           parentKey: null,
//           revision: 0,
//           timestamp: now,
//           level: 2,
//           message: {
//             ...emptyMsg,
//             msg: "hello",
//           },
//           metadata: undefined,
//         })
//         expect(e2).to.eql({
//           key: nested.key,
//           parentKey: log.key,
//           revision: 0,
//           timestamp: now,
//           level: 1,
//           message: {
//             ...emptyMsg,
//             msg: "world",
//           },
//           metadata: undefined,
//         })
//       })
//       it("should emit a loggerEvent with a bumped revision when an entry is updated", () => {
//         const log = logger.info({ msg: "0" })
//         log.setState("1")
//         logger.info({ msg: "0" })
//         const [e1, e2, e3] = loggerEvents
//         expect(loggerEvents.length).to.eql(3)
//         expect(e1.revision).to.eql(0)
//         expect(e2.revision).to.eql(1)
//         expect(e3.revision).to.eql(0)
//       })
//       it("should not emit a loggerEvent for placeholder log entries", () => {
//         logger.placeholder()
//         expect(loggerEvents.length).to.eql(0)
//       })
//       it("should emit a loggerEvent when a placeholder entry is updated", () => {
//         const log = logger.placeholder()
//         expect(loggerEvents.length).to.eql(0)
// 
//         logger.info({ msg: "1" })
//         log.setState("2")
// 
//         const [e1, e2] = loggerEvents
//         expect(loggerEvents.length).to.eql(2)
//         expect(e1.message.msg).to.eql("1")
//         expect(e2.message.msg).to.eql("2")
//       })
//     })
//   })
//   describe("addNode", () => {
//     it("should add new child entries to the respective node", () => {
//       logger.error("error")
//       logger.warn("warn")
//       logger.info("info")
//       logger.verbose("verbose")
//       logger.debug("debug")
//       logger.silly("silly")
// 
//       const prevLength = logger.children.length
//       const entry = logger.children[0]
//       const nested = entry.info("nested")
//       const deepNested = nested.info("deep")
// 
//       expect(logger.children[0].children).to.have.lengthOf(1)
//       expect(logger.children[0].children[0]).to.eql(nested)
//       expect(logger.children[0].children[0].children[0]).to.eql(deepNested)
//       expect(logger.children).to.have.lengthOf(prevLength)
//     })
//     it("should not store entires if storeEntries=false", () => {
//       const loggerB = new Logger({
//         level: LogLevel.info,
//         writers: [],
//         storeEntries: false,
//       })
// 
//       loggerB.error("error")
//       loggerB.warn("warn")
//       const entry = loggerB.info("info")
//       loggerB.verbose("verbose")
//       loggerB.debug("debug")
//       loggerB.silly("silly")
// 
//       const nested = entry.info("nested")
//       const deepNested = nested.info("deep")
// 
//       expect(logger.children).to.eql([])
//       expect(entry.children).to.eql([])
//       expect(nested.children).to.eql([])
//       expect(deepNested.children).to.eql([])
//     })
//   })
//   describe("findById", () => {
//     it("should return the first log entry with a matching id and undefined otherwise", () => {
//       logger.info({ msg: "0" })
//       logger.info({ msg: "a1", id: "a" })
//       logger.info({ msg: "a2", id: "a" })
//       expect(logger.findById("a")["messages"][0]["msg"]).to.eql("a1")
//       expect(logger.findById("z")).to.be.undefined
//     })
//   })
// 
//   describe("filterBySection", () => {
//     it("should return an array of all entries with the matching section name", () => {
//       logger.info({ section: "s0" })
//       logger.info({ section: "s1", id: "a" })
//       logger.info({ section: "s2" })
//       logger.info({ section: "s1", id: "b" })
//       const s1 = logger.filterBySection("s1")
//       const sEmpty = logger.filterBySection("s99")
//       expect(s1.map((entry) => entry.id)).to.eql(["a", "b"])
//       expect(sEmpty).to.eql([])
//     })
//   })
// 
//   describe("getLogEntries", () => {
//     it("should return an ordered list of log entries", () => {
//       logger.error("error")
//       logger.warn("warn")
//       logger.info("info")
//       logger.verbose("verbose")
//       logger.debug("debug")
//       logger.silly("silly")
// 
//       const entries = logger.getLogEntries()
//       const levels = entries.map((e) => e.level)
// 
//       expect(entries).to.have.lengthOf(6)
//       expect(levels).to.eql([
//         LogLevel.error,
//         LogLevel.warn,
//         LogLevel.info,
//         LogLevel.verbose,
//         LogLevel.debug,
//         LogLevel.silly,
//       ])
//     })
//   })
// 
//   describe("sanitizeValue", () => {
//     it("replaces Buffer instances", () => {
//       const obj = {
//         a: Buffer.from([0, 1, 2, 3]),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: "<Buffer>",
//       })
//     })
// 
//     it("replaces nested values", () => {
//       const obj = {
//         a: {
//           b: Buffer.from([0, 1, 2, 3]),
//         },
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: { b: "<Buffer>" },
//       })
//     })
// 
//     it("replaces attributes on a class instance", () => {
//       class Foo {
//         b: Buffer
// 
//         constructor() {
//           this.b = Buffer.from([0, 1, 2, 3])
//         }
//       }
//       const obj = {
//         a: new Foo(),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: { b: "<Buffer>" },
//       })
//     })
// 
//     it("replaces nested values on class attributes", () => {
//       class Foo {
//         b: any
// 
//         constructor() {
//           this.b = { c: Buffer.from([0, 1, 2, 3]) }
//         }
//       }
//       const obj = {
//         a: new Foo(),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: { b: { c: "<Buffer>" } },
//       })
//     })
// 
//     it("replaces nested values in an array", () => {
//       const obj = {
//         a: {
//           b: [Buffer.from([0, 1, 2, 3])],
//         },
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: { b: ["<Buffer>"] },
//       })
//     })
// 
//     it("replaces nested values in an object in an array", () => {
//       const obj = {
//         a: [
//           {
//             b: [Buffer.from([0, 1, 2, 3])],
//           },
//         ],
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: [{ b: ["<Buffer>"] }],
//       })
//     })
// 
//     it("replaces a circular reference", () => {
//       const a = { b: <any>{} }
//       a.b.a = a
//       const res = sanitizeValue(a)
//       expect(res).to.eql({ b: { a: "[Circular]" } })
//     })
// 
//     it("replaces a circular reference nested in an array", () => {
//       const a = [{ b: <any>{} }]
//       a[0].b.a = a
//       const res = sanitizeValue(a)
//       expect(res).to.eql([{ b: { a: "[Circular]" } }])
//     })
// 
//     it("replaces a circular reference nested under a class attribute", () => {
//       class Foo {
//         a: any
//       }
// 
//       const a = [{ b: new Foo() }]
//       a[0].b.a = a
//       const res = sanitizeValue(a)
//       expect(res).to.eql([{ b: { a: "[Circular]" } }])
//     })
// 
//     it("replaces Garden instances", async () => {
//       const obj = {
//         a: await makeDummyGarden(projectRootA, { commandInfo: { name: "foo", args: {}, opts: {} } }),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: "<Garden>",
//       })
//     })
// 
//     it("replaces LogEntry instances", async () => {
//       const obj = {
//         a: logger.info("foo"),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: "<LogEntry>",
//       })
//     })
// 
//     it("calls sanitize method if present", async () => {
//       class Foo {
//         toSanitizedValue() {
//           return "foo"
//         }
//       }
//       const obj = {
//         a: new Foo(),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: "foo",
//       })
//     })
// 
//     it("replaces LogEntry instance on a class instance", async () => {
//       class Foo {
//         log: LogEntry
// 
//         constructor() {
//           this.log = logger.info("foo")
//         }
//       }
// 
//       const obj = {
//         a: new Foo(),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: { log: "<LogEntry>" },
//       })
//     })
// 
//     it("replaces joi schemas", async () => {
//       const obj = {
//         a: joi.object(),
//       }
//       const res = sanitizeValue(obj)
//       expect(res).to.eql({
//         a: "<JoiSchema>",
//       })
//     })
//   })
// })
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILGdDQUFnQztBQUNoQyxHQUFHO0FBQ0gsNkZBQTZGO0FBQzdGLHFGQUFxRjtBQUNyRiw4REFBOEQ7QUFDOUQsNERBQTREO0FBQzVELHNEQUFzRDtBQUN0RCw4REFBOEQ7QUFDOUQsR0FBRztBQUNILHFDQUFxQztBQUNyQyxHQUFHO0FBQ0gsNkJBQTZCO0FBQzdCLHVCQUF1QjtBQUN2Qiw4QkFBOEI7QUFDOUIsT0FBTztBQUNQLEdBQUc7QUFDSCwrQkFBK0I7QUFDL0Isb0RBQW9EO0FBQ3BELCtFQUErRTtBQUMvRSxHQUFHO0FBQ0gsMkRBQTJEO0FBQzNELDJEQUEyRDtBQUMzRCxHQUFHO0FBQ0gseUJBQXlCO0FBQ3pCLDBCQUEwQjtBQUMxQixTQUFTO0FBQ1QsR0FBRztBQUNILHdDQUF3QztBQUN4QywrRUFBK0U7QUFDL0UsbUNBQW1DO0FBQ25DLG9DQUFvQztBQUNwQywwQkFBMEI7QUFDMUIsd0NBQXdDO0FBQ3hDLDhCQUE4QjtBQUM5QiwyQkFBMkI7QUFDM0IsNEJBQTRCO0FBQzVCLDBCQUEwQjtBQUMxQixrQ0FBa0M7QUFDbEMsZ0NBQWdDO0FBQ2hDLHdCQUF3QjtBQUN4Qiw4QkFBOEI7QUFDOUIsMEJBQTBCO0FBQzFCLGlCQUFpQjtBQUNqQixlQUFlO0FBQ2YsYUFBYTtBQUNiLG9DQUFvQztBQUNwQyxnREFBZ0Q7QUFDaEQsNkJBQTZCO0FBQzdCLDBCQUEwQjtBQUMxQiw2QkFBNkI7QUFDN0IseUJBQXlCO0FBQ3pCLDRCQUE0QjtBQUM1QixzQkFBc0I7QUFDdEIsdUJBQXVCO0FBQ3ZCLDRCQUE0QjtBQUM1QiwwQ0FBMEM7QUFDMUMsZ0NBQWdDO0FBQ2hDLDZCQUE2QjtBQUM3Qiw4QkFBOEI7QUFDOUIsNEJBQTRCO0FBQzVCLGtDQUFrQztBQUNsQyxvQ0FBb0M7QUFDcEMsZUFBZTtBQUNmLHdC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