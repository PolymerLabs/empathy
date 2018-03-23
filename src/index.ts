import * as nodePath from 'path';
import { applyEmpathy } from './empathy.js';

const manifestPath = nodePath.join(process.cwd(), 'package.json');
const manifest = require(manifestPath);
const { assetDependencies } = manifest;

if (assetDependencies == null) {
  console.log('No asset dependencies listed in package.json.');
  process.exit(0);
} else {
  applyEmpathy(assetDependencies).then(() => {
    console.log('Assets installed!');
  }).catch(error => {
    console.error(error);
  });
}

