base64-wasm
===========

> A Base64 implementation for WebAssembly (WASM) written in [ZZ][zz] that
> implements an [_Abstract Encoding_][abstract-encoding] interface.

## Installation

```sh
$ npm install base64-wasm
```

## Usage

```js
const b64 = require('base64-wasm')

// wait for module to be ready if loading in a browser environment
b64.ready((err) => {
  const message = Buffer.from('hello world')
  const encoded = b64.encode(message)

  console.log(encoded.toString()) // aGVsbG8gd29ybGQ=

  const decoded = b64.decode(encoded)

  console.log(decoded.toString()) // hello world
})
```

## API

### `buffer = encode(input[, buffer[, offset]])`

Base64 encode an `input` optionally into `buffer` at an optionally
specified `offset`.


### `buffer = decode(input[, buffer[, offset]])`

Base64 decode an `input` optionally into `buffer` at an optionally
specified `offset`.

### `promise = ready(callback)`

Returns a promise that resolves or rejects when the WebAssembly exports
are loading. In some cases, this may happen synchronously when this
module is loaded.

```js
await b64.ready()
```

## License

MIT

[zz]: https://github.com/zetzit/zz
[abstract-encoding]: https://github.com/mafintosh/abstract-encoding
