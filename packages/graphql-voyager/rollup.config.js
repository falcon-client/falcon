import typescript from 'rollup-plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import ejs from 'rollup-plugin-ejs';
import replace from 'rollup-plugin-replace';
import reactSvg from 'rollup-plugin-react-svg';

const reactToolboxVariables = {
  'color-primary': 'var(--palette-cyan-500)',
  'preferred-font': '"helvetica neue", helvetica, arial, sans-serif'
};

export default {
  entry:
    process.env.BUILD === 'foo'
      ? './src/index.tsx'
      : './src/graph/viz-worker.worker.js',

  output: {
    format: 'es'
  },

  dest: process.env.BUILD === 'foo' ? 'es/voyager.js' : 'es/worker.js',

  plugins: [
    typescript({
      typescript: require('typescript')
    }),
    postcss({
      extract: true
    }),
    ejs(),
    replace({
      DEBUG: false,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    reactSvg()
  ],
  external(id) {
    return id.includes('node_modules');
  }
};
