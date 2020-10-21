const socketio = require('socket.io');
const mongo = require('mongodb');
const mongoose = require('../server').mongoose;
const dburl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/exemplia';

const Player = require('./models').Player;
const PlayerCharacter = require('./models').PlayerCharacter;


class GameServer {
    
    constructor(httpServer) {
        this.io = socketio(httpServer);
        this.PLAYER_LIST = {};
    }


    runGame() {
        var PLAYER_LIST = this.PLAYER_LIST;
        var io = this.io;

        var tellAll = (message) => {
            for(var i in this.PLAYER_LIST) {
                this.PLAYER_LIST[i].emit('message', message);
            }
        }

        io.sockets.on('connection', function(socket) {
            socket.player=null;
            socket.on('serverjoin', async function(data) {
                PLAYER_LIST[socket.id] = socket;
                await Player.findOne({name: data}, async (err, result) => {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        socket.player = result;
                        console.log(socket.player.name+' has joined the game.');
                        socket.emit('message', 'Welcome to Exemplia.');
                    }
                });
            });
        
            socket.on('chat_message',function(text){
                console.log(socket.player.name+': '+text);
                let message = (socket.player.name+' says, "'+text+'"');
                tellAll(message);
            });
        
            socket.on('disconnect', () => {
                delete PLAYER_LIST[socket.id];
            });
        
            socket.on('newCharacter', () => {
                console.log(socket.player)
            });

            socket.on('saveCharacter', (char) => {
                var pc = new PlayerCharacter(char);
                socket.player.characters.push(char);
                socket.player.save();
            })
        });

    };

}

exports.GameServer = GameServer;
