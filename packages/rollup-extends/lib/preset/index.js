/* eslint-disable security/detect-object-injection */

import { isFunction } from '../utils/type.js'

import { exportRollupConfig } from './rollup.js'
import { updatePresetConfig } from './update.js'

import rfdc from 'rfdc'

const clone = rfdc()

function resolvePlugins (
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

function resolveOutput (preset, outputOptions = {}) {
  return Array.isArray(outputOptions)
    ? outputOptions.map(el => resolveOutput(el))
    : {
        ...outputOptions,
        plugins: resolvePlugins(preset, outputOptions.plugins, 'output')
      }
}

export function createPreset (presetOptions = {}) {
  const { plugins, output, ...options } = presetOptions

  const preset = {
    options,
    plugins: {},
    config: exportRollupConfig,
    update: updatePresetConfig,
    extend (options) {
      return clone(this).update(options)
    }
  }

  options.plugins = resolvePlugins(preset, plugins)
  options.output = resolveOutput(preset, output)

  return preset
}
