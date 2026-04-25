export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { base64, currentPrice, currency = 'USD' } = await request.json()

    if (!base64) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    const priceInfo = currentPrice ? `${currentPrice} ${currency}` : 'non fourni'

    const prompt = `Tu es un analyste financier senior specialise en valorisation d entreprises.
Le prix actuel de l action est : ${priceInfo}

Analyse ce document financier et reponds UNIQUEMENT avec un objet JSON valide.
IMPORTANT: Toutes les valeurs numeriques doivent etre des nombres entiers ou decimaux. Jamais de tiret, jamais de symbole. Utilise 0 si inconnu.

{
  "company": {
    "name": "Nom de l entreprise",
    "ticker": "Ticker",
    "sector": "Secteur",
    "country": "Pays",
    "currency": "EUR",
    "fiscalYear": "2024"
  },
  "financials": {
    "revenue": 1000,
    "revenueGrowth": "+5%",
    "ebitda": 200,
    "ebitdaMargin": "20%",
    "ebit": 150,
    "netIncome": 100,
    "freeCashFlow": 80,
    "totalDebt": 300,
    "cash": 100,
    "netDebt": 200,
    "sharesOutstanding": 50
  },
  "dcfValuation": {
    "wacc": "8%",
    "terminalGrowthRate": "2%",
    "projectedFCF": [
      {"year": "An 1", "fcf": 80, "growthRate": "+5%"},
      {"year": "An 2", "fcf": 84, "growthRate": "+5%"},
      {"year": "An 3", "fcf": 88, "growthRate": "+5%"},
      {"year": "An 4", "fcf": 92, "growthRate": "+5%"},
      {"year": "An 5", "fcf": 97, "growthRate": "+5%"}
    ],
    "terminalValue": 1500,
    "enterpriseValue": 1800,
    "equityValue": 1600,
    "intrinsicValuePerShare": 32,
    "scenarios": {
      "pessimistic": {"intrinsicValue": 25, "upside": "-20%"},
      "base": {"intrinsicValue": 32, "upside": "+10%"},
      "optimistic": {"intrinsicValue": 40, "upside": "+35%"}
    }
  },
  "multiplesValuation": {
    "currentPE": 15,
    "sectorAveragePE": 18,
    "currentEVEBITDA": 9,
    "sectorAverageEVEBITDA": 11,
    "currentPB": 2,
    "currentPS": 1,
    "impliedValueFromPE": 30,
    "impliedValueFromEVEBITDA": 35,
    "averageImpliedValue": 32
  },
  "synthesis": {
    "dcfWeight": "60%",
    "multiplesWeight": "40%",
    "weightedFairValue": 32,
    "currentPrice": 0,
    "upside": "+10%",
    "margin": "15%",
    "signal": "ACHETER",
    "conviction": "MODEREE"
  },
  "executiveSummary": {
    "strengths": ["Force 1", "Force 2", "Force 3"],
    "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
    "opportunities": ["Opportunite 1", "Opportunite 2"],
    "risks": ["Risque 1", "Risque 2", "Risque 3"],
    "investmentThesis": "These detaillee en 4-5 phrases.",
    "keyMetrics": "Metrique 1, Metrique 2, Metrique 3",
    "targetPrice": 30,
    "targetHorizon": "12 mois"
  }
}

Remplace toutes les valeurs par les vraies donnees du document. Reponds UNIQUEMENT avec le JSON.`

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

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Pas de JSON dans la reponse')
    }

    let jsonStr = text.substring(firstBrace, lastBrace + 1)

    // Correction de toutes les valeurs invalides
    jsonStr = jsonStr
      .replace(/:\s*-\s*([,}\]])/g, ': 0$1')
      .replace(/:\s*-\s*\n/g, ': 0\n')
      .replace(/:\s*-$/gm, ': 0')
      .replace(/:\s*undefined/g, ': 0')
      .replace(/:\s*NaN/g, ': 0')

    try {
      const valuation = JSON.parse(jsonStr)
      return NextResponse.json({ valuation, analyzedAt: new Date().toISOString() })
    } catch(parseError) {
      console.error('Parse error, debut JSON:', jsonStr.substring(0, 100))
      throw new Error('JSON invalide - debut: ' + jsonStr.substring(0, 80))
    }

  } catch (e) {
    console.error('Valuation error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}