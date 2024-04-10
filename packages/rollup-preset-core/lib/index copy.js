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

function parseModuleName (input) {
  const filename = kebabCase(parse(input).name)
  const inline = filename.startsWith('index-') && filename.substr(6)

  return inline || kebabCase(basename(dirname(input)))
}

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
    .map(file => [parseModuleName(file), file])
    .filter(el =>
      (!include || include.includes(kebabCase(el[0]))) &&
      (!exclude || !exclude.includes(kebabCase(el[0])))
    )

  return Object.fromEntries(entries)
}

function processRollupEntry (entryOptions) {
  const {
    input: rawInput,
    output,
    plugins,
    separateEntries,
    ...config
  } = entryOptions

  function buildConfig (input) {
    const entryConfig = {
      onLog,
      input,
      output:
        Array.isArray(output)
          ? output.map(el => processOutputConfig(el))
          : processOutputConfig(output),
      ...config
    }

    if (plugins) {
      entryConfig.plugins = plugins.map(el => processPlugin(el))
    }
  }

  const input = output.file || isObject(rawInput)
    ? entryOptions.input
    : isString(rawInput) && !rawInput.includes('*')
      ? rawInput
      : getFilteredGlobFiles(rawInput)

  return separateEntries && isObject(input)
    ? Object.entries(input).map(([key, value]) => buildConfig({ [key]: value }))
    : buildConfig(input)
}

function generateRollupConfig (options) {
  return Array.isArray(options)
    ? options.map(el => processRollupEntry(el)).flat()
    : processRollupEntry(options)
}

export { generateRollupConfig }
// export { plugins } from './plugins/index.js'
