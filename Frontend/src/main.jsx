import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import QuestionsPage from './pages/qna/QuestionsPage.jsx'
import SubmitQuestionPage from './pages/qna/SubmitQuestionPage.jsx'
import QuestionDetailPage from './pages/qna/QuestionDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { RequireAuth } from './components/RequireAuth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <QuestionsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/submit"
          element={
            <RequireAuth>
              <SubmitQuestionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/questions/:id"
          element={
            <RequireAuth>
              <QuestionDetailPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
