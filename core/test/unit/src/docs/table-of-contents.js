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
const table_of_contents_1 = require("../../../../src/docs/table-of-contents");
const helpers_1 = require("../../../helpers");
const dedent = require("dedent");
describe("table of contents", () => {
    it("should return a correctly ordered table of contents", async () => {
        const testDocsDir = (0, helpers_1.getDataDir)("test-table-of-contents");
        const output = (0, table_of_contents_1.generateTableOfContents)(testDocsDir);
        (0, chai_1.expect)(output.trim()).to.eql(dedent `
      # Table of Contents

      * [Welcome!](welcome.md)

      ## 🌳 Directory 3


      ## 🌻 Directory 2


      ## 💐 Directory 1


      ## 🌿 Directory 4

      * [This goes first.](./4/2.md)
      * [This goes second.](./4/1.md)
      * [I have a title but no order.](./4/b.md)
      * [I too have a title but no order.](./4/a.md)
      * [X Something.md](./4/x-something.md)
      * [Y Something.md](./4/y-something.md)
    `);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtb2YtY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0YWJsZS1vZi1jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE2QjtBQUM3Qiw4RUFBZ0Y7QUFDaEYsOENBQTZDO0FBQzdDLGlDQUFpQztBQUVqQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLEVBQUUsQ0FBQyxxREFBcUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNuRSxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFVLEVBQUMsd0JBQXdCLENBQUMsQ0FBQTtRQUN4RCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJDQUF1QixFQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ25ELElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBc0JsQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=