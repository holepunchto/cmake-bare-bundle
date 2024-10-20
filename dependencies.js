const fs = require('fs/promises')
const process = require('process')
const path = require('path')
const pathResolve = require('unix-path-resolve')
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

dependencies(entry)

async function dependencies (entry) {
  const host = `${platform}-${arch}${simulator ? '-simulator' : ''}`

  const drive = new Localdrive(cwd, { followLinks: true })

  const bundler = new DriveBundler(drive, { cwd, host, packages: true, prebuilds: false })

  entry = pathResolve('/', path.relative(cwd, entry))

  const { sources } = await bundler.bundle(entry)

  const result = Object
    .keys(sources)
    .map((file) => path.join(cwd, path.normalize(file)))
    .sort()

  await fs.writeFile(path.resolve(cwd, `${out}.d`), `${path.resolve(cwd, out)}: ${result.join(' ')}\n`)
}
