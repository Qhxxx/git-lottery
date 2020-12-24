const path = require('path');
const async = require('async');

const User = require('../models/user');
const Project = require('../models/project');
var projectid;
var projectTimes;

exports.checkLogin = function (req, res, next) {
    //console.log(req.session);
    projectid = req.params.id;
    const isLogin = req.session ? req.session.userlogin : false;
    if (isLogin) {
        next();
    } else {
        res.redirect('/project/' + projectid + '/login');
    }
};

exports.login_get = function (req, res) {
    projectid = req.params.id;
    Project.findById(projectid).exec(function (err, result) {
        if (err) { return next(err); }
        if (result == null) {
            console.log("project not found" + projectid);
        }
        projectTimes = result.times;
    })
    res.render('user_login');
};

//获取id 查看数据库是否有该人 该人是否参加了该项抽奖
exports.login_post = function (req, res) {
    const userid = req.body.userID;

    User.findOne({ 'userID': userid }).exec(function (err, found_user) {
        if (err) { return next(err); }
        if (found_user) {
            req.session.userlogin = true;
            req.session.usernumber = userid;//check login
            var tmp = true;
            for (var i = 0; i < found_user.attendProject.length; i++) {
                if (found_user.attendProject[i].project == projectid) {
                    tmp = false;
                    break;
                }
            }
            if (tmp) {
                var temp = { project: projectid, times: projectTimes };
                found_user.attendProject.push(temp);
                found_user.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                });
            }
            res.redirect('/project/' + projectid);
        } else {
            req.session.usernumber = userid;
            req.session.userlogin = true;
            const newUser = new User({
                userID: userid,
                winPrize: [],
                attendProject: [{ project: projectid, times: projectTimes }]
            })

            newUser.save(function (err) {
                if (err) { console.log(err); }
                res.redirect('/project/' + projectid);
            });
        }
    })

};

exports.logout = function (req, res) {
    if (req.session) {
        req.session.userlogin = undefined;
        req.session.userID = undefined;
    }
    res.redirect('/project/' + projectid + '/login');
};

exports.user_update = function (req, res, next) {
    //console.log(req.body.pro)
    //console.log(req.body.user)

    var attpro = req.body.pro;
    var attuser = req.body.user;

    Project.findById(attpro).populate('prizeList').exec(function (err, result) {
        if (err) { return }
        User.findOne({ 'userID': attuser }).exec(function (err, found_user) {
            if (err) { return }

            var total = 0;
            for (var i = 0; i < result.prizeList.length; i++) {
                console.log(result.numList[i])
                total += result.numList[i];//包括谢谢参与的个数
            }

            var winpri = "";
            var onemore = true;
            var indexupdate = 0;
            var timesupdate = 0;

            if (total <= 0) return;//最好不要出线抽完的情况

            while (onemore) {

                rand = 1 + Math.floor(Math.random() * total);//1~total
                console.log(rand);
                var area = 0;

                for (var i = 0; i < result.prizeList.length; i++) {
                    area += result.numList[i];//包括谢谢参与的个数
                    if (rand - area <= 0) {
                        winpri = result.prizeList[i].name;
                        console.log(winpri)
                        indexupdate = i;
                        result.numList[i]--;
                        if (result.prizeList[i].name != '谢谢参与') {

                            var winstring = result.prizeList[i].name
                            found_user.winPrize.push(winstring);
                        }
                        //没存回去
                        //result
                        console.log(result._id)
                        Project.findByIdAndUpdate(result._id, result, {}, function (err, theproject) {
                            if (err) { return next(err); }
                        });
/*
                        result.save(function (err, res) {
                            console.log("11")
                            if (err) {
                                console.log(err)
                            }
                
                        });*/
                        onemore = false;
                        break;
                    }
                }
            }
            //减抽奖次数
            for (var i = 0; i < found_user.attendProject.length; i++) {
                if (found_user.attendProject[i].project == attpro) {
                    found_user.attendProject[i].times--;
                    timesupdate = found_user.attendProject[i].times;
                    break;
                }
            }
            found_user.save(function (err, result) {
                if (err) {
                    return;
                }
            });
            var win = { index: indexupdate, times: timesupdate }//返回中奖奖品和剩余次数
            res.send(win)
        });
    })

};