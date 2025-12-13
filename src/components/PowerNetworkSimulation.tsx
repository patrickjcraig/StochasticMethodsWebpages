import { useState, useEffect } from 'react';
import { Play, RotateCcw, Pause, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface PowerNetworkSimulationProps {
    pL1: number;
    pL2: number;
    pL3: number;
    pL4: number;
    pL6: number;
    pL5GivenL6: number;
    pL5GivenNotL6: number;
    theoreticalProb: number;
}

const LineViz = ({ status, label, compact }: { status: boolean | undefined, label: string, compact?: boolean }) => (
    <div className={`
    relative flex items-center justify-center border-2 rounded-lg transition-colors duration-200
    ${status === undefined ? 'border-slate-700 bg-slate-800' :
            status ? 'border-green-500 bg-green-900/30' : 'border-red-500 bg-red-900/30'}
    ${compact ? 'w-10 h-8 text-xs' : 'w-12 h-12 text-sm'}
  `}>
        <span className={`font-bold ${status ? 'text-green-400' : status === false ? 'text-red-400' : 'text-slate-500'}`}>
            {label}
        </span>
    </div>
);

export function PowerNetworkSimulation({
    pL1, pL2, pL3, pL4, pL6,
    pL5GivenL6, pL5GivenNotL6,
    theoreticalProb
}: PowerNetworkSimulationProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [simulationCount, setSimulationCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);
    const [currentStatus, setCurrentStatus] = useState<{ [key: string]: boolean } | null>(null);
    const [convergenceData, setConvergenceData] = useState<Array<{ simulations: number; probability: number }>>([]);
    const [simulationSpeed, setSimulationSpeed] = useState(20);

    // Reset when props change
    useEffect(() => {
        reset();
    }, [pL1, pL2, pL3, pL4, pL6, pL5GivenL6, pL5GivenNotL6]);

    const runStep = () => {
        // Determine status of each line
        const l1 = Math.random() < pL1;
        const l2 = Math.random() < pL2;
        const l3 = Math.random() < pL3;
        const l4 = Math.random() < pL4;
        const l6 = Math.random() < pL6;

        // L5 depends on L6
        const pL5 = l6 ? pL5GivenL6 : pL5GivenNotL6;
        const l5 = Math.random() < pL5;

        // Check paths
        // Path 1: (L1 || L2) && L3
        const path1 = (l1 || l2) && l3;

        // Path 2: L4 && (L5 || L6)
        const path2 = l4 && (l5 || l6);

        const success = path1 || path2;

        setSimulationCount(prev => {
            const newCount = prev + 1;
            const newSuccess = successCount + (success ? 1 : 0);
            setSuccessCount(newSuccess);

            // Update convergence data every 10 samples approx, or less frequently for performance
            if (newCount % 10 === 0 || newCount < 100) {
                setConvergenceData(prevData => {
                    const newData = [...prevData, { simulations: newCount, probability: newSuccess / newCount }];
                    // Keep array size manageable
                    if (newData.length > 100) return newData.slice(-100);
                    return newData;
                });
            }
            return newCount;
        });

        setCurrentStatus({ l1, l2, l3, l4, l5, l6, success });
    };

    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            // Run multiple steps per interval for speed
            interval = window.setInterval(() => {
                for (let i = 0; i < 10; i++) runStep();
            }, 1000 / simulationSpeed);
        }
        return () => clearInterval(interval);
    }, [isPlaying, successCount, simulationSpeed]); // dependence on successCount is indirect via runStep closure if not careful, but setState uses functional update

    const reset = () => {
        setIsPlaying(false);
        setSimulationCount(0);
        setSuccessCount(0);
        setCurrentStatus(null);
        setConvergenceData([]);
    };

    const experimentalProb = simulationCount > 0 ? successCount / simulationCount : 0;

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Power Network Simulation
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
                            <span>Runs:</span>
                            <span className="text-white font-mono">{simulationCount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Network Visualization */}
                    <div className="bg-slate-900/50 rounded-lg p-4 relative flex flex-col items-center justify-center min-h-[300px]">

                        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
                            <div className={`${currentStatus?.success ? 'text-green-400 font-bold' : 'text-slate-500'}`}>
                                {currentStatus?.success ? '⚡ POWER ON' : '🔴 NO POWER'}
                            </div>
                        </div>

                        <svg viewBox="0 0 600 300" className="w-full h-full text-slate-300">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                </marker>
                            </defs>

                            {/* Source and Dest text */}
                            <text x="30" y="155" fill="#60a5fa" fontSize="12" fontWeight="bold">SOURCE</text>
                            <text x="530" y="155" fill="#fbbf24" fontSize="12" fontWeight="bold">DEST</text>

                            {/* Main Paths */}
                            {/* Path 1 Top: Split -> (L1 || L2) -> Join -> L3 -> Dest */}
                            <path d="M 80 150 C 100 150, 100 80, 150 80" fill="none" stroke="#475569" strokeWidth="2" />
                            <path d="M 80 150 C 100 150, 100 220, 150 220" fill="none" stroke="#475569" strokeWidth="2" />

                            {/* Top Branch (L1 || L2) - Parallel */}
                            <path d="M 150 80 L 180 80" fill="none" stroke="#475569" strokeWidth="2" />
                            {/* Split for L1/L2 */}
                            <path d="M 180 80 L 180 50 L 210 50" fill="none" stroke="#475569" strokeWidth="2" />
                            <path d="M 180 80 L 180 110 L 210 110" fill="none" stroke="#475569" strokeWidth="2" />

                            {/* Join L1/L2 */}
                            <path d="M 270 50 L 300 50 L 300 80" fill="none" stroke="#475569" strokeWidth="2" />
                            <path d="M 270 110 L 300 110 L 300 80" fill="none" stroke="#475569" strokeWidth="2" />
                            <path d="M 300 80 L 330 80" fill="none" stroke="#475569" strokeWidth="2" />

                            {/* L3 */}
                            <path d="M 390 80 L 450 80" fill="none" stroke="#475569" strokeWidth="2" />

                            {/* Top to Dest */}
                            <path d="M 450 80 C 500 80, 500 150, 520 150" fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#arrowhead)" />


                            {/* Bottom Branch L4 -> (L5 || L6) */}
                            {/* L4 */}
                            <path d="M 150 220 L 210 220" fill="none" stroke="#475569" strokeWidth="2" />
                            <path d="M 270 220 L 300 220" fill="none" stroke="#475569" strokeWidth="2" />

                            {/* Split for L5/L6 */}
                            <path d="M 300 220 L 300 190 L 330 190" fill="none" stroke="#475569" strokeWidth="2" />
                            <path d="M 300 220 L 300 250 L 330 250" fill="none" stroke="#475569" strokeWidth="2" />

                            {/* Join L5/L6 */}
                            <path d="M 390 190 L 420 190 L 420 220" fill="none" stroke="#475569" strokeWidth="2" />
                            <path d="M 390 250 L 420 250 L 420 220" fill="none" stroke="#475569" strokeWidth="2" />

                            {/* Bottom to Dest */}
                            <path d="M 420 220 C 470 220, 500 150, 520 150" fill="none" stroke="#475569" strokeWidth="2" />


                            {/* Components */}
                            <foreignObject x="210" y="30" width="60" height="40">
                                <LineViz status={currentStatus?.l1} label="L1" compact />
                            </foreignObject>
                            <foreignObject x="210" y="90" width="60" height="40">
                                <LineViz status={currentStatus?.l2} label="L2" compact />
                            </foreignObject>
                            <foreignObject x="330" y="60" width="60" height="40">
                                <LineViz status={currentStatus?.l3} label="L3" compact />
                            </foreignObject>

                            <foreignObject x="210" y="200" width="60" height="40">
                                <LineViz status={currentStatus?.l4} label="L4" compact />
                            </foreignObject>
                            <foreignObject x="330" y="170" width="60" height="40">
                                <LineViz status={currentStatus?.l5} label="L5" compact />
                            </foreignObject>
                            <foreignObject x="330" y="230" width="60" height="40">
                                <LineViz status={currentStatus?.l6} label="L6" compact />
                            </foreignObject>

                        </svg>

                        <div className="text-xs text-slate-500 mt-2 text-center max-w-sm">
                            <span className="text-blue-400 font-semibold">Top:</span> (L1 || L2) → L3 &nbsp;|&nbsp; <span className="text-blue-400 font-semibold">Bottom:</span> L4 → (L5 || L6)
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-slate-300 font-semibold mb-4">Simulation Results</h3>

                    <div className="space-y-6">
                        <div>
                            <div className="text-sm text-slate-400 mb-1">Experimental Probability</div>
                            <div className="text-3xl text-yellow-400">{(experimentalProb * 100).toFixed(2)}%</div>
                            <div className="text-xs text-slate-500">
                                {successCount} successes / {simulationCount} runs
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-slate-400 mb-1">Theoretical Probability</div>
                            <div className="text-2xl text-blue-400">{(theoreticalProb * 100).toFixed(2)}%</div>
                        </div>

                        <div className="h-48 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={convergenceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis
                                        dataKey="simulations"
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={(val) => val > 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                    />
                                    <YAxis
                                        domain={[0, 1]}
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <ReferenceLine y={theoreticalProb} stroke="#60a5fa" strokeDasharray="3 3" />
                                    <Line type="monotone" dataKey="probability" stroke="#facc15" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-xs text-slate-500 text-center">
                            Yellow: Experimental, Blue Dashed: Theoretical
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
