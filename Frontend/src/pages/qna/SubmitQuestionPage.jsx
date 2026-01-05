import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createQuestion } from '../../api.js'
import { getCookie } from '../../utils/cookies.js'

const SubmitQuestionPage = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async e => {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (!trimmedTitle || !trimmedBody) {
      setError('Title and description are required')
      return
    }

    setIsSubmitting(true)
    try {
      const author = getCookie('dk24_username') || 'Anonymous'
      const created = await createQuestion({ title: trimmedTitle, body: trimmedBody, tags, author })
      navigate(`/questions/${created._id}`)
    } catch (err) {
      setError(err?.message || 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1>Ask Anonymously</h1>
      <form className="form" onSubmit={onSubmit}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          aria-label="Title"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Describe your question"
          aria-label="Description"
          rows={6}
        />
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          aria-label="Tags"
        />
        {error ? <div className="error">{error}</div> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  )
}

export default SubmitQuestionPage
