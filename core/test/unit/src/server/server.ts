/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { makeTestGardenA, taskResultOutputs, testPlugins } from "../../../helpers"
import { Server } from "http"
import { startServer, GardenServer } from "../../../../src/server/server"
import { Garden } from "../../../../src/garden"
import { expect } from "chai"
import request = require("supertest")
import getPort = require("get-port")
import WebSocket = require("ws")
import { authTokenHeader } from "../../../../src/cloud/auth"
import { ServeCommand } from "../../../../src/commands/serve"
import { gardenEnv } from "../../../../src/constants"
import { deepOmitUndefined } from "../../../../src/util/objects"
import { uuidv4 } from "../../../../src/util/random"
import { GardenInstanceManager } from "../../../../src/server/instance-manager"
import { Command, CommandParams } from "../../../../src/commands/base"

describe("GardenServer", () => {
  let garden: Garden
  let gardenServer: GardenServer
  let server: Server
  let port: number
  let manager: GardenInstanceManager

  const hostname = "127.0.0.1"

  const serveCommand = new ServeCommand()

  class TestCommand extends Command {
    name = "_test"
    help = "foo"

    async action({ garden: _garden, log, parentCommand }: CommandParams) {
      log.info("Info log")
      log.debug("Debug log")
      log.silly("Silly log")
      _garden.log.info("Garden info log")
      _garden.log.debug("Garden debug log")
      _garden.log.silly("Garden silly log")

      return { result: { parentCommandName: parentCommand?.getFullName() } }
    }
  }

  before(async () => {
    port = await getPort()
    garden = await makeTestGardenA()
    manager = GardenInstanceManager.getInstance({
      log: garden.log,
      sessionId: garden.sessionId,
      serveCommand,
      extraCommands: [new TestCommand()],
      defaultOpts: { plugins: [...testPlugins()] },
      force: true,
      plugins: [],
    })
    manager.set(garden.log, garden)
    gardenEnv.GARDEN_SERVER_HOSTNAME = hostname
    gardenServer = await startServer({
      log: garden.log,
      manager,
      defaultProjectRoot: garden.projectRoot,
      port,
      serveCommand,
    })
    await gardenServer.start()
    server = gardenServer["server"]
  })

  after(async () => {
    server.close()
  })

  beforeEach(async () => {
    manager.set(garden.log, garden)
  })

  it("should show no URL on startup", async () => {
    const line = gardenServer["statusLog"]
    expect(line.getLatestEntry()).to.be.undefined
  })

  context("GARDEN_SERVER_PORT env var is set", () => {
    const originalServerPort = gardenEnv.GARDEN_SERVER_PORT
    let customPort: number
    let gardenServerCustomPort: GardenServer

    before(async () => {
      customPort = await getPort()
      gardenEnv.GARDEN_SERVER_PORT = customPort
    })

    after(async () => {
      await gardenServerCustomPort.close()
      gardenEnv.GARDEN_SERVER_PORT = originalServerPort
    })

    it("should use the GARDEN_SERVER_PORT env var if set", async () => {
      gardenServerCustomPort = await startServer({
        log: garden.log,
        port,
        manager,
        defaultProjectRoot: garden.projectRoot,
        serveCommand,
      })
      await gardenServerCustomPort.start()

      expect(gardenServerCustomPort.port).to.eql(customPort)
    })
  })

  describe("POST /api", () => {
    it("returns 401 if missing auth header", async () => {
      await request(server).post("/api").send({}).expect(401)
    })

    it("returns 401 if auth header doesn't match auth key", async () => {
      await request(server)
        .post("/api")
        .set({ [authTokenHeader]: "foo" })
        .send({})
        .expect(401)
    })

    it("should 400 on non-JSON body", async () => {
      await request(server)
        .post("/api")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .send("foo")
        .expect(400)
    })

    it("should 400 on invalid payload", async () => {
      await request(server)
        .post("/api")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .send({ foo: "bar" })
        .expect(400)
    })

    it("should 404 on invalid command", async () => {
      await request(server)
        .post("/api")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .send({ command: "foo", stringArguments: [] })
        .expect(404)
    })

    it("should execute a command and return its results", async () => {
      const res = await request(server)
        .post("/api")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .send({ command: "get config", stringArguments: [] })
        .expect(200)
      const config = await garden.dumpConfig({ log: garden.log })
      expect(res.body.result).to.eql(deepOmitUndefined(config))
    })

    it("should correctly map arguments and options to commands", async () => {
      const res = await request(server)
        .post("/api")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .send({
          command: "build module-a --force",
        })
        .expect(200)

      const result = taskResultOutputs(res.body.result)
      expect(result["build.module-a"]).to.exist
      expect(result["build.module-a"].state).to.equal("ready")
    })

    it("creates a Garden instance as needed", async () => {
      const res = await request(server)
        .post("/api")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .send({ command: "get config --var foo=bar" })
        .expect(200)
      expect(res.body.result.variables.foo).to.equal("bar")
    })
  })

  describe("/dashboardPages", () => {
    it("returns 401 if missing auth header", async () => {
      await request(server).get("/dashboardPages/test-plugin/test").expect(401)
    })

    it("returns 401 if auth header doesn't match auth key", async () => {
      await request(server)
        .get("/dashboardPages/test-plugin/test")
        .set({ [authTokenHeader]: "foo" })
        .send({})
        .expect(401)
    })

    it("should resolve the URL for the given dashboard page and redirect", async () => {
      const res = await request(server)
        .get("/dashboardPages/test-plugin/test")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .expect(302)

      expect(res.header.location).to.equal(`http://localhost:12345/test`)
    })
  })

  describe("/events", () => {
    it("returns 401 if missing auth header", async () => {
      await request(server).post("/events").send({}).expect(401)
    })

    it("returns 401 if auth header doesn't match auth key", async () => {
      await request(server)
        .post("/events")
        .set({ [authTokenHeader]: "foo" })
        .send({})
        .expect(401)
    })

    it("posts events on the incoming event bus", (done) => {
      let passed = false

      gardenServer["incomingEvents"].on("_test", () => {
        !passed && done()
        passed = true
      })

      request(server)
        .post("/events")
        .set({ [authTokenHeader]: gardenServer.authKey })
        .send({
          events: [{ name: "_test", payload: { some: "value" } }],
        })
        .expect(200)
        .catch(done)
    })
  })

  describe("/ws", () => {
    let ws: WebSocket
    let messages: any[]

    beforeEach((done) => {
      messages = []

      ws = new WebSocket(`ws://${hostname}:${port}/ws?key=${gardenServer.authKey}`)
      ws.on("error", done)
      ws.on("message", (msg) => {
        messages.push(JSON.parse(msg.toString()))
      })
      ws.on("open", () => {
        done()
      })
    })

    afterEach(() => {
      ws.close()
    })

    /**
     * Helper for testing websocket callbacks.
     *
     * Optionally filter on specific event types to e.g. only collect messages of type "event" or
     * only collect messages of type "logEntry".
     */
    function onMessageAfterReady({ cb, skipType }: { cb: (req: any) => void; skipType?: string }) {
      ws.on("message", (msg) => {
        const parsed = JSON.parse(msg.toString())
        // This message is always sent at the beginning and we skip it here to simplify testing.
        if (parsed.name !== "connectionReady" && skipType !== parsed.type) {
          cb(parsed)
        }
      })
    }

    it("terminates the connection if auth query params are missing", (done) => {
      const badWs = new WebSocket(`ws://${hostname}:${port}/ws`)
      badWs.on("error", done)
      badWs.on("close", (code, reason) => {
        expect(code).to.eql(4401)
        expect(reason.toString()).to.eql("Unauthorized")
        done()
      })
    })

    it("terminates the connection if key doesn't match and sessionId is missing", (done) => {
      const badWs = new WebSocket(`ws://${hostname}:${port}/ws?key=foo`)
      badWs.on("error", done)
      badWs.on("close", (code, reason) => {
        expect(code).to.eql(4401)
        expect(reason.toString()).to.eql("Unauthorized")
        done()
      })
    })

    it("should send error when a request is not valid JSON", (done) => {
      onMessageAfterReady({
        cb: (req) => {
          expect(req).to.eql({
            type: "error",
            message: "Could not parse message as JSON",
          })
          done()
        },
        skipType: "logEntry",
      })
      ws.send("ijdgkasdghlasdkghals")
    })

    it("should error when a request is missing an ID", (done) => {
      onMessageAfterReady({
        cb: (req) => {
          expect(req).to.eql({
            type: "error",
            message: "Message should contain an `id` field with a UUID value",
          })
          done()
        },
        skipType: "logEntry",
      })
      ws.send(JSON.stringify({ type: "command" }))
    })

    it("should error when a request has an invalid ID", (done) => {
      onMessageAfterReady({
        cb: (req) => {
          expect(req).to.eql({
            type: "error",
            requestId: "ksdhgalsdkjghalsjkg",
            message: "Message should contain an `id` field with a UUID value",
          })
          done()
        },
        skipType: "logEntry",
      })
      ws.send(JSON.stringify({ type: "command", id: "ksdhgalsdkjghalsjkg" }))
    })

    it("should error when a request has an invalid type", (done) => {
      const id = uuidv4()
      onMessageAfterReady({
        cb: (req) => {
          expect(req).to.eql({
            type: "error",
            requestId: id,
            message: "Unsupported request type: foo",
          })
          done()
        },
        skipType: "logEntry",
      })
      ws.send(JSON.stringify({ type: "foo", id }))
    })

    it("should execute a command and return its results", (done) => {
      const id = uuidv4()

      garden
        .dumpConfig({ log: garden.log })
        .then((config) => {
          onMessageAfterReady({
            cb: (req: any) => {
              if (req.type !== "commandResult") {
                return
              }

              expect(req).to.eql({
                type: "commandResult",
                requestId: id,
                result: deepOmitUndefined(config),
              })
              done()
            },
          })
          ws.send(
            JSON.stringify({
              type: "command",
              id,
              command: "get config",
            })
          )
        })
        .catch(done)
    })

    it("should emit log entries under silly log level", (done) => {
      const id = uuidv4()
      const gardenKey = garden.getInstanceKey()

      onMessageAfterReady({
        cb: (req: any) => {
          if (req.type !== "commandResult") {
            return
          }
          const logEntries = messages.filter((m) => m.type === "logEntry" && m.context.gardenKey === gardenKey)
          const sessionLogEntries = logEntries.filter((m) => m.context.sessionId === id)
          const logMessages = sessionLogEntries.map((m) => m.message.msg)

          try {
            expect(logMessages).to.include("Info log")
            expect(logMessages).to.include("Debug log")
            expect(logMessages).to.include("Garden info log")
            expect(logMessages).to.include("Garden debug log")
            expect(logMessages).to.not.include("Silly log")
            expect(logMessages).to.not.include("Garden silly log")
            done()
          } catch (error) {
            done(error)
          }
        },
      })
      ws.send(
        JSON.stringify({
          type: "command",
          id,
          command: "_test",
        })
      )
    })

    it("should correctly map arguments and options to commands", (done) => {
      const id = uuidv4()
      onMessageAfterReady({
        cb: (req) => {
          // Ignore other events such as taskPending and taskProcessing and wait for the command result
          if (req.type !== "commandResult") {
            return
          }
          const taskResult = taskResultOutputs(req.result)
          const result = {
            ...req,
            result: taskResult,
          }
          expect(result.requestId).to.equal(id)
          expect(result.result["build.module-a"]).to.exist
          expect(result.result["build.module-a"].state).to.equal("ready")
          done()
        },
        skipType: "logEntry",
      })
      ws.send(
        JSON.stringify({
          type: "command",
          id,
          command: "build module-a --force",
        })
      )
    })

    it("parses stringArguments if specified", (done) => {
      const id = uuidv4()
      onMessageAfterReady({
        cb: (msg) => {
          if (msg.type === "commandStart") {
            expect(msg.args).to.eql({ names: ["module-a"] })
            expect(msg.opts.force).to.be.true
          }

          // Ignore other events such as taskPending and taskProcessing and wait for the command result
          if (msg.type !== "commandResult") {
            return
          }
          const taskResult = taskResultOutputs(msg.result)
          const result = {
            ...msg,
            result: taskResult,
          }
          expect(result.requestId).to.equal(id)
          expect(result.result["build.module-a"]).to.exist
          expect(result.result["build.module-a"].state).to.equal("ready")
          done()
        },
        skipType: "logEntry",
      })
      ws.send(
        JSON.stringify({
          type: "command",
          id,
          command: "build",
          stringArguments: ["module-a", "--force"],
        })
      )
    })

    it("creates a Garden instance as needed", (done) => {
      const id = uuidv4()
      onMessageAfterReady({
        cb: (msg) => {
          // Ignore other events such as taskPending and taskProcessing and wait for the command result
          if (msg.type !== "commandResult") {
            return
          }
          expect(msg.requestId).to.equal(id)
          expect(msg.result.variables.foo).to.equal("bar")
          done()
        },
        skipType: "logEntry",
      })
      ws.send(
        JSON.stringify({
          type: "command",
          id,
          command: "get config --var foo=bar",
        })
      )
    })

    it("passes the underlying ServeCommand as parentCommand to command action", (done) => {
      const id = uuidv4()
      onMessageAfterReady({
        cb: (msg) => {
          // Ignore other events such as taskPending and taskProcessing and wait for the command result
          if (msg.type !== "commandResult") {
            return
          }

          try {
            expect(msg.result.parentCommandName).to.equal("serve")
            done()
          } catch (error) {
            done(error)
          }
        },
        skipType: "logEntry",
      })
      ws.send(
        JSON.stringify({
          type: "command",
          id,
          command: "_test",
        })
      )
    })

    it("reloads the Garden instance if it's flagged with needsReload=true", (done) => {
      const id = uuidv4()
      let firstDone = false

      onMessageAfterReady({
        cb: (msg) => {
          // Ignore other events such as taskPending and taskProcessing and wait for the command result
          if (msg.type !== "commandResult") {
            return
          }

          if (!firstDone) {
            firstDone = true
            garden.needsReload(true)
            ws.send(
              JSON.stringify({
                type: "command",
                id,
                command: "get config",
              })
            )
            return
          }

          const configScans = messages.filter((m) => m.type === "event" && m.name === "configsScanned")

          if (configScans.length === 1) {
            done()
          } else {
            done("Expected exactly one config scan")
          }
        },
        skipType: "logEntry",
      })
      ws.send(
        JSON.stringify({
          type: "command",
          id,
          command: "get config",
        })
      )
    })
  })
})
