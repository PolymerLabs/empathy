import { transformStream } from '../stream.js';
import { getFileContents } from '../file.js';
import { Transform } from 'stream';
import { detectBareSpecifierForPath } from '../specifier.js';
import * as File from 'vinyl';

export const resolutionMarkerTransform =
    (searchWithinPath?: string): Transform =>
        transformStream<File, File>(async (file: File): Promise<File> => {
          try {
            const bareSpecifier =
                await detectBareSpecifierForPath(file.path, searchWithinPath);
            const scriptSource = await getFileContents(file);

            file.contents = Buffer.from(`/// BareSpecifier=${bareSpecifier}
${scriptSource}`);
          } catch (error) {
            const relativePath = file.path.split('node_modules').pop().slice(1);
            console.error(`Failed to mark bare specifier for ${relativePath}`);
            console.error(error);
          }

          return file;
        });
