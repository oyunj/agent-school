import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const AGENTS_DIR = path.join(process.cwd(), '..', 'agency-agents')

// Directories to skip (not agent files)
const SKIP_DIRS = new Set(['examples', 'integrations', 'scripts', 'strategy', '.github'])

export interface Agent {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  vibe: string
  category: string
  categoryLabel: string
  filePath: string
  content: string
}

// Normalize color to a valid CSS hex color
function normalizeColor(color: string | undefined): string {
  if (!color) return '#6366f1'
  if (color.startsWith('#')) return color
  // Named colors → map to reasonable hex
  const colorMap: Record<string, string> = {
    red: '#ef4444', green: '#22c55e', blue: '#3b82f6', purple: '#a855f7',
    yellow: '#eab308', orange: '#f97316', pink: '#ec4899', cyan: '#06b6d4',
    teal: '#14b8a6', indigo: '#6366f1', violet: '#8b5cf6', amber: '#f59e0b',
    lime: '#84cc16', emerald: '#10b981', sky: '#0ea5e9', fuchsia: '#d946ef',
    rose: '#f43f5e', slate: '#64748b', gray: '#6b7280', white: '#f8fafc',
  }
  return colorMap[color.toLowerCase()] || '#6366f1'
}

const CATEGORY_LABELS: Record<string, string> = {
  academic: '🎓 Academic',
  design: '🎨 Design',
  engineering: '⚙️ Engineering',
  finance: '💰 Finance',
  'game-development': '🎮 Game Dev',
  marketing: '📣 Marketing',
  'paid-media': '💵 Paid Media',
  product: '📦 Product',
  'project-management': '📋 Project Mgmt',
  sales: '🤝 Sales',
  'spatial-computing': '🥽 Spatial',
  specialized: '🔬 Specialized',
  support: '🛠️ Support',
  testing: '🧪 Testing',
}

function encodeAgentId(relativePath: string): string {
  return Buffer.from(relativePath).toString('base64url')
}

function decodeAgentId(id: string): string {
  return Buffer.from(id, 'base64url').toString('utf-8')
}

export { encodeAgentId, decodeAgentId }

function scanDir(dirPath: string, category: string, agents: Agent[]) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      // Recurse into subdirectories (e.g., game-development/godot)
      scanDir(fullPath, category, agents)
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf-8')
        const { data, content } = matter(fileContent)

        if (!data.name) continue // skip files without proper frontmatter

        const relativePath = path.relative(AGENTS_DIR, fullPath).replace(/\\/g, '/')
        const id = encodeAgentId(relativePath)

        agents.push({
          id,
          name: data.name || entry.name.replace('.md', ''),
          description: data.description || '',
          emoji: data.emoji || '🤖',
          color: normalizeColor(data.color),
          vibe: data.vibe || '',
          category,
          categoryLabel: CATEGORY_LABELS[category] || category,
          filePath: fullPath,
          content: fileContent,
        })
      } catch (e) {
        // skip malformed files
      }
    }
  }
}

export function getAllAgents(): Agent[] {
  const agents: Agent[] = []

  try {
    const entries = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
        const category = entry.name
        const categoryPath = path.join(AGENTS_DIR, category)
        scanDir(categoryPath, category, agents)
      }
    }
  } catch (e) {
    console.error('Error reading agents directory:', e)
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name))
}

export function getAgentById(id: string): Agent | null {
  try {
    const relativePath = decodeAgentId(id)
    const fullPath = path.join(AGENTS_DIR, relativePath)

    if (!fs.existsSync(fullPath)) return null

    const fileContent = fs.readFileSync(fullPath, 'utf-8')
    const { data } = matter(fileContent)

    const parts = relativePath.split('/')
    const category = parts[0]

    return {
      id,
      name: data.name || relativePath,
      description: data.description || '',
      emoji: data.emoji || '🤖',
      color: normalizeColor(data.color),
      vibe: data.vibe || '',
      category,
      categoryLabel: CATEGORY_LABELS[category] || category,
      filePath: fullPath,
      content: fileContent,
    }
  } catch (e) {
    return null
  }
}

export function getCategories(agents: Agent[]): { key: string; label: string; count: number }[] {
  const map = new Map<string, { label: string; count: number }>()

  for (const agent of agents) {
    const existing = map.get(agent.category)
    if (existing) {
      existing.count++
    } else {
      map.set(agent.category, { label: agent.categoryLabel, count: 1 })
    }
  }

  return Array.from(map.entries())
    .map(([key, { label, count }]) => ({ key, label, count }))
    .sort((a, b) => a.key.localeCompare(b.key))
}
