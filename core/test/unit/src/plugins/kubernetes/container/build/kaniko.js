"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const kaniko_1 = require("../../../../../../../src/plugins/kubernetes/container/build/kaniko");
const chai_1 = require("chai");
const config_1 = require("../../../../../../../src/plugins/kubernetes/config");
const constants_1 = require("../../../../../../../src/plugins/kubernetes/constants");
describe("kaniko build", () => {
    it("should return as successful when immutable tag already exists in destination", () => {
        const errorMessage = `error pushing image: failed to push to destination dockerhub.com/garden/backend:v-1234567: TAG_INVALID: The image tag "v-1234567" already exists in the "garden/backend" repository and cannot be overwritten because the repository is immutable.`;
        (0, chai_1.expect)((0, kaniko_1.kanikoBuildFailed)({
            startedAt: new Date(),
            completedAt: new Date(),
            success: false,
            log: errorMessage,
        })).to.be.false;
    });
    it("should return as failure when other error messages are present", () => {
        const errorMessage = `error uploading layer to cache: failed to push to destination dockerhub.com/garden/backend:v-1234567: TAG_INVALID: The image tag "v-1234567" already exists in the "garden / backend" repository and cannot be overwritten because the repository is immutable.`;
        (0, chai_1.expect)((0, kaniko_1.kanikoBuildFailed)({
            startedAt: new Date(),
            completedAt: new Date(),
            success: false,
            log: errorMessage,
        })).to.be.true;
    });
    it("should return as success when the build succeeded", () => {
        (0, chai_1.expect)((0, kaniko_1.kanikoBuildFailed)({
            startedAt: new Date(),
            completedAt: new Date(),
            success: true,
            log: "",
        })).to.be.false;
    });
    describe("getKanikoBuilderPodManifest", () => {
        const _provider = {
            config: {
                kaniko: {},
                resources: {
                    ...config_1.defaultResources,
                },
            },
        };
        let provider = _provider;
        beforeEach(() => {
            provider = _provider;
        });
        it("should return a Kubernetes Pod manifest for kaniko building", () => {
            (0, chai_1.expect)((0, kaniko_1.getKanikoBuilderPodManifest)({
                provider,
                podName: "builder-pod",
                commandStr: "build command",
                kanikoNamespace: "namespace",
                authSecretName: "authSecret",
                syncArgs: ["arg1", "arg2"],
                imagePullSecrets: [],
                sourceUrl: "sourceURL",
            })).eql({
                apiVersion: "v1",
                kind: "Pod",
                metadata: {
                    annotations: undefined,
                    name: "builder-pod",
                    namespace: "namespace",
                },
                spec: {
                    containers: [
                        {
                            command: ["sh", "-c", "build command"],
                            image: config_1.DEFAULT_KANIKO_IMAGE,
                            name: "kaniko",
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
                            volumeMounts: [
                                {
                                    mountPath: "/kaniko/.docker",
                                    name: "authSecret",
                                    readOnly: true,
                                },
                                {
                                    mountPath: "/.garden",
                                    name: "comms",
                                },
                            ],
                        },
                    ],
                    imagePullSecrets: [],
                    initContainers: [
                        {
                            command: [
                                "/bin/sh",
                                "-c",
                                'echo "Copying from sourceURL to /.garden/context"\nmkdir -p /.garden/context\nn=0\nuntil [ "$n" -ge 30 ]\ndo\n  rsync arg1 arg2 && break\n  n=$((n+1))\n  sleep 1\ndone\necho "Done!"',
                            ],
                            image: constants_1.k8sUtilImageName,
                            imagePullPolicy: "IfNotPresent",
                            name: "init",
                            volumeMounts: [
                                {
                                    mountPath: "/.garden",
                                    name: "comms",
                                },
                            ],
                        },
                    ],
                    shareProcessNamespace: true,
                    tolerations: [
                        {
                            effect: "NoSchedule",
                            key: "garden-build",
                            operator: "Equal",
                            value: "true",
                        },
                    ],
                    volumes: [
                        {
                            name: "authSecret",
                            secret: {
                                items: [
                                    {
                                        key: ".dockerconfigjson",
                                        path: "config.json",
                                    },
                                ],
                                secretName: "authSecret",
                            },
                        },
                        {
                            emptyDir: {},
                            name: "comms",
                        },
                    ],
                },
            });
        });
        it("should return a Kubernetes Pod manifest with configured annotations", () => {
            provider.config.kaniko.annotations = {
                builderAnnotation: "is-there",
            };
            provider.config.kaniko.util = {
                annotations: {
                    utilAnnotation: "not-there",
                },
            };
            const manifest = (0, kaniko_1.getKanikoBuilderPodManifest)({
                provider,
                podName: "builder-pod",
                commandStr: "build command",
                kanikoNamespace: "namespace",
                authSecretName: "authSecret",
                syncArgs: ["arg1", "arg2"],
                imagePullSecrets: [],
                sourceUrl: "sourceURL",
            });
            (0, chai_1.expect)(manifest.metadata.annotations).eql(provider.config.kaniko.annotations);
        });
    });
    describe("getKanikoFlags", () => {
        it("should only keep all declarations of each flag + the defaults", () => {
            (0, chai_1.expect)((0, kaniko_1.getKanikoFlags)(["--here=first", "--here=again"])).to.deep.equal([
                "--here=first",
                "--here=again",
                "--cache=true",
            ]);
        });
        it("should allow overriding default flags", () => {
            const overridenFlags = kaniko_1.DEFAULT_KANIKO_FLAGS.map((f) => f + "cat");
            (0, chai_1.expect)((0, kaniko_1.getKanikoFlags)(overridenFlags)).to.deep.equal(overridenFlags);
        });
        it("should allow toggles", () => {
            (0, chai_1.expect)((0, kaniko_1.getKanikoFlags)(["--myToggle"])).to.deep.equal(["--myToggle", "--cache=true"]);
        });
        it("should throw if a flag is malformed", () => {
            (0, chai_1.expect)(() => (0, kaniko_1.getKanikoFlags)(["--here=first", "-my-flag"])).to.throw(/Invalid format for a kaniko flag/);
        });
        it("should return --cache=true when extraFlags is empty", () => {
            (0, chai_1.expect)((0, kaniko_1.getKanikoFlags)([])).to.deep.equal(kaniko_1.DEFAULT_KANIKO_FLAGS);
            (0, chai_1.expect)((0, kaniko_1.getKanikoFlags)()).to.deep.equal(kaniko_1.DEFAULT_KANIKO_FLAGS);
        });
        it("should merge multiple flags if top level flags are provided", () => {
            (0, chai_1.expect)((0, kaniko_1.getKanikoFlags)(["--myToggle"], ["--cat=fast"])).to.deep.equal(["--myToggle", "--cat=fast", "--cache=true"]);
        });
        it("should make leftmost flags win", () => {
            (0, chai_1.expect)((0, kaniko_1.getKanikoFlags)(["--cat=slow"], ["--cat=fast"])).to.deep.equal(["--cat=slow", "--cache=true"]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2FuaWtvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia2FuaWtvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0ZBSzJFO0FBQzNFLCtCQUE2QjtBQUM3QiwrRUFJMkQ7QUFDM0QscUZBQXdGO0FBR3hGLFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLEVBQUUsQ0FBQyw4RUFBOEUsRUFBRSxHQUFHLEVBQUU7UUFDdEYsTUFBTSxZQUFZLEdBQUcsb1BBQW9QLENBQUE7UUFFelEsSUFBQSxhQUFNLEVBQ0osSUFBQSwwQkFBaUIsRUFBQztZQUNoQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDckIsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3ZCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsR0FBRyxFQUFFLFlBQVk7U0FDbEIsQ0FBQyxDQUNILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUE7SUFDZixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7UUFDeEUsTUFBTSxZQUFZLEdBQUcsaVFBQWlRLENBQUE7UUFFdFIsSUFBQSxhQUFNLEVBQ0osSUFBQSwwQkFBaUIsRUFBQztZQUNoQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDckIsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3ZCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsR0FBRyxFQUFFLFlBQVk7U0FDbEIsQ0FBQyxDQUNILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUE7SUFDZCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxtREFBbUQsRUFBRSxHQUFHLEVBQUU7UUFDM0QsSUFBQSxhQUFNLEVBQ0osSUFBQSwwQkFBaUIsRUFBQztZQUNoQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDckIsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3ZCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsR0FBRyxFQUFFLEVBQUU7U0FDUixDQUFDLENBQ0gsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQTtJQUNmLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUMzQyxNQUFNLFNBQVMsR0FBb0M7WUFDakQsTUFBTSxFQUFFO2dCQUNOLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRTtvQkFDVCxHQUFHLHlCQUFnQjtpQkFDcEI7YUFDRjtTQUNGLENBQUE7UUFDRCxJQUFJLFFBQVEsR0FBRyxTQUErQixDQUFBO1FBQzlDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZCxRQUFRLEdBQUcsU0FBK0IsQ0FBQTtRQUM1QyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxHQUFHLEVBQUU7WUFDckUsSUFBQSxhQUFNLEVBQ0osSUFBQSxvQ0FBMkIsRUFBQztnQkFDMUIsUUFBUTtnQkFDUixPQUFPLEVBQUUsYUFBYTtnQkFDdEIsVUFBVSxFQUFFLGVBQWU7Z0JBQzNCLGVBQWUsRUFBRSxXQUFXO2dCQUM1QixjQUFjLEVBQUUsWUFBWTtnQkFDNUIsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDMUIsZ0JBQWdCLEVBQUUsRUFBRTtnQkFDcEIsU0FBUyxFQUFFLFdBQVc7YUFDdkIsQ0FBQyxDQUNILENBQUMsR0FBRyxDQUFDO2dCQUNKLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixJQUFJLEVBQUUsS0FBSztnQkFDWCxRQUFRLEVBQUU7b0JBQ1IsV0FBVyxFQUFFLFNBQVM7b0JBQ3RCLElBQUksRUFBRSxhQUFhO29CQUNuQixTQUFTLEVBQUUsV0FBVztpQkFDdkI7Z0JBQ0QsSUFBSSxFQUFFO29CQUNKLFVBQVUsRUFBRTt3QkFDVjs0QkFDRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQzs0QkFDdEMsS0FBSyxFQUFFLDZCQUFvQjs0QkFDM0IsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsU0FBUyxFQUFFO2dDQUNULE1BQU0sRUFBRTtvQ0FDTixHQUFHLEVBQUUsR0FBRztvQ0FDUixNQUFNLEVBQUUsS0FBSztpQ0FDZDtnQ0FDRCxRQUFRLEVBQUU7b0NBQ1IsR0FBRyxFQUFFLE1BQU07b0NBQ1gsTUFBTSxFQUFFLE9BQU87aUNBQ2hCOzZCQUNGOzRCQUNELFlBQVksRUFBRTtnQ0FDWjtvQ0FDRSxTQUFTLEVBQUUsaUJBQWlCO29DQUM1QixJQUFJLEVBQUUsWUFBWTtvQ0FDbEIsUUFBUSxFQUFFLElBQUk7aUNBQ2Y7Z0NBQ0Q7b0NBQ0UsU0FBUyxFQUFFLFVBQVU7b0NBQ3JCLElBQUksRUFBRSxPQUFPO2lDQUNkOzZCQUNGO3lCQUNGO3FCQUNGO29CQUNELGdCQUFnQixFQUFFLEVBQUU7b0JBQ3BCLGNBQWMsRUFBRTt3QkFDZDs0QkFDRSxPQUFPLEVBQUU7Z0NBQ1AsU0FBUztnQ0FDVCxJQUFJO2dDQUNKLHVMQUF1TDs2QkFDeEw7NEJBQ0QsS0FBSyxFQUFFLDRCQUFnQjs0QkFDdkIsZUFBZSxFQUFFLGNBQWM7NEJBQy9CLElBQUksRUFBRSxNQUFNOzRCQUNaLFlBQVksRUFBRTtnQ0FDWjtvQ0FDRSxTQUFTLEVBQUUsVUFBVTtvQ0FDckIsSUFBSSxFQUFFLE9BQU87aUNBQ2Q7NkJBQ0Y7eUJBQ0Y7cUJBQ0Y7b0JBQ0QscUJBQXFCLEVBQUUsSUFBSTtvQkFDM0IsV0FBVyxFQUFFO3dCQUNYOzRCQUNFLE1BQU0sRUFBRSxZQUFZOzRCQUNwQixHQUFHLEVBQUUsY0FBYzs0QkFDbkIsUUFBUSxFQUFFLE9BQU87NEJBQ2pCLEtBQUssRUFBRSxNQUFNO3lCQUNkO3FCQUNGO29CQUNELE9BQU8sRUFBRTt3QkFDUDs0QkFDRSxJQUFJLEVBQUUsWUFBWTs0QkFDbEIsTUFBTSxFQUFFO2dDQUNOLEtBQUssRUFBRTtvQ0FDTDt3Q0FDRSxHQUFHLEVBQUUsbUJBQW1CO3dDQUN4QixJQUFJLEVBQUUsYUFBYTtxQ0FDcEI7aUNBQ0Y7Z0NBQ0QsVUFBVSxFQUFFLFlBQVk7NkJBQ3pCO3lCQUNGO3dCQUNEOzRCQUNFLFFBQVEsRUFBRSxFQUFFOzRCQUNaLElBQUksRUFBRSxPQUFPO3lCQUNkO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMscUVBQXFFLEVBQUUsR0FBRyxFQUFFO1lBQzdFLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTyxDQUFDLFdBQVcsR0FBRztnQkFDcEMsaUJBQWlCLEVBQUUsVUFBVTthQUM5QixDQUFBO1lBRUQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFPLENBQUMsSUFBSSxHQUFHO2dCQUM3QixXQUFXLEVBQUU7b0JBQ1gsY0FBYyxFQUFFLFdBQVc7aUJBQzVCO2FBQ0YsQ0FBQTtZQUVELE1BQU0sUUFBUSxHQUFHLElBQUEsb0NBQTJCLEVBQUM7Z0JBQzNDLFFBQVE7Z0JBQ1IsT0FBTyxFQUFFLGFBQWE7Z0JBQ3RCLFVBQVUsRUFBRSxlQUFlO2dCQUMzQixlQUFlLEVBQUUsV0FBVztnQkFDNUIsY0FBYyxFQUFFLFlBQVk7Z0JBQzVCLFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUM7Z0JBQzFCLGdCQUFnQixFQUFFLEVBQUU7Z0JBQ3BCLFNBQVMsRUFBRSxXQUFXO2FBQ3ZCLENBQUMsQ0FBQTtZQUVGLElBQUEsYUFBTSxFQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ2hGLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBQzlCLEVBQUUsQ0FBQywrREFBK0QsRUFBRSxHQUFHLEVBQUU7WUFDdkUsSUFBQSxhQUFNLEVBQUMsSUFBQSx1QkFBYyxFQUFDLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDckUsY0FBYztnQkFDZCxjQUFjO2dCQUNkLGNBQWM7YUFDZixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7WUFDL0MsTUFBTSxjQUFjLEdBQUcsNkJBQW9CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUE7WUFDakUsSUFBQSxhQUFNLEVBQUMsSUFBQSx1QkFBYyxFQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDdEUsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1lBQzlCLElBQUEsYUFBTSxFQUFDLElBQUEsdUJBQWMsRUFBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFBO1FBQ3RGLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxJQUFBLGFBQU0sRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLHVCQUFjLEVBQUMsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtRQUN6RyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxxREFBcUQsRUFBRSxHQUFHLEVBQUU7WUFDN0QsSUFBQSxhQUFNLEVBQUMsSUFBQSx1QkFBYyxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsNkJBQW9CLENBQUMsQ0FBQTtZQUM5RCxJQUFBLGFBQU0sRUFBQyxJQUFBLHVCQUFjLEdBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLDZCQUFvQixDQUFDLENBQUE7UUFDOUQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsNkRBQTZELEVBQUUsR0FBRyxFQUFFO1lBQ3JFLElBQUEsYUFBTSxFQUFDLElBQUEsdUJBQWMsRUFBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFBO1FBQ3BILENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUN4QyxJQUFBLGFBQU0sRUFBQyxJQUFBLHVCQUFjLEVBQUMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFBO1FBQ3RHLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9