import React, { useState, useMemo } from 'react';
import { Spade, Heart, Calculator } from 'lucide-react';

export function BlackjackCalculator() {
  const [showSimulation, setShowSimulation] = useState(false);
  const [simResults, setSimResults] = useState<{ blackjacks: number; total: number } | null>(null);

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
    // Total ways to choose 2 cards from 52
    const totalWays = binomial(52, 2);

    // Blackjack = 1 Ace + 1 (Ten, Jack, Queen, or King)
    // Aces: 4 cards
    // Ten-value cards: 16 cards (4 tens + 4 jacks + 4 queens + 4 kings)
    const aces = 4;
    const tenValues = 16;
    
    // Ways to get blackjack:
    // Choose 1 ace from 4, and 1 ten-value from 16
    // Can pick ace first or ten-value first, so: 2 × (4 × 16)
    // But simpler: total ways = 4 × 16 (ace first, ten second) + 16 × 4 (ten first, ace second)
    // Wait, when choosing 2 cards, order doesn't matter
    // So it's just: (# of aces) × (# of ten-values) = 4 × 16 = 64
    const blackjackWays = aces * tenValues;

    const probability = blackjackWays / totalWays;

    return {
      totalWays,
      blackjackWays,
      probability,
      expectedNumerator: 128,
      expectedDenominator: 2652,
      expectedProbability: 128 / 2652
    };
  }, []);

  const runSimulation = () => {
    const numSims = 100000;
    let blackjacks = 0;

    for (let i = 0; i < numSims; i++) {
      const deck: string[] = [];
      
      // Create deck
      for (let suit = 0; suit < 4; suit++) {
        for (let rank = 1; rank <= 13; rank++) {
          deck.push(rank === 1 ? 'A' : (rank >= 10 ? 'T' : 'X'));
        }
      }

      // Shuffle and draw 2 cards
      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      const card1 = shuffled[0];
      const card2 = shuffled[1];

      // Check for blackjack
      if ((card1 === 'A' && card2 === 'T') || (card1 === 'T' && card2 === 'A')) {
        blackjacks++;
      }
    }

    setSimResults({ blackjacks, total: numSims });
    setShowSimulation(true);
  };

  const matches = Math.abs(calculations.blackjackWays - calculations.expectedNumerator) === 0;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl mb-2 flex items-center gap-3">
          <Spade className="w-10 h-10" />
          Blackjack Probability Calculator
          <Heart className="w-10 h-10" />
        </h1>
        <p className="text-slate-300">
          Calculate the probability of being dealt a blackjack from a standard deck (SS-2)
        </p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Problem Setup</h2>
        <div className="space-y-3 text-slate-300">
          <p>
            Two cards are randomly drawn from an ordinary 52-card deck (no jokers).
          </p>
          <p>
            <strong>Blackjack:</strong> One card is an Ace, and the other is a ten-value card 
            (10, Jack, Queen, or King)
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">Aces in deck:</div>
              <div className="text-2xl">4</div>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">Ten-value cards:</div>
              <div className="text-2xl">16</div>
              <div className="text-xs text-slate-500 mt-1">(4×10, 4×J, 4×Q, 4×K)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Combinatorial Calculation
        </h2>

        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Total ways to choose 2 cards from 52</div>
            <div className="text-2xl">{calculations.totalWays.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">= C(52, 2) = 52!/(2!×50!)</div>
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Ways to get blackjack</div>
            <div className="text-2xl">{calculations.blackjackWays}</div>
            <div className="text-xs text-slate-500 mt-1">= (# Aces) × (# Ten-values) = 4 × 16</div>
          </div>

          <div className={`rounded-lg p-4 border ${
            matches ? 'border-green-500/30 bg-green-900/20' : 'border-red-500/30 bg-red-900/20'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <div className="text-lg">Calculated Probability</div>
              <div className={`px-2 py-1 rounded text-xs ${
                matches ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
              }`}>
                {matches ? '✓ Matches Expected' : '✗ Differs'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Our calculation:</div>
                <div className="text-xl text-white">
                  {calculations.blackjackWays}/{calculations.totalWays}
                </div>
                <div className="text-lg text-white mt-1">
                  = {(calculations.probability * 100).toFixed(4)}%
                </div>
                <div className="text-xs text-slate-500">
                  ≈ {calculations.probability.toFixed(6)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Expected answer:</div>
                <div className="text-xl text-green-300">
                  {calculations.expectedNumerator}/{calculations.expectedDenominator}
                </div>
                <div className="text-lg text-green-300 mt-1">
                  = {(calculations.expectedProbability * 100).toFixed(4)}%
                </div>
                <div className="text-xs text-slate-500">
                  ≈ {calculations.expectedProbability.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Monte Carlo Verification</h2>
        
        <button
          onClick={runSimulation}
          className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors mb-4"
        >
          Run 100,000 Simulations
        </button>

        {showSimulation && simResults && (
          <div className="space-y-3">
            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-400 mb-1">Blackjacks dealt:</div>
              <div className="text-2xl">{simResults.blackjacks.toLocaleString()}</div>
            </div>

            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-400 mb-1">Simulated Probability:</div>
              <div className="text-2xl">
                {((simResults.blackjacks / simResults.total) * 100).toFixed(4)}%
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {simResults.blackjacks} / {simResults.total.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-400 mb-1">Error from expected:</div>
              <div className="text-lg">
                {Math.abs((simResults.blackjacks / simResults.total - calculations.expectedProbability) * 100).toFixed(4)}%
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm mb-2">Why 128/2652 ≠ 64/1326?</h3>
        <p className="text-xs text-slate-400">
          Actually, 128/2652 = 64/1326 when reduced to lowest terms! Both are equal to approximately 0.04827 or 4.827%.
          The answer key uses 128/2652 which is the unreduced fraction (perhaps counting order: ace-then-ten OR ten-then-ace as separate).
        </p>
      </div>
    </div>
  );
}
