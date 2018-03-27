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

import * as commandLineArgs from 'command-line-args';
import {resolve} from 'path';

const commandLineUsage: (...args: any[]) => string =
    require('command-line-usage');

export interface InstallOptions {
  assetsDirectory: string;
  only: string[];
  ignore: string[];
  evenAsDependency: boolean;
}

export interface PublishOptions {
  distDirectory: string;
  assetsDirectory: string;
  sources: string[];
}

export interface Command {
  name: string, options: InstallOptions|PublishOptions
}

const installDefinitions = [
  {
    name: 'assets-directory',
    description: 'Path where assets should be installed. Defaults to "assets".',
    alias: 'a',
    type: String,
    multiple: false,
    defaultValue: 'assets'
  },
  {
    name: 'only',
    description:
        'List of dependency package names to convert to assets (excludes others)',
    alias: 'o',
    type: String,
    multiple: true
  },
  {
    name: 'ignore',
    description: 'List of dependency package names to ignore (includes others)',
    alias: 'i',
    type: String,
    multiple: true
  },
  {
    name: 'even-as-dependency',
    description:
        'Run even if package is installed as an NPM dependency. Defaults to false.',
    alias: 'e',
    type: Boolean,
    defaultValue: false
  }
];

const publishDefinitions = [
  {
    name: 'sources',
    description: 'Space-separated list of globs to convert',
    alias: 's',
    type: String,
    multiple: true,
    defaultOption: true
  },
  {
    name: 'dist-directory',
    description:
        'Path where generated artifacts should be placed. Defaults to "dist".',
    alias: 'd',
    type: String,
    multiple: false,
    defaultValue: 'dist'
  },
  {
    name: 'assets-directory',
    description: 'Path where assets are installed. Defaults to "assets".',
    alias: 'a',
    type: String,
    multiple: false,
    defaultValue: 'assets'
  }
];

const logo = `
                          .  .
                         _|_ |        💞
   .-. .--.--. .,-.  .-.  |  |--. .  .
  (.-' |  |  | |   )(   ) |  |  | |  |
   \`--''  '  \`-|\`-'  \`-'\`-\`-''  \`-\`--|
               |                     ;
               '                  \`-'
`;

const mainUsage = commandLineUsage([
  {content: logo, raw: true},
  {
    content: `Empathy manipulates JavaScript module specifiers in NPM packages.`
  },
  {
    header: 'Commands',
    content: [
      {
        name: 'install',
        summary: 'Install NPM dependencies as assets with path specifiers'
      },
      {
        name: 'publish',
        summary:
            'Convert local sources from path specifiers to names where appropriate'
      },
      {
        name: 'help',
        summary: 'Display help information about empathy or its subcommands'
      }
    ]
  }
]);

const installUsage = commandLineUsage([
  {
    header: 'Description',
    content:
        'Installs NPM packages as assets to a local directory. Assets have their module specifiers "fixed" as browser-compatible path specifiers.'
  },
  {
    header: 'Usage',
    content:
        '$ empathy install [-a <directory>] [-o <packages>] [-i <packages>] [-e]'
  },
  {header: 'Options', optionList: installDefinitions}
]);

const publishUsage = commandLineUsage([
  {
    header: 'Description',
    content:
        'Converts local sources to use NPM package name specifiers where appropriate. Only specifiers that refer to NPM package dependencies will be converted. Generated sources are placed in an output directory by default.'
  },
  {
    header: 'Usage',
    content:
        '$ empathy publish -s <source globs> [-a <directory>] [-d <directory>]'
  },
  {header: 'Options', optionList: publishDefinitions}
]);

export const getCommand = (): Command => {
  const cwd = process.cwd();
  const commandDefinition = [{name: 'command', defaultOption: true}];

  const {command, _unknown: argv} =
      commandLineArgs(commandDefinition, <any>{stopAtFirstUnknown: true});

  let options: InstallOptions|PublishOptions;

  switch (command) {
    case 'install': {
      const parsed = commandLineArgs(
          installDefinitions, {argv: argv || [], partial: true});

      options = {
        assetsDirectory: resolve(cwd, parsed['assets-directory']),
        only: parsed.only || [],
        ignore: parsed.ignore || [],
        evenAsDependency: !!parsed['even-as-dependency']
      };

      break;
    }

    case 'publish': {
      const parsed = commandLineArgs(
          publishDefinitions, {argv: argv || [], partial: true});

      options = {
        assetsDirectory: resolve(cwd, parsed['assets-directory']),
        distDirectory: resolve(cwd, parsed['dist-directory']),
        sources: parsed['sources'] || []
      };

      if (options.sources.length === 0) {
        console.error(
            'You must specify at least one input source glob to be published');
        console.log(publishUsage);
        process.exit(1);
        return;
      }

      break;
    }

    default:
    case 'help': {
      const {subcommand} = commandLineArgs(
          [{name: 'subcommand', defaultOption: true}],
          <any>{argv, stopAtFirstUnknown: true});

      switch (subcommand) {
        case 'install':
          console.log(installUsage);
          break;
        case 'publish':
          console.log(publishUsage);
          break;
        default:
          console.log(mainUsage);
          break;
      }

      process.exit(0);
      break;
    }
  }

  return {name: command, options};
};
