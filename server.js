const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const port = process.env.PORT || 2000;


const app = express();
const clientPath = __dirname+'/client/';

app.set('view-engine', 'ejs');

app.get('/', function(req, res){
	res.render(clientPath+'index.ejs');
});

//app.use(express.static(clientPath));
const server = http.createServer(app);
const io = socketio(server);

server.listen(port, function() {
	console.log("Starting server on port "+port);
});

server.on('error', err => {
	console.log("Server error.");
});

var SOCKET_LIST = {};

io.sockets.on('connection', function(socket){
	var id = Math.random();
	SOCKET_LIST[id] = socket;
	console.log("Connection number "+id+" established");
	socket.emit('message', 'Welcome to Exemplia.');
	socket.on('chat_message',function(text){
		console.log(id+" says "+text);
		for(var i in SOCKET_LIST) {
			var sock = SOCKET_LIST[i];
			sock.emit('message',text);
		}
	});
});

