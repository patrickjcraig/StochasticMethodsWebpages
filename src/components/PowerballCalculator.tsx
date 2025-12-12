import React, { useState, useMemo } from 'react';
import { Calculator, ExternalLink } from 'lucide-react';

export function PowerballCalculator() {
  const [showDetails, setShowDetails] = useState(true);

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const binomial = (n: number, k: number): number => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    return factorial(n) / (factorial(k) * factorial(n - k));
  };

  const calculations = useMemo(() => {
    // Total white balls: 69, choose 5
    // Total Powerballs: 26, choose 1
    const totalWhiteCombinations = binomial(69, 5);
    const totalPowerballOptions = 26;
    const totalOutcomes = totalWhiteCombinations * totalPowerballOptions;

    // Prize 1: Match 5 white + Powerball (Grand Prize)
    const prize1Ways = 1; // Only one way to match all
    const prize1Prob = prize1Ways / totalOutcomes;

    // Prize 2: Match 5 white, no Powerball
    const prize2Ways = binomial(69, 5) * 0 + 1 * 25; // 1 way to match 5 whites, 25 wrong powerballs
    const prize2Prob = prize2Ways / totalOutcomes;

    // Prize 3: Match 4 white + Powerball
    const prize3Ways = binomial(5, 4) * binomial(64, 1) * 1;
    const prize3Prob = prize3Ways / totalOutcomes;

    // Prize 4: Match 4 white, no Powerball
    const prize4Ways = binomial(5, 4) * binomial(64, 1) * 25;
    const prize4Prob = prize4Ways / totalOutcomes;

    // Prize 5: Match 3 white + Powerball
    const prize5Ways = binomial(5, 3) * binomial(64, 2) * 1;
    const prize5Prob = prize5Ways / totalOutcomes;

    return {
      totalOutcomes,
      totalWhiteCombinations,
      prizes: [
        {
          name: 'Grand Prize',
          description: '5 white + Powerball',
          ways: prize1Ways,
          probability: prize1Prob,
          posted: '1 in 292,201,338',
          postedProb: 1 / 292201338
        },
        {
          name: '$1,000,000',
          description: '5 white, no Powerball',
          ways: prize2Ways,
          probability: prize2Prob,
          posted: '1 in 11,688,053.52',
          postedProb: 1 / 11688053.52
        },
        {
          name: '$50,000',
          description: '4 white + Powerball',
          ways: prize3Ways,
          probability: prize3Prob,
          posted: '1 in 913,129.18',
          postedProb: 1 / 913129.18
        },
        {
          name: '$100 (Prize 4)',
          description: '4 white, no Powerball',
          ways: prize4Ways,
          probability: prize4Prob,
          posted: '1 in 36,525.17',
          postedProb: 1 / 36525.17
        },
        {
          name: '$100 (Prize 5)',
          description: '3 white + Powerball',
          ways: prize5Ways,
          probability: prize5Prob,
          posted: '1 in 14,494.11',
          postedProb: 1 / 14494.11
        }
      ]
    };
  }, []);

  const getColorClass = (index: number) => {
    const colors = [
      'border-yellow-500/30 bg-yellow-900/20',
      'border-blue-500/30 bg-blue-900/20',
      'border-green-500/30 bg-green-900/20',
      'border-purple-500/30 bg-purple-900/20',
      'border-orange-500/30 bg-orange-900/20',
    ];
    return colors[index] || 'border-slate-500/30 bg-slate-900/20';
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl mb-2">Powerball Lottery Probability Calculator</h1>
        <p className="text-slate-300">
          Calculate and verify the probabilities of winning Powerball prizes (Problem 4)
        </p>
        <a
          href="https://www.powerball.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mt-2"
        >
          <ExternalLink className="w-4 h-4" />
          Visit Powerball.com
        </a>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Game Rules
        </h2>
        <div className="space-y-2 text-slate-300">
          <p>• Choose 5 white balls from 1-69</p>
          <p>• Choose 1 Powerball from 1-26</p>
          <p>• Total possible combinations: <span className="text-white">{calculations.totalOutcomes.toLocaleString()}</span></p>
          <p className="text-sm text-slate-400 mt-3">
            Formula: C(69,5) × 26 = {calculations.totalWhiteCombinations.toLocaleString()} × 26
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Prize Probabilities</h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-slate-400 hover:text-slate-300"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        <div className="space-y-3">
          {calculations.prizes.map((prize, index) => {
            const matches = Math.abs(prize.probability - prize.postedProb) < 0.000000001;
            const errorPercent = Math.abs((prize.probability - prize.postedProb) / prize.postedProb * 100);

            return (
              <div key={index} className={`rounded-lg p-4 border ${getColorClass(index)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-lg text-slate-100">{prize.name}</div>
                    <div className="text-sm text-slate-400">{prize.description}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    matches ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                  }`}>
                    {matches ? '✓ Matches' : '✗ Differs'}
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-slate-600/50 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-slate-400">Calculated Ways:</div>
                        <div className="text-white">{prize.ways.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Calculated Probability:</div>
                        <div className="text-white">1 in {(1 / prize.probability).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-slate-500">{prize.probability.toExponential(6)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-slate-400">Posted Probability:</div>
                        <div className="text-white">{prize.posted}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Error:</div>
                        <div className={errorPercent < 0.001 ? 'text-green-400' : 'text-red-400'}>
                          {errorPercent.toFixed(6)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm mb-2">Calculation Notes</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>• <strong>Grand Prize:</strong> C(5,5) × C(64,0) × 1 = 1 way</p>
          <p>• <strong>$1M Prize:</strong> C(5,5) × C(64,0) × 25 = 25 ways (wrong Powerball)</p>
          <p>• <strong>$50K Prize:</strong> C(5,4) × C(64,1) × 1 = 5 × 64 = 320 ways</p>
          <p>• <strong>$100 (4 white):</strong> C(5,4) × C(64,1) × 25 = 320 × 25 = 8,000 ways</p>
          <p>• <strong>$100 (3 white + PB):</strong> C(5,3) × C(64,2) × 1 = 10 × 2,016 = 20,160 ways</p>
        </div>
      </div>
    </div>
  );
}
