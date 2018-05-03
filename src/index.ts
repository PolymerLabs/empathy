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

import {relative} from 'path';

import {getCommand, InstallOptions, PublishOptions} from './command.js';
import {applyEmpathy, reverseEmpathy} from './empathy.js';

const command = getCommand();

switch (command.name) {
  case 'install': {
    const {assetsDirectory, only, ignore, evenAsDependency} =
        command.options as InstallOptions;

    const initCwd = process.env['INIT_CWD'];
    const isDependency = initCwd != null && initCwd !== process.cwd();
    const shouldRunInstall = !isDependency || evenAsDependency;

    if (shouldRunInstall) {
      applyEmpathy(assetsDirectory, only, ignore)
          .then(() => {
            const prettyOutPath = relative(process.cwd(), assetsDirectory);
            console.log(`Assets installed to "${prettyOutPath}" 🖖`);
          })
          .catch(error => {
            console.error(error);
          });
    } else {
      process.exit(0);
    }

    break;
  }

  case 'publish': {
    const {sources, assetsDirectory, distDirectory} =
        command.options as PublishOptions;

    reverseEmpathy(sources, assetsDirectory, distDirectory)
        .then(() => {
          const prettyOutPath = relative(process.cwd(), distDirectory);
          console.log(`Artifacts with name specifiers placed in "${
              prettyOutPath}" 🖖`);
        })
        .catch(error => {
          console.error(error);
        });

    break;
  }
}
