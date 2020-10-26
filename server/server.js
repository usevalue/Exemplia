const express = require('express');
const static = express.static;
const http = require('http');
const mongoose = require('mongoose');

// SETUP
const dotenv = require('dotenv').config();
if(!process.env.SECRET) console.log("Using default secret.  Set envirionmental variables!");
const dburl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/exemplia';

mongoose.connect(dburl, {useNewUrlParser: true, useUnifiedTopology: true})
module.exports.mongoose = mongoose;

// SERVER SETUP
const clientPath = __dirname+'/../client/';
const requestRouter = require('./router.js');

const app = express();
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', clientPath+'/views');
app.use(static(clientPath));
app.use('/',requestRouter);

// GAMESPACE

const httpServer = http.createServer(app);
const port = process.env.PORT || 2000;
httpServer.listen(port, function() {
	console.log("Server listening to port "+port);
});

const gs = require('./gamespace/gameserver');
const gameserver = new gs.GameServer(httpServer);
gameserver.runGame();
