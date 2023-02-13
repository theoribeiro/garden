"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../../../src/docs/config");
const chai_1 = require("chai");
const common_1 = require("../../../../src/config/common");
const module_1 = require("../../../../src/config/module");
const joi_schema_1 = require("../../../../src/docs/joi-schema");
const common_2 = require("../../../../src/docs/common");
const string_1 = require("../../../../src/util/string");
describe("docs config module", () => {
    const servicePortSchema = common_1.joi
        .number()
        .default((parent) => (parent ? parent.containerPort : undefined))
        .example("8080")
        .description("description");
    const testObject = common_1.joi
        .object()
        .keys({
        testKeyA: common_1.joi.number().required().description("key a"),
        testKeyB: common_1.joi.string().valid("b").description("key b"),
    })
        .description("test object");
    const testArray = (0, common_1.joiArray)(servicePortSchema).description("test array");
    const portSchema = () => common_1.joi
        .object()
        .keys({
        containerPort: common_1.joi.number().required().description("description"),
        servicePort: servicePortSchema,
        testObject,
        testArray,
    })
        .required();
    function normalizeJoiSchemaDescription(joiDescription) {
        return (0, common_2.flattenSchema)(new joi_schema_1.JoiKeyDescription({
            joiDescription,
            name: joiDescription.name,
            level: 0,
        }));
    }
    describe("sanitizeYamlStringForGitBook", () => {
        it("should remove lines that start with ```", () => {
            const yaml = (0, string_1.dedent) `
      # Example:
      #
      # \`\`\`yaml
      # modules:
      #   exclude:
      #     - node_modules/**/*
      #     - vendor/**/*
      # \`\`\`
      #
      # but our present story is ended.
    `;
            const js = (0, string_1.dedent) `
      # Example:
      #
      # \`\`\`javascript
      # modules:
      #   exclude:
      #     - node_modules/**/*
      #     - vendor/**/*
      # \`\`\`
      #
      # but our present story is ended.
    `;
            const empty = (0, string_1.dedent) `
      # Example:
      #
      # \`\`\`
      # modules:
      #   exclude:
      #     - node_modules/**/*
      #     - vendor/**/*
      # \`\`\`
      #
      # but our present story is ended.
    `;
            const expected = (0, string_1.dedent) `
      # Example:
      #
      # modules:
      #   exclude:
      #     - node_modules/**/*
      #     - vendor/**/*
      #
      # but our present story is ended.
    `;
            (0, chai_1.expect)((0, config_1.sanitizeYamlStringForGitBook)(yaml)).to.equal(expected);
            (0, chai_1.expect)((0, config_1.sanitizeYamlStringForGitBook)(js)).to.equal(expected);
            (0, chai_1.expect)((0, config_1.sanitizeYamlStringForGitBook)(empty)).to.equal(expected);
        });
    });
    describe("renderSchemaDescriptionYaml", () => {
        it("should render the yaml with the full description", () => {
            const schemaDescriptions = normalizeJoiSchemaDescription(portSchema().describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, { renderRequired: true });
            (0, chai_1.expect)(yaml).to.equal((0, string_1.dedent) `
        # description
        #
        # Type: number
        #
        # Required.
        containerPort:

        # description
        #
        # Type: number
        #
        # Example: "8080"
        #
        # Optional.
        servicePort:

        # test object
        #
        # Type: object
        #
        # Optional.
        testObject:
          # key a
          #
          # Type: number
          #
          # Required.
          testKeyA:

          # key b
          #
          # Type: string
          #
          # Required.
          # Allowed values: "b"
          #
          testKeyB:

        # test array
        #
        # Type: array[number]
        #
        # Optional.
        testArray: []
      `);
        });
        it("should optionally render the yaml with a basic description", () => {
            const schemaDescriptions = normalizeJoiSchemaDescription(portSchema().describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, { renderBasicDescription: true });
            (0, chai_1.expect)(yaml).to.equal((0, string_1.dedent) `
        # description
        containerPort:

        # description
        servicePort:

        # test object
        testObject:
          # key a
          testKeyA:

          # key b
          testKeyB:

        # test array
        testArray: []
      `);
        });
        it("should optionally skip the commented description above the key", () => {
            const schemaDescriptions = normalizeJoiSchemaDescription(portSchema().describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, { renderFullDescription: false });
            (0, chai_1.expect)(yaml).to.equal((0, string_1.dedent) `
        containerPort:
        servicePort:
        testObject:
          testKeyA:
          testKeyB:
        testArray: []
      `);
        });
        it("should conditionally print ellipsis between object keys", () => {
            const schemaDescriptions = normalizeJoiSchemaDescription(portSchema().describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                renderFullDescription: false,
                renderEllipsisBetweenKeys: true,
            });
            (0, chai_1.expect)(yaml).to.equal((0, string_1.dedent) `
        containerPort:
        servicePort:
        testObject:
          ...
          testKeyA:
          ...
          testKeyB:
        testArray: []
      `);
        });
        it("should correctly render object example values", () => {
            const schema = common_1.joi.object().keys({
                env: (0, common_1.joiEnvVars)().example({
                    foo: "bar",
                    boo: "far",
                }),
            });
            const schemaDescriptions = normalizeJoiSchemaDescription(schema.describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                renderFullDescription: false,
                renderEllipsisBetweenKeys: true,
                renderValue: "example",
            });
            (0, chai_1.expect)(yaml).to.equal((0, string_1.dedent) `
        env:
            foo: bar
            boo: far
      `);
        });
        it("should correctly render object with list default", () => {
            const schema = common_1.joi
                .object()
                .keys({
                dependencies: (0, common_1.joiArray)((0, module_1.buildDependencySchema)())
                    .description("A list of modules that must be built before this module is built.")
                    .example([{ name: "some-other-module-name" }]),
            })
                .default(() => ({ dependencies: [] }))
                .description("Specify how to build the module. Note that plugins may define additional keys on this object.");
            const schemaDescriptions = normalizeJoiSchemaDescription(schema.describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                renderFullDescription: false,
                renderValue: "default",
            });
            (0, chai_1.expect)(yaml).to.eql((0, string_1.dedent) `
        dependencies:
          - name:
            copy:
              - source:
                target:
      `);
        });
        it("should optionally convert markdown links in descriptions to plaintext", () => {
            const schema = common_1.joi.object().keys({
                dependencies: common_1.joi.string().description("Check out [some link](http://example.com)."),
            });
            const schemaDescriptions = normalizeJoiSchemaDescription(schema.describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                filterMarkdown: true,
                renderBasicDescription: true,
                renderValue: "none",
            });
            (0, chai_1.expect)(yaml).to.eql((0, string_1.dedent) `
        # Check out some link (http://example.com).
        dependencies:
      `);
        });
        it("should optionally convert markdown links to plaintext", () => {
            const schema = common_1.joi.object().keys({
                dependencies: common_1.joi.string().description("Check out [some link](http://example.com)."),
            });
            const schemaDescriptions = normalizeJoiSchemaDescription(schema.describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                filterMarkdown: true,
                renderBasicDescription: true,
                renderValue: "none",
            });
            (0, chai_1.expect)(yaml).to.eql((0, string_1.dedent) `
        # Check out some link (http://example.com).
        dependencies:
      `);
        });
        it("should set preset values on keys if provided", () => {
            const schema = common_1.joi.object().keys({
                keyA: common_1.joi.string(),
                keyB: common_1.joi.string().default("default-value"),
                keyC: common_1.joi.string(),
            });
            const schemaDescriptions = normalizeJoiSchemaDescription(schema.describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                filterMarkdown: true,
                presetValues: { keyC: "foo" },
                renderBasicDescription: false,
                renderFullDescription: false,
                renderValue: "default",
            });
            (0, chai_1.expect)(yaml).to.eql((0, string_1.dedent) `
        keyA:
        keyB: default-value
        keyC: foo
      `);
        });
        it("should optionally remove keys without preset values", () => {
            const schema = common_1.joi.object().keys({
                keyA: common_1.joi.string(),
                keyB: common_1.joi.string().default("default-value"),
                keyC: common_1.joi.number().example(4),
                keyD: common_1.joi.number().description("foobar"),
            });
            const schemaDescriptions = normalizeJoiSchemaDescription(schema.describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                renderFullDescription: false,
                presetValues: { keyA: "foo" },
                onEmptyValue: "remove",
            });
            (0, chai_1.expect)(yaml).to.equal((0, string_1.dedent) `
        keyA: foo
      `);
        });
        it("should optionally comment out keys without preset values", () => {
            const schema = common_1.joi.object().keys({
                keyA: common_1.joi.string(),
                keyB: common_1.joi.string().default("default-value"),
                keyC: common_1.joi.string(),
            });
            const schemaDescriptions = normalizeJoiSchemaDescription(schema.describe());
            const yaml = (0, config_1.renderSchemaDescriptionYaml)(schemaDescriptions, {
                onEmptyValue: "comment out",
                filterMarkdown: true,
                presetValues: { keyC: "foo" },
                renderBasicDescription: false,
                renderFullDescription: false,
                renderValue: "default",
            });
            (0, chai_1.expect)(yaml).to.eql((0, string_1.dedent) `
        # keyA:
        # keyB: default-value
        keyC: foo
      `);
        });
    });
    describe("renderConfigReference", () => {
        it("should return the correct markdown", () => {
            const { markdownReference } = (0, config_1.renderConfigReference)(portSchema());
            (0, chai_1.expect)(markdownReference).to.equal((0, string_1.dedent) `
        \n### \`containerPort\`

        description

        | Type     | Required |
        | -------- | -------- |
        | \`number\` | Yes      |

        ### \`servicePort\`

        description

        | Type     | Required |
        | -------- | -------- |
        | \`number\` | No       |

        Example:

        \`\`\`yaml
        servicePort: "8080"
        \`\`\`

        ### \`testObject\`

        test object

        | Type     | Required |
        | -------- | -------- |
        | \`object\` | No       |

        ### \`testObject.testKeyA\`

        [testObject](#testobject) > testKeyA

        key a

        | Type     | Required |
        | -------- | -------- |
        | \`number\` | Yes      |

        ### \`testObject.testKeyB\`

        [testObject](#testobject) > testKeyB

        key b

        | Type     | Allowed Values | Required |
        | -------- | -------------- | -------- |
        | \`string\` | "b"            | Yes      |

        ### \`testArray[]\`

        test array

        | Type            | Default | Required |
        | --------------- | ------- | -------- |
        | \`array[number]\` | \`[]\`    | No       |\n
      `);
        });
        it("should return the correct yaml", () => {
            const { yaml } = (0, config_1.renderConfigReference)(portSchema());
            (0, chai_1.expect)(yaml).to.equal((0, string_1.dedent) `
        # description
        containerPort:

        # description
        servicePort:

        # test object
        testObject:
          # key a
          testKeyA:

          # key b
          testKeyB:

        # test array
        testArray: []
      `);
        });
    });
    describe("renderMarkdownLink", () => {
        it("should return a markdown link with a name and relative path", () => {
            class TestKeyDescription extends common_2.BaseKeyDescription {
                constructor(name, level) {
                    super(name, level);
                    this.type = "string";
                }
                fullKey() {
                    return "happy.families[].are.all[].alike";
                }
                getChildren() {
                    return [];
                }
                getDefaultValue() {
                    return undefined;
                }
                formatExample() {
                    return undefined;
                }
                formatAllowedValues() {
                    return undefined;
                }
            }
            const alike = new TestKeyDescription("alike", 5);
            (0, chai_1.expect)((0, config_1.renderMarkdownLink)(alike)).to.equal(`[alike](#happyfamiliesareallalike)`);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsd0RBS29DO0FBQ3BDLCtCQUE2QjtBQUM3QiwwREFBeUY7QUFDekYsMERBQXFFO0FBQ3JFLGdFQUFtRTtBQUNuRSx3REFBK0U7QUFDL0Usd0RBQW9EO0FBRXBELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsTUFBTSxpQkFBaUIsR0FBRyxZQUFHO1NBQzFCLE1BQU0sRUFBRTtTQUNSLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ2hFLE9BQU8sQ0FBQyxNQUFNLENBQUM7U0FDZixXQUFXLENBQUMsYUFBYSxDQUFDLENBQUE7SUFFN0IsTUFBTSxVQUFVLEdBQUcsWUFBRztTQUNuQixNQUFNLEVBQUU7U0FDUixJQUFJLENBQUM7UUFDSixRQUFRLEVBQUUsWUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFDdEQsUUFBUSxFQUFFLFlBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQztLQUN2RCxDQUFDO1NBQ0QsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBRTdCLE1BQU0sU0FBUyxHQUFHLElBQUEsaUJBQVEsRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUV2RSxNQUFNLFVBQVUsR0FBRyxHQUFHLEVBQUUsQ0FDdEIsWUFBRztTQUNBLE1BQU0sRUFBRTtTQUNSLElBQUksQ0FBQztRQUNKLGFBQWEsRUFBRSxZQUFHLENBQUMsTUFBTSxFQUFFLENBQUMs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