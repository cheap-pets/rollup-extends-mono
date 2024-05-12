import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globToRollupConfig } from '@cheap-pets/rollup-extends'
import { preset } from '@cheap-pets/rollup-preset-vue3'
import { createTranspiler } from '@cheap-pets/rollup-plugin-postcss-scss'

process.chdir(
  dirname(fileURLToPath(import.meta.url))
)
const isDevEnv = Boolean(process.env.dev)
const hashPart = isDevEnv ? '' : '.[hash]'

const scssTransform = createTranspiler({
  browserslistrc: '.browserslistrc'
})

preset.update({
  logLevel: 'warn',
  external: ['vue'],
  output: {
    format: 'iife',
    dir: 'dist',
    entryFileNames: `assets/js/[name]${hashPart}.js`,
    chunkFileNames: `assets/[ext]/[name]${hashPart}.[ext]`,
    assetFileNames: `assets/[ext]/[name]${hashPart}.[ext]`,
    globals: {
      vue: 'Vue'
    }
  },
  overwritePluginOptions: {
    css: {
      include: '**/*.{css,scss,sass,pcss,postcss}',
      minify: 0,
      extract: true,
      transform: scssTransform
    },
    html: {
      fileNames: '[name].html',
      replacements: { '{{ timestamp }}': '2024-04-26' }
    }
  }
})

const config = globToRollupConfig({
  'src/index-*.js': () => preset.config()
})

export default config
