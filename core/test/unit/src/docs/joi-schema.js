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
const joi_schema_1 = require("../../../../src/docs/joi-schema");
const json_schema_1 = require("./json-schema");
describe("JoiKeyDescription", () => {
    it("correctly set the basic attributes of an object schema", () => {
        const joiSchema = common_1.joi
            .string()
            .required()
            .allow("a", "b")
            .only()
            .meta({ internal: true, deprecated: true, experimental: true })
            .description("some description");
        const desc = new joi_schema_1.JoiKeyDescription({
            joiDescription: joiSchema.describe(),
            name: "foo",
            level: 0,
        });
        (0, chai_1.expect)(desc.formatAllowedValues()).to.equal('"a", "b"');
        (0, chai_1.expect)(desc.type).to.equal("string");
        (0, chai_1.expect)(desc.required).to.be.true;
        (0, chai_1.expect)(desc.internal).to.be.true;
        (0, chai_1.expect)(desc.deprecated).to.be.true;
        (0, chai_1.expect)(desc.experimental).to.be.true;
        (0, chai_1.expect)(desc.description).to.equal("some description");
    });
    describe("getChildren", () => {
        it("should correctly handle array schemas", () => {
            const schema = common_1.joi.array().items(common_1.joi.object().keys({ a: common_1.joi.string().description("array object key") }));
            const desc = new joi_schema_1.JoiKeyDescription({
                joiDescription: schema.describe(),
                name: undefined,
                level: 0,
            });
            const children = desc.getChildren(true);
            (0, chai_1.expect)(children.length).to.equal(1);
            (0, chai_1.expect)(children[0].type).to.equal("object");
            (0, chai_1.expect)(children[0].parent).to.equal(desc);
        });
        it("should correctly handle joi.object().jsonSchema() schemas", () => {
            const schema = common_1.joi.object().jsonSchema(json_schema_1.testJsonSchema);
            const desc = new joi_schema_1.JoiKeyDescription({
                joiDescription: schema.describe(),
                name: "foo",
                level: 0,
            });
            const children = desc.getChildren(true);
            (0, chai_1.expect)(children.length).to.equal(3);
            (0, chai_1.expect)(children[0].name).to.equal("apiVersion");
            (0, chai_1.expect)(children[1].name).to.equal("kind");
            (0, chai_1.expect)(children[2].name).to.equal("metadata");
            for (const c of children) {
                (0, chai_1.expect)(c.parent).to.equal(desc);
                (0, chai_1.expect)(c.level).to.equal(1);
            }
        });
    });
    describe("getDefaultValue", () => {
        it("should get the default value", () => {
            const schema = common_1.joi.number().default("result");
            const desc = new joi_schema_1.JoiKeyDescription({
                joiDescription: schema.describe(),
                name: undefined,
                level: 0,
            });
            const value = desc.getDefaultValue();
            (0, chai_1.expect)(value).to.equal("result");
        });
        it("should get the default return of the function over the param", () => {
            const schema = common_1.joi
                .number()
                .default(() => "result")
                .description("description");
            const desc = new joi_schema_1.JoiKeyDescription({
                joiDescription: schema.describe(),
                name: undefined,
                level: 0,
            });
            const value = desc.getDefaultValue();
            (0, chai_1.expect)(value).to.equal("result");
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiam9pLXNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImpvaS1zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsMERBQW1FO0FBQ25FLGdFQUFtRTtBQUNuRSwrQ0FBOEM7QUFFOUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxFQUFFLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO1FBQ2hFLE1BQU0sU0FBUyxHQUFHLFlBQUc7YUFDbEIsTUFBTSxFQUFFO2FBQ1IsUUFBUSxFQUFFO2FBQ1YsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7YUFDZixJQUFJLEVBQUU7YUFDTixJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO2FBQzlELFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1FBRWxDLE1BQU0sSUFBSSxHQUFHLElBQUksOEJBQWlCLENBQUM7WUFDakMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQW9CO1lBQ3RELElBQUksRUFBRSxLQUFLO1lBQ1gsS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDLENBQUE7UUFFRixJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDdkQsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDcEMsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFBO1FBQ2hDLElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENB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