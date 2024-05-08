/* eslint-disable security/detect-object-injection */

import { defaults, isObject, isString } from '../utils/type.js'

function resolvePluginDescriptor (v, defaultTag) {
  const result = isString(v) ? { name: v } : { ...v }

  if (isString(result.plugin)) {
    result.name = result.plugin
    delete result.plugin
  }

  if (!result.name) {
    throw new Error('Invalid plugin name.')
  }

  if (!result.tag) {
    result.tag = defaultTag
  }

  return result
}

function transformPlugins (
  plugins,
  pluginsMap,
  previousMap,
  defaultTag = 'default'
) {
  return plugins && plugins.map(el => {
    el = resolvePluginDescriptor(el, defaultTag)

    const existing = plugins[el.name]
    const previous = previousMap[el.name] || { options: {} }

    const option = defaults(el.option, previous.options[el.tag])

    if (existing) {
      if (el.plugin && el.plugin !== existing.plugin) {
        throw new Error(
          `A plugin named "${el.name}" already exists.`
        )
      }

      if (el.tag in existing.options) {
        throw new Error(
          `Plugin "${el.name}" has an existing configuration tagged as "${el.tag}".`
        )
      }

      existing.options[el.tag] = option
    } else {
      const thePlugin = el.plugin || previous.plugin

      if (!thePlugin) {
        throw new Error('Invalid plugin definition.')
      }

      pluginsMap[el.name] = {
        plugin: thePlugin,
        options: { [el.tag]: option }
      }
    }

    return { plugin: el.name, tag: el.tag }
  })
}

function classifyPLuginOptions (options) {
  const result = {}
  const defaultOption = {}

  if (isObject(options)) {
    Object.entries(options).forEach(([key, value]) => {
      const isTagKey = key.startsWith('#') && key.length > 1
      const tag = isTagKey ? key.substr(1) : 'default'

      if (isTagKey) result[tag] = value
      else defaultOption[key] = value
    })

    if (Object.keys(defaultOption).length && !('default' in result)) {
      result.default = defaultOption
    }
  } else {
    result.default = options
  }

  return result
}

function updatePluginOptions (plugin, options) {
  const classified = classifyPLuginOptions(options)

  Object
    .keys(plugin.options)
    .forEach(key => {
      if (key in classified) plugin.options[key] = classified[key]
    })
}

export function transformUpdateOptions (preset, incomingOptions = {}) {
  const { options, plugins: previousMap } = preset
  const { plugins: oldPlugins, output: oldOutput } = options
  const { plugins: newPlugins, output: newOutput, overwritePluginOptions = {}, ...newOptions } = incomingOptions

  const pluginsMap = preset.plugins = {}

  const resolvePlugins = (plugins, defaultTag) => (
    transformPlugins(
      plugins,
      pluginsMap,
      previousMap,
      defaultTag
    )
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
    ? Object.assign(oldOutput, newOutput)
    : defaults(newOutput, oldOutput)

  Object.assign(
    options,
    newOptions,
    {
      plugins: resolvePlugins(newPlugins || oldPlugins),
      output: resolveOutput(output)
    }
  )

  Object
    .entries(overwritePluginOptions)
    .forEach(([pluginName, pluginOptions]) => {
      const plugin = pluginsMap[pluginName]

      if (plugin && options !== undefined) {
        updatePluginOptions(plugin, pluginOptions)
      }
    })
}
