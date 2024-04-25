import { transformPresetOptions } from './transform-preset.js'
import { transformRollupOptions } from './transform-rollup.js'
import { transformUpdateOptions } from './transform-update.js'
import { transformExportOptions } from './transform-export.js'

export function createPreset (presetOptions = {}) {
  const preset = transformPresetOptions(presetOptions)

  preset.config = options => transformRollupOptions(preset, options)
  preset.update = options => transformUpdateOptions(preset, options)
  preset.export = options => transformExportOptions(preset, options)

  return preset
}
