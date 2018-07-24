import mongoose from 'mongoose'

const { Schema } = mongoose;

const ConversationSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    links: [{ 				//会话列表
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation
