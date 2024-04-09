/* eslint-disable security/detect-object-injection */

import { isFunction, isObject, isString } from '../utils/type.js'

import pluginCopy from './plugin-copy.js'
import pluginDelete from './plugin-delete.js'
import pluginString from './plugin-string.js'
import pluginCompress from './plugin-compress.js'

const plugins = {
  copy: { plugin: pluginCopy },
  delete: { plugin: pluginDelete },
  string: { plugin: pluginString },
  compress: { plugin: pluginCompress, defaultOption: { gzip: true, brotli: true } }
}

function setPlugin (pluginAlias, { plugin, defaultOption, defaultOutputOption }) {
  if (!plugins[pluginAlias] || plugin) {
    plugins[pluginAlias] = {
      plugin,
      defaultOption,
      defaultOutputOption
    }
  } else {
    Object.assign(plugins[pluginAlias], {
      defaultOption,
      defaultOutputOption
    })
  }
}

function isNestedPluginObject (obj) {
  return Object.keys(obj).every(key => ['plugin', 'option'].includes(key))
}

function processPluginFromInstanceObject (obj) {
  return isObject(obj) && !isNestedPluginObject(obj) && obj
}

function processPluginFromFunction (fn, pluginOption) {
  return isFunction(fn) && fn(pluginOption)
}

function processPluginFromAlias (alias, pluginOption, output) {
  if (!isString(alias)) return

  const { plugin, defaultOption, defaultOutputOption } = plugins[alias]

  return (
    processPluginFromFunction(
      plugin,
      pluginOption || (output && defaultOutputOption) || defaultOption
    ) ||
    processPluginFromInstanceObject(plugin)
  )
}

function processPluginFromArray (arr, output) {
  if (!Array.isArray(arr)) return

  const [plugin, pluginOption] = arr

  return (
    processPluginFromAlias(plugin, pluginOption, output) ||
    processPluginFromFunction(plugin, pluginOption) ||
    processPluginFromInstanceObject(plugin)
  )
}

function processPluginFromObject (obj, output) {
  return isObject(obj) && (
    isNestedPluginObject(obj)
      ? processPluginFromArray([obj.plugin, obj.option], output)
      : obj
  )
}

function processPlugin (pluginItem, output = false) {
  const result =
    processPluginFromAlias(pluginItem, output) ||
    processPluginFromArray(pluginItem, output) ||
    processPluginFromObject(pluginItem, output) ||
    processPluginFromFunction(pluginItem)

  return result
}

export {
  setPlugin,
  processPlugin
}
