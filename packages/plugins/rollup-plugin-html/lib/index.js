/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */

import { resolve, parse } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'
import { generateHTML, beautifyHTML, getInjectableFiles, createHtmlReplacer } from './html.js'

const {
  ensureFunction,
  createIdMatcher,
  resolveOutputDir,
  relativeFromCwd,
  resolvePlaceholders
} = utils

const pluginAction = 'HTM'

export default function plugin (pluginOptions = {}) {
  const {
    extensions = ['.htm', '.html'],
    fileNames,
    replacements,
    beautify: beautifyOptions
  } = pluginOptions

  const assets = {}
  const matchId = createIdMatcher(extensions)
  const replaceContent = createHtmlReplacer({ replacements }) || (v => v)

  function emitFile (options, outputOptions) {
    const { name, template, scripts, links, params = {} } = options
    const { format, assetFileNames } = outputOptions

    const assetName = `${name}.html`
    const assetInfo = { type: 'asset', name: assetName, source: template }
    const getFileName = ensureFunction(fileNames || assetFileNames || '[name].[ext]')

    const fileName =
      resolvePlaceholders(
        params.fileName || (getFileName(assetInfo)),
        {
          name,
          hash: '',
          ext: 'html',
          extname: '.html',
          format: format !== 'iife' && format
        }
      ) || assetName

    const title = params.title
    const source = generateHTML({ title, template, fileName, scripts, links })

    this.emitFile({
      fileName,
      type: 'asset',
      source: beautifyHTML(replaceContent(source), beautifyOptions)
    })

    const outputDir = resolveOutputDir(outputOptions)
    const displayName = relativeFromCwd(resolve(outputDir, fileName))

    this.info({
      pluginAction,
      message: `"${displayName}" is generated.`
    })
  }

  return {
    name: 'html',

    async resolveId (source, importer) {
      const matched = matchId(source, true)

      if (!matched) return null

      const id = (await this.resolve(matched.id, importer)).id
      const asset = (assets[id] ??= { entries: {} })

      for (const moduleId of this.getModuleIds(importer)) {
        if (this.getModuleInfo(moduleId).isEntry) {
          asset.entries[moduleId] = { params: matched.params }
        }
      }

      return id
    },

    transform (code, id) {
      if (matchId(id)) {
        assets[id].template = code

        return 'export default undefined'
      }
    },

    generateBundle (outputOptions, bundle) {
      const files = Object.values(bundle)
      const injectableFiles = getInjectableFiles(files, outputOptions.format)

      for (const file of files) {
        if (file.type !== 'chunk') continue

        const rootId = file.facadeModuleId
        const moduleIds = this.getModuleIds(rootId)

        for (const id of moduleIds) {
          const asset = assets[id]

          if (!asset || !asset.template || !asset.entries[rootId]) continue

          emitFile.call(
            this,
            {
              name: parse(file.fileName).name,
              params: asset.entries[rootId].params,
              template: asset.template,
              ...injectableFiles
            },
            outputOptions
          )
        }
      }
    }
  }
}
