import React, { useMemo } from 'react';
import { Calculator } from 'lucide-react';

interface ProbabilityCalculatorProps {
  totalComputers: number;
  honeypots: number;
  victims: number;
  numAttacks: number;
}

export function ProbabilityCalculator({ 
  totalComputers, 
  honeypots, 
  victims, 
  numAttacks 
}: ProbabilityCalculatorProps) {
  
  // Optimized binomial coefficient calculation
  const binomial = (n: number, k: number): number => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    
    // Use the smaller of k or n-k for efficiency
    k = Math.min(k, n - k);
    
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
  };

  const calculateProbability = useMemo(() => {
    // Total number of ways to arrange H honeypots among N computers
    const totalPermutations = binomial(totalComputers, honeypots);
    
    // Check positions are 0, 2, 4, 6, ... (0-indexed)
    const checkPositions = Array.from({ length: numAttacks }, (_, i) => i * 2);
    const numCheckPositions = checkPositions.length;
    
    // Limit iterations for very large numbers
    if (numCheckPositions > 15) {
      return {
        totalPermutations,
        caughtPermutations: 0,
        probability: 0,
        checkPositions,
        tooLarge: true
      };
    }
    
    let caughtPermutations = 0;
    
    // Use inclusion-exclusion principle
    for (let mask = 1; mask < (1 << numCheckPositions); mask++) {
      let honeypotsAtPositions = 0;
      
      // Count set bits
      for (let i = 0; i < numCheckPositions; i++) {
        if (mask & (1 << i)) {
          honeypotsAtPositions++;
        }
      }
      
      if (honeypotsAtPositions > honeypots) continue;
      
      const remainingHoneypots = honeypots - honeypotsAtPositions;
      const remainingPositions = totalComputers - honeypotsAtPositions;
      
      const ways = binomial(remainingPositions, remainingHoneypots);
      
      // Inclusion-exclusion: add if odd, subtract if even
      if (honeypotsAtPositions % 2 === 1) {
        caughtPermutations += ways;
      } else {
        caughtPermutations -= ways;
      }
    }
    
    const probability = caughtPermutations / totalPermutations;
    
    return {
      totalPermutations,
      caughtPermutations,
      probability,
      checkPositions,
      tooLarge: false
    };
  }, [totalComputers, honeypots, numAttacks]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h2 className="text-xl mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Combinatorial Calculation
      </h2>

      <div className="space-y-4">
        <div className="bg-slate-900/50 rounded p-4">
          <div className="text-sm text-slate-400 mb-1">Total Arrangements</div>
          <div className="text-2xl">
            {calculateProbability.totalPermutations.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            C({totalComputers}, {honeypots})
          </div>
        </div>

        {calculateProbability.tooLarge ? (
          <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500">
            <div className="text-sm text-orange-400">
              Too many check positions ({calculateProbability.checkPositions.length}). 
              Use simulation instead.
            </div>
          </div>
        ) : (
          <>
            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-400 mb-1">Arrangements Where Caught</div>
              <div className="text-2xl text-yellow-500">
                {calculateProbability.caughtPermutations.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Using inclusion-exclusion on positions:{' '}
                {calculateProbability.checkPositions.map(p => p + 1).join(', ')}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500">
              <div className="text-sm text-slate-400 mb-1">Probability Attack Detected</div>
              <div className="text-3xl">
                {(calculateProbability.probability * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-slate-300 mt-2">
                = {calculateProbability.caughtPermutations} / {calculateProbability.totalPermutations}
              </div>
              <div className="text-sm text-slate-300">
                ≈ {calculateProbability.probability.toFixed(6)}
              </div>
            </div>
          </>
        )}

        <div className="bg-slate-900/50 rounded p-4 border border-slate-600">
          <div className="text-sm text-slate-400 mb-2">Calculation Method</div>
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              Event C (caught) = C₁ ∪ C₃ ∪ C₅ ∪ C₇ ∪ ...
            </p>
            <p>
              Where Cᵢ = "honeypot at position i"
            </p>
            <p>
              Using inclusion-exclusion principle to avoid double-counting overlapping events.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 italic">
          Note: This assumes all {totalComputers} computers are selected exactly once.
        </div>
      </div>
    </div>
  );
}