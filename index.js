const assert = require('nanoassert')
const memory = new WebAssembly.Memory({ initial: 2, maximum: 2 })
const wasm = require('./base64')({ imports: { env: { memory }}})

const WASM_NOT_LOADED_ERR = 'base64-wasm has not loaded yet.'

// pointer to containter memory (heap)
const heap = Buffer.from(memory.buffer)

const promise = new Promise((resolve, reject) => {
  wasm.onload((err) => {
    // istanbul ignore next
    if (err) { return reject(err) }
    resolve()
  })
})

function pointer() {
  // pointer to heap head
  return wasm.exports.__heap_base + 0
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
