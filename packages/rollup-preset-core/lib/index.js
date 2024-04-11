import yargs from 'yargs/yargs'

import { parse, basename, dirname } from 'node:path'
import { kebabCase } from 'change-case'
import { hideBin } from 'yargs/helpers'
import { glob } from 'glob'

import { isObject, isString } from './utils/type.js'
import { processPlugin } from './plugins/index.js'
import { onLog } from './utils/logger.js'

const argv = yargs(hideBin(process.argv)).argv
const include = argv.include?.split(',').map(el => kebabCase(el))
const exclude = argv.exclude?.split(',').map(el => kebabCase(el))

function parseModuleName (input) {
  const filename = kebabCase(parse(input).name)
  const inline = filename.startsWith('index-') && filename.substr(6)

  return inline || kebabCase(basename(dirname(input)))
}

function getFilteredGlobFiles (input) {
  const entries = glob
    .sync(input)
    .map(file => [parseModuleName(file), file])
    .filter(el =>
      (!include || include.includes(kebabCase(el[0]))) &&
      (!exclude || !exclude.includes(kebabCase(el[0])))
    )

  return Object.fromEntries(entries)
}

function processEntryConfig (options) {
  const {
    input: rawInput,
    output: rawOutput,
    plugins: rawPlugins,
    separateInputs,
    ...config
  } = options

  function buildOutputConfig (output) {
    const { plugins, ...outputConfig } = output

    if (plugins) {
      outputConfig.plugins = plugins.map(plugin => processPlugin(plugin, true))
    }

    return outputConfig
  }

  function buildConfig (input) {
    return {
      onLog,
      input,
      plugins: rawPlugins?.map(el => processPlugin(el)),
      output:
        Array.isArray(rawOutput)
          ? rawOutput.map(el => buildOutputConfig(el))
          : buildOutputConfig(rawOutput),
      ...config
    }
  }

  const input = rawOutput.file || isObject(rawInput)
    ? config.input
    : isString(rawInput) && !rawInput.includes('*')
      ? rawInput
      : getFilteredGlobFiles(rawInput)

  return separateInputs && isObject(input)
    ? Object.entries(input).map(([key, value]) => buildConfig({ [key]: value }))
    : buildConfig(input)
}

function generateRollupConfig (options) {
  return Array.isArray(options)
    ? options.map(el => processEntryConfig(el)).flat()
    : processEntryConfig(options)
}

export { generateRollupConfig }
export { registerPlugin, updatePluginOptions } from './plugins/index.js'
