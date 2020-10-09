// Modules

const express = require('express');
const session = require('express-session');
const bodyparser = require('body-parser');
const render = require('ejs');
const http = require('http');
const socketio = require('socket.io');
const mongo = require('mongodb');
const bcrypt = require('bcrypt');


// Server

const app = express();
const dotenv = require('dotenv').config();

// Database

const dburl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/exemplia';
const dbname = 'exemplia';
const MongoClient = mongo.MongoClient;

// Middleware

const clientPath = __dirname+'/../client';
app.use(express.json());
app.use(express.static(clientPath));
app.use(bodyparser.urlencoded({extended: true}));
app.use(session({
	cookie: {
		maxAge: 1000*60*60*24*3,
		secure: false,
	},
	key: 'user_sid',
	secret: process.env.SECRET || 'goldfish',
	resave: false,
	saveUninitialized: false,
	name: 'exemplia'
}));

if(!process.env.SECRET) console.log("Using default secret.  Set envirionmental variables!");

app.set('view engine', 'ejs');
app.set('views', clientPath+'/views')
const server = http.createServer(app);
const port = process.env.PORT || 2000;

server.listen(port, function() {
	console.log("Server listening to port "+port);
});

// Requests

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/login', (req, res) => {
	if(req.session.userID) res.redirect('/');
	else res.render('login');
});

app.get('/register', (req, res) => {
	if(req.session.userID) res.redirect('/');
	res.render('register');
});

app.get('/logout', (req,res) => {
	res.render('logout');
});



//
//  Authentication
//


app.post('/login', async (req, res) => {
	var {username, password} = req.body;
	if(username&&password) {
		MongoClient.connect(dburl, async function(err, db) {
			database = db.db(dbname);
			database.collection('users').findOne({name: username}, async function(err, result) {
				if(err) throw err;
				if(result) {
					try {
						const passMatch = await bcrypt.compare(password, result.password);
						if(passMatch) {
							req.session.authenticated = true;
							req.session.userid = result._id;
							req.session.name = result.name;
							res.redirect('/');
						}
						else res.redirect('/login');
					}
					catch {
						res.status(500).send();
					}
				}
				else res.redirect('/login');
				db.close();
			});
		});
	}
	else res.redirect('/login');
});

app.post('/register', function(req, res) {
	if(req.body.password&&req.body.name) {
		MongoClient.connect(dburl, function(er, db){
			if(er) throw er;
			var database = db.db(dbname);
			database.collection('users').findOne({name: req.body.name}, async function(err, result) {
				if(err) throw (err);
				if(result) res.redirect('/register');
				else {
					try {
						const hashedpass = await bcrypt.hash(req.body.password, 10);
						const user = {
							name: req.body.name,
							email: req.body.email,
							password: hashedpass
						};
						database.collection('users').insertOne(user, function(error, result) {
							if(error) {
								throw error;
							}
							console.log(user.name+' registered.');
							res.redirect('/login');
						});
					}
					catch (e) {console.log(e)}
				}
				db.close();
			});
	});}
	else res.redirect('/register');
});

app.post('/logout', (req,res) => {
	req.session.destroy();
	res.redirect('/login');
});

//  GAMESPACE

app.get('/play', (req,res)=>{
	if(req.session.authenticated) {
		var name = req.session.name;
		res.render('game',{'playername':name});
	}
	else {
		res.redirect('/login');
	}
});

const io = socketio(server);

var SOCKET_LIST = {};

io.sockets.on('connection', function(socket) {
	console.log('Socket connection');
	var username;

	socket.on('serverjoin', function(data) {
		username = data;
		console.log(username+' has joined the game.');
		SOCKET_LIST[username] = socket;
		socket.emit('message', 'Welcome to Exemplia.');
	});

	socket.on('chat_message',function(text){
		console.log(username+': '+text);
		var message = (username+' says, "'+text+'"');
		for(var i in SOCKET_LIST) {
			var sock = SOCKET_LIST[i];
		 	sock.emit('message',message);
		}
	});

});
