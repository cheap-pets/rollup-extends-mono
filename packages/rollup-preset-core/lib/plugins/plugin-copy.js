/* eslint-disable security/detect-non-literal-fs-filename */

import { glob } from 'glob'
import { copy } from 'fs-extra'
import { stat } from 'node:fs/promises'
import { parse, normalize, relative, join } from 'node:path'

import { isObject } from '../utils/type.js'
import { compress } from '../utils/compress.js'

const handled = {}
const pluginAction = 'CPY'

function resolveTargets (targets) {
  return isObject(targets)
    ? Object.entries(targets).map(el => ({ src: el[0], dest: el[1] }))
    : Array.isArray(targets) ? targets : []
}

function addFreshPath (total, current) {
  const prev = total.length && total.slice(-1)[0]

  if (!prev || relative(prev, current).startsWith('..')) {
    total.push(current)
  }

  return total
}

function plugin (pluginOptions = {}) {
  const targets = resolveTargets(pluginOptions.targets)

  const compressOption = pluginOptions.compress
  const compressExtensions = compressOption?.extensions?.map(el => el.toLowerCase()) || ['.js', '.css']

  return {
    name: 'copy',

    async buildStart () {
      const unhandled = targets.filter(el =>
        !handled[el.src] && (handled[el.src] = true)
      )

      const internalCompress = async (dest, isDir) => {
        const files = isDir
          ? (await glob(`${dest.replaceAll('\\', '/')}/**/*`, { nodir: true }))
          : [dest]

        for (const file of files) {
          if (compressExtensions.includes(parse(file).ext.toLocaleLowerCase())) {
            await compress(file, compressOption)
              .then(() =>
                this.info({ pluginAction: 'CPY > ZIP', success: true, message: `"${file}" is compressed.` })
              )
              .catch(() =>
                this.warn({ pluginAction: 'CPY > ZIP', message: `failed to compress "${file}".` })
              )
          }
        }
      }

      for (const el of unhandled) {
        const dest = normalize(el.dest)
        const destExt = parse(dest).ext

        const paths = (await glob(el.src)).sort().reduce(addFreshPath, [])

        for (const src of paths) {
          try {
            const isDir = (await stat(src)).isDirectory()
            const to = (isDir || destExt) ? dest : join(dest, parse(src).base)

            await Promise
              .resolve()
              .then(() =>
                copy(src, to)
              )
              .then(() =>
                this.info({ pluginAction, success: true, message: `"${src}" -> "${dest}".` })
              )
              .then(() =>
                !this.meta.watchMode && compressOption && internalCompress(to, isDir)
              )
          } catch {
            this.warn({ pluginAction, error: true, message: `failed to copy "${src}".` })
          }
        }
      }
    }
  }
}

export default plugin
