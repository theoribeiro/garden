"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const stripAnsi = require("strip-ansi");
const base_1 = require("../../../../../src/config/template-contexts/base");
const helpers_1 = require("../../../../helpers");
const common_1 = require("../../../../../src/config/common");
const template_string_1 = require("../../../../../src/template-string/template-string");
describe("ConfigContext", () => {
    class TestContext extends base_1.ConfigContext {
        constructor(obj, root) {
            super(root);
            this.addValues(obj);
        }
        addValues(obj) {
            Object.assign(this, obj);
        }
    }
    describe("resolve", () => {
        // just a shorthand to aid in testing
        function resolveKey(c, key, opts = {}) {
            return c.resolve({ key, nodePath: [], opts });
        }
        it("should resolve simple keys", async () => {
            const c = new TestContext({ basic: "value" });
            (0, chai_1.expect)(resolveKey(c, ["basic"])).to.eql({ resolved: "value" });
        });
        it("should return undefined for missing key", async () => {
            const c = new TestContext({});
            const { resolved, message } = resolveKey(c, ["basic"]);
            (0, chai_1.expect)(resolved).to.be.undefined;
            (0, chai_1.expect)(stripAnsi(message)).to.equal("Could not find key basic.");
        });
        context("allowPartial=true", () => {
            it("should throw on missing key when allowPartial=true", async () => {
                const c = new TestContext({});
                (0, helpers_1.expectError)(() => resolveKey(c, ["basic"], { allowPartial: true }), {
                    contains: "Could not find key basic.",
                });
            });
            it("should throw on missing key on nested context", async () => {
                const c = new TestContext({
                    nested: new TestContext({ key: "value" }),
                });
                (0, helpers_1.expectError)(() => resolveKey(c, ["nested", "bla"], { allowPartial: true }), {
                    contains: "Could not find key bla under nested. Available keys: key.",
                });
            });
        });
        it("should throw when looking for nested value on primitive", async () => {
            const c = new TestContext({ basic: "value" });
            (0, helpers_1.expectError)(() => resolveKey(c, ["basic", "nested"]), "configuration");
        });
        it("should resolve nested keys", async () => {
            const c = new TestContext({ nested: { key: "value" } });
            (0, chai_1.expect)(resolveKey(c, ["nested", "key"])).eql({ resolved: "value" });
        });
        it("should resolve keys on nested contexts", async () => {
            const c = new TestContext({
                nested: new TestContext({ key: "value" }),
            });
            (0, chai_1.expect)(resolveKey(c, ["nested", "key"])).eql({ resolved: "value" });
        });
        it("should return undefined for missing keys on nested context", async () => {
            const c = new TestContext({
                nested: new TestContext({ key: "value" }),
            });
            const { resolved, message } = resolveKey(c, ["basic", "bla"]);
            (0, chai_1.expect)(resolved).to.be.undefined;
            (0, chai_1.expect)(stripAnsi(message)).to.equal("Could not find key basic. Available keys: nested.");
        });
        it("should resolve keys with value behind callable", async () => {
            const c = new TestContext({ basic: () => "value" });
            (0, chai_1.expect)(resolveKey(c, ["basic"])).to.eql({ resolved: "value" });
        });
        it("should resolve keys on nested contexts where context is behind callable", async () => {
            const c = new TestContext({
                nested: () => new TestContext({ key: "value" }),
            });
            (0, chai_1.expect)(resolveKey(c, ["nested", "key"])).to.eql({ resolved: "value" });
        });
        it("should cache resolved values", async () => {
            const nested = new TestContext({ key: "value" });
            const c = new TestContext({
                nested,
            });
            resolveKey(c, ["nested", "key"]);
            nested.key = "foo";
            (0, chai_1.expect)(resolveKey(c, ["nested", "key"])).to.eql({ resolved: "value" });
        });
        it("should throw if resolving a key that's already in the lookup stack", async () => {
            const c = new TestContext({
                nested: new TestContext({ key: "value" }),
            });
            const key = ["nested", "key"];
            const stack = [key.join(".")];
            (0, helpers_1.expectError)(() => c.resolve({ key, nodePath: [], opts: { stack } }), "configuration");
        });
        it("should detect a circular reference from a nested context", async () => {
            class NestedContext extends base_1.ConfigContext {
                resolve({ key, nodePath, opts }) {
                    const circularKey = nodePath.concat(key);
                    opts.stack.push(circularKey.join("."));
                    return c.resolve({ key: circularKey, nodePath: [], opts });
                }
            }
            const c = new TestContext({
                nested: new NestedContext(),
            });
            (0, helpers_1.expectError)(() => resolveKey(c, ["nested", "bla"]), "configuration");
        });
        it("should return helpful message when unable to resolve nested key in map", async () => {
            class Context extends base_1.ConfigContext {
                constructor(parent) {
                    super(parent);
                    this.nested = new Map();
                }
            }
            const c = new Context();
            const { message } = resolveKey(c, ["nested", "bla"]);
            (0, chai_1.expect)(stripAnsi(message)).to.equal("Could not find key bla under nested.");
        });
        it("should show helpful error when unable to resolve nested key in object", async () => {
            class Context extends base_1.ConfigContext {
                constructor(parent) {
                    super(parent);
                    this.nested = {};
                }
            }
            const c = new Context();
            const { message } = resolveKey(c, ["nested", "bla"]);
            (0, chai_1.expect)(stripAnsi(message)).to.equal("Could not find key bla under nested.");
        });
        it("should show helpful error when unable to resolve two-level nested key in object", async () => {
            class Context extends base_1.ConfigContext {
                constructor(parent) {
                    super(parent);
                    this.nested = { deeper: {} };
                }
            }
            const c = new Context();
            const { message } = resolveKey(c, ["nested", "deeper", "bla"]);
            (0, chai_1.expect)(stripAnsi(message)).to.equal("Could not find key bla under nested.deeper.");
        });
        it("should show helpful error when unable to resolve in nested context", async () => {
            class Nested extends base_1.ConfigContext {
            }
            class Context extends base_1.ConfigContext {
                constructor(parent) {
                    super(parent);
                    this.nested = new Nested(this);
                }
            }
            const c = new Context();
            const { message } = resolveKey(c, ["nested", "bla"]);
            (0, chai_1.expect)(stripAnsi(message)).to.equal("Could not find key bla under nested.");
        });
        it("should resolve template strings", async () => {
            const c = new TestContext({
                foo: "value",
            });
            const nested = new TestContext({ key: "${foo}" }, c);
            c.addValues({ nested });
            (0, chai_1.expect)(resolveKey(c, ["nested", "key"])).to.eql({ resolved: "value" });
        });
        it("should resolve template strings with nested context", async () => {
            const c = new TestContext({
                foo: "bar",
            });
            const nested = new TestContext({ key: "${nested.foo}", foo: "value" }, c);
            c.addValues({ nested });
            (0, chai_1.expect)(resolveKey(c, ["nested", "key"])).to.eql({ resolved: "value" });
        });
        it("should detect a self-reference when resolving a template string", async () => {
            const c = new TestContext({ key: "${key}" });
            (0, helpers_1.expectError)(() => resolveKey(c, ["key"]), "template-string");
        });
        it("should detect a nested self-reference when resolving a template string", async () => {
            const c = new TestContext({
                foo: "bar",
            });
            const nested = new TestContext({ key: "${nested.key}" }, c);
            c.addValues({ nested });
            (0, helpers_1.expectError)(() => resolveKey(c, ["nested", "key"]), "template-string");
        });
        it("should detect a circular reference when resolving a template string", async () => {
            const c = new TestContext({
                foo: "bar",
            });
            const nested = new TestContext({ key: "${nested.foo}", foo: "${nested.key}" }, c);
            c.addValues({ nested });
            (0, helpers_1.expectError)(() => resolveKey(c, ["nested", "key"]), "template-string");
        });
        it("should detect a circular reference when resolving a nested template string", async () => {
            const c = new TestContext({
                foo: "bar",
            });
            const nested = new TestContext({ key: "${nested.foo}", foo: "${'${nested.key}'}" }, c);
            c.addValues({ nested });
            (0, helpers_1.expectError)(() => resolveKey(c, ["nested", "key"]), "template-string");
        });
        it("should detect a circular reference when nested template string resolves to self", async () => {
            const c = new TestContext({
                foo: "bar",
            });
            const nested = new TestContext({ key: "${'${nested.key}'}" }, c);
            c.addValues({ nested });
            (0, helpers_1.expectError)(() => resolveKey(c, ["nested", "key"]), {
                contains: "Invalid template string (${'${nested.key}'}): Invalid template string (${nested.key}): Circular reference detected when resolving key nested.key (nested -> nested.key)",
            });
        });
    });
    describe("getSchema", () => {
        it("should return a Joi object schema with all described attributes", () => {
            class Nested extends base_1.ConfigContext {
            }
            __decorate([
                (0, base_1.schema)(common_1.joi.string().description("Nested description")),
                __metadata("design:type", String)
            ], Nested.prototype, "nestedKey", void 0);
            class Context extends base_1.ConfigContext {
                constructor() {
                    super(...arguments);
                    // this should simply be ignored
                    this.foo = "bar";
                }
            }
            __decorate([
                (0, base_1.schema)(common_1.joi.string().description("Some description")),
                __metadata("design:type", String)
            ], Context.prototype, "key", void 0);
            __decorate([
                (0, base_1.schema)(Nested.getSchema().description("A nested context")),
                __metadata("design:type", Nested
                // this should simply be ignored
                )
            ], Context.prototype, "nested", void 0);
            const contextSchema = Context.getSchema();
            const description = contextSchema.describe();
            (0, chai_1.expect)(description).to.eql({
                type: "object",
                flags: { presence: "required" },
                keys: {
                    key: { type: "string", flags: { description: "Some description" } },
                    nested: {
                        type: "object",
                        flags: { presence: "required", description: "A nested context" },
                        keys: { nestedKey: { type: "string", flags: { description: "Nested description" } } },
                    },
                },
            });
        });
    });
});
describe("ScanContext", () => {
    it("should collect found keys in an object", () => {
        const context = new base_1.ScanContext();
        const obj = {
            a: "some ${templated.string}",
            b: "${more.stuff}",
        };
        (0, template_string_1.resolveTemplateStrings)(obj, context);
        (0, chai_1.expect)(context.foundKeys.entries()).to.eql([
            ["templated", "string"],
            ["more", "stuff"],
        ]);
    });
    it("should handle keys with dots correctly", () => {
        const context = new base_1.ScanContext();
        const obj = {
            a: "some ${templated['key.with.dots']}",
            b: "${more.stuff}",
        };
        (0, template_string_1.resolveTemplateStrings)(obj, context);
        (0, chai_1.expect)(context.foundKeys.entries()).to.eql([
            ["templated", "key.with.dots"],
            ["more", "stuff"],
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7QUFFSCwrQkFBNkI7QUFDN0Isd0NBQXdDO0FBQ3hDLDJFQU15RDtBQUN6RCxpREFBaUQ7QUFDakQsNkRBQXNEO0FBQ3RELHdGQUEyRjtBQVMzRixRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUM3QixNQUFNLFdBQVksU0FBUSxvQkFBYTtRQUNyQyxZQUFZLEdBQWUsRUFBRSxJQUFvQjtZQUMvQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ3JCLENBQUM7UUFFRCxTQUFTLENBQUMsR0FBZTtZQUN2QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUMxQixDQUFDO0tBQ0Y7SUFFRCxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUN2QixxQ0FBcUM7UUFDckMsU0FBUyxVQUFVLENBQUMsQ0FBZ0IsRUFBRSxHQUFlLEVBQUUsSUFBSSxHQUFHLEVBQUU7WUFDOUQsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUMvQyxDQUFDO1FBRUQsRUFBRSxDQUFDLDRCQUE0QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFDLE1BQU0sQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7WUFDN0MsSUFBQSxhQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEUs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