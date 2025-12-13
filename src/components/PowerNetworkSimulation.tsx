import { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Pause, Zap, Activity, Plus, GripVertical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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

// Data Structures for RBD (Reliability Block Diagram)
interface LinkItem {
    id: string;
    label: string;
    probKey: string;
}

interface PathColumn {
    id: string;
    title: string;
    linkIds: string[];
}

const ALL_LINKS: LinkItem[] = [
    { id: 'l1', label: 'L1', probKey: 'pL1' },
    { id: 'l2', label: 'L2', probKey: 'pL2' },
    { id: 'l3', label: 'L3', probKey: 'pL3' },
    { id: 'l4', label: 'L4', probKey: 'pL4' },
    { id: 'l5', label: 'L5', probKey: 'pL5' },
    { id: 'l6', label: 'L6', probKey: 'pL6' },
];

const INITIAL_PATHS: { [key: string]: PathColumn } = {
    'path-1': { id: 'path-1', title: 'Top Path', linkIds: ['l1', 'l3'] },
    'path-2': { id: 'path-2', title: 'Bottom Path', linkIds: ['l4', 'l6'] },
    'unused': { id: 'unused', title: 'Spare Components', linkIds: ['l2', 'l5'] },
};

export function PowerNetworkSimulation(props: PowerNetworkSimulationProps) {
    const [paths, setPaths] = useState(INITIAL_PATHS);
    const [pathOrder, setPathOrder] = useState(['path-1', 'path-2', 'unused']);

    // React 18 Strict Mode Fix for RBD
    // react-beautiful-dnd requires animation frame enablement in Strict Mode
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    // Simulation State
    const [isPlaying, setIsPlaying] = useState(false);
    const [simulationCount, setSimulationCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);
    const [simulationSpeed, setSimulationSpeed] = useState(20);
    const [convergenceData, setConvergenceData] = useState<Array<{ simulations: number; probability: number }>>([]);
    const [currentStatus, setCurrentStatus] = useState<{ [key: string]: boolean } | null>(null);
    const [showGraph, setShowGraph] = useState(false);

    // --- Simulation Logic (Series-Parallel) ---
    const runStep = useCallback(() => {
        // 1. Determine status of all links
        const linkStatus: { [key: string]: boolean } = {};

        // Correlated: L5 and L6
        const l6Active = Math.random() < props.pL6;
        const pL5 = l6Active ? props.pL5GivenL6 : props.pL5GivenNotL6;
        const l5Active = Math.random() < pL5;

        ALL_LINKS.forEach(link => {
            if (link.id === 'l6') linkStatus[link.id] = l6Active;
            else if (link.id === 'l5') linkStatus[link.id] = l5Active;
            else {
                // @ts-ignore
                const prob = props[link.probKey] || 0.5;
                linkStatus[link.id] = Math.random() < prob;
            }
        });

        // 2. Check Paths (Series Logic: All must be true)
        let systemSuccess = false;

        // We only consider "Active Paths" (not unused)
        const activePathIds = pathOrder.filter(id => id !== 'unused');

        const pathSuccesses: { [key: string]: boolean } = {};

        activePathIds.forEach(pathId => {
            const path = paths[pathId];
            if (path.linkIds.length === 0) return; // Empty path doesn't conduct

            const pathWorks = path.linkIds.every(lid => linkStatus[lid]);
            pathSuccesses[pathId] = pathWorks;
            if (pathWorks) systemSuccess = true;
        });

        // Update State
        setCurrentStatus({ ...linkStatus, success: systemSuccess, ...pathSuccesses });

        setSimulationCount(prev => {
            const newCount = prev + 1;
            const newSuccess = successCount + (systemSuccess ? 1 : 0);
            setSuccessCount(newSuccess);

            if (newCount % 10 === 0 || newCount < 100) {
                setConvergenceData(prevData => {
                    const newData = [...prevData, { simulations: newCount, probability: newSuccess / newCount }];
                    if (newData.length > 100) return newData.slice(-100);
                    return newData;
                });
            }
            return newCount;
        });
    }, [paths, pathOrder, props, successCount]);

    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            interval = window.setInterval(() => {
                runStep();
                if (simulationSpeed > 20) for (let i = 0; i < 4; i++) runStep();
            }, 1000 / Math.min(60, simulationSpeed));
        }
        return () => clearInterval(interval);
    }, [isPlaying, runStep, simulationSpeed]);

    const reset = () => {
        setIsPlaying(false);
        setSimulationCount(0);
        setSuccessCount(0);
        setCurrentStatus(null);
        setConvergenceData([]);
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const startPath = paths[source.droppableId];
        const finishPath = paths[destination.droppableId];

        // Moving within same list
        if (startPath === finishPath) {
            const newLinkIds = Array.from(startPath.linkIds);
            newLinkIds.splice(source.index, 1);
            newLinkIds.splice(destination.index, 0, draggableId);
            const newPath = { ...startPath, linkIds: newLinkIds };
            setPaths({ ...paths, [newPath.id]: newPath });
            return;
        }

        // Moving to different list
        const startLinkIds = Array.from(startPath.linkIds);
        startLinkIds.splice(source.index, 1);
        const newStart = { ...startPath, linkIds: startLinkIds };

        const finishLinkIds = Array.from(finishPath.linkIds);
        finishLinkIds.splice(destination.index, 0, draggableId);
        const newFinish = { ...finishPath, linkIds: finishLinkIds };

        setPaths({ ...paths, [newStart.id]: newStart, [newFinish.id]: newFinish });
    };

    const addPath = () => {
        const newId = `path-${Date.now()}`;
        setPaths(prev => ({ ...prev, [newId]: { id: newId, title: 'New Path', linkIds: [] } }));
        setPathOrder(prev => {
            const newOrder = [...prev];
            // Insert before 'unused'
            newOrder.splice(newOrder.length - 1, 0, newId);
            return newOrder;
        });
    };

    const experimentalProb = simulationCount > 0 ? successCount / simulationCount : 0;

    if (!enabled) return null; // Wait for clean render pass

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Power Network Builder & Simulation
            </h2>

            <p className="text-slate-400 text-sm mb-6">
                Drag links to configure the network. Power flows if <strong>any</strong> connected path has <strong>all</strong> its components working (Reliability Block Diagram).
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Column */}
                <div className="flex flex-col gap-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        {pathOrder.map(pathId => {
                            const path = paths[pathId];
                            const isUnused = pathId === 'unused';
                            const isPathActive = currentStatus && currentStatus[pathId];

                            return (
                                <div key={path.id} className={`rounded-lg p-4 transition-colors ${isUnused ? 'bg-slate-900/30 border border-dashed border-slate-700' :
                                    'bg-slate-900 border border-slate-700'
                                    } ${isPathActive ? 'shadow-[0_0_15px_rgba(250,204,21,0.2)] border-yellow-500/50' : ''}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${isUnused ? 'text-slate-500' : 'text-slate-300'}`}>
                                            {path.title}
                                            {isPathActive && <span className="ml-2 text-yellow-400 text-[10px] animate-pulse">⚡ CONDUCTING</span>}
                                        </h3>
                                    </div>

                                    <Droppable droppableId={path.id} direction="horizontal">
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex flex-wrap gap-2 min-h-[60px] p-2 rounded transition-colors ${snapshot.isDraggingOver ? 'bg-slate-800/80' : 'bg-slate-950/50'}`}
                                            >
                                                {path.linkIds.map((linkId, index) => {
                                                    const link = ALL_LINKS.find(l => l.id === linkId)!;
                                                    const isActive = currentStatus ? currentStatus[linkId] : true;
                                                    // While active simulation: use status.
                                                    const statusColor = currentStatus
                                                        ? (isActive ? 'bg-green-600' : 'bg-red-900/50 opacity-50')
                                                        : 'bg-blue-600';

                                                    return (
                                                        <Draggable key={linkId} draggableId={linkId} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`
                                                                        flex items-center gap-2 px-3 py-2 rounded shadow-sm text-sm font-bold text-white select-none
                                                                        ${statusColor}
                                                                        ${snapshot.isDragging ? 'scale-110 shadow-xl ring-2 ring-white/20' : ''}
                                                                    `}
                                                                    style={provided.draggableProps.style}
                                                                >
                                                                    <GripVertical className="w-3 h-3 opacity-50" />
                                                                    {link.label}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                                {path.linkIds.length === 0 && (
                                                    <div className="text-xs text-slate-600 self-center w-full text-center italic">
                                                        Drop links here
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </DragDropContext>

                    <button onClick={addPath} className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors">
                        <Plus className="w-4 h-4" /> Add Parallel Path
                    </button>
                </div>

                {/* Controls & Stats Column */}
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
                                Reset
                            </button>
                        </div>
                        <div className="flex flex-col justify-center col-span-2 sm:col-span-1 bg-slate-900/50 p-2 rounded">
                            <label className="text-xs text-slate-400 flex justify-between mb-1">
                                <span>Speed</span> <span>{simulationSpeed}x</span>
                            </label>
                            <input
                                type="range" min="1" max="100" value={simulationSpeed}
                                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                                className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="col-span-2 flex items-center bg-slate-900/50 px-3 py-1 rounded text-sm text-slate-400 justify-between">
                            <span>Runs:</span> <span className="text-white font-mono">{simulationCount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                        <div className={`text-center py-4 mb-6 rounded-lg border-2 transition-all ${currentStatus?.success
                            ? 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-500 text-yellow-400 shadow-lg'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                            }`}>
                            <div className="text-sm uppercase tracking-widest font-bold mb-1">System Status</div>
                            <div className="text-2xl font-black flex items-center justify-center gap-2">
                                {currentStatus?.success ? <Zap className="fill-current" /> : null}
                                {currentStatus?.success ? 'POWER DELIVERED' : 'OFFLINE'}
                            </div>
                        </div>

                        <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" />
                            Results
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="text-sm text-slate-400 mb-1">Experimental Reliability</div>
                                    <div className="text-3xl text-yellow-400 font-mono">{(experimentalProb * 100).toFixed(2)}%</div>
                                    <div className="text-xs text-slate-500">{successCount} / {simulationCount}</div>
                                </div>
                            </div>
                            <div className="mt-4 bg-slate-800/50 rounded p-2">
                                <button
                                    onClick={() => setShowGraph(!showGraph)}
                                    className="mb-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-1 px-3 rounded border border-slate-600 transition-colors flex items-center gap-2"
                                >
                                    <Activity className="w-3 h-3" />
                                    {showGraph ? 'Hide Convergence Graph' : 'View Convergence Graph'}
                                </button>

                                {showGraph && (
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={convergenceData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="simulations" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(val) => val > 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                                                <YAxis domain={[0, 1]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} labelStyle={{ color: '#94a3b8' }} />
                                                <Line type="monotone" dataKey="probability" stroke="#facc15" dot={false} strokeWidth={2} isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
