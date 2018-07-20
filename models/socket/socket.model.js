import mongoose from 'mongoose'

const { Schema } = mongoose;

const SocketSchema = new Schema({
    id: {
        type: String,
        unique: true,
        index: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    ip: {
        type: String,
    },
    os: {
        type: String,
        default: '',
    },
    browser: {
        type: String,
        default: '',
    },
    environment: {
        type: String,
        default: '',
    },
    createTime: { type: Date, default: Date.now },
});

const Socket = mongoose.model('Socket', SocketSchema);

export default Socket
