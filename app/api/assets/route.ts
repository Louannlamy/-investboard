import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import Anthropic from '@anthropic-ai/sdk'

const redis = Redis.fromEnv()
const anthropic = new Anthropic()

const DEFAULT_ASSETS = [
  { id:'IWDA', symbol:'IWDA.AS', name:'iShares Core MSCI World UCITS', cat:'low', pea:true, peaAlt:null, what:'ETF UCITS — 1 500 entreprises dans 23 pays développés. BlackRock. Frais 0.20%/an.', p10:9.8, p15:10.2, pe:'19.8x', ytd:'+6.1%', maxDD:'-32%', vol:'Faible', sharpe:'0.72', isDefault:true },
  { id:'VWCE', symbol:'VWCE.DE', name:'Vanguard FTSE All-World UCITS', cat:'low', pea:true, peaAlt:null, what:'~3 700 actions mondiales développés + émergents. Vanguard. Frais 0.22%/an.', p10:10.1, p15:null, pe:'18.4x', ytd:'+6.4%', maxDD:'-33%', vol:'Faible', sharpe:'0.74', isDefault:true },
  { id:'ERNS', symbol:'CSH2.PA', name:'Amundi ETF Overnight €STR', cat:'low', pea:true, peaAlt:null, what:'ETF monétaire euros. Frais 0.10%/an.', p10:1.8, p15:1.6, pe:'—', ytd:'+1.4%', maxDD:'-0.5%', vol:'Quasi-nulle', sharpe:'0.95', isDefault:true },
  { id:'AGG', symbol:'AGG', name:'iShares Core US Agg Bond', cat:'low', pea:false, peaAlt:'IEAG', what:'ETF obligataire US. Non éligible PEA.', p10:2.1, p15:2.8, pe:'—', ytd:'+1.2%', maxDD:'-18%', vol:'Très faible', sharpe:'0.45', isDefault:true },
  { id:'SPY', symbol:'SPY', name:'SPDR S&P 500 ETF', cat:'mid', pea:false, peaAlt:'CSP1', what:'Les 500 plus grandes US. Non PEA — équivalent CSP1.', p10:13.2, p15:14.1, pe:'22.4x', ytd:'+8.4%', maxDD:'-34%', vol:'Modérée', sharpe:'0.88', isDefault:true },
  { id:'QQQ', symbol:'QQQ', name:'Invesco NASDAQ-100 ETF', cat:'mid', pea:false, peaAlt:'EQQQ', what:'Top 100 tech US. Non PEA — équivalent EQQQ.', p10:17.8, p15:18.3, pe:'28.1x', ytd:'+10.2%', maxDD:'-38%', vol:'Modérée', sharpe:'0.81', isDefault:true },
  { id:'VIG', symbol:'VIG', name:'Vanguard Dividend Appreciation', cat:'mid', pea:false, peaAlt:'VGWD', what:'Dividendes croissants 10+ ans. Non PEA.', p10:11.4, p15:12.1, pe:'21.3x', ytd:'+7.2%', maxDD:'-28%', vol:'Modérée', sharpe:'0.86', isDefault:true },
  { id:'HLTH', symbol:'IHCL.AS', name:'iShares Healthcare Innovation UCITS', cat:'mid', pea:true, peaAlt:null, what:'ETF santé mondial UCITS. Éligible PEA.', p10:10.4, p15:11.2, pe:'17.8x', ytd:'+4.8%', maxDD:'-26%', vol:'Modérée', sharpe:'0.76', isDefault:true },
  { id:'MSCI', symbol:'MSCI', name:'MSCI Inc.', cat:'mid', pea:false, peaAlt:null, what:'Fournisseur indices boursiers. CTO uniquement.', p10:22.8, p15:null, pe:'37.2x', ytd:'+9.1%', maxDD:'-40%', vol:'Modérée', sharpe:'0.92', isDefault:true },
  { id:'NVDA', symbol:'NVDA', name:'NVIDIA Corporation', cat:'high', pea:false, peaAlt:'SEMI', what:'Leader GPU pour IA. Non PEA — équivalent SEMI.', p10:58.2, p15:44.1, pe:'52.3x', ytd:'+18.4%', maxDD:'-66%', vol:'Très élevée', sharpe:'1.12', isDefault:true },
  { id:'MSFT', symbol:'MSFT', name:'Microsoft Corporation', cat:'high', pea:false, peaAlt:'EQQQ', what:'Azure, Office, IA. Non PEA — équivalent EQQQ.', p10:29.1, p15:23.4, pe:'33.8x', ytd:'+7.8%', maxDD:'-38%', vol:'Élevée', sharpe:'0.98', isDefault:true },
  { id:'ASML', symbol:'ASML.AS', name:'ASML Holding', cat:'high', pea:true, peaAlt:null, what:'Monopole machines EUV. Pays-Bas, éligible PEA.', p10:31.4, p15:28.7, pe:'38.2x', ytd:'+12.4%', maxDD:'-55%', vol:'Élevée', sharpe:'0.88', isDefault:true },
  { id:'NOVO', symbol:'NVO', name:'Novo Nordisk', cat:'high', pea:true, peaAlt:null, what:'N°1 insuline et Ozempic. Danemark, éligible PEA.', p10:25.4, p15:22.8, pe:'24.8x', ytd:'-8.4%', maxDD:'-50%', vol:'Élevée', sharpe:'0.84', isDefault:true },
  { id:'SEMI', symbol:'SEMI.PA', name:'iShares MSCI Global Semiconductors UCITS', cat:'high', pea:true, peaAlt:null, what:'ETF semis UCITS. NVIDIA, TSMC, AMD... Éligible PEA.', p10:26.8, p15:23.1, pe:'28.4x', ytd:'+14.2%', maxDD:'-60%', vol:'Très élevée', sharpe:'0.79', isDefault:true },
  { id:'VWO', symbol:'VDEM.AS', name:'iShares Core MSCI Emerging Markets UCITS', cat:'high', pea:true, peaAlt:null, what:'Marchés émergents UCITS. Éligible PEA.', p10:4.2, p15:5.8, pe:'12.4x', ytd:'+7.1%', maxDD:'-52%', vol:'Élevée', sharpe:'0.41', isDefault:true },
  { id:'LVMH', symbol:'MC.PA', name:'LVMH Moet Hennessy', cat:'high', pea:true, peaAlt:null, what:'N°1 luxe mondial. Paris, éligible PEA.', p10:18.4, p15:19.2, pe:'21.4x', ytd:'+3.2%', maxDD:'-45%', vol:'Élevée', sharpe:'0.74', isDefault:true },
  { id:'IBIT', symbol:'IBIT', name:'iShares Bitcoin Trust ETF', cat:'high', pea:false, peaAlt:null, what:'ETF Bitcoin spot BlackRock. CTO uniquement.', p10:null, p15:null, pe:'—', ytd:'+22.4%', maxDD:'-75%', vol:'Extrême', sharpe:'0.62', isDefault:true },
  { id:'ARKK', symbol:'ARKK', name:'ARK Innovation ETF', cat:'high', pea:false, peaAlt:null, what:'ETF actif Cathie Wood. Sous-performance chronique.', p10:4.1, p15:null, pe:'—', ytd:'-8.2%', maxDD:'-80%', vol:'Extrême', sharpe:'0.24', isDefault:true },
]

