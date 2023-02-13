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
const stripAnsi = require("strip-ansi");
const project_1 = require("../../../../../src/config/template-contexts/project");
const template_string_1 = require("../../../../../src/template-string/template-string");
const string_1 = require("../../../../../src/util/string");
const helpers_1 = require("../../../../helpers");
const vcsInfo = {
    branch: "main",
    commitHash: "abcdefgh",
    originUrl: "https://example.com/foo",
};
describe("DefaultEnvironmentContext", () => {
    let garden;
    let c;
    let now;
    before(async () => {
        garden = await (0, helpers_1.makeTestGardenA)();
        garden["secrets"] = { someSecret: "someSecretValue" };
    });
    beforeEach(() => {
        now = (0, helpers_1.freezeTime)();
        c = new project_1.DefaultEnvironmentContext(garden);
    });
    it("should resolve the current git branch", () => {
        (0, chai_1.expect)(c.resolve({ key: ["git", "branch"], nodePath: [], opts: {} })).to.eql({
            resolved: garden.vcsInfo.branch,
        });
    });
    it("should resolve the current git commit hash", () => {
        (0, chai_1.expect)(c.resolve({ key: ["git", "commitHash"], nodePath: [], opts: {} })).to.eql({
            resolved: garden.vcsInfo.commitHash,
        });
    });
    it("should resolve the current git origin URL", () => {
        (0, chai_1.expect)(c.resolve({ key: ["git", "originUrl"], nodePath: [], opts: {} })).to.eql({
            resolved: garden.vcsInfo.originUrl,
        });
    });
    it("should resolve datetime.now to ISO datetime string", () => {
        (0, chai_1.expect)(c.resolve({ key: ["datetime", "now"], nodePath: [], opts: {} })).to.eql({
            resolved: now.toISOString(),
        });
    });
    it("should resolve datetime.today to ISO datetime string", () => {
        (0, chai_1.expect)(c.resolve({ key: ["datetime", "today"], nodePath: [], opts: {} })).to.eql({
            resolved: now.toISOString().slice(0, 10),
        });
    });
    it("should resolve datetime.timestamp to Unix timestamp in seconds", () => {
        (0, chai_1.expect)(c.resolve({ key: ["datetime", "timestamp"], nodePath: [], opts: {} })).to.eql({
            resolved: Math.round(now.getTime() / 1000),
        });
    });
});
describe("ProjectConfigContext", () => {
    const enterpriseDomain = "https://garden.mydomain.com";
    it("should resolve local env variables", () => {
        process.env.TEST_VARIABLE = "value";
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        (0, chai_1.expect)(c.resolve({ key: ["local", "env", "TEST_VARIABLE"], nodePath: [], opts: {} })).to.eql({
            resolved: "value",
        });
        delete process.env.TEST_VARIABLE;
    });
    it("should resolve the current git branch", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        (0, chai_1.expect)(c.resolve({ key: ["git", "branch"], nodePath: [], opts: {} })).to.eql({
            resolved: "main",
        });
    });
    it("should resolve when logged in", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: { foo: "banana" },
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        (0, chai_1.expect)(c.resolve({ key: ["secrets", "foo"], nodePath: [], opts: {} })).to.eql({
            resolved: "banana",
        });
    });
    context("errors thrown when a missing secret is referenced", () => {
        it("should ask the user to log in if they're logged out", () => {
            const c = new project_1.ProjectConfigContext({
                projectName: "some-project",
                projectRoot: "/tmp",
                artifactsPath: "/tmp",
                vcsInfo,
                username: "some-user",
                loggedIn: false,
                enterpriseDomain,
                secrets: { foo: "banana" },
                commandInfo: { name: "test", args: {}, opts: {} },
            });
            const { message } = c.resolve({ key: ["secrets", "bar"], nodePath: [], opts: {} });
            (0, chai_1.expect)(stripAnsi(message)).to.match(/Please log in via the garden login command to use Garden with secrets/);
        });
        context("when logged in", () => {
            it("should notify the user if an empty set of secrets was returned by the backend", () => {
                const c = new project_1.ProjectConfigContext({
                    projectName: "some-project",
                    projectRoot: "/tmp",
                    artifactsPath: "/tmp",
                    vcsInfo,
                    username: "some-user",
                    loggedIn: true,
                    enterpriseDomain,
                    secrets: {},
                    commandInfo: { name: "test", args: {}, opts: {} },
                });
                const { message } = c.resolve({ key: ["secrets", "bar"], nodePath: [], opts: {} });
                const errMsg = (0, string_1.deline) `
          Looks like no secrets have been created for this project and/or environment in Garden Cloud.
          To create secrets, please visit ${enterpriseDomain} and navigate to the secrets section for this project.
        `;
                (0, chai_1.expect)(stripAnsi(message)).to.match(new RegExp(errMsg));
            });
            it("if a non-empty set of secrets was returned by the backend, provide a helpful suggestion", () => {
                const c = new project_1.ProjectConfigContext({
                    projectName: "some-project",
                    projectRoot: "/tmp",
                    artifactsPath: "/tmp",
                    vcsInfo,
                    username: "some-user",
                    loggedIn: true,
                    enterpriseDomain,
                    secrets: { foo: "banana " },
                    commandInfo: { name: "test", args: {}, opts: {} },
                });
                const { message } = c.resolve({ key: ["secrets", "bar"], nodePath: [], opts: {} });
                const errMsg = (0, string_1.deline) `
          Please make sure that all required secrets for this project exist in Garden Cloud, and are accessible in this
          environment.
        `;
                (0, chai_1.expect)(stripAnsi(message)).to.match(new RegExp(errMsg));
            });
        });
    });
    it("should return helpful message when resolving missing env variable", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        const key = "fiaogsyecgbsjyawecygaewbxrbxajyrgew";
        const { message } = c.resolve({ key: ["local", "env", key], nodePath: [], opts: {} });
        (0, chai_1.expect)(stripAnsi(message)).to.match(/Could not find key fiaogsyecgbsjyawecygaewbxrbxajyrgew under local.env. Available keys: /);
    });
    it("should resolve the local arch", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        (0, chai_1.expect)(c.resolve({ key: ["local", "arch"], nodePath: [], opts: {} })).to.eql({
            resolved: process.arch,
        });
    });
    it("should resolve the local platform", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "some-user",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        (0, chai_1.expect)(c.resolve({ key: ["local", "platform"], nodePath: [], opts: {} })).to.eql({
            resolved: process.platform,
        });
    });
    it("should resolve the local username (both regular and lower case versions)", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "SomeUser",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        (0, chai_1.expect)(c.resolve({ key: ["local", "username"], nodePath: [], opts: {} })).to.eql({
            resolved: "SomeUser",
        });
        (0, chai_1.expect)(c.resolve({ key: ["local", "usernameLowerCase"], nodePath: [], opts: {} })).to.eql({
            resolved: "someuser",
        });
    });
    it("should resolve the command name", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "SomeUser",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        (0, chai_1.expect)(c.resolve({ key: ["command", "name"], nodePath: [], opts: {} })).to.eql({
            resolved: "test",
        });
    });
    it("should resolve command params (positive)", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "SomeUser",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "deploy", args: {}, opts: { "dev-mode": ["my-service"] } },
        });
        let result = (0, template_string_1.resolveTemplateString)("${command.name == 'deploy' && (command.params.dev-mode contains 'my-service')}", c);
        (0, chai_1.expect)(result).to.be.true;
    });
    it("should resolve command params (negative)", () => {
        const c = new project_1.ProjectConfigContext({
            projectName: "some-project",
            projectRoot: "/tmp",
            artifactsPath: "/tmp",
            vcsInfo,
            username: "SomeUser",
            loggedIn: true,
            enterpriseDomain,
            secrets: {},
            commandInfo: { name: "test", args: {}, opts: {} },
        });
        let result = (0, template_string_1.resolveTemplateString)("${command.params contains 'dev-mode' && command.params.dev-mode contains 'my-service'}", c);
        (0, chai_1.expect)(result).to.be.false;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByb2plY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNkI7QUFDN0Isd0NBQXdDO0FBRXhDLGlGQUFxSDtBQUNySCx3RkFBMEY7QUFDMUYsMkRBQXVEO0FBQ3ZELGlEQUE2RTtBQVE3RSxNQUFNLE9BQU8sR0FBRztJQUNkLE1BQU0sRUFBRSxNQUFNO0lBQ2QsVUFBVSxFQUFFLFVBQVU7SUFDdEIsU0FBUyxFQUFFLHlCQUF5QjtDQUNyQyxDQUFBO0FBRUQsUUFBUSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtJQUN6QyxJQUFJLE1BQWtCLENBQUE7SUFDdEIsSUFBSSxDQUE0QixDQUFBO0lBQ2hDLElBQUksR0FBUyxDQUFBO0lBRWIsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hCLE1BQU0sR0FBRyxNQUFNLElBQUEseUJBQWUsR0FBRSxDQUFBO1FBQ2hDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxDQUFBO0lBQ3ZELENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLEdBQUcsR0FBRyxJQUFBLG9CQUFVLEdBQUUsQ0FBQTtRQUNsQixDQUFDLEdBQUcsSUFBSSxtQ0FBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUMzQyxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsSUFBQSxhQUFNLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUMzRSxRQUFRLEVBQUUsTUFBTSxDQUFDLE9B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