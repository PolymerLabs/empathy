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

import * as fsExtra from 'fs-extra';
import {resolve, sep} from 'path';
import {join} from 'path';
import {promisify} from 'util';
import * as vfs from 'vinyl-fs';

import {assetStage} from './asset-stage.js';
import {bareToPathSpecifiersTransform} from './transform/bare-specifiers.js';
import {injectProcessModuleTransform} from './transform/inject-process-module.js';
import {pathToBareSpecifiersTransform} from './transform/path-specifiers.js';
import {resolutionMarkerTransform} from './transform/resolution-markers.js';

const cwd = process.cwd();
const copy = promisify(fsExtra.copy);

export const applyEmpathy = async(
    outputFolder: string, includes: string[], excludes: string[]):
    Promise<void> => {
      const manifestPath = join(cwd, 'package.json');
      const manifest = require(manifestPath);
      const {dependencies} = manifest;

      // Compute asset dependencies from package manifest dependencies.
      // If includes are specified, only those packages will be considered.
      // Packages explicitly listed in excludes will not be considered.
      const assetDependencies =
          Object.keys(dependencies || {}).reduce((assetDependencies, key) => {
            let allowed = true;

            if (includes.length) {
              allowed = includes.indexOf(key) > -1;
            }

            allowed = allowed && excludes.indexOf(key) === -1;

            if (allowed) {
              assetDependencies[key] = dependencies[key];
            }

            return assetDependencies;
          }, {} as {[index: string]: string});

      let assetStagePath: string;

      try {
        assetStagePath = await assetStage(assetDependencies);
      } catch (error) {
        console.error('Unable to stage assets for specifier conversion');
        console.error(error);
        return;
      }

      try {
        await new Promise(
            (resolve, reject) => {
                vfs.src(
                       [`${assetStagePath}${sep}**${sep}*.js`],
                       {cwd: assetStagePath})
                    .pipe(injectProcessModuleTransform())
                    .on('error', reject)
                    .pipe(resolutionMarkerTransform(assetStagePath))
                    .on('error', reject)
                    .pipe(bareToPathSpecifiersTransform())
                    .on('error', reject)
                    .pipe(vfs.dest(assetStagePath))
                    .on('error', reject)
                    .on('end', () => resolve())});

        console.log('Empathy applied!');
      } catch (error) {
        console.error('Failed to transform asset specifiers');
        console.error(error);
      }

      try {
        await copy(assetStagePath, resolve(outputFolder));
      } catch (error) {
        console.error('Failed to create assets directory');
        console.error(error);
      }
    };

export const reverseEmpathy =
    async(globs: string[], assetsFolder: string, outputFolder: string):
        Promise<void> => {
          try {
            await new Promise((resolve, reject) => {
              vfs.src(globs, {cwd})
                  .pipe(pathToBareSpecifiersTransform(assetsFolder))
                  .on('error', reject)
                  .pipe(vfs.dest(outputFolder))
                  .on('error', reject)
                  .on('end', () => resolve());
            });
          } catch (error) {
            console.error('Failed to transform source specifiers');
            console.error(error);
          }
        };
