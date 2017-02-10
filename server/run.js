var Server = require('wsq/server')
var leveldown = require('leveldown')
var BlobStore = require('fs-blob-store')

new Server({
  socketOptions: {port: 4242},
  dbLocation: '/data/leveldb',
  dbOptions: {db: leveldown}, // db can be any 'abstract-leveldown' compatible instance
  blobStore: new BlobStore('/data/blob') // same here any 'abstract-blob-store' will do
})

console.log('Starting WSQ Server')
