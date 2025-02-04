/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { memoize } from "lodash"
import { createSchema, joi, joiIdentifier } from "../config/common"

export type NamespaceState = "ready" | "missing"

// When needed, we can make this type generic and add e.g. a detail for plugin-specific metadata.
export interface NamespaceStatus {
  pluginName: string
  namespaceName: string
  state: NamespaceState
}

export const namespaceStatusSchema = createSchema({
  name: "namespace-status",
  keys: () => ({
    pluginName: joi.string(),
    namespaceName: joiIdentifier(),
    state: joi.string().valid("ready", "missing"),
  }),
})

export function environmentToString({ environmentName, namespace }: { environmentName: string; namespace?: string }) {
  return namespace ? `${environmentName}.${namespace}` : environmentName
}

export const namespaceStatusesSchema = memoize(() => joi.array().items(namespaceStatusSchema()))
