var mongoose = require('mongoose');
var User = mongoose.model('User');

// passport strategies
var LocalStrategy = require('passport-local').Strategy;
var FaceBookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

// Holds the social authentication app keys from Facebook, Twitter and Google
var config = require('./passportSocialAuthenticationInfo');


//var bCrypt = require('bcrypt-nodejs');
var mailer = require('../services/mailer.js');
var util = require('../services/util.js');

module.exports = function(passport) {
	// Passport needs to be able to serialize and deserialize users to support persistent login sessions

    passport.serializeUser(function(user, done) {
		// console.log('serializing user:');
		done(null, user._id);
	});
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
				// console.log('deserializing user:');
				done(err, user);
		});
	});

	// PASSPORT-LOCAL LOGIN STRATEGY
	passport.use('login', new LocalStrategy({
			passReqToCallback : true
		},
		function(req, email, password, done) {

	        // check in mongo if a user with email exists or not
            User.findOne({ 'email' :  email },
			function(err, user) {

			    // In case of any error, return using the done method
                if (err)
					return done(err);

                if (user) {

                    switch (true) {
                        case (user.facebook_id != null):
                            // console.log('Already registered with Facebook');
                            var failureMessageFacebook = 'This email was registered with Facebook, please sign in with Facebook.';
                            return done(null, false, req.flash('alreadyRegisteredFacebook', failureMessageFacebook));
                        case (user.google_id != null):
                            // console.log('Already registered with Google');
                            var failureMessageGoogle = 'This email was registered with Google, please sign in with Google.';
                            return done(null, false, req.flash('alreadyRegisteredGoogle', failureMessageGoogle));
                        case (user.twitter_id != null):
                            // console.log('Already registered with Twitter.');
                            var failureMessageTwitter = 'This email was registered with Twitter, please sign in with Twitter.';
                            return done(null, false, req.flash('alreadyRegisteredTwitter', failureMessageTwitter));
                        default:
                            break;
                    }
                }

				// Email does not exist, log the error and redirect back
                if (!user){
					// console.log('User Not Found with email '+ email);
					var failmessage = 'Email ' + email + ' is not registered. Please sign up!';
					return done(null, false, req.flash('userNotRegistered', failmessage ));
				}

				// User exists but wrong password, log the error
                if (!util.isValidPassword(user, password)){
					// console.log('Invalid Password');
					return done(null, false, req.flash('wrongPassword', 'Wrong password, please try again.')); // redirect back to login page

				}

				// set remember me
				var rememberMe = req.body.remember_me;

				if (rememberMe && rememberMe !== '') {
					user.remember_me = rememberMe;
					user.save();
				}

				// which will be treated like success
				return done(null, user);
			});
    }));

	// PASSPORT-LOCAL SIGNUP STRATEGY
	passport.use('signup', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback

        },
        function(req, email, password, done) {
			// find a user in mongo with provided email

            User.findOne({ 'email' :  email }, function(err, user) {
                // In case of any error, return using the done method

                if (err){
                    // console.log('Error in SignUp: '+ err);
                    return done(err);
                }
                // already exists

                if (user) {

                    if (user.is_activated) {
                        // all cases must be set to != instead of != because of "types"
                        switch (true) {
                            case (user.facebook_id != null):
                                // console.log('Already registered with Facebook');
                                var failureMessageFacebook = 'This email has already been registered with Facebook, please sign in.';
                                return done(null, false, req.flash('alreadyRegisteredFacebook', failureMessageFacebook));
                            case (user.google_id != null):
                                // console.log('Already registered with Google');
                                var failureMessageGoogle = 'This email has already been registered with Google, please sign in.';
                                return done(null, false, req.flash('alreadyRegisteredGoogle', failureMessageGoogle));
                            case (user.twitter_id != null):
                                // console.log('Already registered with Twitter.');
                                var failureMessageTwitter = 'This email has already been registered with Twitter, please sign in.';
                                return done(null, false, req.flash('alreadyRegisteredTwitter', failureMessageTwitter));
                            default:
                                // console.log('User already exists and is validated with email: ' + email);
                                return done(null, false, req.flash('userEmailTaken', 'This email is already registered. Please sign in!'));
                        }
                    } else {
                        var failureMessage = 'Please check your email to validate your address.';
                        // console.log('User has registered but not validated their email address.');
                        return done(null, false, req.flash('userNotValidated', failureMessage));
                    }

                } else {
                    // if there is no user, create the user

                    var newUser = new User();
                    // set the user's local credentials

                    //newUser.username = username;
                    newUser.password = util.createHash(password);
                    newUser.email = req.body.email;
		    newUser.gender = req.body.gender;
		    newUser.fname = req.body.fname;
		    newUser.lname = req.body.lname;
		    newUser.dob = req.body.dob;
                    //newUser.role = req.body.role;
                    // save the user

		    var activationToken = new Buffer(newUser.email + ',' + new Date().getTime()).toString('base64');

		    newUser.activation_token = activationToken;
		    newUser.is_activated = false;
		    newUser.activation_status = 0;

		    mailer.sendMail('support@ibouge.com', req.body.email, mailer.introSubject, mailer.introBody(newUser, 'https://www.ibouge.com/#/login?token=' + activationToken)).then(function() {
			console.log('mail to', req.body.email, 'sent');
		    }, function(error) {
			console.log('mail sending to', req.body.email, 'failed: ', error);
		    });
				    
                    newUser.save(function(err) {
                        if (err){
                            // console.log('Error in Saving user: '+err);
                            throw err;
                        }
                        // console.log(newUser.email + ' Registration succesful');
                        var signupSuccessMessage = 'Confirmation email has been sent to ' + email + '. ';
                        return done(null, newUser, req.flash('signupSuccess', signupSuccessMessage));
                    });
                }
            });
        }));

	// PASSPORT-FACEBOOK STRATEGY
    passport.use(new FaceBookStrategy({
            clientID: config.facebook.clientID,
            clientSecret: config.facebook.clientSecret,
            callbackURL: config.facebook.callbackURL,
            profileFields: ['emails', 'id', 'displayName', 'name', 'gender', 'age_range'],
			passReqToCallback: true
        },
        function (req, accessToken, refreshToken, profile, done) {

			// is this a new or current user?
    		User.findOne({ 'email': profile.emails[0].value }, function (err, user) {

            	// if error return done method
            	if(err) {
                    // console.log('Error during Facebook: ', err);
                    return done(err);

                } else if (user && !user.facebook_id) { // if the user has already registered

					// all cases must be set to != instead of != because of "types"
					switch (true) {
						case (user.google_id != null):
                            // console.log('Already registered with Google');
                            return done(null, user);
						case (user.twitter_id != null):
                            // console.log('Already registered with Twitter.');
                            return done(null, user);
						case (user.email != null):
                            // console.log('Already registered with email.');
                            return done(null, user);
					}
                } else if (user && user.is_activated === true) {
                    return done(null, user);

                } else {

            		// if no err and no user, create new user
		        // https://developers.facebook.com/docs/graph-api/reference/user
            		var newUser = new User();

            		newUser.email = (profile._json.email || '').toLowerCase();
            	        newUser.facebook_id = profile.id;
		        
                        if (profile.gender === 'male') {
                            newUser.gender = 0;
                        } else if (newUser.gender === 'female') {
                            newUser.gender = 1;
                        }
                        newUser.fname = profile.name.givenName;
            		newUser.lname = profile.name.familyName;
			if ('age_range' in profile._json) {
				newUser.minimum_age = profile._json.age_range.min;
			}

			// create an activation token
					newUser.activation_token = new Buffer(newUser.id + ',' + new Date().getTime()).toString('base64');

					newUser.is_activated = true;
					newUser.activation_status = 0;

					// save the newUser to the database
					newUser.save(function (err) {
						if (err) {
							// console.log('Error while saving user to database.');
							return done(err);
						} else {
							// console.log('User: ' + (newUser.email? newUser.email : newUser.id) + ' Facebook registration successful!');
							var signUpSuccessMessage = 'You successfully registered via Facebook!';
							return done(null, newUser, req.flash('facebookSignupSuccess', signUpSuccessMessage));
						}
                    });
				}
            });
        }
    ));

    // PASSPORT-GOOGLE STRATEGY
	passport.use(new GoogleStrategy({
		clientID: config.google.clientID,
		clientSecret: config.google.clientSecret,
		callbackURL: config.google.callbackURL,
		profileFields: ['emails', 'id', 'displayName', 'name'],
		passReqToCallback: true
	},
	function (req, accessToken, refreshToken, profile, done) {

		// is this a new or current user?
		User.findOne({ 'email': profile.emails[0].value }, function (err, user) {

			// if error return to done method
			if (err) {
				// console.log('Error during Google signup: ', err);
				return done(err);

			} else if (user && !user.google_id) {  // if the user has already been registered

				// all cases must be set to != instead of != because of "types"
                switch (true) {
                    case (user.facebook_id != null):
                        // console.log('Already registered with Facebook');
                        return done(null, user);
                    case (user.twitter_id != null):
                        // console.log('Already registered with Twitter.');
                        return done(null, user);
                    case (user.email != null):
                        // console.log('Already registered with email.');
                        return done(null, user);
                }
			} else if (user && user.is_activated === true) {
                return done(null, user);

            } else {

				// if no err and no user, create new User
				var newUser = new User();

                newUser.email = (profile.emails[0].value || '');
				newUser.google_id = profile.id;
				if (profile.gender !== null) {
					switch(profile.gender) {
						case 'male':
							newUser.gender = 0;
							break;
						case'female':
							newUser.gender = 1;
							break;
						default:
							break;
					}
				}
				newUser.fname = profile.name.givenName;
				newUser.lname = profile.name.familyName;

				newUser.activation_token = new Buffer(newUser.id + ',' + new Date().getTime()).toString('base64');
				newUser.is_activated = true;
				newUser.activation_status = 0;

				// save the user to the database
				newUser.save(function (err) {
					if (err) {
                        // console.log('Error while saving to the database.');
                        return done(err);
					} else {
						// console.log('User: ' + newUser.email ? newUser.email : newUser.id + ' Google registration successful!');
						var signupSuccessfulMessage = 'You successfully registered via Google!';
						return done(null, newUser, req.flash('googleSignupSuccess', signupSuccessfulMessage));
					}

                });
			}
        })
	}));

	// PASSPORT-TWITTER STRATEGY
    passport.use(new TwitterStrategy({
            consumerKey: config.twitter.consumerKey,
            consumerSecret: config.twitter.consumerSecret,
            callbackURL: config.twitter.callbackURL,
			includeEmail: true,
			includeEntities: true,
            passReqToCallback: true
        },
        function (req, token, tokenSecret, profile, done) {

            // is this a new or current user?
            User.findOne({ 'email': profile.emails[0].value }, function (err, user) {

                // if error return to done method
                if (err) {
                    // console.log('Error during Twitter signup: ', err);
                    return done(err);

                } else if (user && !user.twitter_id) {
                    // all cases must be set to != instead of != because of "types"
                    switch (true) {
                        case (user.google_id != null):
                            // console.log('Already registered with Google');
                            return done(null, user);
                        case (user.facebook_id != null):
                            // console.log('Already registered with Facebook.');
                            return done(null, user);
                        case (user.email != null):
                            // console.log('Already registered with email.');
                            return done(null, user);
                    }
				} else if (user && user.is_activated ===true) {  // if the user has already been registered
					 return done(null, user);
                } else {

                    // if no err and no user, create new User
                    var newUser = new User();

                    newUser.email = (profile.emails[0].value || '');
                    newUser.twitter_id = profile.id;

                    newUser.activation_token = new Buffer(newUser.id + ',' + new Date().getTime()).toString('base64');
                    newUser.is_activated = true;
                    newUser.activation_status = 0;

                    // save the user to the database
                    newUser.save(function (err) {
                        if (err) {
                            // console.log('Error while saving to the database.');
                            return done(err);
                        } else {
                            // console.log('User: ' + newUser.email ? newUser.email : newUser.id + ' Google registration successful!');
                            var signupSuccessfulMessage = 'You successfully registered via Twitter!';
                            return done(null, newUser, req.flash('twitterSignupSuccess', signupSuccessfulMessage));
                        }
					});
                }
            })
        }))




    /*
    var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.password);
    };
    // Generates hash using bCrypt

    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };
    */
};
