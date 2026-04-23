import { NextResponse } from 'next/server'

const RSS_FEEDS = [
  'https://feeds.reuters.com/reuters/businessNews',
  'https://feeds.reuters.com/reuters/technologyNews',
  'https://www.lesechos.fr/rss/rss_une.xml',
  'https://www.boursorama.com/rss/actualites/',
]

async function parseRSS(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 }
    })
    const text = await res.text()
    const items: any[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1]
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || ''
      const link = item.match(/<link>(.*?)<\/link>|<link\s+href="(.*?)"/)?.[1] || ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      if (title) {
        items.push({
          title: title.replace(/<[^>]*>/g, '').trim(),
          description: description.replace(/<[^>]*>/g, '').substring(0, 200).trim(),
          url: link.trim(),
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source: new URL(url).hostname.replace('www.', '').replace('feeds.', '')
        })
      }
    }
    return items.slice(0, 5)
  } catch (e) {
    console.error(`RSS fetch error for ${url}:`, e)
    return []
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(parseRSS))
    const articles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value)
      .filter(a => a.title)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20)

    return NextResponse.json({
      articles,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('News fetch error:', e)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}