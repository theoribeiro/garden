"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const kubernetes_1 = require("../../../../../src/plugins/kubernetes/kubernetes");
const config_1 = require("../../../../../src/plugins/kubernetes/config");
const system_1 = require("../../../../../src/plugins/kubernetes/system");
const chai_1 = require("chai");
const helpers_1 = require("../../../../helpers");
const provider_1 = require("../../../../../src/config/provider");
const cli_1 = require("../../../../../src/cli/cli");
describe("kubernetes configureProvider", () => {
    const basicConfig = {
        name: "kubernetes",
        buildMode: "local-docker",
        context: "my-cluster",
        defaultHostname: "my.domain.com",
        deploymentRegistry: {
            hostname: "eu.gcr.io",
            namespace: "garden-ci",
            insecure: false,
        },
        forceSsl: false,
        gardenSystemNamespace: system_1.defaultSystemNamespace,
        imagePullSecrets: [],
        copySecrets: [],
        ingressClass: "nginx",
        ingressHttpPort: 80,
        ingressHttpsPort: 443,
        resources: config_1.defaultResources,
        setupIngressController: null,
        systemNodeSelector: {},
        tlsCertificates: [],
        _systemServices: [],
    };
    let tmpDir;
    let garden;
    beforeEach(async () => {
        tmpDir = await (0, helpers_1.makeTempDir)({ git: true });
        garden = await (0, cli_1.makeDummyGarden)(tmpDir.path, { commandInfo: { name: "test", args: {}, opts: {} } });
    });
    afterEach(async () => {
        await tmpDir.cleanup();
    });
    async function configure(config) {
        return (0, kubernetes_1.configureProvider)({
            ctx: await garden.getPluginContext({
                provider: (0, provider_1.providerFromConfig)({
                    plugin: (0, kubernetes_1.gardenPlugin)(),
                    config,
                    dependencies: {},
                    moduleConfigs: [],
                    status: { ready: false, outputs: {} },
                }),
                templateContext: undefined,
                events: undefined,
            }),
            namespace: "default",
            environmentName: "default",
            projectName: garden.projectName,
            projectRoot: garden.projectRoot,
            config,
            log: garden.log,
            dependencies: {},
            configStore: garden.configStore,
        });
    }
    it("should apply a default namespace if none is configured", async () => {
        const result = await configure({
            ...basicConfig,
            buildMode: "kaniko",
            namespace: undefined,
        });
        (0, chai_1.expect)(result.config.namespace).to.eql({
            name: `${garden.projectName}-default`,
        });
    });
    it("should convert the string shorthand for the namespace parameter", async () => {
        const result = await configure({
            ...basicConfig,
            buildMode: "kaniko",
            namespace: "foo",
        });
        (0, chai_1.expect)(result.config.namespace).to.eql({
            name: "foo",
        });
    });
    it("should pass through a full namespace spec", async () => {
        const result = await configure({
            ...basicConfig,
            buildMode: "kaniko",
            namespace: {
                name: "foo",
                annotations: { bla: "ble" },
                labels: { fla: "fle" },
            },
        });
        (0, chai_1.expect)(result.config.namespace).to.eql({
            name: "foo",
            annotations: { bla: "ble" },
            labels: { fla: "fle" },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia3ViZXJuZXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImt1YmVybmV0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxpRkFBa0c7QUFDbEcseUVBQWlHO0FBQ2pHLHlFQUFxRjtBQUNyRiwrQkFBNkI7QUFDN0IsaURBQWdFO0FBQ2hFLGlFQUF1RTtBQUV2RSxvREFBNEQ7QUFFNUQsUUFBUSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtJQUM1QyxNQUFNLFdBQVcsR0FBcUI7UUFDcEMsSUFBSSxFQUFFLFlBQVk7UUFDbEIsU0FBUyxFQUFFLGNBQWM7UUFDekIsT0FBTyxFQUFFLFlBQVk7UUFDckIsZUFBZSxFQUFFLGVBQWU7UUFDaEMsa0JBQWtCLEVBQUU7WUFDbEIsUUFBUSxFQUFFLFdBQVc7WUFDckIsU0FBUyxFQUFFLFdBQVc7WUFDdEIsUUFBUSxFQUFFLEtBQUs7U0FDaEI7UUFDRCxRQUFRLEVBQUUsS0FBSztRQUNmLHFCQUFxQixFQUFFLCtCQUFzQjtRQUM3QyxnQkFBZ0IsRUFBRSxFQUFFO1FBQ3BCLFdBQVcsRUFBRSxFQUFFO1FBQ2YsWUFBWSxFQUFFLE9BQU87UUFDckIsZUFBZSxFQUFFLEVBQUU7UUFDbkIsZ0JBQWdCLEVBQUUsR0FBRztRQUNyQixTQUFTLEVBQUUseUJBQWdCO1FBQzNCLHNCQUFzQixFQUFFLElBQUk7UUFDNUIsa0JBQWtCLEVBQUUsRUFBRTtRQUN0QixlQUFlLEVBQUUsRUFBRTtRQUNuQixlQUFlLEVBQUUsRUFBRTtLQUNwQixDQUFBO0lBRUQsSUFBSSxNQUFxQixDQUFBO0lBQ3pCLElBQUksTUFBYyxDQUFBO0lBRWxCLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLEdBQUcsTUFBTSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUN6QyxNQUFNLEdBQUcsTUFBTSxJQUFBLHFCQUFlLEVBQUMsTUFB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