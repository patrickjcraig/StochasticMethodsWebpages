import React, { useState, useEffect, useCallback } from 'react';
import { Package, RefreshCw, AlertTriangle, CheckCircle, XCircle, Play, Pause, RotateCcw, Table } from 'lucide-react';

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

    // Manual Reset / Generate
    const generateNewPackets = () => {
        const p = createPackets(errorCount);
        setPackets(p);
        setTestedIndices([]);
        setDetected(null);
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

    // Autoplay Step
    const runSimulationStep = useCallback(() => {
        // 1. Generate local packets
        const newPackets = createPackets(errorCount);
        // 2. Test them
        const tested = pickTestIndices(testCount);

        // 3. Logic
        let errorFoundCount = 0;
        tested.forEach(idx => {
            if (newPackets[idx]) errorFoundCount++;
        });
        const retransmit = errorFoundCount > tolerance;

        // 4. Ground Truth
        const totalErrors = newPackets.filter(p => p).length;
        const isBadBatch = totalErrors > tolerance;

        // 5. Update Stats
        setStats(prev => {
            const s = { ...prev };
            s.total++;
            if (retransmit) {
                s.caught++;
            } else {
                if (isBadBatch) s.missed++;
                else s.valid++;
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
    };

    const resetStats = () => {
        setStats({ total: 0, caught: 0, missed: 0, valid: 0 });
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Transmission Simulation
                </div>
                {stats.total > 0 && (
                    <div className="text-sm font-mono text-slate-400">
                        Runs: {stats.total} | Caught: {((stats.caught / stats.total) * 100).toFixed(1)}%
                    </div>
                )}
            </h2>

            <div className="mb-6 space-y-4">
                <div>
                    <label className="block text-slate-300 mb-2 flex justify-between">
                        <span>Error Packets (Corrupted)</span>
                        <span>{errorCount} / 100</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={errorCount}
                        onChange={handleSliderChange}
                        disabled={isAutoPlaying}
                        className="w-full disabled:opacity-50"
                    />
                </div>

                {/* Speed Control */}
                <div>
                    <label className="block text-slate-300 mb-2 flex justify-between">
                        <span>Simulation Speed</span>
                        <span>{simulationSpeed}x</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                        className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Slow</span>
                        <span>Fast</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 bg-slate-700/30 p-2 rounded border border-slate-600">
                        <label className="text-xs text-slate-300 font-semibold uppercase">Test Strategy</label>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] text-slate-400">Sample Size (n)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={testCount}
                                    onChange={(e) => {
                                        const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                                        setTestCount(val);
                                        setTestedIndices([]);
                                        setDetected(null);
                                    }}
                                    disabled={isAutoPlaying}
                                    className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] text-slate-400">Tolerance (k)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={testCount}
                                    value={tolerance}
                                    onChange={(e) => {
                                        const val = Math.min(testCount, Math.max(0, parseInt(e.target.value) || 0));
                                        setTolerance(val);
                                        setTestedIndices([]);
                                        setDetected(null);
                                    }}
                                    disabled={isAutoPlaying}
                                    className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs"
                                />
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            Reject if &gt; {tolerance} errors found in {testCount} packets.
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isAutoPlaying ? (
                            <>
                                <button
                                    onClick={generateNewPackets}
                                    className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400"
                                    title="Regenerate Packets"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={runManualTest}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded transition-colors text-sm"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Test Packets
                                </button>
                                <button
                                    onClick={() => setIsAutoPlaying(true)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-1 rounded transition-colors text-sm"
                                >
                                    <Play className="w-3 h-3" />
                                    Autoplay
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsAutoPlaying(false)}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-1 rounded transition-colors text-sm animate-pulse"
                            >
                                <Pause className="w-3 h-3" />
                                Stop Sim
                            </button>
                        )}
                    </div>
                </div>

                {/* Metrics Dashboard */}
                {stats.total > 0 && (
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <Table className="w-4 h-4" />
                            Results Truth Table (Confusion Matrix)
                        </h3>

                        <div className="grid grid-cols-3 gap-1 text-xs md:text-sm">
                            {/* Header Row */}
                            <div className="p-2"></div>
                            <div className="bg-slate-800/80 p-2 rounded text-center font-semibold text-slate-300">
                                Detected: Good<br />
                                <span className="text-[10px] font-normal text-slate-500">(Acception)</span>
                            </div>
                            <div className="bg-slate-800/80 p-2 rounded text-center font-semibold text-slate-300">
                                Detected: Bad<br />
                                <span className="text-[10px] font-normal text-slate-500">(Retransmission)</span>
                            </div>

                            {/* Row 1: Actual Good */}
                            <div className="bg-slate-800/80 p-2 rounded flex flex-col justify-center">
                                <span className="font-semibold text-slate-300">Actual: Good Batch</span>
                                <span className="text-[10px] text-slate-500">Errors ≤ Tolerance</span>
                            </div>

                            {/* True Negative */}
                            <div className="bg-green-900/20 border border-green-500/30 p-2 rounded flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-green-400">{stats.valid}</span>
                                <span className="text-[10px] uppercase tracking-wider text-green-300/70">True Negative</span>
                            </div>

                            {/* False Positive (Always 0 per logic, but shown for completeness) */}
                            <div className="bg-slate-800/50 border border-slate-700 p-2 rounded flex flex-col items-center justify-center opacity-50">
                                <span className="text-xl font-bold text-slate-400">0</span>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">False Positive</span>
                            </div>

                            {/* Row 2: Actual Bad */}
                            <div className="bg-slate-800/80 p-2 rounded flex flex-col justify-center">
                                <span className="font-semibold text-slate-300">Actual: Bad Batch</span>
                                <span className="text-[10px] text-slate-500">Errors &gt; Tolerance</span>
                            </div>

                            {/* False Negative */}
                            <div className="bg-red-900/20 border border-red-500/30 p-2 rounded flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-red-400">{stats.missed}</span>
                                <span className="text-[10px] uppercase tracking-wider text-red-300/70">False Negative</span>
                            </div>

                            {/* True Positive */}
                            <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-blue-400">{stats.caught}</span>
                                <span className="text-[10px] uppercase tracking-wider text-blue-300/70">True Positive (Catch)</span>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                            <div>
                                Safety (Catch Rate): <span className="text-blue-400 font-bold">{stats.total > 0 ? ((stats.caught / (stats.caught + stats.missed || 1)) * 100).toFixed(1) : 0}%</span> (of bad batches)
                            </div>
                            <div>
                                Efficiency: <span className="text-green-400 font-bold">{stats.total > 0 ? (((stats.valid) / stats.total) * 100).toFixed(1) : 0}%</span> (good batches passed)
                            </div>
                        </div>
                    </div>
                )}
                {stats.total > 0 && !isAutoPlaying && (
                    <button onClick={resetStats} className="text-xs text-slate-500 hover:text-slate-300 underline w-full text-right">Reset Stats</button>
                )}
            </div>

            <div className="mb-6">
                <div className="grid grid-cols-10 gap-1 md:gap-2">
                    {packets.map((isError, i) => {
                        const isTested = testedIndices.includes(i);
                        let bgClass = isError ? 'bg-red-900/40' : 'bg-slate-700';
                        let borderClass = 'border-transparent';

                        if (isTested) {
                            borderClass = 'border-yellow-400';
                            if (isError) bgClass = 'bg-red-500';
                            else bgClass = 'bg-green-500';
                        }

                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded-sm border-2 ${bgClass} ${borderClass} transition-all duration-300 flex items-center justify-center`}
                                title={`Packet ${i + 1} ${isError ? '(Corrupted)' : '(Good)'}`}
                            >
                                {isTested && (
                                    isError ? <XCircle className="w-3 h-3 text-white" /> : <CheckCircle className="w-3 h-3 text-white" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {detected !== null && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${detected ? 'bg-red-900/30 border border-red-500/50' : 'bg-green-900/30 border border-green-500/50'
                    }`}>
                    {detected ? (
                        <>
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <div>
                                <div className="font-bold text-red-300">Errors Detected!</div>
                                <div className="text-sm text-red-200/70">Retransmission requested.</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <div>
                                <div className="font-bold text-green-300">Transmission Accepted</div>
                                <div className="text-sm text-green-200/70">Sampled packets passed checks.</div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
