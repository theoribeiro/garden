/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { realpath } from "fs-extra"
import normalizePath from "normalize-path"
import tmp from "tmp-promise"
import { ActionState, stateForCacheStatusEvent } from "../actions/types"
import { PluginEventBroker } from "../plugin-context"
import { runStatusForEventPayload } from "../plugin/base"
import { copyArtifacts, getArtifactKey } from "../util/artifacts"
import { BaseRouterParams, createActionRouter } from "./base"

const API_ACTION_TYPE = "run"

export const runRouter = (baseParams: BaseRouterParams) =>
  createActionRouter("Run", baseParams, {
    run: async (params) => {
      const { garden, router, action } = params

      const actionUid = action.getUid()
      const tmpDir = await tmp.dir({ unsafeCleanup: true })
      const artifactsPath = normalizePath(await realpath(tmpDir.path))

      const actionName = action.name
      const actionVersion = action.versionString()
      const actionType = API_ACTION_TYPE
      const moduleName = action.moduleName()

      const payloadAttrs = {
        actionName,
        actionVersion,
        actionType,
        moduleName,
        actionUid,
        startedAt: new Date().toISOString(),
      }

      garden.events.emit("runStatus", {
        ...payloadAttrs,
        state: "processing",
        status: { state: "running" },
      })

      params.events = params.events || new PluginEventBroker(garden)

      try {
        // Annotate + emit log output
        params.events.on("log", ({ timestamp, msg, origin, level }) => {
          if (!params.interactive) {
            // stream logs to CLI; if interactive is true, the output will already be streamed to process.stdout
            // TODO: make sure that logs of different tasks in the same module can be differentiated
            params.log[level]({ msg, origin })
          }
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

        const output = await router.callHandler({ params: { ...params, artifactsPath }, handlerType: "run" })
        const { result } = output

        await router.validateActionOutputs(action, "runtime", result.outputs)

        // Emit status
        garden.events.emit("runStatus", {
          ...payloadAttrs,
          state: result.state,
          completedAt: new Date().toISOString(),
          status: runStatusForEventPayload(result.detail),
        })
        // TODO: get this out of the core framework and shift it to the provider
        router.emitNamespaceEvent(result.detail?.namespaceStatus)

        return output
      } finally {
        // Copy everything from the temp directory, and then clean it up
        try {
          await copyArtifacts({
            garden,
            log: params.log,
            artifactsPath,
            key: getArtifactKey("run", action.name, actionVersion),
          })
        } finally {
          await tmpDir.cleanup()
        }
      }
    },

    getResult: async (params) => {
      const { garden, router, action } = params

      const actionName = action.name
      const actionVersion = action.versionString()
      const actionType = API_ACTION_TYPE

      const moduleName = action.moduleName()

      const payloadAttrs = {
        actionName,
        actionVersion,
        actionType,
        moduleName,
        actionUid: action.getUid(),
        startedAt: new Date().toISOString(),
      }

      garden.events.emit("runStatus", {
        ...payloadAttrs,
        state: "getting-status",
        status: { state: "unknown" },
      })

      const output = await router.callHandler({
        params,
        handlerType: "getResult",
        defaultHandler: async () => ({ state: <ActionState>"unknown", detail: null, outputs: {} }),
      })
      const { result } = output

      garden.events.emit("runStatus", {
        ...payloadAttrs,
        state: stateForCacheStatusEvent(result.state),
        completedAt: new Date().toISOString(),
        status: runStatusForEventPayload(result.detail),
      })

      if (result) {
        await router.validateActionOutputs(action, "runtime", result.outputs)
      }

      return output
    },
  })
