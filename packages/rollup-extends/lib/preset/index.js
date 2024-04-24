import {
  transformToPresetOptions,
  transformToRollupOptions,
  transformToUpdateOptions,
  transformToExportOptions
} from './transform-options.js'

export function createPreset (presetOptions = {}) {
  const preset = transformToPresetOptions(presetOptions)

  preset.config = options => transformToRollupOptions(preset, options)
  preset.update = options => transformToUpdateOptions(preset, options)
  preset.export = () => transformToExportOptions(preset)

  return preset
}
