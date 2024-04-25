/* eslint-disable security/detect-object-injection */

import { isString, isObject, isFunction } from '../utils/type.js'

function isPluginDescriptor (v) {
  return (
    isObject(v) &&
    Object.keys(v).every(key => ['plugin', 'tag', 'option'].includes(key))
  )
}

function transformPlugins (
  preset,
  plugins,
  pluginsOptions = {},
  defaultTag = 'default'
) {
  function resolveFromString (v, tag = defaultTag) {
    const matched = isString(v) && Object(preset.plugins[v])

    if (!matched) return

    const options = pluginsOptions[v]

    return {
      plugin: matched.plugin,
      option: options?.[`#${tag}`] || (tag === 'default' && options) || matched.options[tag]
    }
  }

  function resolveFromObject (v) {
    return (
      isPluginDescriptor(v) &&
      {
        plugin: v.plugin,
        ...(isString(v.plugin) && resolveFromString(v.plugin, v.tag)),
        ...(v.option && { option: v.option })
      }
    )
  }

  function resolveFromArray (v) {
    return Array.isArray(v) && {
      plugin: v[0],
      ...(isString(v[0]) && resolveFromString(v[0])),
      ...(v[1] && { option: v[1] })
    }
  }

  return plugins && plugins.map(el => {
    const { plugin, option } =
      resolveFromString(el) ||
      resolveFromObject(el) ||
      resolveFromArray(el) ||
      { plugin: el }

    return isFunction(plugin)
      ? plugin(option)
      : plugin
  })
}

export function transformRollupOptions (preset, incomingOptions = {}) {
  const { output: oldOutput, plugins: oldPlugins, ...oldOptions } = preset.options
  const { output: newOutput, plugins: newPlugins, pluginsOptions, ...newOptions } = incomingOptions

  function resolveOutput (outputOptions = {}) {
    return Array.isArray(outputOptions)
      ? outputOptions.map(el => resolveOutput(el))
      : {
          ...outputOptions,
          plugins: transformPlugins(preset, outputOptions.plugins, pluginsOptions, 'output')
        }
  }

  const plugins = transformPlugins(
    preset,
    newPlugins || oldPlugins,
    pluginsOptions
  )

  const output = resolveOutput(
    isObject(oldOutput) && isObject(newOutput)
      ? { ...oldOutput, ...newOutput }
      : newOutput || oldOutput
  )

  return Object.assign(
    oldOptions,
    newOptions,
    {
      plugins,
      output
    }
  )
}
