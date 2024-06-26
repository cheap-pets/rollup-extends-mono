/* eslint-disable security/detect-non-literal-fs-filename */

import { promisify } from 'node:util'
import { pipeline } from 'node:stream'
import { createReadStream, createWriteStream } from 'node:fs'
import { constants, createGzip, createBrotliCompress } from 'node:zlib'

const {
  BROTLI_PARAM_MODE, BROTLI_MODE_TEXT,
  BROTLI_PARAM_QUALITY, BROTLI_MAX_QUALITY,
  Z_BEST_COMPRESSION
} = constants

const pipe = promisify(pipeline)

export function gzipCompress (file) {
  const src = createReadStream(file)
  const dest = createWriteStream(`${file}.gz`)

  const compressor = createGzip({
    level: Z_BEST_COMPRESSION
  })

  return pipe(src, compressor, dest)
}

export function brotliCompress (file) {
  const src = createReadStream(file)
  const dest = createWriteStream(`${file}.br`)

  const compressor = createBrotliCompress({
    params: {
      [BROTLI_PARAM_MODE]: BROTLI_MODE_TEXT,
      [BROTLI_PARAM_QUALITY]: BROTLI_MAX_QUALITY
    }
  })

  return pipe(src, compressor, dest)
}

export function compress (file, options = {}) {
  const { gzip, brotli } = options

  return Promise.all([
    (gzip !== false && gzipCompress(file)),
    (brotli && brotliCompress(file))
  ])
}
