const socketio = require('socket.io');
const { Player, Character, Place, Route } = require('./models');
const { ObjectId } = require('mongodb');
const { Callbacks } = require('jquery');

class GameServer {
    
    constructor(httpServer) {
        this.io = socketio(httpServer);
    }


    runGame() {
        var io = this.io;

        io.sockets.on('connection', function(socket) {
            
            socket.on('serverjoin', async function(data) {
                await Player.findOne({name: data}, async (err, result) => {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        socket.player = result;
                        console.log(socket.player.name+' has joined the game.');
                        socket.emit('message', '<h3>Welcome to Exemplia.  Select a character from the drop-down menu on the right to begin talking and exploring.</h3>');
                    }
                });
            });

            socket.on('joinchannel', async function(data) {
                Place.findOne({name: data.location}, async (error, result) => {
                    if(error) {
                        console.log('Error finding place for character: ');
                        console.log(error);
                    }
                    else {
                        socket.join(result.name);
                        socket.emit('location',result);
                        getRouteTree(result).then((data)=>{
                            console.log(data);
                            socket.emit('routeTree',data)
                        });
                    }
                })
            });

            socket.on('travelto', async function(data, callback) {
                if(data.traveller) {
                    Character.findById(data.traveller, (error, character) =>{
                        if(error) console.log(error);
                        else if (character) {
                            Place.findOne({name: data.destination}, (e, r) => {
                                if(e) console.log(e);
                                else if (r) {
                                    socket.leave(character.location);
                                    character.location = r.name;
                                    character.save();
                                    callback(character.location);
                                }
                            })
                        }
                    });
                }
                console.log(data);
            });

            async function getRouteTree(location) {
                let tree={};
                var routeNameList = [];
                for(let i in location.routes) {
                    let routeId = location.routes[i];
                    await Route.findOne({_id: routeId}, async (error, result) => {
                        if(error) console.log(error);
                        else {
                            let routeName = result.name;
                            routeNameList.push(routeName);
                        }
                    });
                }
                for(let i in location.routes) {
                    await Place.find({routes: location.routes[i]}, (error, result) => {
                        if(error) console.log(error);
                        else {
                            let destSet = [];
                            for(let j in result) destSet.push(result[j].name);
                            tree[routeNameList[i]] = destSet;
                        }
                    })
                }
                return tree;
            }


            socket.on('chat_message',function(data){
                console.log(data.speaker+': '+data.text);
                let message = (data.speaker+' says, "'+data.text+'"');
                socket.to(data.location).emit('message', message);
            });
        
            socket.on('disconnect', () => {
                try {
                    io.emit('message','<i>'+socket.player.name+' has disconnected.</i>');
                }
                catch(e) {}
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
