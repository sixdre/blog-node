'use strict';
import mongoose from 'mongoose'

const Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
    
const FileSchema=new Schema({ 
	filename:String,
    filesize:String,
    filepath:String,
    filetype:String,
    create_time:{				//时间
    	type:Date,
    	default:Date.now()
    }
})

const File = mongoose.model("File",FileSchema);

export default File

