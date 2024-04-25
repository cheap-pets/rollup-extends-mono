/* eslint-disable security/detect-object-injection */

import { isFunction } from '../utils/type.js'

function transformPlugins (
  preset,
  plugins,
  defaultTag = 'default'
) {
  return plugins && plugins.map(el => {
    const { name, plugin, option, tag = defaultTag } = Object(el)

    const existing = name && preset.plugins[name]

    if (existing) {
      if (plugin && plugin !== existing.plugin) {
        throw new Error(
          `A plugin named "${name}" already exists.`
        )
      }

      if (tag in existing.options) {
        throw new Error(
          `Plugin "${name}" has an existing configuration tagged as "${tag}".`
        )
      }

      existing.options[tag] = option
    } else {
      if (!name || !isFunction(plugin)) {
        throw new Error('Invalid plugin definition.')
      }

      preset.plugins[name] = {
        plugin,
        options: { [tag]: option }
      }
    }

    return { plugin: name, tag }
  })
}

export function transformPresetOptions (incomingOptions) {
  const preset = { plugins: {} }

  function resolveOutput (outputOptions = {}) {
    return Array.isArray(outputOptions)
      ? outputOptions.map(el => resolveOutput(el))
      : {
          ...outputOptions,
          plugins: transformPlugins(preset, outputOptions.plugins, 'output')
        }
  }

  const { plugins, output, ...options } = incomingOptions

  options.plugins = transformPlugins(preset, plugins)
  options.output = resolveOutput(output)

  return Object.assign(preset, { options })
}
