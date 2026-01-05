import mongoose from 'mongoose'

const QuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    }
  },
  { timestamps: true }
)

export default mongoose.model('Question', QuestionSchema)
