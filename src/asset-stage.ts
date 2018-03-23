import * as fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as childProcess from 'child_process';
import { promisify } from 'util';

const mkdtemp = promisify(fs.mkdtemp);
const writeFile = promisify(fs.writeFile);
const exec = promisify(childProcess.exec);

export interface AssetStageConfig {
  [index: string]: string
};

export const assetStage = async (config: AssetStageConfig): Promise<string> => {
  const folder = await mkdtemp(join(tmpdir(), 'asset_stage'));

  console.log(`Staging asset dependencies at ${folder}`);

  const manifest = {
    name: 'asset-stage',
    dependencies: config
  };

  const manifestPath = join(folder, 'package.json');

  console.log('Writing temporary asset manifest...');
  await writeFile(manifestPath, JSON.stringify(manifest));

  console.log('Installing modules to asset stage...');
  await exec('npm i', {
    cwd: folder,
  });

  return join(folder, 'node_modules');
};
