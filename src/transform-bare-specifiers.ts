import * as babelCore from 'babel-core';
import * as File from 'vinyl';
import { Transform } from 'stream';
import { resolveBareSpecifiers } from './babel-plugin-bare-specifiers.js';
import { transformStream } from './stream.js';
import { getFileContents } from './file.js';

const babelSyntaxPlugins = [
  require('babel-plugin-syntax-exponentiation-operator'),
  require('babel-plugin-syntax-async-functions'),
  require('babel-plugin-syntax-async-generators'),
  require('babel-plugin-syntax-export-extensions'),
  require('babel-plugin-syntax-dynamic-import'),
];

export const bareSpecifiersTransform = (): Transform =>
    transformStream<File, File>(async (file: File): Promise<File> => {
      const plugins = [
        ...babelSyntaxPlugins,
        resolveBareSpecifiers(file.path, false)
      ];

      const scriptSource = await getFileContents(file);

      try {
        const pathParts = file.path.split('node_modules/');
        const relativePath = pathParts[1];

        console.log(`Applying empathy to ${relativePath}`);

        const transformedScriptSource =
            babelCore.transform(scriptSource, { plugins }).code!;

        file.contents = Buffer.from(transformedScriptSource);
      } catch (error) {
        console.error(`Failed to transform specifiers in ${file.path}`);
        console.error(error);
      }

      return file;
    });

