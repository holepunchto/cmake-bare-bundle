# cmake-bare-bundle

```
npm i cmake-bare-bundle
```

```cmake
find_package(cmake-bare-bundle REQUIRED PATHS node_modules/cmake-bare-bundle)
```

## API

#### `add_bare_bundle(<target> ENTRY <path> OUT <path> [BUILTINS <path>] [LINKED] [COMPRESSED] [HOST <string>] [WORKING_DIRECTORY <path>] [DEPENDS <path...>])`

Pass `COMPRESSED` to minify the modules of the bundle with [`bare-bundle-compress`](https://github.com/holepunchto/bare-bundle-compress) before it is written.

## License

Apache-2.0
