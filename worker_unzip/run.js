var Client      = require('wsq/client')
var yauzl       = require('yauzl')
var fs          = require('fs')
var temp        = require('temp')
var path        = require('path')

var client  = new Client('ws://wsqs:4242')

var iqueue = client.queue('unzip')
var oqueue = client.queue('unzipped')

var unzip = function(path, callback) {
  if(fs.existsSync(path)) {
    yauzl.open(path, { lazyEntries: true }, function(err, zipfile) {
      if(err) throw err;

      zipfile.on('entry', function(entry) {
        console.log('ZIP ENTRY: ', entry.fileName)
        if(/\/$/.test(entry.fileName)) {
          // skip directories
          zipfile.readEntry()
        } else {
          zipfile.openReadStream(entry, function(err, readStream) {
            if(err) throw err;

            callback({ read: readStream, name: entry.fileName })

            readStream.on('end', function() {
              zipfile.readEntry()
            })
          })
        }
      })

      zipfile.on('end', function() {
        callback(null, true)
      })

      zipfile.on('error', function(err) {
        callback(null, err)
      })

      zipfile.readEntry();
    })
  } else {
    console.log('NOT EXIST: ', path)
  }
}

iqueue.process(function(task, callback) {
  console.log("TASK: ", task.queue, task.id)
  try {
    if(task.data.files) {
      temp.mkdir(task.id, function(err, dir) {
        if(err) throw err;

        task.data.files.forEach(function(file) {
          setTimeout(function() {
            var zippath = path.join(dir,file.name)
            var writer = fs.createWriteStream(zippath)

            writer.on('close', function() {
              unzip(zippath, function(result, done) {
                if(done) {
                  callback(done)
                } else {
                  task.touch()
                  oqueue.add(result, function(err) {
                    if(err) {
                      console.warn("Error from result queue: ", result, err)
                      callback(err)
                    }
                  })
                }
              })
            })
  
            file.read.pipe(writer);
          }, 1000)
        })
      })
    }
  } catch(err) {
    console.warn('Error Unzipping: ', err)
    callback(err)
  }
})

