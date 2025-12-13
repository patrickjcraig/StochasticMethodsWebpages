import React, { useState, useEffect, useMemo } from 'react';
import { Dices, RefreshCw, Play, Pause, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function DiceRollSimulation() {
    // State for number of dice rolls per trial (M)
    const [numRolls, setNumRolls] = useState(13); // Default example M value
    // State for the success condition: selected faces (default to > 4, i.e., 5 and 6)
    const [selectedFaces, setSelectedFaces] = useState<number[]>([5, 6]);

    // State for current batch of rolled dice values
    const [rolls, setRolls] = useState<number[]>([]);
    // State for whether the current trial was successful
    const [success, setSuccess] = useState(false);
    // State to track if at least one simulation has run
    const [hasRun, setHasRun] = useState(false);

    // Autoplay configuration state
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(10);

    // Aggregate statistics
    const [stats, setStats] = useState({ attempts: 0, successes: 0 });
    // History for graph plotting: keeps track of simulated vs theoretical probability over time
    const [history, setHistory] = useState<Array<{ count: number; simulated: number; theoretical: number }>>([]);

    // Use ref for stats to avoid stale closures in setInterval without resetting it constantly
    // This allows the interval callback to access the most recent stats without needing to be re-created on every render
    const statsRef = React.useRef(stats);
    useEffect(() => {
        statsRef.current = stats;
    }, [stats]);

    // Reset statistics when simulation parameters (rules) change
    useEffect(() => {
        reset();
    }, [numRolls, selectedFaces]);

    // Core simulation function: runs one trial (one set of M rolls)
    const runSimulation = () => {
        // Generate M random die rolls (1-6)
        const newRolls = Array.from({ length: numRolls }, () => Math.floor(Math.random() * 6) + 1);
        setRolls(newRolls);

        // Check if the trial is a success based on the target criteria
        // Success = at least one die meets the condition (Standard De Méré style problem)
        const isSuccess = newRolls.some(r => selectedFaces.includes(r));

        setSuccess(isSuccess);
        setHasRun(true);

        // Update stats using Ref to ensure we always have latest values even inside interval
        const currentStats = statsRef.current;
        const newAttempts = currentStats.attempts + 1;
        const newSuccesses = currentStats.successes + (isSuccess ? 1 : 0);
        const newStats = { attempts: newAttempts, successes: newSuccesses };

        // Update Ref immediately so next potentially rapid tick sees it
        statsRef.current = newStats;
        setStats(newStats);

        // Calculate experimental probability
        const simulatedProb = newSuccesses / newAttempts;

        // Calculate theoretical probability
        // Based on the Chevalier de Méré's problem logic:
        // P(At least one success) = 1 - P(No successes in any of the dice)
        // This is much easier than summing P(1 success) + P(2 successes) + ...
        // P(Single Die Fails) = (Total Faces - Target Faces) / Total Faces
        const pSuccessOne = selectedFaces.length / 6;
        const pFail = 1 - pSuccessOne;
        const theoreticalProb = 1 - Math.pow(pFail, numRolls);

        // Append to history for the graph
        setHistory(prevHist => [
            ...prevHist,
            {
                count: newAttempts,
                simulated: simulatedProb,
                theoretical: theoreticalProb
            }
        ]);
    };

    // Effect to handle auto-play interval
    useEffect(() => {
        let interval: number;
        if (isAutoPlaying) {
            interval = window.setInterval(runSimulation, 1000 / simulationSpeed);
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAutoPlaying, simulationSpeed, numRolls, selectedFaces]); // Removed stats dependency to prevent interval reset

    // Reset all state to initial values
    const reset = () => {
        setStats({ attempts: 0, successes: 0 });
        setHistory([]);
        setIsAutoPlaying(false);
        setHasRun(false);
        setRolls([]);
        statsRef.current = { attempts: 0, successes: 0 };
    };

    // Helper to convert number to dice face character
    const getDieFace = (val: number) => {
        return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1];
    };

    // Calculate theoretical probability for display in the UI (memoized for performance)
    const currentTheoretical = useMemo(() => {
        const pSuccessOne = selectedFaces.length / 6;
        const pFail = 1 - pSuccessOne;
        return 1 - Math.pow(pFail, numRolls);
    }, [selectedFaces, numRolls]);

    const toggleFace = (face: number) => {
        setSelectedFaces(prev => {
            if (prev.includes(face)) {
                return prev.filter(f => f !== face);
            } else {
                return [...prev, face].sort((a, b) => a - b);
            }
        });
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <Dices className="w-5 h-5 text-purple-400" />
                Die Roll Simulation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Inputs: Number of Rolls */}
                <div>
                    <label className="block text-slate-300 mb-2">Number of Rolls (M)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={numRolls}
                            onChange={(e) => setNumRolls(parseInt(e.target.value))}
                            disabled={isAutoPlaying}
                            className="flex-1 disabled:opacity-50"
                        />
                        <span className="text-xl font-bold w-8 text-center">{numRolls}</span>
                    </div>
                </div>

                {/* Inputs: Success Criterion */}
                <div>
                    <label className="block text-slate-300 mb-2">Success Faces (Select Multiple)</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map(face => (
                            <button
                                key={face}
                                onClick={() => toggleFace(face)}
                                disabled={isAutoPlaying}
                                className={`w-10 h-10 rounded text-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center ${selectedFaces.includes(face)
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                    }`}
                            >
                                {getDieFace(face)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
                {/* Speed Control */}
                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded">
                    <span className="text-xs text-slate-400 w-12">Speed</span>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 w-8 text-right">{simulationSpeed}x</span>
                </div>

                {/* Simulation Control Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={runSimulation}
                        disabled={isAutoPlaying}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Roll Once
                    </button>
                    <button
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${isAutoPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isAutoPlaying ? 'Stop Auto' : 'Start Auto'}
                    </button>
                    <button
                        onClick={reset}
                        className="px-4 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
                        title="Reset"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {hasRun && (
                <div className="space-y-6">
                    {/* Current Roll Visualization */}
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400 mb-2">Current Roll Outcomes</div>
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                            {rolls.map((val, i) => {
                                const isHit = selectedFaces.includes(val);
                                return (
                                    <div
                                        key={i}
                                        className={`w-10 h-10 flex items-center justify-center text-3xl rounded ${isHit ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-900/50 text-slate-500'
                                            }`}
                                    >
                                        {/* Display unicode die face */}
                                        {getDieFace(val)}
                                    </div>
                                );
                            })}
                        </div>
                        <div className={`p-2 rounded text-center border ${success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'
                            }`}>
                            <span className={success ? 'text-green-400' : 'text-red-400'}>
                                {success ? 'Success!' : 'Failure'}
                            </span>
                            <span className="text-slate-400 text-sm ml-2">
                                ({success ? 'Criteria met' : 'Criteria not met'})
                            </span>
                        </div>
                    </div>

                    {/* Stats & Chart */}
                    <div className="bg-slate-900/50 rounded p-4">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-lg text-slate-200">Probability Convergence</h3>
                                <div className="text-sm text-slate-400">Attempts: {stats.attempts}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">Current P(Success)</div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {(stats.attempts > 0 ? (stats.successes / stats.attempts * 100) : 0).toFixed(2)}%
                                </div>
                                <div className="text-xs text-green-400">
                                    Theoretical: {(currentTheoretical * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        {/* Convergence Graph - Displays while running and after */}
                        {history.length > 0 && (
                            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                                <h3 className="text-sm text-slate-400 mb-3">Probability Convergence</h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={history}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis
                                                dataKey="count"
                                                stroke="#94a3b8"
                                                tickFormatter={(val) => val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}
                                                fontSize={12}
                                            />
                                            <YAxis
                                                domain={[0, 1]}
                                                stroke="#94a3b8"
                                                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                                                formatter={(val: number) => [(val * 100).toFixed(2) + '%', 'Probability']}
                                                labelFormatter={(label) => `Trial: ${label}`}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="simulated"
                                                stroke="#3b82f6"
                                                dot={false}
                                                strokeWidth={2}
                                                name="Simulated"
                                                isAnimationActive={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="theoretical"
                                                stroke="#4ade80"
                                                strokeDasharray="5 5"
                                                dot={false}
                                                name="Theoretical"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                    Blue line shows experimental probability converging to green theoretical line.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
