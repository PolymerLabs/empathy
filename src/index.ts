import { resolve, relative } from 'path';
import { applyEmpathy, reverseEmpathy } from './empathy.js';
import * as commandLineArgs from 'command-line-args';

const cwd = process.cwd();
const optionDefinitions = [{
  name: 'assets-directory',
  alias: 'a',
  type: String,
  multiple: false,
  defaultValue: 'assets'
}, {
  name: 'dist-directory',
  alias: 'd',
  type: String,
  mulitple: false,
  defaultValue: 'dist'
}, {
  name: 'reverse',
  alias: 'r',
  type: String,
  multiple: true
}];

const options = commandLineArgs(optionDefinitions);
const { reverse } = options;
const assetsDirectory = resolve(cwd, options['assets-directory']);
const distDirectory = resolve(cwd, options['dist-directory']);

if (reverse == null) {
  const outputDirectory = assetsDirectory;
  const prettyOutPath = relative(cwd, outputDirectory);

  applyEmpathy(outputDirectory).then(() => {
    console.log(`Assets installed to "${prettyOutPath}" 🖖`);
  }).catch(error => {
    console.error(error);
  });
} else {
  const outputDirectory = distDirectory;
  const prettyOutPath = relative(cwd, outputDirectory);

  reverseEmpathy(reverse, assetsDirectory, outputDirectory).then(() => {
    console.log(
        `Artifacts with name specifiers placed in "${prettyOutPath}" 🖖`);
  }).catch(error => {
    console.error(error);
  });
}

