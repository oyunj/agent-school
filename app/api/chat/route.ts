import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAgentById } from '@/lib/agents'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { agentId, messages, isFirstMessage } = await req.json()

  const agent = getAgentById(agentId)
  if (!agent) {
    return new Response('Agent not found', { status: 404 })
  }

  // Build system prompt: agent's .md content + intro instruction
  const introInstruction = isFirstMessage
    ? `

IMPORTANT: This is the very first message in the conversation. You MUST start by introducing yourself in this exact structure (in Korean unless the user writes in another language):

1. **자기소개**: 당신이 어떤 전문가인지 (역할, 전문 분야)
2. **함께 배울 수 있는 것들**: 이 대화에서 함께 탐구할 수 있는 주제나 기술 3~5가지 (구체적으로)
3. **배우고 나면 할 수 있는 것**: 학습 후 실제로 적용할 수 있는 것들

After the introduction, invite the user to start the conversation with an open question.
Keep the intro warm, engaging, and under 300 words.`
    : ''

  const systemPrompt = agent.content + introInstruction

  const apiMessages = isFirstMessage
    ? [{ role: 'user' as const, content: '안녕하세요! 자기소개 부탁드립니다.' }]
    : messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages,
        })

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = JSON.stringify({ text: event.delta.text }) + '\n'
            controller.enqueue(encoder.encode(chunk))
          }
        }

        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'))
        controller.close()
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: errMsg }) + '\n')
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
