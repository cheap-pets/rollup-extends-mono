/* eslint-disable security/detect-object-injection */

import { isObject } from '../utils/type.js'

function transformPlugins (
  newPlugins,
  newPluginsMap,
  oldPluginsMap,
  defaultTag = 'default'
) {
  return newPlugins && newPlugins.map(el => {
    const { name, plugin, option, tag = defaultTag } = isObject(el) ? el : { name: el }

    if (!name) {
      throw new Error('Invalid plugin name.')
    }

    const newExisting = newPluginsMap[name]
    const oldExisting = oldPluginsMap[name] || { options: {} }

    const getOption = () =>
      option === undefined
        ? oldExisting.options[tag]
        : option

    if (newExisting) {
      if (plugin && plugin !== newExisting.plugin) {
        throw new Error(
          `A plugin named "${name}" already exists.`
        )
      }

      if (tag in newExisting.options) {
        throw new Error(
          `Plugin "${name}" has an existing configuration tagged as "${tag}".`
        )
      }

      newExisting.options[tag] = getOption()
    } else {
      const newPlugin = plugin || oldExisting.plugin

      if (!newPlugin) {
        throw new Error('Invalid plugin definition.')
      }

      newPluginsMap[name] = {
        plugin: newPlugin,
        options: { [tag]: getOption() }
      }
    }

    return { plugin: name, tag }
  })
}

export function transformUpdateOptions (preset, incomingOptions = {}) {
  const { output: oldOutput } = preset.options
  const { output: newOutput, plugins: newPlugins, pluginsOptions, ...newOptions } = incomingOptions

  const oldPluginsMap = preset.plugins
  const newPluginsMap = preset.plugins = {}

  function resolveOutput (outputOptions = {}) {
    return Array.isArray(outputOptions)
      ? outputOptions.map(el => resolveOutput(el))
      : {
          ...outputOptions,
          plugins: transformPlugins(outputOptions.plugins, newPluginsMap, oldPluginsMap, 'output')
        }
  }

  Object.assign(preset.options, newOptions)

  if (newPlugins) {
    preset.plugins = {}
    preset.options.plugins = transformPlugins(newPlugins, newPluginsMap, oldPluginsMap)
  }

  if (newOutput) {
    preset.options.output = resolveOutput(
      isObject(oldOutput) && isObject(newOutput)
        ? { ...oldOutput, ...newOutput }
        : newOutput || oldOutput
    )
  }
}
