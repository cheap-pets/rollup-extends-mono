import {
  checkPluginDescriptor,
  resolveConfigPlugins,
  resolveUpdatePlugins,
  createPluginsProxy,
  createOutputPluginsProxy
} from './preset-plugin.js'

function resolveOptions (options) {
  const {
    output = {},
    plugins = [],
    pluginsOptions = {},
    ...config
  } = options

  const {
    plugins: outputPlugins = [],
    outputPluginsOptions = {},
    ...outputConfig
  } = output

  return {
    config,
    plugins,
    pluginsOptions,
    outputConfig,
    outputPlugins,
    outputPluginsOptions
  }
}

function resolvePresetOptions (options) {
  options = resolveOptions(options)

  delete options.pluginsOptions
  delete options.outputPluginsOptions

  const plugins = []
  const outputPlugins = []

  const pluginsMap =
    Object.fromEntries(
      options
        .plugins
        .map(el =>
          checkPluginDescriptor(el) &&
          plugins.push(el.name) &&
          [el.name, { ...el }]
        )
    )

  const outputPluginsMap =
    Object.fromEntries(
      options
        .outputPlugins
        .map(el =>
          checkPluginDescriptor(el) &&
          outputPlugins.push(el.name) &&
          [el.name, { ...el }]
        )
    )

  return Object.assign(options, {
    plugins,
    outputPlugins,
    pluginsMap,
    outputPluginsMap
  })
}

export function createPreset (options = {}) {
  const preset = resolvePresetOptions(options)

  function exportOptions () {
  }

  function config (configOptions) {
    const incoming = resolveOptions(options)

    const config = { ...preset.config, ...incoming.config }
    const output = { ...preset.outputConfig, ...incoming.outputConfig }

    config.plugins =
      resolveConfigPlugins(
        incoming.plugins || preset.plugins,
        incoming.pluginsOptions,
        preset.pluginsMap
      )

    output.plugins =
      resolveConfigPlugins(
        incoming.outputPlugins || preset.outputPlugins,
        incoming.outputPluginsOptions,
        preset.outputPluginsMap
      )

    return Object.assign(config, { output })
  }

  function update (updateOptions) {
    const incoming = resolvePresetOptions(updateOptions)

    Object.assign(preset.config, incoming.config)
    Object.assign(preset.outputConfig, incoming.outputConfig)

    const {
      plugins,
      pluginsMap
    } = resolveUpdatePlugins(preset.pluginsMap, incoming.plugins)

    const {
      plugins: outputPlugins,
      pluginsMap: outputPluginsMap
    } = resolveUpdatePlugins(preset.outputPluginsMap, incoming.outputPlugins)

    Object.assign(preset, {
      plugins,
      pluginsMap,
      outputPlugins,
      outputPluginsMap
    })
  }

  return {
    plugins: createPluginsProxy(preset),
    outputPlugins: createOutputPluginsProxy(preset),
    export: exportOptions,
    config,
    update
  }
}
