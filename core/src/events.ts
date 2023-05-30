/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { omit } from "lodash"
import { EventEmitter2 } from "eventemitter2"
import type { LogEntryEventPayload } from "./cloud/buffered-event-stream"
import type { DeployState, DeployStatusForEventPayload } from "./types/service"
import type { RunState, RunStatusForEventPayload } from "./plugin/base"
import type { Omit } from "./util/util"
import type { AuthTokenResponse } from "./cloud/api"
import type { ConfigGraph, RenderedActionGraph } from "./graph/config-graph"
import type { CommandInfo } from "./plugin-context"
import type { GraphResult } from "./graph/results"
import { NamespaceStatus } from "./types/namespace"
import { BuildState, BuildStatusForEventPayload } from "./plugin/handlers/Build/get-status"
import { ActionStateForEvent } from "./actions/types"

interface EventContext {
  gardenKey?: string
  sessionId?: string
}

type EventPayload<T extends EventName> = Events[T] & { $context?: EventContext }

export type GardenEventListener<T extends EventName> = (payload: EventPayload<T>) => void
export type GardenEventAnyListener<E extends EventName = any> = (name: E, payload: EventPayload<E>) => void

/**
 * This simple class serves as the central event bus for a Garden instance. Its function
 * is mainly to consolidate all events for the instance, to ensure type-safety.
 *
 * See below for the event interfaces.
 */
export class EventBus extends EventEmitter2 {
  private keyIndex: {
    [key: string]: { [eventName: string]: ((payload: any) => void)[] }
  }

  constructor(private context: EventContext = {}) {
    super({
      wildcard: false,
      newListener: false,
      maxListeners: 5000, // we may need to adjust this
    })
    this.keyIndex = {}
  }

  emit<T extends EventName>(name: T, payload: EventPayload<T>) {
    // The context set in the constructor is added on the $context field
    return super.emit(name, { $context: { ...payload.$context, ...this.context }, ...payload })
  }

  on<T extends EventName>(name: T, listener: GardenEventListener<T>) {
    return super.on(name, listener)
  }

  /**
   * Registers the listener under the provided key for easy cleanup via `offKey`. This is useful e.g. for the
   * plugin event broker, which is instantiated in several places and where there isn't a single obvious place to
   * remove listeners from all instances generated in a single command run.
   */
  onKey<T extends EventName>(name: T, listener: GardenEventListener<T>, key: string) {
    if (!this.keyIndex[key]) {
      this.keyIndex[key] = {}
    }
    if (!this.keyIndex[key][name]) {
      this.keyIndex[key][name] = []
    }
    this.keyIndex[key][name].push(listener)
    return super.on(name, listener)
  }

  /**
   * Removes all event listeners for the event `name` that were registered under `key` (via `onKey`).
   */
  offKey<T extends EventName>(name: T, key: string) {
    if (!this.keyIndex[key]) {
      return
    }
    if (!this.keyIndex[key][name]) {
      return
    }
    for (const listener of this.keyIndex[key][name]) {
      this.removeListener(name, listener)
    }
    delete this.keyIndex[key][name]
  }

  /**
   * Removes all event listeners that were registered under `key` (via `onKey`).
   */
  clearKey(key: string) {
    if (!this.keyIndex[key]) {
      return
    }
    for (const name of Object.keys(this.keyIndex[key])) {
      for (const listener of this.keyIndex[key][name]) {
        this.removeListener(name, listener)
      }
    }
    delete this.keyIndex[key]
  }

  /**
   * Add the given listener if it's not already been added.
   * Basically an idempotent version of on(), which otherwise adds the same listener again if called twice with
   * the same listener.
   */
  ensure<T extends EventName>(name: T, listener: GardenEventListener<T>) {
    for (const l of this.listeners(name)) {
      if (l === listener) {
        return this
      }
    }
    return super.on(name, listener)
  }

  onAny(listener: GardenEventAnyListener) {
    return super.onAny(<any>listener)
  }

