import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globToRollupConfig } from '@cheap-pets/rollup-extends'
import { preset as presetVue2 } from '@cheap-pets/rollup-preset-vue2'
import { preset as presetVue3 } from '@cheap-pets/rollup-preset-vue3'
import { createTranspiler } from '@cheap-pets/rollup-plugin-postcss-scss'

process.chdir(
  dirname(fileURLToPath(import.meta.url))
)
const isDevEnv = Boolean(process.env.dev)
const hashPart = isDevEnv ? '' : '.[hash]'
const logLevel = isDevEnv ? 'info' : 'warn'

const scssTransform = createTranspiler({
  browserslistrc: '.browserslistrc',
  variables: {
    color1: '#369',
    color2: '#258'
  }
})

const overwritePluginOptions = {
  alias: {
    entries: {
      '@': resolve('src')
    }
  },
  css: {
    include: '**/*.{css,scss,sass,pcss,postcss}',
    minify: 0,
    extract: true,
    transform: scssTransform
  },
  html: {
    fileNames: '[name].html',
    replacements () {
      return { timestamp: new Date() }
    }
  }
}

presetVue3.update({
  logLevel,
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
  overwritePluginOptions
})

presetVue2.update({
  logLevel,
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
  overwritePluginOptions
})

const config = globToRollupConfig({
  'src/index-*.js': () => presetVue3.config(),
  'src/vue2.js': () => presetVue2.config()
})

export default config
