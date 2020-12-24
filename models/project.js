const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    name: { type: String, required: true, max: 100 },
    times: { type: Number, min: 1, max: 10, required: true },
    startTime: { type: Date, required: true },
    finishTime: { type: Date, required: true },
    prizeList: { type: [{ type: Schema.Types.ObjectId, ref: 'Prize' }], required: true },
    numList:[{type:Number}]
    //,attendUser:{ type: [{ type: Schema.Types.ObjectId, ref: 'User' }]}
    //,attendUser: [{user: { type: Schema.Types.ObjectId, ref: 'Project' },winPrize: [{ type: String }]}]
});

ProjectSchema.virtual('uid').get(function () {
    return '/project/' + this._id;
})
ProjectSchema.virtual('url').get(function () {
    return '/project/' + this._id + '/qrcode';
});

ProjectSchema.virtual('sTime').get(function () {
    return moment(this.startTime).format('YYYY-MM-DD');
})

ProjectSchema.virtual('fTime').get(function () {
    return moment(this.finishTime).format('YYYY-MM-DD');
})

module.exports = mongoose.model('Project', ProjectSchema);