const wasm = require('./base64')()

// pointer to containter memory (heap)
const heap = Buffer.from(wasm.memory.buffer)

// pointer to heap head
const pointer = wasm.exports.__heap_base

function encode(input, output, offset) {
  // coerece to buffer
  input = Buffer.from(input)

  // output size
  const size = encodingLength(input)

  // get buffer at offset or a new one
  output = toBuffer(output, size, offset)

  // put `input` on heap after space reserved for output
  input.copy(heap, pointer + size)

  // encode input at `pointer + size` into `pointer`
  wasm.exports.base64_encode(pointer, pointer + size, input.length)

  // copy `pointer` heap value into output buffer
  heap.slice(pointer + 0, pointer + size).copy(output)
  return output
}

function decode(input, output, offset) {
  // coerece to buffer
  input = Buffer.from(input)

  // output size
  const size = decodingLength(input)

  // get buffer at offset or a new one
  output = toBuffer(output, size, offset)

  // put `input` on heap after space reserved for output
  input.copy(heap, pointer + size)

  // encode input at `pointer + size` into `pointer`
  wasm.exports.base64_decode(pointer, pointer + size, input.length)

  // copy `pointer` heap value into output buffer
  heap.slice(pointer + 0, pointer + size).copy(output)
  return output
}

function encodingLength(input) {
  return wasm.exports.base64_encoding_length(input.length)
}

function decodingLength(input) {
  input = Buffer.from(input)
  input.copy(heap, pointer)
  return wasm.exports.base64_decoding_length(input.length, pointer)
}

function toBuffer(buffer, size, offset) {
  if (!Buffer.isBuffer(buffer)) {
    return Buffer.alloc(size)
  } else {
    return buffer.slice(offset || 0)
  }
}

module.exports = {
  encodingLength,
  decodingLength,
  encode,
  decode,
}
