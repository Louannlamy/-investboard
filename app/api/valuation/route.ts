import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { text: pdfText, currentPrice, currency = 'USD' } = await request.json()

    if (!pdfText) return NextResponse.json({ error: 'Texte du document manquant' }, { status: 400 })

    const prompt = `Tu es un analyste financier senior spécialisé en valorisation d'entreprises.
Voici le contenu extrait d'un document financier (rapport annuel, 10-K, document de référence AMF).
Le prix actuel de l'action est : ${currentPrice || 'non fourni'} ${currency}

CONTENU DU DOCUMENT :
${pdfText.substring(0, 15000)}

Analyse ce document et génère une valorisation complète en JSON uniquement (pas de texte avant ou après) :

{
  "company": {
    "name": "Nom de l'entreprise",
    "ticker": "Ticker boursier si mentionné",
    "sector": "Secteur d'activité",
    "country": "Pays",
    "currency": "Devise des états financiers",
    "fiscalYear": "Année fiscale analysée"
  },
  "financials": {
    "revenue": 0,
    "revenueGrowth": "+X%",
    "ebitda": 0,
    "ebitdaMargin": "X%",
    "ebit": 0,
    "netIncome": 0,
    "freeCashFlow": 0,
    "totalDebt": 0,
    "cash": 0,
    "netDebt": 0,
    "sharesOutstanding": 0
  },
  "dcfValuation": {
    "wacc": "X%",
    "terminalGrowthRate": "X%",
    "projectedFCF": [
      {"year": "An 1", "fcf": 0, "growthRate": "X%"},
      {"year": "An 2", "fcf": 0, "growthRate": "X%"},
      {"year": "An 3", "fcf": 0, "growthRate": "X%"},
      {"year": "An 4", "fcf": 0, "growthRate": "X%"},
      {"year": "An 5", "fcf": 0, "growthRate": "X%"}
    ],
    "terminalValue": 0,
    "enterpriseValue": 0,
    "equityValue": 0,
    "intrinsicValuePerShare": 0,
    "scenarios": {
      "pessimistic": {"intrinsicValue": 0, "upside": "X%"},
      "base": {"intrinsicValue": 0, "upside": "X%"},
      "optimistic": {"intrinsicValue": 0, "upside": "X%"}
    }
  },
  "multiplesValuation": {
    "currentPE": 0,
    "sectorAveragePE": 0,
    "currentEVEBITDA": 0,
    "sectorAverageEVEBITDA": 0,
    "currentPB": 0,
    "currentPS": 0,
    "impliedValueFromPE": 0,
    "impliedValueFromEVEBITDA": 0,
    "averageImpliedValue": 0
  },
  "synthesis": {
    "dcfWeight": "60%",
    "multiplesWeight": "40%",
    "weightedFairValue": 0,
    "currentPrice": ${currentPrice || 0},
    "upside": "X%",
    "margin": "X%",
    "signal": "ACHETER ou CONSERVER ou VENDRE",
    "conviction": "FORTE ou MODEREE ou FAIBLE"
  },
  "executiveSummary": {
    "strengths": ["Force 1", "Force 2", "Force 3"],
    "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
    "opportunities": ["Opportunite 1", "Opportunite 2"],
    "risks": ["Risque 1", "Risque 2", "Risque 3"],
    "investmentThesis": "These d'investissement en 4-5 phrases",
    "keyMetrics": "3 metriques cles a surveiller",
    "targetPrice": 0,
    "targetHorizon": "12 mois"
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const firstBrace = responseText.indexOf('{')
    const lastBrace = responseText.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('JSON invalide dans la réponse')
    }
    const clean = responseText.substring(firstBrace, lastBrace + 1)
    const valuation = JSON.parse(clean)

    return NextResponse.json({ valuation, analyzedAt: new Date().toISOString() })
  } catch (e) {
    console.error('Valuation error:', e)
    return NextResponse.json({ error: 'Erreur: ' + (e as Error).message }, { status: 500 })
  }
}