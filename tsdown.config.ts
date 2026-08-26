import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import type { UserConfig } from 'tsdown'

const PLUGIN_ID = 'dsh-model-palette'
const CLIENT_EXTERNALS = ['react', 'react/jsx-runtime']
const CSS_PREFIX = '\0dsh-model-palette-css:'
const CSS_SUFFIX = '.mjs'

export default [
  {
    entry: { index: 'src/index.js' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: true,
  },
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    external: CLIENT_EXTERNALS,
    noExternal: (id: string) => CLIENT_EXTERNALS.includes(id) ? undefined : true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    plugins: [{
      name: 'dsh-model-palette-css',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.css')) return null
        if (importer === undefined) throw new Error(`cannot resolve CSS ${source} without importer`)
        return CSS_PREFIX + resolvePath(dirname(importer), source) + CSS_SUFFIX
      },
      async load(id: string) {
        if (!id.startsWith(CSS_PREFIX)) return null
        const file = id.slice(CSS_PREFIX.length, -CSS_SUFFIX.length)
        this.addWatchFile(file)
        const css = await readFile(file, 'utf8')
        const tagId = `${PLUGIN_ID}/${basename(file)}`
        return [
          `const css = ${JSON.stringify(css)};`,
          `if (typeof document !== 'undefined' && document.querySelector(${JSON.stringify(`style[data-plugin-css="${tagId}"]`)}) === null) {`,
          `  const tag = document.createElement('style');`,
          `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
          `  tag.dataset.pluginCss = ${JSON.stringify(tagId)};`,
          `  tag.textContent = css;`,
          `  document.head.appendChild(tag);`,
          `}`,
          `export default css;`,
        ].join('\n')
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
] satisfies UserConfig[]
