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
const config_1 = require("../../../../../../../src/plugins/kubernetes/config");
const constants_1 = require("../../../../../../../src/plugins/kubernetes/constants");
const buildkit_1 = require("../../../../../../../src/plugins/kubernetes/container/build/buildkit");
const helpers_1 = require("../../../../../../helpers");
describe("getBuildkitModuleFlags", () => {
    it("should correctly format the build target option", async () => {
        const projectRoot = (0, helpers_1.getDataDir)("test-project-container");
        const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
        const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
        const rawBuild = graph.getBuild("module-a");
        const build = await garden.resolveAction({ action: rawBuild, log: garden.log, graph });
        build._config.spec.targetStage = "foo";
        const flags = (0, buildkit_1.getBuildkitFlags)(build);
        (0, chai_1.expect)(flags).to.eql([
            "--opt",
            "build-arg:GARDEN_MODULE_VERSION=" + build.versionString(),
            "--opt",
            "build-arg:GARDEN_BUILD_VERSION=" + build.versionString(),
            "--opt",
            "target=foo",
        ]);
    });
});
describe("buildkit build", () => {
    describe("getBuildkitDeployment", () => {
        const _provider = {
            config: {
                resources: config_1.defaultResources,
            },
        };
        let provider = _provider;
        beforeEach(() => {
            provider = _provider;
        });
        it("should return a Kubernetes Deployment manifest for buildkit in-cluster-builder", () => {
            var _a, _b, _c;
            const result = (0, buildkit_1.getBuildkitDeployment)(provider, "authSecretName", [{ name: "imagePullSecretName" }]);
            (0, chai_1.expect)(result.kind).eql("Deployment");
            (0, chai_1.expect)(result.metadata).eql({
                annotations: undefined,
                labels: {
                    app: "garden-buildkit",
                },
                name: "garden-buildkit",
            });
            (0, chai_1.expect)(result.spec.template.metadata).eql({
                annotations: undefined,
                labels: {
                    app: "garden-buildkit",
                },
            });
            (0, chai_1.expect)(((_a = result.spec.template.spec) === null || _a === void 0 ? void 0 : _a.containers.length) === 2);
            (0, chai_1.expect)((_b = result.spec.template.spec) === null || _b === void 0 ? void 0 : _b.containers[0]).eql({
                args: ["--addr", "unix:///run/buildkit/buildkitd.sock"],
                env: [
                    {
                        name: "DOCKER_CONFIG",
                        value: "/.docker",
                    },
                ],
                image: buildkit_1.buildkitImageName,
                livenessProbe: {
                    exec: {
                        command: ["buildctl", "debug", "workers"],
                    },
                    initialDelaySeconds: 5,
                    periodSeconds: 30,
                },
                name: "buildkitd",
                readinessProbe: {
                    exec: {
                        command: ["buildctl", "debug", "workers"],
                    },
                    initialDelaySeconds: 3,
                    periodSeconds: 5,
                },
                resources: {
                    limits: {
                        cpu: "4",
                        memory: "8Gi",
                    },
                    requests: {
                        cpu: "100m",
                        memory: "512Mi",
                    },
                },
                securityContext: {
                    privileged: true,
                },
                volumeMounts: [
                    {
                        mountPath: "/.docker",
                        name: "authSecretName",
                        readOnly: true,
                    },
                    {
                        mountPath: "/garden-build",
                        name: "garden-sync",
                    },
                ],
            });
            (0, chai_1.expect)((_c = result.spec.template.spec) === null || _c === void 0 ? void 0 : _c.containers[1]).eql({
                command: ["/rsync-server.sh"],
                env: [
                    {
                        name: "ALLOW",
                        value: "0.0.0.0/0",
                    },
                    {
                        name: "RSYNC_PORT",
                        value: "8730",
                    },
                ],
                image: constants_1.k8sUtilImageName,
                imagePullPolicy: "IfNotPresent",
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
                name: "util",
                ports: [
                    {
                        containerPort: 8730,
                        name: "garden-rsync",
                        protocol: "TCP",
                    },
                ],
                readinessProbe: {
                    failureThreshold: 5,
                    initialDelaySeconds: 1,
                    periodSeconds: 1,
                    successThreshold: 2,
                    tcpSocket: {
                        port: "garden-rsync",
                    },
                    timeoutSeconds: 3,
                },
                resources: {
                    limits: {
                        cpu: "256m",
                        memory: "512Mi",
                    },
                    requests: {
                        cpu: "256m",
                        memory: "512Mi",
                    },
                },
                securityContext: {
                    runAsGroup: 1000,
                    runAsUser: 1000,
                },
                volumeMounts: [
                    {
                        mountPath: "/home/user/.docker",
                        name: "authSecretName",
                        readOnly: true,
                    },
                    {
                        mountPath: "/data",
                        name: "garden-sync",
                    },
                ],
            });
        });
        it("should return a Kubernetes Deployment with the configured annotations", () => {
            var _a;
            provider.config.clusterBuildkit = {
                cache: [],
                annotations: {
                    buildkitAnnotation: "is-there",
                },
            };
            const result = (0, buildkit_1.getBuildkitDeployment)(provider, "authSecretName", [{ name: "imagePullSecretName" }]);
            (0, chai_1.expect)(result.metadata.annotations).eql(provider.config.clusterBuildkit.annotations);
            (0, chai_1.expect)((_a = result.spec.template.metadata) === null || _a === void 0 ? void 0 : _a.annotations).eql(provider.config.clusterBuildkit.annotations);
        });
    });
    describe("getBuildkitModuleFlags", () => {
        it("should correctly format the build target option", async () => {
            const projectRoot = (0, helpers_1.getDataDir)("test-project-container");
            const garden = await (0, helpers_1.makeTestGarden)(projectRoot);
            const graph = await garden.getConfigGraph({ log: garden.log, emit: false });
            const act = await graph.getBuild("module-a");
            const module = await garden.resolveAction({ action: act, graph, log: garden.log });
            module.getSpec().targetStage = "foo";
            const flags = (0, buildkit_1.getBuildkitFlags)(module);
            (0, chai_1.expect)(flags).to.eql([
                "--opt",
                "build-arg:GARDEN_MODULE_VERSION=" + module.getFullVersion().versionString,
                "--opt",
                "build-arg:GARDEN_BUILD_VERSION=" + module.getFullVersion().versionString,
                "--opt",
                "target=foo",
            ]);
        });
    });
    describe("getBuildkitImageFlags()", () => {
        const defaultConfig = [
            {
                type: "registry",
                mode: "auto",
                tag: "_buildcache",
                export: true,
            },
        ];
        // test autodetection for mode=inline
        const expectedInline = [
            // The following registries are actually known NOT to support mode=max
            "eu.gcr.io",
            "gcr.io",
            "aws_account_id.dkr.ecr.region.amazonaws.com",
            "keks.dkr.ecr.bla.amazonaws.com",
            // Most self-hosted registries actually support mode=max, but because
            // Harbor actually doesn't, we need to default to inline.
            "anyOtherRegistry",
            "127.0.0.1",
        ];
        for (const registry of expectedInline) {
            it(`returns type=inline cache flags with default config with registry ${registry}`, async () => {
                const moduleOutputs = {
                    "local-image-id": "name:v-xxxxxx",
                    "local-image-name": "name",
                    "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
                    "deployment-image-name": `${registry}/namespace/name`,
                };
                const flags = (0, buildkit_1.getBuildkitImageFlags)(defaultConfig, moduleOutputs, false);
                (0, chai_1.expect)(flags).to.eql([
                    "--export-cache",
                    "type=inline",
                    "--output",
                    `type=image,"name=${registry}/namespace/name:v-xxxxxx,${registry}/namespace/name:_buildcache",push=true`,
                    "--import-cache",
                    `type=registry,ref=${registry}/namespace/name:_buildcache`,
                ]);
            });
        }
        // test autodetection for mode=max
        const expectedMax = [
            // The following registries are known to actually support mode=max
            "hub.docker.com",
            "pkg.dev",
            "some.subdomain.pkg.dev",
            "ghcr.io",
            "GHCR.io",
            "azurecr.io",
            "some.subdomain.azurecr.io",
        ];
        for (const registry of expectedMax) {
            it(`returns mode=max cache flags with default config with registry ${registry}`, async () => {
                const moduleOutputs = {
                    "local-image-id": "name:v-xxxxxx",
                    "local-image-name": "name",
                    "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
                    "deployment-image-name": `${registry}/namespace/name`,
                };
                const flags = (0, buildkit_1.getBuildkitImageFlags)(defaultConfig, moduleOutputs, false);
                (0, chai_1.expect)(flags).to.eql([
                    "--output",
                    `type=image,"name=${registry}/namespace/name:v-xxxxxx",push=true`,
                    "--import-cache",
                    `type=registry,ref=${registry}/namespace/name:_buildcache`,
                    "--export-cache",
                    `type=registry,ref=${registry}/namespace/name:_buildcache,mode=max`,
                ]);
            });
        }
        // explicit min / max
        const explicitModes = ["min", "max"];
        for (const mode of explicitModes) {
            it(`returns mode=${mode} cache flags if explicitly configured`, async () => {
                const registry = "explicitTeamRegistry";
                const moduleOutputs = {
                    "local-image-id": "name:v-xxxxxx",
                    "local-image-name": "name",
                    "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
                    "deployment-image-name": `${registry}/namespace/name`,
                };
                const config = [
                    {
                        type: "registry",
                        mode,
                        tag: "_buildcache",
                        export: true,
                    },
                ];
                const flags = (0, buildkit_1.getBuildkitImageFlags)(config, moduleOutputs, false);
                (0, chai_1.expect)(flags).to.eql([
                    "--output",
                    `type=image,"name=${registry}/namespace/name:v-xxxxxx",push=true`,
                    "--import-cache",
                    `type=registry,ref=${registry}/namespace/name:_buildcache`,
                    "--export-cache",
                    `type=registry,ref=${registry}/namespace/name:_buildcache,mode=${mode}`,
                ]);
            });
        }
        // explicit inline
        it(`returns type=inline cache flags when explicitly configured`, async () => {
            const registry = "someExplicitInlineRegistry";
            const moduleOutputs = {
                "local-image-id": "name:v-xxxxxx",
                "local-image-name": "name",
                "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
                "deployment-image-name": `${registry}/namespace/name`,
            };
            const config = [
                {
                    type: "registry",
                    mode: "inline",
                    tag: "_buildcache",
                    export: true,
                },
            ];
            const flags = (0, buildkit_1.getBuildkitImageFlags)(config, moduleOutputs, false);
            (0, chai_1.expect)(flags).to.eql([
                "--export-cache",
                "type=inline",
                "--output",
                `type=image,"name=${registry}/namespace/name:v-xxxxxx,${registry}/namespace/name:_buildcache",push=true`,
                "--import-cache",
                `type=registry,ref=${registry}/namespace/name:_buildcache`,
            ]);
        });
        it("returns correct flags with separate cache registry", async () => {
            const deploymentRegistry = "gcr.io/deploymentRegistry";
            const cacheRegistry = "pkg.dev/cacheRegistry";
            const moduleOutputs = {
                "local-image-id": "name:v-xxxxxx",
                "local-image-name": "name",
                "deployment-image-id": `${deploymentRegistry}/namespace/name:v-xxxxxx`,
                "deployment-image-name": `${deploymentRegistry}/namespace/name`,
            };
            const config = [
                {
                    type: "registry",
                    registry: {
                        hostname: cacheRegistry,
                        namespace: "namespace",
                        insecure: false,
                    },
                    mode: "auto",
                    tag: "_buildcache",
                    export: true,
                },
            ];
            const flags = (0, buildkit_1.getBuildkitImageFlags)(config, moduleOutputs, false);
            (0, chai_1.expect)(flags).to.eql([
                // output to deploymentRegistry
                "--output",
                `type=image,"name=${deploymentRegistry}/namespace/name:v-xxxxxx",push=true`,
                // import and export to cacheRegistry with mode=max
                "--import-cache",
                `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache`,
                "--export-cache",
                `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache,mode=max`,
            ]);
        });
        it("returns correct flags for complex cache registry use case", async () => {
            const deploymentRegistry = "gcr.io/someBigTeamDeploymentRegistry";
            const cacheRegistry = "pkg.dev/someBigTeamCacheRegistry";
            const moduleOutputs = {
                "local-image-id": "name:v-xxxxxx",
                "local-image-name": "name",
                "deployment-image-id": `${deploymentRegistry}/namespace/name:v-xxxxxx`,
                "deployment-image-name": `${deploymentRegistry}/namespace/name`,
            };
            const config = [
                {
                    type: "registry",
                    registry: {
                        hostname: cacheRegistry,
                        namespace: "namespace",
                        insecure: false,
                    },
                    mode: "auto",
                    tag: "_buildcache-featureBranch",
                    export: true,
                },
                {
                    type: "registry",
                    registry: {
                        hostname: cacheRegistry,
                        namespace: "namespace",
                        insecure: false,
                    },
                    mode: "auto",
                    tag: "_buildcache-main",
                    export: false,
                },
            ];
            const flags = (0, buildkit_1.getBuildkitImageFlags)(config, moduleOutputs, false);
            (0, chai_1.expect)(flags).to.eql([
                // output to deploymentRegistry
                "--output",
                `type=image,"name=${deploymentRegistry}/namespace/name:v-xxxxxx",push=true`,
                // import and export to cacheRegistry with mode=max
                // import first _buildcache-featureBranch, then _buildcache-main
                "--import-cache",
                `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache-featureBranch`,
                "--export-cache",
                `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache-featureBranch,mode=max`,
                "--import-cache",
                `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache-main`,
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRraXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZGtpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUc3QiwrRUFJMkQ7QUFDM0QscUZBQXdGO0FBQ3hGLG1HQUs2RTtBQUM3RSx1REFBc0U7QUFFdEUsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtJQUN0QyxFQUFFLENBQUMsaURBQWlELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDL0QsTUFBTSxXQUFXLEdBQUcsSUFBQSxvQkFBVSxFQUFDLHdCQUF3QixDQUFDLENBQUE7UUFDeEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEVBQUMsV0FBVyxDQUFDLENBQUE7UUFDaEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFDM0UsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQXlCLENBQUE7UUFDbkUsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBRXRGLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUE7UUFFdEMsTUFBTSxLQUFLLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtRQUVyQyxJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ25CLE9BQU87WUFDUCxrQ0FBa0MsR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFO1lBQzFELE9BQU87WUFDUCxpQ0FBaUMsR0FB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