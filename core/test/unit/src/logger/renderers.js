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
// import {
//   renderMsg,
//   msgStyle,
//   errorStyle,
//   formatForTerminal,
//   chainMessages,
//   renderError,
//   formatForJson,
//   renderSection,
//   SECTION_PADDING,
//   renderData,
//   padSection,
// } from "../../../../src/logger/renderers"
// import { GardenError } from "../../../../src/exceptions"
// import dedent = require("dedent")
// import { TaskMetadata } from "../../../../src/logger/log-entry"
// import logSymbols = require("log-symbols")
// import stripAnsi = require("strip-ansi")
// import { highlightYaml, safeDumpYaml } from "../../../../src/util/util"
// import { freezeTime } from "../../../helpers"
// import chalk = require("chalk")
// 
// const logger: Logger = getLogger()
// 
// beforeEach(() => {
//   logger["children"] = []
// })
// 
// describe("renderers", () => {
//   describe("renderMsg", () => {
//     it("should return an empty string for placeholder entries", () => {
//       const entry = logger.placeholder()
//       expect(renderMsg(entry)).to.equal("")
//     })
//     it("should render the message with the message style", () => {
//       const entry = logger.info({ msg: "hello message" })
//       expect(renderMsg(entry)).to.equal(msgStyle("hello message"))
//     })
//     it("should join an array of messages with an arrow symbol and render with the message style", () => {
//       const entry = logger.info("message a")
//       entry.setState({ msg: "message b", append: true })
//       expect(renderMsg(entry)).to.equal(msgStyle("message a") + msgStyle(" → ") + msgStyle("message b"))
//     })
//     it("should render the message without styles if the entry is from an intercepted stream", () => {
//       const entry = logger.info({ fromStdStream: true, msg: "hello stream" })
//       expect(renderMsg(entry)).to.equal("hello stream")
//     })
//     it("should join an array of messages and render without styles if the entry is from an intercepted stream", () => {
//       const entry = logger.info({ fromStdStream: true, msg: "stream a" })
//       entry.setState({ msg: "stream b", append: true })
//       expect(renderMsg(entry)).to.equal("stream a stream b")
//     })
//     it("should render the message with the error style if the entry has error status", () => {
//       const entry = logger.info({ msg: "hello error", status: "error" })
//       expect(renderMsg(entry)).to.equal(errorStyle("hello error"))
//     })
//     it(
//       "should join an array of messages with an arrow symbol and render with the error style" +
//         " if the entry has error status",
//       () => {
//         const entry = logger.info({ msg: "error a", status: "error" })
//         entry.setState({ msg: "error b", append: true })
//         expect(renderMsg(entry)).to.equal(errorStyle("error a") + errorStyle(" → ") + errorStyle("error b"))
//       }
//     )
//   })
//   describe("renderError", () => {
//     it("should render error object if present", () => {
//       const error: GardenError = {
//         message: "hello error",
//         type: "a",
//         detail: {
//           foo: "bar",
//           _internal: "no show",
//         },
//       }
//       const entry = logger.info({ msg: "foo", error })
//       expect(renderError(entry)).to.equal(dedent`
//           hello error
// 
//           Error Details:
// 
//           foo: bar\n
//         `)
//     })
//     it("should join an array of messages if no error object", () => {
//       const entry = logger.info({ msg: "error a" })
//       entry.setState({ msg: "moar", append: true })
//       expect(renderError(entry)).to.eql("error a moar")
//     })
//   })
//   describe("renderSection", () => {
//     it("should render the log entry section with padding", () => {
//       const entry = logger.info({ msg: "foo", section: "hello" })
//       const withWhitespace = "hello".padEnd(SECTION_PADDING, " ")
//       const rendered = stripAnsi(renderSection(entry))
//       expect(rendered).to.equal(`${withWhitespace} → `)
//     })
//     it("should not render arrow if message is empty", () => {
//       const entry = logger.info({ section: "hello" })
//       const withWhitespace = "hello".padEnd(SECTION_PADDING, " ")
//       const rendered = stripAnsi(renderSection(entry))
//       expect(rendered).to.equal(`${withWhitespace}`)
//     })
//     it("should not not truncate the section", () => {
//       const entry = logger.info({ msg: "foo", section: "very-very-very-very-very-long" })
//       const rendered = stripAnsi(renderSection(entry))
//       expect(rendered).to.equal(`very-very-very-very-very-long → `)
//     })
//   })
//   describe("chainMessages", () => {
//     it("should correctly chain log messages", () => {
//       const timestamp = new Date()
//       const messagesTable = [
//         [
//           { msg: "1", append: true },
//           { msg: "2", append: true },
//           { msg: "3", append: true },
//         ],
//         [
//           { msg: "1", append: false },
//           { msg: "2", append: true },
//           { msg: "3", append: true },
//         ],
//         [
//           { msg: "1", append: true },
//           { msg: "2", append: false },
//           { msg: "3", append: true },
//         ],
//         [
//           { msg: "1", append: false },
//           { msg: "2", append: false },
//           { msg: "3", append: true },
//         ],
//         [
//           { msg: "1", append: false },
//           { msg: "2", append: false },
//           { msg: "3", append: false },
//         ],
//       ].map((msgStates) => msgStates.map((msgState) => ({ ...msgState, timestamp })))
//       const expects = [["1", "2", "3"], ["1", "2", "3"], ["2", "3"], ["2", "3"], ["3"]]
//       messagesTable.forEach((msgState, index) => {
//         expect(chainMessages(msgState)).to.eql(expects[index])
//       })
//     })
//   })
//   describe("formatForTerminal", () => {
//     it("should return the entry as a formatted string with a new line character", () => {
//       const entry = logger.info("")
//       expect(formatForTerminal(entry, "fancy")).to.equal("\n")
//     })
//     it("should return an empty string without a new line if it's a placeholder entry", () => {
//       const entry = logger.placeholder()
//       expect(formatForTerminal(entry, "fancy")).to.equal("")
//     })
//     it("should return an empty string without a new line if the parameter LogEntryParams is empty", () => {
//       const entry = logger.info({})
//       expect(formatForTerminal(entry, "fancy")).to.equal("")
//     })
//     it("should return a string with a new line if any of the members of entry.messages is not empty", () => {
//       const entryMsg = logger.info({ msg: "msg" })
//       expect(formatForTerminal(entryMsg, "fancy")).contains("\n")
// 
//       const entryEmoji = logger.info({ emoji: "warning" })
//       expect(formatForTerminal(entryEmoji, "fancy")).contains("\n")
// 
//       const entrySection = logger.info({ section: "section" })
//       expect(formatForTerminal(entrySection, "fancy")).contains("\n")
// 
//       const entrySymbol = logger.info({ symbol: "success" })
//       expect(formatForTerminal(entrySymbol, "fancy")).contains("\n")
// 
//       const entryData = logger.info({ data: { some: "data" } })
//       expect(formatForTerminal(entryData, "fancy")).contains("\n")
//     })
//     context("basic", () => {
//       it("should always render a symbol with sections", () => {
//         const entry = logger.info({ msg: "hello world", section: "foo" })
// 
//         expect(formatForTerminal(entry, "basic")).to.equal(
//           `${logSymbols["info"]} ${renderSection(entry)}${msgStyle("hello world")}\n`
//         )
//       })
//       it("should print the log level if it's higher then 'info'", () => {
//         const entry = logger.debug({ msg: "hello world" })
// 
//         expect(formatForTerminal(entry, "basic")).to.equal(`${chalk.gray("[debug]")} ${msgStyle("hello world")}\n`)
//       })
//       it("should print the log level if it's higher then 'info' after the section if there is one", () => {
//         const entry = logger.debug({ msg: "hello world", section: "foo" })
// 
//         const section = `foo ${chalk.gray("[debug]")}`
//         expect(formatForTerminal(entry, "basic")).to.equal(
//           `${logSymbols["info"]} ${chalk.cyan.italic(padSection(section))} → ${msgStyle("hello world")}\n`
//         )
//       })
//       it("should find the nearest parent section if child doesn't have one", () => {
//         const parent = logger.info({ msg: "parent", section: "parent" })
//         const childWithoutSection = parent.info({ msg: "child without section" })
//         const childWithSection = parent.info({ msg: "child with section", section: "child" })
//         const deepChildWithoutSection = parent.info({ msg: "deep child without section", section: "parent" })
// 
//         expect(formatForTerminal(parent, "basic")).to.equal(
//           `${logSymbols["info"]} ${chalk.cyan.italic(padSection("parent"))} → ${msgStyle("parent")}\n`
//         )
//         expect(formatForTerminal(childWithoutSection, "basic")).to.equal(
//           `${logSymbols["info"]} ${chalk.cyan.italic(padSection("parent"))} → ${msgStyle("child without section")}\n`
//         )
//         expect(formatForTerminal(childWithSection, "basic")).to.equal(
//           `${logSymbols["info"]} ${chalk.cyan.italic(padSection("child"))} → ${msgStyle("child with section")}\n`
//         )
//         expect(formatForTerminal(deepChildWithoutSection, "basic")).to.equal(
//           `${logSymbols["info"]} ${chalk.cyan.italic(padSection("parent"))} → ${msgStyle(
//             "deep child without section"
//           )}\n`
//         )
//       })
//     })
//     context("logger.showTimestamps is set to true", () => {
//       before(() => {
//         logger.showTimestamps = true
//       })
//       context("basic", () => {
//         it("should include timestamp with formatted string", () => {
//           const now = freezeTime()
//           const entry = logger.info("hello world")
// 
//           expect(formatForTerminal(entry, "basic")).to.equal(`[${now.toISOString()}] ${msgStyle("hello world")}\n`)
//         })
//         it("should show the timestamp for the most recent message state", async () => {
//           const entry = logger.info("hello world")
//           const date = new Date(1600555650583) // Some date that's different from the current one
//           freezeTime(date)
//           entry.setState("update entry")
// 
//           expect(formatForTerminal(entry, "basic")).to.equal(`[2020-09-19T22:47:30.583Z] ${msgStyle("update entry")}\n`)
//         })
//       })
//       context("fancy", () => {
//         it("should not include timestamp with formatted string", () => {
//           const entry = logger.info("hello world")
// 
//           expect(formatForTerminal(entry, "fancy")).to.equal(`${msgStyle("hello world")}\n`)
//         })
//       })
//       after(() => {
//         logger.showTimestamps = false
//       })
//     })
//   })
//   describe("formatForJson", () => {
//     it("should return a JSON representation of a log entry", () => {
//       const now = freezeTime()
//       const taskMetadata: TaskMetadata = {
//         type: "a",
//         key: "a",
//         status: "active",
//         uid: "1",
//         versionString: "123",
//       }
//       const entry = logger.info({
//         msg: "hello",
//         emoji: "haircut",
//         symbol: "info",
//         status: "done",
//         section: "c",
//         data: { foo: "bar" },
//         metadata: { task: taskMetadata },
//       })
//       expect(formatForJson(entry)).to.eql({
//         msg: "hello",
//         level: "info",
//         timestamp: now.toISOString(),
//         section: "c",
//         allSections: ["c"],
//         data: { foo: "bar" },
//         metadata: { task: taskMetadata },
//       })
//     })
//     it("should append messages if applicable", () => {
//       const now = freezeTime()
//       const entry = logger.info({
//         msg: "hello",
//       })
//       entry.setState({ msg: "world", append: true })
//       expect(formatForJson(entry)).to.eql({
//         msg: "hello - world",
//         level: "info",
//         timestamp: now.toISOString(),
//         section: "",
//         allSections: [],
//         data: undefined,
//         metadata: undefined,
//       })
//     })
//     it("should handle undefined messages", () => {
//       const now = freezeTime()
//       const entry = logger.placeholder()
//       expect(formatForJson(entry)).to.eql({
//         msg: "",
//         level: "info",
//         section: "",
//         allSections: [],
//         data: undefined,
//         metadata: undefined,
//         timestamp: now.toISOString(),
//       })
//     })
//   })
//   describe("renderData", () => {
//     const sampleData = {
//       key: "value",
//       key2: {
//         value: [
//           {
//             key1: "value",
//             key2: 3,
//           },
//         ],
//       },
//     }
//     it("should render an empty string when no data is passed", () => {
//       const entry = logger.placeholder()
//       expect(renderData(entry)).to.eql("")
//     })
//     it("should render yaml by default if data is passed", () => {
//       const entry = logger.info({ data: sampleData })
//       const dataAsYaml = safeDumpYaml(sampleData, { noRefs: true })
//       expect(renderData(entry)).to.eql(highlightYaml(dataAsYaml))
//     })
//     it('should render yaml if dataFormat is "yaml"', () => {
//       const entry = logger.info({ data: sampleData, dataFormat: "yaml" })
//       const dataAsYaml = safeDumpYaml(sampleData, { noRefs: true })
//       expect(renderData(entry)).to.eql(highlightYaml(dataAsYaml))
//     })
//     it('should render json if dataFormat is "json"', () => {
//       const entry = logger.info({ data: sampleData, dataFormat: "json" })
//       expect(renderData(entry)).to.eql(JSON.stringify(sampleData, null, 2))
//     })
//   })
// })
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVuZGVyZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILGdDQUFnQztBQUNoQyxHQUFHO0FBQ0gsb0VBQW9FO0FBQ3BFLFdBQVc7QUFDWCxlQUFlO0FBQ2YsY0FBYztBQUNkLGdCQUFnQjtBQUNoQix1QkFBdUI7QUFDdkIsbUJBQW1CO0FBQ25CLGlCQUFpQjtBQUNqQixtQkFBbUI7QUFDbkIsbUJBQW1CO0FBQ25CLHFCQUFxQjtBQUNyQixnQkFBZ0I7QUFDaEIsZ0JBQWdCO0FBQ2hCLDRDQUE0QztBQUM1QywyREFBMkQ7QUFDM0Qsb0NBQW9DO0FBQ3BDLGtFQUFrRTtBQUNsRSw2Q0FBNkM7QUFDN0MsMkNBQTJDO0FBQzNDLDBFQUEwRTtBQUMxRSxnREFBZ0Q7QUFDaEQsa0NBQWtDO0FBQ2xDLEdBQUc7QUFDSCxxQ0FBcUM7QUFDckMsR0FBRztBQUNILHFCQUFxQjtBQUNyQiw0QkFBNEI7QUFDNUIsS0FBSztBQUNMLEdBQUc7QUFDSCxnQ0FBZ0M7QUFDaEMsa0NBQWtDO0FBQ2xDLDBFQUEwRTtBQUMxRSwyQ0FBMkM7QUFDM0MsOENBQThDO0FBQzlDLFNBQVM7QUFDVCxxRUFBcUU7QUFDckUsNERBQTREO0FBQzVELHFFQUFxRTtBQUNyRSxTQUFTO0FBQ1QsNEdBQTRHO0FBQzVHLCtDQUErQztBQUMvQywyREFBMkQ7QUFDM0QsMkdBQTJHO0FBQzNHLFNBQVM7QUFDVCx3R0FBd0c7QUFDeEcsZ0ZBQWdGO0FBQ2hGLDBEQUEwRDtBQUMxRCxTQUFTO0FBQ1QsMEhBQTBIO0FBQzFILDRFQUE0RTtBQUM1RSwwREFBMEQ7QUFDMUQsK0RBQStEO0FBQy9ELFNBQVM7QUFDVCxpR0FBaUc7QUFDakcsMkVBQTJFO0FBQzNFLHFFQUFxRTtBQUNyRSxTQUFTO0FBQ1QsVUFBVTtBQUNWLGtHQUFrRztBQUNsRyw0Q0FBNEM7QUFDNUMsZ0JBQWdCO0FBQ2hCLHlFQUF5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