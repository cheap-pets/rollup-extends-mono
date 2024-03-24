import path from 'node:path'

export function resolveOutputPath (outputOption, fileName) {
  const dir = outputOption.file
    ? path.dirname(outputOption.file)
    : outputOption.dir

  return path.resolve(dir, fileName)
}

export function relativeFromCwd (to) {
  return path.relative(process.cwd(), to)
}
