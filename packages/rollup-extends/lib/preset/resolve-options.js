/* eslint-disable security/detect-object-injection */

import { resolvePresetPlugins, resolveRollupPlugins } from './resolve-plugins.js'
import { isObject } from '../utils/type.js'

export function resolvePresetOptions (incomingOptions) {
  const preset = { plugins: {} }

  function resolveOutput (outputOptions = {}) {
    return Array.isArray(outputOptions)
      ? outputOptions.map(el => resolveOutput(el))
      : {
          ...outputOptions,
          plugins: resolvePresetPlugins(preset, outputOptions.plugins, 'output')
        }
  }

  const { plugins, output, ...options } = incomingOptions

  options.plugins = resolvePresetPlugins(preset, plugins)
  options.output = resolveOutput(output)

  return Object.assign(preset, { options })
}

export function resolveRollupOptions (preset, incomingOptions = {}) {
  const { output: oldOutput, plugins: oldPlugins, ...oldOptions } = preset.options
  const { output: newOutput, plugins: newPlugins, pluginsOptions, ...newOptions } = incomingOptions

  function resolveOutput (outputOptions = {}) {
    return Array.isArray(outputOptions)
      ? outputOptions.map(el => resolveOutput(el))
      : {
          ...outputOptions,
          plugins: resolveRollupPlugins(preset, outputOptions.plugins, pluginsOptions, 'output')
        }
  }

  const plugins = resolveRollupPlugins(
    preset,
    newPlugins || oldPlugins,
    pluginsOptions
  )

  const output = resolveOutput(
    isObject(oldOutput) && isObject(newOutput)
      ? { ...oldOutput, ...newOutput }
      : newOutput || oldOutput
  )

  return Object.assign(oldOptions, newOptions, { plugins, output })
}

export function resolveUpdateOptions (preset, incomingOptions) {

}

export function resolveExportOptions (preset) {

}
