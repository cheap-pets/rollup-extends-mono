import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'

import { glob } from 'glob'
import { blue, cyan } from 'colorette'
import { copy as fsCopy, pathExists } from 'fs-extra'

import compress from '../utils/compress.js'

const isDevEnv = process.env.dev

export default function plugin (options = {}) {
  const {
    copyOnce = true,
    verbose = true,
    compress = 'gz,br',
    entries = []
  } = options

  const encoder = !isDevEnv && getEncoder(compress)

  async function copy (file, dest) {
    const fileName = path.basename(file)
    const target = path.resolve(cwd, dest, fileName)
    const ext = path.extname(file)

    await fsCopy(file, target)

    if (verbose) {
      console.log(blue(`[CPY] ${fileName} → ${dest}`))
    }

    if (encoder && ['.js', '.css'].includes(ext)) {
      await encoder(target)

      if (verbose) {
        console.log(cyan(`[ZIP] ${path.relative(cwd, target)}`))
      }
    }
  }

  function srcIsDir (entry) {
    const src = entry.src
    const srcDir = path.resolve(cwd, src)

    if (pathExistsSync(srcDir) && fs.statSync(src).isDirectory()) {
      entry.src += '/**/*'
      return true
    }
    return false
  }

  let copied = false

  return {
    name: 'copy',
    buildEnd: async () => {
      if (options === false || (copyOnce && copied)) return

      if (!Array.isArray(entries)) {
        throw Error('"entries" option should be specified with an array!')
      }

      const watches = {}

      for (const el of entries) {
        const srcDir = path.resolve(el.src)
        const srcFileIsDir = srcIsDir(el)

        const files = glob.sync(el.src, { nodir: true })

        for (const file of files) {
          const src = path.resolve(file)

          const relativePath = path.relative(srcDir, path.dirname(src))
          const destPath = srcFileIsDir ? path.resolve(el.dest, relativePath) : el.dest

          await copy(src, destPath)

          if (isDevEnv) watches[src] = destPath
        }
      }

      const watchFiles = Object.keys(watches)

      if (watchFiles.length) {
        const watcher = chokidar.watch(watchFiles)

        watcher.on('change', file => copy(file, watches[file]))
      }

      copied = true
    }
  }
}
