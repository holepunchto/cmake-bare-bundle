const fs = require('fs/promises')
const process = require('process')
const path = require('path')
const pathResolve = require('unix-path-resolve')
const includeStatic = require('include-static')
const Bundle = require('bare-bundle')
const Localdrive = require('localdrive')
const DriveBundler = require('drive-bundler')

const [
  cwd,
  entry,
  out,
  platform,
  arch,
  simulator
] = process.argv.slice(2)

bundle(entry)

async function bundle (entry) {
  const encoding = 'utf8'

  const format = defaultFormat(out)

  const host = `${platform}-${arch}${simulator ? '-simulator' : ''}`

  const drive = new Localdrive(cwd, { followLinks: true })

  const bundler = new DriveBundler(drive, {
    cwd,
    host,
    packages: true,
    inlineAssets: true
  })

  if (bundler.prebuilds) {
    await fs.mkdir(bundler.prebuilds, { recursive: true })
  }

  entry = pathResolve('/', path.relative(cwd, entry))

  let data

  switch (format) {
    case 'bundle':
    case 'bundle.js':
    case 'bundle.cjs':
    case 'bundle.mjs':
    case 'bundle.json':
    case 'bundle.h': {
      const result = await bundler.bundle(entry)

      const { entrypoint, resolutions, sources, assets } = result

      const bundle = new Bundle()

      bundle.id = DriveBundler.id(result).toString('hex')
      bundle.main = entrypoint
      bundle.resolutions = resolutions

      for (const key in sources) {
        bundle.write(key, sources[key])
      }

      for (const key in assets) {
        const asset = assets[key]

        bundle.write(key, asset.value, { executable: asset.executable, asset: true })
      }

      data = bundle.toBuffer()
      break
    }

    case 'js':
    case 'js.h':{
      const code = await bundler.stringify(entry)

      data = Buffer.from(code)
      break
    }

    default:
      throw new Error(`unknown format "${format}"`)
  }

  switch (format) {
    case 'bundle.js':
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
      data = includeStatic(defaultName(out), data)
      break
  }

  await fs.writeFile(path.resolve(cwd, out), data)
}

function defaultFormat (out) {
  if (out === null) return 'bundle'
  if (out.endsWith('.bundle.js')) return 'bundle.js'
  if (out.endsWith('.bundle.cjs')) return 'bundle.cjs'
  if (out.endsWith('.bundle.mjs')) return 'bundle.mjs'
  if (out.endsWith('.bundle.json')) return 'bundle.json'
  if (out.endsWith('.bundle.h')) return 'bundle.h'
  if (out.endsWith('.js')) return 'js'
  if (out.endsWith('.js.h')) return 'js.h'
  return 'bundle'
}

function defaultName (out) {
  if (out === null) return 'bundle'
  return path.basename(out)
    .replace(/\.h$/, '')
    .replace(/[-.]+/g, '_')
    .toLowerCase()
}
