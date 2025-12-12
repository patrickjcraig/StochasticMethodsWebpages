import React, { useState, useEffect } from "react";
import {
  PlayCircle,
  StopCircle,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface SimulationRunnerProps {
  totalComputers: number;
  honeypots: number;
  victims: number;
  numAttacks: number;
}

export function SimulationRunner({
  totalComputers,
  honeypots,
  victims,
  numAttacks,
}: SimulationRunnerProps) {
  const [numSimulations, setNumSimulations] = useState(10000);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    caught: number;
    hackerWins: number;
    inconclusive: number;
    probability: number;
  } | null>(null);
  const [convergenceData, setConvergenceData] = useState<Array<{ simulations: number; probability: number }>>([]);
  const [theoreticalProb, setTheoreticalProb] = useState<number | null>(null);

  // Calculate theoretical probability using simplified combinatorics
  useEffect(() => {
    const binomial = (n: number, k: number): number => {
      if (k > n || k < 0) return 0;
      if (k === 0 || k === n) return 1;
      k = Math.min(k, n - k);
      let result = 1;
      for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
      }
      return Math.round(result);
    };

    const checkPositions = Array.from({ length: numAttacks }, (_, i) => i * 2);
    const numCheckPositions = checkPositions.length;
    
    if (numCheckPositions > 15) {
      setTheoreticalProb(null);
      return;
    }

    const totalPermutations = binomial(totalComputers, honeypots);
    let caughtPermutations = 0;

    for (let mask = 1; mask < (1 << numCheckPositions); mask++) {
      let honeypotsAtPositions = 0;
      for (let i = 0; i < numCheckPositions; i++) {
        if (mask & (1 << i)) {
          honeypotsAtPositions++;
        }
      }
      
      if (honeypotsAtPositions > honeypots) continue;
      
      const remainingHoneypots = honeypots - honeypotsAtPositions;
      const remainingPositions = totalComputers - honeypotsAtPositions;
      const ways = binomial(remainingPositions, remainingHoneypots);
      
      if (honeypotsAtPositions % 2 === 1) {
        caughtPermutations += ways;
      } else {
        caughtPermutations -= ways;
      }
    }

    setTheoreticalProb(caughtPermutations / totalPermutations);
  }, [totalComputers, honeypots, numAttacks]);

  const runSimulation = async () => {
    setIsRunning(true);
    setResults(null);
    setConvergenceData([]);

    const checkPositions = Array.from({ length: numAttacks }, (_, i) => i * 2);
    let caughtCount = 0;
    let hackerWinsCount = 0;
    let inconclusiveCount = 0;

    const batchSize = 1000;
    const totalBatches = Math.ceil(numSimulations / batchSize);
    const dataPoints: Array<{ simulations: number; probability: number }> = [];

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min((batch + 1) * batchSize, numSimulations);

      // Run batch synchronously
      for (let sim = batchStart; sim < batchEnd; sim++) {
        const computers = [
          ...Array(honeypots).fill("H"),
          ...Array(victims).fill("V"),
        ];

        // Fisher-Yates shuffle
        for (let i = computers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [computers[i], computers[j]] = [computers[j], computers[i]];
        }

        let caught = false;
        let hackerWins = false;

        for (let i = 0; i < checkPositions.length; i++) {
          const pos = checkPositions[i];
          if (computers[pos] === "H") {
            caught = true;
            break;
          }
          if (computers[pos] === "V" && computers[pos + 1] === "H") {
            hackerWins = true;
            break;
          }
        }

        if (caught) {
          caughtCount++;
        } else if (hackerWins) {
          hackerWinsCount++;
        } else {
          inconclusiveCount++;
        }
      }

      // Update convergence data every batch
      const currentSim = batchEnd;
      dataPoints.push({
        simulations: currentSim,
        probability: caughtCount / currentSim,
      });

      setConvergenceData([...dataPoints]);

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    setResults({
      total: numSimulations,
      caught: caughtCount,
      hackerWins: hackerWinsCount,
      inconclusive: inconclusiveCount,
      probability: caughtCount / numSimulations,
    });
    setIsRunning(false);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded p-2 text-sm">
          <p className="text-slate-300">Simulations: {payload[0].payload.simulations.toLocaleString()}</p>
          <p className="text-yellow-400">Probability: {(payload[0].value * 100).toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h2 className="text-xl mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Monte Carlo Simulation
      </h2>

      <div className="space-y-4">
        <div className="bg-slate-900/50 rounded p-4">
          <label className="block text-sm text-slate-400 mb-2">
            Number of Simulations
          </label>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={numSimulations}
            onChange={(e) => setNumSimulations(Number(e.target.value))}
            className="w-full"
            disabled={isRunning}
          />
          <div className="flex items-center gap-3 mt-2">
            <input
              type="number"
              min="1000"
              max="1000000"
              step="1000"
              value={numSimulations}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1000 && value <= 1000000) {
                  setNumSimulations(value);
                }
              }}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-xl w-32"
              disabled={isRunning}
            />
            <div className="text-sm text-slate-500">
              (1,000 - 1,000,000)
            </div>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors"
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

        {convergenceData.length > 0 && (
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm text-slate-400 mb-3">Probability Convergence</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={convergenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="simulations"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                />
                <Tooltip content={<CustomTooltip />} />
                {theoreticalProb !== null && (
                  <ReferenceLine
                    y={theoreticalProb}
                    stroke="#3b82f6"
                    strokeDasharray="5 5"
                    label={{ value: 'Theoretical', position: 'right', fill: '#3b82f6', fontSize: 12 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="probability"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-slate-500 mt-2">
              Yellow line shows estimated probability converging over simulations
              {theoreticalProb !== null && (
                <span className="block">Blue dashed line shows theoretical probability ({(theoreticalProb * 100).toFixed(2)}%)</span>
              )}
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-400 mb-1">
                Total Simulations
              </div>
              <div className="text-2xl">
                {results.total.toLocaleString()}
              </div>
            </div>

            <div className="bg-yellow-900/20 rounded p-4 border border-yellow-500/30">
              <div className="text-sm text-slate-400 mb-1">
                Attacks Detected
              </div>
              <div className="text-2xl text-yellow-500">
                {results.caught.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                ({((results.caught / results.total) * 100).toFixed(2)}%)
              </div>
            </div>

            <div className="bg-purple-900/20 rounded p-4 border border-purple-500/30">
              <div className="text-sm text-slate-400 mb-1">
                Hacker Wins
              </div>
              <div className="text-2xl text-purple-500">
                {results.hackerWins.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                ({((results.hackerWins / results.total) * 100).toFixed(2)}%)
              </div>
            </div>

            {results.inconclusive > 0 && (
              <div className="bg-slate-900/50 rounded p-4 border border-slate-600">
                <div className="text-sm text-slate-400 mb-1">
                  Inconclusive
                </div>
                <div className="text-2xl text-slate-400">
                  {results.inconclusive.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  ({((results.inconclusive / results.total) * 100).toFixed(2)}%)
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 border border-green-500">
              <div className="text-sm text-slate-400 mb-1">
                Final Simulated Probability
              </div>
              <div className="text-3xl">
                {(results.probability * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-slate-300 mt-2">
                ≈ {results.probability.toFixed(6)}
              </div>
              {theoreticalProb !== null && (
                <div className="text-sm text-slate-400 mt-2">
                  Error from theoretical: {Math.abs((results.probability - theoreticalProb) * 100).toFixed(3)}%
                </div>
              )}
            </div>
          </div>
        )}

        {!results && !isRunning && (
          <div className="text-center text-slate-500 py-8">
            Click "Run Simulation" to verify the probability calculation
          </div>
        )}
      </div>
    </div>
  );
}