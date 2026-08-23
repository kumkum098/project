'use client';

import React, { useState } from 'react';
import { z } from 'zod';

const AnalysisResultSchema = z.object({
  fairPriceRange: z.object({ min: z.number(), max: z.number() }),
  priceVerdict: z.enum(['underpriced', 'fair', 'overpriced']),
  fraudRiskScore: z.number().min(0).max(100),
  fraudIndicators: z.array(z.string()),
  recommendations: z.array(z.string()),
  marketDemand: z.enum(['low', 'medium', 'high']),
  summary: z.string(),
});

type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

interface TicketAnalysisProps {
  ticketData: {
    title: string;
    description: string;
    price: number;
    category: string;
    venue: string;
    eventDate: string;
  };
}

export default function TicketAnalysis({ ticketData }: TicketAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to analyze ticket');
      }

      // Validate the response data
      const parsed = AnalysisResultSchema.safeParse(json.data);
      if (!parsed.success) {
        throw new Error('Received invalid format from AI');
      }

      setResult(parsed.data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'underpriced') return 'text-yellow-600 bg-yellow-100';
    if (verdict === 'fair') return 'text-green-600 bg-green-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">AI Ticket Advisor</h3>
        <button
          onClick={handleAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            'AI Analysis'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
          <p className="font-medium">Analysis Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-gray-700">{result.summary}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Price Analysis</p>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getVerdictColor(result.priceVerdict)}`}>
                  {result.priceVerdict}
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Fair range: ${result.fairPriceRange.min} - ${result.fairPriceRange.max}
              </p>
              <p className="text-sm text-gray-600 mt-1">Market Demand: <span className="font-medium capitalize">{result.marketDemand}</span></p>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Fraud Risk</p>
              <div className="flex items-end space-x-2">
                <span className={`text-3xl font-bold ${getRiskColor(result.fraudRiskScore)}`}>
                  {result.fraudRiskScore}
                </span>
                <span className="text-sm text-gray-500 mb-1">/ 100</span>
              </div>
              
              {result.fraudIndicators.length > 0 ? (
                <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                  {result.fraudIndicators.map((indicator, idx) => (
                    <li key={idx}>{indicator}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-green-600">No major fraud indicators detected.</p>
              )}
            </div>
          </div>

          {result.recommendations.length > 0 && (
            <div className="mt-4 p-4 border border-blue-100 rounded-lg bg-blue-50">
              <p className="text-sm font-semibold text-blue-800 mb-2">Recommendations</p>
              <ul className="list-disc list-inside space-y-1">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-blue-700">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
