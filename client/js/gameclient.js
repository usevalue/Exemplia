const sock = io();

sock.emit('serverjoin', playername);
sock.on('message', function(data){writeMessage(data);});


const writeMessage = function(text) {
    $('#chat').append('<li>'+text+'</li>');
}

// GAME RULES

const traitLevels = ['Terrible', 'Poor', 'Mediocre', 'Fair', 'Good', 'Great', 'Superb']

$(function() {

    var characterSet = [];
    var displayedCharacter = {};
    
    // Get characters
    const getCharacters = () => {
            $.ajax({
            url: 'play/getcharacters',
            type: 'get',
            success: (data) => {
                characterSet = data;
                loadChooser();
            }
        })
    }

    getCharacters();

    // Loading the interface
    
    function loadChooser() {
        $('#descriptionBlock, #newDescriptionBlock, #characterAttributeBlock').hide();
        $('#characterselector').html('');
        for(let i in characterSet) {
            let c = characterSet[i];
            $('#characterselector').append("<option value='"+c._id+"'>"+c.fullName+"</option>");
        }
        if(characterSet.length<3) {
            $('#characterselector').append("<option value='_NEW_'>Create new character</option>");
        }
    }

    $('#chatter').on("keyup", function(event) {
        if(event.key == "Enter") chatMessage();
    });

    $('#chatbutton').on('click', chatMessage);

    function chatMessage() {
        if(displayedCharacter._id) {
            console.log(displayedCharacter);
            let name = displayedCharacter.shortName;
            var message = {
                'speaker': name,
                'text': $('#chatter').val()
            };
            $('#chatter').val("");
            sock.emit('chat_message', message);
        }
        else {
            writeMessage('<h3>Select a character to begin chatting.</h3>');
        }
    }


    // Character chooser
    

    $('#characterpicker').on('click', (pick)=> {
        var choice = $('#characterselector').val();
        $('#character_window').show();
        if(choice=='_NEW_') beginCharacterCreation();
        else loadCharacter(choice);
    })

    function loadCharacter(id) {
        for(let i in characterSet) {
            if(id==characterSet[i]._id) displayedCharacter = characterSet[i];
        }
        renderDescription();
        renderAttributes(false);
        writeMessage("<i>You are now chatting as "+displayedCharacter.shortName+".</i>");
    }
    
    function renderDescription() {
        $('#descriptionBlock').show();
        $('#characterFullName').html(displayedCharacter.fullName);
        $('#characterShortName').html(displayedCharacter.shortName);
        $('#characterDescription').html(displayedCharacter.description);
    }

    function renderAttributes(adjustable) {
        $('#characterAttributeBlock').show();
        if(adjustable) $('.attributeAdjusters').show();
        else $('.attributeAdjusters').hide();
        $('#character_constitution').html(traitLevels[displayedCharacter.attributes.constitution]);
        $('#character_agility').html(traitLevels[displayedCharacter.attributes.agility]);
        $('#character_perception').html(traitLevels[displayedCharacter.attributes.perception]);
        $('#character_learning').html(traitLevels[displayedCharacter.attributes.learning]);
        $('#character_status').html(traitLevels[displayedCharacter.attributes.status]);
        $('#character_attributePoints').html(displayedCharacter.attributePoints);
        
    }


    //  Character creation

    function beginCharacterCreation() {
        $('#newDescriptionBlock').show();
        displayedCharacter = {
            attributes: {
                'constitution': 3,
                'agility': 3,
                'perception': 3,
                'learning': 3,
                'status': 3
            },
            attributePoints: 3
        };
        $('#descriptionBlock, #characterAttributeBlock').hide();
    }

    $('#submitcharname').on('click', () => {
        displayedCharacter.fullName = $('#new_fullName').val();
        displayedCharacter.shortName = $('#new_shortName').val();
        displayedCharacter.description = $('#new_description').val();
        renderDescription();
        $('#newDescriptionBlock').hide();
        renderAttributes(true);
    });

    $("button[name='attributeincreaser']").on('click', (click)=>{
        if(displayedCharacter.attributePoints<1) {
            writeMessage('<h3>You have no more attribute points.  Lower some attributes if you want more.</h3>');
            return;
        }

        let currentVal = displayedCharacter.attributes[click.target.value];
        if(currentVal==traitLevels.length-1) {
            writeMessage('<h3>'+click.target.value+' is at maximum!</h3>');
            return;
        }
        displayedCharacter.attributes[click.target.value]++;
        displayedCharacter.attributePoints--;
        renderAttributes(true);
    });

    $("button[name='attributedecreaser']").on('click', (click)=>{
        let currentVal = displayedCharacter.attributes[click.target.value];
        if(currentVal==0) {
            writeMessage('<h3>'+click.target.value+' is at the minimum!</h3>');
            return;
        }
        displayedCharacter.attributes[click.target.value]--;
        displayedCharacter.attributePoints++;
        renderAttributes(true);
    });

    $('#savenewcharacter').on('click', () => {
        $.ajax({
            url: 'play/newcharacter',
            type: 'POST',
            data: displayedCharacter,
            success: function(data) {
                if(data=='_ERROR_')
                    writeMessage('There was an error saving this character.  All fields are required and names must be unique.');
                else {
                    displayedCharacter._id=data;
                    characterSet.push(displayedCharacter);
                    loadChooser();
                    renderAttributes();
                    renderDescription();
                }
            }
        });
    });


    //  Player actions

    $('#action_display > div').hide();

    $('#action_options > button').on('click', (clickity)=> {
        var choice = (clickity.target.name);
        $('#action_display > div').hide();
        $("#"+choice+"_actions").show();
    })

    $('#character_actions > ul > li > a.actionlink').on('click', (clicked) => {
        console.log(clicked.target.name);
    });

    $('#manage_actions > ul > li > a.actionlink').on('click', (clicked) => {
        var activeid = displayedCharacter._id;
        if(!activeid) return;
        switch(clicked.target.name) {
            case 'deletecharacter':
                $.ajax({
                    url: 'play/deletecharacter',
                    type: 'POST',
                    data: { fordeletion: activeid },
                    success: (data) => {
                        if(data=='_ERROR_') return;
                        else getCharacters();
                    }
                });
                break;
            case 'changename':
                console.log('todo');
                break;
            case 'editdescription':
                console.log('todo');
                break;
        }
    });

});