import React, { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, LineChart as LineChartIcon, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PokerDiceSimulationProps {
  numDice: number; // Typically 5
}

export function PokerDiceSimulation({ numDice }: PokerDiceSimulationProps) {
  // State for Simulation Configuration
  const [numSimulations, setNumSimulations] = useState(100000);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(100); // 0-100 (100 is max speed)

  // Ref for speed to access latest value inside the async loop
  const speedRef = React.useRef(simulationSpeed);
  useEffect(() => {
    speedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  // State for storing simulation results
  const [results, setResults] = useState<{
    total: number;
    counts: { [key: string]: number };
    probabilities: { [key: string]: number };
  } | null>(null);

  // History state for the convergence graph
  const [history, setHistory] = useState<Array<any>>([]);

  // Expected theoretical probabilities for Poker Dice (Source: Standard Combinatorics)
  // These are for 5 dice with 6 faces each (6^5 total outcomes)
  const expectedValues: { [key: string]: number } = {
    'No Two Alike': 0.0926, // All distinct: 6*5*4*3*2 / 6^5
    'One Pair': 0.4630,
    'Two Pair': 0.2315,
    'Three Alike': 0.1543,
    'Full House': 0.0386,
    'Four Alike': 0.0193,
    'Five Alike': 0.000772, // 6/6^5 = 1/1296
  };

  // Helper function to categorize a dice roll into a poker hand
  const analyzeRoll = (dice: number[]): string => {
    // Count frequency of each face value
    const counts = new Map<number, number>();
    dice.forEach(d => counts.set(d, (counts.get(d) || 0) + 1));

    // Get the counts and sort them descending to identify the pattern
    // e.g., 5 dice -> [5] = Five Alike
    // e.g., Full House -> [3, 2]
    // e.g., Two Pair -> [2, 2, 1]
    const frequencies = Array.from(counts.values()).sort((a, b) => b - a);

    if (frequencies[0] === 5) return 'Five Alike';
    if (frequencies[0] === 4) return 'Four Alike';
    if (frequencies[0] === 3 && frequencies[1] === 2) return 'Full House';
    if (frequencies[0] === 3) return 'Three Alike';
    if (frequencies[0] === 2 && frequencies[1] === 2) return 'Two Pair';
    if (frequencies[0] === 2) return 'One Pair';
    return 'No Two Alike';
  };

  // Main simulation runner
  const runSimulation = async () => {
    setIsRunning(true);
    setResults(null);
    setHistory([]);

    // Initialize counts
    const counts: { [key: string]: number } = {
      'No Two Alike': 0,
      'One Pair': 0,
      'Two Pair': 0,
      'Three Alike': 0,
      'Full House': 0,
      'Four Alike': 0,
      'Five Alike': 0,
    };

    const batchSize = 1000; // Smaller batches for smoother animation when slowed
    const totalBatches = Math.ceil(numSimulations / batchSize);

    // Batch Loop
    for (let batch = 0; batch < totalBatches; batch++) {
      if (!speedRef.current && speedRef.current !== 0) break; // Check to prevent run if component unmounted/speed broken

      const batchStart = batch * batchSize;
      const batchEnd = Math.min((batch + 1) * batchSize, numSimulations);

      // Simulation Loop for current batch (Synchronous part)
      for (let sim = batchStart; sim < batchEnd; sim++) {
        // Roll N dice
        const roll = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
        // Analyze hand
        const handType = analyzeRoll(roll);
        // Tally result
        counts[handType]++;
      }

      // Calculate current probabilities after this batch
      const currentProbabilities: { [key: string]: number } = {};
      Object.keys(counts).forEach(key => {
        currentProbabilities[key] = counts[key] / batchEnd;
      });

      // Record history for graph
      const newHistoryPoint = {
        iteration: batchEnd,
        ...currentProbabilities
      };

      // Update UI state
      setResults({
        total: batchEnd,
        counts: { ...counts },
        probabilities: currentProbabilities
      });

      setHistory(prev => [...prev, newHistoryPoint]);

      // Allow UI to update and throttle based on speed
      // Speed 100 -> 0ms delay. Speed 1 -> 100ms delay.
      const delay = Math.max(0, 100 - speedRef.current);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    setIsRunning(false);
  };


  // Helper definitions for visualization
  const getLineColor = (handType: string) => {
    const colors: { [key: string]: string } = {
      'No Two Alike': '#3b82f6',
      'One Pair': '#10b981',
      'Two Pair': '#eab308',
      'Three Alike': '#f97316',
      'Full House': '#ef4444',
      'Four Alike': '#a855f7',
      'Five Alike': '#ec4899',
    };
    return colors[handType] || '#64748b';
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

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h2 className="text-xl mb-4 flex items-center gap-2">
        <LineChartIcon className="w-5 h-5" />
        Monte Carlo Simulation
      </h2>

      <div className="space-y-4">
        {/* Settings Panel */}
        <div className="bg-slate-900/50 rounded p-4">
          <label className="block text-sm text-slate-300 mb-2">
            Number of Simulations
          </label>
          <input
            type="range"
            min="10000"
            max="1000000"
            step="10000"
            value={Math.min(numSimulations, 1000000)}
            onChange={(e) => setNumSimulations(Number(e.target.value))}
            className="w-full"
            disabled={isRunning}
          />
          <div className="flex items-center gap-3 mt-2">
            <input
              type="number"
              min="1"
              step="10000"
              value={numSimulations}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1) {
                  setNumSimulations(value);
                }
              }}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-xl w-32"
              disabled={isRunning}
            />
            <div className="text-sm text-slate-400">
              (no limit - slider max: 1M)
            </div>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded mb-6">
          <span className="text-xs text-slate-400 w-12">Speed</span>
          <input
            type="range"
            min="1"
            max="100"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
            disabled={isRunning}
            className="flex-1 accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-slate-400 w-8 text-right">{simulationSpeed}%</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-900 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors"
          >
            {isRunning ? (
              <>
                <StopCircle className="w-5 h-5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Run Simulation
              </>
            )}
          </button>
          <button
            onClick={() => {
              setResults(null);
              setHistory([]);
            }}
            disabled={isRunning || !results}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors"
            title="Reset Results"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Results Sections */}
        {/* Convergence Graph - Displays while running and after */}
        {history.length > 0 && (
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm text-slate-400 mb-3">Probability Convergence</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="iteration"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  domain={[0, 0.6]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4c1d95', color: '#fff' }}
                  formatter={(val: number) => val.toFixed(4)}
                  labelFormatter={(label) => `Iteration: ${label}`}
                />
                <Legend />
                {handOrder.map(hand => (
                  <Line
                    key={hand}
                    type="monotone"
                    dataKey={hand}
                    stroke={getLineColor(hand)}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-slate-500 mt-2">
              Lines show how experimental probability converges to theoretical values over time.
            </div>
          </div>
        )}

        {/* Results Sections */}
        {results && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-300 mb-1">Total Simulations</div>
              <div className="text-2xl">{results.total.toLocaleString()}</div>
            </div>

            <div className="space-y-2">
              {handOrder.map(hand => {
                const error = Math.abs((results.probabilities[hand] - expectedValues[hand]) * 100);
                return (
                  <div key={hand} className="bg-slate-900/30 rounded p-3 border border-slate-700/50">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm text-slate-200" style={{ color: getLineColor(hand) }}>{hand}</div>
                      <div className="text-xs text-slate-400">
                        {results.counts[hand].toLocaleString()} rolls
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-300">Simulated: </span>
                        <span className="text-white">{(results.probabilities[hand] * 100).toFixed(4)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-300">Expected: </span>
                        <span className="text-slate-200">{(expectedValues[hand] * 100).toFixed(4)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-300">Error: </span>
                        <span className={error < 0.1 ? 'text-green-400' : error < 0.5 ? 'text-yellow-400' : 'text-red-400'}>
                          {error.toFixed(4)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-300 mb-2">Average Absolute Error</div>
              <div className="text-2xl">
                {(handOrder.reduce((sum, hand) =>
                  sum + Math.abs(results.probabilities[hand] - expectedValues[hand]), 0
                ) / handOrder.length * 100).toFixed(4)}%
              </div>
            </div>
          </div>
        )}

        {!results && !isRunning && (
          <div className="text-center text-slate-400 py-8">
            Click "Run Simulation" to verify the probability calculations
          </div>
        )}
      </div>
    </div>
  );
}