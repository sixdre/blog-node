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
    content: {
        type: String,
        default: '',
    },
    createTime: { type: Date, default: Date.now, index: true },
});

const Message = mongoose.model('Message', MessageSchema);

export default Message
