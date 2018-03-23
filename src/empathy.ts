import { sep, resolve } from 'path';
import { promisify } from 'util';
import * as vfs from 'vinyl-fs';
import * as fsExtra from 'fs-extra';
import { bareSpecifiersTransform } from './transform-bare-specifiers.js';
import { assetStage, AssetStageConfig } from './asset-stage.js';

const copy = promisify(fsExtra.copy);

export const applyEmpathy =
    async (config: AssetStageConfig, outputFolder: string): Promise<void> => {
      const assetStagePath = await assetStage(config);

      try {
        await new Promise((resolve, reject) => {
          vfs.src([`${assetStagePath}${sep}**${sep}*.js`], {
            cwd: assetStagePath
          })
              .pipe(bareSpecifiersTransform())
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

