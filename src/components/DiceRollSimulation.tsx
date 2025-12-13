import React, { useState, useEffect, useMemo } from 'react';
import { Dices, RefreshCw, Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function DiceRollSimulation() {
    const [numRolls, setNumRolls] = useState(13); // Default example M value
    const [target, setTarget] = useState<'gt4' | 'eq6'>('gt4');
    const [rolls, setRolls] = useState<number[]>([]);
    const [success, setSuccess] = useState(false);
    const [hasRun, setHasRun] = useState(false);
    const [showGraph, setShowGraph] = useState(false);

    // Autoplay
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(10);
    const [stats, setStats] = useState({ attempts: 0, successes: 0 });
    const [history, setHistory] = useState<Array<{ count: number; simulated: number; theoretical: number }>>([]);

    // Use ref for stats to avoid stale closures in setInterval without resetting it constantly
    const statsRef = React.useRef(stats);
    useEffect(() => {
        statsRef.current = stats;
    }, [stats]);

    // Reset when parameters change
    useEffect(() => {
        reset();
    }, [numRolls, target]);

    const runSimulation = () => {
        const newRolls = Array.from({ length: numRolls }, () => Math.floor(Math.random() * 6) + 1);
        setRolls(newRolls);

        // Check success
        const isSuccess = newRolls.some(r => {
            if (target === 'gt4') return r > 4; // 5 or 6
            if (target === 'eq6') return r === 6;
            return false;
        });

        setSuccess(isSuccess);
        setHasRun(true);

        // Update stats using Ref to ensure we always have latest values even inside interval
        const currentStats = statsRef.current;
        const newAttempts = currentStats.attempts + 1;
        const newSuccesses = currentStats.successes + (isSuccess ? 1 : 0);
        const newStats = { attempts: newAttempts, successes: newSuccesses };

        // Update Ref immediately so next tick sees it
        statsRef.current = newStats;
        setStats(newStats);

        const simulatedProb = newSuccesses / newAttempts;
        const pFail = target === 'gt4' ? 4 / 6 : 5 / 6;
        const theoreticalProb = 1 - Math.pow(pFail, numRolls);

        setHistory(prevHist => [
            ...prevHist,
            {
                count: newAttempts,
                simulated: simulatedProb,
                theoretical: theoreticalProb
            }
        ]);
    };

    useEffect(() => {
        let interval: number;
        if (isAutoPlaying) {
            interval = window.setInterval(runSimulation, 1000 / simulationSpeed);
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAutoPlaying, simulationSpeed, numRolls, target]); // Removed stats dependency to prevent interval reset

    const reset = () => {
        setStats({ attempts: 0, successes: 0 });
        setHistory([]);
        setIsAutoPlaying(false);
        setHasRun(false);
        setRolls([]);
        statsRef.current = { attempts: 0, successes: 0 };
    };

    const getDieFace = (val: number) => {
        return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1];
    };

    // Calculate theoretical for display
    const currentTheoretical = useMemo(() => {
        const pFail = target === 'gt4' ? 4 / 6 : 5 / 6;
        return 1 - Math.pow(pFail, numRolls);
    }, [target, numRolls]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <Dices className="w-5 h-5 text-purple-400" />
                Die Roll Simulation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
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

                <div>
                    <label className="block text-slate-300 mb-2">Success Criterion</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTarget('gt4')}
                            disabled={isAutoPlaying}
                            className={`px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 ${target === 'gt4' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                                }`}
                        >
                            &gt; 4 (5,6)
                        </button>
                        <button
                            onClick={() => setTarget('eq6')}
                            disabled={isAutoPlaying}
                            className={`px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 ${target === 'eq6' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                                }`}
                        >
                            = 6
                        </button>
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
                                const isHit = target === 'gt4' ? val > 4 : val === 6;
                                return (
                                    <div
                                        key={i}
                                        className={`w-10 h-10 flex items-center justify-center text-3xl rounded ${isHit ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-900/50 text-slate-500'
                                            }`}
                                    >
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

                        <button
                            onClick={() => setShowGraph(!showGraph)}
                            className="mb-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs py-2 px-4 rounded border border-slate-700 transition-colors flex items-center gap-2"
                        >
                            <Activity className="w-3 h-3" />
                            {showGraph ? 'Hide Convergence Graph' : 'View Convergence Graph'}
                        </button>

                        {showGraph && (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            dataKey="count"
                                            stroke="#94a3b8"
                                            label={{ value: 'Trials', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                                        />
                                        <YAxis
                                            domain={[0, 1]}
                                            stroke="#94a3b8"
                                            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

