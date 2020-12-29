const async = require('async');
const path = require('path');
const qrcode = require('qrcode');
const fs = require('fs');
const os = require('os');
const request = require('request');
const { body, validationResult, sanitizeBody } = require('express-validator');

const Prize = require('../models/prize');
const Project = require('../models/project');
const User = require('../models/user');

const APPID = '';
const SECRET = '';
const DNS = 'http://szn7va.natappfree.cc';//内网穿透动态改变
var code

exports.project_list = function (req, res, next) {
    Project
        .find()
        .populate('prizeList')
        .exec(function (err, list_projects) {
            if (err) { return next(err); }
            res.render('project_list', { title: 'Project List', project_list: list_projects });
        });
};


exports.project_detail = function (req, res, next) {
    //刷新之后req.query.code应该是没有数据的用全局变量或者session存一下
    if(req.query.code){
        code=req.query.code
    }
    //获取openid的url
    const aimUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${SECRET}&code=${code}&grant_type=authorization_code`

    request.get({ url: aimUrl }, function (err, response) {
        if (err) {
            return console.error('upload failed:', err);
        }
        console.log(response.body)
        let openid = JSON.parse(response.body).openid;
        //用session存一下
        // if (!openid) {
        //     openid = 'oYVts6Qngt1ez8vNTAxRfRZH_0_0'
        // }
        console.log(openid)
        Project
        .findById(req.params.id)
        .populate('prizeList')
        .exec(function (err, result) {
            if (err) { return next(err); }
            if (result == null) {
                const err = new Error('Project is not found');
                err.status = 404;
                return next(err);
            }
            let finalResult = {
                prizeList: result.prizeList,
                prizeBgColors: [],
                borderColor: '#ff9800',
                beginTime: result.startTime,
                endTime: result.finishTime
            }

            for (let i = 0; i < result.prizeList.length; i++) {
                if (i % 2 == 0) {
                    finalResult.prizeBgColors.push('rgb(255, 231, 149)');
                } else {
                    finalResult.prizeBgColors.push('rgb(255, 247, 223)');
                }
            }
            //获取session.usernumber找到当前参与的用户，获取其抽奖次数
            User.findOne({ 'userID': openid }).exec(function (err, found_user) {
                if (err) { return next(err); }
                if (found_user) {
                    var tmp=true;
                    req.session.useropenid = openid;
                    for (var i = 0; i < found_user.attendProject.length; i++) {
                        if (found_user.attendProject[i].project == req.params.id) {
                            tmp = false;
                            break;
                        }
                    }
                    if (tmp) {
                        var temp = { project: req.params.id, times: result.times };
                        found_user.attendProject.push(temp);
                        found_user.save(function (err, result) {
                            if (err) {
                                return next(err);
                            }
                        });
                    }
                    for (var i = 0; i < found_user.attendProject.length; i++) {
                        if (found_user.attendProject[i].project == req.params.id) {
                            var info = { times: found_user.attendProject[i].times, user: req.session.useropenid, project: req.params.id }
                            res.render('lottery', { title: result.name, pplist: finalResult, info: info });

                        }
                    }
                } else {
                    req.session.useropenid = openid;
                    const newUser = new User({
                        userID: openid,
                        winPrize: [],
                        attendProject: [{ project: req.params.id, times: result.times }]
                    })

                    newUser.save(function (err) {
                        if (err) { console.log(err); }
                    });
                    var info = { times: result.times,user: req.session.useropenid, project: req.params.id }
                    res.render('lottery', { title: result.name, pplist: finalResult, info: info });
                }
            });

        });


    })


    
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
            var win = { index: indexupdate, times: timesupdate , winPrizes:found_user.winPrize}//返回中奖位置、剩余次数、该用户中奖列表
            res.send(win)
        });
    })

};


//内网穿透时要更改
exports.project_qrcode = function (req, res, next) {
    //const net = os.networkInterfaces().WLAN;
    //const ip = net[net.length - 1].address;
    const URL = DNS + `/project/${req.params.id}`
    //const URL = 'www.baidu.com'
    const qrcodePath = path.join(__dirname, `../public/qrcode/${req.params.id}.jpg`);
    const wechaturl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=${URL}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`
    console.log(wechaturl)
    async.series(
        qrcode.toFile(qrcodePath, wechaturl),
        res.render('qrcode', { title: 'Project QRCode', path: `/qrcode/${req.params.id}.jpg` })
    );
};

exports.project_create_get = function (req, res, next) {
    Prize
        .find()
        .exec(function (err, result) {
            if (err) { return next(err); }
            pro = false;
            res.render('project_form', { title: 'Create Project', prizes: result, project: pro });
        });
};

