'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Agent {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  vibe: string
  category: string
  categoryLabel: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.agentId as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [introLoaded, setIntroLoaded] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load agent info
  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        const found = data.agents.find((a: Agent) => a.id === agentId)
        if (found) setAgent(found)
      })
  }, [agentId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  // Load intro message once agent is ready
  useEffect(() => {
    if (agent && !introLoaded) {
      setIntroLoaded(true)
      sendMessage(null, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent])

  const sendMessage = useCallback(
    async (userText: string | null, isFirst = false) => {
      if (streaming) return
      if (!isFirst && !userText?.trim()) return

      const updatedMessages: Message[] = isFirst
        ? []
        : [...messages, { role: 'user', content: userText! }]

      if (!isFirst) {
        setMessages(updatedMessages)
        setInput('')
      }

      setStreaming(true)

      // Add empty assistant message to stream into
      const streamingMessages: Message[] = [
        ...updatedMessages,
        { role: 'assistant', content: '' },
      ]
      setMessages(streamingMessages)

      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            agentId,
            messages: updatedMessages,
            isFirstMessage: isFirst,
          }),
        })

        if (!res.ok || !res.body) {
          throw new Error('Network response error')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line)
              if (data.error) {
                console.error('Stream error:', data.error)
                setMessages((prev) => {
                  const copy = [...prev]
                  const last = copy[copy.length - 1]
                  if (last?.role === 'assistant') {
                    copy[copy.length - 1] = {
                      ...last,
                      content: last.content + '\n\n⚠️ 오류가 발생했습니다: ' + data.error,
                    }
                  }
                  return copy
                })
                break
              }
              if (data.done) break
              if (data.text) {
                setMessages((prev) => {
                  const copy = [...prev]
                  const last = copy[copy.length - 1]
                  if (last?.role === 'assistant') {
                    copy[copy.length - 1] = {
                      ...last,
                      content: last.content + data.text,
                    }
                  }
                  return copy
                })
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('Fetch error:', e)
        }
      } finally {
        setStreaming(false)
      }
    },
    [agentId, messages, streaming]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  const accentColor = agent?.color?.startsWith('#') ? agent.color : `#${agent?.color || '6366f1'}`

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="p-2 rounded-lg transition-colors hover:bg-opacity-80 mr-1"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {agent ? (
          <>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
            >
              {agent.emoji}
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                {agent.name}
              </h1>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {agent.categoryLabel}
              </p>
            </div>
          </>
        ) : (
          <div className="w-32 h-6 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
        )}

        {streaming && (
          <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: accentColor }}>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: accentColor, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span>답변 중</span>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !streaming && (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-5xl mb-4">{agent?.emoji || '🤖'}</div>
              <p>에이전트를 불러오는 중...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
              accentColor={accentColor}
              agentEmoji={agent?.emoji || '🤖'}
            />
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t px-4 py-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex gap-3 items-end"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${agent?.name || 'Agent'}에게 질문하세요... (Enter 전송, Shift+Enter 줄바꿈)`}
            disabled={streaming || !agent}
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none resize-none leading-relaxed"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              minHeight: '48px',
              maxHeight: '160px',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = accentColor
              e.target.style.boxShadow = `0 0 0 2px ${accentColor}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)'
              e.target.style.boxShadow = 'none'
            }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim() || !agent}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0"
            style={{
              background:
                streaming || !input.trim() || !agent
                  ? 'var(--surface-2)'
                  : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              color:
                streaming || !input.trim() || !agent ? 'var(--text-secondary)' : 'white',
              cursor: streaming || !input.trim() || !agent ? 'not-allowed' : 'pointer',
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>

        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          AI가 생성한 내용입니다. 중요한 사항은 반드시 검증하세요.
        </p>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isStreaming,
  accentColor,
  agentEmoji,
}: {
  message: Message
  isStreaming: boolean
  accentColor: string
  agentEmoji: string
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div
          className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
          style={{
            background: `linear-gradient(135deg, ${accentColor}e0, ${accentColor}b0)`,
            color: 'white',
          }}
        >
          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 animate-slide-up">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 mt-1"
        style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
      >
        {agentEmoji}
      </div>
      <div
        className="flex-1 max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        {message.content ? (
          <div className={`prose text-sm ${isStreaming ? 'typing-cursor' : ''}`}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: accentColor, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
