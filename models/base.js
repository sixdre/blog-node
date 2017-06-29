'use strict';
const mongoose = require('mongoose')  
    , Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;



//基础Schema
const base = new Schema({
    //创建时间
    create_time: {type: Date, default: Date.now()},
    //更新时间或修改时间
    update_time: {type: Date, default: Date.now() }
});
exports.base = base;