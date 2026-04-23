import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { prices, news, portfolio } = await request.json()

    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    const newsContext = news?.articles
      ?.slice(0, 8)
      .map((a: any) => `- ${a.title} (${a.source})`)
      .join('\n') || 'Pas de news disponibles'

    const pricesContext = Object.entries(prices || {})
      .map(([id, p]: any) => {
        const pct = p.changePercent >= 0 ? '+' : ''
        return `${id}: ${p.price}EUR (${pct}${p.changePercent?.toFixed(2)}% aujourd'hui)`
      })
      .join('\n')

    const portfolioContext = portfolio?.length > 0
      ? portfolio.map((p: any) => `${p.assetId}: ${p.qty} parts achetees a ${p.buyPrice}EUR`).join('\n')
      : 'Pas de portfolio defini'

    const prompt = [
      `Tu es un analyste financier personnel bienveillant pour un investisseur francais avec un PEA.`,
      `Nous sommes le ${today}.`,
      ``,
      `COURS EN TEMPS REEL AUJOURD'HUI :`,
      pricesContext,
      ``,
      `NEWS FINANCIERES DU JOUR :`,
      newsContext,
      ``,
      `PORTFOLIO DE L'UTILISATEUR :`,
      portfolioContext,
      ``,
      `Sur la base de ces donnees REELLES d'aujourd'hui, genere une analyse complete en JSON uniquement`,
      `(pas de texte avant/apres, juste le JSON) :`,
      ``,
      `{`,
      `  "sentiment": "haussier ou baissier ou neutre",`,
      `  "sentimentScore": 0,`,
      `  "summary": "Resume du marche aujourd'hui en 2-3 phrases basé sur les vraies news",`,
      `  "keyEvents": ["evenement 1 du jour", "evenement 2", "evenement 3"],`,
      `  "assetSignals": {`,
      `    "IWDA": {"signal": "buy", "reason": "raison basee sur donnees reelles"},`,
      `    "VWCE": {"signal": "buy", "reason": "..."},`,
      `    "SPY": {"signal": "buy", "reason": "..."},`,
      `    "QQQ": {"signal": "buy", "reason": "..."},`,
      `    "NVDA": {"signal": "hold", "reason": "..."},`,
      `    "MSFT": {"signal": "buy", "reason": "..."},`,
      `    "ASML": {"signal": "buy", "reason": "..."},`,
      `    "NOVO": {"signal": "buy", "reason": "..."},`,
      `    "LVMH": {"signal": "buy", "reason": "..."},`,
      `    "SEMI": {"signal": "buy", "reason": "..."}`,
      `  },`,
      `  "portfolioAnalysis": "Analyse personnalisee du portfolio en 3-4 phrases",`,
      `  "recommendations": [`,
      `    {"type": "buy", "asset": "nom", "reason": "raison precise"}`,
      `  ],`,
      `  "macroOutlook": "Perspective macro en 2 phrases"`,
      `}`,
    ].join('\n')

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const analysis = JSON.parse(clean)

    return NextResponse.json({
      analysis,
      generatedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Analysis error:', e)
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
