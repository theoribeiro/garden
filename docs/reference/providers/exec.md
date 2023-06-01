---
title: "`exec` Provider"
tocTitle: "`exec`"
---

# `exec` Provider

## Description

A simple provider that allows running arbitrary scripts when initializing providers, and provides the exec
action type.

_Note: This provider is always loaded when running Garden. You only need to explicitly declare it in your provider
configuration if you want to configure a script for it to run._

Below is the full schema reference for the provider configuration. For an introduction to configuring a Garden project with providers, please look at our [configuration guide](../../using-garden/configuration-overview.md).

The reference is divided into two sections. The [first section](#complete-yaml-schema) contains the complete YAML schema, and the [second section](#configuration-keys) describes each schema key.

## Complete YAML Schema

The values in the schema below are the default values.

```yaml
providers:
  - # The name of the provider plugin to use.
    name:

    # List other providers that should be resolved before this one.
    dependencies: []

    # If specified, this provider will only be used in the listed environments. Note that an empty array effectively
    # disables the provider. To use a provider in all environments, omit this field.
    environments:

    # An optional script to run in the project root when initializing providers. This is handy for running an
    # arbitrary
    # script when initializing. For example, another provider might declare a dependency on this provider, to ensure
    # this script runs before resolving that provider.
    initScript:
```
## Configuration Keys

### `providers[]`

| Type            | Default | Required |
| --------------- | ------- | -------- |
| `array[object]` | `[]`    | No       |

### `providers[].name`

[providers](#providers) > name

The name of the provider plugin to use.

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

Example:

```yaml
providers:
  - name: "local-kubernetes"
```

### `providers[].dependencies[]`

[providers](#providers) > dependencies

List other providers that should be resolved before this one.

| Type            | Default | Required |
| --------------- | ------- | -------- |
| `array[string]` | `[]`    | No       |

Example:

```yaml
providers:
  - dependencies:
      - exec
```

### `providers[].environments[]`

[providers](#providers) > environments

If specified, this provider will only be used in the listed environments. Note that an empty array effectively disables the provider. To use a provider in all environments, omit this field.

| Type            | Required |
| --------------- | -------- |
| `array[string]` | No       |

Example:

```yaml
providers:
  - environments:
      - dev
      - stage
```

### `providers[].initScript`

[providers](#providers) > initScript

An optional script to run in the project root when initializing providers. This is handy for running an arbitrary
script when initializing. For example, another provider might declare a dependency on this provider, to ensure
this script runs before resolving that provider.

| Type     | Required |
| -------- | -------- |
| `string` | No       |


## Outputs

The following keys are available via the `${providers.<provider-name>}` template string key for `exec` providers.

### `${providers.<provider-name>.outputs.initScript.log}`

The full log output from the executed command. (Pro-tip: Make it machine readable so it can be parsed by dependants)

| Type     | Default |
| -------- | ------- |
| `string` | `""`    |