exports.project_create_post = [
    function (req, res, next) {
        if (!(req.body.prizeList instanceof Array)) {
            if (typeof req.body.prizeList === 'undefined') {
                req.body.prizeList = [];
            } else {
                req.body.prizeList = new Array(req.body.prizeList);
            }
        }
        if (!(req.body.numslist instanceof Array)) {
            if (typeof req.body.numslist === 'undefined') {
                req.body.numslist = [];
            } else {
                req.body.numslist = new Array(req.body.numslist);
            }
        }
        next();
    },

    body('name', 'Name must not be empty.').isLength({ min: 1 }).trim(),
    body('times', 'Times must be between 1 and 10.').isNumeric({ min: 1, max: 10 }).trim(),
    body('startTime', 'Invalid start time.').optional({ checkFalsy: true }).isISO8601(),
    body('finishTime', 'Invalid finish time').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('name').trim().escape(),
    sanitizeBody('startTime').toDate(),
    sanitizeBody('finishTime').toDate(),
    sanitizeBody('prizeList.*').escape(),
    sanitizeBody('numslist.*').escape(),

    function (req, res, next) {
        const errors = validationResult(req);
        /*
                var numslist = [];
                for (let i = 0; i < req.body.numslist.length; i++) {
                    if (req.body.numslist[i] != '') {
                        numslist.push(parseInt(req.body.numslist[i]))
                    }
                }*/

        const project = new Project({
            name: req.body.name,
            times: req.body.times,
            startTime: req.body.startTime,
            finishTime: req.body.finishTime,
            prizeList: req.body.prizeList,
            numList: req.body.numslist
        });
        if (!errors.isEmpty()) {
            Prize
                .find()
                .exec(function (err, result) {
                    if (err) { return next(err); }
                    for (let i = 0; i < result.length; i++) {
                        if (project.prizeList.indexOf(result[i]._id) > -1) {
                            result[i].checked = 'true';
                        }
                    }
                    res.render('project_form', { title: 'Create Project', prizes: result, project: project, errors: errors.array() });
                });
        } else {
            project.save(function (err) {
                if (err) { return next(err); }
                res.redirect(project.url);
            });
        }
    }
];

exports.project_update_get = function (req, res, next) {
    async.parallel({
        project: function (callback) {
            Project.findById(req.params.id).populate('prizeList').exec(callback);
        },
        prizes: function (callback) {
            Prize.find(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.project == null) {
            var err = new Error('Project not found');
            err.status = 404;
            return next(err);
        }
        for (var i = 0; i < results.prizes.length; i++) {
            for (var j = 0; j < results.project.prizeList.length; j++) {
                if (results.prizes[i]._id.toString() == results.project.prizeList[j]._id.toString()) {
                    results.prizes[i].checked = 'true';
                }
            }
        }
        res.render('project_form', { title: 'Update Project', prizes: results.prizes, project: results.project });
    });
};

exports.project_update_post = [
    function (req, res, next) {
        if (!(req.body.prizeList instanceof Array)) {
            if (typeof req.body.prizeList === 'undefined') {
                req.body.prizeList = [];
            } else {
                req.body.prizeList = new Array(req.body.prizeList);
            }
        }
        if (!(req.body.numslist instanceof Array)) {
            if (typeof req.body.numslist === 'undefined') {
                req.body.numslist = [];
            } else {
                req.body.numslist = new Array(req.body.numslist);
            }
        }
        next();
    },

    body('name', 'Name must not be empty.').isLength({ min: 1 }).trim(),
    body('times', 'Times must be between 1 and 10.').isNumeric({ min: 1, max: 10 }).trim(),
    body('startTime', 'Invalid start time.').optional({ checkFalsy: true }).isISO8601(),
    body('finishTime', 'Invalid finish time').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('name').trim().escape(),
    sanitizeBody('startTime').toDate(),
    sanitizeBody('finishTime').toDate(),
    sanitizeBody('prizeList.*').escape(),
    sanitizeBody('numList.*').escape(),

    function (req, res, next) {
        const errors = validationResult(req);
        /*
                var numslist = [];
                for (let i = 0; i < req.body.numslist.length; i++) {
                    if (req.body.numslist[i] != '') {
                        numslist.push(parseInt(req.body.numslist[i]))
                    }
                }*/

        const project = new Project({
            name: req.body.name,
            times: req.body.times,
            startTime: req.body.startTime,
            finishTime: req.body.finishTime,
            prizeList: (typeof req.body.prizeList === 'undefined') ? [] : req.body.prizeList,
            numList: req.body.numslist,
            _id: req.params.id
        });
        if (!errors.isEmpty()) {
            Prize
                .find()
                .exec(function (err, result) {
                    if (err) { return next(err); }
                    for (let i = 0; i < result.length; i++) {
                        if (project.prizeList.indexOf(result[i]._id) > -1) {
                            result[i].checked = 'true';
                        }
                    }
                    res.render('project_form', { title: 'Create Project', prizes: result, project: project, errors: errors.array() });
                });
        } else {
            Project.findByIdAndUpdate(req.params.id, project, {}, function (err, theproject) {
                if (err) { return next(err); }
                res.redirect('/projects');
            });
        }
    }
];

exports.project_delete_get = function (req, res, next) {
    Project
        .findById(req.params.id)
        .exec(function (err, result) {
            if (err) { return next(err); }
            if (result == null) {
                res.redirect('/projects');
            }
            res.render('project_delete', { title: 'Delete Project', project: result });
        });
};



exports.project_delete_post = function (req, res, next) {
    Project.findByIdAndRemove(req.body.projectid, function (err) {
        if (err) { return next(err); }
        fs.unlink(`public/qrcode/${req.body.projectid}.jpg`, function (err) {
            if (err) { return next(err); }
        });
        res.redirect('/projects');
    });
};
