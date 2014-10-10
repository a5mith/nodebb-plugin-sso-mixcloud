(function(module) {
    "use strict";

    var user = module.parent.require('./user'),
        meta = module.parent.require('./meta'),
        db = module.parent.require('../src/database'),
        passport = module.parent.require('passport'),
        passportMixcloud = require('passport-mixcloud').Strategy,
        fs = module.parent.require('fs'),
        path = module.parent.require('path'),
        nconf = module.parent.require('nconf');
    var constants = Object.freeze({
        'name': "Mixcloud Login",
        'admin': {
            'route': '/plugins/sso-mixcloud',
            'icon': 'fa-headphones'
        }
    });

    var Mixcloud = {};
    Mixcloud.init = function(app, middleware, controllers, callback) {
        function render(req, res, next) {
            res.render('admin/plugins/sso-mixcloud', {});
        }

        app.get('/admin/plugins/sso-mixcloud', middleware.admin.buildHeader, render);
        app.get('/api/admin/plugins/sso-mixcloud', render);
        callback();
    }

    Mixcloud.getStrategy = function(strategies, callback) {
        meta.settings.get('sso-mixcloud', function(err, settings) {
            if (!err && settings['id'] && settings['secret']) {
                passport.use(new passportMixcloud({
                    clientID: settings['id'],
                    clientSecret: settings['secret'],
                    callbackURL: nconf.get('url') + '/auth/mixcloud/callback'
                }, function(accessToken, refreshToken, profile, done) {
                    console.log(profile);
                    Mixcloud.login(profile.name, profile.username, function(err, user) {
                        if (err) {
                            return done(err);
                        }
                        done(null, user);
                    });
                }));
                strategies.push({
                    name: 'mixcloud',
                    url: '/auth/mixcloud',
                    callbackURL: '/auth/mixcloud/callback',
                    icon: 'fa-headphones'
                });
            }
            callback(null, strategies);
        });
    };
    Mixcloud.login = function(mixcloudid, displayName, avatar, callback) {
        Mixcloud.getUid(mixcloudid, function(err, uid) {
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
                user.create({username: name}, function(err, uid) {
                    if(err) {
                        return callback(err);
                    }
// Save mixcloud-specific information to the user
                    user.setUserField(uid, 'mixcloudid', mixcloudid);
                    db.setObjectField('mixcloudid:uid', mixcloudid, uid);
// Save their photo, if present
                    if (avatar && avatar.length > 0) {
                        var photoUrl = avatar[0].value;
                        photoUrl = path.dirname(photoUrl) + '/' + path.basename(photoUrl, path.extname(photoUrl)).slice(0, -6) + 'bigger' + path.extname(photoUrl);
                        user.setUserField(uid, 'uploadedpicture', photoUrl);
                        user.setUserField(uid, 'picture', photoUrl);
                    }
                    callback(null, {
                        uid: uid
                    });
                });
            }
        });
    };
    Mixcloud.getUid = function(mixcloudid, callback) {
        db.getObjectField('mixcloudid:uid', mixcloudid, function(err, uid) {
            if (err) {
                return callback(err);
            }
            callback(null, uid);
        });
    };
    Mixcloud.addMenuItem = function(custom_header, callback) {
        custom_header.authentication.push({
            "route": constants.admin.route,
            "icon": constants.admin.icon,
            "name": constants.name
        });
        callback(null, custom_header);
    };
    Mix.deleteUserData = function(uid, callback) {
        async.waterfall([
            async.apply(User.getUserField, uid, 'mixcloudid'),
            function(oAuthIdToDelete, next) {
                db.deleteObjectField('mixcloudid:uid', oAuthIdToDelete, next);
            }
        ], function(err) {
            if (err) {
                winston.error('[sso-oauth] Could not remove mixcloud data for uid ' + uid + '. Error: ' + err);
                return callback(err);
            }
            callback();
        });
    };
    module.exports = Mixcloud;
}(module));