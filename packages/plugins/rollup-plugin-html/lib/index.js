/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */

import { resolve } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'
import { generateHTML, beautifyHTML, getInjectableFiles, createHtmlReplacer } from './html.js'

const {
  ensureFunction,
  createIdMatcher,
  resolveOutputDir,
  relativeFromCwd,
  resolveEmitFileName
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

  async function emitFile (options, outputOptions) {
    const { chunkName, template, scripts, links, params = {} } = options
    const { format, assetFileNames } = outputOptions

    const assetInfo = {
      type: 'asset',
      name: `${chunkName}.html`,
      source: template
    }

    const getFileName = ensureFunction(fileNames || assetFileNames || '[name].[ext]')

    const fileName =
      resolveEmitFileName(
        params.fileName || (getFileName(assetInfo)),
        {
          name: chunkName,
          hash: '',
          ext: 'html',
          extname: '.html',
          format: format !== 'iife' && format
        }
      ) || assetInfo.name

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
        return ''
      }
    },

    async generateBundle (outputOptions, bundle) {
      const files = Object.values(bundle)
      const injectableFiles = getInjectableFiles(files, outputOptions.format)

      for (const file of files) {
        if (file.type !== 'chunk') continue

        const rootId = file.facadeModuleId
        const moduleIds = this.getModuleIds(rootId)

        for (const moduleId of moduleIds) {
          const asset = matchId(moduleId) && assets[moduleId]

          if (!asset || !asset.template || !asset.entries[rootId]) continue

          await emitFile.call(
            this,
            {
              chunkName: file.name,
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
