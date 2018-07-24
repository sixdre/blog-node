import mongoose from 'mongoose'

const { Schema } = mongoose;

const MessageSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    to: {
        type: String,
        index: true,
    },
    type: {
        type: String,
        enum: ['Text', 'Image', 'Code','File'],
        default: 'Text',
    },
    readStatus:{
        type:Number,
        default:0    //0 未读 1 已读
    },
    content: {
        type: String,
        default: '',
    },
    createTime: { type: Date, default: Date.now, index: true },
});

const Message = mongoose.model('Message', MessageSchema);

export default Message
