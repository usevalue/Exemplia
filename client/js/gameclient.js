const sock = io();

sock.emit('serverjoin', playername);

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

class Character {
    constructor() {
        this.attributes = {
                'constitution': 3,
                'agility': 3,
                'perception': 3,
                'learning': 3,
                'status': 3
            }
        this.attributePoints = 3;
    }
}

const writeMessage = function(text) {
    var insert = document.createElement('li');
    insert.innerHTML = text;
    chat.appendChild(insert);
    chat.scrollBy(0,100);
}

function chooseCharacter() {
    document.getElementById('character_window').style.display = 'inline';
    var selection = document.getElementById('characterpicker').value;
    if(selection=="newcharacter") startCharacterCreation();
    else {
        document.getElementById('descriptionBlock').style.display = 'inline';
        //document.getElementById('characterSkillBlock').style.display = 'inline';
        document.getElementById('newDescriptionBlock').style.display='none';
        displayedCharacter = loadCharacter(selection);
    }
}

function loadCharacter(name) {
    console.log('existing');
    return null;
}


// GAME RULES

const traitLevels = ['Terrible', 'Poor', 'Mediocre', 'Fair', 'Good', 'Great', 'Superb']
const characterAttributes = ['constitution','agility','perception','learning','status']

var displayedCharacter = {};

// CHARACTER CREATION



function startCharacterCreation() {
    displayedCharacter = new Character();
    document.getElementById('descriptionBlock').style.display = 'none';
    document.getElementById('newDescriptionBlock').style.display = 'inline';
    document.getElementById('characterAttributeBlock').style.display = 'none';
    document.getElementById('characterSkillBlock').style.display='none';
}

function submitNewCharacterName() {
    displayedCharacter.fullName = document.getElementById('new_fullName').value;
    displayedCharacter.shortName = document.getElementById('new_shortName').value;
    displayedCharacter.description = document.getElementById('new_description').value;
    document.getElementById('newDescriptionBlock').style.display = 'none';
    document.getElementById('descriptionBlock').style.display = 'inline';
    document.getElementById('characterAttributeBlock').style.display = 'inline';
    setClassVisibility(true, 'attributeAdjusters');
    renderDescription();
    renderAttributes();
}

function submitNewCharacterAttributes() {
    if(displayedCharacter.attributePoints==0) {
        setClassVisibility(false, 'attributeAdjusters');
        saveCharacter(displayedCharacter);
        //document.getElementById('characterSkillBlock').style.display = 'inline';
    }
    else writeMessage('<h2 style="color: red">Hey!  You still have '+displayedCharacter.attributePoints+' points to spend on your core attributes!</h2>');
}

async function saveCharacter(char) {
    sock.emit('saveCharacter',char);
}

function setClassVisibility(state, el) {
    console.log(state);
    console.log(el);
    var disp = 'none';
    if(state) disp = 'inline';
    var set = document.getElementsByClassName(el);
    console.log(set.length);
    for(var i = 0; i<set.length; i++) {
        set[i].style.display = disp;
    }
}


function submitNewCharacterSkills() {
}

function renderAttributes() {
    document.getElementById('character_constitution').innerHTML = traitLevels[displayedCharacter.attributes.constitution];
    document.getElementById('character_agility').innerHTML = traitLevels[displayedCharacter.attributes.agility];
    document.getElementById('character_perception').innerHTML = traitLevels[displayedCharacter.attributes.perception];
    document.getElementById('character_learning').innerHTML = traitLevels[displayedCharacter.attributes.learning];
    document.getElementById('character_status').innerHTML = traitLevels[displayedCharacter.attributes.status];
    document.getElementById('character_attributePoints').innerHTML = displayedCharacter.attributePoints;
}

function renderDescription() {
    document.getElementById('characterFullName').innerHTML = displayedCharacter.fullName;
    document.getElementById('characterShortName').innerHTML = displayedCharacter.shortName;
    document.getElementById('characterDescription').innerHTML = displayedCharacter.description;
}

function incrementAttribute(stat, amount) {
    if(amount>0 && displayedCharacter.attributePoints<1) return false;
    let n = displayedCharacter.attributes[stat]+amount;
    if(traitLevels[n]) {
        displayedCharacter.attributes[stat]+=amount;
        displayedCharacter.attributePoints-=amount;
    }
    renderAttributes();
}


sock.on('message', function(data){writeMessage(data);});
