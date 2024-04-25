import { dirname, resolve, relative, parse, join } from 'node:path'

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

export function changeExtension (filePath, newExtension) {
  const { dir, name } = parse(filePath)

  return join(dir, `${name}${newExtension}`)
}

export function resolveEmitFileName (fileName, replacements = {}) {
  return Object
    .entries(replacements)
    .reduce(
      (result, [key, value = '']) => result.replaceAll(`[${key}]`, value),
      fileName
    )
    .replace(/\.{2,}/g, '.')
}
