import { relative } from 'path';
import { applyEmpathy, reverseEmpathy } from './empathy.js';
import { getCommand, InstallOptions, PublishOptions } from './command.js';

const command = getCommand();

switch (command.name) {
  case 'install': {
    const {
      assetsDirectory,
      only,
      ignore
    } = command.options as InstallOptions;

    applyEmpathy(assetsDirectory, only, ignore).then(() => {
      const prettyOutPath = relative(process.cwd(), assetsDirectory);
      console.log(`Assets installed to "${prettyOutPath}" 🖖`);
    }).catch(error => {
      console.error(error);
    });

    break;
  }

  case 'publish': {
    const {
      sources,
      assetsDirectory,
      distDirectory
    } = command.options as PublishOptions;

    reverseEmpathy(sources, assetsDirectory, distDirectory).then(() => {
      const prettyOutPath = relative(process.cwd(), distDirectory);
      console.log(
          `Artifacts with name specifiers placed in "${prettyOutPath}" 🖖`);
    }).catch(error => {
      console.error(error);
    });

    break;
  }
}

