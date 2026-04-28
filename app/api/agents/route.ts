import { NextResponse } from 'next/server'
import { getAllAgents, getCategories } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function GET() {
  const agents = getAllAgents()
  const categories = getCategories(agents)

  // Don't send full content in list view
  const agentList = agents.map(({ content: _content, filePath: _fp, ...rest }) => rest)

  return NextResponse.json({ agents: agentList, categories })
}