async function fetchYahooDetails(symbol: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose || meta.previousClose
    const high52 = meta.fiftyTwoWeekHigh
    const low52 = meta.fiftyTwoWeekLow
    const currency = meta.currency || 'USD'

    // Calcule YTD approximatif
    const quotes = result.indicators?.quote?.[0]
    const closes = quotes?.close?.filter((c: number) => c !== null) || []
    const firstClose = closes[0]
    const ytdPct = firstClose ? ((price - firstClose) / firstClose * 100) : null

    // Calcule Max Drawdown sur 1 an
    let maxDD = null
    if (closes.length > 0) {
      let peak = closes[0]
      let maxDrawdown = 0
      for (const close of closes) {
        if (close > peak) peak = close
        const dd = (close - peak) / peak * 100
        if (dd < maxDrawdown) maxDrawdown = dd
      }
      maxDD = Math.round(maxDrawdown * 10) / 10
    }

    // Calcule volatilité annualisée
    let vol = '—'
    if (closes.length > 20) {
      const returns = closes.slice(1).map((c: number, i: number) => Math.log(c / closes[i]))
      const mean = returns.reduce((a: number, b: number) => a + b, 0) / returns.length
      const variance = returns.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / returns.length
      const annualVol = Math.sqrt(variance * 252) * 100
      if (annualVol < 10) vol = 'Très faible'
      else if (annualVol < 20) vol = 'Faible'
      else if (annualVol < 30) vol = 'Modérée'
      else if (annualVol < 45) vol = 'Élevée'
      else vol = 'Très élevée'
    }

    return {
      price,
      currency,
      high52,
      low52,
      ytdPct: ytdPct ? Math.round(ytdPct * 10) / 10 : null,
      maxDD,
      vol,
      exchange: meta.exchangeName,
      marketCap: meta.marketCap,
      trailingPE: meta.trailingPE,
    }
  } catch (e) {
    console.error('Yahoo details error:', e)
    return null
  }
}

