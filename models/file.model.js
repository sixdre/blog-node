'use strict';
const mongoose = require('mongoose')  
    , Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
    
const FileSchema=new Schema({ 
	filename:String,
    filesize:String,
    filepath:String,
    create_time:{				//时间
    	type:Date,
    	default:Date.now()
    }
})

mongoose.model("File",FileSchema);

