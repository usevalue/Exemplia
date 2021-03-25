const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyparser = require('body-parser');
const { Player, Route, Place, Character } = require('./gamespace/models');
const requestRouter = express.Router();


requestRouter.use(session({
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

requestRouter.use(bodyparser.urlencoded({extended: true}));



//
//	Core site
//



requestRouter.get('/', (req, res) => {
	res.render('home');
});

requestRouter.get('/login', (req, res) => {
	if(req.session.userID) res.redirect('/');
	else res.render('login');
});

requestRouter.get('/register', (req, res) => {
	if(req.session.userID) res.redirect('/');
	res.render('register');
});

requestRouter.get('/logout', (req, res) => {
	res.render('logout');
});



requestRouter.get('/play', (req,res) => {
	if(req.session.authenticated) {
		var name = req.session.name;
		res.render('game', {'playername':name} );
	}
	else {
		res.redirect('/login');
	}
});

requestRouter.get('/play/getcharacters', (req, res) => {
	Character.find({owner: req.session.userid}, function(error, result) {
		if(error) console.log(error);
		else res.send(result);
	})
})

requestRouter.post('/play/newcharacter', (req, res) => {
	var c = new Character(req.body);
	c.owner = req.session.userid;
	try {
		c.save();
		res.send(c._id);
	}
	catch (error) {
		res.send('_ERROR_');
	}
})

requestRouter.post('/play/deletecharacter', (req, res) => {
	var fordeletion = req.body.fordeletion;
	try {
		Character.deleteOne({_id: fordeletion}, (error, result)=>{
			if(error) res.send('_ERROR_');
			else res.send('_SUCCESS_');
		});
	}
	catch(e) {
		res.send('_ERROR_');
	}
});




//
//  AUTHENTICATION
//




requestRouter.post('/login', async (req, res) => {
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
                        console.log(e);
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

requestRouter.post('/register', async function(req, res) {
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
								console.log("Error registering player "+newPlayer.name);
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
			res.redirect('/login');
		}
	}
	else res.redirect('/register');
});

requestRouter.post('/logout', (req,res) => {
	req.session.destroy();
	res.redirect('/login');
});




//
//  ADMINISTRATION
//


function adminOnly(req, res, next) {
	if(!req.session.authenticated) res.redirect('/login');
 	else Player.findOne({_id: req.session.userid}, async(err, result) =>
	{
		if(err) res.redirect('/');
		else {
			if(result.isAdmin) next();
			else res.redirect('/');
		}
	})
}

requestRouter.get('/admin', adminOnly, (req, res) => {
	res.render('administration');
});

// Places

requestRouter.get('/admindelete', adminOnly, (req, res)=>{
	let id = req.query.id;
	switch(req.query.type) {
		case 'place':
			Place.deleteOne({_id: id}, function(error) {
				if(error) {
					console.log('Error deleting entry.');
					res.send('_ERROR_');
				}
				else {
					console.log(req.query.type+' '+id+' deleted');
					res.send('_SUCCESS_');
				}
			})
			break;
		case 'route':
			Route.deleteOne({_id: id}, function(error) {
				if(error) {
					console.log('Error deleting entry.');
					res.send('_ERROR_');
				}
				else {
					console.log(req.query.type+' '+id+' deleted');
					res.send('_SUCCESS_');
				}
			})
			break;
		case 'player':
			break;
	}
});

requestRouter.post('/makeplace', adminOnly, function(req, res) {
	place = Place(req.body);
    console.log(place.name + 'created.');
    try {
        place.save();
        res.send(place._id);
    }
    catch(e) { res.send('_ERROR_'); }
});

requestRouter.get('/unlink', adminOnly, function(req, res) {
	try {
		Place.updateOne({_id: req.query.place}, {$pull: {routes: req.query.route}}, function(error, result) {
			if (error) (res.send('_ERROR_'));
			else res.send('SUCCESS');
		})
	}
	catch(error) {
		res.send('_ERROR_');
	}
});

requestRouter.get('/connectplace', adminOnly, function(req, res) {
	try {
		Route.findById(req.query.route, (error, result)=>{
			if(error||!result) res.send('_ERROR_')
			else {
				Place.updateOne({_id: req.query.place}, {$addToSet: {routes: req.query.route}},function(error, result) {
					if(error) res.send('_ERROR_');
					else res.send('_SUCCESS_');
				})
			}
		})
	}
	catch(error) {res.send('_ERROR_')}
});

requestRouter.get('/getplaces', adminOnly, function(req,res) {
    Place.find({}, function(error, result) {
        if(error) { return; }
        else {
            res.send(result);
        }
    });
});


// Routes

requestRouter.post('/makeroute', adminOnly, function(req, res) {
	route = Route(req.body);
    console.log(route);
    try {
        route.save();
        res.send(route._id);
    }
    catch(e) { res.send('_ERROR_'); }
});

requestRouter.get('/getroutes', adminOnly, function(req,res) {
    Route.find({}, function(error, result) {
        if(!error) 
            res.send(result)
        
    });
});

module.exports = requestRouter;
