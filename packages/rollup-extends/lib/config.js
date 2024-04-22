import yargs from 'yargs/yargs'

import { parse, basename } from 'node:path'
import { kebabCase, camelCase } from 'change-case'
import { hideBin } from 'yargs/helpers'
import { glob } from 'glob'

import { isString, isObject, ensureFunction } from './utils/type.js'
import { processPlugin } from './plugin.js'
import { onLog } from './utils/logger.js'

const argv = yargs(hideBin(process.argv)).argv
const include = argv.include?.split(',').map(el => kebabCase(el))
const exclude = argv.exclude?.split(',').map(el => kebabCase(el))

function parseModuleName (input) {
  const info = parse(input)
  const name = kebabCase(info.name)

  return name === 'index'
    ? kebabCase(basename(info.dir))
    : (name.startsWith('index-') && name.substr(6)) || name
}

function globInputs (pattern) {
  return glob
    .sync(pattern)
    .reduce((result, file) => {
      const name = parseModuleName(file)

      if (
        (!include || include.includes(name)) &&
        (!exclude || !exclude.includes(name))
      ) {
        result.push([name, file])
      }

      return result
    }, [])
}

function resolveOutputConfig (rawConfig, defaultName) {
  const { plugins, ...config } = rawConfig

  if (plugins) {
    config.plugins = plugins.map(el => processPlugin(el, true))
  }

  if (defaultName && !config.name && ['iife', 'umd'].includes(config.format)) {
    config.name = defaultName
  }

  return config
}

export function resolveRollupConfig (rawConfig) {
  if (Array.isArray(rawConfig)) {
    return rawConfig.map(el => resolveRollupConfig(el))
  }

  const { input, output, outputName, plugins, ...config } = rawConfig

  const isGlobEntries = Array.isArray(input) || (isString(input) && input.includes('*'))
  const isSingleEntry = isString(input) || !input.includes('*')
  const defaultName = isSingleEntry && outputName

  config.input = isGlobEntries
    ? Object.fromEntries(globInputs(input))
    : input

  config.output = Array.isArray(output)
    ? output.map(el => resolveOutputConfig(el, defaultName))
    : resolveOutputConfig(output, defaultName)

  config.plugins = plugins?.map(el => processPlugin(el))
  config.onLog ??= onLog

  return config
}

export function globToRollupConfig (patternOrCombined, configHandler) {
  const isCombinedOption = isObject(patternOrCombined)

  if (isCombinedOption) {
    return Object
      .entries(patternOrCombined)
      .map(el => globToRollupConfig(...el))
      .flat()
  }

  const getRawConfig = ensureFunction(configHandler)

  return globInputs(patternOrCombined)
    .map(([name, input]) => resolveRollupConfig({
      input,
      outputName: camelCase(name),
      ...getRawConfig(input)
    }))
}