export async function GET() {
  try {
    const customAssets = await redis.get<any[]>('custom_assets') || []
    const allAssets = [...DEFAULT_ASSETS, ...customAssets]
    return NextResponse.json({ assets: allAssets })
  } catch (e) {
    return NextResponse.json({ assets: DEFAULT_ASSETS })
  }
}

export async function POST(request: Request) {
  try {
    const { symbol, name, exchange, type } = await request.json()

    const details = await fetchYahooDetails(symbol)
    if (!details) return NextResponse.json({ error: 'Actif non trouvé' }, { status: 404 })

    const { price, currency, high52, low52, ytdPct, maxDD, vol, marketCap, trailingPE } = details

    const isPEA = ['EUR', 'GBP', 'DKK', 'SEK', 'NOK', 'CHF'].includes(currency) &&
      ['PAR', 'AMS', 'EPA', 'ETR', 'CPH', 'STO', 'VTX', 'LSE', 'FRA'].some(ex =>
        (exchange || '').toUpperCase().includes(ex) ||
        (details.exchange || '').toUpperCase().includes(ex)
      )

    const peFormatted = trailingPE ? `${Math.round(trailingPE * 10) / 10}x` : '—'
    const ytdFormatted = ytdPct !== null ? `${ytdPct >= 0 ? '+' : ''}${ytdPct}%` : '—'
    const maxDDFormatted = maxDD !== null ? `${maxDD}%` : '—'
    const high52Formatted = high52 ? `${Math.round(high52 * 100) / 100} ${currency}` : '—'
    const low52Formatted = low52 ? `${Math.round(low52 * 100) / 100} ${currency}` : '—'

    const aiRes = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Tu es un analyste financier expert. Analyse cet actif boursier avec les vraies données de marché :

Nom: ${name}
Ticker: ${symbol}
Prix actuel: ${price} ${currency}
P/E Ratio: ${peFormatted}
YTD (performance depuis début année): ${ytdFormatted}
Max Drawdown 1 an: ${maxDDFormatted}
Plus haut 52 semaines: ${high52Formatted}
Plus bas 52 semaines: ${low52Formatted}
Volatilité historique: ${vol}
Capitalisation boursière: ${marketCap ? Math.round(marketCap / 1e9) + ' Mds ' + currency : '—'}
Bourse: ${exchange || details.exchange}
Type: ${type}
Eligibilité PEA estimée: ${isPEA ? 'Oui' : 'Non'}

Réponds en JSON uniquement, sans texte avant ou après :
{
  "signal": "buy" ou "hold" ou "sell",
  "cat": "low" ou "mid" ou "high",
  "what": "Description précise de l'actif en 2 phrases",
  "why": "Explication du signal en 3-4 phrases basée sur TOUTES les données fournies (prix, PE, YTD, drawdown, volatilité, capitalisation)"
}`
      }]
    })

    const text = aiRes.content[0].type === 'text' ? aiRes.content[0].text : ''
    const aiData = JSON.parse(text.replace(/```json|```/g, '').trim())

    const newAsset = {
      id: symbol.replace(/[^a-zA-Z0-9]/g, '_'),
      symbol,
      name,
      cat: aiData.cat || 'mid',
      pea: aiData.pea ?? isPEA,
      peaAlt: null,
      what: aiData.what || name,
      p10: null,
      p15: null,
      pe: peFormatted,
      ytd: ytdFormatted,
      maxDD: maxDDFormatted,
      vol,
      sharpe: '—',
      signal: aiData.signal || 'hold',
      why: aiData.why || '',
      isDefault: false,
      addedAt: new Date().toISOString(),
    }

    const existing = await redis.get<any[]>('custom_assets') || []
    const updated = existing.filter((a: any) => a.id !== newAsset.id)
    updated.push(newAsset)
    await redis.set('custom_assets', updated)

    return NextResponse.json({ asset: newAsset, price, currency })
  } catch (e) {
    console.error('Add asset error:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const existing = await redis.get<any[]>('custom_assets') || []
    const updated = existing.filter((a: any) => a.id !== id)
    await redis.set('custom_assets', updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
  }
}