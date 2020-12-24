const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PrizeSchema = new Schema({
    name: {type: String, required: true, max: 100},
    pictureUrl: {type: String, required: true}
});

PrizeSchema.virtual('url').get(function() {
    return '/prize/' + this._id;
});


module.exports = mongoose.model('Prize', PrizeSchema);