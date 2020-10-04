// Modules

const express = require('express');
const session = require('express-session');
const bodyparser = require('body-parser');
const render = require('ejs');
const http = require('http');
const socketio = require('socket.io');
const e = require('express');

//  Environment

const PORT = process.env.PORT || 2000;
const SECRET = process.env.secret || 'flood';
if(SECRET==='flood') console.log("Using default secret.  Set the secret environmental variable for security!");
const clientPath = __dirname+'/client';

// Configuration

const app = express();
app.use(express.static(clientPath));
app.use(bodyparser.urlencoded({extended: true}));
app.use(session({
	cookie: {
		maxAge: 1000*60*60*24*3,
		secure: false,
	},
	key: 'user_sid',
	secret: SECRET,
	resave: false,
	saveUninitialized: false,
	name: 'exemplia'
}));
app.set('view engine', 'ejs');
app.set('views', __dirname+'/client/views');

const server = http.createServer(app);
server.listen(PORT, function() {
	console.log("Server listening to port "+PORT);
});

function checkLogin(req, res, next) {
	if(!req.session.authenticated) res.redirect('/login');
	else next();
}

// Requests

app.get('/', (req,res) => {
	res.render('home');
});

//  Authentication

const users = []; // TODO: Database hookup.

app.get('/login', (req, res) => {
	if(req.session.userID) res.redirect('/');
	else res.render('login');
});

app.post('/login', (req, res) => {
	const {username, password} = req.body;
	if(username && password) {
		if(req.session.authenticated) {
			res.redirect('/');
		} else {
			const user = users.find((user)=>user.name===username);
			if(user) {
				if(password===user.password) {
					req.session.authenticated=true;
					req.session.userID=user.id;
					res.redirect('/');
				}
				else res.redirect('/login');
			}
			else res.redirect('/login');
		}
	}
	else res.redirect('/login');
});

app.get('/logout', (req,res) => {
	res.render('logout');
});

app.post('/logout', (req,res) => {
	req.session.destroy();
	res.redirect('/login');
});

app.get('/register', (req, res) => {
	if(req.session.userID) res.redirect('/');
	res.render('register');
});

function getNewID() {
	var newid = Math.random();
	return newid;
}

app.post('/register', async (req,res)=>{
	if(req.session.authenticated) redirect('/logout');
	else {
		try {
			var name = req.body.name;
			var hashedPassword = req.body.password;
			var newId = getNewID();
			users.push({
				id: newId,
				name: name,
				password: hashedPassword
			});
			res.redirect('/login');
		}
		catch {
			res.redirect('/register');
		}
	}
});


app.get('/play', (req,res)=>{
	const userID = req.session.userID;
	if(userID) {
		res.render('game',{'userID': userID})
	}
	else {
		res.redirect('/login');
	}
});

//  GAMESPACE

const io = socketio(server);

var SOCKET_LIST = {};

io.sockets.on('connection', function(socket) {

	var socketid;
	var user;

	socket.on('serverjoin', function(data) {
		console.log('New connection');
		socketid = data;
		user = users.find(user => user.id==socketid);
		console.log(user.name+' has joined the server.');
		SOCKET_LIST[socketid] = socket;
		socket.emit('message', 'Welcome to Exemplia.');
	});

	socket.on('chat_message',function(text){
		var message = user.name+' says, "'+text+'"';
		console.log(message);
		for(var i in SOCKET_LIST) {
			var sock = SOCKET_LIST[i];
			sock.emit('message',message);
		}
	});

});
