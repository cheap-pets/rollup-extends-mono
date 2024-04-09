/* eslint-disable security/detect-non-literal-fs-filename */

import { parse, join } from 'node:path'
import { stat } from 'node:fs/promises'
import { copy as fsCopy } from 'fs-extra'

export async function copy (src, dest, options) {
  return stat(src)
    .then(res => res.isDirectory())
    .then(isDir =>
      isDir || parse(dest).ext
        ? fsCopy(src, dest)
        : fsCopy(src, join(dest, parse(src).base))
    )
}
