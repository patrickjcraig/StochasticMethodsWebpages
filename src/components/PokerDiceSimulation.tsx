import React, { useState } from 'react';
import { PlayCircle, StopCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface PokerDiceSimulationProps {
  numDice: number;
}

export function PokerDiceSimulation({ numDice }: PokerDiceSimulationProps) {
  const [numSimulations, setNumSimulations] = useState(100000);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    counts: { [key: string]: number };
    probabilities: { [key: string]: number };
  } | null>(null);

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

    const counts: { [key: string]: number } = {
      'No Two Alike': 0,
      'One Pair': 0,
      'Two Pair': 0,
      'Three Alike': 0,
      'Full House': 0,
      'Four Alike': 0,
      'Five Alike': 0,
    };

    const batchSize = 10000;
    const totalBatches = Math.ceil(numSimulations / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min((batch + 1) * batchSize, numSimulations);

      for (let sim = batchStart; sim < batchEnd; sim++) {
        const roll = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
        const handType = analyzeRoll(roll);
        counts[handType]++;
      }

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const probabilities: { [key: string]: number } = {};
    Object.keys(counts).forEach(key => {
      probabilities[key] = counts[key] / numSimulations;
    });

    setResults({
      total: numSimulations,
      counts,
      probabilities,
    });
    setIsRunning(false);
  };

  const getBarColor = (handType: string) => {
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-purple-900 border border-purple-600 rounded p-3 text-sm">
          <p className="text-purple-200 mb-1">{data.hand}</p>
          <p className="text-white">Simulated: {(data.simulated * 100).toFixed(2)}%</p>
          <p className="text-blue-300">Expected: {(data.expected * 100).toFixed(2)}%</p>
          <p className="text-purple-300">
            Count: {data.count?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
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

  const chartData = results
    ? handOrder.map(hand => ({
        hand: hand.replace(' ', '\n'),
        simulated: results.probabilities[hand],
        expected: expectedValues[hand],
        count: results.counts[hand],
        color: getBarColor(hand)
      }))
    : [];

  return (
    <div className="bg-purple-800/30 border border-purple-700 rounded-lg p-6">
      <h2 className="text-xl mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Monte Carlo Simulation
      </h2>

      <div className="space-y-4">
        <div className="bg-purple-900/50 rounded p-4">
          <label className="block text-sm text-purple-300 mb-2">
            Number of Simulations
          </label>
          <input
            type="range"
            min="10000"
            max="1000000"
            step="10000"
            value={numSimulations}
            onChange={(e) => setNumSimulations(Number(e.target.value))}
            className="w-full"
            disabled={isRunning}
          />
          <div className="flex items-center gap-3 mt-2">
            <input
              type="number"
              min="10000"
              max="10000000"
              step="10000"
              value={numSimulations}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 10000 && value <= 10000000) {
                  setNumSimulations(value);
                }
              }}
              className="bg-purple-900 border border-purple-600 rounded px-3 py-1 text-xl w-32"
              disabled={isRunning}
            />
            <div className="text-sm text-purple-400">
              (10k - 10M)
            </div>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors"
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

        {results && (
          <div className="space-y-4">
            <div className="bg-purple-900/50 rounded p-4">
              <div className="text-sm text-purple-300 mb-1">Total Simulations</div>
              <div className="text-2xl">{results.total.toLocaleString()}</div>
            </div>

            <div className="bg-purple-900/50 rounded-lg p-4">
              <h3 className="text-sm text-purple-300 mb-3">Probability Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
                  <XAxis
                    dataKey="hand"
                    stroke="#c4b5fd"
                    tick={{ fill: '#c4b5fd', fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis
                    stroke="#c4b5fd"
                    tick={{ fill: '#c4b5fd', fontSize: 12 }}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="simulated" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-purple-400 mt-2">
                Bars show simulated probabilities. Hover for expected values.
              </div>
            </div>

            <div className="space-y-2">
              {handOrder.map(hand => {
                const error = Math.abs((results.probabilities[hand] - expectedValues[hand]) * 100);
                return (
                  <div key={hand} className="bg-purple-900/30 rounded p-3 border border-purple-700/50">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm text-purple-200">{hand}</div>
                      <div className="text-xs text-purple-400">
                        {results.counts[hand].toLocaleString()} rolls
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-purple-300">Simulated: </span>
                        <span className="text-white">{(results.probabilities[hand] * 100).toFixed(4)}%</span>
                      </div>
                      <div>
                        <span className="text-purple-300">Expected: </span>
                        <span className="text-purple-200">{(expectedValues[hand] * 100).toFixed(4)}%</span>
                      </div>
                      <div>
                        <span className="text-purple-300">Error: </span>
                        <span className={error < 0.1 ? 'text-green-400' : error < 0.5 ? 'text-yellow-400' : 'text-red-400'}>
                          {error.toFixed(4)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-purple-900/50 rounded p-4">
              <div className="text-sm text-purple-300 mb-2">Average Absolute Error</div>
              <div className="text-2xl">
                {(handOrder.reduce((sum, hand) => 
                  sum + Math.abs(results.probabilities[hand] - expectedValues[hand]), 0
                ) / handOrder.length * 100).toFixed(4)}%
              </div>
            </div>
          </div>
        )}

        {!results && !isRunning && (
          <div className="text-center text-purple-400 py-8">
            Click "Run Simulation" to verify the probability calculations
          </div>
        )}
      </div>
    </div>
  );
}
