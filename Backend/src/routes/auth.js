import express from 'express'
import { generateCreativeUsername } from '../services/geminiSanitize.js'

const router = express.Router()

router.get('/generate-username', async (req, res) => {
  try {
    const username = await generateCreativeUsername()
    res.json({ username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Failed to generate username' })
  }
})

export default router
