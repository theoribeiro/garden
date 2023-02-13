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
const validation_1 = require("../../../../src/config/validation");
const config_1 = require("../../../../src/plugins/container/config");
describe("portSchema", () => {
    it("should default servicePort to containerPorts value", async () => {
        const containerPort = 8080;
        const obj = { name: "a", containerPort };
        const value = (0, validation_1.validateSchema)(obj, (0, config_1.portSchema)());
        (0, chai_1.expect)(value["servicePort"]).to.equal(containerPort);
    });
    it("should not default servicePort to containerPorts when configured", async () => {
        const containerPort = 8080;
        const servicePort = 9090;
        const obj = { name: "a", containerPort, servicePort };
        const value = (0, validation_1.validateSchema)(obj, (0, config_1.portSchema)());
        (0, chai_1.expect)(value["servicePort"]).to.equal(servicePort);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTZCO0FBQzdCLGtFQUFrRTtBQUNsRSxxRUFBcUU7QUFFckUsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFDMUIsRUFBRSxDQUFDLG9EQUFvRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2xFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQTtRQUMxQixNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLENBQUE7UUFFeEMsTUFBTSxLQUFLLEdBQUcsSUFBQSwyQkFBYyxFQUFDLEdBQUcsRUFBRSxJQUFBLG1CQUFVLEdBQUUsQ0FBQyxDQUFBO1FBQy9DLElBQUEsYUFBTSxFQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUE7SUFDdEQsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsa0VBQWtFLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDaEYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFBO1FBQzFCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQTtRQUN4QixNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFBO1FBRXJELE1BQU0sS0FBSyxHQUFHLElBQUEsMkJBQWMsRUFBQyxHQUFHLEVBQUUsSUFBQSxtQkFBVSxHQUFFLENBQUMsQ0FBQTtRQUMvQyxJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFBO0lBQ3BELENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==