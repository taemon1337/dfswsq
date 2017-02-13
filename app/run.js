var server = require('http').createServer(),
  fs = require('fs'),
  archiver = require('archiver'),
  express = require('express'),
  Busboy = require('busboy'),
  PassThrough = require('stream').PassThrough,
  crypto = require('crypto'),
  uuid = require('node-uuid'),
  app = express(),
  port = process.env.PORT || 8080;

var convertUint8ArrayToWordArray = function(u8Array) {
  var words = [], i = 0, len = u8Array.length;

  while (i < len) {
    words.push(
      (u8Array[i++] << 24) |
      (u8Array[i++] << 16) |
      (u8Array[i++] << 8)  |
      (u8Array[i++])
    );
  }

  return {
    sigBytes: words.length * 4,
    words: words
  };
};

var convertUint8ArrayToBinaryString = function(u8Array) {
  var i, len = u8Array.length, b_str = "";
  for (i=0; i<len; i++) {
    b_str += String.fromCharCode(u8Array[i]);
  }
  return b_str;
};


app.use(express.static('web'));

app.post('/', function(req, res) {
  var busboy = new Busboy({ headers: req.headers });

  busboy.on('error', function(err) {
    console.log('Parsing Error ', err);
  });

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    var stream = new PassThrough();

    file.pipe(stream);
    archive.append(stream, { name: filename });

    file.on('data', function(data) {
      var written = process.stdout.write(".");
      if(!written) {
        process.stdout.once('drain', function() {}); // flush
      }
      size += data.length;
      md5.update(data);
      sha1.update(data);
      sha256.update(data);
    });

    file.on('end', function() {
      console.log('Completed ' + filename);

      var info = {
        filename: filename,
        size: size,
        encoding: encoding,
        author: user_dn,
        mimetype: mimetype,
        md5: md5.digest('hex'),
        sha1: sha1.digest('hex'),
        sha256: sha256.digest('hex')
      };
      archive.append(JSON.stringify(info,null,2), { name: filename+".json" });
      formdata.children.push(info);
    });
  });

  busboy.on('field', function(fieldname, val, fieldnameTrunc, valTrunc, encoding, mimetype) {
    console.log([fieldname, val].join(': '));
    formdata[fieldname] = val;
  });

  busboy.on('finish', function() {
    console.log('Finished Parsing Form', formdata);
    archive.finalize();
    fs.writeFile(jsonfile, JSON.stringify(formdata,null,2));

    var message = "<h4>Upload Success!</h4><pre>PRE</pre>".replace("PRE",JSON.stringify(formdata,null,2));

    res.write(render("index.html", { hidden: " ", message: message }));
    res.end();
  });

  archive.pipe(outStream);
  req.pipe(busboy);

})

app.post('/inbox', function(req, res) {
  var user_dn = req.get('SSL_CLIENT_S_DN');
  var busboy = new Busboy({ headers: req.headers });
  var count = 0;
  var formdata = { children: [], upload_at: new Date().toISOString().replace(/T/,' ').replace(/\..+/,'') };
  var outfile = [inbox_data,uuid.v4()+'.zip'].join('/');
  var jsonfile = outfile.replace('.zip','.json');
  var outStream = fs.createWriteStream(outfile);
  var archive = archiver('zip', { zlib: { level: 3 }});
  var outStreamStatus = function() {
    console.log("Complete.", archive.pointer(),"bytes written");
  }

  outStream.on('close', outStreamStatus);

  archive.on('error', function(err) {
    console.log('Error archiving...' + err.stack);
    throw err;
  });

  busboy.on('error', function(err) {
    console.log('Parsing Error ', err);
  });

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    var size = 0;
    var md5 = crypto.createHash('md5');
    var sha1 = crypto.createHash('sha1');
    var sha256 = crypto.createHash('sha256');
    var stream = new PassThrough();

    file.pipe(stream);
    archive.append(stream, { name: filename });

    file.on('data', function(data) {
      var written = process.stdout.write(".");
      if(!written) {
        process.stdout.once('drain', function() {}); // flush
      }
      size += data.length;
      md5.update(data);
      sha1.update(data);
      sha256.update(data);
    });

    file.on('end', function() {
      console.log('Completed ' + filename);

      var info = {
        filename: filename,
        size: size,
        encoding: encoding,
        author: user_dn,
        mimetype: mimetype,
        md5: md5.digest('hex'),
        sha1: sha1.digest('hex'),
        sha256: sha256.digest('hex')
      };
      archive.append(JSON.stringify(info,null,2), { name: filename+".json" });
      formdata.children.push(info);
    });
  });

  busboy.on('field', function(fieldname, val, fieldnameTrunc, valTrunc, encoding, mimetype) {
    console.log([fieldname, val].join(': '));
    formdata[fieldname] = val;
  });

  busboy.on('finish', function() {
    console.log('Finished Parsing Form', formdata);
    archive.finalize();
    fs.writeFile(jsonfile, JSON.stringify(formdata,null,2));

    var message = "<h4>Upload Success!</h4><pre>PRE</pre>".replace("PRE",JSON.stringify(formdata,null,2));

    res.write(render("index.html", { hidden: " ", message: message }));
    res.end();
  });

  archive.pipe(outStream);
  req.pipe(busboy);
});

server.on('request', app);
server.listen(port, function() { console.log('listening on ' + server.address().port) });

