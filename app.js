'use strict';

var express = require('express');
var app = express.createServer();
var socket = require('socket.io');
var uuid = require('node-uuid');

var config = require('./config.json');

app.configure(function () {
  app.use(express.static(__dirname + '/'));
});

var pub = __dirname + '/public';
app.use(app.router);
app.use(express.static(pub));
// app.use(express.errorHandler());
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {layout: false});


var createRoom = function (room) {
  var active_connections = 0;
  var newRoom = io.of('/' + room);
  newRoom.on('connection', function (socket) {

    active_connections++;

    newRoom.emit('user:connect', active_connections);

    socket.on('disconnect', function () {
      active_connections--;
      newRoom.emit('user:disconnect', active_connections);
      //if (active_connections === 0) {
      //  newRoom.close();
      //}
    });

    // EVENT: User stops drawing something
    socket.on('draw:progress', function (uid, co_ordinates) {
      newRoom.emit('draw:progress', uid, co_ordinates);
    });

    // EVENT: User stops drawing something
    socket.on('draw:end', function (uid, co_ordinates) {
      newRoom.emit('draw:end', uid, co_ordinates);
    });
  });
};

app.configure(function () {
  app.use(express.static(__dirname + '/'));
});

// SESSIONS
app.use(express.cookieParser());
app.use(express.session({secret: 'secret', key: 'express.sid'}));

// DEV MODE
app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// LISTEN FOR REQUESTS
var server = app.listen(config.port);
var io = socket.listen(server);

console.log('listening on port ' + config.port);
// PRODUCTON MODE
app.configure('production', function () {
  app.use(express.errorHandler());
});

// ROUTES
//app.get('/', function (req, res) {
//  res.render('index', {
//    title: 'title'
//  });
//});

app.get('/room/:roomID', function (req, resp) {
  console.log(req.params.roomID);
  var roomID = req.params.roomID;
  resp.render('index', {
    title: 'Room ' + roomID,
    roomID: roomID
  });
});

app.get('/room/:roomID/canvas.js', function (req, resp) {
  console.log(req.params.roomID);
  require('fs').readFile('./public/javascripts/canvas.js', function (err, data) {
    var dataToSend = data.toString().replace('ROOM_ID', req.params.roomID);
    resp.send(dataToSend);
  });
});

app.post('/room', function (req, resp) {
  console.log('room');
  var newRoomId = uuid.v4();
  createRoom(newRoomId);
  resp.json({roomID: newRoomId});
});
