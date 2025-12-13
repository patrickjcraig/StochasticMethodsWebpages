import React, { useState, useEffect } from "react";
import {
    PlayCircle,
    StopCircle,
    BarChart3,
    RotateCcw,
    ShieldCheck,
    ShieldAlert
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// Define the props interface for the component
// These props control the parameters of the simulation
interface ProbabilitySimulationProps {
    totalComputers: number; // Total number of computers in the network
    honeypots: number;      // Number of honeypots (traps) in the network
    victims: number;        // Number of real victim computers (totalComputers - honeypots)
    numAttacks: number;     // Number of computers the hacker will attack
    theoreticalProbability?: number; // The theoretical probability calculated by the parent
}

export function ProbabilitySimulation({
    totalComputers,
    honeypots,
    victims,
    numAttacks,
    theoreticalProbability,
}: ProbabilitySimulationProps) {
    // State to track the number of simulations to run (user configurable)
    const [numSimulations, setNumSimulations] = useState(1000);
    // State to track if the simulation is currently running
    const [isRunning, setIsRunning] = useState(false);
    // State for the simulation speed (visual delay between batches)
    const [simulationSpeed, setSimulationSpeed] = useState(100);
    // Ref to access the latest speed value inside the async loop layout closures
    const speedRef = React.useRef(simulationSpeed);

    // Keep the speed ref in sync with the state
    useEffect(() => {
        speedRef.current = simulationSpeed;
    }, [simulationSpeed]);

    // State to store the final results of the simulation run
    const [results, setResults] = useState<{
        total: number;
        caught: number;
        missed: number; // Replaced hackerWins/inconclusive with simple Missed (Safe)
        probability: number;
    } | null>(null);

    // State to store data for the convergence graph (showing how probability stabilizes over time)
    const [convergenceData, setConvergenceData] = useState<Array<{ simulations: number; probability: number }>>([]);
    // State to store the theoretically calculated probability for comparison
    // State to store the theoretically calculated probability for comparison
    const theoreticalProb = theoreticalProbability ?? null;

    // Main function to run the Monte Carlo simulation
    const runSimulation = async () => {
        setIsRunning(true);
        setResults(null);
        setConvergenceData([{ simulations: 0, probability: 0 }]);

        // Define which positions (indexes) the attacker checks (e.g., 0, 2, 4...)
        const checkPositions = Array.from({ length: numAttacks }, (_, i) => i * 2);
        let caughtCount = 0;
        let missedCount = 0;

        // We run simulations in batches to avoid blocking the UI thread and to allow for animation
        const batchSize = 1000;
        const totalBatches = Math.ceil(numSimulations / batchSize);
        const dataPoints: Array<{ simulations: number; probability: number }> = [{ simulations: 0, probability: 0 }];

        // Calculate correct number of victims to ensure N is consistent
        const safeComputers = Math.max(0, totalComputers - honeypots);

        // Loop through all batches
        for (let batch = 0; batch < totalBatches; batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min((batch + 1) * batchSize, numSimulations);

            // Run iterations for the current batch synchronously
            for (let sim = batchStart; sim < batchEnd; sim++) {
                // Construct the network array: H for honeypot, V for victim (safe)
                const computers = [
                    ...Array(honeypots).fill("H"),
                    ...Array(safeComputers).fill("V"),
                ];

                // Fisher-Yates shuffle algorithm to randomize the positions of Honeypots and Victims
                for (let i = computers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [computers[i], computers[j]] = [computers[j], computers[i]];
                }

                let caught = false;

                // Check if any of the attacked positions contain a honeypot.
                // If even one honeypot is hit (at the first index of a pair), the attack is considered DETECTED.
                // However, if the hacker Wins (V, H) before being caught, the game ends and they are NOT caught.
                for (let i = 0; i < checkPositions.length; i++) {
                    const pos = checkPositions[i];

                    // Bounds check
                    if (pos >= computers.length) break;

                    // Check if we hit a honeypot at this position (first of pair) - CAUGHT
                    if (computers[pos] === "H") {
                        caught = true;
                        break;
                    }

                    // Check if Hacker Wins (V at first, H at second) - GAME OVER (Not Caught)
                    if (pos + 1 < computers.length && computers[pos] === "V" && computers[pos + 1] === "H") {
                        break; // Hacker wins, loop ends, caught remains false
                    }
                }

                // Increment the counter based on the outcome
                if (caught) {
                    caughtCount++;
                } else {
                    missedCount++;
                }
            }

            // Update convergence data after every batch
            const currentSim = batchEnd;
            dataPoints.push({
                simulations: currentSim,
                probability: caughtCount / currentSim,
            });

            // Update state to trigger a re-render of the graph
            setConvergenceData([...dataPoints]);

            // Introduce a delay to allow the UI to update, controlled by the speed slider
            // Higher speed = lower delay
            const delay = Math.max(0, 100 - speedRef.current);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Finalize results after all batches are complete
        setResults({
            total: numSimulations,
            caught: caughtCount,
            missed: missedCount,
            probability: caughtCount / numSimulations,
        });
        setIsRunning(false);
    };

    // Custom tooltip for the Recharts graph
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
                {/* Convergence Graph - Displays while running and after */}


                {/* Simulation Control Panel */}
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

                {/* Speed Control UI */}
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

                {/* Convergence Graph - Displays while running and after */}


                {/* Convergence Graph - Displays while running and after */}
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

                {/* Simulation Final Results - Displays after completion */}
                {results && (
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Simulation Outcomes
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Attack Detected Stats */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <ShieldCheck className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Attack Detected</div>
                                <div className="text-2xl font-bold text-yellow-500">{results.caught.toLocaleString()}</div>
                                <div className="text-xs text-yellow-500/70 mt-1">
                                    {((results.caught / results.total) * 100).toFixed(2)}%
                                </div>
                            </div>

                            {/* Attack Missed Stats */}
                            <div className="bg-slate-800/50 border border-slate-600 rounded p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <ShieldAlert className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Attack Missed</div>
                                <div className="text-2xl font-bold text-slate-400">{results.missed.toLocaleString()}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {((results.missed / results.total) * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        {/* Calculated Probability Display */}
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

                {/* Initial State Message */}
                {!results && !isRunning && (
                    <div className="text-center text-slate-500 py-8">
                        Click "Run Simulation" to verify the probability calculation
                    </div>
                )}
            </div>
        </div>
    );
}
