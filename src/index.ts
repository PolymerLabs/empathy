import { relative, join } from 'path';
import { applyEmpathy } from './empathy.js';
import * as commandLineArgs from 'command-line-args';

const cwd = process.cwd();
const optionDefinitions = [{
  name: 'out',
  alias: 'o',
  type: String,
  multiple: false,
  defaultOption: true,
  defaultValue: join(cwd, 'assets')
}];

const options = commandLineArgs(optionDefinitions);
const { out } = options;

const manifestPath = join(cwd, 'package.json');
const manifest = require(manifestPath);
const { assetDependencies } = manifest;

if (assetDependencies == null) {
  console.log('No asset dependencies listed in package.json.');
  process.exit(0);
} else {
  applyEmpathy(assetDependencies, out).then(() => {
    console.log(`Assets installed to "${relative(cwd, out)}" 🖖`);
  }).catch(error => {
    console.error(error);
  });
}

