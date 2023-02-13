/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
describe("actionConfigsToGraph", () => {
    it("resolves actions in groups", async () => {
        throw "TODO";
    });
    it("resolves a Build action", async () => {
        throw "TODO";
    });
    it("resolves a Deploy action", async () => {
        throw "TODO";
    });
    it("resolves a Run action", async () => {
        throw "TODO";
    });
    it("resolves a Test action", async () => {
        throw "TODO";
    });
    it("adds dependencies from copyFrom on Build actions", async () => {
        throw "TODO";
    });
    it("adds build reference on runtime actions as dependency", async () => {
        throw "TODO";
    });
    it("adds implicit dependencies from template references in config", async () => {
        throw "TODO";
    });
    it("flags implicit dependency as needing execution if a non-static output is referenced", async () => {
        throw "TODO";
    });
    it("correctly sets compatibleTypes for an action", async () => {
        throw "TODO";
    });
    it("resolves variables for the action", async () => {
        throw "TODO";
    });
    it("resolves varfiles for the action", async () => {
        throw "TODO";
    });
    it("throws if an unknown action kind is given", async () => {
        throw "TODO";
    });
    it("throws if two actions with same key are given", async () => {
        throw "TODO";
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtJQUNwQyxFQUFFLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDMUMsTUFBTSxNQUFNLENBQUE7SUFDZCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN2QyxNQUFNLE1BQU0sQ0FBQTtJQUNkLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDBCQUEwQixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hDLE1BQU0sTUFBTSxDQUFBO0lBQ2QsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDckMsTUFBTSxNQUFNLENBQUE7SUFDZCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN0QyxNQUFNLE1BQU0sQ0FBQTtJQUNkLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGtEQUFrRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2hFLE1BQU0sTUFBTSxDQUFBO0lBQ2QsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdURBQXVELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDckUsTUFBTSxNQUFNLENBQUE7SUFDZCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrREFBK0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3RSxNQUFNLE1BQU0sQ0FBQTtJQUNkLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLHFGQUFxRixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ25HLE1BQU0sTUFBTSxDQUFBO0lBQ2QsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsOENBQThDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDNUQsTUFBTSxNQUFNLENBQUE7SUFDZCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNqRCxNQUFNLE1BQU0sQ0FBQTtJQUNkLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2hELE1BQU0sTUFBTSxDQUFBO0lBQ2QsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsMkNBQTJDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDekQsTUFBTSxNQUFNLENBQUE7SUFDZCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3RCxNQUFNLE1BQU0sQ0FBQTtJQUNkLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==