var Client  = require('wsq/client')
var yazl    = require('yazl')
var PassThrough = require('stream').PassThrough;

var client  = new Client('ws://wsqs:4242')

var zipQueue = client.queue('zip')
var zippedQueue = client.queue('zipped')

zipQueue.process(function(task, callback) {
  console.log("TASK: ", task.queue, task.id)
  try {
    var zipfile = new yazl.ZipFile();
    var passthru = new PassThrough();

    if(task.data.files) {
      task.data.files.forEach(function(file) {
        zipfile.addReadStream(file.read, file.name, file.options);
      })
    }

    zippedQueue.add({ read: passthru, name: "download.zip" });

    zipfile.outputStream.pipe(passthru)

    zipfile.end();
    callback();
  } catch(err) {
    console.warn("Error Zip: ", err);
    callback(err);
  }
})



