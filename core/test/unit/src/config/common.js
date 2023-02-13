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
const common_1 = require("../../../../src/config/common");
const validation_1 = require("../../../../src/config/validation");
const helpers_1 = require("../../../helpers");
describe("joiSparseArray", () => {
    it("should filter out undefined values", () => {
        const schema = (0, common_1.joiSparseArray)(common_1.joi.string()).sparse();
        const { value } = schema.validate(["foo", undefined, "bar"]);
        (0, chai_1.expect)(value).to.eql(["foo", "bar"]);
    });
    it("should filter out null values", () => {
        const schema = (0, common_1.joiSparseArray)(common_1.joi.string()).sparse();
        const { value } = schema.validate(["foo", undefined, "bar", null, "baz"]);
        (0, chai_1.expect)(value).to.eql(["foo", "bar", "baz"]);
    });
});
describe("envVarRegex", () => {
    it("should fail on invalid env variables", () => {
        const testCases = ["GARDEN", "garden", "GARDEN_ENV_VAR", "garden_", "123", ".", "MY-ENV_VAR"];
        for (const tc of testCases) {
            const result = common_1.envVarRegex.test(tc);
            (0, chai_1.expect)(result, tc).to.be.false;
        }
    });
    it("should pass on valid env variables", () => {
        const testCases = [
            "GAR",
            "_test_",
            "MY_ENV_VAR",
            "A_123",
            "_2134",
            "a_b_c",
            "A_B_C_",
            "some.var", // This is not strictly valid POSIX, but a bunch of Java services use this style
        ];
        for (const tc of testCases) {
            const result = common_1.envVarRegex.test(tc);
            (0, chai_1.expect)(result, tc).to.be.true;
        }
    });
});
const validIdentifiers = {
    "myname": "a valid identifier",
    "my-name": "a valid identifier with a dash",
    "my9-9name": "numbers in the middle of a string",
    "o12345670123456701234567012345670123456701234567012345670123456": "a 63 char identifier",
    "a": "a single char identifier",
};
const invalidIdentifiers = {
    "01010": "string with only numbers",
    "-abc": "starting with a dash",
    "abc-": "ending with a dash",
    "": "an empty string",
    "o123456701234567012345670123456701234567012345670123456701234567": "a 64 char identifier",
    "UPPER": "an uppercase string",
    "upPer": "a partially uppercase string",
};
describe("identifierRegex", () => {
    for (const [value, description] of Object.entries(validIdentifiers)) {
        it("should allow " + description, () => {
            (0, chai_1.expect)(common_1.identifierRegex.test(value)).to.be.true;
        });
    }
    for (const [value, description] of Object.entries(invalidIdentifiers)) {
        it("should disallow " + description, () => {
            (0, chai_1.expect)(common_1.identifierRegex.test(value)).to.be.false;
        });
    }
    it("should allow consecutive dashes", () => {
        (0, chai_1.expect)(common_1.identifierRegex.test("my--name")).to.be.true;
    });
    it("should allow starting with a number", () => {
        (0, chai_1.expect)(common_1.identifierRegex.test("9name")).to.be.true;
    });
    it("should allow strings starting with 'garden'", () => {
        (0, chai_1.expect)(common_1.identifierRegex.test("garden-party")).to.be.true;
    });
});
describe("userIdentifierRegex", () => {
    for (const [value, description] of Object.entries(validIdentifiers)) {
        it("should allow " + description, () => {
            (0, chai_1.expect)(common_1.userIdentifierRegex.test(value)).to.be.true;
        });
    }
    for (const [value, description] of Object.entries(invalidIdentifiers)) {
        it("should disallow " + description, () => {
            (0, chai_1.expect)(common_1.userIdentifierRegex.test(value)).to.be.false;
        });
    }
    it("should allow consecutive dashes", () => {
        (0, chai_1.expect)(common_1.userIdentifierRegex.test("my--name")).to.be.false;
    });
    it("should disallow starting with a number", () => {
        (0, chai_1.expect)(common_1.userIdentifierRegex.test("9name")).to.be.false;
    });
    it("should allow strings starting with 'garden'", () => {
        (0, chai_1.expect)(common_1.userIdentifierRegex.test("garden-party")).to.be.false;
    });
});
describe("validate", () => {
    it("should validate an object against a joi schema", () => {
        const obj = {
            my: "object",
        };
        (0, validation_1.validateSchema)(obj, common_1.joi.object().keys({ my: common_1.joi.string() }));
    });
    it("should throw a nice error when keys are missing", async () => {
        const obj = { B: {} };
        const schema = common_1.joi.object().keys({
            A: common_1.joi.string().required(),
            B: common_1.joi
                .object()
                .keys({
                b: common_1.joi.string().required(),
            })
                .required(),
        });
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(obj, schema), {
            contains: "key .A is required, key .B.b is required",
            errorMessageGetter: (err) => err.detail.errorDescription,
        });
    });
    it("should throw a nice error when keys are wrong in a pattern object", async () => {
        const obj = { A: { B: { c: {} } } };
        const schema = common_1.joi.object().keys({
            A: common_1.joi
                .object()
                .keys({
                B: common_1.joi
                    .object()
                    .pattern(/.+/, common_1.joi.object().keys({
                    C: common_1.joi.string().required(),
                }))
                    .required(),
            })
                .required(),
        });
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(obj, schema), {
            contains: "key .A.B[c].C is required",
            errorMessageGetter: (err) => err.detail.errorDescription,
        });
    });
    it("should throw a nice error when key is invalid", async () => {
        const obj = { 123: "abc" };
        const schema = common_1.joi
            .object()
            .pattern(/[a-z]+/, common_1.joi.string())
            .unknown(false);
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(obj, schema), {
            contains: 'key "123" is not allowed at path .',
            errorMessageGetter: (err) => err.detail.errorDescription,
        });
    });
    it("should throw a nice error when nested key is invalid", async () => {
        const obj = { a: { 123: "abc" } };
        const schema = common_1.joi.object().keys({ a: common_1.joi.object().pattern(/[a-z]+/, common_1.joi.string()) });
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(obj, schema), {
            contains: 'key "123" is not allowed at path .a',
            errorMessageGetter: (err) => err.detail.errorDescription,
        });
    });
    it("should throw a nice error when xor rule fails", async () => {
        const obj = { a: 1, b: 2 };
        const schema = common_1.joi
            .object()
            .keys({
            a: common_1.joi.number(),
            b: common_1.joi.number(),
        })
            .xor("a", "b");
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(obj, schema), {
            contains: "object at . can only contain one of [a, b]",
            errorMessageGetter: (err) => err.detail.errorDescription,
        });
    });
});
describe("joi.posixPath", () => {
    it("should validate a POSIX-style path", () => {
        const path = "/foo/bar.js";
        const schema = common_1.joi.posixPath();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should return error with a Windows-style path", () => {
        const path = "C:\\Something\\Blorg";
        const schema = common_1.joi.posixPath();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should respect absoluteOnly parameter", () => {
        const path = "foo/bar.js";
        const schema = common_1.joi.posixPath().absoluteOnly();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should respect relativeOnly parameter", () => {
        const path = "/foo/bar.js";
        const schema = common_1.joi.posixPath().relativeOnly();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should respect subPathOnly parameter by rejecting absolute paths", () => {
        const path = "/foo/bar.js";
        const schema = common_1.joi.posixPath().subPathOnly();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should respect subPathOnly parameter by rejecting paths with '..' segments", () => {
        const path = "foo/../../bar";
        const schema = common_1.joi.posixPath().subPathOnly();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should allow paths with '..' segments when subPathOnly=false", () => {
        const path = "foo/../../bar";
        const schema = common_1.joi.posixPath();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should respect filenameOnly parameter", () => {
        const path = "foo/bar.js";
        const schema = common_1.joi.posixPath().filenameOnly();
        const result = schema.validate(path);
        (0, chai_1.expect)(result.error).to.exist;
    });
});
describe("joi.hostname", () => {
    const schema = common_1.joi.hostname();
    it("should accept valid hostnames", () => {
        const result = schema.validate("foo.bar.bas");
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept hostnames with a wildcard in the first DNS label", () => {
        const result = schema.validate("*.bar.bas");
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should reject hostnames with wildcard DNS labels that are not the first label", () => {
        const result = schema.validate("foo.*.bas");
        (0, chai_1.expect)(result.error).to.exist;
        (0, chai_1.expect)(result.error.message).to.eql(`"value" only first DNS label may contain a wildcard.`);
    });
});
describe("joi.environment", () => {
    const schema = common_1.joi.environment();
    it("should accept a basic alphanumeric string", () => {
        const result = schema.validate("foo");
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept a string with a dash", () => {
        const result = schema.validate("foo-bar");
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept an env with a namespace", () => {
        const result = schema.validate("foo.bar");
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should reject an env with multiple dots", () => {
        const result = schema.validate("foo.bar.baz");
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should reject an env invalid characters", () => {
        const result = schema.validate("$.%");
        (0, chai_1.expect)(result.error).to.exist;
    });
});
describe("joiRepositoryUrl", () => {
    it("should accept a git:// URL", () => {
        const url = "git://github.com/garden-io/garden-example-remote-sources-web-services.git#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept a git:// URL not ending in .git", () => {
        const url = "git://github.com/garden-io/garden-example-remote-sources-web-services#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept an HTTPS Git URL", () => {
        const url = "https://github.com/garden-io/garden-example-remote-sources-web-services.git#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept an scp-like SSH GitHub URL", () => {
        const url = "git@github.com:garden-io/garden-example-remote-sources-web-services.git#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept an ssh:// GitHub URL", () => {
        const url = "ssh://git@github.com/garden-io/garden-example-remote-sources-web-services.git#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept a git+https// URL", () => {
        const url = "git+https://git@github.com:garden-io/garden-example-remote-sources-web-services.git#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept a git+ssh// URL", () => {
        const url = "git+ssh://git@github.com:garden-io/garden-example-remote-sources-web-services.git#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should accept a local file:// URL", () => {
        const url = "file:///some/dir";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("should reject non-string values", () => {
        const url = 123;
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should reject values missing a schema", () => {
        const url = "garden-io/garden-example-remote-sources-web-services.git#my-tag";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.exist;
    });
    it("should require a branch/tag name", () => {
        const url = "https://github.com/garden-io/garden-example-remote-sources-web-services.git";
        const schema = (0, common_1.joiRepositoryUrl)();
        const result = schema.validate(url);
        (0, chai_1.expect)(result.error).to.exist;
    });
});
describe("joiPrimitive", () => {
    it("should validate primitives without casting values", () => {
        const schema = (0, common_1.joiPrimitive)();
        const resStrNum = schema.validate("12345");
        const resStrBool = schema.validate("true");
        const resNum = schema.validate(12345);
        const resBool = schema.validate(true);
        const resArr = schema.validate([1, 2, 3, 4, 5]);
        const resObj = schema.validate({ hello: "world" });
        const resFun = schema.validate(() => { });
        (0, chai_1.expect)(resStrNum.value).to.equal("12345");
        (0, chai_1.expect)(resStrBool.value).to.equal("true");
        (0, chai_1.expect)(resNum.value).to.equal(12345);
        (0, chai_1.expect)(resBool.value).to.equal(true);
        (0, chai_1.expect)(resArr.error).to.exist;
        (0, chai_1.expect)(resObj.error).to.exist;
        (0, chai_1.expect)(resFun.error).to.exist;
    });
});
describe("joi.customObject", () => {
    const jsonSchema = {
        type: "object",
        properties: {
            stringProperty: { type: "string" },
            numberProperty: { type: "integer", default: 999 },
        },
        additionalProperties: false,
        required: ["stringProperty"],
    };
    it("should validate an object with a JSON Schema", () => {
        const joiSchema = common_1.joi.object().jsonSchema(jsonSchema);
        const value = { stringProperty: "foo", numberProperty: 123 };
        const result = (0, validation_1.validateSchema)(value, joiSchema);
        (0, chai_1.expect)(result).to.eql({ stringProperty: "foo", numberProperty: 123 });
    });
    it("should apply default values based on the JSON Schema", () => {
        const joiSchema = common_1.joi.object().jsonSchema(jsonSchema);
        const result = (0, validation_1.validateSchema)({ stringProperty: "foo" }, joiSchema);
        (0, chai_1.expect)(result).to.eql({ stringProperty: "foo", numberProperty: 999 });
    });
    it("should give validation error if object doesn't match specified JSON Schema", async () => {
        const joiSchema = common_1.joi.object().jsonSchema(jsonSchema);
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)({ numberProperty: "oops", blarg: "blorg" }, joiSchema), {
            contains: "Validation error: value at . must have required property 'stringProperty', value at . must NOT have additional properties, value at ./numberProperty must be integer",
        });
    });
    it("should throw if schema with wrong type is passed to .jsonSchema()", async () => {
        await (0, helpers_1.expectError)(() => common_1.joi.object().jsonSchema({ type: "number" }), {
            contains: "jsonSchema must be a valid JSON Schema with type=object or reference",
        });
    });
    it("should throw if invalid schema is passed to .jsonSchema()", async () => {
        await (0, helpers_1.expectError)(() => common_1.joi.object().jsonSchema({ type: "banana", blorg: "blarg" }), {
            contains: "jsonSchema must be a valid JSON Schema with type=object or reference",
        });
    });
});
describe("validateSchema", () => {
    it("should format a basic object validation error", async () => {
        const schema = common_1.joi.object().keys({ foo: common_1.joi.string() });
        const value = { foo: 123 };
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(value, schema), {
            contains: "Validation error: key .foo must be a string",
        });
    });
    it("should format a nested object validation error", async () => {
        const schema = common_1.joi.object().keys({ foo: common_1.joi.object().keys({ bar: common_1.joi.string() }) });
        const value = { foo: { bar: 123 } };
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(value, schema), {
            contains: "Validation error: key .foo.bar must be a string",
        });
    });
    it("should format a nested pattern object validation error", async () => {
        const schema = common_1.joi.object().keys({ foo: common_1.joi.object().pattern(/.+/, common_1.joi.string()) });
        const value = { foo: { bar: 123 } };
        await (0, helpers_1.expectError)(() => (0, validation_1.validateSchema)(value, schema), {
            contains: "Validation error: key .foo[bar] must be a string",
        });
    });
});
describe("allowUnknown", () => {
    it("allows unknown fields on an object schema", () => {
        const schema = common_1.joi.object().keys({ key: common_1.joi.number() }).unknown(false);
        const result = (0, common_1.allowUnknown)(schema).validate({ foo: 123 });
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("works with empty objects schemas", () => {
        const schema = common_1.joi.object().unknown(false);
        const result = (0, common_1.allowUnknown)(schema).validate({ foo: 123 });
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("works with empty array schemas", () => {
        const schema = common_1.joi.array();
        const result = (0, common_1.allowUnknown)(schema).validate([{ foo: 123 }]);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("allows unknown fields on nested object schemas on an object schema", () => {
        const schema = common_1.joi
            .object()
            .keys({ nested: common_1.joi.object().keys({ key: common_1.joi.number() }).unknown(false) })
            .unknown(false);
        const result = (0, common_1.allowUnknown)(schema).validate({ nested: { foo: 123 } });
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
    it("allows unknown fields on object schemas in an array schema", () => {
        const schema = common_1.joi.array().items(common_1.joi.object().keys({ key: common_1.joi.number() }).unknown(false));
        const loose = (0, common_1.allowUnknown)(schema);
        const result = loose.validate([{ foo: 123 }]);
        (0, chai_1.expect)(result.error).to.be.undefined;
    });
});
describe("createSchema", () => {
    afterEach(() => {
        (0, common_1.removeSchema)("foo");
        (0, common_1.removeSchema)("bar");
    });
    it("creates an object schema and sets its name", () => {
        const schema = (0, common_1.createSchema)({
            name: "foo",
            keys: {
                foo: common_1.joi.boolean(),
            },
        });
        // This will only work with a schema
        const metadata = (0, common_1.metadataFromDescription)(schema().describe());
        (0, chai_1.expect)(metadata).to.eql({
            name: "foo",
        });
    });
    it("throws if a schema name is used twice", () => {
        (0, common_1.createSchema)({
            name: "foo",
            keys: {
                foo: common_1.joi.boolean(),
            },
        });
        return (0, helpers_1.expectError)(() => (0, common_1.createSchema)({
            name: "foo",
            keys: {
                foo: common_1.joi.boolean(),
            },
        }), { contains: "Object schema foo defined multiple times" });
    });
    it("applies metadata to schemas", () => {
        const schema = (0, common_1.createSchema)({
            name: "foo",
            keys: {
                foo: common_1.joi.boolean(),
            },
            meta: {
                internal: true,
            },
        });
        const metadata = (0, common_1.metadataFromDescription)(schema().describe());
        (0, chai_1.expect)(metadata).to.eql({
            name: "foo",
            internal: true,
        });
    });
    it("extends another schema", () => {
        const base = (0, common_1.createSchema)({
            name: "foo",
            keys: {
                foo: common_1.joi.boolean(),
            },
        });
        const schema = (0, common_1.createSchema)({
            name: "bar",
            keys: {
                bar: common_1.joi.string(),
            },
            extend: base,
        });
        (0, validation_1.validateSchema)({ foo: true, bar: "baz" }, schema());
    });
    it("caches the created schema", () => {
        const f = (0, common_1.createSchema)({
            name: "bar",
            keys: {
                bar: common_1.joi.string(),
            },
        });
        const a = f();
        const b = f();
        (0, chai_1.expect)(a).to.equal(b);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBRTdCLDBEQVlzQztBQUN0QyxrRUFBa0U7QUFDbEUsOENBQThDO0FBRTlDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7SUFDOUIsRUFBRSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtRQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFBLHVCQUFjLEVBQUMsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDcEQsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDNUQsSUFBQSxhQUFNLEVBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFBLHVCQUFjLEVBQUMsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDcEQsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQTtRQUN6RSxJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFBO0lBQzdDLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUMzQixFQUFFLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1FBQzlDLE1BQU0sU0FBUyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQTtRQUM3RixLQUFLLE1BQU0sRUFBRSxJQUFJLFNBQVMsRUFBRTtZQUMxQixNQUFNLE1BQU0sR0FBRyxvQkFBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNuQyxJQUFBLGFBQU0sRUFBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7U0FDL0I7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsTUFBTSxTQUFTLEdBQUc7WUFDaEIsS0FBSztZQUNMLFFBQVE7WUFDUixZQUFZO1lBQ1osT0FBTztZQUNQLE9BQU87WUFDUCxPQUFPO1lBQ1AsUUFBUTtZQUNSLFVBQVUsRUFBRSxnRkFBZ0Y7U0FDN0YsQ0FBQTtRQUNELEtBQUssTUFBTSxFQUFFLElBQUksU0FBUyxFQUFFO1lBQzFCLE1BQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ25DLElBQUEsYUFBTSxFQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtTQUM5QjtJQUNILENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixNQUFNLGdCQUFnQixHQUFHO0lBQ3ZCLFFBQVEsRUFBRSxvQkFBb0I7SUFDOUIsU0FBUyxFQUFFLGdDQUFnQztJQUMzQyxXQUFXLEVBQUUsbUNBQW1DO0lBQ2hELGlFQUFpRSxFQUFFLHNCQUFzQjtJQUN6RixHQUFHLEVBQUUsMEJBQTBCO0NBQ2hDLENBQUE7QUFFRCxNQUFNLGtCQUFrQixHQUFHO0lBQ3pCLE9BQU8sRUFBRSwwQkFBMEI7SUFDbkMsTUFBTSxFQUFFLHNCQUFzQjtJQUM5QixNQUFNLEVBQUUsb0JBQW9CO0lBQzVCLEVBQUUsRUFBRSxpQkFBaUI7SUFDckIsa0VBQWtFLEVBQUUsc0JBQXNCO0lBQzFGLE9BQU8sRUFBRSxxQkFBcUI7SUFDOUIsT0FBTyxFQUFFLDhCQUE4QjtDQUN4QyxDQUFBO0FBRUQsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtJQUMvQixLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO1FBQ25FLEVBQUUsQ0FBQyxlQUFlLEdBQUcsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUNyQyxJQUFBLGFBQU0sRUFBQyx3QkFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFBO1FBQ2hELENBQUMsQ0FBQyxDQUFBO0tBQ0g7SUFFRCxLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1FBQ3JFLEVBQUUsQ0FBQyxrQkFBa0IsR0FBRyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLElBQUEsYUFBTSxFQUFDLHdCQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7UUFDakQsQ0FBQyxDQUFDLENBQUE7S0FDSDtJQUVELEVBQUUsQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7UUFDekMsSUFBQSxhQUFNLEVBQUMsd0JBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtJQUNyRCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFDN0MsSUFBQSxhQUFNLEVBQUMsd0JBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtJQUNsRCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLEVBQUU7UUFDckQsSUFBQSxhQUFNLEVBQUMsd0JBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtJQUN6RCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBO0FBRUYsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtJQUNuQyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO1FBQ25FLEVBQUUsQ0FBQyxlQUFlLEdBQUcsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUNyQyxJQUFBLGFBQU0sRUFBQyw0QkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQTtRQUNwRCxDQUFDLENBQUMsQ0FBQTtLQUNIO0lBRUQsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsRUFBRTtRQUNyRSxFQUFFLENBQUMsa0JBQWtCLEdBQUcsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUN4QyxJQUFBLGFBQU0sRUFBQyw0QkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtRQUNyRCxDQUFDLENBQUMsQ0FBQTtLQUNIO0lBRUQsRUFBRSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtRQUN6QyxJQUFBLGFBQU0sRUFBQyw0QkFBbUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtJQUMxRCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7UUFDaEQsSUFBQSxhQUFNLEVBQUMsNEJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7SUFDdkQsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1FBQ3JELElBQUEsYUFBTSxFQUFDLDRCQUFtQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO0lBQzlELENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixFQUFFLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1FBQ3hELE1BQU0sR0FBRyxHQUFHO1lBQ1YsRUFBRSxFQUFFLFFBQVE7U0FDYixDQUFBO1FBRUQsSUFBQSwyQkFBYyxFQUFDLEdBQUcsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUM5RCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMvRCxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQTtRQUNyQixNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQy9CLENBQUMsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO1lBQzFCLENBQUMsRUFBRSxZQUFHO2lCQUNILE1BQU0sRUFBRTtpQkFDUixJQUFJLENBQUM7Z0JBQ0osQ0FBQyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7YUFDM0IsQ0FBQztpQkFDRCxRQUFRLEVBQUU7U0FDZCxDQUFDLENBQUE7UUFFRixNQUFNLElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDJCQUFjLEVBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25ELFFBQVEsRUFBRSwwQ0FBMEM7WUFDcEQsa0JBQWtCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCO1NBQ3pELENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLG1FQUFtRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2pGLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQTtRQUNuQyxNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQy9CLENBQUMsRUFBRSxZQUFHO2lCQUNILE1BQU0sRUFBRTtpQkFDUixJQUFJLENBQUM7Z0JBQ0osQ0FBQyxFQUFFLFlBQUc7cUJBQ0gsTUFBTSxFQUFFO3FCQUNSLE9BQU8sQ0FDTixJQUFJLEVBQ0osWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQztvQkFDaEIsQ0FBQyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7aUJBQzNCLENBQUMsQ0FDSDtxQkFDQSxRQUFRLEVBQUU7YUFDZCxDQUFDO2lCQUNELFFBQVEsRUFBRTtTQUNkLENBQUMsQ0FBQTtRQUVGLE1BQU0sSUFBQSxxQkFBVyxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsMkJBQWMsRUFBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkQsUUFBUSxFQUFFLDJCQUEyQjtZQUNyQyxrQkFBa0IsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7U0FDekQsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0NBQStDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDN0QsTUFBTSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUE7UUFDMUIsTUFBTSxNQUFNLEdBQUcsWUFBRzthQUNmLE1BQU0sRUFBRTthQUNSLE9BQU8sQ0FBQyxRQUFRLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUVqQixNQUFNLElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDJCQUFjLEVBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25ELFFBQVEsRUFBRSxvQ0FBb0M7WUFDOUMsa0JBQWtCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCO1NBQ3pELENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3BFLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUE7UUFDakMsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFckYsTUFBTSxJQUFBLHFCQUFXLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSwyQkFBYyxFQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuRCxRQUFRLEVBQUUscUNBQXFDO1lBQy9DLGtCQUFrQixFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGdCQUFnQjtTQUN6RCxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3RCxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFBO1FBQzFCLE1BQU0sTUFBTSxHQUFHLFlBQUc7YUFDZixNQUFNLEVBQUU7YUFDUixJQUFJLENBQUM7WUFDSixDQUFDLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTtZQUNmLENBQUMsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFO1NBQ2hCLENBQUM7YUFDRCxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBRWhCLE1BQU0sSUFBQSxxQkFBVyxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsMkJBQWMsRUFBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkQsUUFBUSxFQUFFLDRDQUE0QztZQUN0RCxrQkFBa0IsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7U0FDekQsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQTtBQUVGLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO0lBQzdCLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFBO1FBQzFCLE1BQU0sTUFBTSxHQUFHLFlBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7UUFDdkQsTUFBTSxJQUFJLEdBQUcsc0JBQXNCLENBQUE7UUFDbkMsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBQzlCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDcEMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1FBQy9DLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQTtRQUN6QixNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUE7UUFDN0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNwQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFBO1FBQzFCLE1BQU0sTUFBTSxHQUFHLFlBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUM3QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO0lBQy9CLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGtFQUFrRSxFQUFFLEdBQUcsRUFBRTtRQUMxRSxNQUFNLElBQUksR0FBRyxhQUFhLENBQUE7UUFDMUIsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzVDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDcEMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsNEVBQTRFLEVBQUUsR0FBRyxFQUFFO1FBQ3BGLE1BQU0sSUFBSSxHQUFHLGVBQWUsQ0FBQTtRQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNwQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxHQUFHLEVBQUU7UUFDdEUsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFBO1FBQzVCLE1BQU0sTUFBTSxHQUFHLFlBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFBO1FBQ3pCLE1BQU0sTUFBTSxHQUFHLFlBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUM3QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO0lBQy9CLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsUUFBUSxFQUFFLENBQUE7SUFFN0IsRUFBRSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBQzdDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUNGLEVBQUUsQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7UUFDeEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUMzQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7SUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFDRixFQUFFLENBQUMsK0VBQStFLEVBQUUsR0FBRyxFQUFFO1FBQ3ZGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDM0MsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7UUFDN0IsSUFBQSxhQUFNLEVBQUMsTUFBTyxDQUFDLEtBQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLHNEQUFzRCxDQUFDLENBQUE7SUFDL0YsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQTtBQUVGLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBRWhDLEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7UUFDbkQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNyQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7SUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO1FBQzVDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDekMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQ3pDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7UUFDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUM3QyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7UUFDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNyQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBO0FBRUYsUUFBUSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtJQUNoQyxFQUFFLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1FBQ3BDLE1BQU0sR0FBRyxHQUFHLGtGQUFrRixDQUFBO1FBQzlGLE1BQU0sTUFBTSxHQUFHLElBQUEseUJBQWdCLEdBQUUsQ0FBQTtRQUNqQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ25DLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7UUFDdkQsTUFBTSxHQUFHLEdBQUcsOEVBQThFLENBQUE7UUFDMUYsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBZ0IsR0FBRSxDQUFBO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUN4QyxNQUFNLEdBQUcsR0FBRyxvRkFBb0YsQ0FBQTtRQUNoRyxNQUFNLE1BQU0sR0FBRyxJQUFBLHlCQUFnQixHQUFFLENBQUE7UUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNuQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7SUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1FBQ2xELE1BQU0sR0FBRyxHQUFHLGdGQUFnRixDQUFBO1FBQzVGLE1BQU0sTUFBTSxHQUFHLElBQUEseUJBQWdCLEdBQUUsQ0FBQTtRQUNqQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ25DLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsTUFBTSxHQUFHLEdBQUcsc0ZBQXNGLENBQUE7UUFDbEcsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBZ0IsR0FBRSxDQUFBO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtRQUN6QyxNQUFNLEdBQUcsR0FBRyw0RkFBNEYsQ0FBQTtRQUN4RyxNQUFNLE1BQU0sR0FBRyxJQUFBLHlCQUFnQixHQUFFLENBQUE7UUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNuQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7SUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLDBGQUEwRixDQUFBO1FBQ3RHLE1BQU0sTUFBTSxHQUFHLElBQUEseUJBQWdCLEdBQUUsQ0FBQTtRQUNqQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ25DLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7UUFDM0MsTUFBTSxHQUFHLEdBQUcsa0JBQWtCLENBQUE7UUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBZ0IsR0FBRSxDQUFBO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtRQUN6QyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUE7UUFDZixNQUFNLE1BQU0sR0FBRyxJQUFBLHlCQUFnQixHQUFFLENBQUE7UUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNuQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsTUFBTSxHQUFHLEdBQUcsaUVBQWlFLENBQUE7UUFDN0UsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBZ0IsR0FBRSxDQUFBO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1FBQzFDLE1BQU0sR0FBRyxHQUFHLDZFQUE2RSxDQUFBO1FBQ3pGLE1BQU0sTUFBTSxHQUFHLElBQUEseUJBQWdCLEdBQUUsQ0FBQTtRQUNqQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ25DLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO0lBQy9CLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixFQUFFLENBQUMsbURBQW1ELEVBQUUsR0FBRyxFQUFFO1FBQzNELE1BQU0sTUFBTSxHQUFHLElBQUEscUJBQVksR0FBRSxDQUFBO1FBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDMUMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMxQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQy9DLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtRQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3hDLElBQUEsYUFBTSxFQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3pDLElBQUEsYUFBTSxFQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3pDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3BDLElBQUEsYUFBTSxFQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO1FBQzdCLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO1FBQzdCLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO0lBQy9CLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLE1BQU0sVUFBVSxHQUFHO1FBQ2pCLElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1YsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNsQyxjQUFjLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7U0FDbEQ7UUFDRCxvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLFFBQVEsRUFBRSxDQUFDLGdCQUFnQixDQUFDO0tBQzdCLENBQUE7SUFFRCxFQUFFLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1FBQ3RELE1BQU0sU0FBUyxHQUFHLFlBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDckQsTUFBTSxLQUFLLEdBQUcsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUM1RCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFjLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQy9DLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtRQUM5RCxNQUFNLFNBQVMsR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQ3JELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWMsRUFBQyxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNuRSxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQTtJQUN2RSxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw0RUFBNEUsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMxRixNQUFNLFNBQVMsR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQ3JELE1BQU0sSUFBQSxxQkFBVyxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsMkJBQWMsRUFBQyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFO1lBQzdGLFFBQVEsRUFDTixzS0FBc0s7U0FDekssQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsbUVBQW1FLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDakYsTUFBTSxJQUFBLHFCQUFXLEVBQUMsR0FBRyxFQUFFLENBQUMsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFO1lBQ25FLFFBQVEsRUFBRSxzRUFBc0U7U0FDakYsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsMkRBQTJELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDekUsTUFBTSxJQUFBLHFCQUFXLEVBQUMsR0FBRyxFQUFFLENBQUMsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUU7WUFDbkYsUUFBUSxFQUFFLHNFQUFzRTtTQUNqRixDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBO0FBRUYsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixFQUFFLENBQUMsK0NBQStDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDN0QsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3ZELE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO1FBQzFCLE1BQU0sSUFBQSxxQkFBVyxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsMkJBQWMsRUFBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDckQsUUFBUSxFQUFFLDZDQUE2QztTQUN4RCxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM5RCxNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDbkYsTUFBTSxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQTtRQUNuQyxNQUFNLElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDJCQUFjLEVBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ3JELFFBQVEsRUFBRSxpREFBaUQ7U0FDNUQsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEUsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDbkYsTUFBTSxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQTtRQUNuQyxNQUFNLElBQUEscUJBQVcsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDJCQUFjLEVBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ3JELFFBQVEsRUFBRSxrREFBa0Q7U0FDN0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQTtBQUVGLFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7UUFDbkQsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN0RSxNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFZLEVBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDMUQsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtRQUMxQyxNQUFNLE1BQU0sR0FBRyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUEscUJBQVksRUFBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQTtRQUMxRCxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUE7SUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLFlBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFZLEVBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzVELElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvRUFBb0UsRUFBRSxHQUFHLEVBQUU7UUFDNUUsTUFBTSxNQUFNLEdBQUcsWUFBRzthQUNmLE1BQU0sRUFBRTthQUNSLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7YUFDekUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2pCLE1BQU0sTUFBTSxHQUFHLElBQUEscUJBQVksRUFBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3RFLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw0REFBNEQsRUFBRSxHQUFHLEVBQUU7UUFDcEUsTUFBTSxNQUFNLEdBQUcsWUFBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDekYsTUFBTSxLQUFLLEdBQUcsSUFBQSxxQkFBWSxFQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2xDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDN0MsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IsSUFBQSxxQkFBWSxFQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ25CLElBQUEscUJBQVksRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUNyQixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7UUFDcEQsTUFBTSxNQUFNLEdBQUcsSUFBQSxxQkFBWSxFQUFDO1lBQzFCLElBQUksRUFBRSxLQUFLO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLEdBQUcsRUFBRSxZQUFHLENBQUMsT0FBTyxFQUFFO2FBQ25CO1NBQ0YsQ0FBQyxDQUFBO1FBQ0Ysb0NBQW9DO1FBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUEsZ0NBQXVCLEVBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUM3RCxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ3RCLElBQUksRUFBRSxLQUFLO1NBQ1osQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1FBQy9DLElBQUEscUJBQVksRUFBQztZQUNYLElBQUksRUFBRSxLQUFLO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLEdBQUcsRUFBRSxZQUFHLENBQUMsT0FBTyxFQUFFO2FBQ25CO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxJQUFBLHFCQUFXLEVBQ2hCLEdBQUcsRUFBRSxDQUNILElBQUEscUJBQVksRUFBQztZQUNYLElBQUksRUFBRSxLQUFLO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLEdBQUcsRUFBRSxZQUFHLENBQUMsT0FBTyxFQUFFO2FBQ25CO1NBQ0YsQ0FBQyxFQUNKLEVBQUUsUUFBUSxFQUFFLDBDQUEwQyxFQUFFLENBQ3pELENBQUE7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7UUFDckMsTUFBTSxNQUFNLEdBQUcsSUFBQSxxQkFBWSxFQUFDO1lBQzFCLElBQUksRUFBRSxLQUFLO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLEdBQUcsRUFBRSxZQUFHLENBQUMsT0FBTyxFQUFFO2FBQ25CO1lBQ0QsSUFBSSxFQUFFO2dCQUNKLFFBQVEsRUFBRSxJQUFJO2FBQ2Y7U0FDRixDQUFDLENBQUE7UUFDRixNQUFNLFFBQVEsR0FBRyxJQUFBLGdDQUF1QixFQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDN0QsSUFBQSxhQUFNLEVBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUN0QixJQUFJLEVBQUUsS0FBSztZQUNYLFFBQVEsRUFBRSxJQUFJO1NBQ2YsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLE1BQU0sSUFBSSxHQUFHLElBQUEscUJBQVksRUFBQztZQUN4QixJQUFJLEVBQUUsS0FBSztZQUNYLElBQUksRUFBRTtnQkFDSixHQUFHLEVBQUUsWUFBRyxDQUFDLE9BQU8sRUFBRTthQUNuQjtTQUNGLENBQUMsQ0FBQTtRQUNGLE1BQU0sTUFBTSxHQUFHLElBQUEscUJBQVksRUFBQztZQUMxQixJQUFJLEVBQUUsS0FBSztZQUNYLElBQUksRUFBRTtnQkFDSixHQUFHLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRTthQUNsQjtZQUNELE1BQU0sRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFBO1FBQ0YsSUFBQSwyQkFBYyxFQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtJQUNyRCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7UUFDbkMsTUFBTSxDQUFDLEdBQUcsSUFBQSxxQkFBWSxFQUFDO1lBQ3JCLElBQUksRUFBRSxLQUFLO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLEdBQUcsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFO2FBQ2xCO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUE7UUFDYixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQTtRQUNiLElBQUEsYUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdkIsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9