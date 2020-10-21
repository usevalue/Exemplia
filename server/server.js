// Modules

const express = require('express');
const session = require('express-session');
const bodyparser = require('body-parser');
const render = require('ejs');
const http = require('http');
const bcrypt = require('bcrypt');
const app = express();
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
module.exports.mongoose = mongoose;



const dburl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/exemplia';
const dbname = 'exemplia';

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
const httpServer = http.createServer(app);
const port = process.env.PORT || 2000;
httpServer.listen(port, function() {
	console.log("Server listening to port "+port);
});

const gs = require('./gamespace/gameserver');
const { Player, PlayerCharacter } = require('./gamespace/models');
const gameserver = new gs.GameServer(httpServer);
gameserver.runGame();

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

app.get('/play', (req,res)=>{
	if(req.session.authenticated) {
		var name = req.session.name;
		res.render('game',{'playername':name});
	}
	else {
		res.redirect('/login');
	}
});

//
//  Authentication
//

mongoose.connect(dburl, {useNewUrlParser: true, useUnifiedTopology: true})

app.post('/login', async (req, res) => {
	var {username, password} = req.body;
	if(username&&password) {
		try {
			await Player.findOne({name: username}, async (err, result) => {
				if(err) {
					res.redirect('/login');
				}
				else if(result) {
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
					catch(e) {
						res.redirect('/login');
					}
				}
				else res.redirect('/login');
			});
		}
		catch(e) {
			console.log(e);
			res.redirect('/login');
		}
	}
	else res.redirect('/login');
});

app.post('/register', async function(req, res) {
	if(req.body.password&&req.body.name) {
		try {
			await Player.findOne({name: req.body.name}, async (err, result) => {
				if(err) {
					res.redirect('/register');
				}
				else if(!result) {
					try {
						const hashedpass = await bcrypt.hash(req.body.password, 10);
						var newPlayer = new Player({
							name: req.body.name,
							password: hashedpass,
							email: req.body.email
						});
						newPlayer.save((err)=>{
							if(err) {
								console.log(err);
								res.redirect('/register');
							}
							else res.redirect('/login');
						});
					}
					catch (e) {
						console.log(e);
						res.redirect('/register');
					}
				}
				else res.redirect('/register');
			});
		}
		catch(e) {
			console.log(e);
			res.redirect('/login');
		}
	}
	else res.redirect('/register');
});

app.post('/logout', (req,res) => {
	req.session.destroy();
	res.redirect('/login');
});