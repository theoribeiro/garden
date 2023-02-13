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
const template_string_1 = require("../../../src/template-string/template-string");
const base_1 = require("../../../src/config/template-contexts/base");
const helpers_1 = require("../../helpers");
const string_1 = require("../../../src/util/string");
/* eslint-disable no-invalid-template-strings */
class TestContext extends base_1.ConfigContext {
    constructor(context) {
        super();
        Object.assign(this, context);
    }
}
describe("resolveTemplateString", async () => {
    it("should return a non-templated string unchanged", async () => {
        const res = (0, template_string_1.resolveTemplateString)("somestring", new TestContext({}));
        (0, chai_1.expect)(res).to.equal("somestring");
    });
    it("should resolve a key with a dash in it", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${some-key}", new TestContext({ "some-key": "value" }));
        (0, chai_1.expect)(res).to.equal("value");
    });
    it("should resolve a nested key with a dash in it", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${ctx.some-key}", new TestContext({ ctx: { "some-key": "value" } }));
        (0, chai_1.expect)(res).to.equal("value");
    });
    it("should correctly resolve if ? suffix is present but value exists", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo}?", new TestContext({ foo: "bar" }));
        (0, chai_1.expect)(res).to.equal("bar");
    });
    it("should allow undefined values if ? suffix is present", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo}?", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(undefined);
    });
    it("should pass optional string through if allowPartial=true", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo}?", new TestContext({}), { allowPartial: true });
        (0, chai_1.expect)(res).to.equal("${foo}?");
    });
    it("should support a string literal in a template string as a means to escape it", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${'$'}{bar}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal("${bar}");
    });
    it("should pass through a template string with a double $$ prefix", async () => {
        const res = (0, template_string_1.resolveTemplateString)("$${bar}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal("$${bar}");
    });
    it("should allow unescaping a template string with a double $$ prefix", async () => {
        const res = (0, template_string_1.resolveTemplateString)("$${bar}", new TestContext({}), { unescape: true });
        (0, chai_1.expect)(res).to.equal("${bar}");
    });
    it("should allow mixing normal and escaped strings", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo}-and-$${var.nope}", new TestContext({ foo: "yes" }), { unescape: true });
        (0, chai_1.expect)(res).to.equal("yes-and-${var.nope}");
    });
    it("should interpolate a format string with a prefix", async () => {
        const res = (0, template_string_1.resolveTemplateString)("prefix-${some}", new TestContext({ some: "value" }));
        (0, chai_1.expect)(res).to.equal("prefix-value");
    });
    it("should interpolate a format string with a suffix", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${some}-suffix", new TestContext({ some: "value" }));
        (0, chai_1.expect)(res).to.equal("value-suffix");
    });
    it("should interpolate a format string with a prefix and a suffix", async () => {
        const res = (0, template_string_1.resolveTemplateString)("prefix-${some}-suffix", new TestContext({ some: "value" }));
        (0, chai_1.expect)(res).to.equal("prefix-value-suffix");
    });
    it("should interpolate an optional format string with a prefix and a suffix", async () => {
        const res = (0, template_string_1.resolveTemplateString)("prefix-${some}?-suffix", new TestContext({}));
        (0, chai_1.expect)(res).to.equal("prefix--suffix");
    });
    it("should interpolate a format string with a prefix with whitespace", async () => {
        const res = (0, template_string_1.resolveTemplateString)("prefix ${some}", new TestContext({ some: "value" }));
        (0, chai_1.expect)(res).to.equal("prefix value");
    });
    it("should interpolate a format string with a suffix with whitespace", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${some} suffix", new TestContext({ some: "value" }));
        (0, chai_1.expect)(res).to.equal("value suffix");
    });
    it("should correctly interpolate a format string with surrounding whitespace", async () => {
        const res = (0, template_string_1.resolveTemplateString)("prefix ${some} suffix", new TestContext({ some: "value" }));
        (0, chai_1.expect)(res).to.equal("prefix value suffix");
    });
    it("should handle a nested key", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${some.nested}", new TestContext({ some: { nested: "value" } }));
        (0, chai_1.expect)(res).to.equal("value");
    });
    it("should handle multiple format strings", async () => {
        const res = (0, template_string_1.resolveTemplateString)("prefix-${a}-${b}-suffix", new TestContext({ a: "value", b: "other" }));
        (0, chai_1.expect)(res).to.equal("prefix-value-other-suffix");
    });
    it("should handle consecutive format strings", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a}${b}", new TestContext({ a: "value", b: "other" }));
        (0, chai_1.expect)(res).to.equal("valueother");
    });
    it("should throw when a key is not found", async () => {
        await (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${some}", new TestContext({})), {
            contains: "Invalid template string (${some}): Could not find key some.",
        });
    });
    it("should trim long template string in error messages", async () => {
        (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${some} very very very very very long long long long long template string", new TestContext({})), { contains: "Invalid template string (${some} very very very very very l…): Could not find key some." });
    });
    it("should replace line breaks in template strings in error messages", async () => {
        (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${some}\nmulti\nline\nstring", new TestContext({})), {
            contains: "Invalid template string (${some}\\nmulti\\nline\\nstring): Could not find key some.",
        });
    });
    it("should throw when a nested key is not found", async () => {
        (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${some.other}", new TestContext({ some: {} })), {
            contains: "Invalid template string (${some.other}): Could not find key other under some.",
        });
    });
    it("should throw with an incomplete template string", async () => {
        try {
            (0, template_string_1.resolveTemplateString)("${some", new TestContext({ some: {} }));
        }
        catch (err) {
            (0, chai_1.expect)(err.message).to.equal("Invalid template string (${some): Unable to parse as valid template string.");
            return;
        }
        throw new Error("Expected error");
    });
    it("should throw on nested format strings", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${resol${part}ed}", new TestContext({})), { contains: "Invalid template string (${resol${part}ed}): Unable to parse as valid template string." });
    });
    it("should handle a single-quoted string", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${'foo'}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal("foo");
    });
    it("should handle a numeric literal and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${123}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(123);
    });
    it("should handle a boolean true literal and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${true}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a boolean false literal and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${false}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a null literal and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${null}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(null);
    });
    it("should handle a numeric literal in a logical OR and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a || 123}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(123);
    });
    it("should handle a boolean true literal in a logical OR and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a || true}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a boolean false literal in a logical OR and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a || false}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a null literal in a logical OR and return it directly", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a || null}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(null);
    });
    it("should handle a double-quoted string", async () => {
        const res = (0, template_string_1.resolveTemplateString)('${"foo"}', new TestContext({}));
        (0, chai_1.expect)(res).to.equal("foo");
    });
    it("should throw on invalid single-quoted string", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${'foo}", new TestContext({})), { contains: "Invalid template string (${'foo}): Unable to parse as valid template string." });
    });
    it("should throw on invalid double-quoted string", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)('${"foo}', new TestContext({})), { contains: 'Invalid template string (${"foo}): Unable to parse as valid template string.' });
    });
    it("should handle a logical OR between two identifiers", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a || b}", new TestContext({ a: undefined, b: "abc" }));
        (0, chai_1.expect)(res).to.equal("abc");
    });
    it("should handle a logical OR between two nested identifiers", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a.b || c.d}", new TestContext({
            a: { b: undefined },
            c: { d: "abc" },
        }));
        (0, chai_1.expect)(res).to.equal("abc");
    });
    it("should handle a logical OR between two nested identifiers where the first resolves", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a.b || c.d}", new TestContext({
            a: { b: "abc" },
            c: { d: undefined },
        }));
        (0, chai_1.expect)(res).to.equal("abc");
    });
    it("should handle a logical OR between two identifiers without spaces with first value undefined", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a||b}", new TestContext({ a: undefined, b: "abc" }));
        (0, chai_1.expect)(res).to.equal("abc");
    });
    it("should handle a logical OR between two identifiers with first value undefined and string fallback", async () => {
        const res = (0, template_string_1.resolveTemplateString)('${a || "foo"}', new TestContext({ a: undefined }));
        (0, chai_1.expect)(res).to.equal("foo");
    });
    it("should handle a logical OR with undefined nested value and string fallback", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a.b || 'foo'}", new TestContext({ a: {} }));
        (0, chai_1.expect)(res).to.equal("foo");
    });
    it("should handle chained logical OR with string fallback", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a.b || c.d || e.f || 'foo'}", new TestContext({ a: {}, c: {}, e: {} }));
        (0, chai_1.expect)(res).to.equal("foo");
    });
    it("should handle a logical OR between two identifiers without spaces with first value set", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a||b}", new TestContext({ a: "abc", b: undefined }));
        (0, chai_1.expect)(res).to.equal("abc");
    });
    it("should throw if neither key in logical OR is valid", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${a || b}", new TestContext({})), {
            contains: "Invalid template string (${a || b}): Could not find key b.",
        });
    });
    it("should throw on invalid logical OR string", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${a || 'b}", new TestContext({})), { contains: "Invalid template string (${a || 'b}): Unable to parse as valid template string." });
    });
    it("should handle a logical OR between a string and a string", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${'a' || 'b'}", new TestContext({ a: undefined }));
        (0, chai_1.expect)(res).to.equal("a");
    });
    it("should handle a logical OR between an empty string and a string", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a || 'b'}", new TestContext({ a: "" }));
        (0, chai_1.expect)(res).to.equal("b");
    });
    context("logical AND (&& operator)", () => {
        it("true literal and true variable reference", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${true && a}", new TestContext({ a: true }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("two true variable references", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${var.a && var.b}", new TestContext({ var: { a: true, b: true } }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("first part is false but the second part is not resolvable", async () => {
            // i.e. the 2nd clause should not need to be evaluated
            const res = (0, template_string_1.resolveTemplateString)("${false && a}", new TestContext({}));
            (0, chai_1.expect)(res).to.equal(false);
        });
        it("an empty string as the first clause", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${'' && true}", new TestContext({}));
            (0, chai_1.expect)(res).to.equal("");
        });
        it("an empty string as the second clause", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${true && ''}", new TestContext({}));
            (0, chai_1.expect)(res).to.equal("");
        });
        it("a missing reference as the first clause", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${var.foo && 'a'}", new TestContext({ var: {} }));
            (0, chai_1.expect)(res).to.equal(false);
        });
        it("a missing reference as the second clause", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${'a' && var.foo}", new TestContext({ var: {} }));
            (0, chai_1.expect)(res).to.equal(false);
        });
        context("partial resolution", () => {
            it("a missing reference as the first clause returns the original template", async () => {
                const res = (0, template_string_1.resolveTemplateString)("${var.foo && 'a'}", new TestContext({ var: {} }), { allowPartial: true });
                (0, chai_1.expect)(res).to.equal("${var.foo && 'a'}");
            });
            it("a missing reference as the second clause returns the original template", async () => {
                const res = (0, template_string_1.resolveTemplateString)("${'a' && var.foo}", new TestContext({ var: {} }), { allowPartial: true });
                (0, chai_1.expect)(res).to.equal("${'a' && var.foo}");
            });
        });
    });
    it("should handle a positive equality comparison between equal resolved values", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a == b}", new TestContext({ a: "a", b: "a" }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a positive equality comparison between equal string literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${'a' == 'a'}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a positive equality comparison between equal numeric literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${123 == 123}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a positive equality comparison between equal boolean literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${true == true}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a positive equality comparison between different resolved values", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a == b}", new TestContext({ a: "a", b: "b" }));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a positive equality comparison between different string literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${'a' == 'b'}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a positive equality comparison between different numeric literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${123 == 456}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a positive equality comparison between different boolean literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${true == false}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a negative equality comparison between equal resolved values", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a != b}", new TestContext({ a: "a", b: "a" }));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a negative equality comparison between equal string literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${'a' != 'a'}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a negative equality comparison between equal numeric literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${123 != 123}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a negative equality comparison between equal boolean literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${false != false}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a negative equality comparison between different resolved values", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a != b}", new TestContext({ a: "a", b: "b" }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a negative equality comparison between different string literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${'a' != 'b'}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a negative equality comparison between different numeric literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${123 != 456}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a negative equality comparison between different boolean literals", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${true != false}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a positive equality comparison between different value types", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${true == 'foo'}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a negative equality comparison between different value types", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${123 != false}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle negations on booleans", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${!true}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle negations on nulls", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${!null}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle negations on empty strings", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${!''}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle negations on resolved keys", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${!a}", new TestContext({ a: false }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle the typeof operator for resolved booleans", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${typeof a}", new TestContext({ a: false }));
        (0, chai_1.expect)(res).to.equal("boolean");
    });
    it("should handle the typeof operator for resolved numbers", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${typeof foo}", new TestContext({ foo: 1234 }));
        (0, chai_1.expect)(res).to.equal("number");
    });
    it("should handle the typeof operator for strings", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${typeof 'foo'}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal("string");
    });
    it("should throw when using comparison operators on missing keys", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${a >= b}", new TestContext({ a: 123 })), {
            contains: "Invalid template string (${a >= b}): Could not find key b. Available keys: a.",
        });
    });
    it("should concatenate two arrays", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a + b}", new TestContext({ a: [1], b: [2, 3] }));
        (0, chai_1.expect)(res).to.eql([1, 2, 3]);
    });
    it("should concatenate two strings", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a + b}", new TestContext({ a: "foo", b: "bar" }));
        (0, chai_1.expect)(res).to.eql("foobar");
    });
    it("should add two numbers together", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${1 + a}", new TestContext({ a: 2 }));
        (0, chai_1.expect)(res).to.equal(3);
    });
    it("should throw when using + on number and array", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${a + b}", new TestContext({ a: 123, b: ["a"] })), {
            contains: "Invalid template string (${a + b}): Both terms need to be either arrays or strings or numbers for + operator (got number and object).",
        });
    });
    it("should correctly evaluate clauses in parentheses", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${(1 + 2) * (3 + 4)}", new TestContext({}));
        (0, chai_1.expect)(res).to.equal(21);
    });
    it("should handle member lookup with bracket notation", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo['bar']}", new TestContext({ foo: { bar: true } }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle member lookup with bracket notation, single quotes and dot in key name", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo['bar.baz']}", new TestContext({ foo: { "bar.baz": true } }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle member lookup with bracket notation, double quotes and dot in key name", async () => {
        const res = (0, template_string_1.resolveTemplateString)('${foo.bar["bla.ble"]}', new TestContext({ foo: { bar: { "bla.ble": 123 } } }));
        (0, chai_1.expect)(res).to.equal(123);
    });
    it("should handle numeric member lookup with bracket notation", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo[1]}", new TestContext({ foo: [false, true] }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle consecutive member lookups with bracket notation", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo['bar']['baz']}", new TestContext({ foo: { bar: { baz: true } } }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle dot member after bracket member", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo['bar'].baz}", new TestContext({ foo: { bar: { baz: true } } }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle template expression within brackets", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo['${bar}']}", new TestContext({
            foo: { baz: true },
            bar: "baz",
        }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle identifiers within brackets", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo[bar]}", new TestContext({
            foo: { baz: true },
            bar: "baz",
        }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle nested identifiers within brackets", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo[a.b]}", new TestContext({
            foo: { baz: true },
            a: { b: "baz" },
        }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should throw if bracket expression resolves to a non-primitive", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${foo[bar]}", new TestContext({ foo: {}, bar: {} })), { contains: "Invalid template string (${foo[bar]}): Expression in bracket must resolve to a primitive (got object)." });
    });
    it("should throw if attempting to index a primitive with brackets", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${foo[bar]}", new TestContext({ foo: 123, bar: "baz" })), { contains: 'Invalid template string (${foo[bar]}): Attempted to look up key "baz" on a number.' });
    });
    it("should throw when using >= on non-numeric terms", async () => {
        return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${a >= b}", new TestContext({ a: 123, b: "foo" })), { contains: "Invalid template string (${a >= b}): Both terms need to be numbers for >= operator (got number and string)." });
    });
    it("should handle a positive ternary expression", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo ? true : false}", new TestContext({ foo: true }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a negative ternary expression", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo ? true : false}", new TestContext({ foo: false }));
        (0, chai_1.expect)(res).to.equal(false);
    });
    it("should handle a ternary expression with an expression as a test", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo == 'bar' ? a : b}", new TestContext({ foo: "bar", a: true, b: false }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should ignore errors in a value not returned by a ternary", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${var.foo ? replace(var.foo, ' ', ',') : null}", new TestContext({ var: {} }));
        (0, chai_1.expect)(res).to.equal(null);
    });
    it("should handle a ternary expression with an object as a test", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${a ? a.value : b}", new TestContext({ a: { value: true }, b: false }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle a ternary expression with template key values", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo == 'bar' ? '=${foo}' : b}", new TestContext({ foo: "bar", a: true, b: false }));
        (0, chai_1.expect)(res).to.equal("=bar");
    });
    it("should handle an expression in parentheses", async () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo || (a > 5)}", new TestContext({ foo: false, a: 10 }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should handle numeric indices on arrays", () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo.1}", new TestContext({ foo: [false, true] }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should resolve keys on objects in arrays", () => {
        const res = (0, template_string_1.resolveTemplateString)("${foo.1.bar}", new TestContext({ foo: [{}, { bar: true }] }));
        (0, chai_1.expect)(res).to.equal(true);
    });
    it("should correctly propagate errors from nested contexts", async () => {
        await (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${nested.missing}", new TestContext({ nested: new TestContext({ foo: 123, bar: 456, baz: 789 }) })), {
            contains: "Invalid template string (${nested.missing}): Could not find key missing under nested. Available keys: bar, baz and foo.",
        });
    });
    it("should correctly propagate errors from nested objects", async () => {
        await (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${nested.missing}", new TestContext({ nested: { foo: 123, bar: 456 } })), {
            contains: "Invalid template string (${nested.missing}): Could not find key missing under nested. Available keys: bar and foo.",
        });
    });
    it("should correctly propagate errors when resolving key on object in nested context", async () => {
        const c = new TestContext({ nested: new TestContext({ deeper: {} }) });
        await (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${nested.deeper.missing}", c), {
            contains: "Invalid template string (${nested.deeper.missing}): Could not find key missing under nested.deeper.",
        });
    });
    it("should correctly propagate errors from deeply nested contexts", async () => {
        const c = new TestContext({ nested: new TestContext({ deeper: new TestContext({}) }) });
        await (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${nested.deeper.missing}", c), {
            contains: "Invalid template string (${nested.deeper.missing}): Could not find key missing under nested.deeper.",
        });
    });
    context("allowPartial=true", () => {
        it("passes through template strings with missing key", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a}", new TestContext({}), { allowPartial: true });
            (0, chai_1.expect)(res).to.equal("${a}");
        });
        it("passes through a template string with a missing key in an optional clause", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a || b}", new TestContext({ b: 123 }), { allowPartial: true });
            (0, chai_1.expect)(res).to.equal("${a || b}");
        });
        it("passes through a template string with a missing key in a ternary", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a ? b : 123}", new TestContext({ b: 123 }), { allowPartial: true });
            (0, chai_1.expect)(res).to.equal("${a ? b : 123}");
        });
    });
    context("when the template string is the full input string", () => {
        it("should return a resolved number directly", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${a}", new TestContext({ a: 100 }));
            (0, chai_1.expect)(res).to.equal(100);
        });
        it("should return a resolved boolean true directly", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${a}", new TestContext({ a: true }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("should return a resolved boolean false directly", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${a}", new TestContext({ a: false }));
            (0, chai_1.expect)(res).to.equal(false);
        });
        it("should return a resolved null directly", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${a}", new TestContext({ a: null }));
            (0, chai_1.expect)(res).to.equal(null);
        });
        it("should return a resolved object directly", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${a}", new TestContext({ a: { b: 123 } }));
            (0, chai_1.expect)(res).to.eql({ b: 123 });
        });
        it("should return a resolved array directly", async () => {
            const res = (0, template_string_1.resolveTemplateString)("${a}", new TestContext({ a: [123] }));
            (0, chai_1.expect)(res).to.eql([123]);
        });
    });
    context("when the template string is a part of a string", () => {
        it("should format a resolved number into the string", async () => {
            const res = (0, template_string_1.resolveTemplateString)("foo-${a}", new TestContext({ a: 100 }));
            (0, chai_1.expect)(res).to.equal("foo-100");
        });
        it("should format a resolved boolean true into the string", async () => {
            const res = (0, template_string_1.resolveTemplateString)("foo-${a}", new TestContext({ a: true }));
            (0, chai_1.expect)(res).to.equal("foo-true");
        });
        it("should format a resolved boolean false into the string", async () => {
            const res = (0, template_string_1.resolveTemplateString)("foo-${a}", new TestContext({ a: false }));
            (0, chai_1.expect)(res).to.equal("foo-false");
        });
        it("should format a resolved null into the string", async () => {
            const res = (0, template_string_1.resolveTemplateString)("foo-${a}", new TestContext({ a: null }));
            (0, chai_1.expect)(res).to.equal("foo-null");
        });
        context("allowPartial=true", () => {
            it("passes through template strings with missing key", () => {
                const res = (0, template_string_1.resolveTemplateString)("${a}-${b}", new TestContext({ b: "foo" }), { allowPartial: true });
                (0, chai_1.expect)(res).to.equal("${a}-foo");
            });
            it("passes through a template string with a missing key in an optional clause", () => {
                const res = (0, template_string_1.resolveTemplateString)("${a || b}-${c}", new TestContext({ b: 123, c: "foo" }), {
                    allowPartial: true,
                });
                (0, chai_1.expect)(res).to.equal("${a || b}-foo");
            });
        });
    });
    context("contains operator", () => {
        it("should throw when right-hand side is not a primitive", () => {
            const c = new TestContext({ a: [1, 2], b: [3, 4] });
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${a contains b}", c), {
                contains: "Invalid template string (${a contains b}): The right-hand side of a 'contains' operator must be a string, number, boolean or null (got object).",
            });
        });
        it("should throw when left-hand side is not a string, array or object", () => {
            const c = new TestContext({ a: "foo", b: null });
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${b contains a}", c), {
                contains: "Invalid template string (${b contains a}): The left-hand side of a 'contains' operator must be a string, array or object (got null).",
            });
        });
        it("positive string literal contains string literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${'foobar' contains 'foo'}", new TestContext({}));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("string literal contains string literal (negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("${'blorg' contains 'blarg'}", new TestContext({}));
            (0, chai_1.expect)(res).to.equal(false);
        });
        it("string literal contains string reference", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 'foo'}", new TestContext({ a: "foobar" }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("string reference contains string literal (negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 'blarg'}", new TestContext({ a: "foobar" }));
            (0, chai_1.expect)(res).to.equal(false);
        });
        it("string contains number", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 0}", new TestContext({ a: "hmm-0" }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("object contains string literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 'foo'}", new TestContext({ a: { foo: 123 } }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("object contains string literal (negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 'bar'}", new TestContext({ a: { foo: 123 } }));
            (0, chai_1.expect)(res).to.equal(false);
        });
        it("object contains string reference", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains b}", new TestContext({ a: { foo: 123 }, b: "foo" }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("object contains number reference", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains b}", new TestContext({ a: { 123: 456 }, b: 123 }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("object contains number literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 123}", new TestContext({ a: { 123: 456 } }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("array contains string reference", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains b}", new TestContext({ a: ["foo"], b: "foo" }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("array contains string reference (negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains b}", new TestContext({ a: ["foo"], b: "bar" }));
            (0, chai_1.expect)(res).to.equal(false);
        });
        it("array contains string literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 'foo'}", new TestContext({ a: ["foo"] }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("array contains number", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 1}", new TestContext({ a: [0, 1] }));
            (0, chai_1.expect)(res).to.equal(true);
        });
        it("array contains numeric index (negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("${a contains 1}", new TestContext({ a: [0] }));
            (0, chai_1.expect)(res).to.equal(false);
        });
    });
    context("conditional blocks", () => {
        it("single-line if block (positive)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix ${if a}content ${endif}suffix", new TestContext({ a: true }));
            (0, chai_1.expect)(res).to.equal("prefix content suffix");
        });
        it("single-line if block (negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix ${if a}content ${endif}suffix", new TestContext({ a: false }));
            (0, chai_1.expect)(res).to.equal("prefix suffix");
        });
        it("single-line if/else statement (positive)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix ${if a == 123}content ${else}other ${endif}suffix", new TestContext({ a: 123 }));
            (0, chai_1.expect)(res).to.equal("prefix content suffix");
        });
        it("single-line if/else statement (negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix ${if a}content ${else}other ${endif}suffix", new TestContext({ a: false }));
            (0, chai_1.expect)(res).to.equal("prefix other suffix");
        });
        it("multi-line if block (positive)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix\n${if a}content\n${endif}suffix", new TestContext({ a: true }));
            (0, chai_1.expect)(res).to.equal((0, string_1.dedent) `
        prefix
        content
        suffix
      `);
        });
        it("template string within if block", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix\n${if a}templated: ${b}\n${endif}suffix", new TestContext({ a: true, b: "content" }));
            (0, chai_1.expect)(res).to.equal((0, string_1.dedent) `
        prefix
        templated: content
        suffix
      `);
        });
        it("nested if block (both positive)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix\n${if a}some ${if b}content\n${endif}${endif}suffix", new TestContext({ a: true, b: true }));
            (0, chai_1.expect)(res).to.equal((0, string_1.dedent) `
        prefix
        some content
        suffix
      `);
        });
        it("nested if block (outer negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix\n${if a}some ${if b}content\n${endif}${endif}suffix", new TestContext({ a: false, b: true }));
            (0, chai_1.expect)(res).to.equal((0, string_1.dedent) `
        prefix
        suffix
      `);
        });
        it("nested if block (inner negative)", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix\n${if a}some\n${if b}content\n${endif}${endif}suffix", new TestContext({ a: true, b: false }));
            (0, chai_1.expect)(res).to.equal((0, string_1.dedent) `
        prefix
        some
        suffix
      `);
        });
        it("if/else statement inside if block", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix\n${if a}some\n${if b}nope${else}content\n${endif}${endif}suffix", new TestContext({ a: true, b: false }));
            (0, chai_1.expect)(res).to.equal((0, string_1.dedent) `
        prefix
        some
        content
        suffix
      `);
        });
        it("if block inside if/else statement", () => {
            const res = (0, template_string_1.resolveTemplateString)("prefix\n${if a}some\n${if b}content\n${endif}${else}nope ${endif}suffix", new TestContext({ a: true, b: false }));
            (0, chai_1.expect)(res).to.equal((0, string_1.dedent) `
        prefix
        some
        suffix
      `);
        });
        it("throws if an if block has an optional suffix", () => {
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("prefix ${if a}?content ${endif}", new TestContext({ a: true })), {
                contains: "Invalid template string (prefix ${if a}?content ${endif}): Cannot specify optional suffix in if-block.",
            });
        });
        it("throws if an if block doesn't have a matching endif", () => {
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("prefix ${if a}content", new TestContext({ a: true })), {
                contains: "Invalid template string (prefix ${if a}content): Missing ${endif} after ${if ...} block.",
            });
        });
        it("throws if an endif block doesn't have a matching if", () => {
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("prefix content ${endif}", new TestContext({ a: true })), {
                contains: "Invalid template string (prefix content ${endif}): Found ${endif} block without a preceding ${if...} block.",
            });
        });
    });
    context("helper functions", () => {
        it("resolves a helper function with a string literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${base64Encode('foo')}", new TestContext({}));
            (0, chai_1.expect)(res).to.equal("Zm9v");
        });
        it("resolves a template string in a helper argument", () => {
            const res = (0, template_string_1.resolveTemplateString)("${base64Encode('${a}')}", new TestContext({ a: "foo" }));
            (0, chai_1.expect)(res).to.equal("Zm9v");
        });
        it("resolves a helper function with multiple arguments", () => {
            const res = (0, template_string_1.resolveTemplateString)("${split('a,b,c', ',')}", new TestContext({}));
            (0, chai_1.expect)(res).to.eql(["a", "b", "c"]);
        });
        it("resolves a helper function with a template key reference", () => {
            const res = (0, template_string_1.resolveTemplateString)("${base64Encode(a)}", new TestContext({ a: "foo" }));
            (0, chai_1.expect)(res).to.equal("Zm9v");
        });
        it("generates a correct hash with a string literal from the sha256 helper function", () => {
            const res = (0, template_string_1.resolveTemplateString)("${sha256('This Is A Test String')}", new TestContext({}));
            (0, chai_1.expect)(res).to.equal("9a058284378d1cc6b4348aacb6ba847918376054b094bbe06eb5302defc52685");
        });
        it("throws if an argument is missing", () => {
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${base64Decode()}", new TestContext({})), {
                contains: "Invalid template string (${base64Decode()}): Missing argument 'string' for base64Decode helper function.",
            });
        });
        it("throws if a wrong argument type is passed", () => {
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${base64Decode(a)}", new TestContext({ a: 1234 })), {
                contains: "Invalid template string (${base64Decode(a)}): Error validating argument 'string' for base64Decode helper function: value must be a string",
            });
        });
        it("throws if the function can't be found", () => {
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${floop('blop')}", new TestContext({})), {
                contains: "Invalid template string (${floop('blop')}): Could not find helper function 'floop'. Available helper functions:",
            });
        });
        it("throws if the function fails", () => {
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${jsonDecode('{]}')}", new TestContext({})), {
                contains: "Invalid template string (${jsonDecode('{]}')}): Error from helper function jsonDecode: Unexpected token ] in JSON at position 1",
            });
        });
        context("concat", () => {
            it("allows empty strings", () => {
                const res = (0, template_string_1.resolveTemplateString)("${concat('', '')}", new TestContext({}));
                (0, chai_1.expect)(res).to.equal("");
            });
            context("throws when", () => {
                function expectArgTypeError({ template, testContextVars = {}, errorMessage, }) {
                    return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)(template, new TestContext(testContextVars)), {
                        contains: `Invalid template string (\${concat(a, b)}): ${errorMessage}`,
                    });
                }
                it("using on incompatible argument types (string and object)", async () => {
                    return expectArgTypeError({
                        template: "${concat(a, b)}",
                        testContextVars: {
                            a: "123",
                            b: ["a"],
                        },
                        errorMessage: "Error from helper function concat: Both terms need to be either arrays or strings (got string and object).",
                    });
                });
                it("using on unsupported argument types (number and object)", async () => {
                    return expectArgTypeError({
                        template: "${concat(a, b)}",
                        testContextVars: {
                            a: 123,
                            b: ["a"],
                        },
                        errorMessage: "Error validating argument 'arg1' for concat helper function: value must be one of [array, string]",
                    });
                });
            });
        });
        context("slice", () => {
            it("allows numeric indices", () => {
                const res = (0, template_string_1.resolveTemplateString)("${slice(foo, 0, 3)}", new TestContext({ foo: "abcdef" }));
                (0, chai_1.expect)(res).to.equal("abc");
            });
            it("allows numeric strings as indices", () => {
                const res = (0, template_string_1.resolveTemplateString)("${slice(foo, '0', '3')}", new TestContext({ foo: "abcdef" }));
                (0, chai_1.expect)(res).to.equal("abc");
            });
            it("throws on invalid string in the start index", () => {
                return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${slice(foo, 'a', 3)}", new TestContext({ foo: "abcdef" })), {
                    contains: `Invalid template string (\${slice(foo, 'a', 3)}): Error from helper function slice: start index must be a number or a numeric string (got "a")`,
                });
            });
            it("throws on invalid string in the end index", () => {
                return (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateString)("${slice(foo, 0, 'b')}", new TestContext({ foo: "abcdef" })), {
                    contains: `Invalid template string (\${slice(foo, 0, 'b')}): Error from helper function slice: end index must be a number or a numeric string (got "b")`,
                });
            });
        });
    });
    context("array literals", () => {
        it("returns an empty array literal back", () => {
            const res = (0, template_string_1.resolveTemplateString)("${[]}", new TestContext({}));
            (0, chai_1.expect)(res).to.eql([]);
        });
        it("returns an array literal of literals back", () => {
            const res = (0, template_string_1.resolveTemplateString)("${['foo', \"bar\", 123, true, false]}", new TestContext({}));
            (0, chai_1.expect)(res).to.eql(["foo", "bar", 123, true, false]);
        });
        it("resolves a key in an array literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${[foo]}", new TestContext({ foo: "bar" }));
            (0, chai_1.expect)(res).to.eql(["bar"]);
        });
        it("resolves a nested key in an array literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${[foo.bar]}", new TestContext({ foo: { bar: "baz" } }));
            (0, chai_1.expect)(res).to.eql(["baz"]);
        });
        it("calls a helper in an array literal", () => {
            const res = (0, template_string_1.resolveTemplateString)("${[foo, base64Encode('foo')]}", new TestContext({ foo: "bar" }));
            (0, chai_1.expect)(res).to.eql(["bar", "Zm9v"]);
        });
        it("calls a helper with an array literal argument", () => {
            const res = (0, template_string_1.resolveTemplateString)("${join(['foo', 'bar'], ',')}", new TestContext({}));
            (0, chai_1.expect)(res).to.eql("foo,bar");
        });
        it("allows empty string separator in join helper function", () => {
            const res = (0, template_string_1.resolveTemplateString)("${join(['foo', 'bar'], '')}", new TestContext({}));
            (0, chai_1.expect)(res).to.eql("foobar");
        });
    });
});
describe("resolveTemplateStrings", () => {
    it("should resolve all template strings in an object with the given context", async () => {
        const obj = {
            some: "${key}",
            other: {
                nested: "${something}",
                noTemplate: "at-all",
            },
        };
        const templateContext = new TestContext({
            key: "value",
            something: "else",
        });
        const result = (0, template_string_1.resolveTemplateStrings)(obj, templateContext);
        (0, chai_1.expect)(result).to.eql({
            some: "value",
            other: {
                nested: "else",
                noTemplate: "at-all",
            },
        });
    });
    it("should correctly handle optional template strings", async () => {
        const obj = {
            some: "${key}?",
            other: "${missing}?",
        };
        const templateContext = new TestContext({
            key: "value",
        });
        const result = (0, template_string_1.resolveTemplateStrings)(obj, templateContext);
        (0, chai_1.expect)(result).to.eql({
            some: "value",
            other: undefined,
        });
    });
    it("should collapse $merge keys on objects", () => {
        const obj = {
            $merge: { a: "a", b: "b" },
            b: "B",
            c: "c",
        };
        const templateContext = new TestContext({});
        const result = (0, template_string_1.resolveTemplateStrings)(obj, templateContext);
        (0, chai_1.expect)(result).to.eql({
            a: "a",
            b: "B",
            c: "c",
        });
    });
    it("should collapse $merge keys based on position on object", () => {
        const obj = {
            b: "B",
            c: "c",
            $merge: { a: "a", b: "b" },
        };
        const templateContext = new TestContext({});
        const result = (0, template_string_1.resolveTemplateStrings)(obj, templateContext);
        (0, chai_1.expect)(result).to.eql({
            a: "a",
            b: "b",
            c: "c",
        });
    });
    it("should resolve $merge keys before collapsing", () => {
        const obj = {
            $merge: "${obj}",
            b: "B",
            c: "c",
        };
        const templateContext = new TestContext({ obj: { a: "a", b: "b" } });
        const result = (0, template_string_1.resolveTemplateStrings)(obj, templateContext);
        (0, chai_1.expect)(result).to.eql({
            a: "a",
            b: "B",
            c: "c",
        });
    });
    it("should resolve $merge keys depth-first", () => {
        const obj = {
            b: "B",
            c: "c",
            $merge: {
                $merge: "${obj}",
                a: "a",
            },
        };
        const templateContext = new TestContext({ obj: { b: "b" } });
        const result = (0, template_string_1.resolveTemplateStrings)(obj, templateContext);
        (0, chai_1.expect)(result).to.eql({
            a: "a",
            b: "b",
            c: "c",
        });
    });
    context("$concat", () => {
        it("handles array concatenation", () => {
            const obj = {
                foo: ["a", { $concat: ["b", "c"] }, "d"],
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}));
            (0, chai_1.expect)(res).to.eql({
                foo: ["a", "b", "c", "d"],
            });
        });
        it("resolves $concat value before spreading", () => {
            const obj = {
                foo: ["a", { $concat: "${foo}" }, "d"],
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({ foo: ["b", "c"] }));
            (0, chai_1.expect)(res).to.eql({
                foo: ["a", "b", "c", "d"],
            });
        });
        it("resolves a $forEach in the $concat clause", () => {
            const obj = {
                foo: ["a", { $concat: { $forEach: ["B", "C"], $return: "${lower(item.value)}" } }, "d"],
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({ foo: ["b", "c"] }));
            (0, chai_1.expect)(res).to.eql({
                foo: ["a", "b", "c", "d"],
            });
        });
        it("throws if $concat value is not an array and allowPartial=false", () => {
            const obj = {
                foo: ["a", { $concat: "b" }, "d"],
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({})), {
                contains: "Value of $concat key must be (or resolve to) an array (got string)",
            });
        });
        it("throws if object with $concat key contains other keys as well", () => {
            const obj = {
                foo: ["a", { $concat: "b", nope: "nay", oops: "derp" }, "d"],
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({})), {
                contains: 'A list item with a $concat key cannot have any other keys (found "nope" and "oops")',
            });
        });
        it("ignores if $concat value is not an array and allowPartial=true", () => {
            const obj = {
                foo: ["a", { $concat: "${foo}" }, "d"],
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}), { allowPartial: true });
            (0, chai_1.expect)(res).to.eql({
                foo: ["a", { $concat: "${foo}" }, "d"],
            });
        });
    });
    context("$forEach", () => {
        it("loops through an array", () => {
            const obj = {
                foo: {
                    $forEach: ["a", "b", "c"],
                    $return: "foo",
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}));
            (0, chai_1.expect)(res).to.eql({
                foo: ["foo", "foo", "foo"],
            });
        });
        it("loops through an object", () => {
            const obj = {
                foo: {
                    $forEach: {
                        a: 1,
                        b: 2,
                        c: 3,
                    },
                    $return: "${item.key}: ${item.value}",
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}));
            (0, chai_1.expect)(res).to.eql({
                foo: ["a: 1", "b: 2", "c: 3"],
            });
        });
        it("throws if the input isn't a list or object and allowPartial=false", () => {
            const obj = {
                foo: {
                    $forEach: "foo",
                    $return: "foo",
                },
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({})), {
                contains: "Value of $forEach key must be (or resolve to) an array or mapping object (got string)",
            });
        });
        it("ignores the loop if the input isn't a list or object and allowPartial=true", () => {
            const obj = {
                foo: {
                    $forEach: "${foo}",
                    $return: "foo",
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}), { allowPartial: true });
            (0, chai_1.expect)(res).to.eql(obj);
        });
        it("throws if there's no $return clause", () => {
            const obj = {
                foo: {
                    $forEach: [1, 2, 3],
                },
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({})), {
                contains: "Missing $return field next to $forEach field.",
            });
        });
        it("throws if there are superfluous keys on the object", () => {
            const obj = {
                foo: {
                    $forEach: [1, 2, 3],
                    $return: "foo",
                    $concat: [4, 5, 6],
                    foo: "bla",
                },
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({})), {
                contains: 'Found one or more unexpected keys on $forEach object: "$concat" and "foo"',
            });
        });
        it("exposes item.value and item.key when resolving the $return clause", () => {
            const obj = {
                foo: {
                    $forEach: "${foo}",
                    $return: "${item.key}: ${item.value}",
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({ foo: ["a", "b", "c"] }));
            (0, chai_1.expect)(res).to.eql({
                foo: ["0: a", "1: b", "2: c"],
            });
        });
        it("resolves the input before processing", () => {
            const obj = {
                foo: {
                    $forEach: "${foo}",
                    $return: "${item.value}",
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({ foo: ["a", "b", "c"] }));
            (0, chai_1.expect)(res).to.eql({
                foo: ["a", "b", "c"],
            });
        });
        it("filters out items if $filter resolves to false", () => {
            const obj = {
                foo: {
                    $forEach: "${foo}",
                    $filter: "${item.value != 'b'}",
                    $return: "${item.value}",
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({ foo: ["a", "b", "c"] }));
            (0, chai_1.expect)(res).to.eql({
                foo: ["a", "c"],
            });
        });
        it("throws if $filter doesn't resolve to a boolean", () => {
            const obj = {
                foo: {
                    $forEach: ["a", "b", "c"],
                    $filter: "foo",
                    $return: "${item.value}",
                },
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({})), {
                contains: "$filter clause in $forEach loop must resolve to a boolean value (got object)",
            });
        });
        it("handles $concat clauses in $return", () => {
            const obj = {
                foo: {
                    $forEach: ["a", "b", "c"],
                    $return: {
                        $concat: ["${item.value}-1", "${item.value}-2"],
                    },
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}));
            (0, chai_1.expect)(res).to.eql({
                foo: ["a-1", "a-2", "b-1", "b-2", "c-1", "c-2"],
            });
        });
        it("handles $forEach clauses in $return", () => {
            const obj = {
                foo: {
                    $forEach: [
                        ["a1", "a2"],
                        ["b1", "b2"],
                    ],
                    $return: {
                        $forEach: "${item.value}",
                        $return: "${upper(item.value)}",
                    },
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}));
            (0, chai_1.expect)(res).to.eql({
                foo: [
                    ["A1", "A2"],
                    ["B1", "B2"],
                ],
            });
        });
        it("resolves to empty list for empty list input", () => {
            const obj = {
                foo: {
                    $forEach: [],
                    $return: "foo",
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({}));
            (0, chai_1.expect)(res).to.eql({
                foo: [],
            });
        });
        it("$merge should correctly merge objects with overlapping property names inside $forEach loop", () => {
            const services = [
                {
                    "env-overrides": {},
                    "service-props": {
                        name: "tmp",
                        command: ["sh", "run.sh"],
                    },
                },
                {
                    "env-overrides": {
                        ENABLE_TMP: "true",
                    },
                    "service-props": {
                        name: "tmp-admin",
                        command: ["sh", "run.sh"],
                    },
                },
            ];
            const obj = {
                services: {
                    $forEach: "${services}",
                    $return: {
                        $merge: "${item.value.service-props}",
                        env: {
                            ALLOW_DATABASE_RESET: "true",
                            $merge: "${item.value.env-overrides}",
                        },
                    },
                },
            };
            const res = (0, template_string_1.resolveTemplateStrings)(obj, new TestContext({ services }));
            (0, chai_1.expect)(res).to.eql({
                services: [
                    {
                        command: ["sh", "run.sh"],
                        env: {
                            ALLOW_DATABASE_RESET: "true",
                        },
                        name: "tmp",
                    },
                    {
                        command: ["sh", "run.sh"],
                        env: {
                            ALLOW_DATABASE_RESET: "true",
                            ENABLE_TMP: "true",
                        },
                        name: "tmp-admin",
                    },
                ],
            });
        });
    });
});
describe("collectTemplateReferences", () => {
    it("should return and sort all template string references in an object", async () => {
        const obj = {
            foo: "${my.reference}",
            nested: {
                boo: "${moo}",
                foo: "lalalla${moo}${moo}",
                banana: "${banana.rama.llama}",
            },
        };
        (0, chai_1.expect)((0, template_string_1.collectTemplateReferences)(obj)).to.eql([["banana", "rama", "llama"], ["moo"], ["my", "reference"]]);
    });
});
describe("getActionTemplateReferences", () => {
    context("action.*", () => {
        it("returns valid action references", () => {
            const config = {
                build: '${action["build"].build-a}',
                deploy: '${action["deploy"].deploy-a}',
                run: '${action["run"].run-a}',
                test: '${action["test"].test-a}',
            };
            const actionTemplateReferences = (0, template_string_1.getActionTemplateReferences)(config);
            (0, chai_1.expect)(actionTemplateReferences).to.eql([
                {
                    kind: "Build",
                    name: "build-a",
                    fullRef: ["action", "build", "build-a"],
                },
                {
                    kind: "Deploy",
                    name: "deploy-a",
                    fullRef: ["action", "deploy", "deploy-a"],
                },
                {
                    kind: "Run",
                    name: "run-a",
                    fullRef: ["action", "run", "run-a"],
                },
                {
                    kind: "Test",
                    name: "test-a",
                    fullRef: ["action", "test", "test-a"],
                },
            ]);
        });
        it("throws if action ref has no kind", () => {
            const config = {
                foo: "${action}",
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid action reference (missing kind)",
            });
        });
        it("throws if action ref has invalid kind", () => {
            const config = {
                foo: '${action["badkind"].some-name}',
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid action reference (invalid kind 'badkind')",
            });
        });
        it("throws if action kind is not a string", () => {
            const config = {
                foo: "${action[123]}",
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid action reference (kind is not a string)",
            });
        });
        it("throws if action kind is not resolvable", () => {
            const config = {
                foo: "${action[foo.bar].some-name}",
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid action reference (invalid kind '${foo.bar}')",
            });
        });
        it("throws if action ref has no name", () => {
            const config = {
                foo: '${action["build"]}',
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid action reference (missing name)",
            });
        });
        it("throws if action name is not a string", () => {
            const config = {
                foo: '${action["build"].123}',
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid action reference (name is not a string)",
            });
        });
        it("throws if action name is not resolvable", () => {
            throw "TODO";
        });
    });
    context("runtime.*", () => {
        it("returns valid runtime references", () => {
            const config = {
                services: '${runtime["services"].service-a}',
                tasks: '${runtime["tasks"].task-a}',
            };
            const actionTemplateReferences = (0, template_string_1.getActionTemplateReferences)(config);
            (0, chai_1.expect)(actionTemplateReferences).to.eql([
                {
                    kind: "Deploy",
                    name: "service-a",
                    fullRef: ["runtime", "services", "service-a"],
                },
                {
                    kind: "Run",
                    name: "task-a",
                    fullRef: ["runtime", "tasks", "task-a"],
                },
            ]);
        });
        it("throws if runtime ref has no kind", () => {
            const config = {
                foo: "${runtime}",
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid runtime reference (missing kind)",
            });
        });
        it("throws if runtime ref has invalid kind", () => {
            const config = {
                foo: '${runtime["badkind"].some-name}',
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid runtime reference (invalid kind 'badkind')",
            });
        });
        it("throws if runtime kind is not a string", () => {
            const config = {
                foo: "${runtime[123]}",
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid runtime reference (kind is not a string)",
            });
        });
        it("throws if runtime kind is not resolvable", () => {
            const config = {
                foo: "${runtime[foo.bar].some-name}",
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid runtime reference (invalid kind '${foo.bar}')",
            });
        });
        it("throws if runtime ref has no name", () => {
            const config = {
                foo: '${runtime["tasks"]}',
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid runtime reference (missing name)",
            });
        });
        it("throws if runtime ref name is not a string", () => {
            const config = {
                foo: '${runtime["tasks"].123}',
            };
            (0, helpers_1.expectError)(() => (0, template_string_1.getActionTemplateReferences)(config), {
                contains: "Found invalid runtime reference (name is not a string)",
            });
        });
        it("throws if runtime ref name is not resolvable", () => {
            throw "TODO";
        });
    });
});
describe.skip("throwOnMissingSecretKeys", () => {
    it("should not throw an error if no secrets are referenced", () => {
        const configs = [
            {
                name: "foo",
                foo: "${banana.llama}",
                nested: { boo: "${moo}" },
            },
        ];
        (0, template_string_1.throwOnMissingSecretKeys)(configs, {}, "Module");
        (0, template_string_1.throwOnMissingSecretKeys)(configs, { someSecret: "123" }, "Module");
    });
    it("should throw an error if one or more secrets is missing", async () => {
        const configs = [
            {
                name: "moduleA",
                foo: "${secrets.a}",
                nested: { boo: "${secrets.b}" },
            },
            {
                name: "moduleB",
                bar: "${secrets.a}",
                nested: { boo: "${secrets.b}" },
                baz: "${secrets.c}",
            },
        ];
        await (0, helpers_1.expectError)(() => (0, template_string_1.throwOnMissingSecretKeys)(configs, { b: "123" }, "Module"), (err) => {
            (0, chai_1.expect)(err.message).to.match(/Module moduleA: a/);
            (0, chai_1.expect)(err.message).to.match(/Module moduleB: a, c/);
            (0, chai_1.expect)(err.message).to.match(/Secret keys with loaded values: b/);
        });
        await (0, helpers_1.expectError)(() => (0, template_string_1.throwOnMissingSecretKeys)(configs, {}, "Module"), (err) => {
            (0, chai_1.expect)(err.message).to.match(/Module moduleA: a, b/);
            (0, chai_1.expect)(err.message).to.match(/Module moduleB: a, b, c/);
            (0, chai_1.expect)(err.message).to.match(/Note: No secrets have been loaded./);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVtcGxhdGUtc3RyaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLGtGQU1xRDtBQUNyRCxxRUFBMEU7QUFDMUUsMkNBQTJDO0FBQzNDLHFEQUFpRDtBQUVqRCxnREFBZ0Q7QUFFaEQsTUFBTSxXQUFZLFNBQVEsb0JBQWE7SUFDckMsWUFBWSxPQUFPO1FBQ2pCLEtBQUssRUFBRSxDQUFBO1FBQ1AsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDOUIsQ0FBQztDQUNGO0FBRUQsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEtBQUssSUFBSSxFQUFFO0lBQzNDLEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM5RCxNQUFNLEdBQUcsR0FBRyxJQUFBLHVDQUFxQixFQUFDLFlBQVksRUFBRSxJQUFJLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3BFLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUE7SUFDcEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEQsTUFBTSxHQUFHLEdBQUcsSUFBQSx1Q0FBcUIsRUFBQyxhQUFhLEVBQUUsSUFBSSxXQUFXLENBQUMsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzFGLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0NBQStDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDN0QsTUFBTSxHQUFHLEdBQUcsSUFB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O1lBQ3JGLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDN0IsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1lBQ2xELE1BQU0sR0FBRyxHQUFHLElBQUEsdUNBQXFCLEVBQUMscUJBQXFCLEVBQUUsSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzFGLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUIsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMscURBQXFELEVBQUUsR0FBRyxFQUFFO1lBQzdELE1BQU0sR0FBRyxHQUFHLElBQUEsdUNBQXFCLEVBQUMsdUJBQXVCLEVBQUUsSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzVGLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDN0IsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sR0FBRyxHQUFHLElBQUEsdUNBQXFCLEVBQUMsaUJBQWlCLEVBQUUsSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3JGLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUIsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLE1BQU0sR0FBRyxHQUFHLElBQUEsdUNBQXFCLEVBQUMscUJBQXFCLEVBQUUsSUFBSSxXQUFXLENBQUMsRUFB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