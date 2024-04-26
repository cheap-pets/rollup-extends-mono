/* eslint-disable security/detect-object-injection */

import { defaults, isString, isObject, isFunction } from '../utils/type.js'

function isPluginDescriptor (v) {
  return (
    isObject(v) &&
    Object.keys(v).every(key => ['plugin', 'tag', 'option'].includes(key))
  )
}

function transformPlugins (plugins, pluginsMap, pluginsOptions, defaultTag = 'default') {
  function resolveFromString (v, tag = defaultTag) {
    const matched = isString(v) && Object(pluginsMap[v])

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
  const { output: newOutput, plugins: newPlugins, pluginsOptions = {}, ...newOptions } = incomingOptions

  const resolvePlugins = (plugins, defaultTag) => (
    transformPlugins(plugins, preset.plugins, pluginsOptions, defaultTag)
  )

  const resolveOutput = (outputs = {}) => (
    Array.isArray(outputs)
      ? outputs.map(resolveOutput)
      : {
          ...outputs,
          plugins: resolvePlugins(outputs.plugins, 'output')
        }
  )

  const output = isObject(oldOutput) && isObject(newOutput)
    ? { ...oldOutput, ...newOutput }
    : defaults(newOutput, oldOutput)

  return Object.assign(
    oldOptions,
    newOptions,
    {
      plugins: resolvePlugins(newPlugins || oldPlugins),
      output: resolveOutput(output)
    }
  )
}
