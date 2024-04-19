/* eslint-disable security/detect-object-injection */

import { isFunction, isObject, isString } from './utils/type.js'

const store = {}

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
  if (!isString(alias) || !store[alias]) return

  const { plugin, defaultOption, defaultOutputOption } = store[alias]

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

export function processPlugin (pluginItem, output = false) {
  const result =
    processPluginFromAlias(pluginItem, output) ||
    processPluginFromArray(pluginItem, output) ||
    processPluginFromObject(pluginItem, output) ||
    processPluginFromFunction(pluginItem)

  return result
}

export function registerPlugin (name, options) {
  store[name] = (isFunction(options) || !options.plugin)
    ? { plugin: options }
    : { ...options }
}

export function updatePluginOptions (name, options) {
  const { plugin, ...pluginOptions } = options

  Object.assign(store[name], pluginOptions)
}
