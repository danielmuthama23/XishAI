/**
 * hooks/useAI.js
 * ──────────────
 * RAG-powered chat state management.
 */
import { useState, useCallback } from 'react'
import { api } from '../services/api'

export function useAI() {
  const [messages, setMessages] = useState([
    {
      role:    'assistant',
      content: 'I have access to all active incidents across Kenya. Ask me about severity trends, resource gaps, flood predictions, or area-specific risk.',
    },
  ])
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (question, filters = {}) => {
    if (!question.trim() || loading) return

    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const { answer, source_incident_ids } = await api.ragQuery({
        question,
        ...filters,
      })
      setMessages(prev => [
        ...prev,
        {
          role:    'assistant',
          content: answer,
          sources: source_incident_ids,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠ Could not reach the AI backend. Is the FastAPI server running?' },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const clearHistory = useCallback(() => {
    setMessages([{
      role:    'assistant',
      content: 'History cleared. How can I help?',
    }])
  }, [])

  return { messages, loading, sendMessage, clearHistory }
}
