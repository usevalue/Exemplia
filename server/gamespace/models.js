const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { stringify } = require('uuid');


const attributeSchema = new mongoose.Schema({
    constitution: {
        type: Number,
        required: true
    },
    agility: {
        type: Number,
        required: true
    },
    perception: {
        type: Number,
        required: true
    },
    learning: {
        type: Number,
        required: true
    },
    status: {
        type: Number,
        required: true
    },
});

const characterSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    shortName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    attributes: {
        type: attributeSchema,
        required: true
    }
});

const PlayerCharacter = mongoose.model('Character', characterSchema, 'Characters');


// Meta-game.

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: String,
    characters: [characterSchema],

});


const Player = mongoose.model('Player', playerSchema, 'Players');

module.exports = {Player, PlayerCharacter};