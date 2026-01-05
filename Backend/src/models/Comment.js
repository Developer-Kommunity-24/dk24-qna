import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    author: { type: String, default: 'Anonymous' },
    authorRole: { type: String, enum: ['mentor'], default: 'mentor' }
  },
  { timestamps: true }
)

export default mongoose.model('Comment', CommentSchema)
