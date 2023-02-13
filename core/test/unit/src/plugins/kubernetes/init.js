"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = require("path");
const testdouble_1 = __importDefault(require("testdouble"));
const init_1 = require("../../../../../src/plugins/kubernetes/init");
const constants_1 = require("../../../../../src/plugins/kubernetes/constants");
const exceptions_1 = require("../../../../../src/exceptions");
const config_1 = require("../../../../../src/plugins/kubernetes/config");
const container_1 = require("../../../../../src/plugins/container/container");
const system_1 = require("../../../../../src/plugins/kubernetes/system");
const api_1 = require("../../../../../src/plugins/kubernetes/api");
const helpers_1 = require("../../../../helpers");
const kubectl_1 = require("../../../../../src/plugins/kubernetes/kubectl");
const ext_tools_1 = require("../../../../../src/util/ext-tools");
const basicConfig = {
    name: "kubernetes",
    buildMode: "local-docker",
    context: "my-cluster",
    defaultHostname: "my.domain.com",
    deploymentRegistry: {
        hostname: "foo.garden",
        port: 5000,
        namespace: "boo",
        insecure: true,
    },
    forceSsl: false,
    gardenSystemNamespace: system_1.defaultSystemNamespace,
    imagePullSecrets: [
        {
            name: "test-docker-auth",
            namespace: "default",
        },
        {
            name: "test-cred-helper-auth",
            namespace: "default",
        },
    ],
    copySecrets: [
        {
            name: "test-shared-secret",
            namespace: "default",
        },
    ],
    ingressClass: "nginx",
    ingressHttpPort: 80,
    ingressHttpsPort: 443,
    resources: config_1.defaultResources,
    setupIngressController: null,
    systemNodeSelector: {},
    tlsCertificates: [],
    _systemServices: [],
};
const basicProvider = {
    name: "kubernetes",
    config: basicConfig,
    dependencies: {},
    moduleConfigs: [],
    status: { ready: true, outputs: {} },
    dashboardPages: [],
    outputs: {},
    state: "ready",
};
const dockerSimpleAuthSecret = {
    apiVersion: "v1",
    kind: "Secret",
    type: "kubernetes.io/dockerconfigjson",
    metadata: {
        name: "test-docker-auth",
        namespace: "default",
    },
    data: {
        ".dockerconfigjson": Buffer.from(JSON.stringify({ auths: { myDockerRepo: "simple-auth" }, experimental: "enabled" })).toString("base64"),
    },
};
const dockerCredentialHelperSecret = {
    apiVersion: "v1",
    kind: "Secret",
    type: "kubernetes.io/dockerconfigjson",
    metadata: {
        name: "test-cred-helper-auth",
        namespace: "default",
    },
    data: {
        ".dockerconfigjson": Buffer.from(JSON.stringify({ credHelpers: { myDockerRepo: "ecr-helper" }, experimental: "enabled" })).toString("base64"),
    },
};
const kubeConfigEnvVar = process.env.KUBECONFIG;
describe("kubernetes init", () => {
    const projectRoot = (0, helpers_1.getDataDir)("test-project-container");
    let garden;
    let ctx;
    let api;
    before(() => {
        process.env.KUBECONFIG = (0, path_1.join)(projectRoot, "kubeconfig.yml");
    });
    after(() => {
        if (kubeConfigEnvVar) {
            process.env.KUBECONFIG = kubeConfigEnvVar;
        }
        else {
            delete process.env.KUBECONFIG;
        }
    });
    function jsonLoadBase64(data) {
        return JSON.parse(Buffer.from(data, "base64").toString());
    }
    beforeEach(async () => {
        garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, container_1.gardenPlugin)()] });
        ctx = await garden.getPluginContext({ provider: basicProvider, templateContext: undefined, events: undefined });
        ctx.tools["kubernetes.kubectl"] = new ext_tools_1.PluginTool(kubectl_1.kubectlSpec);
        api = await api_1.KubeApi.factory(garden.log, ctx, basicProvider);
    });
    describe("kubernetes init", () => {
        describe("when simple login or cred helpers are present", () => {
            beforeEach(async () => {
                const core = testdouble_1.default.replace(api, "core");
                testdouble_1.default.when(core.listNamespace()).thenResolve({
                    items: [{ status: { phase: "Active" }, metadata: { name: "default" } }],
                });
                testdouble_1.default.when(core.readNamespacedSecret("test-docker-auth", "default")).thenResolve(dockerSimpleAuthSecret);
                testdouble_1.default.when(core.readNamespacedSecret("test-cred-helper-auth", "default")).thenResolve(dockerCredentialHelperSecret);
                testdouble_1.default.replace(api, "upsert");
            });
            it("should merge both", async () => {
                const res = await (0, init_1.prepareDockerAuth)(api, basicProvider, "default");
                const dockerAuth = jsonLoadBase64(res.data[constants_1.dockerAuthSecretKey]);
                (0, chai_1.expect)(dockerAuth).to.haveOwnProperty("auths");
                (0, chai_1.expect)(dockerAuth.auths.myDockerRepo).to.equal("simple-auth");
                (0, chai_1.expect)(dockerAuth).to.haveOwnProperty("credHelpers");
                (0, chai_1.expect)(dockerAuth.credHelpers.myDockerRepo).to.equal("ecr-helper");
            });
        });
        describe("when both simple login and cred helpers are missing", () => {
            beforeEach(async () => {
                const core = testdouble_1.default.replace(api, "core");
                const emptyDockerSimpleAuthSecret = {
                    apiVersion: "v1",
                    kind: "Secret",
                    type: "kubernetes.io/dockerconfigjson",
                    metadata: {
                        name: "test-docker-auth",
                        namespace: "default",
                    },
                    data: {
                        ".dockerconfigjson": Buffer.from(JSON.stringify({ experimental: "enabled" })).toString("base64"),
                    },
                };
                const emptyDockerCredentialHelperSecret = {
                    apiVersion: "v1",
                    kind: "Secret",
                    type: "kubernetes.io/dockerconfigjson",
                    metadata: {
                        name: "test-cred-helper-auth",
                        namespace: "default",
                    },
                    data: {
                        ".dockerconfigjson": Buffer.from(JSON.stringify({ experimental: "enabled" })).toString("base64"),
                    },
                };
                testdouble_1.default.when(core.listNamespace()).thenResolve({
                    items: [{ status: { phase: "Active" }, metadata: { name: "default" } }],
                });
                testdouble_1.default.when(core.readNamespacedSecret("test-docker-auth", "default")).thenResolve(emptyDockerSimpleAuthSecret);
                testdouble_1.default.when(core.readNamespacedSecret("test-cred-helper-auth", "default")).thenResolve(emptyDockerCredentialHelperSecret);
                testdouble_1.default.replace(api, "upsert");
            });
            it("should fail when both are missing", async () => {
                await (0, helpers_1.expectError)(() => (0, init_1.prepareDockerAuth)(api, basicProvider, "default"), (e) => (0, chai_1.expect)(e).to.be.instanceof(exceptions_1.ConfigurationError));
            });
        });
    });
    describe("ingress and networking check", () => {
        const ingressClassResourceName = "name-for-testing";
        beforeEach(async () => {
            garden = await (0, helpers_1.makeTestGarden)(projectRoot, { plugins: [(0, container_1.gardenPlugin)()] });
            testdouble_1.default.replace(api, "listResources", async () => ({
                items: [{ metadata: { name: ingressClassResourceName } }],
            }));
        });
        after(() => {
            testdouble_1.default.reset();
        });
        it("should warn if custom ingressclass has been set but no matching resource exists with v1 api", async () => {
            const warnings = await (0, init_1.getIngressMisconfigurationWarnings)("custom-name", "networking.k8s.io/v1", garden.log, api);
            (0, chai_1.expect)(warnings.length).to.be.eq(1);
            (0, chai_1.expect)(warnings[0]).to.include("no matching IngressClass resource was found in the cluster");
        });
        it("should not warn if custom ingressclass has not been set", async () => {
            const undefinedIngressName = undefined;
            const warnings = await (0, init_1.getIngressMisconfigurationWarnings)(undefinedIngressName, "networking.k8s.io/v1", garden.log, api);
            (0, chai_1.expect)(warnings.length).to.be.eq(0);
        });
        it("should not warn if custom ingressclass has been set but older api is used", async () => {
            const warnings = await (0, init_1.getIngressMisconfigurationWarnings)("custom-name", "networking.k8s.io/v1beta1", garden.log, api);
            (0, chai_1.expect)(warnings.length).to.be.eq(0);
        });
        it("should not warn if custom ingressclass has not been set but older api is used", async () => {
            const undefinedIngressName = undefined;
            const warnings = await (0, init_1.getIngressMisconfigurationWarnings)(undefinedIngressName, "networking.k8s.io/v1beta1", garden.log, api);
            (0, chai_1.expect)(warnings.length).to.be.eq(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCwrQkFBNkI7QUFDN0IsK0JBQTJCO0FBQzNCLDREQUEyQjtBQUUzQixxRUFBa0g7QUFDbEgsK0VBQXFGO0FBQ3JGLDhEQUFrRTtBQUNsRSx5RUFBcUg7QUFDckgsOEVBQTZFO0FBQzdFLHlFQUFxRjtBQUNyRixtRUFBbUU7QUFDbkUsaURBQTZFO0FBSTdFLDJFQUEyRTtBQUMzRSxpRUFBOEQ7QUFFOUQsTUFBTSxXQUFXLEdBQXFCO0lBQ3BDLElBQUksRUFBRSxZQUFZO0lBQ2xCLFNBQVMsRUFBRSxjQUFjO0lBQ3pCLE9BQU8sRUFBRSxZQUFZO0lBQ3JCLGVBQWUsRUFBRSxlQUFlO0lBQ2hDLGtCQUFrQixFQUFFO1FBQ2xCLFFBQVEsRUFBRSxZQUFZO1FBQ3RCLElBQUksRUFBRSxJQUFJO1FBQ1YsU0FBUyxFQUFFLEtBQUs7UUFDaEIsUUFBUSxFQUFFLElBQUk7S0FDZjtJQUNELFFBQVEsRUFBRSxLQUFLO0lBQ2YscUJBQXFCLEVBQUUsK0JBQXNCO0lBQzdDLGdCQUFnQixFQUFFO1FBQ2hCO1lBQ0UsSUFBSSxFQUFFLGtCQUFrQjtZQUN4QixTQUFTLEVBQUUsU0FBUztTQUNyQjtRQUNEO1lBQ0UsSUFBSSxFQUFFLHVCQUF1QjtZQUM3QixTQUFTLEVBQUUsU0FBUztTQUNyQjtLQUNGO0lBQ0QsV0FBVyxFQUFFO1FBQ1g7WUFDRSxJQUFJLEVBQUUsb0JBQW9CO1lBQzFCLFNBQVMsRUFBRSxTQUFTO1NBQ3JCO0tBQ0Y7SUFDRCxZQUFZLEVBQUUsT0FBTztJQUNyQixlQUFlLEVBQUUsRUFBRTtJQUNuQixnQkFBZ0IsRUFBRSxHQUFHO0lBQ3JCLFNBQVMsRUFBRSx5QkFBZ0I7SUFDM0Isc0JBQXNCLEVBQUUsSUFBSTtJQUM1QixrQkFBa0IsRUFBRSxFQUFFO0lBQ3RCLGVBQWUsRUFBRSxFQUFFO0lBQ25C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