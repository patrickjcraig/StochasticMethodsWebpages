import React, { useState, useEffect } from 'react';
import { Dices, RefreshCw, Play, Pause, RotateCcw } from 'lucide-react';

export function DiceRollSimulation() {
    const [numRolls, setNumRolls] = useState(13); // Default example M value
    const [target, setTarget] = useState<'gt4' | 'eq6'>('gt4');
    const [rolls, setRolls] = useState<number[]>([]);
    const [success, setSuccess] = useState(false);
    const [hasRun, setHasRun] = useState(false);

    // Autoplay
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(10);
    const [stats, setStats] = useState({ attempts: 0, successes: 0 });

    const runSimulation = () => {
        const newRolls = Array.from({ length: numRolls }, () => Math.floor(Math.random() * 6) + 1);
        setRolls(newRolls);

        // Check success
        // Success = at least one outcome meeting the criterion
        const isSuccess = newRolls.some(r => {
            if (target === 'gt4') return r > 4; // 5 or 6
            if (target === 'eq6') return r === 6;
            return false;
        });

        setSuccess(isSuccess);
        setHasRun(true);

        if (isAutoPlaying) {
            setStats(prev => ({
                attempts: prev.attempts + 1,
                successes: prev.successes + (isSuccess ? 1 : 0)
            }));
        }
    };

    useEffect(() => {
        let interval: number;
        if (isAutoPlaying) {
            interval = window.setInterval(runSimulation, 1000 / simulationSpeed);
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAutoPlaying, simulationSpeed, numRolls, target]);

    const reset = () => {
        setStats({ attempts: 0, successes: 0 });
        setIsAutoPlaying(false);
        setHasRun(false);
        setRolls([]);
    };

    const getDieFace = (val: number) => {
        return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1];
    };

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
                </div>
            </div>

            {stats.attempts > 0 && (
                <div className="bg-slate-900/50 rounded p-4 mb-6 text-sm text-slate-300 flex justify-between">
                    <span>Total Runs: {stats.attempts}</span>
                    <span>Success Rate: {((stats.successes / stats.attempts) * 100).toFixed(2)}%</span>
                    <button onClick={reset} className="text-slate-500 hover:text-white"><RotateCcw className="w-4 h-4" /></button>
                </div>
            )}

            {hasRun && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 justify-center">
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

                    <div className={`p-4 rounded-lg text-center border ${success ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'
                        }`}>
                        <div className="text-xl font-bold mb-1">
                            {success ? 'Success!' : 'Failure'}
                        </div>
                        <div className="text-sm opacity-80">
                            {success
                                ? `At least one roll was ${target === 'gt4' ? '> 4' : '6'}`
                                : `No rolls met the criterion ${target === 'gt4' ? '> 4' : '6'}`
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
