import mongoose from 'mongoose'

const QuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    author: { type: String, default: 'Anonymous' },
    tags: { type: [String], default: [] },
    stars: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    }
  },
  { timestamps: true }
)

export default mongoose.model('Question', QuestionSchema)
