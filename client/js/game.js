const sock = io();
sock.emit('serverjoin',userid);

var chatter = document.getElementById('chatter');
var chat = document.getElementById('chat');

chatter.addEventListener("keyup", function(event) {
    if(event.key == "Enter") chatMessage();
});

const chatMessage = function() {
    var message = chatter.value;
    chatter.value = "";
    sock.emit('chat_message',message);
}

const writeMessage = function(text) {
    var insert = document.createElement('li');
    insert.innerHTML = text;
    chat.appendChild(insert);
    chat.scrollBy(0,100);
}

sock.on('message', function(data){writeMessage(data);});



