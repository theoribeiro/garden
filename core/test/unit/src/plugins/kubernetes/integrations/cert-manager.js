"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cert_manager_1 = require("../../../../../../src/plugins/kubernetes/integrations/cert-manager");
const chai_1 = require("chai");
const string_1 = require("../../../../../../src/util/string");
const constants_1 = require("../../../../../../src/plugins/kubernetes/constants");
describe("cert-manager setup", () => {
    const namespace = "testing-namespace";
    const tlsManager = {
        install: true,
        email: "test@garden.io",
        acmeServer: "letsencrypt-staging",
    };
    const testTlsCertificate = {
        name: "test-certificate",
        hostnames: ["test-hostname.garden"],
        secretRef: {
            name: "test-certificate-secret",
            namespace,
        },
    };
    const testCertificate = {
        apiVersion: "cert-manager.io/v1alpha2",
        kind: "Certificate",
        metadata: {
            name: "test-certificate-letsencrypt-staging",
        },
        spec: {
            commonName: "test-hostname.garden",
            dnsNames: ["test-hostname.garden"],
            issuerRef: {
                kind: "ClusterIssuer",
                name: "test-cluster-issuer",
            },
            secretName: "test-certificate-secret",
        },
    };
    const testClusterIssuer = {
        apiVersion: "cert-manager.io/v1alpha2",
        kind: "ClusterIssuer",
        metadata: {
            name: "test-cluster-issuer",
        },
        spec: {
            acme: {
                email: "test@garden.io",
                privateKeySecretRef: {
                    name: "test-certificate-secret",
                },
                server: "https://acme-staging-v02.api.letsencrypt.org/directory",
                solvers: [
                    {
                        http01: {
                            ingress: {
                                class: "nginx",
                            },
                        },
                    },
                ],
            },
        },
    };
    describe("getCertificateFromTls", () => {
        it("should return a valid cert-manager Certificate resource", () => {
            const issuerName = "test-cluster-issuer";
            const certificate = (0, cert_manager_1.getCertificateFromTls)({ tlsManager, tlsCertificate: testTlsCertificate, issuerName });
            (0, chai_1.expect)(certificate).to.eql(testCertificate);
        });
    });
    describe("getClusterIssuerFromTls", () => {
        it("should return a valid cert-manager ClusterIssuer resource", () => {
            const issuerName = "test-cluster-issuer";
            const issuer = (0, cert_manager_1.getClusterIssuerFromTls)({
                name: issuerName,
                ingressClass: constants_1.defaultIngressClass,
                tlsManager,
                tlsCertificate: testTlsCertificate,
            });
            (0, chai_1.expect)(issuer).to.eql(testClusterIssuer);
        });
        it((0, string_1.deline) `should return a valid cert-manager ClusterIssuer resource.
              Server url reflects the serverType parameter.`, () => {
            const issuerName = "test-cluster-issuer";
            const expectedServerUrl = "https://acme-v02.api.letsencrypt.org/directory";
            const prodServerType = "letsencrypt-prod";
            const tlsManagerProd = {
                ...tlsManager,
                acmeServer: prodServerType,
            };
            const issuer = (0, cert_manager_1.getClusterIssuerFromTls)({
                name: issuerName,
                ingressClass: constants_1.defaultIngressClass,
                tlsManager: tlsManagerProd,
                tlsCertificate: testTlsCertificate,
            });
            const { server } = issuer.spec.acme;
            (0, chai_1.expect)(server).to.eql(expectedServerUrl);
        });
    });
    describe("getCertificateName", () => {
        it("should generate a certificate name", () => {
            const expectedName = "test-certificate-letsencrypt-staging";
            const defaultName = (0, cert_manager_1.getCertificateName)(tlsManager, testTlsCertificate);
            (0, chai_1.expect)(defaultName).to.eq(expectedName);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VydC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2VydC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgscUdBSTJFO0FBTTNFLCtCQUE2QjtBQUM3Qiw4REFBMEQ7QUFDMUQsa0ZBQXdGO0FBRXhGLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUE7SUFFckMsTUFBTSxVQUFVLEdBQXNCO1FBQ3BDLE9BQU8sRUFBRSxJQUFJO1FBQ2IsS0FBSyxFQUFFLGdCQUFnQjtRQUN2QixVQUFVLEVBQUUscUJBQXFCO0tBQ2xDLENBQUE7SUFDRCxNQUFNLGtCQUFrQixHQUEwQjtRQUNoRCxJQUFJLEVBQUUsa0JBQWtCO1FBQ3hCLFNBQVMsRUFBRSxDQUFDLHNCQUFzQixDQUFDO1FBQ25DLFNBQVMsRUFBRTtZQUNULElBQUksRUFBRSx5QkFBeUI7WUFDL0IsU0FBUztTQUNWO0tBQ0YsQ0FBQTtJQUVELE1BQU0sZUFBZSxHQUFHO1FBQ3RCLFVBQVUsRUFBRSwwQkFBMEI7UUFDdEMsSUFBSSxFQUFFLGFBQWE7UUFDbkIsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLHNDQUFzQztTQUM3QztRQUNELElBQUksRUFBRTtZQUNKLFVBQVUsRUFBRSxzQkFBc0I7WUFDbEMsUUFBUSxFQUFFLENBQUMsc0JBQXNCLENBQUM7WUFDbEMsU0FBUyxFQUFFO2dCQUNULElBQUksRUFBRSxlQUFlO2dCQUNyQixJQUFJLEVBQUUscUJBQXFCO2FBQzVCO1lBQ0QsVUFBVSxFQUFFLHlCQUF5QjtTQUN0QztLQUNGLENBQUE7SUFFRCxNQUFNLGlCQUFpQixHQUFHO1FBQ3hCLFVBQVUsRUFBRSwwQkFBMEI7UUFDdEMsSUFBSSxFQUFFLGVBQWU7UUFDckIsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLHFCQUFxQjtTQUM1QjtRQUNELElBQUksRUFBRTtZQUNK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