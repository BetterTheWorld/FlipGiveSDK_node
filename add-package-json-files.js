import * as fs from 'fs';

fs.writeFileSync('./dist/mjs/package.json', '{ "type": "module" }');
fs.writeFileSync('./dist/cjs/package.json', '{ "type": "commonjs" }');

