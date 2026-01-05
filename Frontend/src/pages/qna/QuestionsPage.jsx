import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listQuestions } from '../../api.js'

const QuestionsPage = () => {
  const [status, setStatus] = useState('open')
  const [query, setQuery] = useState('')
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setError('')
      try {
        const data = await listQuestions({ status })
        if (!cancelled) setQuestions(data)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [status])

  const normalizedQuery = query.trim().toLowerCase()
  const visibleQuestions =
    status === 'closed' && normalizedQuery
      ? questions.filter(q => {
          const haystack = `${q.title || ''}\n${q.body || ''}\n${(q.tags || []).join(', ')}`.toLowerCase()
          return haystack.includes(normalizedQuery)
        })
      : questions

  return (
    <div className="page">
      <div className="row">
        <h1>Questions</h1>
        <Link className="linkBtn" to="/submit">New</Link>
      </div>

      <div className="row">
        <button type="button" onClick={() => setStatus('open')} disabled={status === 'open'}>
          Open
        </button>
        <button type="button" onClick={() => setStatus('closed')} disabled={status === 'closed'}>
          Closed
        </button>
      </div>

      {status === 'closed' ? (
        <div className="row">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search closed questions"
            aria-label="Search closed questions"
          />
        </div>
      ) : null}

      {error ? <div className="error">{error}</div> : null}

      <div className="list">
        {visibleQuestions.map(q => (
          <Link key={q._id} className="card" to={`/questions/${q._id}`}>
            <div className="cardTitle">[{q.status}] {q.title}</div>
            <div className="tags">{(q.tags || []).join(', ')}</div>
          </Link>
        ))}
        {visibleQuestions.length === 0 && !error ? <div>No questions yet.</div> : null}
      </div>
    </div>
  )
}

export default QuestionsPage
