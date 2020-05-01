const b64 = require('./')

b64.ready((err) => {
  if (err) { throw err }
  const message = Buffer.from('hello world')
  const encoded = b64.encode(message)

  console.log(encoded.toString()) // aGVsbG8gd29ybGQ=

  const decoded = b64.decode(encoded)

  console.log(decoded.toString()) // hello world
})
