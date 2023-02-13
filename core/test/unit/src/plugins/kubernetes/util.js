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
const lodash_1 = require("lodash");
const util_1 = require("../../../../../src/plugins/kubernetes/util");
const util_2 = require("../../../../../src/util/util");
describe("deduplicatePodsByLabel", () => {
    it("should return a list of pods, unique by label so that the latest pod is kept", () => {
        const podA = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                creationTimestamp: new Date("2019-11-12T14:44:26Z"),
                labels: {
                    module: "a",
                    service: "a",
                },
            },
            spec: {},
        };
        const podADupe = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                creationTimestamp: new Date("2019-11-11T14:44:26Z"),
                labels: {
                    module: "a",
                    service: "a",
                },
            },
        };
        const podUndefinedLabelA = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                creationTimestamp: new Date("2019-11-13T14:44:26Z"),
                labels: undefined,
            },
        };
        const podUndefinedLabelB = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                creationTimestamp: new Date("2019-11-14T14:44:26Z"),
                labels: undefined,
            },
        };
        const podEmptyLabelA = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                creationTimestamp: new Date("2019-11-15T14:44:26Z"),
                labels: {},
            },
        };
        const podEmptyLabelB = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                creationTimestamp: new Date("2019-11-16T14:44:26Z"),
                labels: {},
            },
        };
        const uniq = (0, util_1.deduplicatePodsByLabel)([
            podA,
            podADupe,
            podUndefinedLabelA,
            podUndefinedLabelB,
            podEmptyLabelA,
            podEmptyLabelB,
        ]);
        const expected = (0, lodash_1.sortBy)([podA, podUndefinedLabelA, podUndefinedLabelB, podEmptyLabelA, podEmptyLabelB], (pod) => pod.metadata.creationTimestamp);
        (0, chai_1.expect)(uniq).to.eql(expected);
    });
});
describe("millicpuToString", () => {
    it("should return a string suffixed with 'm'", () => {
        (0, chai_1.expect)((0, util_1.millicpuToString)(300)).to.equal("300m");
    });
    it("should return whole thousands as a single integer string", () => {
        (0, chai_1.expect)((0, util_1.millicpuToString)(3000)).to.equal("3");
    });
    it("should round off floating points", () => {
        (0, chai_1.expect)((0, util_1.millicpuToString)(100.5)).to.equal("100m");
    });
});
describe("kilobytesToString", () => {
    it("should return whole exabytes with an Ei suffix", () => {
        (0, chai_1.expect)((0, util_1.kilobytesToString)(2 * 1024 ** 5)).to.equal("2Ei");
    });
    it("should return whole petabytes with a Pi suffix", () => {
        (0, chai_1.expect)((0, util_1.kilobytesToString)(3 * 1024 ** 4)).to.equal("3Pi");
    });
    it("should return whole terabytes with a Ti suffix", () => {
        (0, chai_1.expect)((0, util_1.kilobytesToString)(1 * 1024 ** 3)).to.equal("1Ti");
    });
    it("should return whole gigabytes with a Gi suffix", () => {
        (0, chai_1.expect)((0, util_1.kilobytesToString)(7 * 1024 ** 2)).to.equal("7Gi");
    });
    it("should return whole megabytes with an Mi suffix", () => {
        (0, chai_1.expect)((0, util_1.kilobytesToString)(2 * 1024 ** 1)).to.equal("2Mi");
    });
    it("should otherwise return the kilobytes with a Ki suffix", () => {
        (0, chai_1.expect)((0, util_1.kilobytesToString)(1234)).to.equal("1234Ki");
    });
    it("should round off floating points", () => {
        (0, chai_1.expect)((0, util_1.kilobytesToString)(100.5)).to.equal("100Ki");
    });
});
describe("flattenResources", () => {
    it("should return resources that don't include resources of kind List as they were", () => {
        const resources = [
            {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    name: "a",
                },
            },
            {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    name: "b",
                },
            },
        ];
        (0, chai_1.expect)((0, util_1.flattenResources)(resources).map((r) => r.metadata.name)).to.eql(["a", "b"]);
    });
    it("should flatten resourcess that contain resources of kind List", () => {
        const resources = [
            {
                apiVersion: "v1",
                items: [
                    {
                        apiVersion: "v1",
                        kind: "ServiceAccount",
                        metadata: {
                            name: "a",
                        },
                    },
                    {
                        apiVersion: "v1",
                        kind: "ServiceAccount",
                        metadata: {
                            name: "b",
                        },
                    },
                ],
                kind: "List",
                metadata: {
                    name: "foo",
                },
            },
        ];
        (0, chai_1.expect)((0, util_1.flattenResources)(resources).map((r) => r.metadata.name)).to.eql(["a", "b"]);
    });
    it("should flatten resources that contain List and non-List resources", () => {
        const resources = [
            {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    name: "a",
                },
            },
            {
                apiVersion: "v1",
                items: [
                    {
                        apiVersion: "v1",
                        kind: "ServiceAccount",
                        metadata: {
                            name: "b",
                        },
                    },
                    {
                        apiVersion: "v1",
                        kind: "ServiceAccount",
                        metadata: {
                            name: "c",
                        },
                    },
                ],
                kind: "List",
                metadata: {
                    name: "foo",
                },
            },
            {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    name: "d",
                },
            },
        ];
        (0, chai_1.expect)((0, util_1.flattenResources)(resources).map((r) => r.metadata.name)).to.eql(["a", "b", "c", "d"]);
    });
    it("should not flatten List resources that don't have apiVersion v1", () => {
        const resources = [
            {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    name: "a",
                },
            },
            {
                apiVersion: "v2",
                items: [
                    {
                        apiVersion: "v1",
                        kind: "ServiceAccount",
                        metadata: {
                            name: "b",
                        },
                    },
                    {
                        apiVersion: "v1",
                        kind: "ServiceAccount",
                        metadata: {
                            name: "c",
                        },
                    },
                ],
                kind: "List",
                metadata: {
                    name: "d",
                },
            },
            {
                apiVersion: "v2",
                kind: "ServiceAccount",
                metadata: {
                    name: "e",
                },
            },
        ];
        (0, chai_1.expect)((0, util_1.flattenResources)(resources).map((r) => r.metadata.name)).to.eql(["a", "d", "e"]);
    });
});
describe("getStaticLabelsFromPod", () => {
    it("should should only select labels without characters", () => {
        const pod = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                creationTimestamp: new Date("2019-11-12T14:44:26Z"),
                labels: {
                    module: "a",
                    service: "a",
                    lean: "5",
                    checksum: "a1b2c3d4",
                },
            },
            spec: {},
        };
        const labels = (0, util_1.getStaticLabelsFromPod)(pod);
        (0, chai_1.expect)(labels).to.eql({
            module: "a",
            service: "a",
        });
    });
});
describe("getSelectorString", () => {
    it("should format a label map to comma separated key value string ", () => {
        const labels = {
            module: "a",
            service: "a",
        };
        const selectorString = (0, util_1.getSelectorString)(labels);
        (0, chai_1.expect)(selectorString).to.eql("module=a,service=a");
    });
});
describe("makePodName", () => {
    it("should create a unique pod name with a hash suffix", () => {
        const name = (0, util_1.makePodName)("test", "some-module");
        (0, chai_1.expect)(name.slice(0, -7)).to.equal("test-some-module");
    });
    it("should optionally include a secondary key", () => {
        const name = (0, util_1.makePodName)("test", "some-module", "unit");
        (0, chai_1.expect)(name.slice(0, -7)).to.equal("test-some-module-unit");
    });
    it("should create different pod names at different times for the same inputs", async () => {
        const nameA = (0, util_1.makePodName)("test", "some-module", "unit");
        await (0, util_2.sleep)(100);
        const nameB = (0, util_1.makePodName)("test", "some-module", "unit");
        (0, chai_1.expect)(nameA).to.not.equal(nameB);
    });
    it("should truncate the pod name if necessary", () => {
        const name = (0, util_1.makePodName)("test", "some-module-with-a-really-unnecessarily-long-name", "really-long-test-name-too");
        (0, chai_1.expect)(name.length).to.equal(63);
        (0, chai_1.expect)(name.slice(0, -7)).to.equal("test-some-module-with-a-really-unnecessarily-long-name-r");
    });
});
describe("matchSelector", () => {
    it("should return false if selector is empty", () => {
        const matched = (0, util_1.matchSelector)({}, { foo: "bar" });
        (0, chai_1.expect)(matched).to.be.false;
    });
    it("should return false if selector contains key missing from labels", () => {
        const matched = (0, util_1.matchSelector)({ foo: "bar" }, { nope: "nyet" });
        (0, chai_1.expect)(matched).to.be.false;
    });
    it("should return false if selector contains value mismatched with a label", () => {
        const matched = (0, util_1.matchSelector)({ foo: "bar" }, { foo: "nyet" });
        (0, chai_1.expect)(matched).to.be.false;
    });
    it("should return true if selector matches labels exactly", () => {
        const matched = (0, util_1.matchSelector)({ foo: "bar" }, { foo: "bar" });
        (0, chai_1.expect)(matched).to.be.true;
    });
    it("should return true if selector is a subset of labels", () => {
        const matched = (0, util_1.matchSelector)({ foo: "bar" }, { foo: "bar", something: "else" });
        (0, chai_1.expect)(matched).to.be.true;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0IsbUNBQStCO0FBQy9CLHFFQVNtRDtBQUduRCx1REFBb0Q7QUFFcEQsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtJQUN0QyxFQUFFLENBQUMsOEVBQThFLEVBQUUsR0FBRyxFQUFFO1FBQ3RGLE1BQU0sSUFBSSxHQUFJO1lBQ1osVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFLEtBQUs7WUFDWCxRQUFRLEVBQUU7Z0JBQ1IsaUJBQWlCLEVBQUUsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUM7Z0JBQ25ELE1BQU0sRUFBRTtvQkFDTixNQUFNLEVBQUUsR0FBRztvQkFDWCxPQUFPLEVBQUUsR0FBRztpQkFDYjthQUNGO1lBQ0QsSUFBSSxFQUFFLEVBQUU7U0FDc0MsQ0FBQTtRQUNoRCxNQUFNLFFBQVEsR0FBSTtZQUNoQixVQUFVLEVBQUUsSUFBSTtZQUNoQixJQUFJLEVBQUUsS0FBSztZQUNYLFFBQVEsRUFBRTtnQkFDUixpQkFBaUIsRUFBRSxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztnQkFDbkQsTUFBTSxFQUFFO29CQUNOLE1BQU0sRUFBRSxHQUFHO29CQUNYLE9BQU8sRUFBRSxHQUFHO2lCQUNiO2FBQ0Y7U0FDNkMsQ0FBQTtRQUNoRCxNQUFNLGtCQUFrQixHQUFJO1lBQzFCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLElBQUksRUFBRSxLQUFLO1lBQ1gsUUFBUSxFQUFFO2dCQUNSLGlCQUFpQixFQUFFLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDO2dCQUNuRCxNQUFNLEVBQUUsU0FBUzthQUNsQjtTQUM2QyxDQUFBO1FBQ2hELE1BQU0sa0JBQWtCLEdBQUk7WUFDMUIsVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFLEtBQUs7WUFDWCxRQUFR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