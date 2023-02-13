"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testJsonSchema = void 0;
const chai_1 = require("chai");
const json_schema_1 = require("../../../../src/docs/json-schema");
describe("JsonKeyDescription", () => {
    it("correctly set the basic attributes of an object schema", () => {
        const desc = new json_schema_1.JsonKeyDescription({
            schema: exports.testJsonSchema,
            name: undefined,
            level: 0,
        });
        (0, chai_1.expect)(desc.type).to.equal("object");
        (0, chai_1.expect)(desc.internal).to.be.false;
        (0, chai_1.expect)(desc.deprecated).to.be.false;
        (0, chai_1.expect)(desc.experimental).to.be.false;
        (0, chai_1.expect)(desc.description).to.equal(exports.testJsonSchema.description);
    });
    describe("getChildren", () => {
        it("should correctly handle object schemas", () => {
            const desc = new json_schema_1.JsonKeyDescription({
                schema: exports.testJsonSchema,
                name: "foo",
                level: 0,
            });
            const children = desc.getChildren();
            (0, chai_1.expect)(children.length).to.equal(3);
            (0, chai_1.expect)(children[0].type).to.equal("string");
            (0, chai_1.expect)(children[1].type).to.equal("string");
            (0, chai_1.expect)(children[2].type).to.equal("object");
            for (const c of children) {
                (0, chai_1.expect)(c.parent).to.equal(desc);
            }
        });
    });
});
exports.testJsonSchema = {
    description: "PersistentVolumeClaim is a user's request for and claim to a persistent volume",
    properties: {
        apiVersion: {
            description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources",
            type: ["string", "null"],
            default: "v1",
        },
        kind: {
            description: "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds",
            type: ["string", "null"],
            enum: ["PersistentVolumeClaim"],
        },
        metadata: {
            description: "ObjectMeta is metadata that all persisted resources must have, which includes all objects users must create.",
            properties: {
                lastTransitionTime: {
                    description: "Time is a wrapper around time.Time which supports correct marshaling to YAML and JSON.  Wrappers are provided for many of the factory methods that the time package offers.",
                    format: "date-time",
                    type: ["string", "null"],
                    example: "2020-01-01T00:00:00",
                },
            },
            type: ["object", "null"],
        },
    },
    type: "object",
    $schema: "http://json-schema.org/schema#",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJqc29uLXNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQkFBNkI7QUFDN0Isa0VBQXFFO0FBRXJFLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsRUFBRSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsRUFBRTtRQUNoRSxNQUFNLElBQUksR0FBRyxJQUFJLGdDQUFrQixDQUFDO1lBQ2xDLE1BQU0sRUFBRSxzQkFBYztZQUN0QixJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSxDQUFDO1NBQ1QsQ0FBQyxDQUFBO1FBRUYsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDcEMsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFBO1FBQ2pDLElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtRQUNuQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7UUFDckMsSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsc0JBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtJQUMvRCxDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBQzNCLEVBQUUsQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7WUFDaEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxnQ0FBa0IsQ0FBQztnQkFDbEMsTUFBTSxFQUFFLHNCQUFjO2dCQUN0QixJQUFJLEVBQUUsS0FBSztnQkFDWCxLQUFLLEVBQUUsQ0FBQzthQUNULENBQUMsQ0FBQTtZQUNGLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtZQUVuQyxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNuQyxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUMzQyxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUMzQyxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUUzQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLFFBQVEsRUFBRTtnQkFDeEIsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7YUFDaEM7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUE7QUFFVyxRQUFBLGNBQWMsR0FBRztJQUM1QixXQUFXLEVBQUUsZ0ZBQWdGO0lBQzdGLFVBQVUsRUFBRTtRQUNWLFVBQVUsRUFBRTtZQUNWLFdBQVcsRUFDVCxtU0FBbVM7WUFDclMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQztZQUN4QixPQUFPLEVBQUUsSUFBSTtTQUNkO1FBQ0QsSUFBSSxFQUFFO1lBQ0osV0FBVyxFQUNULG9TQUFvUztZQUN0UyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1lBQ3hCLElBQUksRUFBRSxDQUFDLHVCQUF1QixDQUFDO1NBQ2hDO1FBQ0QsUUFBUSxFQUFFO1lBQ1IsV0FBVyxFQUNULDhHQUE4RztZQUNoSCxVQUFVLEVBQUU7Z0JBQ1Ysa0JBQWtCLEVBQUU7b0JBQ2xCLFdBQVcsRUFDVCw2S0FBNks7b0JBQy9LLE1BQU0sRUFBRSxXQUFXO29CQUNuQixJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO29CQUN4QixPQUFPLEVBQUUscUJBQXFCO2lCQUMvQjthQUNGO1lBQ0QsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQztTQUN6QjtLQUNGO0lBQ0QsSUFBSSxFQUFFLFFBQVE7SUFDZCxPQUFPLEVBQUUsZ0NBQWdDO0NBQzFDLENBQUEifQ==