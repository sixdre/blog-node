import mongoose from 'mongoose'

const { Schema } = mongoose;

const GroupSchema = new Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        match: /^([0-9a-zA-Z]{1,2}|[\u4e00-\u9eff]){1,8}$/,
        index: true,
    },
    avatar: {
        type: String,
    },
    announcement: {
        type: String,
        default: '',
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    createTime: { type: Date, default: Date.now, index: true },
});

const Group = mongoose.model('Group', GroupSchema);

Group.findOne((err, data) => {
    if (!data) {
        Group.create({
            name: 'random',
            announcement: '欢迎光临random, 这是一个开源/自由的聊天室',
            isDefault: true,
        });
    }
})

export default Group
