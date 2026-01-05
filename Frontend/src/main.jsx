import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import QuestionsPage from './pages/qna/QuestionsPage.jsx'
import SubmitQuestionPage from './pages/qna/SubmitQuestionPage.jsx'
import QuestionDetailPage from './pages/qna/QuestionDetailPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuestionsPage />} />
        <Route path="/submit" element={<SubmitQuestionPage />} />
        <Route path="/questions/:id" element={<QuestionDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
