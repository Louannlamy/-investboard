export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { base64, currentPrice, currency = 'USD' } = await request.json()
// Limite la taille du base64 pour éviter de dépasser les limites
const maxBase64Length = 2 * 1024 * 1024 // ~1.5MB de PDF
const truncatedBase64 = base64.length > maxBase64Length 
  ? base64.substring(0, maxBase64Length) 
  : base64
    if (!base64) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    const prompt = `Tu es un analyste financier senior. Le prix actuel de l'action est : ${currentPrice || 'non fourni'} ${currency}

Analyse ce document financier et génère une valorisation complète en JSON uniquement :

{
  "company": { "name": "", "ticker": "", "sector": "", "country": "", "currency": "", "fiscalYear": "" },
  "financials": { "revenue": 0, "revenueGrowth": "+X%", "ebitda": 0, "ebitdaMargin": "X%", "ebit": 0, "netIncome": 0, "freeCashFlow": 0, "totalDebt": 0, "cash": 0, "netDebt": 0, "sharesOutstanding": 0 },
  "dcfValuation": {
    "wacc": "X%", "terminalGrowthRate": "X%",
    "projectedFCF": [
      {"year": "An 1", "fcf": 0, "growthRate": "X%"},
      {"year": "An 2", "fcf": 0, "growthRate": "X%"},
      {"year": "An 3", "fcf": 0, "growthRate": "X%"},
      {"year": "An 4", "fcf": 0, "growthRate": "X%"},
      {"year": "An 5", "fcf": 0, "growthRate": "X%"}
    ],
    "terminalValue": 0, "enterpriseValue": 0, "equityValue": 0, "intrinsicValuePerShare": 0,
    "scenarios": {
      "pessimistic": {"intrinsicValue": 0, "upside": "X%"},
      "base": {"intrinsicValue": 0, "upside": "X%"},
      "optimistic": {"intrinsicValue": 0, "upside": "X%"}
    }
  },
  "multiplesValuation": { "currentPE": 0, "sectorAveragePE": 0, "currentEVEBITDA": 0, "sectorAverageEVEBITDA": 0, "currentPB": 0, "currentPS": 0, "impliedValueFromPE": 0, "impliedValueFromEVEBITDA": 0, "averageImpliedValue": 0 },
  "synthesis": { "dcfWeight": "60%", "multiplesWeight": "40%", "weightedFairValue": 0, "currentPrice": 0, "upside": "X%", "margin": "X%", "signal": "ACHETER ou CONSERVER ou VENDRE", "conviction": "FORTE ou MODEREE ou FAIBLE" },
  "executiveSummary": {
    "strengths": ["Force 1", "Force 2", "Force 3"],
    "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
    "opportunities": ["Opportunite 1", "Opportunite 2"],
    "risks": ["Risque 1", "Risque 2", "Risque 3"],
    "investmentThesis": "These en 4-5 phrases",
    "keyMetrics": "3 metriques cles",
    "targetPrice": 0,
    "targetHorizon": "12 mois"
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          } as any,
          { type: 'text', text: prompt }
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) throw new Error('JSON invalide')
  let jsonStr = text.substring(firstBrace, lastBrace + 1)
// Corrige les valeurs négatives mal formatées
jsonStr = jsonStr.replace(/:\s*-\s*,/g, ': 0,')
jsonStr = jsonStr.replace(/:\s*-\s*}/g, ': 0}')
jsonStr = jsonStr.replace(/:\s*-\s*\n/g, ': 0\n')
const valuation = JSON.parse(jsonStr)

    return NextResponse.json({ valuation, analyzedAt: new Date().toISOString() })
  } catch (e) {
    console.error('Valuation error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}