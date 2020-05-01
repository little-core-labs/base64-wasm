const crypto = require('crypto')
const test = require('tape')
const b64 = require('../')

test('encode', (t) => {
  const message = crypto.randomBytes(32)
  t.equal(message.toString('base64'), b64.encode(message).toString())
  t.end()
})

test('decode', (t) => {
  const message = crypto.randomBytes(32)
  t.equal(
    message.toString('hex'),
    b64.decode(Buffer.from(message.toString('base64'))).toString('hex')
  )
  t.end()
})

test('ready', (t) => {
  b64.ready((err) => {
    t.error(err)
    t.end()
  })
})
