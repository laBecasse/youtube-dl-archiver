/*
 * Temporary file route is able to serve media files
 * while they are downloading 
 * using HTTP Partial Content by:
 * 1. check if the file is in downloading, then serve data range from the temporary file 
 * 2. else get the data range from the downloaded file 
 */
const http = require("http");
const https = require('https')
const fs = require("fs");
const path = require("path");
const url = require('url');

const filePath = require('../models/FilePath')
const Archive = require('../models/Archive')
const CHUNK_LENGTH = 1024000
const DownloadState = require('../models/DownloadState')

module.exports = function (router) {
  router.get('/tmp-media/:id', (req, res, next) => {
    const id = req.params.id
    const state = DownloadState.get(id)
    if (state) {
      httpListener(req, res, state)
    } else {
      res.status(404)
      return res.send()
    }
  })

}

// List filename extensions and MIME names we need as a dictionary. 
var mimeNames = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'application/ogg', 
  '.ogv': 'video/ogg', 
  '.oga': 'audio/ogg',
  '.txt': 'text/plain',
  '.wav': 'audio/x-wav',
  '.webm': 'video/webm'
};

function httpListener (request, response, state) {
  // We will only accept 'GET' method. Otherwise will return 405 'Method Not Allowed'.
  if (request.method != 'GET') { 
    sendResponse(response, 405, {'Allow' : 'GET'}, null);
    return null;
  }
  var filename = state.getCurrentPath()
  console.log(filename)
  // // Check if file exists. If not, will return the 404 'Not Found'. 
  if (!fs.existsSync(filename)) {
    console.log('404')
    sendResponse(response, 404, null, null);
    return null;
  }

  const stat = fs.statSync(filename)
  const completedSize = state.getSize() || stat.size
  
  var responseHeaders = {};

  var rangeRequest = readRangeHeader(request.headers['range'], stat.size);

  // If 'Range' header exists, we will parse it with Regular Expression.
  if (rangeRequest == null) {
    responseHeaders['Content-Type'] = getMimeNameFromExt(path.extname(filename));
    if (completedSize)
      responseHeaders['Content-Length'] = completedSize //stat.size;  // File size.
    responseHeaders['Accept-Ranges'] = 'bytes';

    //  If not, will return file directly.
    sendResponse(response, 200, responseHeaders, fs.createReadStream(filename));
    return null;
  }

  var start = rangeRequest.Start;
  var end = rangeRequest.End;

  if (start >= stat.size && end < completedSize) {
    setTimeout(()=>{httpListener (request, response, state)}, 1000)
    return null
  }

  // If the range can't be fulfilled by the complete file.
  if ( end <= start || end >= completedSize) {
    // Indicate the acceptable range.
    if (completedSize) {
      responseHeaders['Content-Range'] = 'bytes */' + completedSize // File size.
    }

    // Return the 416 'Requested Range Not Satisfiable'.
    sendResponse(response, 416, responseHeaders, null);
    return null;
  }
  
  // Indicate the current range.
  if (completedSize) {
    responseHeaders['Content-Range'] = 'bytes ' + start + '-' + end + '/' + completedSize;
  } else {
    responseHeaders['Content-Range'] = 'bytes ' + start + '-' + end + '/*'
  }
  responseHeaders['Content-Length'] = start == end ? 0 : (end - start + 1);
  responseHeaders['Content-Type'] = getMimeNameFromExt(path.extname(filename));
  responseHeaders['Accept-Ranges'] = 'bytes';
  responseHeaders['Cache-Control'] = 'no-cache';

  // Return the 206 'Partial Content'.
  sendResponse(response, 206,
               responseHeaders, fs.createReadStream(filename, { start: start, end: end }));
}

function sendResponse(response, responseStatus, responseHeaders, readable) {
  response.writeHead(responseStatus, responseHeaders);

  if (readable == null)
    response.end();
  else
    readable.on('open', function () {
      readable.pipe(response);
    });

  return null;
}

function getMimeNameFromExt(ext) {
  var result = mimeNames[ext.toLowerCase()];
  
  // It's better to give a default value.
  if (result == null)
    result = 'application/octet-stream';
  
  return result;
}

function readRangeHeader(range, totalLength) {
  /*
   * Example of the method 'split' with regular expression.
   * 
   * Input: bytes=100-200
   * Output: [null, 100, 200, null]
   * 
   * Input: bytes=-200
   * Output: [null, null, 200, null]
   */

  if (range == null || range.length == 0)
    return null;

  var array = range.split(/bytes=([0-9]*)-([0-9]*)/);
  var start = parseInt(array[1]);
  var end = parseInt(array[2]);
  console.log(start, end, totalLength)
  var result = {
    Start: isNaN(start) ? 0 : start,
    End: isNaN(end) ? Math.min(totalLength - 1, start + CHUNK_LENGTH) : end
  };

  if (!isNaN(start) && isNaN(end)) {
    result.Start = start;
    result.End = Math.min(totalLength - 1, start + CHUNK_LENGTH);
  }

  if (isNaN(start) && !isNaN(end)) {
    result.Start = totalLength - end;
    result.End = totalLength - 1;
  }

  console.log(result)
  return result;
}
