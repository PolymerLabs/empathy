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
import {ClassDeclaration, FunctionDeclaration, VariableDeclarator} from 'babel-types';
import {dirname, relative} from 'path';
import {Transform} from 'stream';
import * as File from 'vinyl';

import {babelSyntaxPlugins} from '../babel-syntax-plugins.js';
import {getFileContents} from '../file.js';
import {destructureStream} from '../stream.js';

const processRe = /process\./;

export type DeclaresName =
    ClassDeclaration|FunctionDeclaration|VariableDeclarator;

export const DeclarationVisitor =
    'ClassDeclaration|FunctionDeclaration|VariableDeclarator';

export type NameCallback = (name: string) => void;

export const collectTopLevelNames = (nameCallback: NameCallback) => ({
  visitor: {
    [DeclarationVisitor](path: NodePath<DeclaresName>) {
      const {node, parent, parentPath} = path;
      if (parent.type === 'Program' ||
          (parentPath.parent.type === 'Program' &&
           parent.type === 'VariableDeclaration')) {
        nameCallback((<any>node).id.name);
      }
    }
  }
});

export const injectProcessModuleTransform = (): Transform => {
  let processModuleFile: File|null = null;

  return destructureStream<File>(async(file: File): Promise<File[]> => {
    const files: File[] = [file];
    const contents = await getFileContents(file);

    if (processRe.test(contents)) {
      const topLevelNames: string[] = [];

      babelCore.transform(contents, {
        plugins: [
          ...babelSyntaxPlugins,
          collectTopLevelNames(name => topLevelNames.push(name))
        ]
      });

      if (topLevelNames.indexOf('process') === -1) {
        if (processModuleFile == null) {
          processModuleFile = new File({
            cwd: file.cwd,
            base: file.base,
            path: `${file.base}/process.js`,
            contents: Buffer.from(
                `export const process = { env: { NODE_ENV: 'production' } };`)
          });
          files.push(processModuleFile);
        }

        const relativePath =
            relative(dirname(file.path), processModuleFile!.path);
        console.log(
            `Prepending "process" module to ${relative(file.cwd, file.path)}`);
        file.contents = Buffer.from(`import { process } from '${relativePath}';
${contents}`);
      }
    }

    return files;
  });
};
