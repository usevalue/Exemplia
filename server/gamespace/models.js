const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

//  CHARACTERS

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
    },
    owner: {
        type: String,
        default: "server"
    },
    location: {
        type: String,
        default: "Frog Castle"
    }
});

// PLAYERS

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
    isAdmin: {
        type: Boolean,
        default: false
    }

});


// LOCATIONS

const connectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    verbal: {
        type: String,
        default: 'take the path'
    }
});


const placeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    routes: {
        type: [ObjectId]
    }
});

const Route = mongoose.model("Route", connectionSchema, "Routes");
const Character = mongoose.model("Character", characterSchema, "Characters")
const Player = mongoose.model('Player', playerSchema, 'Players');
const Place = mongoose.model("Place", placeSchema, "Places");

module.exports = {Player, Place, Route, Character};