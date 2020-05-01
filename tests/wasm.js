const crypto = require('crypto')
const path = require('path')
const test = require('tape')
const fs = require('fs')

function zzwasm(name, opts, callback) {
  const filename = path.resolve(__dirname, `../${name}.wasm`)
  const memory = new WebAssembly.Memory({ initial: 256, maximum: 256 })

  if ('string' === typeof process.env.NODE_OPTIONS) {
    if (process.env.NODE_OPTIONS.includes('--experimental-wasi-unstable-preview1')) {
      opts.wasi = true
    }
  }

  let wasi = null

  if (opts.wasi) {
    const { WASI } = require('wasi')
    wasi = new WASI()
  }

  fs.readFile(filename, onread)

  function onread(err, buffer) {
    if (err) { return callback(err) }

    const imports = { env: { memory } }

    if (opts.wasi) {
      imports.wasi_snapshot_preview1 = wasi.wasiImport
    }

    WebAssembly.instantiate(buffer, imports).then(onwasm, onerror)
  }

  function onwasm(wasm) {
    const { instance } = wasm

    if (opts.wasi) {
      wasi.start(instance)
    }

    callback(null, instance, wasm.instance.exports.memory || memory)
  }

  function onerror(err) {
    callback(err)
  }
}

test('loads WASM module', (t) => {
  zzwasm('base64', { wasi: false }, (err, mod, heap) => {
    t.error(err)
    t.end()
  })
})

test('encode()', (t) => {
  zzwasm('base64', { wasi: false }, (err, mod, memory) => {
    t.error(err)

    const { base64_encode } = mod.exports
    const heap = Buffer.from(memory.buffer) // pointer to containter memory (heap)

    const pointer = mod.exports.__heap_base // pointer to head
    const output = pointer
    //const input = Buffer.from("hello")
    const input = crypto.randomBytes(32)

    const outputLength = mod.exports.base64_encoding_length(input.length)

    // put `input` on heap after space reserved for output
    input.copy(heap, pointer + outputLength)

    t.equal(
      outputLength,
      base64_encode(output, pointer + outputLength, input.length))

    const encoded = heap.slice(pointer + 0, pointer + outputLength)

    t.ok(0 === Buffer.compare(Buffer.from(input.toString('base64')), encoded))

    t.end()
  })
})

test('decode()', (t) => {
  zzwasm('base64', { wasi: false }, (err, mod, memory) => {
    t.error(err)

    const { base64_encode, base64_decode } = mod.exports
    const heap = Buffer.from(memory.buffer) // pointer to containter memory (heap)

    const pointer = mod.exports.__heap_base // pointer to head
    const output = pointer
    const input = crypto.randomBytes(32)

    const outputLength = mod.exports.base64_encoding_length(input.length)

    // put `input` on heap after space reserved for output
    input.copy(heap, pointer + outputLength)

    t.equal(
      outputLength,
      base64_encode(output, pointer + outputLength, input.length))

    const encoded = heap.slice(pointer + 0, pointer + outputLength)

    t.ok(0 === Buffer.compare(Buffer.from(input.toString('base64')), encoded))

    t.equal(
      input.length,
      base64_decode(pointer + encoded.length, output, encoded.length))

    const decoded = heap.slice(pointer + encoded.length, pointer+encoded.length + input.length)

    t.ok(0 === Buffer.compare(input, decoded))
    t.end()
  })
})
