const socketio = require('socket.io');
const Player = require('./models').Player;


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
                        socket.emit('characterSet', socket.player.characters);
                    }
                });
            });
        
            socket.on('chat_message',function(data){
                console.log(data.speaker+': '+data.text);
                let message = (data.speaker+' says, "'+data.text+'"');
                tellAll(message);
            });
        
            socket.on('disconnect', () => {
                delete PLAYER_LIST[socket.id];
            });
        
            socket.on('newCharacter', () => {
                console.log(socket.player)
            });

            socket.on('saveCharacter', (char) => {
                try {
                    socket.player.characters.push(char);
                    socket.player.save();
                    socket.emit('Character saved!');
                }
                catch (error) {
                    console.log("Error saving character:");
                    console.log(error);
                    socket.emit('message', 'Error saving character.');
                }
            })
        });

    };

}

exports.GameServer = GameServer;
