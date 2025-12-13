import { useState, useEffect } from 'react';
import { Play, RotateCcw, Trophy, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PowerballSimulation() {
    const [userWhite, setUserWhite] = useState<number[]>([]);
    const [userPower, setUserPower] = useState<number | null>(null);
    const [drawWhite, setDrawWhite] = useState<number[]>([]);
    const [drawPower, setDrawPower] = useState<number | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [autoPlay, setAutoPlay] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(10);
    const [stats, setStats] = useState({
        played: 0,
        winnings: 0,
        cost: 0
    });
    const [history, setHistory] = useState<Array<{ played: number; roi: number }>>([]);
    const [showGraph, setShowGraph] = useState(false);

    const quickPick = () => {
        const white: number[] = [];
        while (white.length < 5) {
            const n = Math.floor(Math.random() * 69) + 1;
            if (!white.includes(n)) white.push(n);
        }
        white.sort((a, b) => a - b);
        setUserWhite(white);
        setUserPower(Math.floor(Math.random() * 26) + 1);
        setResult(null);
        setDrawWhite([]);
        setDrawPower(null);
        setHistory([]); // Reset history on new numbers (optional, but cleaner)
    };

    const draw = () => {
        const white: number[] = [];
        while (white.length < 5) {
            const n = Math.floor(Math.random() * 69) + 1;
            if (!white.includes(n)) white.push(n);
        }
        white.sort((a, b) => a - b);
        const power = Math.floor(Math.random() * 26) + 1;

        setDrawWhite(white);
        setDrawPower(power);

        // Check winnings
        if (userWhite.length === 5 && userPower !== null) {
            const whiteMatches = userWhite.filter(n => white.includes(n)).length;
            const powerMatch = userPower === power;

            let prize = 0;
            let text = 'No Prize';

            if (whiteMatches === 5 && powerMatch) { prize = 1000000000; text = 'JACKPOT!!!'; }
            else if (whiteMatches === 5) { prize = 1000000; text = '$1,000,000'; }
            else if (whiteMatches === 4 && powerMatch) { prize = 50000; text = '$50,000'; }
            else if (whiteMatches === 4) { prize = 100; text = '$100'; }
            else if (whiteMatches === 3 && powerMatch) { prize = 100; text = '$100'; }
            else if (whiteMatches === 3) { prize = 7; text = '$7'; }
            else if (whiteMatches === 2 && powerMatch) { prize = 7; text = '$7'; }
            else if (whiteMatches === 1 && powerMatch) { prize = 4; text = '$4'; }
            else if (powerMatch) { prize = 4; text = '$4'; }

            setResult(text);
            setStats(prev => {
                const newStats = {
                    played: prev.played + 1,
                    winnings: prev.winnings + prize,
                    cost: prev.cost + 2
                };

                // Update history every 10 draws or so to keep performance needed? 
                // Let's do every one for now but limit array size if needed.
                // Or maybe just every 10 to avoid too much re-render
                if (newStats.played % 10 === 0 || newStats.played < 100) {
                    setHistory(h => {
                        const newRoi = ((newStats.winnings - newStats.cost) / newStats.cost);
                        const newPoint = { played: newStats.played, roi: newRoi };
                        // Keep last 200 points for sliding window effect
                        if (h.length > 200) return [...h.slice(1), newPoint];
                        return [...h, newPoint];
                    });
                }
                return newStats;
            });
        }
    };

    useEffect(() => {
        if (!userWhite.length) quickPick();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let interval: number;
        if (autoPlay) {
            interval = window.setInterval(draw, 1000 / simulationSpeed);
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, userWhite, userPower, simulationSpeed]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Powerball Simulator
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-slate-300">Your Numbers</h3>
                            <button onClick={quickPick} className="text-sm text-blue-400 hover:text-blue-300">
                                Quick Pick
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {userWhite.map((n, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white text-slate-900 font-bold flex items-center justify-center">
                                    {n}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center">
                                {userPower}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-slate-300">Draw Results</h3>
                            {result && (
                                <span className={`text-lg font-bold ${result === 'No Prize' ? 'text-slate-500' : 'text-green-400'}`}>
                                    {result}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2 mb-6">
                            {drawWhite.length > 0 ? (
                                <>
                                    {drawWhite.map((n, i) => (
                                        <div key={i} className={`w-10 h-10 rounded-full font-bold flex items-center justify-center border-2 ${userWhite.includes(n)
                                            ? 'bg-green-500 text-white border-green-400'
                                            : 'bg-slate-700 text-slate-300 border-slate-600'
                                            }`}>
                                            {n}
                                        </div>
                                    ))}
                                    <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center border-2 ${userPower === drawPower
                                        ? 'bg-red-600 text-white border-red-500'
                                        : 'bg-slate-700 text-slate-300 border-slate-600'
                                        }`}>
                                        {drawPower}
                                    </div>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 animate-pulse" />
                                    ))}
                                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 animate-pulse" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={draw}
                                    disabled={autoPlay}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex-1 justify-center"
                                >
                                    <Play className="w-4 h-4" />
                                    Draw One
                                </button>
                                <button
                                    onClick={() => setAutoPlay(!autoPlay)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${autoPlay ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {autoPlay ? 'Stop Auto' : 'Auto-Play'}
                                </button>
                            </div>

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
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                    <h3 className="text-slate-300 mb-4 opacity-75 uppercase text-sm tracking-wider">Session Statistics</h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
                            <div className="text-slate-400">Total Spent</div>
                            <div className="text-2xl text-red-400">
                                ${stats.cost.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
                            <div className="text-slate-400">Total Winnings</div>
                            <div className="text-2xl text-green-400">
                                ${stats.winnings.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="text-slate-400">Net Profit/Loss</div>
                            <div className={`text-2xl ${stats.winnings - stats.cost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${(stats.winnings - stats.cost).toLocaleString()}
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-700">
                            <div className="text-sm text-slate-500 mb-1">Return on Investment (ROI):</div>
                            <div className="text-xl text-slate-300">
                                {stats.cost > 0
                                    ? `${(((stats.winnings - stats.cost) / stats.cost) * 100).toFixed(2)}%`
                                    : '0%'}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setStats({ played: 0, winnings: 0, cost: 0 });
                                setHistory([]);
                            }}
                            className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset Stats
                        </button>

                        <div className="mt-6 pt-4 border-t border-slate-700/50">
                            <button
                                onClick={() => setShowGraph(!showGraph)}
                                className="mb-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs py-1 px-3 rounded border border-slate-700 transition-colors flex items-center gap-2"
                            >
                                <Activity className="w-3 h-3" />
                                {showGraph ? 'Hide ROI Graph' : 'View ROI Graph'}
                            </button>

                            {showGraph && history.length > 1 && (
                                <div className="h-40 w-full bg-slate-800/50 rounded">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={history}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis
                                                dataKey="played"
                                                stroke="#94a3b8"
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(val) => val > 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                                                labelStyle={{ color: '#94a3b8' }}
                                                formatter={(val: number) => [(val * 100).toFixed(2) + '%', 'ROI']}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="roi"
                                                stroke="#f87171"
                                                dot={false}
                                                strokeWidth={2}
                                                isAnimationActive={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
