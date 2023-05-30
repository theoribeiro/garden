/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Command, CommandResult, CommandParams } from "./base"
import { startServer } from "../server/server"
import { IntegerParameter, StringsParameter } from "../cli/params"
import { printHeader } from "../logger/util"
import { dedent } from "../util/string"
import { CommandLine } from "../cli/command-line"
import { GardenInstanceManager } from "../server/instance-manager"
import chalk from "chalk"
import { getCloudDistributionName, sleep } from "../util/util"
import { Log } from "../logger/log-entry"
import { findProjectConfig } from "../config/base"
import { CloudApiTokenRefreshError, getGardenCloudDomain } from "../cloud/api"
import { uuidv4 } from "../util/random"
import { Garden } from "../garden"
import { getGardenForRequest } from "../server/commands"

export const defaultServerPort = 9700

export const serveArgs = {}

export const serveOpts = {
  port: new IntegerParameter({
    help: `The port number for the server to listen on (defaults to ${defaultServerPort} if available).`,
  }),
  cmd: new StringsParameter({ help: "(Only used by dev command for now)", hidden: true }),
}

export type ServeCommandArgs = typeof serveArgs
export type ServeCommandOpts = typeof serveOpts

export class ServeCommand<
  A extends ServeCommandArgs = ServeCommandArgs,
  O extends ServeCommandOpts = ServeCommandOpts,
  R = any
> extends Command<A, O, R> {
  name = "serve"
  help = "Starts the Garden Core API server for the current project and environment."

  cliOnly = true
  streamEvents = true
  hidden = true
  noProject = true

  protected _manager?: GardenInstanceManager
  protected commandLine?: CommandLine
  protected sessionId?: string

  description = dedent`
    Starts the Garden Core API server for the current project, and your selected environment+namespace.

    Note: You must currently run one server per environment and namespace.
  `

  arguments = <A>serveArgs
  options = <O>serveOpts

  printHeader({ log }) {
    printHeader(log, "Garden API Server", "🌐")
  }

  terminate() {
    super.terminate()
    this.server?.close().catch(() => {})
  }

  maybePersistent() {
    return true
  }

  allowInDevCommand() {
    return false
  }

  async action({ garden, log, opts }: CommandParams<ServeCommandArgs, ServeCommandOpts>): Promise<CommandResult<R>> {
    const sessionId = garden.sessionId
    this.sessionId = sessionId

    const projectConfig = await findProjectConfig({ log, path: garden.projectRoot })

    let defaultGarden: Garden | undefined

    const manager = this.getManager(log)

    manager.defaultProjectRoot = projectConfig?.path || process.cwd()
    manager.defaultEnv = opts.env

    if (projectConfig) {
      // Try loading the default Garden instance based on found project config, to populate autocompleter etc.
      try {
        defaultGarden = await getGardenForRequest({
          manager,
          projectConfig,
          globalConfigStore: garden.globalConfigStore,
          log,
          args: {},
          opts: {},
          sessionId,
          environmentString: opts.env,
        })
        if (this.commandLine) {
          this.commandLine.cwd = defaultGarden.projectRoot
        }
      } catch (error) {
        log.warn(`Unable to load Garden project found at ${projectConfig.path}: ${error}`)
      }
    }

    const cloudDomain = getGardenCloudDomain(projectConfig?.domain)

    this.server = await startServer({
      log,
      manager,
      port: opts.port,
      defaultProjectRoot: manager.defaultProjectRoot || process.cwd(),
      serveCommand: this,
    })

    try {
      const cloudApi = await manager.getCloudApi({ log, cloudDomain, globalConfigStore: garden.globalConfigStore })

      if (!cloudApi) {
        await garden.emitWarning({
          key: "web-app",
          log,
          message: chalk.green(
            `🌿 Explore logs, past commands, and your dependency graph in the Garden web App. Log in with ${chalk.cyan(
              "garden login"
            )}.`
          ),
        })
      }

      if (projectConfig && cloudApi && defaultGarden) {
        let projectId = projectConfig?.id

        if (!projectId) {
          const cloudProject = await cloudApi.getProjectByName(projectConfig.name)
          projectId = cloudProject?.id
        }

        if (projectId && defaultGarden) {
          await cloudApi.registerSession({
            parentSessionId: undefined,
            projectId,
            // Use the process (i.e. parent command) session ID for the serve command session
            sessionId: manager.sessionId,
            commandInfo: garden.commandInfo,
            localServerPort: this.server.port,
            environment: defaultGarden.environmentName,
            namespace: defaultGarden.namespace,
          })
        }
      }
    } catch (err) {
      if (err instanceof CloudApiTokenRefreshError) {
        const distroName = getCloudDistributionName(cloudDomain)
        log.warn(dedent`
          ${chalk.yellow(`Unable to authenticate against ${distroName} with the current session token.`)}
          The dashboard will not be available until you authenticate again. Please try logging out with
          ${chalk.bold("garden logout")} and back in again with ${chalk.bold("garden login")}.
        `)
      } else {
        // Unhandled error when creating the cloud api
        throw err
      }
    }

    // Print nicer error message when address is not available
    process.on("uncaughtException", (err: any) => {
      if (err.errno === "EADDRINUSE" && err.port === opts.port) {
        log.error({
          msg: dedent`
          Port ${opts.port} is already in use, possibly by another Garden server process.
          Either terminate the other process, or choose another port using the --port parameter.
          `,
        })
      } else {
        log.error({ msg: err.message })
      }
      process.exit(1)
    })

    return new Promise((resolve, reject) => {
      this.server!.on("close", () => {
        resolve({})
      })

      this.server!.on("error", () => {
        reject({})
      })

      // Errors are handled in the method
      this.reload(log)
        .then(async () => {
          if (this.commandLine) {
            for (const cmd of opts.cmd || []) {
              await this.commandLine.typeCommand(cmd)
              await sleep(1000)
            }
          }
          this.commandLine?.flashSuccess(chalk.white.bold(`Dev console is ready to go! 🚀`))
          this.commandLine?.enable()
        })
        // Errors are handled in the method
        .catch(() => {})
    })
  }

  getManager(log: Log, initialSessionId: string | undefined = undefined): GardenInstanceManager {
    if (!this._manager) {
      this._manager = GardenInstanceManager.getInstance({
        log,
        sessionId: this.sessionId || initialSessionId || uuidv4(),
        serveCommand: this,
      })
    }

    return this._manager
  }

  async reload(log: Log) {
    await this.getManager(log).reload(log)
  }
}
