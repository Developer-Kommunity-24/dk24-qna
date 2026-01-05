import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addComment, getQuestion, updateQuestion } from '../../api.js'

const QuestionDetailPage = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const load = async () => {
    setError('')
    const res = await getQuestion(id)
    setData(res)
    setTags((res.question.tags || []).join(', '))
  }

  useEffect(() => {
    load().catch(err => setError(err?.message || 'Failed to load'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onAddComment = async e => {
    e.preventDefault()
    const body = comment.trim()
    if (!body) return

    setIsSaving(true)
    try {
      await addComment(id, { body })
      setComment('')
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to comment')
    } finally {
      setIsSaving(false)
    }
  }

  const onToggleStatus = async () => {
    if (!data) return
    const next = data.question.status === 'open' ? 'closed' : 'open'

    setIsSaving(true)
    try {
      await updateQuestion(id, { status: next })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to update status')
    } finally {
      setIsSaving(false)
    }
  }

  const onSaveTags = async e => {
    e.preventDefault()

    setIsSaving(true)
    try {
      await updateQuestion(id, { tags })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to update tags')
    } finally {
      setIsSaving(false)
    }
  }

  if (!data) {
    return (
      <div className="page">
        <Link to="/">Back</Link>
        {error ? <div className="error">{error}</div> : <div>Loading…</div>}
      </div>
    )
  }

  const { question, comments } = data

  return (
    <div className="page">
      <div className="row">
        <Link to="/">Back</Link>
        <button type="button" onClick={onToggleStatus} disabled={isSaving}>
          {question.status === 'open' ? 'Close' : 'Reopen'}
        </button>
      </div>

      <h1>{question.title}</h1>
      <div className="muted">Status: {question.status}</div>
      <p>{question.body}</p>

      <form className="row" onSubmit={onSaveTags}>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          aria-label="Tags"
        />
        <button type="submit" disabled={isSaving}>Save tags</button>
      </form>

      {error ? <div className="error">{error}</div> : null}

      <h2>Mentor Discussion</h2>
      <div className="list">
        {(comments || []).map(c => (
          <div key={c._id} className="card">
            <div className="cardTitle">mentor</div>
            <div>{c.body}</div>
          </div>
        ))}
        {(comments || []).length === 0 ? <div>No comments yet.</div> : null}
      </div>

      <form className="form" onSubmit={onAddComment}>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a mentor comment"
          aria-label="Comment"
          rows={4}
        />
        <button type="submit" disabled={isSaving}>Comment</button>
      </form>
    </div>
  )
}

export default QuestionDetailPage
