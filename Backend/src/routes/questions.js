import express from 'express'
import mongoose from 'mongoose'
import Question from '../models/Question.js'
import Comment from '../models/Comment.js'
import { sanitizeCommentDraft, sanitizeQuestionDraft } from '../services/geminiSanitize.js'

const router = express.Router()

function normalizeTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean)
  return String(tags)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
}

// Create a question (anonymous)
router.post('/', async (req, res) => {
  try {
    const { title, body } = req.body
    const tags = normalizeTags(req.body.tags)

    if (!title || !body) return res.status(400).json({ msg: 'title and body are required' })

    const sanitized = await sanitizeQuestionDraft({ title, body })
    if (String(process.env.GEMINI_DEBUG || '').toLowerCase() === 'true') {
      console.log(`[moderation] question provider=${sanitized.provider} action=${sanitized.action} flagged=${String(sanitized.flagged)} reason=${sanitized.reason || ''}`)
    }
    if (sanitized.action === 'block') {
      return res.status(400).json({ msg: 'Question rejected: please keep it respectful and non-explicit.' })
    }

    const question = await Question.create({ title: sanitized.title, body: sanitized.body, tags })
    return res.status(201).json(question)
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to create question' })
  }
})

// List questions
router.get('/', async (req, res) => {
  try {
    const status = req.query.status
    const tag = req.query.tag

    const filter = {}
    if (status === 'open' || status === 'closed') filter.status = status
    if (tag) filter.tags = tag

    const questions = await Question.find(filter).sort({ createdAt: -1 }).lean()
    return res.json(questions)
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to list questions' })
  }
})

// Get question + comments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ msg: 'Invalid id' })

    const question = await Question.findById(id).lean()
    if (!question) return res.status(404).json({ msg: 'Not found' })

    const comments = await Comment.find({ questionId: id }).sort({ createdAt: 1 }).lean()
    return res.json({ question, comments })
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch question' })
  }
})

// Add mentor comment (anonymous mentor)
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const { body } = req.body
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ msg: 'Invalid id' })
    if (!body) return res.status(400).json({ msg: 'body is required' })

    const exists = await Question.exists({ _id: id })
    if (!exists) return res.status(404).json({ msg: 'Not found' })

    const sanitized = await sanitizeCommentDraft({ body })
    if (String(process.env.GEMINI_DEBUG || '').toLowerCase() === 'true') {
      console.log(`[moderation] comment provider=${sanitized.provider} action=${sanitized.action} flagged=${String(sanitized.flagged)} reason=${sanitized.reason || ''}`)
    }
    if (sanitized.action === 'block') {
      return res.status(400).json({ msg: 'Comment rejected: please keep it respectful and non-explicit.' })
    }

    const comment = await Comment.create({ questionId: id, body: sanitized.body, authorRole: 'mentor' })
    return res.status(201).json(comment)
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to add comment' })
  }
})

// Update status/tags (mentor actions, still anonymous)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ msg: 'Invalid id' })

    const update = {}
    if (req.body.status === 'open' || req.body.status === 'closed') update.status = req.body.status
    if (req.body.tags !== undefined) update.tags = normalizeTags(req.body.tags)

    const question = await Question.findByIdAndUpdate(id, update, { new: true })
    if (!question) return res.status(404).json({ msg: 'Not found' })

    return res.json(question)
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to update question' })
  }
})

// Star a question (anonymous)
router.post('/:id/star', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ msg: 'Invalid id' })

    const question = await Question.findByIdAndUpdate(
      id,
      { $inc: { stars: 1 } },
      { new: true }
    )

    if (!question) return res.status(404).json({ msg: 'Not found' })
    return res.json(question)
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to star question' })
  }
})

// Unstar a question (anonymous)
router.post('/:id/unstar', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ msg: 'Invalid id' })

    const question = await Question.findOneAndUpdate(
      { _id: id, stars: { $gt: 0 } },
      { $inc: { stars: -1 } },
      { new: true }
    )

    if (question) return res.json(question)

    const existing = await Question.findById(id)
    if (!existing) return res.status(404).json({ msg: 'Not found' })
    return res.json(existing)
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to unstar question' })
  }
})

export default router
