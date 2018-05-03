## Empathy

![image](https://user-images.githubusercontent.com/240083/37926477-4c464bde-30ec-11e8-8a0f-1d2b4b7521d0.png)
Empathy is a minimalist tool that generates a folder of "asset" dependencies for
an NPM package. It is designed in the spirit of the 
[`npm/npm#npm-asset`](https://github.com/npm/npm/tree/npm-asset) work being done
by NPM.

Asset dependencies are "Web Ready" NPM packages whose specifiers have been
adjusted to point to their dependencies at the appropriate paths in the local
file tree.

Empathy can also transform local source files to use the correct "name" 
specifiers when it comes time to publish those sources to NPM.

### Usage

Add `empathy` as a dev dependency of your package:

```
$ npm i --save-dev @0xcda7a/empathy
```

Then include your assets as dependencies in your `package.json`. For example, 
this partial manifest includes an asset dependency on Polymer v3.0.0-pre:

```js
{
  "name": "cool-dogs-package",
  "version": "1.0.0",
  // ...
  "dependencies": {
    "@polymer/polymer": "v3.0.0-pre.12",
    // and other dependencies...
  },
  // ...
}
```

#### Installing assets from NPM

The easiest way to install assets from NPM with `empathy` is to run the 
`install` command:

```
$ empathy install
```

You should see console output that shows progress generating your asset 
dependencies. When it is done, you will have an `assets` folder in your current
working directory. This folder contains all of your asset dependencies, which
should be importable by path specifiers.

You can also specify the output folder where assets should be generated to:

```
$ empathy install -a my/asset/dir
```

You can restrict which packages are installed as assets. To select specific
packages to convert, use `--only`:

```
$ empathy install --only \@polymer/polymer
```

You can also select specific packages to ignore using `--ignore`:

```
$ empathy install --ignore express
```

For extreme mindfulness, add empathy to your `postinstall` step:

```js
{
  "name": "cool-dogs-package",
  "version": "1.0.0",
  // ...
  "scripts": {
    "postinstall": "empathy install"
  },
  // ...
}
```

#### Publishing your path-based source to NPM

Time to publish your package source to NPM? You can use "reverse" `empathy` to
generate the necessary artifacts using the `publish` command:

```
# Use space-separated globs representing your local project's source (excluding assets):
$ empathy publish cool-dogs.js
```

By default, this will generate artifacts at a `dist` folder. This can be
customized:

```
$ empathy publish cool-dogs.js -d my/dist/dir
```

If you installed assets to a custom path, you need to specify that path when you
publish:

```
$ empathy publish cool-dogs.js -a my/asset/dir
```

In many cases, you can automate this transformation by configuring your
`package.json` like this:

```js
{
  "name": "cool-dogs-package",
  "version": "1.0.0",
  // ...
  "main": "dist/cool-dogs.js",
  "scripts": {
    "prepublish": "empathy publish cool-dogs.js"
  },
  // ...
}
```

### Implementation notes

#### Node.js globals

Empathy scans all input files for references to a global `process` identifier (a
la Node.js's global `process`). Such references are common in web-facing NPM 
packages (see Redux). If such a reference is found, Empathy generates a generic 
"process" module at `$ASSETS_DIRECTORY/process.js`, and adds an import for this 
module at the top of the file that contains the reference. The only key 
currently supported on this global `process` module is the `process.env` key.
