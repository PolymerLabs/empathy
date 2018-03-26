import { sep, resolve } from 'path';
import { promisify } from 'util';
import * as vfs from 'vinyl-fs';
import * as fsExtra from 'fs-extra';
import { bareToPathSpecifiersTransform } from './transform/bare-specifiers.js';
import { resolutionMarkerTransform } from './transform/resolution-markers.js';
import { pathToBareSpecifiersTransform } from './transform/path-specifiers.js';
import { assetStage } from './asset-stage.js';
import { join } from 'path';

const cwd = process.cwd();
const copy = promisify(fsExtra.copy);

export const applyEmpathy =
    async (outputFolder: string): Promise<void> => {

      const manifestPath = join(cwd, 'package.json');
      const manifest = require(manifestPath);
      const { assetDependencies } = manifest;
      let assetStagePath: string;

      try {
        assetStagePath = await assetStage(assetDependencies);
      } catch (error) {
        console.error('Unable to stage assets for specifier conversion');
        console.error(error);
        return;
      }

      try {
        await new Promise((resolve, reject) => {
          vfs.src([`${assetStagePath}${sep}**${sep}*.js`], {
            cwd: assetStagePath
          })
              .pipe(bareToPathSpecifiersTransform())
              .on('error', reject)
              .pipe(resolutionMarkerTransform(assetStagePath))
              .on('error', reject)
              .pipe(vfs.dest(assetStagePath))
              .on('error', reject)
              .on('end', () => resolve())
        });

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
    async (globs: string[], assetsFolder: string, outputFolder: string)
        : Promise<void> => {
      try {
        await new Promise((resolve, reject) => {
          vfs.src(globs, { cwd })
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

