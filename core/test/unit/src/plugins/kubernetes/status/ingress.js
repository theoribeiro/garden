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
const ingress_1 = require("../../../../../../src/plugins/kubernetes/status/ingress");
describe("getK8sIngresses", () => {
    it("ignores non-Ingress resources", () => {
        const resources = [
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "foo",
                },
                spec: {},
            },
            {
                apiVersion: "v1",
                kind: "Deployment",
                metadata: {
                    name: "foo",
                },
                spec: {},
            },
        ];
        (0, chai_1.expect)((0, ingress_1.getK8sIngresses)(resources)).to.eql([]);
    });
    it("picks up extensions/v1beta1 Ingress resource", () => {
        const ingress = {
            apiVersion: "extensions/v1beta1",
            kind: "Ingress",
            metadata: {
                name: "foo",
            },
            spec: {
                rules: [
                    {
                        host: "a.com",
                        http: {
                            paths: [
                                { path: "/a1", backend: { serviceName: "one" } },
                                { path: "/a2", backend: { serviceName: "two" } },
                            ],
                        },
                    },
                    {
                        host: "b.com",
                        http: {
                            paths: [
                                { path: "/b1", backend: { serviceName: "one" } },
                                { path: "/b2", backend: { serviceName: "two" } },
                            ],
                        },
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, ingress_1.getK8sIngresses)([ingress])).to.eql([
            {
                hostname: "a.com",
                path: "/a1",
                protocol: "http",
            },
            {
                hostname: "a.com",
                path: "/a2",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b1",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b2",
                protocol: "http",
            },
        ]);
    });
    it("picks up networking.k8s.io/v1beta1 Ingress resource", () => {
        const ingress = {
            apiVersion: "networking.k8s.io/v1beta1",
            kind: "Ingress",
            metadata: {
                name: "foo",
            },
            spec: {
                rules: [
                    {
                        host: "a.com",
                        http: {
                            paths: [
                                { path: "/a1", backend: { serviceName: "one" } },
                                { path: "/a2", backend: { serviceName: "two" } },
                            ],
                        },
                    },
                    {
                        host: "b.com",
                        http: {
                            paths: [
                                { path: "/b1", backend: { serviceName: "one" } },
                                { path: "/b2", backend: { serviceName: "two" } },
                            ],
                        },
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, ingress_1.getK8sIngresses)([ingress])).to.eql([
            {
                hostname: "a.com",
                path: "/a1",
                protocol: "http",
            },
            {
                hostname: "a.com",
                path: "/a2",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b1",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b2",
                protocol: "http",
            },
        ]);
    });
    it("picks up networking.k8s.io/v1 Ingress resource", () => {
        const ingress = {
            apiVersion: "networking.k8s.io/v1beta1",
            kind: "Ingress",
            metadata: {
                name: "foo",
            },
            spec: {
                rules: [
                    {
                        host: "a.com",
                        http: {
                            paths: [
                                { path: "/a1", pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { path: "/a2", pathType: "ImplementationSpecific", backend: { service: { name: "two" } } },
                            ],
                        },
                    },
                    {
                        host: "b.com",
                        http: {
                            paths: [
                                { path: "/b1", pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { path: "/b2", pathType: "ImplementationSpecific", backend: { service: { name: "two" } } },
                            ],
                        },
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, ingress_1.getK8sIngresses)([ingress])).to.eql([
            {
                hostname: "a.com",
                path: "/a1",
                protocol: "http",
            },
            {
                hostname: "a.com",
                path: "/a2",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b1",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b2",
                protocol: "http",
            },
        ]);
    });
    it("sets https protocol if host is in tls.hosts", () => {
        const ingress = {
            apiVersion: "networking.k8s.io/v1beta1",
            kind: "Ingress",
            metadata: {
                name: "foo",
            },
            spec: {
                rules: [
                    {
                        host: "a.com",
                        http: {
                            paths: [
                                { path: "/a1", pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { path: "/a2", pathType: "ImplementationSpecific", backend: { service: { name: "two" } } },
                            ],
                        },
                    },
                    {
                        host: "b.com",
                        http: {
                            paths: [
                                { path: "/b1", pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { path: "/b2", pathType: "ImplementationSpecific", backend: { service: { name: "two" } } },
                            ],
                        },
                    },
                ],
                tls: [{ hosts: ["b.com", "c.com"] }],
            },
        };
        (0, chai_1.expect)((0, ingress_1.getK8sIngresses)([ingress])).to.eql([
            {
                hostname: "a.com",
                path: "/a1",
                protocol: "http",
            },
            {
                hostname: "a.com",
                path: "/a2",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b1",
                protocol: "https",
            },
            {
                hostname: "b.com",
                path: "/b2",
                protocol: "https",
            },
        ]);
    });
    it("ignores rule without hosts set", () => {
        const ingress = {
            apiVersion: "networking.k8s.io/v1beta1",
            kind: "Ingress",
            metadata: {
                name: "foo",
            },
            spec: {
                rules: [
                    {
                        host: "a.com",
                        http: {
                            paths: [
                                { path: "/a1", pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { path: "/a2", pathType: "ImplementationSpecific", backend: { service: { name: "two" } } },
                            ],
                        },
                    },
                    {
                        // host: "b.com", <---
                        http: {
                            paths: [
                                { path: "/b1", pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { path: "/b2", pathType: "ImplementationSpecific", backend: { service: { name: "two" } } },
                            ],
                        },
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, ingress_1.getK8sIngresses)([ingress])).to.eql([
            {
                hostname: "a.com",
                path: "/a1",
                protocol: "http",
            },
            {
                hostname: "a.com",
                path: "/a2",
                protocol: "http",
            },
        ]);
    });
    it("ignores rule path without path field set", () => {
        const ingress = {
            apiVersion: "networking.k8s.io/v1beta1",
            kind: "Ingress",
            metadata: {
                name: "foo",
            },
            spec: {
                rules: [
                    {
                        host: "a.com",
                        http: {
                            paths: [
                                { path: "/a1", pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { pathType: "ImplementationSpecific", backend: { service: { name: "two" } } }, // <---
                            ],
                        },
                    },
                    {
                        host: "b.com",
                        http: {
                            paths: [
                                { pathType: "ImplementationSpecific", backend: { service: { name: "one" } } },
                                { path: "/b2", pathType: "ImplementationSpecific", backend: { service: { name: "two" } } },
                            ],
                        },
                    },
                ],
                tls: [{ hosts: ["b.com", "c.com"] }],
            },
        };
        (0, chai_1.expect)((0, ingress_1.getK8sIngresses)([ingress])).to.eql([
            {
                hostname: "a.com",
                path: "/a1",
                protocol: "http",
            },
            {
                hostname: "b.com",
                path: "/b2",
                protocol: "https",
            },
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5ncmVzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluZ3Jlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFHSCwrQkFBNkI7QUFDN0IscUZBQXlGO0FBR3pGLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsRUFBRSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLFNBQVMsR0FBeUI7WUFDdEM7Z0JBQ0UsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLElBQUksRUFBRSxTQUFTO2dCQUNmLFFBQVEsRUFBRTtvQkFDUixJQUFJLEVBQUUsS0FBSztpQkFDWjtnQkFDRCxJQUFJLEVBQUUsRUFBRTthQUNUO1lBQ0Q7Z0JBQ0UsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLElBQUksRUFBRSxZQUFZO2dCQUNsQixRQUFRLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLEtBQUs7aUJBQ1o7Z0JBQ0QsSUFBSSxFQUFFLEVBQUU7YUFDVDtTQUNGLENBQUE7UUFDRCxJQUFBLGFBQU0sRUFBQyxJQUFBLHlCQUFlLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQy9DLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEdBQUcsRUFBRTtRQUN0RCxNQUFNLE9BQU8sR0FBNEI7WUFDdkMsVUFBVSxFQUFFLG9CQUFvQjtZQUNoQyxJQUFJLEVBQUUsU0FBUztZQUNmLFFBQVEsRUFBRTtnQkFDUixJQUFJLEVBQUUsS0FBSzthQUNaO1lBQ0QsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRTtvQkFDTDt3QkFDRSxJQUFJLEVBQUUsT0FBTzt3QkFDYixJQUFJLEVBQUU7NEJBQ0osS0FBSyxFQUFFO2dDQUNMLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEVBQUU7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