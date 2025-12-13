import React, { useMemo } from 'react';
import { Spade, Heart, Calculator } from 'lucide-react';
import { BlackjackSimulation } from './BlackjackSimulation';

export function BlackjackCalculator() {
  // Helper: Factorial function (n!)
  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // Helper: Binomial coefficient C(n, k)
  // Calculates number of ways to choose k items from n without regard to order
  const binomial = (n: number, k: number): number => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    return factorial(n) / (factorial(k) * factorial(n - k));
  };

  // Perform the probability calculation
  const calculations = useMemo(() => {
    // 1. Calculate Denominator: Total possible hands of 2 cards
    // using Combinations (order does NOT matter, so {Ace, 10} is same as {10, Ace})
    const totalWays = binomial(52, 2); // 52! / (2! * 50!) = 1326

    // 2. Calculate Numerator: Ways to get Blackjack
    // A Blackjack consists of exactly one Ace and exactly one Ten-value card.
    const aces = 4;        // 4 Aces in a deck
    const tenValues = 16;  // 10s, Js, Qs, Ks (4 of each)

    // Using Multiplication Principle:
    // Ways = (Ways to choose 1 Ace) * (Ways to choose 1 Ten-value)
    // Ways = C(4, 1) * C(16, 1) = 4 * 16 = 64
    const blackjackWays = aces * tenValues;

    // 3. Calculate Probability
    const probability = blackjackWays / totalWays; // 64 / 1326 ≈ 0.0483

    // Note on "Expected" values logic:
    // Some textbooks/sources calculate this using Permutations (order matters).
    // Permutations Denominator: P(52, 2) = 52 * 51 = 2652
    // Permutations Numerator: (Ace then 10) + (10 then Ace) = (4*16) + (16*4) = 64 + 64 = 128
    // Resulting Probability: 128 / 2652 ≈ 0.0483
    // The probability is the same, but the raw counts differ by a factor of 2 (2!).
    // We display comparisons to show this equivalence.
    return {
      totalWays,
      blackjackWays,
      probability,
      expectedNumerator: 128,      // Assuming Permutation-based reference
      expectedDenominator: 2652,   // Assuming Permutation-based reference
      expectedProbability: 128 / 2652
    };
  }, []);

  // Check if our probability matches the expected probability (within float epsilon)
  // We compare probabilities rather than raw counts because of the Permutation vs Combination difference
  const matches = Math.abs(calculations.probability - calculations.expectedProbability) < 0.000001;

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

          <div className={`rounded-lg p-4 border ${matches ? 'border-green-500/30 bg-green-900/20' : 'border-red-500/30 bg-red-900/20'
            }`}>
            <div className="flex justify-between items-start mb-3">
              <div className="text-lg">Calculated Probability</div>
              <div className={`px-2 py-1 rounded text-xs ${matches ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
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

      <BlackjackSimulation theoreticalProb={calculations.expectedProbability} />

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm mb-2">Why 128/2652 vs 64/1326?</h3>
        <p className="text-xs text-slate-400">
          They are mathematically equivalent fractions (both equal ~4.83%).
          <br />
          - <strong>64/1326</strong> uses Combinations (Order doesn't matter: Ace-Ten is same as Ten-Ace).
          <br />
          - <strong>128/2652</strong> uses Permutations (Order matters: Ace-Ten is distinct from Ten-Ace).
          <br />
          As long as you use the same method for both numerator and denominator, the probability is correct.
        </p>
      </div>
    </div>
  );
}
