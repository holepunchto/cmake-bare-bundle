const process = require('process')
const path = require('path')
const { pathToFileURL } = require('url')
const { resolve } = require('bare-module-traverse')
const pack = require('bare-pack')
const fs = require('bare-pack/fs')

const [
  entry,
  out,
  builtins,
  linked,
  platform,
  arch,
  simulator
] = process.argv.slice(2)

dependencies(entry)

async function dependencies (entry) {
  let bundle = await pack(pathToFileURL(entry), {
    platform,
    arch,
    simulator,
    resolve: resolve.bare,
    builtins: builtins === '0' ? [] : require(builtins),
    linked: linked !== '0'
  }, fs.readModule, fs.listPrefix)

  bundle = bundle.unmount(pathToFileURL('.'))

  const result = Object
    .keys(bundle.files)
    .map((file) => path.resolve('.' + file))
    .sort()

  await fs.writeFile(pathToFileURL(`${out}.d`), `${path.resolve(out)}: ${result.join(' ')}\n`)
}
