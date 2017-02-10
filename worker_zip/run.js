var Client  = require('wsq/client')
var yazl    = require('yazl')
var PassThrough = require('stream').PassThrough;

var client  = new Client('ws://wsqs:4242')

var zipQueue = client.queue('zip')
var zippedQueue = client.queue('zipped')
console.log("WORKER ZIP")

zipQueue.process(function(task, callback) {
  try {
    var zipfile = new yazl.Zipfile();
    var passthru = new PassThrough();

    if(task.files) {
      task.files.forEach(function(file) {
        zipfile.addReadStream(file.read, file.name, file.options);
      })
    }

    zippedQueue.add({ files: [{ read: passthru, name: "download.zip" }] });

    zipfile.outputStream.pipe(passthru)

    zipfile.end();
    callback();
  } catch(err) {
    console.warn("Error Zip: ", task);
    callback(err);
  }
})



