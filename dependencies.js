const process = require('process')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')
const { resolve } = require('bare-module-traverse')
const pack = require('bare-pack')
const { readModule, listPrefix } = require('bare-pack/fs')

const [entry, out, builtins, linked, host] = process.argv.slice(2)

dependencies(entry)

async function dependencies(entry) {
  let bundle = await pack(
    pathToFileURL(entry),
    {
      host,
      resolve: resolve.bare,
      builtins: builtins === '0' ? [] : require(builtins),
      linked: linked !== '0'
    },
    readModule,
    listPrefix
  )

  bundle = bundle.unmount(pathToFileURL('.'))

  const result = Object.keys(bundle.files)
    .map((file) => path.resolve('.' + file))
    .sort()

  fs.writeFileSync(`${out}.d`, `${path.resolve(out)}: ${result.join(' ')}\n`)
}
