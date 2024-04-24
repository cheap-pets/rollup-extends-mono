/* eslint-disable security/detect-object-injection */

import { isString, isObject, isFunction } from '../utils/type.js'

function isPluginDescriptor (v) {
  return (
    isObject(v) &&
    Object.keys(v).every(key => ['plugin', 'tag', 'option'].includes(key))
  )
}

export function resolvePresetPlugins (
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

export function resolveRollupPlugins (
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
