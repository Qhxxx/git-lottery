const formidable = require('formidable');
const async = require('async');
const fs = require('fs');

const Prize = require('../models/prize');
const Project = require('../models/project');


exports.prize_list = function(req, res, next) {
    Prize
    .find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_prizes) {
        if (err) { return next(err); }
        res.render('prize_list', { title: 'Prize List', prize_list: list_prizes });
    });
};

exports.prize_detail = function(req, res, next) {
    Prize
    .findById(req.params.id)
    .exec(function(err, result) {
        if (err) { return next(err); }
        if (result==null) {
            const err = new Error('prize is not found');
            err.status = 404;
            return next(err);
        }
        res.render('prize_detail', { title: 'Prize list', prize: result });
    });
};

exports.prize_create_get = function(req, res, next) {
    res.render('prize_form', { title: 'Create Prize' });
};

exports.prize_create_post =  function(req, res, next) {
    const form = formidable({multiple: true});
    //fields所有文本域  files文件域
    form.parse(req, function(err, fields, files) {
        if (err) { return next(err); }
        const prize = new Prize({
            name: fields.name,
            pictureUrl: `/images/${fields.name}.jpg`
        });
        //console.log(fields);
        //console.log(files);
        Prize
        .findOne({ 'name': fields.name })
        .exec(function(err, found_prize) {
            if (err) { return next(err); }
            if (found_prize) {
                res.redirect(found_prize.url);
            } else {
                prize.save(function (err) {
                    if (err) { return next(err); }
                    res.redirect(prize.url);
                });
            }
        });
        /*
        fs.rename(files.picture.path, `./public/images/${fields.name}.jpg`, function(err) {
            if (err) throw err;
        });
        */
        var readStream = fs.createReadStream(files.picture.path);
        var writeStream = fs.createWriteStream(`./public/images/${fields.name}.jpg`);
        readStream.pipe(writeStream);
        readStream.on('end', function () {
            fs.unlinkSync(files.picture.path);
        });
    });
};
    
exports.prize_delete_get = function(req, res, next) {
    async.parallel({//callback
        prize: function(callback) {
            Prize.findById(req.params.id).exec(callback)
        },
        project: function(callback) {
          Project.find({ 'prizeList': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.prize==null) { 
            res.redirect('/prizes');
        }
        res.render('prize_delete', { title: 'Delete Prize', prize: results.prize, projects: results.project } );
    });
};

exports.prize_delete_post = function(req, res, next) {
    async.parallel({
        prize: function(callback) {
          Prize.findById(req.body.prizeid).exec(callback)
        },
        project: function(callback) {
          Project.find({ 'prizeList': req.body.prizeid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.project.length > 0) {
            res.render('prize_delete', { title: 'Delete Prize', prize: results.prize, projects: results.project } );
            return;
        }
        else {
            Prize.findByIdAndRemove(req.body.prizeid, function(err) {
                if (err) { return next(err); }
                fs.unlink(`public/images/${results.prize.name}.jpg`, function(err) {
                    if (err) { return next(err); }
                })
                res.redirect('/prizes');
            })
        }
    });
};