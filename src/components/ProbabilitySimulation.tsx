import React, { useState, useEffect } from "react";
import {
    PlayCircle,
    StopCircle,
    BarChart3,
    RotateCcw,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ProbabilitySimulationProps {
    totalComputers: number;
    honeypots: number;
    victims: number;
    numAttacks: number;
}

export function ProbabilitySimulation({
    totalComputers,
    honeypots,
    victims,
    numAttacks,
}: ProbabilitySimulationProps) {
    const [numSimulations, setNumSimulations] = useState(1000);
    const [isRunning, setIsRunning] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(100);
    const speedRef = React.useRef(simulationSpeed);

    useEffect(() => {
        speedRef.current = simulationSpeed;
    }, [simulationSpeed]);
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

        if (numCheckPositions > 25) {
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

            // Allow UI to update, controlled by speed
            const delay = Math.max(0, 100 - speedRef.current); // speedRef.current is 1-100, so 100-100=0 delay, 100-1=99 delay
            await new Promise(resolve => setTimeout(resolve, delay));
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
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
                        value={Math.min(numSimulations, 100000)}
                        onChange={(e) => setNumSimulations(Number(e.target.value))}
                        className="w-full"
                        disabled={isRunning}
                    />
                    <div className="flex items-center gap-3 mt-2">
                        <input
                            type="number"
                            min="1"
                            step="1000"
                            value={numSimulations}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                if (value >= 1) {
                                    setNumSimulations(value);
                                }
                            }}
                            className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-xl w-32"
                            disabled={isRunning}
                        />
                        <div className="text-sm text-slate-500">
                            (no limit - slider max: 100k)
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
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors"
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
                            setConvergenceData([]);
                            setIsRunning(false);
                        }}
                        disabled={isRunning || (!results && convergenceData.length === 0)}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors"
                        title="Reset Results"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

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
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Simulation Outcomes
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 text-center">
                                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Detection (Catch)</div>
                                <div className="text-xl font-bold text-yellow-500">{results.caught.toLocaleString()}</div>
                                <div className="text-xs text-yellow-500/70 mt-1">
                                    {((results.caught / results.total) * 100).toFixed(2)}%
                                </div>
                            </div>

                            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 text-center">
                                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Hacker Win</div>
                                <div className="text-xl font-bold text-purple-500">{results.hackerWins.toLocaleString()}</div>
                                <div className="text-xs text-purple-500/70 mt-1">
                                    {((results.hackerWins / results.total) * 100).toFixed(2)}%
                                </div>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-600 rounded p-3 text-center">
                                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Inconclusive</div>
                                <div className="text-xl font-bold text-slate-400">{results.inconclusive.toLocaleString()}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {((results.inconclusive / results.total) * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <div className="flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded p-3 border border-blue-500/30">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase">Calculated Probability</div>
                                    <div className="text-xs text-slate-500">P(Catch) = Caught / Total</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">
                                        {(results.probability * 100).toFixed(2)}%
                                    </div>
                                    {theoreticalProb !== null && (
                                        <div className="text-xs text-slate-400">
                                            Error: {Math.abs((results.probability - theoreticalProb) * 100).toFixed(3)}%
                                        </div>
                                    )}
                                </div>
                            </div>
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
