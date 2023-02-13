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
const port_forward_1 = require("../../../../../src/plugins/kubernetes/port-forward");
describe("getForwardablePorts", () => {
    it("returns all ports for Service resources", () => {
        const ports = (0, port_forward_1.getForwardablePorts)([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "foo",
                },
                spec: {
                    ports: [{ port: 12345 }],
                },
            },
        ], undefined);
        (0, chai_1.expect)(ports).to.eql([
            {
                name: undefined,
                protocol: "TCP",
                targetName: "Service/foo",
                targetPort: 12345,
            },
        ]);
    });
    it("returns explicitly configured port forwards if set", () => {
        // This mock only defines the necessary class members, the rest have been omitted by <any> cast hack.
        const action = {
            kind: "Deploy",
            name: "foo",
            getSpec() {
                return {
                    files: [],
                    manifests: [],
                    portForwards: [
                        {
                            name: "test",
                            resource: "Service/test",
                            targetPort: 999,
                            localPort: 9999,
                        },
                    ],
                };
            },
        };
        const ports = (0, port_forward_1.getForwardablePorts)([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "foo",
                },
                spec: {
                    ports: [{ port: 12345 }],
                },
            },
        ], action);
        (0, chai_1.expect)(ports).to.eql([
            {
                name: "test",
                protocol: "TCP",
                targetName: "Service/test",
                targetPort: 999,
                preferredLocalPort: 9999,
            },
        ]);
    });
    it("returns all ports for Deployment resources", () => {
        const ports = (0, port_forward_1.getForwardablePorts)([
            {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "foo",
                },
                spec: {
                    template: {
                        spec: {
                            containers: [
                                {
                                    ports: [{ containerPort: 12345 }],
                                },
                            ],
                        },
                    },
                },
            },
        ], undefined);
        (0, chai_1.expect)(ports).to.eql([
            {
                name: undefined,
                protocol: "TCP",
                targetName: "Deployment/foo",
                targetPort: 12345,
            },
        ]);
    });
    it("returns all ports for DaemonSet resources", () => {
        const ports = (0, port_forward_1.getForwardablePorts)([
            {
                apiVersion: "apps/v1",
                kind: "DaemonSet",
                metadata: {
                    name: "foo",
                },
                spec: {
                    template: {
                        spec: {
                            containers: [
                                {
                                    ports: [{ containerPort: 12345 }],
                                },
                            ],
                        },
                    },
                },
            },
        ], undefined);
        (0, chai_1.expect)(ports).to.eql([
            {
                name: undefined,
                protocol: "TCP",
                targetName: "DaemonSet/foo",
                targetPort: 12345,
            },
        ]);
    });
    it("omits a Deployment port that is already pointed to by a Service resource", () => {
        const ports = (0, port_forward_1.getForwardablePorts)([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "foo",
                },
                spec: {
                    selector: {
                        app: "foo",
                    },
                    ports: [{ port: 12345, targetPort: 12346 }],
                },
            },
            {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "foo",
                },
                spec: {
                    template: {
                        metadata: {
                            labels: {
                                app: "foo",
                            },
                        },
                        spec: {
                            containers: [
                                {
                                    ports: [{ containerPort: 12346 }],
                                },
                            ],
                        },
                    },
                },
            },
        ], undefined);
        (0, chai_1.expect)(ports).to.eql([
            {
                name: undefined,
                protocol: "TCP",
                targetName: "Service/foo",
                targetPort: 12345,
            },
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydC1mb3J3YXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9ydC1mb3J3YXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLHFGQUF3RjtBQU94RixRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO0lBQ25DLEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7UUFDakQsTUFBTSxLQUFLLEdBQUcsSUFBQSxrQ0FBbUIsRUFDL0I7WUFDRTtnQkFDRSxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsUUFBUSxFQUFFO29CQUNSLElBQUksRUFBRSxLQUFLO2lCQUNaO2dCQUNELElBQUksRUFBRTtvQkFDSixLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztpQkFDekI7YUFDRjtTQUNGLEVBQ0QsU0FBUyxDQUNWLENBQUE7UUFFRCxJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ25CO2dCQUNFLElBQUksRUFBRSxTQUFTO2dCQUNmLFFBQVEsRUFBRSxLQUFLO2dCQUNmLFVBQVUsRUFBRSxhQUFhO2dCQUN6QixVQUFVLEVBQUUsS0FBSzthQUNsQjtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsRUFBRTtRQUM1RCxxR0FBcUc7UUFDckcsTUFBTSxNQUFNLEdBQTREO1lBQ3RFLElBQUksRUFBRSxRQUFRO1lBQ2QsSUFBSSxFQUFFLEtBQUs7WUFDWCxPQUFPO2dCQUNMLE9BQU87b0JBQ0wsS0FBSyxFQUFFLEVBQUU7b0JBQ1QsU0FBUyxFQUFFLEVBQUU7b0JBQ2IsWUFBWSxFQUFFO3dCQUNaOzRCQUNFLElBQUksRUFBRSxNQUFNOzRCQUNaLFFBQVEsRUFBRSxjQUFjOzRCQUN4QixVQUFVLEVB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