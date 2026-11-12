const process = require('process')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')
const { resolve } = require('bare-module-traverse')
const pack = require('bare-pack')
const { readModule, listPrefix } = require('bare-pack/fs')
const compile = require('bare-bundle-compile')

const [entry, out, builtins, linked, host] = process.argv.slice(2)

bundle(entry)

async function bundle(entry) {
  const format = defaultFormat(out)
  const encoding = 'utf8'

  let bundle = await pack(
    pathToFileURL(entry),
    {
      host,
      resolve: resolve.bare,
      builtins: builtins !== '0' ? require(builtins) : [],
      linked: linked !== '0'
    },
    readModule,
    listPrefix
  )

  bundle = bundle.unmount(pathToFileURL('.'))

  let data

  switch (format) {
    case 'bundle':
    case 'bundle.cjs':
    case 'bundle.mjs':
    case 'bundle.json':
    case 'bundle.h':
      data = bundle.toBuffer()
      break
    case 'js':
    case 'js.h':
      data = Buffer.from(compile(bundle))
      break
    default:
      throw new Error(`Unknown format '${format}'`)
  }

  switch (format) {
    case 'bundle.cjs':
      data = `module.exports = ${JSON.stringify(data.toString(encoding))}\n`
      break
    case 'bundle.mjs':
      data = `export default ${JSON.stringify(data.toString(encoding))}\n`
      break
    case 'bundle.json':
      data = JSON.stringify(data.toString(encoding)) + '\n'
      break
    case 'bundle.h':
    case 'js.h':
      data = toHeader(defaultName(out), data)
      break
  }

  fs.writeFileSync(out, data)
}

// The data is declared `const` so that it stays in read-only memory, such as the
// flash of a microcontroller, rather than being copied into RAM.
function toHeader(name, data) {
  const rows = []

  for (let i = 0; i < data.byteLength; i += 16) {
    const row = Array.from(
      data.subarray(i, i + 16),
      (byte) => '0x' + byte.toString(16).padStart(2, '0')
    )

    rows.push('  ' + row.join(', '))
  }

  return (
    '#include <stddef.h>\n\n' +
    `const unsigned char ${name}[] = {\n${rows.join(',\n')}\n};\n\n` +
    `const size_t ${name}_len = ${data.byteLength};\n`
  )
}

function defaultFormat(out) {
  if (typeof out !== 'string') return 'bundle'
  if (out.endsWith('.bundle.js') || out.endsWith('.bundle.cjs')) return 'bundle.cjs'
  if (out.endsWith('.bundle.mjs')) return 'bundle.mjs'
  if (out.endsWith('.bundle.json')) return 'bundle.json'
  if (out.endsWith('.bundle.h')) return 'bundle.h'
  if (out.endsWith('.js')) return 'js'
  if (out.endsWith('.js.h')) return 'js.h'
  return 'bundle'
}

function defaultName(out) {
  if (out === null) return 'bundle'
  return path.basename(out).replace(/\.h$/, '').replace(/[-.]+/g, '_').toLowerCase()
}
