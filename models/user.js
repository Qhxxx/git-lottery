const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    userID: { type: String, required: true, max: 100 },
    winPrize: [{ type: String }],
    attendProject: [{
        project: { type: Schema.Types.ObjectId, ref: 'Project' },
        times: { type: Number }
    }]
});


module.exports = mongoose.model('User', UserSchema);