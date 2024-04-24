import {
  resolvePresetOptions,
  resolveRollupOptions,
  resolveUpdateOptions,
  resolveExportOptions
} from './resolve-options.js'

export function createPreset (presetOptions = {}) {
  const preset = resolvePresetOptions(presetOptions)

  preset.config = options => resolveRollupOptions(preset, options)
  preset.update = options => resolveUpdateOptions(preset, options)
  preset.export = () => resolveExportOptions(preset)

  return preset
}
