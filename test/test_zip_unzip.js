var Client  = require('wsq/client')
var fs      = require('fs')
var path    = require('path')

var client  = new Client('ws://wsqs:4242')
var files   = process.argv.slice(2)

var zip_queue       = client.queue('zip')
var zipped_queue    = client.queue("zipped")
var unzip_queue     = client.queue('unzip')
var unzipped_queue  = client.queue("unzipped")

var queueFile = function(queue, file) {
  console.log("Queueing File: ", file.name)
  queue.add({
    files: [file]
  }, function(err) {
    if(err) {
      console.log("Error",err);
    } else {
      console.log("Successfully",file);
    }
  });
}

zipped_queue.process(function(task, callback) {
  console.log("FILES HAS BEEN ZIPPED", task.data.name)
  queueFile(unzip_queue, task.data)
  callback()
})

unzipped_queue.process(function(task, callback) {
  console.log("UNZIPPED RESULT: ", task.data.name)

  task.data.read.on('data', function(chunk) {
    console.log("CHUNK: ", chunk.length)
  })

  task.data.read.read()
  callback()
})

files.forEach(function(file) { queueFile(zip_queue, { read: fs.createReadStream(file), name: path.basename(file) }) });
