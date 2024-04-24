/* eslint-disable security/detect-object-injection */

import { isString, isObject, isFunction } from './utils/type.js'

export function checkPluginDescriptor (pluginDescriptor) {
  if (
    !isObject(pluginDescriptor) ||
    !pluginDescriptor.name ||
    !pluginDescriptor.plugin
  ) {
    throw new Error('Invalid plugin definition in preset options.')
  }

  return true
}

export function resolveConfigPlugins (plugins, pluginsOptions, pluginsMap) {
  function resolveFromAlias (v) {
    const { plugin, option } = isString(v) && Object(pluginsMap[v])

    return plugin && { plugin, defaultOption: option }
  }

  function resolveFromObject (v) {
    return (
      isObject(v) && v.plugin &&
      Object.keys(v).every(key => ['name', 'plugin', 'option'].includes(key)) &&
      {
        ...v,
        ...resolveFromAlias(v.plugin)
      }
    )
  }

  function resolveFromArray (v) {
    return Array.isArray(v) && {
      plugin: v[0],
      option: v[1],
      ...resolveFromAlias(v[0])
    }
  }

  return plugins.map(el => {
    const { name, plugin, option, defaultOption } =
      resolveFromAlias(el) ||
      resolveFromArray(el) ||
      resolveFromObject(el) ||
      { plugin: el }

    return isFunction(plugin)
      ? plugin(option || (name && pluginsOptions[name]) || defaultOption)
      : plugin
  })
}

export function resolveUpdatePlugins (currentPluginsMap, incomingPlugins) {
  const plugins = []

  const pluginsMap = Object.fromEntries(
    incomingPlugins
      .plugins
      .map(el => {
        const descriptor = isString(el)
          ? currentPluginsMap[el]
          : isObject(el) && { ...(el.name && currentPluginsMap[el.name]), ...el }

        return (
          checkPluginDescriptor(descriptor) &&
          plugins.push(descriptor.name) &&
          [descriptor.name, descriptor]
        )
      })
  )

  return {
    plugins,
    pluginsMap
  }
}

function _createPluginsProxy (target) {
  return {
    data () {
      return [...target.plugins]
    },

    get (index) {
      return target.plugins[index]
    },

    length () {
      return target.plugins.length
    },

    insert (beforePluginName, newPluginDescriptor) {
      const name = newPluginDescriptor.name

      if (name in target.plugins) {
        throw new Error(`A plugin with the name "${name}" already exists.`)
      }

      const idx = beforePluginName
        ? target.plugins.findIndex(el => el === beforePluginName)
        : target.plugins.length

      if (idx < 0) {
        throw new Error(`Cannot locate plugin "${beforePluginName}".`)
      }

      target.pluginsMap[name] = { ...newPluginDescriptor }
      target.plugins.splice(idx, 0, name)
    },

    update (pluginName, pluginDescriptor) {
      if (!target.pluginsMap[pluginName]) {
        throw new Error(`Plugin "${pluginName}" does not exists.`)
      }

      target.pluginsMap[pluginName] = { ...pluginDescriptor }
    },

    remove (pluginName) {
      const idx = target.plugins.findIndex(el => el === pluginName)

      if (idx < 0) {
        throw Error(`Plugin "${pluginName}" does not exists.`)
      }

      delete target.pluginsMap[pluginName]

      target.plugins.splice(idx, 1)
    },

    [Symbol.iterator] () {
      let index = 0

      return {
        next () {
          return index < target.plugins.length
            ? { value: target.plugins[index++], done: false }
            : { value: undefined, done: true }
        }
      }
    }
  }
}

export function createPluginsProxy (preset) {
  return _createPluginsProxy({
    get plugins () {
      return preset.plugins
    },

    get pluginsMap () {
      return preset.pluginsMap
    }
  })
}

export function createOutputPluginsProxy (preset) {
  return _createPluginsProxy({
    get plugins () {
      return preset.outputPlugins
    },

    get pluginsMap () {
      return preset.outputPluginsMap
    }
  })
}
