/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as fs from 'fs';
import {extname, join, relative} from 'path';
import {promisify} from 'util';
import * as File from 'vinyl';

import {getFileContents} from './file.js';

const findRoot = require('find-root');
const readFile = promisify(fs.readFile);

export const ensureDirectoryWithinPath = (path: string) =>
    (directory: string): boolean => {
      const relativePath = relative(path, directory);
      return !!(relativePath && !relativePath.startsWith('.'));
    };

export const ensureManifestWithinPath = (path: string) => {
  const testDirectory = ensureDirectoryWithinPath(path);
  return (directory: string): boolean => {
    return testDirectory && fs.existsSync(join(directory, 'package.json'));
  }
};

export const detectBareSpecifierForPath = async(
    filePath: string,
    searchWithinPath: string = process.cwd()): Promise<string> => {
  const rootPath =
      findRoot(filePath, ensureManifestWithinPath(searchWithinPath));

  const manifestPath = join(rootPath, 'package.json');
  const manifest = JSON.parse((await readFile(manifestPath)).toString());

  const {name: packageName} = manifest;
  const packageRelativeFilePath = relative(rootPath, filePath);
  const fileExtensionRe = new RegExp(`${extname(filePath)}$`);
  const modulePath = packageRelativeFilePath.replace(fileExtensionRe, '');

  return join(packageName, modulePath);
};

const bareSpecifierMarkerRe = /\/\/\/[ ]*BareSpecifier=(.*)/;

export const detectBareSpecifierForFile =
    async(file: File, searchWithinPath: string): Promise<string> => {
  try {
    return detectBareSpecifierForPath(file.path, searchWithinPath);
  } catch (error) {
    console.warn(error);
  }

  try {
    const scriptSource = await getFileContents(file);
    // TODO(cdata): This should be a more sophisticated search, but cheap
    // tricks will work for now:
    const markerMatch = scriptSource.match(bareSpecifierMarkerRe);
    if (markerMatch != null) {
      return markerMatch[1];
    }
  } catch (error) {
    console.warn(error);
  }

  throw new Error(`Unable to detect specifier for ${file.path}`);
};
