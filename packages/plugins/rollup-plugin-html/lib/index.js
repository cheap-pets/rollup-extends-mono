/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */

import { resolve, parse } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'
import { generateHTML, beautifyHTML, getInjectableFiles, createHtmlReplacer } from './html.js'

const {
  ensureFunction,
  createIdMatcher,
  resolveOutputDir,
  relativeFromCwd
} = utils

const pluginAction = 'HTM'

export default function plugin (pluginOptions = {}) {
  const {
    extensions = ['.htm', '.html'],
    replacements,
    beautify: beautifyOptions
  } = pluginOptions

  const assets = {}

  const matchId = createIdMatcher(extensions)
  const fileNames = ensureFunction(pluginOptions.fileNames)
  const executeReplacements = createHtmlReplacer({ replacements }) || (v => v)

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

          const params = Object(asset.entries[rootId].params)
          const name = outputOptions.file ? parse(outputOptions.file).name : file.name
          const fileName = (fileNames(name) || params.fileName)?.replaceAll('[name]', name)

          const referenceId = this.emitFile({
            type: 'asset',
            source: asset.template,
            ...(
              fileName
                ? { fileName, name: 'html' }
                : { name: `${name}.html` }
            )
          })

          const assetName = this.getFileName(referenceId)
          const assetInfo = bundle[assetName]

          const source = generateHTML({
            title: params.title,
            template: assetInfo.source,
            fileName: assetInfo.fileName,
            ...injectableFiles
          })

          assetInfo.source = beautifyHTML(
            executeReplacements(source),
            beautifyOptions
          )

          const outputDir = resolveOutputDir(outputOptions)
          const displayName = relativeFromCwd(resolve(outputDir, assetInfo.fileName))

          this.info({
            pluginAction,
            message: `"${displayName}" is generated.`
          })
        }
      }
    }
  }
}
