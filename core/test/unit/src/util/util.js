"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const lodash_1 = require("lodash");
const util_1 = require("../../../../src/util/util");
const helpers_1 = require("../../../helpers");
const util_2 = require("../../../../src/util/util");
const logger_1 = require("../../../../src/logger/logger");
const string_1 = require("../../../../src/util/string");
function isLinuxOrDarwin() {
    return process.platform === "darwin" || process.platform === "linux";
}
(0, mocha_1.describe)("util", () => {
    (0, mocha_1.describe)("makeErrorMsg", () => {
        it("should return an error message", () => {
            const msg = (0, util_1.makeErrorMsg)({
                code: 1,
                cmd: "ls",
                args: ["some-dir"],
                error: "dir not found",
                output: "dir not found",
            });
            (0, chai_1.expect)(msg).to.equal((0, string_1.dedent) `
        Command "ls some-dir" failed with code 1:

        dir not found
      `);
        });
        it("should ignore emtpy args", () => {
            const msg = (0, util_1.makeErrorMsg)({
                code: 1,
                cmd: "ls",
                args: [],
                error: "dir not found",
                output: "dir not found",
            });
            (0, chai_1.expect)(msg).to.equal((0, string_1.dedent) `
        Command "ls" failed with code 1:

        dir not found
      `);
        });
        it("should include output if it's not the same as the error", () => {
            const msg = (0, util_1.makeErrorMsg)({
                code: 1,
                cmd: "ls some-dir",
                args: [],
                error: "dir not found",
                output: "dir not found and some more output",
            });
            (0, chai_1.expect)(msg).to.equal((0, string_1.dedent) `
        Command "ls some-dir" failed with code 1:

        dir not found

        Here's the full output:

        dir not found and some more output
      `);
        });
        it("should include the last 100 lines of output if output is very long", () => {
            const output = "All work and no play\n";
            const outputFull = output.repeat(102);
            const outputPartial = output.repeat(99); // This makes 100 lines in total
            const msg = (0, util_1.makeErrorMsg)({
                code: 1,
                cmd: "ls some-dir",
                args: [],
                error: "dir not found",
                output: outputFull,
            });
            (0, chai_1.expect)(msg).to.equal((0, string_1.dedent) `
        Command "ls some-dir" failed with code 1:

        dir not found

        Here are the last 100 lines of the output:

        ${outputPartial}
      `);
        });
    });
    (0, mocha_1.describe)("exec", () => {
        before(function () {
            // These tests depend the underlying OS and are only executed on macOS and linux
            if (!isLinuxOrDarwin()) {
                // eslint-disable-next-line no-invalid-this
                this.skip();
            }
        });
        it("should successfully execute a command", async () => {
            const res = await (0, util_1.exec)("echo", ["hello"]);
            (0, chai_1.expect)(res.stdout).to.equal("hello");
        });
        it("should handle command and args in a single string", async () => {
            const res = await (0, util_1.exec)("echo hello && echo world", [], { shell: true });
            (0, chai_1.expect)(res.stdout).to.equal("hello\nworld");
        });
        it("should optionally pipe stdout to an output stream", async () => {
            const logger = (0, logger_1.getLogger)();
            const entry = logger.placeholder();
            await (0, util_1.exec)("echo", ["hello"], { stdout: (0, util_1.createOutputStream)(entry) });
            (0, chai_1.expect)(entry.getLatestMessage().msg).to.equal((0, util_1.renderOutputStream)("hello"));
        });
        it("should optionally pipe stderr to an output stream", async () => {
            const logger = (0, logger_1.getLogger)();
            const entry = logger.placeholder();
            await (0, util_1.exec)("sh", ["-c", "echo hello 1>&2"], { stderr: (0, util_1.createOutputStream)(entry) });
            (0, chai_1.expect)(entry.getLatestMessage().msg).to.equal((0, util_1.renderOutputStream)("hello"));
        });
        it("should buffer outputs when piping to stream", async () => {
            const logger = (0, logger_1.getLogger)();
            const entry = logger.placeholder();
            const res = await (0, util_1.exec)("echo", ["hello"], { stdout: (0, util_1.createOutputStream)(entry) });
            (0, chai_1.expect)(res.stdout).to.equal("hello");
        });
        it("should throw a standardised error message on error", async () => {
            try {
                // Using "sh -c" to get consistent output between operating systems
                await (0, util_1.exec)(`sh -c "echo hello error; exit 1"`, [], { shell: true });
            }
            catch (err) {
                (0, chai_1.expect)(err.message).to.equal((0, util_1.makeErrorMsg)({
                    code: 1,
                    cmd: `sh -c "echo hello error; exit 1"`,
                    args: [],
                    output: "hello error",
                    error: "",
                }));
            }
        });
    });
    (0, mocha_1.describe)("spawn", () => {
        before(function () {
            // These tests depend on the underlying OS and are only executed on macOS and linux
            if (!isLinuxOrDarwin()) {
                // eslint-disable-next-line no-invalid-this
                this.skip();
            }
        });
        it("should throw a standardised error message on error", async () => {
            try {
                await (0, util_1.spawn)("ls", ["scottiepippen"]);
            }
            catch (err) {
                // We're not using "sh -c" here since the output is not added to stdout|stderr if `tty: true` and
                // we therefore can't test the entire error message.
                if (process.platform === "darwin") {
                    (0, chai_1.expect)(err.message).to.equal((0, util_1.makeErrorMsg)({
                        code: 1,
                        cmd: "ls scottiepippen",
                        args: [],
                        output: "ls: scottiepippen: No such file or directory",
                        error: "ls: scottiepippen: No such file or directory",
                    }));
                }
                else {
                    (0, chai_1.expect)(err.message).to.equal((0, util_1.makeErrorMsg)({
                        code: 2,
                        cmd: "ls scottiepippen",
                        args: [],
                        output: "ls: cannot access 'scottiepippen': No such file or directory",
                        error: "ls: cannot access 'scottiepippen': No such file or directory",
                    }));
                }
            }
        });
    });
    (0, mocha_1.describe)("getEnvVarName", () => {
        it("should translate the service name to a name appropriate for env variables", async () => {
            (0, chai_1.expect)((0, util_1.getEnvVarName)("service-b")).to.equal("SERVICE_B");
        });
    });
    (0, mocha_1.describe)("pickKeys", () => {
        it("should pick keys from an object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            (0, chai_1.expect)((0, util_1.pickKeys)(obj, ["a", "b"])).to.eql({ a: 1, b: 2 });
        });
        it("should throw if one or more keys are missing", async () => {
            const obj = { a: 1, b: 2, c: 3 };
            await (0, helpers_1.expectError)(() => (0, util_1.pickKeys)(obj, ["a", "foo", "bar"]), (err) => {
                (0, chai_1.expect)(err.message).to.equal("Could not find key(s): foo, bar");
                (0, chai_1.expect)(err.detail.missing).to.eql(["foo", "bar"]);
                (0, chai_1.expect)(err.detail.available).to.eql(["a", "b", "c"]);
            });
        });
        it("should use given description in error message", async () => {
            const obj = { a: 1, b: 2, c: 3 };
            await (0, helpers_1.expectError)(() => (0, util_1.pickKeys)(obj, ["a", "foo", "bar"], "banana"), {
                contains: "Could not find banana(s): foo, bar",
            });
        });
    });
    (0, mocha_1.describe)("deepFilter", () => {
        const fn = (v) => v !== 99;
        it("should filter keys in a simple object", () => {
            const obj = {
                a: 1,
                b: 2,
                c: 99,
            };
            (0, chai_1.expect)((0, util_1.deepFilter)(obj, fn)).to.eql({ a: 1, b: 2 });
        });
        it("should filter keys in a nested object", () => {
            const obj = {
                a: 1,
                b: 2,
                c: { d: 3, e: 99 },
            };
            (0, chai_1.expect)((0, util_1.deepFilter)(obj, fn)).to.eql({ a: 1, b: 2, c: { d: 3 } });
        });
        it("should filter values in lists", () => {
            const obj = {
                a: 1,
                b: 2,
                c: [3, 99],
            };
            (0, chai_1.expect)((0, util_1.deepFilter)(obj, fn)).to.eql({ a: 1, b: 2, c: [3] });
        });
        it("should filter keys in objects in lists", () => {
            const obj = {
                a: 1,
                b: 2,
                c: [{ d: 3, e: 99 }],
            };
            (0, chai_1.expect)((0, util_1.deepFilter)(obj, fn)).to.eql({ a: 1, b: 2, c: [{ d: 3 }] });
        });
    });
    (0, mocha_1.describe)("deepOmitUndefined", () => {
        it("should omit keys with undefined values in a simple object", () => {
            const obj = {
                a: 1,
                b: 2,
                c: undefined,
            };
            (0, chai_1.expect)((0, util_1.deepOmitUndefined)(obj)).to.eql({ a: 1, b: 2 });
        });
        it("should omit keys with undefined values in a nested object", () => {
            const obj = {
                a: 1,
                b: 2,
                c: { d: 3, e: undefined },
            };
            (0, chai_1.expect)((0, util_1.deepOmitUndefined)(obj)).to.eql({ a: 1, b: 2, c: { d: 3 } });
        });
        it("should omit undefined values in lists", () => {
            const obj = {
                a: 1,
                b: 2,
                c: [3, undefined],
            };
            (0, chai_1.expect)((0, util_1.deepOmitUndefined)(obj)).to.eql({ a: 1, b: 2, c: [3] });
        });
        it("should omit undefined values in objects in lists", () => {
            const obj = {
                a: 1,
                b: 2,
                c: [{ d: 3, e: undefined }],
            };
            (0, chai_1.expect)((0, util_1.deepOmitUndefined)(obj)).to.eql({ a: 1, b: 2, c: [{ d: 3 }] });
        });
    });
    (0, mocha_1.describe)("splitFirst", () => {
        it("should split string on first occurrence of given delimiter", () => {
            (0, chai_1.expect)((0, util_2.splitFirst)("foo:bar:boo", ":")).to.eql(["foo", "bar:boo"]);
        });
        it("should return the whole string as first element when no delimiter is found in string", () => {
            (0, chai_1.expect)((0, util_2.splitFirst)("foo", ":")).to.eql(["foo", ""]);
        });
    });
    (0, mocha_1.describe)("splitLast", () => {
        it("should split string on last occurrence of given delimiter", () => {
            (0, chai_1.expect)((0, util_1.splitLast)("foo:bar:boo", ":")).to.eql(["foo:bar", "boo"]);
        });
        it("should return the whole string as last element when no delimiter is found in string", () => {
            (0, chai_1.expect)((0, util_1.splitLast)("foo", ":")).to.eql(["", "foo"]);
        });
    });
    (0, mocha_1.describe)("relationshipClasses", () => {
        it("should correctly partition related items", () => {
            const items = ["a", "b", "c", "d", "e", "f", "g", "ab", "bc", "cd", "de", "fg"];
            const isRelated = (s1, s2) => (0, lodash_1.includes)(s1, s2) || (0, lodash_1.includes)(s2, s1);
            // There's no "ef" element, so ["f", "fg", "g"] should be disjoint from the rest.
            (0, chai_1.expect)((0, util_1.relationshipClasses)(items, isRelated)).to.eql([
                ["a", "ab", "b", "bc", "c", "cd", "d", "de", "e"],
                ["f", "fg", "g"],
            ]);
        });
        it("should return a single partition when only one item is passed", () => {
            const isRelated = (s1, s2) => s1[0] === s2[0];
            (0, chai_1.expect)((0, util_1.relationshipClasses)(["a"], isRelated)).to.eql([["a"]]);
        });
    });
    (0, mocha_1.describe)("safeDumpYaml", () => {
        it("should exclude invalid values from resulting YAML", () => {
            const json = {
                foo: {
                    a: "a",
                    fn: () => { },
                    deep: {
                        undf: undefined,
                        b: "b",
                        deeper: {
                            date: new Date("2020-01-01"),
                            fn: () => { },
                            c: "c",
                        },
                    },
                    undf: undefined,
                    d: "d",
                },
            };
            (0, chai_1.expect)((0, util_1.safeDumpYaml)(json)).to.eql((0, string_1.dedent) `
      foo:
        a: a
        deep:
          b: b
          deeper:
            date: 2020-01-01T00:00:00.000Z
            c: c
        d: d\n
      `);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsaUNBQWdDO0FBQ2hDLG1DQUFpQztBQUNqQyxvREFha0M7QUFDbEMsOENBQThDO0FBQzlDLG9EQUFzRDtBQUN0RCwwREFBeUQ7QUFDekQsd0RBQW9EO0FBRXBELFNBQVMsZUFBZTtJQUN0QixPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFBO0FBQ3RFLENBQUM7QUFFRCxJQUFBLGdCQUFRLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtJQUNwQixJQUFBLGdCQUFRLEVBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUM1QixFQUFFLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLE1BQU0sR0FBRyxHQUFHLElBQUEsbUJBQVksRUFBQztnQkFDdkIsSUFBSSxFQUFFLENBQUM7Z0JBQ1AsR0FBRyxFQUFFLElBQUk7Z0JBQ1QsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDO2dCQUNsQixLQUFLLEVBQUUsZUFBZTtnQkFDdEIsTUFBTSxFQUFFLGVBQWU7YUFDeEIsQ0FBQyxDQUFBO1lBQ0YsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFBLGVBQU0sRUFBQTs7OztPQUkxQixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsTUFBTSxHQUFHLEdBQUcsSUFBQSxtQkFBWSxFQUFDO2dCQUN2QixJQUFJLEVBQUUsQ0FBQztnQkFDUCxHQUFHLEVBQUUsSUFBSTtnQkFDVCxJQUFJLEVBQUUsRUFBRTtnQkFDUixLQUFLLEVBQUUsZUFBZTtnQkFDdEIsTUFBTSxFQUFFLGVBQWU7YUFDeEIsQ0FB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