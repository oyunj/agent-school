'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

interface Category {
  key: string
  label: string
  count: number
}

export default function HomePage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        setAgents(data.agents)
        setCategories(data.categories)
        setLoading(false)
      })
  }, [])

  const filtered = agents.filter((a) => {
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.vibe.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              A
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Agent School
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                AI 전문가와 1:1 학습
              </p>
            </div>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {agents.length} agents
          </div>
        </div>
      </header>

      {/* Hero */}
      <div
        className="py-12 px-4 text-center"
        style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, var(--background) 100%)' }}
      >
        <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          AI 전문가와 대화하며 배우세요
        </h2>
        <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Engineering, Marketing, Design 등 150개 이상의 전문 AI 에이전트와 1:1 채팅
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-secondary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="에이전트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="sticky top-0 z-10 border-b overflow-x-auto"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-3 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: selectedCategory === 'all' ? '#6366f1' : 'transparent',
                color: selectedCategory === 'all' ? 'white' : 'var(--text-secondary)',
              }}
            >
              전체 ({agents.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: selectedCategory === cat.key ? '#6366f1' : 'transparent',
                  color: selectedCategory === cat.key ? 'white' : 'var(--text-secondary)',
                }}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: '#6366f1',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => router.push(`/chat/${agent.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const bgColor = agent.color.startsWith('#') ? agent.color : `#${agent.color}`

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group animate-fade-in w-full"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = bgColor
        el.style.boxShadow = `0 4px 20px ${bgColor}20`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
      }}
    >
      {/* Emoji + category */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${bgColor}20`, border: `1px solid ${bgColor}40` }}
        >
          {agent.emoji}
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >
          {agent.categoryLabel}
        </span>
      </div>

      {/* Name */}
      <h3 className="font-semibold mb-1 text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
        {agent.name}
      </h3>

      {/* Vibe */}
      {agent.vibe && (
        <p className="text-xs mb-3 italic line-clamp-2" style={{ color: bgColor, opacity: 0.9 }}>
          "{agent.vibe}"
        </p>
      )}

      {/* Description */}
      <p className="text-xs line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {agent.description}
      </p>

      {/* CTA */}
      <div
        className="mt-4 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: bgColor }}
      >
        <span>대화 시작하기</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
