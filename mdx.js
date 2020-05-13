import * as babel from '@babel/core';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import mdx from '@mdx-js/mdx';
import { MDXProvider } from '@mdx-js/react';
import { createRequire } from 'module';
import * as fs from 'fs';
import { relative } from 'path';
import { mapContentsAsync } from './utils';

const defaultBabelOptions = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'cjs'
      }
    ],
    '@babel/preset-react'
  ]
};

export default (options = {}) => mapContentsAsync(async (mdxCode, file) => {
  file.extname = '.html';
  return await mdxToHtml(mdxCode, file.path, options);
});

async function mdxToHtml(mdxCode, path, { mdxOptions = {}, babelOptions = defaultBabelOptions, components = {} }) {
  const require = createTranspilingRequire(path, mdxOptions, babelOptions);

  const jsxCode = await mdx(mdxCode, mdxOptions);
  const { code } = await babel.transformAsync("import { mdx } from '@mdx-js/react';\n" + jsxCode, babelOptions);

  const layoutComponent = getDefaultExportFromModule(code, require);

  const elementWithProvider = React.createElement(
    MDXProvider,
    { components },
    React.createElement(layoutComponent));

  return renderToStaticMarkup(elementWithProvider);
}

function getDefaultExportFromModule(code, require) {
  const exports = {};
  new Function('require', 'exports', code)(require, exports);
  return exports['default'];
}

function createTranspilingRequire(path, mdxOptions, babelOptions) {
  const require = createRequire(path);

  for (const key of Object.keys(require.cache).filter(isWithin(path))) {
    delete require.cache[key];
  }

  require.extensions['.mdx'] = (module, filename) => {
    const mdxCode = fs.readFileSync(filename, 'utf8');
    const jsxCode = mdx.sync(mdxCode, { mdxOptions });
    const { code } = babel.transformSync("import { mdx } from '@mdx-js/react';\n" + jsxCode, babelOptions);
    module._compile(code, filename);
  };

  require.extensions['.jsx'] = (module, filename) => {
    const jsxCode = fs.readFileSync(filename, 'utf8');
    const { code } = babel.transformSync(jsxCode, babelOptions);
    module._compile(code, filename);
  };

  return require;
}

const isWithin = path => file => !relative(path, file).includes('..');
