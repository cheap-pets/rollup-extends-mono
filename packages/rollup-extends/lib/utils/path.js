import { dirname, resolve, relative } from 'node:path'

export function resolveOutputDir (outputOption) {
  return outputOption.file
    ? dirname(outputOption.file)
    : outputOption.dir
}

export function resolveOutputPath (outputOption, fileName) {
  return resolve(
    resolveOutputDir(outputOption),
    fileName
  )
}

export function relativeFromCwd (to) {
  return relative(process.cwd(), to)
}
