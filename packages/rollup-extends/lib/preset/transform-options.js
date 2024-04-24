/* eslint-disable security/detect-object-injection */

import { transformToPresetPlugins, transformToRollupPlugins } from './transform-plugins.js'
import { isObject } from '../utils/type.js'

export function transformToPresetOptions (incomingOptions) {
  const preset = { plugins: {} }

  function resolveOutput (outputOptions = {}) {
    return Array.isArray(outputOptions)
      ? outputOptions.map(el => resolveOutput(el))
      : {
          ...outputOptions,
          plugins: transformToPresetPlugins(preset, outputOptions.plugins, 'output')
        }
  }

  const { plugins, output, ...options } = incomingOptions

  options.plugins = transformToPresetPlugins(preset, plugins)
  options.output = resolveOutput(output)

  return Object.assign(preset, { options })
}

export function transformToRollupOptions (preset, incomingOptions = {}) {
  const { output: oldOutput, plugins: oldPlugins, ...oldOptions } = preset.options
  const { output: newOutput, plugins: newPlugins, pluginsOptions, ...newOptions } = incomingOptions

  function resolveOutput (outputOptions = {}) {
    return Array.isArray(outputOptions)
      ? outputOptions.map(el => resolveOutput(el))
      : {
          ...outputOptions,
          plugins: transformToRollupPlugins(preset, outputOptions.plugins, pluginsOptions, 'output')
        }
  }

  const plugins = transformToRollupPlugins(
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

export function transformToUpdateOptions (preset, incomingOptions) {

}

export function transformToExportOptions (preset) {

}
