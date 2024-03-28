import { glob } from 'glob'
import { relative } from 'node:path'
import { copy } from '../utils/copy'
import { isObject } from '../utils/type.js'

const handled = {}
const alias = 'CPY'

function plugin (options = {}) {
  const targets = isObject(options.targets)
    ? Object
      .entries(options.targets)
      .map(el => ({ src: el[0], dest: el[1] }))
    : Array.isArray(options.targets)
      ? options.targets
      : []

  return {
    name: 'copy',

    async buildStart () {
      function internalCopy (src, dest) {
        return copy(src, dest)
          .then(res => res && this.info({ alias, success: true, message: `"${src}" is copied.` }))
          .catch(() => this.warn({ alias, error: true, message: `failed to copy "${src}".` }))
      }

      const unhandled = targets.filter(
        el => !handled[el.src] && (handled[el.src] = true)
      )

      if (unhandled.length) {
        for (const el of unhandled) {
          const paths = (await glob(el.src))
            .sort()
            .reduce((result, path) => {
              const prev = result.length && result.slice(-1)

              if (!prev || relative(prev, path).startsWith('..')) {
                result.push(path)
              }

              return result
            }, [])

          for (const src of paths) {
            await internalCopy(src, el.dest)
          }
        }
      }
    }
  }
}

export default plugin
