var Client  = require('wsq/client');
var fs      = require('fs');

var client  = new Client('ws://wsqs:4242');
var queue   = client.queue('unzip');
var files   = process.argv.slice(2)
console.log("CLIENT: ", files)

var queueFile = function(file) {
  console.log("Queueing File: ", file)
  queue.add({
    read: fs.createReadStream(file),
    name: file
  }, function(err) {
    if(err) {
      console.log("Error Unzipping " + file);
    } else {
      console.log("Successfully unzipped " + file);
    }
  });
}

files.forEach(function(file) { queueFile(file) });
