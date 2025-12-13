import React, { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, LineChart as LineChartIcon, RotateCcw, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PokerDiceSimulationProps {
  numDice: number;
}

export function PokerDiceSimulation({ numDice }: PokerDiceSimulationProps) {
  const [numSimulations, setNumSimulations] = useState(100000);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(100); // 0-100 (100 is max speed)
  const [showGraph, setShowGraph] = useState(false);
  const speedRef = React.useRef(simulationSpeed);

  useEffect(() => {
    speedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  const [results, setResults] = useState<{
    total: number;
    counts: { [key: string]: number };
    probabilities: { [key: string]: number };
  } | null>(null);

  const [history, setHistory] = useState<Array<any>>([]);

  const expectedValues: { [key: string]: number } = {
    'No Two Alike': 0.0926,
    'One Pair': 0.4630,
    'Two Pair': 0.2315,
    'Three Alike': 0.1543,
    'Full House': 0.0386,
    'Four Alike': 0.0193,
    'Five Alike': 0.000772,
  };

  const analyzeRoll = (dice: number[]): string => {
    const counts = new Map<number, number>();
    dice.forEach(d => counts.set(d, (counts.get(d) || 0) + 1));
    const frequencies = Array.from(counts.values()).sort((a, b) => b - a);

    if (frequencies[0] === 5) return 'Five Alike';
    if (frequencies[0] === 4) return 'Four Alike';
    if (frequencies[0] === 3 && frequencies[1] === 2) return 'Full House';
    if (frequencies[0] === 3) return 'Three Alike';
    if (frequencies[0] === 2 && frequencies[1] === 2) return 'Two Pair';
    if (frequencies[0] === 2) return 'One Pair';
    return 'No Two Alike';
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setResults(null);
    setHistory([]);

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

    for (let batch = 0; batch < totalBatches; batch++) {
      if (!speedRef.current && speedRef.current !== 0) break; // Safety check if component unmounts logic needed, but mostly ref is fine

      const batchStart = batch * batchSize;
      const batchEnd = Math.min((batch + 1) * batchSize, numSimulations);

      for (let sim = batchStart; sim < batchEnd; sim++) {
        const roll = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
        const handType = analyzeRoll(roll);
        counts[handType]++;
      }

      const currentProbabilities: { [key: string]: number } = {};
      Object.keys(counts).forEach(key => {
        currentProbabilities[key] = counts[key] / batchEnd;
      });

      const newHistoryPoint = {
        iteration: batchEnd,
        ...currentProbabilities
      };

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

        {results && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-300 mb-1">Total Simulations</div>
              <div className="text-2xl">{results.total.toLocaleString()}</div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm text-slate-300">Probability Convergence</h3>
                <button
                  onClick={() => setShowGraph(!showGraph)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs py-1 px-3 rounded border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <Activity className="w-3 h-3" />
                  {showGraph ? 'Hide Graph' : 'View Graph'}
                </button>
              </div>

              {showGraph && (
                <>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
                        <XAxis
                          dataKey="iteration"
                          stroke="#c4b5fd"
                          tick={{ fill: '#c4b5fd', fontSize: 10 }}
                          tickFormatter={(val) => val.toLocaleString()}
                          label={{ value: 'Iterations', position: 'insideBottom', offset: -5, fill: '#c4b5fd' }}
                        />
                        <YAxis
                          stroke="#c4b5fd"
                          tick={{ fill: '#c4b5fd', fontSize: 12 }}
                          tickFormatter={(value) => value.toFixed(2)}
                          domain={[0, 0.6]} // Adjusted to focus on meaningful range (max pair is ~0.46)
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
                            dot={false}
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Lines show how experimental probability converges to theoretical values over time.
                  </div>
                </>
              )}
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