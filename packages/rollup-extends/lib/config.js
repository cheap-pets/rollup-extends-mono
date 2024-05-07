import yargs from 'yargs/yargs'

import { parse, basename } from 'node:path'
import { kebabCase, camelCase } from 'change-case'
import { hideBin } from 'yargs/helpers'
import { glob } from 'glob'

import { isString, isObject, ensureFunction } from './utils/type.js'
import { onLog } from './logger.js'

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

function resolveOutputConfig (config, outputOptions, singleEntryName) {
  const { ...output } = outputOptions

  if (singleEntryName) {
    const name = camelCase(singleEntryName)

    if (!output.name && ['iife', 'umd'].includes(output.format)) {
      output.name = name
    }

    if (output.file) {
      output.file = output.file.replaceAll('[name]', singleEntryName)
    } else if (output.dir && !isObject(config.input)) {
      config.input = { [singleEntryName]: config.input }
    }
  }

  return output
}

export function resolveRollupConfig (options) {
  if (Array.isArray(options)) {
    return options.map(el => resolveRollupConfig(el))
  }

  const { input, output, name, /* plugins, */ ...config } = options

  const isStringInput = isString(input)
  const isGlobEntries = Array.isArray(input) || (isStringInput && /[*?|]/.test(input))
  const singleEntryName = isStringInput && !isGlobEntries && name

  config.input = isGlobEntries
    ? Object.fromEntries(globInputs(input))
    : input

  config.output = Array.isArray(output)
    ? output.map(el => resolveOutputConfig(config, el, singleEntryName))
    : resolveOutputConfig(config, output, singleEntryName)

  // config.plugins = plugins?.map(el => processPlugin(el))
  config.onLog ??= onLog

  return config
}

export function globToRollupConfig (input, configHandler) {
  const isCombinedOption = isObject(input)

  if (isCombinedOption) {
    return Object
      .entries(input)
      .map(el => globToRollupConfig(...el))
      .flat()
  }

  const getConfig = ensureFunction(configHandler)

  return globInputs(input)
    .map(
      ([name, input]) =>
        resolveRollupConfig({ input, name, ...getConfig({ input }) })
    )
}
