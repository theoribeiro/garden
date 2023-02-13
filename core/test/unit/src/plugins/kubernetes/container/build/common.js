"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../../../../../../src/plugins/kubernetes/container/build/common");
const chai_1 = require("chai");
const config_1 = require("../../../../../../../src/plugins/kubernetes/config");
const constants_1 = require("../../../../../../../src/plugins/kubernetes/constants");
describe("common build", () => {
    describe("manifest error", () => {
        it("should result in manifest unknown for common registry error", () => {
            const errorMessage = "ERROR: manifest unknown: manifest unknown";
            (0, chai_1.expect)((0, common_1.skopeoManifestUnknown)(errorMessage)).to.be.true;
        });
        it("should result in manifest unknown for Harbor registry error", () => {
            const errorMessage = 'Unable to query registry for image status: time="2021-10-13T17:50:25Z" level=fatal msg="Error parsing image name "docker://registry.domain/namespace/image-name:v-1f160eadbb": Error reading manifest v-1f160eadbb in registry.domain/namespace/image-name: unknown: artifact namespace/image-name:v-1f160eadbb not found"';
            (0, chai_1.expect)((0, common_1.skopeoManifestUnknown)(errorMessage)).to.be.true;
        });
        it("should result in manifest not unknown for other errors", () => {
            const errorMessage = "unauthorized: unauthorized to access repository: namespace/image-name, action: push: unauthorized to access repository: namespace/image-name, action: push";
            (0, chai_1.expect)((0, common_1.skopeoManifestUnknown)(errorMessage)).to.be.false;
        });
    });
    describe("getUtilManifests", () => {
        const _provider = {
            config: {
                resources: {
                    util: config_1.defaultResources.util,
                },
            },
        };
        let provider = _provider;
        beforeEach(() => {
            provider = _provider;
        });
        it("should return the manifest", () => {
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            (0, chai_1.expect)(result).eql({
                deployment: {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: { labels: { app: "garden-util" }, name: "garden-util", annotations: undefined },
                    spec: {
                        replicas: 1,
                        selector: { matchLabels: { app: "garden-util" } },
                        template: {
                            metadata: { labels: { app: "garden-util" }, annotations: undefined },
                            spec: {
                                containers: [
                                    {
                                        name: "util",
                                        image: constants_1.k8sUtilImageName,
                                        imagePullPolicy: "IfNotPresent",
                                        command: ["/rsync-server.sh"],
                                        env: [
                                            { name: "ALLOW", value: "0.0.0.0/0" },
                                            { name: "RSYNC_PORT", value: "8730" },
                                        ],
                                        volumeMounts: [
                                            { name: "test", mountPath: "/home/user/.docker", readOnly: true },
                                            { name: "garden-sync", mountPath: "/data" },
                                        ],
                                        ports: [{ name: "garden-rsync", protocol: "TCP", containerPort: 8730 }],
                                        readinessProbe: {
                                            initialDelaySeconds: 1,
                                            periodSeconds: 1,
                                            timeoutSeconds: 3,
                                            successThreshold: 2,
                                            failureThreshold: 5,
                                            tcpSocket: { port: "garden-rsync" },
                                        },
                                        lifecycle: {
                                            preStop: {
                                                exec: {
                                                    command: [
                                                        "/bin/sh",
                                                        "-c",
                                                        "until test $(pgrep -fc '^[^ ]+rsync') = 1; do echo waiting for rsync to finish...; sleep 1; done",
                                                    ],
                                                },
                                            },
                                        },
                                        resources: { limits: { cpu: "256m", memory: "512Mi" }, requests: { cpu: "256m", memory: "512Mi" } },
                                        securityContext: { runAsUser: 1000, runAsGroup: 1000 },
                                    },
                                ],
                                imagePullSecrets: [],
                                volumes: [
                                    {
                                        name: "test",
                                        secret: { secretName: "test", items: [{ key: ".dockerconfigjson", path: "config.json" }] },
                                    },
                                    { name: "garden-sync", emptyDir: {} },
                                ],
                                tolerations: [{ key: "garden-build", operator: "Equal", value: "true", effect: "NoSchedule" }],
                            },
                        },
                    },
                },
                service: {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: { name: "garden-util" },
                    spec: {
                        ports: [{ name: "rsync", protocol: "TCP", port: 8730, targetPort: 8730 }],
                        selector: { app: "garden-util" },
                        type: "ClusterIP",
                    },
                },
            });
        });
        it("should return the manifest with kaniko config tolerations if util tolerations are not specified", () => {
            var _a;
            const toleration = { key: "custom-kaniko-toleration", operator: "Equal", value: "true", effect: "NoSchedule" };
            provider.config.kaniko = {
                tolerations: [toleration],
            };
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            const tolerations = (_a = result.deployment.spec.template.spec) === null || _a === void 0 ? void 0 : _a.tolerations;
            (0, chai_1.expect)(tolerations === null || tolerations === void 0 ? void 0 : tolerations.find((t) => t.key === toleration.key)).to.eql(toleration);
        });
        it("should return the manifest with util config tolerations if util tolerations are specified", () => {
            var _a;
            const tolerationUtil = { key: "util-toleration", operator: "Equal", value: "true", effect: "NoSchedule" };
            provider.config.kaniko = {
                util: {
                    tolerations: [tolerationUtil],
                },
            };
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            const tolerations = (_a = result.deployment.spec.template.spec) === null || _a === void 0 ? void 0 : _a.tolerations;
            (0, chai_1.expect)(tolerations === null || tolerations === void 0 ? void 0 : tolerations.find((t) => t.key === tolerationUtil.key)).to.eql(tolerationUtil);
        });
        it("should return the manifest with util tolerations only if kaniko has separate tolerations configured", () => {
            var _a;
            const tolerationKaniko = { key: "kaniko-toleration", operator: "Equal", value: "true", effect: "NoSchedule" };
            const tolerationUtil = { key: "util-toleration", operator: "Equal", value: "true", effect: "NoSchedule" };
            provider.config.kaniko = {
                tolerations: [tolerationKaniko],
            };
            provider.config.kaniko.util = {
                tolerations: [tolerationUtil],
            };
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            const tolerations = (_a = result.deployment.spec.template.spec) === null || _a === void 0 ? void 0 : _a.tolerations;
            (0, chai_1.expect)(tolerations === null || tolerations === void 0 ? void 0 : tolerations.findIndex((t) => t.key === tolerationKaniko.key)).to.eql(-1);
        });
        it("should return the manifest with kaniko annotations when util annotations are missing", () => {
            var _a, _b;
            provider.config.kaniko = {
                annotations: {
                    testAnnotation: "its-there",
                },
            };
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            const deploymentAnnotations = (_a = result.deployment.metadata) === null || _a === void 0 ? void 0 : _a.annotations;
            (0, chai_1.expect)(deploymentAnnotations).to.eql(provider.config.kaniko.annotations);
            const podAnnotations = (_b = result.deployment.spec.template.metadata) === null || _b === void 0 ? void 0 : _b.annotations;
            (0, chai_1.expect)(podAnnotations).to.eql(provider.config.kaniko.annotations);
        });
        it("should return the manifest with util annotations when util annotations are specified", () => {
            var _a, _b, _c, _d;
            provider.config.kaniko = {
                util: {
                    annotations: {
                        testAnnotation: "its-there",
                    },
                },
            };
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            const deploymentAnnotations = (_a = result.deployment.metadata) === null || _a === void 0 ? void 0 : _a.annotations;
            (0, chai_1.expect)(deploymentAnnotations).to.eql((_b = provider.config.kaniko.util) === null || _b === void 0 ? void 0 : _b.annotations);
            const podAnnotations = (_c = result.deployment.spec.template.metadata) === null || _c === void 0 ? void 0 : _c.annotations;
            (0, chai_1.expect)(podAnnotations).to.eql((_d = provider.config.kaniko.util) === null || _d === void 0 ? void 0 : _d.annotations);
        });
        it("should return the manifest with kaniko nodeSelector when util nodeSelector is missing", () => {
            var _a;
            provider.config.kaniko = {
                nodeSelector: { "kubernetes.io/os": "linux" },
            };
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            const podNodeSelector = (_a = result.deployment.spec.template.spec) === null || _a === void 0 ? void 0 : _a.nodeSelector;
            (0, chai_1.expect)(podNodeSelector).to.eql(provider.config.kaniko.nodeSelector);
        });
        it("should return the manifest with util nodeSelector when util nodeSelector is specified", () => {
            var _a, _b;
            provider.config.kaniko = {
                util: {
                    nodeSelector: { "kubernetes.io/os": "linux" },
                },
            };
            const result = (0, common_1.getUtilManifests)(provider, "test", []);
            const podNodeSelector = (_a = result.deployment.spec.template.spec) === null || _a === void 0 ? void 0 : _a.nodeSelector;
            (0, chai_1.expect)(podNodeSelector).to.eql((_b = provider.config.kaniko.util) === null || _b === void 0 ? void 0 : _b.nodeSelector);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0ZBRzJFO0FBQzNFLCtCQUE2QjtBQUM3QiwrRUFBeUc7QUFFekcscUZBQXdGO0FBRXhGLFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsRUFBRSxDQUFDLDZEQUE2RCxFQUFFLEdBQUcsRUFBRTtZQUNyRSxNQUFNLFlBQVksR0FBRywyQ0FBMkMsQ0FBQTtZQUVoRSxJQUFBLGFBQU0sRUFBQyxJQUFBLDhCQUFxQixFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFDeEQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsNkRBQTZELEVBQUUsR0FBRyxFQUFFO1lBQ3JFLE1BQU0sWUFBWSxHQUNoQiw0VEFBNFQsQ0FBQTtZQUU5VCxJQUFBLGFBQU0sRUFBQyxJQUFBLDhCQUFxQixFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFDeEQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLE1BQU0sWUFBWSxHQUNoQiw0SkFBNEosQ0FBQTtZQUU5SixJQUFBLGFBQU0sRUFBQyxJQUFBLDhCQUFxQixFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7UUFDekQsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsTUFBTSxTQUFTLEdBQW9DO1lBQ2pELE1BQU0sRUFBRTtnQkFDTixTQUFTLEVBQUU7b0JBQ1QsSUFBSSxF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