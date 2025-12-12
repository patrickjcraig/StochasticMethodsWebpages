import React, { useMemo } from 'react';
import { Calculator } from 'lucide-react';

interface PokerDiceCalculatorProps {
  numDice: number;
}

export function PokerDiceCalculator({ numDice }: PokerDiceCalculatorProps) {
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

  const calculateProbabilities = useMemo(() => {
    const totalOutcomes = Math.pow(6, numDice);
    
    // Five alike: Choose 1 value, all dice show that value
    const fiveAlike = numDice === 5 ? 6 : 0;
    
    // Four alike: Choose 1 value for four, 1 position for the different die, 5 values for it
    const fourAlike = numDice === 5 ? binomial(5, 4) * 6 * 5 : 0;
    
    // Full house: Choose 1 value for three, 1 value for two, arrange them
    const fullHouse = numDice === 5 ? binomial(5, 3) * 6 * 5 : 0;
    
    // Three alike (but not full house or better)
    // Choose 1 value for three, positions for three, 2 different values for remaining 2
    const threeAlike = numDice === 5 
      ? binomial(5, 3) * 6 * binomial(5, 2) * 5 * 4 
      : 0;
    
    // Two pair: Choose 2 values for pairs, positions for first pair, positions for second pair, 1 value for last die
    const twoPair = numDice === 5 
      ? binomial(6, 2) * binomial(5, 2) * binomial(3, 2) * 4 
      : 0;
    
    // One pair: Choose 1 value for pair, positions for pair, 3 different values for remaining dice
    const onePair = numDice === 5 
      ? 6 * binomial(5, 2) * binomial(5, 3) * 5 * 4 * 3 
      : 0;
    
    // No two alike: Choose 5 different values, arrange them
    const noTwoAlike = numDice === 5 ? binomial(6, 5) * factorial(5) : 0;

    return {
      totalOutcomes,
      outcomes: {
        'Five Alike': fiveAlike,
        'Four Alike': fourAlike,
        'Full House': fullHouse,
        'Three Alike': threeAlike,
        'Two Pair': twoPair,
        'One Pair': onePair,
        'No Two Alike': noTwoAlike,
      },
      probabilities: {
        'Five Alike': fiveAlike / totalOutcomes,
        'Four Alike': fourAlike / totalOutcomes,
        'Full House': fullHouse / totalOutcomes,
        'Three Alike': threeAlike / totalOutcomes,
        'Two Pair': twoPair / totalOutcomes,
        'One Pair': onePair / totalOutcomes,
        'No Two Alike': noTwoAlike / totalOutcomes,
      },
      expectedValues: {
        'No Two Alike': 0.0926,
        'One Pair': 0.4630,
        'Two Pair': 0.2315,
        'Three Alike': 0.1543,
        'Full House': 0.0386,
        'Four Alike': 0.0193,
        'Five Alike': 0.000772,
      }
    };
  }, [numDice]);

  const getColorClass = (handType: string) => {
    const colors: { [key: string]: string } = {
      'No Two Alike': 'border-blue-500/30 bg-blue-900/20',
      'One Pair': 'border-green-500/30 bg-green-900/20',
      'Two Pair': 'border-yellow-500/30 bg-yellow-900/20',
      'Three Alike': 'border-orange-500/30 bg-orange-900/20',
      'Full House': 'border-red-500/30 bg-red-900/20',
      'Four Alike': 'border-purple-500/30 bg-purple-900/20',
      'Five Alike': 'border-pink-500/30 bg-pink-900/20',
    };
    return colors[handType] || 'border-slate-500/30 bg-slate-900/20';
  };

  const handOrder = [
    'No Two Alike',
    'One Pair',
    'Two Pair',
    'Three Alike',
    'Full House',
    'Four Alike',
    'Five Alike'
  ];

  const totalCalcProb = handOrder.reduce((sum, hand) => sum + calculateProbabilities.probabilities[hand], 0);

  return (
    <div className="bg-purple-800/30 border border-purple-700 rounded-lg p-6">
      <h2 className="text-xl mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Combinatorial Calculation
      </h2>

      <div className="space-y-4">
        <div className="bg-purple-900/50 rounded p-4">
          <div className="text-sm text-purple-300 mb-1">Total Possible Outcomes</div>
          <div className="text-2xl">{calculateProbabilities.totalOutcomes.toLocaleString()}</div>
          <div className="text-xs text-purple-400 mt-1">= 6^{numDice}</div>
        </div>

        <div className="space-y-2">
          {handOrder.map(hand => (
            <div key={hand} className={`rounded-lg p-3 border ${getColorClass(hand)}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-purple-200">{hand}</div>
                <div className="text-xs text-purple-400">
                  {calculateProbabilities.outcomes[hand].toLocaleString()} ways
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg">
                    {(calculateProbabilities.probabilities[hand] * 100).toFixed(2)}%
                  </div>
                  <div className="text-xs text-purple-400">
                    {calculateProbabilities.probabilities[hand].toExponential(4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-purple-400">Expected:</div>
                  <div className="text-sm text-purple-300">
                    {(calculateProbabilities.expectedValues[hand] * 100).toFixed(2)}%
                  </div>
                  <div className="text-xs text-purple-500">
                    Error: {Math.abs(
                      (calculateProbabilities.probabilities[hand] - calculateProbabilities.expectedValues[hand]) * 100
                    ).toFixed(4)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-purple-900/50 rounded p-4 border border-purple-600">
          <div className="text-sm text-purple-300 mb-1">Sum of All Probabilities</div>
          <div className="text-2xl">{(totalCalcProb * 100).toFixed(4)}%</div>
          <div className="text-xs text-purple-400 mt-1">
            Should equal 100% (sanity check)
          </div>
        </div>

        <div className="text-xs text-purple-400 italic bg-purple-900/30 rounded p-3">
          <strong>Note:</strong> Calculations use combinations and permutations. 
          For example, "One Pair" = C(6,1) × C(5,2) × P(5,3) where we choose 1 value for the pair, 
          2 positions for it, and arrange 3 different values in remaining positions.
        </div>
      </div>
    </div>
  );
}