  /**
   * Add the given listener if it's not already been added.
   * Basically an idempotent version of onAny(), which otherwise adds the same listener again if called twice with
   * the same listener.
   */
  ensureAny(listener: GardenEventAnyListener) {
    for (const l of this.listenersAny()) {
      if (l === listener) {
        return this
      }
    }
    return super.onAny(<any>listener)
  }

  once<T extends EventName>(name: T, listener: GardenEventListener<T>) {
    return super.once(name, listener)
  }

  // TODO: wrap more methods to make them type-safe
}

/**
 * Supported logger events and their interfaces.
 */

export type GraphResultEventPayload = Omit<GraphResult, "result" | "task" | "dependencyResults" | "error"> & {
  error: string | null
}

export interface CommandInfoPayload extends CommandInfo {
  // Contains additional context for the command info available during init
  environmentName: string
  environmentId: number | undefined
  projectName: string
  projectId: string
  namespaceName: string
  namespaceId: number | undefined
  coreVersion: string
  vcsBranch: string
  vcsCommitHash: string
  vcsOriginUrl: string
}

export function toGraphResultEventPayload(result: GraphResult): GraphResultEventPayload {
  return {
    ...omit(result, "result", "dependencyResults", "task"),
    error: result.error ? String(result.error) : null,
  }
}

export type ActionStatusDetailedState = DeployState | BuildState | RunState

export interface ActionStatusPayload<S = { state: ActionStatusDetailedState }> {
  actionName: string
  actionVersion: string
  actionUid: string
  moduleName: string | null // DEPRECATED: Remove in 0.14
  startedAt: string
  completedAt?: string
  state: ActionStateForEvent
  status: S
}

/**
 * Supported Garden events and their interfaces.
 */
export interface Events {
  // Internal test/control events
  _exit: {}
  _restart: {}
  _test: { msg?: string }

  _workflowRunRegistered: {
    workflowRunUid: string
  }

  // Process events
  serversUpdated: {
    servers: { host: string; command: string; serverAuthKey: string }[]
  }
  connectionReady: {}
  receivedToken: AuthTokenResponse

  // Session events - one of these is emitted when the command process ends
  sessionCompleted: {} // Command exited with a 0 status
  sessionFailed: {} // Command exited with a nonzero status
  sessionCancelled: {} // Command exited because of an interrupt signal (e.g. CTRL-C)

  // Watcher events
  internalError: {
    timestamp: Date
    error: Error
  }
  // TODO: We may want to split this up into `projectConfigChanged` and `actionConfigChanged`, but we don't currently
  // need that distinction for our purposes.
  configChanged: {
    path: string
  }

  configGraph: { graph: ConfigGraph }
  configsScanned: {}

  autocompleterUpdated: { projectRoot: string }

  // Command/project metadata events
  commandInfo: CommandInfoPayload

  // Stack Graph events
  stackGraph: RenderedActionGraph

  // TODO: Remove these once the Cloud UI no longer uses them.

  // TaskGraph events
  taskProcessing: {
    /**
     * ISO format date string
     */
    startedAt: string
    key: string
    type: string
    name: string
    inputVersion: string
  }
  taskComplete: GraphResultEventPayload
  taskReady: GraphResult
  taskError: GraphResultEventPayload
  taskCancelled: {
    /**
     * ISO format date string
     */
    cancelledAt: string
    type: string
    key: string
    name: string
  }
  taskGraphProcessing: {
    /**
     * ISO format date string
     */
    startedAt: string
  }
  taskGraphComplete: {
    /**
     * ISO format date string
     */
    completedAt: string
  }

  /**
   * Line-by-line action log events. These are emitted by the `PluginEventBroker` instance passed to action handlers.
   *
   * This is in contrast with the `logEntry` event below, which represents framework-level logs emitted by the logger.
   *
   * TODO: Instead of having two event types (`log` and `logEntry`), we may want to unify the two.
   */
  log: {
    /**
     * ISO format date string
     */
    timestamp: string
    actionUid: string
    actionName: string
    actionType: string
    moduleName: string | null
    origin: string
    data: string
  }
  logEntry: LogEntryEventPayload

  // Action status events

