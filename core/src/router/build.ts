/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import chalk from "chalk"

import { PluginEventBroker } from "../plugin-context"
import { BaseRouterParams, createActionRouter } from "./base"
import { ActionState, stateForCacheStatusEvent } from "../actions/types"
import { PublishActionResult } from "../plugin/handlers/Build/publish"

const API_ACTION_TYPE = "build"

export const buildRouter = (baseParams: BaseRouterParams) =>
  createActionRouter("Build", baseParams, {
    getStatus: async (params) => {
      const { router, action, garden } = params
      const actionType = API_ACTION_TYPE

      const startedAt = new Date().toISOString()

      // Then an actual build won't take place, so we emit a build status event to that effect.
      const actionVersion = action.versionString()
      const payloadAttrs = {
        moduleName: action.moduleName(),
        actionName: action.name,
        actionType,
        actionUid: action.getUid(),
        actionVersion,
        startedAt,
      }

      garden.events.emit("buildStatus", {
        ...payloadAttrs,
        state: "getting-status",
        status: { state: "fetching" },
      })
      const statusOutput = await router.callHandler({
        params,
        handlerType: "getStatus",
        defaultHandler: async () => ({ state: <ActionState>"unknown", detail: {}, outputs: {} }),
      })
      const status = statusOutput.result
      const { state } = status

      await router.validateActionOutputs(action, "runtime", status.outputs)
      garden.events.emit("buildStatus", {
        ...payloadAttrs,
        completedAt: new Date().toISOString(),
        state: stateForCacheStatusEvent(state),
        status: { state: state === "ready" ? "fetched" : "outdated" },
      })
      return statusOutput
    },

    build: async (params) => {
      const { action, garden, router } = params

      const actionUid = action.getUid()
      params.events = params.events || new PluginEventBroker(garden)

      const startedAt = new Date().toISOString()

      const actionName = action.name
      const actionType = API_ACTION_TYPE
      const actionVersion = action.versionString()
      const moduleName = action.moduleName()

      params.events.on("log", ({ timestamp, msg, origin, level }) => {
        // stream logs to CLI
        params.log[level]({ msg, origin })
        // stream logs to Garden Cloud
        garden.events.emit("log", {
          timestamp,
          actionUid,
          actionName,
          actionType,
          moduleName,
          origin: origin || "",
          data: msg,
        })
      })
      const payloadAttrs = {
        actionName,
        actionVersion,
        actionType,
        moduleName,
        actionUid,
        startedAt,
      }

      garden.events.emit("buildStatus", {
        ...payloadAttrs,
        state: "processing",
        status: { state: "building" },
      })

      const emitBuildStatusEvent = (state: "ready" | "failed") => {
        garden.events.emit("buildStatus", {
          ...payloadAttrs,
          state,
          completedAt: new Date().toISOString(),
          status: {
            state: state === "ready" ? "built" : "failed",
          },
        })
      }

      try {
        const output = await router.callHandler({
          params,
          handlerType: "build",
          defaultHandler: async () => ({ state: <ActionState>"unknown", outputs: {}, detail: {} }),
        })
        const { result } = output

        await router.validateActionOutputs(action, "runtime", result.outputs)

        emitBuildStatusEvent("ready")
        return output
      } catch (err) {
        emitBuildStatusEvent("failed")
        throw err
      }
    },

    publish: async (params) => {
      return params.router.callHandler({ params, handlerType: "publish", defaultHandler: dummyPublishHandler })
    },
  })

const dummyPublishHandler = async ({ action }): Promise<PublishActionResult> => {
  return {
    state: "unknown",
    detail: {
      message: chalk.yellow(`No publish handler available for type ${action.type}`),
      published: false,
    },
    outputs: {},
  }
}
