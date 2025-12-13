import React, { useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { ProbabilitySimulation } from './ProbabilitySimulation';

// Define Props for the Probability Calculator
interface ProbabilityCalculatorProps {
  totalComputers: number; // N
  honeypots: number;      // K (traps)
  victims: number;        // N - K (safe)
  numAttacks: number;     // How many positions are checked
}

export function ProbabilityCalculator({
  totalComputers,
  honeypots,
  victims,
  numAttacks
}: ProbabilityCalculatorProps) {

  // Optimized binomial coefficient calculation (n Choose k)
  // Calculates the number of ways to choose k items from a set of n distinct items
  const binomial = (n: number, k: number): number => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    // Optimization: C(n, k) == C(n, n-k), so use the smaller k to reduce iterations
    k = Math.min(k, n - k);

    let result = 1;
    for (let i = 0; i < k; i++) {
      // Iteratively calculate the product form: n * (n-1) * ... / (1 * 2 * ...)
      result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
  };

  // Memoize the probability calculation to avoid re-computing on every valid render unless inputs change
  const calculateProbability = useMemo(() => {
    const totalPermutations = binomial(totalComputers, honeypots);

    let currentH = honeypots;
    let currentTotal = totalComputers;
    let probabilityCaught = 0;
    let probabilitySurvive = 1;

    // Iterative calculation for the specific game rules
    // Step k corresponds to attack k (checking positions 2k and 2k+1)
    for (let i = 0; i < numAttacks; i++) {
      // If we can't form a pair, we stop
      if (currentTotal < 2) break;

      // Probability of catching at this step (First card is H)
      // P(Catch) = currentH / currentTotal
      const pCatch = currentH / currentTotal;

      probabilityCaught += probabilitySurvive * pCatch;

      // To continue to the next step, we must NOT be caught AND the hacker must NOT win.
      // This implies the pair must be (V, V).
      // (V, H) is a Hacker Win (Game Over, outcome: Missed)
      // (H, ?) is Caught (Game Over, outcome: Caught)

      const currentV = currentTotal - currentH;

      // If we don't have enough victims for (V, V), survival probability becomes 0
      if (currentV < 2) {
        probabilitySurvive = 0;
        break;
      }

      // P(V, V) = P(1st is V) * P(2nd is V | 1st is V)
      const pVV = (currentV / currentTotal) * ((currentV - 1) / (currentTotal - 1));

      probabilitySurvive *= pVV;

      // Advance state: We "consumed" 2 positions (which were V, V)
      currentTotal -= 2;
      // currentH remains same, as we removed 2 Victims
    }

    const caughtPermutations = Math.round(probabilityCaught * totalPermutations);
    const checkPositions = Array.from({ length: numAttacks }, (_, i) => i * 2);

    return {
      totalPermutations,
      caughtPermutations,
      probability: probabilityCaught,
      checkPositions,
      tooLarge: false
    };
  }, [totalComputers, honeypots, numAttacks]);

  return (
    <div className="space-y-6">
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
                Calculated iteratively considering path-dependent outcomes at each attack step (pair of computers):
              </p>
              <ul className="list-disc list-inside">
                <li><strong>Caught:</strong> Honeypot found at first index of pair.</li>
                <li><strong>Hacker Win:</strong> Victim at first, Honeypot at second (Game Over, not caught).</li>
                <li><strong>Continue:</strong> Victim at both positions.</li>
              </ul>
              <p>
                P(Caught) = Σ P(Survive previous) × P(Catch current)
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 italic">
            Note: This assumes all {totalComputers} computers are selected exactly once.
          </div>
        </div>
      </div>

      {/* Integrate the Simulation Component */}
      <ProbabilitySimulation
        totalComputers={totalComputers}
        honeypots={honeypots}
        victims={victims}
        numAttacks={numAttacks}
        theoreticalProbability={calculateProbability.probability}
      />
    </div>
  );
}