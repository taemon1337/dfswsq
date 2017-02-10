var Client      = require('wsq/client')
var yauzl       = require('yauzl')
var fs          = require('fs')
var PassThrough = require('stream').PassThrough;
var temp        = require('temp')
var path        = require('path')

var client  = new Client('ws://wsqs:4242')
console.log("UNZIP CLIENT: ")

var iqueue = client.queue('unzip')
var oqueue = client.queue('unzipped')

var unzip = function(path, cb) {
  yauzl.open(path, { lazyEntries: true }, function(err, zipfile) {
    if(err) throw err;
    zipfile.readEntry();
    zipfile.on('entry', function(entry) {
      if(/\/$/.test(entry.fileName)) {
        // skip directories
      } else {
        var passthru = new PassThrough()
        zipfile.openReadStream(entry, function(err, readStream) {
          if(err) throw err;

          cb({ read: passthru, name: entry.fileName })
          readStream.pipe(passthru)

          readStream.on('end', function() {
            zipfile.readEntry()
          })
        })
      }
    })
  })
}

iqueue.process(function(task, callback) {
  try {
    if(task.files) {
      temp.mkdir(task.id || 'tmpunzip', function(err, dir) {
        if(err) throw err;

        task.files.forEach(function(file) {
          var zippath = path.join(dir,file.name)
          var writestr = fs.createWriteStream(zippath)

          writestr.on('close', function() {
            unzip(zippath, function(result) {
              oqueue.add(result, function(err) {
                if(err) {
                  console.warn("Error from result queue: ", result, err)
                  callback(err)
                }
              })
            })
          })

          file.read.pipe(writestr);
        })
      })
    }
  } catch(err) {
    console.warn('Error Unzipping: ', task)
    callback(err)
  }
})

