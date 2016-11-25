var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var schema = new Schema({
    name: { type: String,required:true },
    introduction:{ type: String },
    creator: { type: ObjectId,ref:"User",required:true  },
    robotNode: {type: ObjectId,ref:"RobotNode",required:true },
    meta: {
        createAt: {
            type: Date,
            default: Date.now
        },
        updateAt: {
            type: Date,
            default: Date.now
        }
    }
});

module.exports = schema;