  /**
   * In the `buildStatus`, `runStatus`, `testStatus` and `deployStatus` events, the optional `actionUid` field
   * identifies a single build/run/test/deploy.
   *
   * The `ActionRouter.build.build`/`ActionRouter.test.test`/`ActionRouter.run.run`/`ActionRouter.deploy.deploy`
   * actions emit two events: One before the plugin handler is called (a "building"/"running"/"deploying" event), and
   * another one after the handler finishes successfully or throws an error.
   *
   * When logged in, the `actionUid` is used by the Garden Cloud backend to group these two events for each of these
   * action invocations.
   *
   * No `actionUid` is set for the corresponding "get status/result" actions (e.g. `ActionRouter.build.getStatus` or
   * `ActionRouter.test.getResult`), since those actions don't result in a build/deploy/run being executed (so there
   * are no associated logs or timestamps to track).
   */

  buildStatus: ActionStatusPayload<BuildStatusForEventPayload>
  runStatus: ActionStatusPayload<RunStatusForEventPayload>
  testStatus: ActionStatusPayload<RunStatusForEventPayload>
  deployStatus: ActionStatusPayload<DeployStatusForEventPayload>
  namespaceStatus: NamespaceStatus

  // Workflow events
  workflowRunning: {}
  workflowComplete: {}
  workflowError: {}
  workflowStepProcessing: {
    index: number
  }
  workflowStepSkipped: {
    index: number
  }
  workflowStepComplete: {
    index: number
    durationMsec: number
  }
  workflowStepError: {
    index: number
    durationMsec: number
  }
}

export type EventName = keyof Events

type GraphEventName = Extract<EventName, "taskCancelled" | "taskComplete" | "taskError" | "taskProcessing">
type ConfigEventName = Extract<EventName, "configChanged" | "configsScanned" | "autocompleterUpdated">

// These are the events we POST over https via the BufferedEventStream
const pipedEventNamesSet = new Set<EventName>([
  "_test",
  "_workflowRunRegistered",
  "configsScanned",
  "configChanged",
  "sessionCompleted",
  "sessionFailed",
  "sessionCancelled",
  "internalError",
  "log",
  "commandInfo",
  "namespaceStatus",
  "deployStatus",
  "stackGraph",
  "taskCancelled",
  "taskComplete",
  "taskError",
  "taskGraphComplete",
  "taskGraphProcessing",
  "taskProcessing",
  "buildStatus",
  "runStatus",
  "testStatus",
  "workflowComplete",
  "workflowError",
  "workflowRunning",
  "workflowStepComplete",
  "workflowStepError",
  "workflowStepProcessing",
  "workflowStepSkipped",
])

// We send graph and config events over a websocket connection via the Garden server
const taskGraphEventNames = new Set<GraphEventName>(["taskCancelled", "taskComplete", "taskError", "taskProcessing"])
const configEventNames = new Set<ConfigEventName>(["configsScanned", "configChanged", "autocompleterUpdated"])

// We do not emit these task graph events because they're simply not needed, and there's a lot of them.
const skipTaskGraphEventTypes = ["resolve-action", "resolve-provider"]

const isPipedEvent = (name: string, _payload: any): _payload is Events[EventName] => {
  return pipedEventNamesSet.has(<any>name)
}

const isConfigEvent = (name: string, _payload: any): _payload is Events[ConfigEventName] => {
  return configEventNames.has(<any>name)
}

const isTaskGraphEvent = (name: string, _payload: any): _payload is Events[GraphEventName] => {
  return taskGraphEventNames.has(<any>name)
}

export function shouldStreamWsEvent(name: string, payload: any) {
  const gardenKey = payload?.$context?.gardenKey

  if (isTaskGraphEvent(name, payload) && !skipTaskGraphEventTypes.includes(payload.type) && gardenKey) {
    return true
  } else if (isConfigEvent(name, payload)) {
    return true
  }

  return false
}

export function shouldStreamEvent(name: string, payload: any) {
  if (isTaskGraphEvent(name, payload) && skipTaskGraphEventTypes.includes(payload.type)) {
    return false
  } else if (!isPipedEvent(name, payload)) {
    return false
  }
  return true
}

