import { createPreset } from '@cheap-pets/rollup-extends'
import { plugins } from './plugins'

const preset = createPreset({
  plugins,
  
})

export default preset
