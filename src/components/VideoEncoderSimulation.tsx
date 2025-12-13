import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Pause, Video } from 'lucide-react';

export function VideoEncoderSimulation() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [packetCounts, setPacketCounts] = useState<{ [key: number]: number }>({
        100: 0,
        200: 0,
        300: 0,
        400: 0,
        500: 0
    });
    const [totalPackets, setTotalPackets] = useState(0);
    const [recentPackets, setRecentPackets] = useState<number[]>([]);
    const [simulationSpeed, setSimulationSpeed] = useState(20);

    // Theoretical probabilities
    const theory = {
        100: 0.50,
        200: 0.25,
        300: 0.125,
        400: 0.0625,
        500: 0.0625
    };

    const generatePacket = () => {
        const r = Math.random();
        let length = 500;
        if (r < 0.5) length = 100;
        else if (r < 0.75) length = 200;
        else if (r < 0.875) length = 300;
        else if (r < 0.9375) length = 400;

        setPacketCounts(prev => ({
            ...prev,
            [length]: prev[length] + 1
        }));
        setTotalPackets(prev => prev + 1);
        setRecentPackets(prev => [length, ...prev].slice(0, 20));
    };

    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            interval = window.setInterval(generatePacket, 1000 / simulationSpeed);
        }
        return () => clearInterval(interval);
    }, [isPlaying, simulationSpeed]);

    const reset = () => {
        setIsPlaying(false);
        setPacketCounts({ 100: 0, 200: 0, 300: 0, 400: 0, 500: 0 });
        setTotalPackets(0);
        setRecentPackets([]);
    };

    // Calculate Event Stats
    const getEventProb = (predicate: (l: number) => boolean) => {
        if (totalPackets === 0) return 0;
        const count = Object.entries(packetCounts).reduce((acc, [len, count]) => {
            return predicate(Number(len)) ? acc + count : acc;
        }, 0);
        return count / totalPackets;
    };

    const stats = {
        J: getEventProb(l => l >= 300),                         // J: Length >= 300
        K: getEventProb(l => l % 200 === 0),                    // K: Multiple of 200
        JandK: getEventProb(l => l >= 300 && l % 200 === 0),    // J ∩ K
        notJandK: getEventProb(l => l < 300 && l % 200 === 0),  // J̄ ∩ K
        JorK: getEventProb(l => l >= 300 || l % 200 === 0)      // J ∪ K
    };

    const theoreticalStats = {
        J: 0.25,
        K: 0.3125,
        JandK: 0.0625,
        notJandK: 0.25,
        JorK: 0.5
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                Video Encoder Simulation
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors w-full ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isPlaying ? 'Pause' : 'Start'}
                            </button>
                            <button
                                onClick={reset}
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors w-full"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>

                        <div className="flex flex-col justify-center col-span-2 sm:col-span-1 bg-slate-900/50 p-2 rounded">
                            <label className="text-xs text-slate-400 flex justify-between mb-1">
                                <span>Speed</span>
                                <span>{simulationSpeed}x</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={simulationSpeed}
                                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                                className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="col-span-2 flex items-center bg-slate-900/50 px-3 py-1 rounded text-sm text-slate-400 justify-between">
                            <span>Packets:</span>
                            <span className="text-white font-mono">{totalPackets.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Packet Distribution Bars */}
                    <div className="space-y-3 mb-8">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Packet Length Distribution</h3>
                        {[100, 200, 300, 400, 500].map(length => {
                            const count = packetCounts[length];
                            const percentage = totalPackets > 0 ? (count / totalPackets) * 100 : 0;
                            const theoryPct = theory[length as keyof typeof theory] * 100;

                            return (
                                <div key={length} className="relative">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">L = {length}</span>
                                        <div className="flex gap-3">
                                            <span className="text-slate-300">{percentage.toFixed(1)}%</span>
                                            <span className="text-slate-500">(Theory: {theoryPct}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10"
                                            style={{ left: `${theoryPct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Visual Stream */}
                    <div className="bg-slate-900/50 rounded-lg p-4 overflow-hidden">
                        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Live Packet Stream</h3>
                        <div className="flex gap-2 min-h-[40px] items-center">
                            {recentPackets.map((len, i) => (
                                <div
                                    key={i}
                                    className={`
                                        h-8 rounded flex items-center justify-center text-[10px] font-bold text-white/90 shrink-0 transition-all
                                        ${i === 0 ? 'scale-110 shadow-lg' : 'opacity-70'}
                                        ${len === 100 ? 'bg-slate-600 w-8' : ''}
                                        ${len === 200 ? 'bg-blue-600 w-12' : ''}
                                        ${len === 300 ? 'bg-indigo-600 w-16' : ''}
                                        ${len === 400 ? 'bg-purple-600 w-20' : ''}
                                        ${len === 500 ? 'bg-pink-600 w-24' : ''}
                                    `}
                                >
                                    {len}
                                </div>
                            ))}
                            {recentPackets.length === 0 && (
                                <span className="text-slate-600 text-sm italic">Waiting for packets...</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Panel */}
                <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-slate-300 font-semibold mb-4">Event Probabilities (Experimental vs. Theoretical)</h3>

                    <div className="space-y-4">
                        <StatsRow
                            label="P(J): Length ≥ 300"
                            current={stats.J}
                            target={theoreticalStats.J}
                            color="text-blue-400"
                        />
                        <StatsRow
                            label="P(K): Multiple of 200"
                            current={stats.K}
                            target={theoreticalStats.K}
                            color="text-green-400"
                        />
                        <StatsRow
                            label="P(J ∩ K)"
                            current={stats.JandK}
                            target={theoreticalStats.JandK}
                            color="text-purple-400"
                        />
                        <StatsRow
                            label="P(J̄ ∩ K)"
                            current={stats.notJandK}
                            target={theoreticalStats.notJandK}
                            color="text-orange-400"
                        />
                        <StatsRow
                            label="P(J ∪ K)"
                            current={stats.JorK}
                            target={theoreticalStats.JorK}
                            color="text-pink-400"
                        />
                    </div>

                    <div className="mt-6 text-xs text-slate-500 p-3 bg-slate-800/50 rounded border border-slate-700/50">
                        <p>
                            As n gets larger, the experimental probabilities will converge to the theoretical values (Law of Large Numbers).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsRow({ label, current, target, color }: { label: string, current: number, target: number, color: string }) {
    const percent = (current * 100).toFixed(2);
    const targetPercent = (target * 100).toFixed(2);
    const diff = Math.abs(current - target);

    // Calculate accuracy for color coding
    const isAccurate = diff < 0.01;
    const isClose = diff < 0.05;

    return (
        <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 last:border-0">
            <div className={color}>{label}</div>
            <div className="text-right">
                <div className="text-white font-mono">{percent}%</div>
                <div className="text-xs text-slate-500">Target: {targetPercent}%</div>
            </div>
        </div>
    );
}
