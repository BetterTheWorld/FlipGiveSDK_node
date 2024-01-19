/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  external: ['node:buffer', 'jose'],
  input: 'src/index.js',
  output: [
    {
      file: 'dist/mjs/index.js',
      format: 'es'
    },
    {
      file: 'dist/cjs/index.js',
      format: 'cjs'
    }
  ]
};

export default config;
