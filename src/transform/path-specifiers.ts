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
import {NodePath} from 'babel-traverse';
import {ExportAllDeclaration, ExportNamedDeclaration, ImportDeclaration} from 'babel-types';
import {dirname, join, relative} from 'path';
import {Transform} from 'stream';
import * as File from 'vinyl';
import * as vfs from 'vinyl-fs';

import {babelSyntaxPlugins} from '../babel-syntax-plugins.js';
import {getFileContents} from '../file.js';
import {detectBareSpecifierForFile, ensureDirectoryWithinPath} from '../specifier.js';
import {transformStream} from '../stream.js';

const exportExtensions = require('babel-plugin-syntax-export-extensions');

export type HasSpecifier =
    ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration;

export const SpecifierVisitor =
    'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration';

export class SpecifierProxy {
  constructor(protected node: HasSpecifier) {
  }

  get value(): string {
    return this.node.source.value;
  }

  set value(value: string) {
    this.node.source.value = value;
  }
}

export type SpecifierCallback = (specifier: SpecifierProxy) => void;

export const collectSpecifiers = (specifierCallback: SpecifierCallback) => ({
  inherits: exportExtensions,
  visitor: {
    [SpecifierVisitor](path: NodePath<HasSpecifier>) {
      const {node} = path;

      if (node.source == null) {
        return;
      }

      specifierCallback(new SpecifierProxy(node));
    }
  }
});

export const pathToBareSpecifiersTransform = (assetsDirectory:
                                                  string): Transform =>
    transformStream<File, File>(async(file: File): Promise<File> => {
      const cwd = process.cwd();

      const scriptSource = await getFileContents(file);
      const relativePath = relative(cwd, file.path);
      const isWithinAssetsFolder = ensureDirectoryWithinPath(assetsDirectory);

      try {
        console.log(`Applying reverse empathy to ${relativePath}`);

        const specifiers: SpecifierProxy[] = [];
        const {ast} = babelCore.transform(scriptSource, {
          plugins: [
            ...babelSyntaxPlugins,
            collectSpecifiers(specifier => specifiers.push(specifier))
          ]
        });
        const fileDirectory = dirname(file.path);

        for (const specifier of specifiers) {
          const specifierFilePath = join(fileDirectory, specifier.value);

          if (!isWithinAssetsFolder(specifierFilePath)) {
            continue;
          }

          const originalSpecifier = specifier.value;

          try {
            specifier.value = await new Promise<string>((resolve, reject) => {
              vfs.src([specifierFilePath])
                  .on('error', reject)
                  .on('data', async (file: File) => {
                    try {
                      resolve(await detectBareSpecifierForFile(
                          file, assetsDirectory));
                    } catch (error) {
                      reject(error);
                    }
                  });
            });
            console.log(`Adjusting specifier '${originalSpecifier}'
  New value: ${specifier.value}`);
          } catch (error) {
            console.log(`Failed to adjust specifier '${originalSpecifier}'`);
            console.error(error);
          }
        }

        const transformedScriptSource =
            babelCore
                .transformFromAst(
                    ast, undefined, {plugins: [...babelSyntaxPlugins]})
                .code!;

        file.contents = Buffer.from(transformedScriptSource);
      } catch (error) {
        console.error(`Failed to transform specifiers in ${relativePath}`);
        console.error(error);
      }

      return file;
    });
