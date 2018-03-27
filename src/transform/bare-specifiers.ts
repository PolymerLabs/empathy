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

import * as babelCore from 'babel-core';
import {Transform} from 'stream';
import * as File from 'vinyl';

import {resolveBareSpecifiers} from '../babel-plugin-bare-specifiers.js';
import {babelSyntaxPlugins} from '../babel-syntax-plugins.js';
import {getFileContents} from '../file.js';
import {transformStream} from '../stream.js';

export const bareToPathSpecifiersTransform = (): Transform =>
    transformStream<File, File>(async(file: File): Promise<File> => {
      const plugins =
          [...babelSyntaxPlugins, resolveBareSpecifiers(file.path, false)];

      const scriptSource = await getFileContents(file);

      try {
        const pathParts = file.path.split('node_modules/');
        const relativePath = pathParts[1];

        console.log(`Applying empathy to ${relativePath}`);

        const transformedScriptSource =
            babelCore.transform(scriptSource, {plugins}).code!;

        file.contents = Buffer.from(transformedScriptSource);
      } catch (error) {
        console.error(`Failed to transform specifiers in ${file.path}`);
        console.error(error);
      }

      return file;
    });
