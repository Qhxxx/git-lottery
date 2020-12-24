const path = require('path');
const async = require('async');

const Prize = require('../models/prize');
const Project = require('../models/project');


exports.index = function(req, res) {   
    async.parallel({
        prize_count: function(callback) {
            Prize.count({}, callback); 
        },
        project_count: function(callback) {
            Project.count({}, callback);
        }
    }, function(err, results) {
        //console.log(results);
        //result{ prize_count: 3, project_count: 1 }
        res.render('index', { title: 'Lottery System Home', error: err, data: results });
    });
};

exports.checkLogin = function(req, res, next) {
    //console.log(req.session);

    const isLogin = req.session ? req.session.login : false;
    if (isLogin) {
        next();
    } else {
        res.redirect('/login');
    }
};

exports.login_get = function(req, res) {
    res.render('login');
};

exports.login_post = function(req, res) {
    const password = req.body.password;
    const username = req.body.username;
    if (username === 'lottery' && password ==='1' && req.session) {
        req.session.login = true;
        console.log('login success');
        res.redirect('/');
    } else {
        res.render('login');
    }
};

exports.logout = function(req, res) {
    if (req.session) {
        req.session.login = undefined;
    }
    res.redirect('/login');
};