import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Spade, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Props: theoreticalProb from the Calculator component is used for comparison in the graph
interface BlackjackSimulationProps {
    theoreticalProb: number;
}

export function BlackjackSimulation({ theoreticalProb }: BlackjackSimulationProps) {
    // Simulation Control State
    const [isPlaying, setIsPlaying] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(20);

    // Results State to display in UI
    const [count, setCount] = useState(0);              // Total hands dealt
    const [blackjacks, setBlackjackCount] = useState(0); // Total blackjacks found
    const [currentHand, setCurrentHand] = useState<string[]>([]); // Visual representation of last hand

    // Chart Data State
    const [chartPoints, setChartPoints] = useState<Array<{ x: number, y: number }>>([]);

    // Use a Ref for the simulation values to prevent closure staleness in setInterval
    // and to allow accumulating results without triggering a re-render on every single loop
    const stateRef = useRef({
        count: 0,
        blackjacks: 0,
        data: [] as Array<{ x: number, y: number }>
    });

    const BATCH_SIZE = 10; // Number of hands to simulate per interval tick
    const suits = ['S', 'H', 'D', 'C'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

    // Helper: Get the value category of a card (Ace, Ten-value, or Other)
    const getCardValue = (rank: string) => {
        if (rank === 'A') return 'Ace';
        if (['T', 'J', 'Q', 'K'].includes(rank)) return 'Ten';
        return 'Other';
    };

    // Helper: Check if two cards make a Blackjack (Ace + Ten-value card)
    const isBlackjack = (card1: string, card2: string) => {
        const r1 = card1.slice(0, -1);
        const r2 = card2.slice(0, -1);
        const v1 = getCardValue(r1);
        const v2 = getCardValue(r2);
        return (v1 === 'Ace' && v2 === 'Ten') || (v1 === 'Ten' && v2 === 'Ace');
    };

    // Main simulation function run on every tick
    const runBatch = () => {
        let newBlackjacks = 0;
        let lastHand: string[] = [];

        // Simulate BATCH_SIZE hands
        for (let i = 0; i < BATCH_SIZE; i++) {
            // Draw Card 1
            const idx1 = Math.floor(Math.random() * 52);
            // Draw Card 2 (cannot be the same card)
            let idx2 = Math.floor(Math.random() * 52);
            while (idx2 === idx1) { idx2 = Math.floor(Math.random() * 52); }

            const getCard = (idx: number) => {
                const suitIdx = Math.floor(idx / 13);
                const rankIdx = idx % 13;
                return ranks[rankIdx] + suits[suitIdx];
            };

            const c1 = getCard(idx1);
            const c2 = getCard(idx2);

            if (isBlackjack(c1, c2)) newBlackjacks++;
            if (i === BATCH_SIZE - 1) lastHand = [c1, c2]; // Keep last hand for visualization
        }

        // Update Mutable Ref
        stateRef.current.count += BATCH_SIZE;
        stateRef.current.blackjacks += newBlackjacks;

        const c = stateRef.current.count;
        const bj = stateRef.current.blackjacks;

        // Update Graph Data periodically (not every single batch to save memory/rendering)
        // Store point (Total Hands, Probability)
        if (c % 50 === 0 || c < 500) {
            stateRef.current.data.push({ x: c, y: bj / c });
            setChartPoints(Array.from(stateRef.current.data));
        }

        // Trigger React Render with new stats
        setCount(c);
        setBlackjackCount(bj);
        setCurrentHand(lastHand);
    };

    // Ref to hold the latest version of runBatch (though runBatch doesn't depend on stale state due to Refs)
    const savedCallback = useRef(runBatch);
    useEffect(() => { savedCallback.current = runBatch; });

    // Interval Timer for Animation
    useEffect(() => {
        if (!isPlaying) return;
        const id = setInterval(() => savedCallback.current(), 1000 / simulationSpeed);
        return () => clearInterval(id);
    }, [isPlaying, simulationSpeed]);

    // Reset Simulation
    const reset = () => {
        setIsPlaying(false);
        stateRef.current = { count: 0, blackjacks: 0, data: [] };
        setCount(0);
        setBlackjackCount(0);
        setCurrentHand([]);
        setChartPoints([]);
    };

    const experimentalProb = count > 0 ? blackjacks / count : 0;

    // Helper to render card images from an API or fallback to text
    const renderCard = (cardCode: string) => {
        if (!cardCode) return <img src="https://deckofcardsapi.com/static/img/back.png" alt="Card Back" className="w-24 h-36 rounded-lg shadow-xl" />;
        let rank = cardCode.slice(0, -1);
        const suit = cardCode.slice(-1);
        // API compatibility: 'T' is usually '0' (10) in deckofcardsapi file names
        let imageRank = rank === 'T' ? '0' : rank;
        return (
            <div className="w-24 h-36 rounded-lg shadow-xl relative group hover:-translate-y-1 transition-transform">
                <img src={`https://deckofcardsapi.com/static/img/${imageRank}${suit}.png`} alt={`${rank} of ${suit}`} className="w-full h-full object-contain rounded-lg" />
            </div >
        );
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <Spade className="w-5 h-5 text-slate-400" />
                Monte Carlo Simulation
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Visuals & Controls */}
                <div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors w-full ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isPlaying ? 'Pause' : 'Start'}
                            </button>
                            <button
                                onClick={reset}
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors w-full"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <Activity className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                        <div className="flex flex-col justify-center col-span-2 sm:col-span-1 bg-slate-900/50 p-2 rounded">
                            <label className="text-xs text-slate-400 flex justify-between mb-1">
                                <span>Speed</span> <span>{simulationSpeed}x</span>
                            </label>
                            <input type="range" min="1" max="100" value={simulationSpeed} onChange={(e) => setSimulationSpeed(Number(e.target.value))} className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="col-span-2 flex items-center bg-slate-900/50 px-3 py-1 rounded text-sm text-slate-400 justify-between">
                            <span>Hands:</span> <span className="text-white font-mono">{count.toLocaleString()}</span>
                        </div>
                    </div>
                    {/* Card Visualization Area */}
                    <div className="bg-slate-900/50 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="text-sm text-slate-400 mb-6 font-medium">Current Hand</div>
                        <div className="flex gap-4 mb-8">
                            {currentHand.length === 2 ? (
                                <> {renderCard(currentHand[0])} {renderCard(currentHand[1])} </>
                            ) : (
                                <> <img src="https://deckofcardsapi.com/static/img/back.png" alt="Card Back" className="w-24 h-36 rounded-lg shadow-xl opacity-50" /> <img src="https://deckofcardsapi.com/static/img/back.png" alt="Card Back" className="w-24 h-36 rounded-lg shadow-xl opacity-50" /> </>
                            )}
                        </div>
                        {currentHand.length === 2 && (
                            <div className={`px-4 py-2 rounded-full text-sm font-bold ${isBlackjack(currentHand[0], currentHand[1]) ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                {isBlackjack(currentHand[0], currentHand[1]) ? 'BLACKJACK!' : 'Regular Hand'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Statistics & Chart */}
                <div className="bg-slate-900/50 rounded-lg p-6 flex flex-col border border-blue-500/30 overflow-hidden h-fit">
                    <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        Frequentist Probability Approach
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                        As the number of trials increases, the experimental probability converges to the theoretical probability.
                    </p>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Experimental P</div>
                                <div className="text-2xl text-yellow-400" id="experimental-prob">{experimentalProb ? (experimentalProb * 100).toFixed(4) : "0.0000"}%</div>
                                <div className="text-[10px] text-slate-500">{blackjacks} / {count}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Theoretical P</div>
                                <div className="text-2xl text-blue-400">{(theoreticalProb * 100).toFixed(4)}%</div>
                            </div>
                        </div>

                        {/* Convergence Graph */}
                        {chartPoints.length > 0 && (
                            <div className="bg-slate-900/50 rounded-lg p-4 mt-6">
                                <h3 className="text-sm text-slate-400 mb-3">Probability Convergence</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartPoints}>
                                            <XAxis
                                                dataKey="x"
                                                stroke="#94a3b8"
                                                tickFormatter={(val) => val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}
                                                fontSize={12}
                                            />
                                            <YAxis
                                                domain={[0, 'auto']}
                                                stroke="#94a3b8"
                                                fontSize={12}
                                                tickFormatter={(val) => (val * 100).toFixed(0) + '%'}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4c1d95', color: '#fff' }}
                                                labelFormatter={(val) => `Hand: ${val}`}
                                                formatter={(val: number) => [(val * 100).toFixed(4) + '%', 'Probability']}
                                            />
                                            <ReferenceLine y={theoreticalProb} stroke="#3b82f6" strokeDasharray="5 5" />
                                            <Line
                                                type="monotone"
                                                dataKey="y"
                                                stroke="#eab308"
                                                strokeWidth={2}
                                                dot={false}
                                                isAnimationActive={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                    Yellow line shows estimated probability converging over simulations
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
