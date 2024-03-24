import yargs from 'yargs/yargs'

import { parse, basename, dirname } from 'node:path'
import { kebabCase } from 'change-case' // camelCase, pascalCase,
import { hideBin } from 'yargs/helpers'
import { glob } from 'glob'

import { processPlugin } from './plugins/index.js'
import { isObject, isString } from './utils/type.js'
import { onLog } from './utils/logger.js'

const argv = yargs(hideBin(process.argv)).argv
const include = argv.include?.split(',').map(el => kebabCase(el))
const exclude = argv.exclude?.split(',').map(el => kebabCase(el))

function extractModuleName (input) {
  const filename = kebabCase(parse(input).name)
  const inline = filename.startsWith('index-') && filename.substr(6)

  return inline || kebabCase(basename(dirname(input)))
}

/*
function processModuleConfig (input, options) {
  const { plugins, output, ...config } = options

  config.input = input

  config.output = Array.isArray(output)
    ? output.map(el => processOutputConfig(input, el))
    : processOutputConfig(input, output)

  if (plugins) {
    config.plugins = plugins.map(el => processPlugin(el))
  }

  return config
}
*/

function processOutputConfig (rawOutputConfig) {
  const { plugins, ...config } = rawOutputConfig

  if (plugins) {
    config.plugins = plugins.map(plugin => processPlugin(plugin, true))
  }

  return config
}

function getFilteredGlobFiles (input) {
  const entries = glob
    .sync(input)
    .map(file => [extractModuleName(file), file])
    .filter(el =>
      (!include || include.includes(kebabCase(el[0]))) &&
      (!exclude || !exclude.includes(kebabCase(el[0])))
    )

  return Object.fromEntries(entries)
}

function processRollupEntry (entryOptions) {
  const {
    input,
    output,
    plugins,
    ...config
  } = entryOptions

  config.input = output.file || isObject(input)
    ? entryOptions.input
    : isString(input) && !input.includes('*')
      ? input
      : getFilteredGlobFiles(input)

  config.output = Array.isArray(output)
    ? output.map(el => processOutputConfig(el))
    : processOutputConfig(output)

  config.onLog ??= onLog

  if (plugins) {
    config.plugins = plugins.map(el => processPlugin(el))
  }

  return config
}

function generateRollupConfig (options) {
  return Array.isArray(options)
    ? options.map(el => processRollupEntry(el))
    : processRollupEntry(options)
}

export { generateRollupConfig }
// export { plugins } from './plugins/index.js'
