/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
describe("ResolveActionTask", () => {
    describe("resolveStatusDependencies", () => {
        it("returns an empty list", async () => {
            throw "TODO";
        });
    });
    describe("resolveProcessDependencies", () => {
        it("returns nothing if no dependencies are defined or found", async () => {
            throw "TODO";
        });
        it("returns execute task for dependency with needsExecutedOutputs=true", async () => {
            throw "TODO";
        });
        it("returns resolve task for dependency with needsStaticOutputs=true", async () => {
            throw "TODO";
        });
        it("returns resolve task for dependency with explicit=true", async () => {
            throw "TODO";
        });
        it("returns no task for dependency with none of the above flags set to true", async () => {
            throw "TODO";
        });
    });
    describe("process", () => {
        it("resolves an action", async () => {
            throw "TODO";
        });
        it("resolves action variables", async () => {
            throw "TODO";
        });
        it("correctly merges action, project and CLI variables", async () => {
            throw "TODO";
        });
        it("throws if spec is invalid after resolution", async () => {
            throw "TODO";
        });
        it("resolves and validates static outputs", async () => {
            throw "TODO";
        });
        it("throws if static outputs don't match schema", async () => {
            throw "TODO";
        });
        it("applies default values from schemas to the resolved action spec", async () => {
            throw "TODO";
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1hY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNvbHZlLWFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7UUFDekMsRUFBRSxDQUFDLHVCQUF1QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JDLE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFDMUMsRUFBRSxDQUFDLHlEQUF5RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZFLE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsb0VBQW9FLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEYsTUFBTSxNQUFNLENBQUE7UUFDZCxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxrRUFBa0UsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRixNQUFNLE1BQU0sQ0FBQTtRQUNkLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHdEQUF3RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RFLE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMseUVBQXlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkYsTUFBTSxNQUFNLENBQUE7UUFDZCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDdkIsRUFBRSxDQUFDLG9CQUFvQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xDLE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekMsTUFBTSxNQUFNLENBQUE7UUFDZCxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRSxNQUFNLE1BQU0sQ0FBQTtRQUNkLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFELE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckQsTUFBTSxNQUFNLENBQUE7UUFDZCxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRCxNQUFNLE1BQU0sQ0FBQTtRQUNkLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGlFQUFpRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9FLE1BQU0sTUFBTSxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=