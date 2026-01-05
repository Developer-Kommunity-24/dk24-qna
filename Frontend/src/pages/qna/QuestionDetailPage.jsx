import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addComment, deleteQuestion, getQuestion, starQuestion, unstarQuestion, updateQuestion } from '../../api.js'
import { hasStarredQuestion, markQuestionStarred, unmarkQuestionStarred } from '../../utils/stars.js'
import { getCookie } from '../../utils/cookies.js'

const QuestionDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasStarred, setHasStarred] = useState(() => hasStarredQuestion(id))
  const currentUser = getCookie('dk24_username')

  const load = async () => {
    setError('')
    const res = await getQuestion(id)
    setData(res)
    setTags((res.question.tags || []).join(', '))
  }

  useEffect(() => {
    setHasStarred(hasStarredQuestion(id))
    load().catch(err => setError(err?.message || 'Failed to load'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onAddComment = async e => {
    e.preventDefault()
    const body = comment.trim()
    if (!body) return

    setIsSaving(true)
    try {
      await addComment(id, { body, author: currentUser })
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
      await updateQuestion(id, { status: next, author: currentUser })
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
      await updateQuestion(id, { tags, author: currentUser })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to update tags')
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    setIsSaving(true)
    try {
      await deleteQuestion(id, { author: currentUser })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Failed to delete')
      setIsSaving(false)
    }
  }

  const onToggleStar = async () => {
    setIsSaving(true)
    try {
      const isStarred = hasStarredQuestion(id)
      if (isStarred) {
        await unstarQuestion(id)
        unmarkQuestionStarred(id)
        setHasStarred(false)
      } else {
        await starQuestion(id)
        markQuestionStarred(id)
        setHasStarred(true)
      }
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to star')
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
  const isAuthor = currentUser && (question.author === currentUser)

  return (
    <div className="page">
      <div className="row">
        <Link to="/">Back</Link>
        <button type="button" onClick={onToggleStar} disabled={isSaving}>
          {hasStarred ? 'Unstar' : 'Star'} ({question.stars || 0})
        </button>
        {isAuthor && (
          <>
            <button type="button" onClick={onToggleStatus} disabled={isSaving}>
              {question.status === 'open' ? 'Close' : 'Reopen'}
            </button>
            <button type="button" onClick={onDelete} disabled={isSaving} style={{ backgroundColor: '#ff4444' }}>
              Delete
            </button>
          </>
        )}
      </div>

      <h1>{question.title}</h1>
      <div className="muted">
        Status: {question.status} • Author: {question.author || 'Anonymous'}
      </div>
      <p>{question.body}</p>

      {isAuthor && (
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
      )}

      {error ? <div className="error">{error}</div> : null}

      <h2>Discussion</h2>
      <div className="list">
        {(comments || []).map(c => (
          <div key={c._id} className="card">
            <div className="cardTitle">{c.author || 'Mentor'}</div>
            <div>{c.body}</div>
          </div>
        ))}
        {(comments || []).length === 0 ? <div>No comments yet.</div> : null}
      </div>

      <form className="form" onSubmit={onAddComment}>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a comment"
          aria-label="Comment"
          rows={4}
        />
        <button type="submit" disabled={isSaving}>Comment</button>
      </form>
    </div>
  )
}

export default QuestionDetailPage
