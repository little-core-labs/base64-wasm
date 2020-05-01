const createBase64 = require('./base64')
const assert = require('nanoassert')

const WASM_NOT_LOADED_ERR = 'base64-wasm has not loaded yet.'
const BYTES_PER_PAGE = 64 * 1024
const MAX_PAGES = 256

const memory = new WebAssembly.Memory({ initial: 2, maximum: MAX_PAGES })
const wasm = createBase64({ imports: { env: { memory }}})

const promise = new Promise((resolve, reject) => {
  wasm.onload((err) => {
    // istanbul ignore next
    if (err) { return reject(err) }
    resolve()
  })
})

function pointer(offset) {
  // pointer to heap head
  return wasm.exports.__heap_base + (offset || 0)
}

function grow(size) {
  const needed = Math.ceil(.Math.abs(size - memory.buffer.byteLength) / BYTES_PER_PAGE)
  memory.grow(Math.max(0, needed))
}

function sync(size) {
  const pages = memory.buffer.byteLength / BYTES_PER_PAGE
  const needed = Math.floor((memory.buffer.byteLength + size) / BYTES_PER_PAGE)

  if (size && needed > pages) {
    grow(size)
  }

  // pointer to containter memory (heap)
  return Buffer.from(memory.buffer)
}

function toBuffer(buffer, size, offset) {
  // istanbul ignore next
  if (!Buffer.isBuffer(buffer)) {
    return Buffer.alloc(size)
  } else {
    // istanbul ignore next
    return buffer.slice(offset || 0)
  }
}

async function ready(callback) {
  if ('function' === typeof callback) {
    try {
      await promise
    } catch (err) {
      // istanbul ignore next
      return void callback(err)
    }

    callback(null)
  }
  return promise
}

function encode(input, output, offset) {
  assert(wasm.exports, WASM_NOT_LOADED_ERR)

  // coerece to buffer
  input = Buffer.from(input)

  // output size
  const size = encodingLength(input)

  // sync and grow memory if needed and get a pointer to heap
  const heap = sync(input.length + size)

  // heap pointer
  const ptr = pointer()

  // get buffer at offset or a new one
  output = toBuffer(output, size, offset)

  // put `input` on heap after space reserved for output
  input.copy(heap, ptr + size)

  // encode input at `pointer + size` into `pointer`
  wasm.exports.base64_encode(ptr, ptr + size, input.length)

  // copy `pointer` heap value into output buffer
  heap.slice(ptr, ptr + size).copy(output)
  return output
}

function decode(input, output, offset) {
  assert(wasm.exports, WASM_NOT_LOADED_ERR)

  // coerece to buffer
  input = Buffer.from(input)

  // output size
  const size = decodingLength(input)

  // sync and grow memory if needed and get a pointer to heap
  const heap = sync(input.length + size)

  // heap pointer
  const ptr = pointer()

  // get buffer at offset or a new one
  output = toBuffer(output, size, offset)

  // put `input` on heap after space reserved for output
  input.copy(heap, ptr + size)

  // encode input at `ptr + size` into `ptr`
  wasm.exports.base64_decode(ptr, ptr + size, input.length)

  // copy `ptr` heap value into output buffer
  heap.slice(ptr + 0, ptr + size).copy(output)
  return output
}

function encodingLength(input) {
  assert(wasm.exports, WASM_NOT_LOADED_ERR)
  return wasm.exports.base64_encoding_length(input.length)
}

function decodingLength(input) {
  assert(wasm.exports, WASM_NOT_LOADED_ERR)

  // heap pointer
  const heap = sync(0)
  const ptr = pointer()

  input = Buffer.from(input)
  input.copy(heap, ptr)
  return wasm.exports.base64_decoding_length(input.length, ptr)
}

module.exports = {
  encodingLength,
  decodingLength,
  encode,
  decode,
  ready,
}
