(function(module) {
	"use strict";

	var User = module.parent.require('./user'),
		meta = module.parent.require('./meta'),
		db = module.parent.require('../src/database'),
		passport = module.parent.require('passport'),
  		passportMixCloud = require('passport-mixcloud').OAuth2Strategy,
  		fs = module.parent.require('fs'),
  		path = module.parent.require('path'),
  		nconf = module.parent.require('nconf');

	var constants = Object.freeze({
		'name': "MixCloud",
		'admin': {
			'route': '/plugins/sso-mixcloud',
			'icon': 'fa-headphones'
		}
	});

	var MixCloud = {};

	MixCloud.init = function(app, middleware, controllers, callback) {
		function render(req, res, next) {
			res.render('admin/plugins/sso-mixcloud', {});
		}

		app.get('/admin/plugins/sso-mixcloud', middleware.admin.buildHeader, render);
		app.get('/api/admin/plugins/sso-mixcloud', render);

		callback();
	}

	MixCloud.getStrategy = function(strategies, callback) {
		meta.settings.get('sso-mixcloud', function(err, settings) {
			if (!err && settings['id'] && settings['secret']) {
				passport.use(new passportMixCloud({
					clientID: settings['id'],
					clientSecret: settings['secret'],
					callbackURL: nconf.get('url') + '/auth/mixcloud/callback'
				}, function(accessToken, refreshToken, profile, done) {
                    User.findOrCreate({ MixCloudId: profile.id }, function (err, user) {
                        return done(err, user);
                    });
				}));

                app.get('/auth/mixcloud',
                    passport.authorize('mixcloud'));

                app.get('/auth/mixcloud/callback',
                    passport.authorize('mixcloud', { failureRedirect: '/login' }),
                    function(req, res) {
                        // Successful authentication, redirect home.
                        res.redirect('/');
                    });
			}

			callback(null, strategies);
		});
	};

	MixCloud.login = function(gplusid, handle, email, callback) {
		MixCloud.getUidByMixCloudId(gplusid, function(err, uid) {
			if(err) {
				return callback(err);
			}

			if (uid !== null) {
				// Existing User
				callback(null, {
					uid: uid
				});
			} else {
				// New User
				var success = function(uid) {
					// Save google-specific information to the user
					User.setUserField(uid, 'gplusid', gplusid);
					db.setObjectField('gplusid:uid', gplusid, uid);
					callback(null, {
						uid: uid
					});
				};

				User.getUidByEmail(email, function(err, uid) {
					if(err) {
						return callback(err);
					}

					if (!uid) {
						User.create({username: handle, email: email}, function(err, uid) {
							if(err) {
								return callback(err);
							}

							success(uid);
						});
					} else {
						success(uid); // Existing account -- merge
					}
				});
			}
		});
	};

	MixCloud.getUidByMixCloudId = function(gplusid, callback) {
		db.getObjectField('gplusid:uid', gplusid, function(err, uid) {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
	};

	MixCloud.addMenuItem = function(custom_header, callback) {
		custom_header.authentication.push({
			"route": constants.admin.route,
			"icon": constants.admin.icon,
			"name": constants.name
		});

		callback(null, custom_header);
	}

	module.exports = MixCloud;
}(module));