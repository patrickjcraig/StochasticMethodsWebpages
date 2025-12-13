import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Play, Pause, RotateCcw, ScanLine } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

export function PacketErrorSimulation() {
    // 100 packets represented by boolean (true = has error)
    const [packets, setPackets] = useState<boolean[]>(Array(100).fill(false));
    const [testedIndices, setTestedIndices] = useState<number[]>([]);
    const [detected, setDetected] = useState<boolean | null>(null);
    const [errorCount, setErrorCount] = useState(5);
    const [testCount, setTestCount] = useState(2);
    const [tolerance, setTolerance] = useState(0); // 0 means if any error found -> retransmit. 1 means if >1 error -> retransmit.

    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(10);
    const [stats, setStats] = useState({
        total: 0,
        caught: 0,
        missed: 0,
        valid: 0
    });
    const [convergenceData, setConvergenceData] = useState<Array<{ runs: number; safety: number }>>([]);

    // Validates local glitches for visual effect
    const [glitchIntensity, setGlitchIntensity] = useState(0);

    // Math Helpers
    const combination = (n: number, k: number): number => {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        if (k > n / 2) k = n - k;
        let res = 1;
        for (let i = 1; i <= k; i++) {
            res = res * (n - i + 1) / i;
        }
        return Math.round(res);
    };

    const theoreticalSafety = useMemo(() => {
        const N = 100; // Total Packets
        const K = errorCount; // Total Errors
        const n = testCount; // Sample Size
        const k = tolerance; // Allowed Errors

        if (K <= k) return 0; // If total errors are within tolerance, we never "catch" a bad batch because it's not bad.

        // We want 1 - P(No Retransmit)
        // No Retransmit means finding <= k errors in the sample.
        // P(X <= k) = sum(P(X=i)) for i=0 to k

        let probNoRetransmit = 0;
        const totalWays = combination(N, n);

        for (let i = 0; i <= k; i++) {
            // Ways to choose i errors from K available errors
            const waysError = combination(K, i);
            // Ways to choose (n-i) good packets from (N-K) available good packets
            const waysGood = combination(N - K, n - i);
            probNoRetransmit += (waysError * waysGood);
        }

        probNoRetransmit /= totalWays;
        return 1 - probNoRetransmit;

    }, [errorCount, testCount, tolerance]);


    // Helper to create packets (pure)
    const createPackets = useCallback((count: number) => {
        const newPackets = Array(100).fill(false);
        let placed = 0;
        while (placed < count) {
            const idx = Math.floor(Math.random() * 100);
            if (!newPackets[idx]) {
                newPackets[idx] = true;
                placed++;
            }
        }
        return newPackets;
    }, []);

    // Helper to pick test indices (pure)
    const pickTestIndices = useCallback((count: number) => {
        const tested: number[] = [];
        while (tested.length < count) {
            const idx = Math.floor(Math.random() * 100);
            if (!tested.includes(idx)) tested.push(idx);
        }
        return tested;
    }, []);

    // Initialize packets with random errors
    useEffect(() => {
        const p = createPackets(errorCount);
        setPackets(p);
        setTestedIndices([]);
        setDetected(null);
    }, []); // Only run once on mount

    const resetStats = () => {
        setStats({ total: 0, caught: 0, missed: 0, valid: 0 });
        setConvergenceData([]);
    };

    // Manual Reset / Generate
    const generateNewPackets = () => {
        const p = createPackets(errorCount);
        setPackets(p);
        setTestedIndices([]);
        setDetected(null);
        setGlitchIntensity(0.5);
        setTimeout(() => setGlitchIntensity(0), 300);
    };

    // Manual Test
    const runManualTest = () => {
        // Pick 'testCount' unique random packets
        const tested = pickTestIndices(testCount);
        setTestedIndices(tested);

        // Count errors in tested packets
        let errorFoundCount = 0;
        tested.forEach(idx => {
            if (packets[idx]) errorFoundCount++;
        });

        // Determine if retransmission is needed
        const retransmit = errorFoundCount > tolerance;
        setDetected(retransmit);
    };

    // Autoplay Step: The core logic of the Monte Carlo simulation
    const runSimulationStep = useCallback(() => {
        // 1. Generate local packets (simulating a transmission batch)
        // Some packets are randomly marked as 'corrupted' based on errorCount
        const newPackets = createPackets(errorCount);

        // 2. Test them (simulating random sampling quality control)
        // We pick 'testCount' random indices to check
        const tested = pickTestIndices(testCount);

        // 3. Logic: Check the Sample
        let errorFoundCount = 0;
        tested.forEach(idx => {
            if (newPackets[idx]) errorFoundCount++;
        });

        // If the number of errors found in the sample exceeds our tolerance (k),
        // we reject the batch and request retransmission.
        const retransmit = errorFoundCount > tolerance;

        // 4. Ground Truth Confirmation
        // We know the ACTUAL state of all 100 packets (God Mode).
        // A "Bad Batch" is one where total errors > tolerance, which SHOULD have been caught.
        const totalErrors = newPackets.filter(p => p).length;
        const isBadBatch = totalErrors > tolerance;

        // 5. Update Aggregate Statistics
        setStats(prev => {
            const s = { ...prev };
            s.total++; // Total batches transmitted

            if (retransmit) {
                // True Positive (we caught it) OR False Positive (wasteful retransmit, but still "safe")
                // For simplified metrics, we count this as "Caught/Safety Triggered"
                s.caught++;
            } else {
                if (isBadBatch) {
                    // False Negative: Use didn't retransmit, but the batch WAS bad. 
                    // This is a "Missed" detection (Safety Failure).
                    s.missed++;
                } else {
                    // True Negative: Batch was good, and we let it pass.
                    s.valid++;
                }
            }
            const newCaught = s.caught + (retransmit ? 1 : 0);
            const newMissed = s.missed + (!retransmit && isBadBatch ? 1 : 0);
            const newTotalErrors = newCaught + newMissed; // Total "Bad" events

            // Update convergence data occasionally to prevent state trashing
            if (s.total % 5 === 0) {
                const safetyRate = newTotalErrors > 0 ? (newCaught / newTotalErrors) : 0;
                setConvergenceData(prev => {
                    const newData = [...prev, { runs: s.total, safety: safetyRate }];
                    // Keep the chart performant by limiting points if it gets too large, 
                    // but for convergence we usually want history. Let's cap at 200 points sliding window 
                    // OR just let it grow if we expect < 2000 runs. 
                    // Let's implement a simple stride later if needed, for now just slice if huge.
                    if (newData.length > 200) {
                        // reducing resolution could be better but let's just keep last 200 for "Live" feel
                        return newData.slice(-200);
                    }
                    return newData;
                });
            }

            return s;
        });

        // 6. Update Visuals
        setPackets(newPackets);
        setTestedIndices(tested);
        setDetected(retransmit);

    }, [createPackets, pickTestIndices, errorCount, testCount, tolerance]);

    useEffect(() => {
        let interval: number;
        if (isAutoPlaying) {
            interval = window.setInterval(runSimulationStep, 1000 / simulationSpeed);
        }
        return () => clearInterval(interval);
    }, [isAutoPlaying, runSimulationStep, simulationSpeed]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setErrorCount(val);
        // If not playing, regenerate to show user new density immediately
        if (!isAutoPlaying) {
            const p = createPackets(val);
            setPackets(p);
            setTestedIndices([]);
            setDetected(null);
        }
        resetStats();
    };

    const handleTestCountChange = (val: number) => {
        setTestCount(val);
        resetStats();
    };

    const handleToleranceChange = (val: number) => {
        setTolerance(val);
        resetStats();
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mt-8 shadow-2xl overflow-hidden relative">
            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(-100%); opacity: 0.1; }
                    50% { opacity: 0.3; }
                    100% { transform: translateY(100%); opacity: 0.1; }
                }
                .scanline-effect {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(to bottom, transparent 40%, #06b6d4 50%, transparent 60%);
                    background-size: 100% 4px;
                    animation: scanline 2s linear infinite;
                    pointer-events: none;
                }
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
                .glitch-anim {
                    animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
                }
            `}</style>

            <div className="relative z-10">
                <h2 className="text-xl mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                            <ScanLine className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-bold">
                            Transmission Simulation
                        </span>
                    </div>
                    {stats.total > 0 && (
                        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-1 rounded-full border border-slate-700 backdrop-blur-sm">
                            <div className="text-xs text-slate-400">RUNS: <span className="text-white font-mono">{stats.total}</span></div>
                            <div className="h-4 w-px bg-slate-700"></div>
                            <div className="text-xs text-slate-400">SAFETY: <span className={`font-mono font-bold ${((stats.caught / stats.total) * 100) > 90 ? 'text-green-400' : 'text-orange-400'}`}>
                                {((stats.caught / Math.max(1, stats.caught + stats.missed)) * 100).toFixed(1)}%
                            </span></div>
                        </div>
                    )}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls Column */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Control Panel */}
                        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 space-y-6">
                            <div>
                                <label className="flex justify-between text-sm text-cyan-100/80 mb-2 font-medium">
                                    <span>Signal Noise (Errors)</span>
                                    <span className="font-mono text-cyan-400">{errorCount}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={errorCount}
                                    onChange={handleSliderChange}
                                    disabled={isAutoPlaying}
                                    className="w-full accent-cyan-500 h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="h-1 w-full bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-red-500/20 mt-1 rounded-full"></div>
                            </div>

                            <div>
                                <label className="flex justify-between text-sm text-cyan-100/80 mb-2 font-medium">
                                    <span>Transmission Speed</span>
                                    <span className="font-mono text-cyan-400">{simulationSpeed}x</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={simulationSpeed}
                                    onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                                    className="w-full accent-purple-500 h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Detection Protocol</label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 block mb-1">SAMPLE SIZE (n)</label>
                                        <input
                                            type="number" value={testCount}
                                            onChange={(e) => {
                                                const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                                                handleTestCountChange(val);
                                            }}
                                            disabled={isAutoPlaying}
                                            className="w-full bg-slate-800 border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 block mb-1">TOLERANCE (k)</label>
                                        <input
                                            type="number" value={tolerance}
                                            onChange={(e) => {
                                                const val = Math.min(testCount, Math.max(0, parseInt(e.target.value) || 0));
                                                handleToleranceChange(val);
                                            }}
                                            disabled={isAutoPlaying}
                                            className="w-full bg-slate-800 border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-3 py-2 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-blue-300">Theoretical Probability:</span>
                                    <span className="font-mono font-bold text-blue-400">{(theoreticalSafety * 100).toFixed(2)}%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {!isAutoPlaying ? (
                                    <>
                                        <button
                                            onClick={generateNewPackets}
                                            className="col-span-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-3 h-3" /> RESET
                                        </button>
                                        <button
                                            onClick={runManualTest}
                                            className="col-span-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                                        >
                                            <RefreshCw className="w-3 h-3" /> SCAN
                                        </button>
                                        <button
                                            onClick={() => setIsAutoPlaying(true)}
                                            className="col-span-2 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                                        >
                                            <Play className="w-4 h-4 fill-white" /> INITIATE AUTO-SCAN
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsAutoPlaying(false)}
                                        className="col-span-2 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 animate-pulse"
                                    >
                                        <Pause className="w-4 h-4 fill-white" /> ABORT SEQUENCE
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status Indicator */}
                        {detected !== null && (
                            <div className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-500 ${detected
                                ? 'bg-rose-950/40 border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.15)]'
                                : 'bg-emerald-950/40 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${detected ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                                        {detected ? <AlertTriangle className="w-6 h-6 text-rose-400" /> : <CheckCircle className="w-6 h-6 text-emerald-400" />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${detected ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {detected ? 'CORRUPTION DETECTED' : 'INTEGRITY CONFIRMED'}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            {detected
                                                ? 'Protocol violation. Requesting immediate packet retransmission.'
                                                : 'Sample verified. Transmission authorized.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Simulation Grid Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-black/40 rounded-xl p-1 border border-slate-800 shadow-inner relative overflow-hidden group">
                            {/* Decorative Grid Lines */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                            {/* Scanline Overlay */}
                            {isAutoPlaying && <div className="scanline-effect z-30"></div>}

                            <div className="grid grid-cols-10 gap-1.5 p-4 relative z-20">
                                {packets.map((isError, i) => {
                                    const isTested = testedIndices.includes(i);

                                    // Visual States
                                    let baseClass = "relative aspect-square rounded-[2px] transition-all duration-300 flex items-center justify-center";
                                    let content = null;

                                    if (isTested) {
                                        if (isError) {
                                            // TESTED BAD
                                            baseClass += " bg-rose-500 shadow-[0_0_15px_#f43f5e] scale-110 z-20 border border-rose-200 glitch-anim";
                                            content = <XCircle className="w-4 h-4 text-white" />;
                                        } else {
                                            // TESTED GOOD
                                            baseClass += " bg-cyan-500 shadow-[0_0_10px_#06b6d4] scale-105 z-10 border border-cyan-200";
                                            content = <CheckCircle className="w-3 h-3 text-white" />;
                                        }
                                    } else {
                                        if (isError) {
                                            // UNTESTED BAD (Slight hint for "God Mode" view, or keep hidden?)
                                            // Making it subtle dark red to indicate it exists but isn't flagged
                                            baseClass += " bg-slate-800 border border-slate-700/50 hover:border-rose-900/50";
                                            // Add a tiny dot to indicate corruption if we want 'God Mode'
                                            content = <div className="w-1 h-1 rounded-full bg-rose-900/40"></div>;
                                        } else {
                                            // UNTESTED GOOD
                                            baseClass += " bg-slate-800/80 border border-slate-700/30 hover:bg-slate-700";
                                        }
                                    }

                                    return (
                                        <div key={i} className={baseClass} style={{ animationDelay: `${Math.random() * 0.5}s` }}>
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Results Matrix */}
                        {stats.total > 0 && (
                            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                                <div className="text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">True Positive</div>
                                    <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.caught}</div>
                                </div>
                                <div className="text-center border-x border-slate-800">
                                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">False Negative</div>
                                    <div className="text-2xl font-bold text-rose-500 font-mono">{stats.missed}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Valid Pass</div>
                                    <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.valid}</div>
                                </div>
                            </div>
                        )}

                        {/* Convergence Plot */}
                        {convergenceData.length > 0 && (
                            <div className="bg-slate-900/50 rounded-lg p-4 mt-6 border border-slate-800">
                                <h3 className="text-sm text-slate-400 mb-3 uppercase tracking-widest">Safety Convergence</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={convergenceData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis
                                                dataKey="runs"
                                                stroke="#94a3b8"
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                tickFormatter={(val) => val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                                domain={[0, 1]}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                                labelStyle={{ color: '#94a3b8' }}
                                                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Safety Rate']}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            {theoreticalSafety > 0 && (
                                                <ReferenceLine
                                                    y={theoreticalSafety}
                                                    stroke="#f472b6"
                                                    strokeDasharray="5 5"
                                                    label={{
                                                        value: `Theoretical: ${(theoreticalSafety * 100).toFixed(1)}%`,
                                                        fill: '#f472b6',
                                                        position: 'insideTopRight',
                                                        fontSize: 12
                                                    }}
                                                />
                                            )}
                                            <Line
                                                name="Experimental"
                                                type="monotone"
                                                dataKey="safety"
                                                stroke="#22d3ee"
                                                strokeWidth={2}
                                                dot={false}
                                                isAnimationActive={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                    Graph shows the experimental safety verification rate over time.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-0 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-0 transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
    );
}
