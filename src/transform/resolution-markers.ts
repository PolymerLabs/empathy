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
