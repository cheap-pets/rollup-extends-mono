import { glob } from 'glob'
import { normalize, relative } from 'node:path'

import { copy } from '../utils/copy.js'
import { isObject } from '../utils/type.js'

const handled = {}
const alias = 'CPY'

function resolveTargets (targets) {
  return isObject(targets)
    ? Object.entries(targets).map(el => ({ src: el[0], dest: el[1] }))
    : Array.isArray(targets) ? targets : []
}

function addFreshPath (total, current) {
  const prev = total.length && total.slice(-1)

  if (!prev || relative(prev, current).startsWith('..')) {
    total.push(current)
  }

  return total
}

function plugin (pluginOptions = {}) {
  const targets = resolveTargets(pluginOptions.targets)

  return {
    name: 'copy',

    async buildStart () {
      const unhandled = targets.filter(el =>
        !handled[el.src] && (handled[el.src] = true)
      )

      for (const el of unhandled) {
        const dest = normalize(el.dest)
        const paths = (await glob(el.src)).sort().reduce(addFreshPath, [])

        for (const src of paths) {
          await copy(src, dest, pluginOptions)
            .then(() => this.info({ alias, success: true, message: `"${src}" -> "${dest}".` }))
            .catch(() => this.warn({ alias, error: true, message: `failed to copy "${src}".` }))
        }
      }
    }
  }
}

export default plugin
