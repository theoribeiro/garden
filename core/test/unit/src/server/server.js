"use strict";
/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../../helpers");
const server_1 = require("../../../../src/server/server");
const chai_1 = require("chai");
const util_1 = require("../../../../src/util/util");
const request = require("supertest");
const getPort = require("get-port");
const WebSocket = require("ws");
const stripAnsi = require("strip-ansi");
const api_1 = require("../../../../src/cloud/api");
const serve_1 = require("../../../../src/commands/serve");
describe("GardenServer", () => {
    let garden;
    let gardenServer;
    let server;
    let port;
    const command = new serve_1.ServeCommand();
    before(async () => {
        port = await getPort();
        garden = await (0, helpers_1.makeTestGardenA)();
        gardenServer = await (0, server_1.startServer)({ log: garden.log, command, port });
        server = gardenServer.server;
    });
    after(async () => {
        server.close();
    });
    beforeEach(async () => {
        await gardenServer.setGarden(garden);
    });
    it("should show no URL on startup", async () => {
        const line = gardenServer["statusLog"];
        (0, chai_1.expect)(line.getLatestMessage().msg).to.be.undefined;
    });
    it("should update server URL with own if the external server goes down", async () => {
        gardenServer.showUrl("http://foo");
        garden.events.emit("serversUpdated", {
            servers: [],
        });
        const line = gardenServer["statusLog"];
        await (0, util_1.sleep)(1); // This is enough to let go of the control loop
        const status = stripAnsi(line.getLatestMessage().msg || "");
        (0, chai_1.expect)(status).to.equal(`Garden server running at ${gardenServer.getUrl()}`);
    });
    it("should update server URL with new one if another is started", async () => {
        gardenServer.showUrl("http://foo");
        garden.events.emit("serversUpdated", {
            servers: [{ host: "http://localhost:9800", command: "serve", serverAuthKey: "foo" }],
        });
        const line = gardenServer["statusLog"];
        await (0, util_1.sleep)(1); // This is enough to let go of the control loop
        const status = stripAnsi(line.getLatestMessage().msg || "");
        (0, chai_1.expect)(status).to.equal(`Garden server running at http://localhost:9800?key=foo`);
    });
    describe("POST /api", () => {
        it("returns 401 if missing auth header", async () => {
            await request(server).post("/api").send({}).expect(401);
        });
        it("returns 401 if auth header doesn't match auth key", async () => {
            await request(server)
                .post("/api")
                .set({ [api_1.authTokenHeader]: "foo" })
                .send({})
                .expect(401);
        });
        it("should 400 on non-JSON body", async () => {
            await request(server)
                .post("/api")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .send("foo")
                .expect(400);
        });
        it("should 400 on invalid payload", async () => {
            await request(server)
                .post("/api")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .send({ foo: "bar" })
                .expect(400);
        });
        it("should 404 on invalid command", async () => {
            await request(server)
                .post("/api")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .send({ command: "foo" })
                .expect(404);
        });
        it("should 503 when Garden instance is not set", async () => {
            gardenServer["garden"] = undefined;
            await request(server)
                .post("/api")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .send({ command: "get.config" })
                .expect(503);
        });
        it("should execute a command and return its results", async () => {
            const res = await request(server)
                .post("/api")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .send({ command: "get.config" })
                .expect(200);
            const config = await garden.dumpConfig({ log: garden.log });
            (0, chai_1.expect)(res.body.result).to.eql((0, util_1.deepOmitUndefined)(config));
        });
        it("should correctly map arguments and options to commands", async () => {
            const res = await request(server)
                .post("/api")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .send({
                command: "build",
                parameters: {
                    modules: ["module-a"],
                    force: true,
                },
            })
                .expect(200);
            (0, chai_1.expect)((0, helpers_1.taskResultOutputs)(res.body.result)).to.eql({
                "build.module-a": {
                    buildLog: "A",
                    fresh: true,
                },
            });
        });
    });
    describe("/dashboardPages", () => {
        it("returns 401 if missing auth header", async () => {
            await request(server).get("/dashboardPages/test-plugin/test").expect(401);
        });
        it("returns 401 if auth header doesn't match auth key", async () => {
            await request(server)
                .get("/dashboardPages/test-plugin/test")
                .set({ [api_1.authTokenHeader]: "foo" })
                .send({})
                .expect(401);
        });
        it("should resolve the URL for the given dashboard page and redirect", async () => {
            const res = await request(server)
                .get("/dashboardPages/test-plugin/test")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .expect(302);
            (0, chai_1.expect)(res.header.location).to.equal("http://localhost:12345/test");
        });
    });
    describe("/events", () => {
        it("returns 401 if missing auth header", async () => {
            await request(server).post("/events").send({}).expect(401);
        });
        it("returns 401 if auth header doesn't match auth key", async () => {
            await request(server)
                .post("/events")
                .set({ [api_1.authTokenHeader]: "foo" })
                .send({})
                .expect(401);
        });
        it("posts events on the incoming event bus", (done) => {
            let passed = false;
            gardenServer["incomingEvents"].on("_test", () => {
                !passed && done();
                passed = true;
            });
            request(server)
                .post("/events")
                .set({ [api_1.authTokenHeader]: gardenServer.authKey })
                .send({
                events: [{ name: "_test", payload: { some: "value" } }],
            })
                .expect(200)
                .catch(done);
        });
    });
    describe("/ws", () => {
        let ws;
        beforeEach((done) => {
            ws = new WebSocket(`ws://localhost:${port}/ws?sessionId=${garden.sessionId}`);
            ws.on("open", () => {
                done();
            });
            ws.on("error", done);
        });
        afterEach(() => {
            ws.close();
        });
        const onFirstMsgAfterReadyMsg = (cb) => {
            ws.on("message", (msg) => {
                const parsed = JSON.parse(msg.toString());
                // This message is always sent at the beginning and we skip it here
                // to simplify testing.
                if (parsed.name !== "serverReady") {
                    cb(parsed);
                }
            });
        };
        it("terminates the connection if auth query params are missing", (done) => {
            const badWs = new WebSocket(`ws://localhost:${port}/ws`);
            badWs.on("close", (code, reason) => {
                (0, chai_1.expect)(code).to.eql(4401);
                (0, chai_1.expect)(reason).to.eql("Unauthorized");
                done();
            });
        });
        it("terminates the connection if key doesn't match and sessionId is missing", (done) => {
            const badWs = new WebSocket(`ws://localhost:${port}/ws?key=foo`);
            badWs.on("close", (code, reason) => {
                (0, chai_1.expect)(code).to.eql(4401);
                (0, chai_1.expect)(reason).to.eql("Unauthorized");
                done();
            });
        });
        it("terminates the connection if sessionId doesn't match and key is missing", (done) => {
            const badWs = new WebSocket(`ws://localhost:${port}/ws?sessionId=foo`);
            badWs.on("close", (code, reason) => {
                (0, chai_1.expect)(code).to.eql(4401);
                (0, chai_1.expect)(reason).to.eql("Unauthorized");
                done();
            });
        });
        it("terminates the connection if both sessionId and key are bad", (done) => {
            const badWs = new WebSocket(`ws://localhost:${port}/ws?sessionId=foo&key=bar`);
            badWs.on("close", (code, reason) => {
                (0, chai_1.expect)(code).to.eql(4401);
                (0, chai_1.expect)(reason).to.eql("Unauthorized");
                done();
            });
        });
        it("should send a serverReady event when the server is ready", (done) => {
            let msgs = [];
            ws.on("message", (msg) => {
                msgs.push(JSON.parse(msg.toString()));
                if (msgs.length === 2) {
                    (0, chai_1.expect)(msgs).to.eql([
                        { type: "event", name: "serverReady", payload: {} },
                        { type: "event", name: "_test", payload: "foo" },
                    ]);
                    done();
                }
            });
            garden.events.emit("_test", "foo");
        });
        it("should emit events from the Garden event bus", (done) => {
            onFirstMsgAfterReadyMsg((req) => {
                (0, chai_1.expect)(req).to.eql({ type: "event", name: "_test", payload: "foo" });
                done();
            });
            garden.events.emit("_test", "foo");
        });
        it("should send error when a request is not valid JSON", (done) => {
            onFirstMsgAfterReadyMsg((req) => {
                (0, chai_1.expect)(req).to.eql({
                    type: "error",
                    message: "Could not parse message as JSON",
                });
                done();
            });
            ws.send("ijdgkasdghlasdkghals");
        });
        it("should send error when Garden instance is not set", (done) => {
            const id = (0, util_1.uuidv4)();
            onFirstMsgAfterReadyMsg((req) => {
                (0, chai_1.expect)(req).to.eql({
                    type: "error",
                    message: "Waiting for Garden instance to initialize",
                    requestId: id,
                });
                done();
            });
            gardenServer["garden"] = undefined;
            ws.send(JSON.stringify({
                type: "command",
                id,
                command: "get.config",
            }));
        });
        it("should error when a request is missing an ID", (done) => {
            onFirstMsgAfterReadyMsg((req) => {
                (0, chai_1.expect)(req).to.eql({
                    type: "error",
                    message: "Message should contain an `id` field with a UUID value",
                });
                done();
            });
            ws.send(JSON.stringify({ type: "command" }));
        });
        it("should error when a request has an invalid ID", (done) => {
            onFirstMsgAfterReadyMsg((req) => {
                (0, chai_1.expect)(req).to.eql({
                    type: "error",
                    requestId: "ksdhgalsdkjghalsjkg",
                    message: "Message should contain an `id` field with a UUID value",
                });
                done();
            });
            ws.send(JSON.stringify({ type: "command", id: "ksdhgalsdkjghalsjkg" }));
        });
        it("should error when a request has an invalid type", (done) => {
            const id = (0, util_1.uuidv4)();
            onFirstMsgAfterReadyMsg((req) => {
                (0, chai_1.expect)(req).to.eql({
                    type: "error",
                    requestId: id,
                    message: "Unsupported request type: foo",
                });
                done();
            });
            ws.send(JSON.stringify({ type: "foo", id }));
        });
        it("should execute a command and return its results", (done) => {
            const id = (0, util_1.uuidv4)();
            garden
                .dumpConfig({ log: garden.log })
                .then((config) => {
                onFirstMsgAfterReadyMsg((req) => {
                    if (req.type !== "commandResult") {
                        return;
                    }
                    (0, chai_1.expect)(req).to.eql({
                        type: "commandResult",
                        requestId: id,
                        result: (0, util_1.deepOmitUndefined)(config),
                    });
                    done();
                });
                ws.send(JSON.stringify({
                    type: "command",
                    id,
                    command: "get.config",
                }));
            })
                .catch(done);
        });
        it("should correctly map arguments and options to commands", (done) => {
            const id = (0, util_1.uuidv4)();
            onFirstMsgAfterReadyMsg((req) => {
                // Ignore other events such as taskPending and taskProcessing and wait for the command result
                if (req.type !== "commandResult") {
                    return;
                }
                const taskResult = (0, helpers_1.taskResultOutputs)(req.result);
                const result = {
                    ...req,
                    result: taskResult,
                };
                (0, chai_1.expect)(result).to.eql({
                    type: "commandResult",
                    requestId: id,
                    result: {
                        "build.module-a": {
                            buildLog: "A",
                            fresh: true,
                        },
                    },
                });
                done();
            });
            ws.send(JSON.stringify({
                type: "command",
                id,
                command: "build",
                parameters: {
                    modules: ["module-a"],
                    force: true,
                },
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsOENBQXFFO0FBRXJFLDBEQUF5RTtBQUV6RSwrQkFBNkI7QUFDN0Isb0RBQTRFO0FBQzVFLHFDQUFxQztBQUNyQyxvQ0FBb0M7QUFDcEMsZ0NBQWdDO0FBQ2hDLHdDQUF3QztBQUN4QyxtREFBMkQ7QUFDM0QsMERBQTZEO0FBRTdELFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLElBQUksTUFBYyxDQUFBO0lBQ2xCLElBQUksWUFBMEIsQ0FBQTtJQUM5QixJQUFJLE1BQWMsQ0FBQTtJQUNsQixJQUFJLElBQVksQ0FBQTtJQUVoQixNQUFNLE9BQU8sR0FBRyxJQUFJLG9CQUFZLEVBQUUsQ0FBQTtJQUVsQyxNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEIsSUFBSSxHQUFHLE1BQU0sT0FBTyxFQUFFLENBQUE7UUFDdEIsTUFBTSxHQUFHLE1BQU0sSUFBQSx5QkFBZSxHQUFFLENBQUE7UUFDaEMsWUFBWSxHQUFHLE1BQU0sSUFBQSxvQkFBVyxFQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7UUFDcEUsTUFBTSxHQUFTLFlBQWEsQ0FBQyxNQUFNLENBQUE7SUFDckMsQ0FBQyxDQUFDLENBQUE7SUFFRixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDZixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7SUFDaEIsQ0FBQyxDQUFDLENBQUE7SUFFRixVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDcEIsTUFBTSxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLCtCQUErQixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzdDLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUN0QyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQTtJQUNyRCxDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvRUFBb0UsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsRixZQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ25DLE9BQU8sRUFBRSxFQUFFO1NBQ1osQ0FBQyxDQUFBO1FBQ0YsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3RDLE1BQU0sSUFBQSxZQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQywrQ0FBK0M7UUFDOUQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUMzRCxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLDRCQUE0QixZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQzlFLENBQUMsQ0FBQyxDQUFBO0lBRUYsRUFBRSxDQUFDLDZEQUE2RCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzNFLFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDbkMsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUM7U0FDckYsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3RDLE1BQU0sSUFBQSxZQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQywrQ0FBK0M7UUFDOUQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUMzRCxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUE7SUFDbkYsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUN6QixFQUFFLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEQsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDekQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakUsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO2lCQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDO2lCQUNaLEdBQUcsQ0FBQyxFQUFFLENBQUMscUJBQWUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO2lCQUNqQyxJQUFJLENBQUMsRUFBRSxDQUFDO2lCQUNSLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzQyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7aUJBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUM7aUJBQ1osR0FBRyxDQUFDLEVBQUUsQ0FBQyxxQkFBZSxDQUFDLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDO2lCQUNYLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3QyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7aUJBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUM7aUJBQ1osR0FBRyxDQUFDLEVBQUUsQ0FBQyxxQkFBZSxDQUFDLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNoRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUM7aUJBQ3BCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3QyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7aUJBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUM7aUJBQ1osR0FBRyxDQUFDLEVBQUUsQ0FBQyxxQkFBZSxDQUFDLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNoRCxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7aUJBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxRCxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsU0FBUyxDQUFBO1lBQ2xDLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztpQkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQztpQkFDWixHQUFHLENBQUMsRUFBRSxDQUFDLHFCQUFlLENBQUMsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hELElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztpQkFDL0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ2hCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9ELE1BQU0sR0FBRyxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztpQkFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQztpQkFDWixHQUFHLENBQUMsRUFBRSxDQUFDLHFCQUFlLENBQUMsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hELElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztpQkFDL0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ2QsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO1lBQzNELElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFpQixFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7UUFDM0QsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO2lCQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDO2lCQUNaLEdBQUcsQ0FBQyxFQUFFLENBQUMscUJBQWUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDaEQsSUFBSSxDQUFDO2dCQUNKLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixVQUFVLEVBQUU7b0JBQ1YsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO29CQUNyQixLQUFLLEVBQUUsSUFBSTtpQkFDWjthQUNGLENBQUM7aUJBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRWQsSUFBQSxhQUFNLEVBQUMsSUFBQSwyQkFBaUIsRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDaEQsZ0JBQWdCLEVBQUU7b0JBQ2hCLFFBQVEsRUFBRSxHQUFHO29CQUNiLEtBQUssRUFBRSxJQUFJO2lCQUNaO2FBQ0YsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsRUFBRSxDQUFDLG9DQUFvQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xELE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUMzRSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxtREFBbUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRSxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUM7aUJBQ2xCLEdBQUcsQ0FBQyxrQ0FBa0MsQ0FBQztpQkFDdkMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxxQkFBZSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUM7aUJBQ2pDLElBQUksQ0FBQyxFQUFFLENBQUM7aUJBQ1IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ2hCLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLGtFQUFrRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hGLE1BQU0sR0FBRyxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQztpQkFDOUIsR0FBRyxDQUFDLGtDQUFrQyxDQUFDO2lCQUN2QyxHQUFHLENBQUMsRUFBRSxDQUFDLHFCQUFlLENBQUMsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUVkLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFBO1FBQ3JFLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUN2QixFQUFFLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEQsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDNUQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakUsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO2lCQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDO2lCQUNmLEdBQUcsQ0FBQyxFQUFFLENBQUMscUJBQWUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO2lCQUNqQyxJQUFJLENBQUMsRUFBRSxDQUFDO2lCQUNSLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyx3Q0FBd0MsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3BELElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQTtZQUVsQixZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUMsQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFFLENBQUE7Z0JBQ2pCLE1BQU0sR0FBRyxJQUFJLENBQUE7WUFDZixDQUFDLENBQUMsQ0FBQTtZQUVGLE9BQU8sQ0FBQyxNQUFNLENBQUM7aUJBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQztpQkFDZixHQUFHLENBQUMsRUFBRSxDQUFDLHFCQUFlLENBQUMsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hELElBQUksQ0FBQztnQkFDSixNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUM7YUFDeEQsQ0FBQztpQkFDRCxNQUFNLENBQUMsR0FBRyxDQUFDO2lCQUNYLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDbkIsSUFBSSxFQUFhLENBQUE7UUFFakIsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbEIsRUFBRSxHQUFHLElBQUksU0FBUyxDQUFDLGtCQUFrQixJQUFJLGlCQUFpQixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtZQUM3RSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7Z0JBQ2pCLElBQUksRUFBRSxDQUFBO1lBQ1IsQ0FBQyxDQUFDLENBQUE7WUFDRixFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUN0QixDQUFDLENBQUMsQ0FBQTtRQUVGLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDYixFQUFFLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDWixDQUFDLENBQUMsQ0FBQTtRQUVGLE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxFQUF5QixFQUFFLEVBQUU7WUFDNUQsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtnQkFDekMsbUVBQW1FO2dCQUNuRSx1QkFBdUI7Z0JBQ3ZCLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxhQUFhLEVBQUU7b0JBQ2pDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtpQkFDWDtZQUNILENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFBO1FBRUQsRUFBRSxDQUFDLDREQUE0RCxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDeEUsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsa0JBQWtCLElBQUksS0FBSyxDQUFDLENBQUE7WUFDeEQsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ2pDLElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ3pCLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUE7Z0JBQ3JDLElBQUksRUFBRSxDQUFBO1lBQ1IsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyx5RUFBeUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3JGLE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLGtCQUFrQixJQUFJLGFBQWEsQ0FBQyxDQUFBO1lBQ2hFLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNqQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUN6QixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFBO2dCQUNyQyxJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMseUVBQXlFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNyRixNQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsSUFBSSxtQkFBbUIsQ0FBQyxDQUFBO1lBQ3RFLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNqQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUN6QixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFBO2dCQUNyQyxJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsNkRBQTZELEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUN6RSxNQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsSUFBSSwyQkFBMkIsQ0FBQyxDQUFBO1lBQzlFLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNqQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUN6QixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFBO2dCQUNyQyxJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsMERBQTBELEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUN0RSxJQUFJLElBQUksR0FBVSxFQUFFLENBQUE7WUFDcEIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBRXJDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQ3JCLElBQUEsYUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7d0JBQ2xCLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7d0JBQ25ELEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUU7cUJBQ2pELENBQUMsQ0FBQTtvQkFDRixJQUFJLEVBQUUsQ0FBQTtpQkFDUDtZQUNILENBQUMsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3BDLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDMUQsdUJBQXVCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDOUIsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtnQkFDcEUsSUFBSSxFQUFFLENBQUE7WUFDUixDQUFDLENBQUMsQ0FBQTtZQUNGLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNwQyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2hFLHVCQUF1QixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzlCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ2pCLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSxpQ0FBaUM7aUJBQzNDLENBQUMsQ0FBQTtnQkFDRixJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1lBQ0YsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO1FBQ2pDLENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLG1EQUFtRCxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDL0QsTUFBTSxFQUFFLEdBQUcsSUFBQSxhQUFNLEdBQUUsQ0FBQTtZQUVuQix1QkFBdUIsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUM5QixJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUNqQixJQUFJLEVBQUUsT0FBTztvQkFDYixPQUFPLEVBQUUsMkNBQTJDO29CQUNwRCxTQUFTLEVBQUUsRUFBRTtpQkFDZCxDQUFDLENBQUE7Z0JBQ0YsSUFBSSxFQUFFLENBQUE7WUFDUixDQUFDLENBQUMsQ0FBQTtZQUVGLFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLENBQUE7WUFFbEMsRUFBRSxDQUFDLElBQUksQ0FDTCxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNiLElBQUksRUFBRSxTQUFTO2dCQUNmLEVBQUU7Z0JBQ0YsT0FBTyxFQUFFLFlBQVk7YUFDdEIsQ0FBQyxDQUNILENBQUE7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzFELHVCQUF1QixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzlCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ2pCLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSx3REFBd0Q7aUJBQ2xFLENBQUMsQ0FBQTtnQkFDRixJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1lBQ0YsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzNELHVCQUF1QixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzlCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ2pCLElBQUksRUFBRSxPQUFPO29CQUNiLFNBQVMsRUFBRSxxQkFBcUI7b0JBQ2hDLE9BQU8sRUFBRSx3REFBd0Q7aUJBQ2xFLENBQUMsQ0FBQTtnQkFDRixJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1lBQ0YsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDekUsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsaURBQWlELEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUM3RCxNQUFNLEVBQUUsR0FBRyxJQUFBLGFBQU0sR0FBRSxDQUFBO1lBQ25CLHVCQUF1QixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzlCLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ2pCLElBQUksRUFBRSxPQUFPO29CQUNiLFNBQVMsRUFBRSxFQUFFO29CQUNiLE9BQU8sRUFBRSwrQkFBK0I7aUJBQ3pDLENBQUMsQ0FBQTtnQkFDRixJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1lBQ0YsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDOUMsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsaURBQWlELEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUM3RCxNQUFNLEVBQUUsR0FBRyxJQUFBLGFBQU0sR0FBRSxDQUFBO1lBRW5CLE1BQU07aUJBQ0gsVUFBVSxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztpQkFDL0IsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2YsdUJBQXVCLENBQUMsQ0FBQyxHQUFRLEVBQUUsRUFBRTtvQkFDbkMsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLGVBQWUsRUFBRTt3QkFDaEMsT0FBTTtxQkFDUDtvQkFFRCxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO3dCQUNqQixJQUFJLEVBQUUsZUFBZTt3QkFDckIsU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFLElBQUEsd0JBQWlCLEVBQUMsTUFBTSxDQUFDO3FCQUNsQyxDQUFDLENBQUE7b0JBQ0YsSUFBSSxFQUFFLENBQUE7Z0JBQ1IsQ0FBQyxDQUFDLENBQUE7Z0JBQ0YsRUFBRSxDQUFDLElBQUksQ0FDTCxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNiLElBQUksRUFBRSxTQUFTO29CQUNmLEVBQUU7b0JBQ0YsT0FBTyxFQUFFLFlBQVk7aUJBQ3RCLENBQUMsQ0FDSCxDQUFBO1lBQ0gsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyx3REFBd0QsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3BFLE1BQU0sRUFBRSxHQUFHLElBQUEsYUFBTSxHQUFFLENBQUE7WUFDbkIsdUJBQXVCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDOUIsNkZBQTZGO2dCQUM3RixJQUFVLEdBQUksQ0FBQyxJQUFJLEtBQUssZUFBZSxFQUFFO29CQUN2QyxPQUFNO2lCQUNQO2dCQUNELE1BQU0sVUFBVSxHQUFHLElBQUEsMkJBQWlCLEVBQU8sR0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUN2RCxNQUFNLE1BQU0sR0FBRztvQkFDYixHQUFHLEdBQUc7b0JBQ04sTUFBTSxFQUFFLFVBQVU7aUJBQ25CLENBQUE7Z0JBQ0QsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDcEIsSUFBSSxFQUFFLGVBQWU7b0JBQ3JCLFNBQVMsRUFBRSxFQUFFO29CQUNiLE1BQU0sRUFBRTt3QkFDTixnQkFBZ0IsRUFBRTs0QkFDaEIsUUFBUSxFQUFFLEdBQUc7NEJBQ2IsS0FBSyxFQUFFLElBQUk7eUJBQ1o7cUJBQ0Y7aUJBQ0YsQ0FBQyxDQUFBO2dCQUNGLElBQUksRUFBRSxDQUFBO1lBQ1IsQ0FBQyxDQUFDLENBQUE7WUFDRixFQUFFLENBQUMsSUFBSSxDQUNMLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ2IsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsRUFBRTtnQkFDRixPQUFPLEVBQUUsT0FBTztnQkFDaEIsVUFBVSxFQUFFO29CQUNWLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQztvQkFDckIsS0FBSyxFQUFFLElBQUk7aUJBQ1o7YUFDRixDQUFDLENBQ0gsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSJ9