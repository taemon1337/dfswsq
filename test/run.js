var Client  = require('wsq/client')
var fs      = require('fs')
var path    = require('path')

var client  = new Client('ws://wsqs:4242')

var meth    = process.argv[2]
var files   = process.argv.slice(3)

var queue   = client.queue(meth)
var result  = client.queue(meth+"ped") // zipped or unzipped
var pad = '                    '

var es = client.getEventStream()
es.on('data', function(data) {
  data.args.forEach(function(a) {
    console.log(data.event.toUpperCase(), a.queue, a.id, a.state)
  })
})

var queueFile = function(file) {
  console.log("Queueing File: ", file)
  queue.add({
    files: [
      {
        read: fs.createReadStream(file),
        name: path.basename(file)
      }
    ]
  }, function(err) {
    if(err) {
      console.log("Error",meth,file);
    } else {
      console.log("Successfully",meth,file);
    }
  });
}

files.forEach(function(file) { queueFile(file) });

setTimeout(function() {
  result.process(function(task, callback) {
    console.log("RESULT: ", task.queue, task.data.name)
    callback()
  })
}, 500)


