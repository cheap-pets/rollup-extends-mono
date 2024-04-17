const ROLLUP_BUILD_HOOKS = [
  'buildEnd', 'buildStart', 'closeWatcher',
  'load', 'moduleParsed', 'onLog',
  'options', 'resolveDynamicImport', 'resolveId',
  'shouldTransformCachedModule', 'transform', 'watchChange'
]

const ROLLUP_OUTPUT_HOOKS = [
  'augmentChunkHash', 'banner', 'closeBundle',
  'footer', 'generateBundle', 'intro',
  'outputOptions', 'outro', 'renderChunk',
  'renderDynamicImport', 'renderError', 'renderStart',
  'resolveFileUrl', 'resolveImportMeta', 'writeBundle'
]

const ROLLUP_OUTPUT_HOOKS_STRING_PROPS = [
  'banner', 'footer',
  'intro', 'outro'
]

export {
  ROLLUP_BUILD_HOOKS,
  ROLLUP_OUTPUT_HOOKS,
  ROLLUP_OUTPUT_HOOKS_STRING_PROPS
}
