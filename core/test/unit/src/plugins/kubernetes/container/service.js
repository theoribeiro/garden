"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../../../../../../src/plugins/kubernetes/container/service");
const helpers_1 = require("../../../../../helpers");
const container_1 = require("../../../../../../src/plugins/container/container");
const chai_1 = require("chai");
const string_1 = require("../../../../../../src/util/string");
describe("createServiceResources", () => {
    const projectRoot = (0, helpers_1.getDataDir)("test-project-container");
    let garden;
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, container_1.gardenPlugin)()] });
    });
    it("should return service resources", async () => {
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const rawAction = graph.getDeploy("service-a");
        const action = await garden.resolveAction({ graph, log: garden.log, action: rawAction });
        const resources = await (0, service_1.createServiceResources)(action, "my-namespace", false);
        (0, chai_1.expect)(resources).to.eql([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    annotations: {},
                    name: "service-a",
                    namespace: "my-namespace",
                },
                spec: {
                    ports: [
                        {
                            name: "http",
                            protocol: "TCP",
                            targetPort: 8080,
                            port: 8080,
                        },
                    ],
                    selector: {
                        [(0, string_1.gardenAnnotationKey)("service")]: "service-a",
                    },
                    type: "ClusterIP",
                },
            },
        ]);
    });
    it("should pin to specific deployment version if blueGreen=true", async () => {
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const rawAction = graph.getDeploy("service-a");
        const action = await garden.resolveAction({ graph, log: garden.log, action: rawAction });
        const resources = await (0, service_1.createServiceResources)(action, "my-namespace", true);
        (0, chai_1.expect)(resources).to.eql([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    annotations: {},
                    name: "service-a",
                    namespace: "my-namespace",
                },
                spec: {
                    ports: [
                        {
                            name: "http",
                            protocol: "TCP",
                            targetPort: 8080,
                            port: 8080,
                        },
                    ],
                    selector: {
                        [(0, string_1.gardenAnnotationKey)("service")]: "service-a",
                        [(0, string_1.gardenAnnotationKey)("version")]: action.versionString(),
                    },
                    type: "ClusterIP",
                },
            },
        ]);
    });
    it("should add annotations if configured", async () => {
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const rawAction = graph.getDeploy("service-a");
        const action = await garden.resolveAction({ graph, log: garden.log, action: rawAction });
        action._config.spec.annotations = { my: "annotation" };
        const resources = await (0, service_1.createServiceResources)(action, "my-namespace", false);
        (0, chai_1.expect)(resources).to.eql([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "service-a",
                    annotations: {
                        my: "annotation",
                    },
                    namespace: "my-namespace",
                },
                spec: {
                    ports: [
                        {
                            name: "http",
                            protocol: "TCP",
                            targetPort: 8080,
                            port: 8080,
                        },
                    ],
                    selector: {
                        [(0, string_1.gardenAnnotationKey)("service")]: "service-a",
                    },
                    type: "ClusterIP",
                },
            },
        ]);
    });
    it("should create a NodePort service if a nodePort is specified", async () => {
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const rawAction = graph.getDeploy("service-a");
        const action = await garden.resolveAction({ graph, log: garden.log, action: rawAction });
        action._config.spec.ports[0].nodePort = 12345;
        const resources = await (0, service_1.createServiceResources)(action, "my-namespace", false);
        (0, chai_1.expect)(resources).to.eql([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "service-a",
                    namespace: "my-namespace",
                    annotations: {},
                },
                spec: {
                    ports: [
                        {
                            name: "http",
                            protocol: "TCP",
                            targetPort: 8080,
                            port: 8080,
                            nodePort: 12345,
                        },
                    ],
                    selector: {
                        [(0, string_1.gardenAnnotationKey)("service")]: "service-a",
                    },
                    type: "NodePort",
                },
            },
        ]);
    });
    it("should create a NodePort service without nodePort set if nodePort is specified as true", async () => {
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const rawAction = graph.getDeploy("service-a");
        const action = await garden.resolveAction({ graph, log: garden.log, action: rawAction });
        action._config.spec.ports[0].nodePort = true;
        const resources = await (0, service_1.createServiceResources)(action, "my-namespace", false);
        (0, chai_1.expect)(resources).to.eql([
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "service-a",
                    namespace: "my-namespace",
                    annotations: {},
                },
                spec: {
                    ports: [
                        {
                            name: "http",
                            protocol: "TCP",
                            targetPort: 8080,
                            port: 8080,
                        },
                    ],
                    selector: {
                        [(0, string_1.gardenAnnotationKey)("service")]: "service-a",
                    },
                    type: "NodePort",
                },
            },
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCx3RkFBbUc7QUFDbkcsb0RBQW1FO0FBQ25FLGlGQUFnRjtBQUVoRiwrQkFBNkI7QUFDN0IsOERBQXVFO0FBRXZFLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7SUFDdEMsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLHdCQUF3QixDQUFDLENBQUE7SUFDeEQsSUFBSSxNQUFjLENBQUE7SUFFbEIsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE1BQU0sR0FBRyxNQUFNLElBQUEsd0JBQWMsRUFBQyxXQUFXLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFBLHdCQUFZLEdBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUMzRSxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMvQyxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUMzRSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQTtRQUV4RixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsZ0NBQXNCLEVBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUU3RSxJQUFBLGFBQU0sRUFBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMs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