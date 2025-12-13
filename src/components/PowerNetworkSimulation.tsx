import { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Pause, Zap, Activity, Plus, GripVertical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Props passed from the parent Calculator component
// Includes individual component reliabilities (pL1...pL6) and conditional probabilities
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

// Data Model for the Reliability Block Diagram (RBD) editor
interface LinkItem {
    id: string;      // Unique ID for the draggable item (the component/link)
    label: string;   // Display label (e.g., "L1")
    probKey: string; // Key to look up probability in props
}

interface PathColumn {
    id: string;       // Unique ID for the column (representing a parallel path)
    title: string;    // Title of the column
    linkIds: string[];// List of components in this path (Series connection within the path)
}

// Definition of all available components in the simulation
const ALL_LINKS: LinkItem[] = [
    { id: 'l1', label: 'L1', probKey: 'pL1' },
    { id: 'l2', label: 'L2', probKey: 'pL2' },
    { id: 'l3', label: 'L3', probKey: 'pL3' },
    { id: 'l4', label: 'L4', probKey: 'pL4' },
    { id: 'l5', label: 'L5', probKey: 'pL5' },
    { id: 'l6', label: 'L6', probKey: 'pL6' },
];

// Initial configuration for the Drag and Drop editor
const INITIAL_PATHS: { [key: string]: PathColumn } = {
    'path-1': { id: 'path-1', title: 'Top Path', linkIds: ['l1', 'l3'] },
    'path-2': { id: 'path-2', title: 'Bottom Path', linkIds: ['l4', 'l6'] },
    'unused': { id: 'unused', title: 'Spare Components', linkIds: ['l2', 'l5'] },
};

export function PowerNetworkSimulation(props: PowerNetworkSimulationProps) {
    // State to store the structure of the network (paths and components within them)
    const [paths, setPaths] = useState(INITIAL_PATHS);
    // State to store the visual order of paths
    const [pathOrder, setPathOrder] = useState(['path-1', 'path-2', 'unused']);

    // React 18 Strict Mode Fix for React Beautiful DnD
    // RBD requires animation frame enablement to work correctly in Strict Mode
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    // Simulation Execution State
    const [isPlaying, setIsPlaying] = useState(false);
    const [simulationCount, setSimulationCount] = useState(0); // Total runs
    const [successCount, setSuccessCount] = useState(0);       // Total successful runs (system worked)
    const [simulationSpeed, setSimulationSpeed] = useState(20);
    const [convergenceData, setConvergenceData] = useState<Array<{ simulations: number; probability: number }>>([]);

    // Detailed status of the current simulation step (which links are active, did system work?)
    const [currentStatus, setCurrentStatus] = useState<{ [key: string]: boolean } | null>(null);

    // --- Core Simulation Logic ---
    // This function simulates one time-step of the power network
    const runStep = useCallback(() => {
        // 1. Determine "Active" status of all individual links based on their probabilities
        const linkStatus: { [key: string]: boolean } = {};

        // Handle specific correlation logic defined in the problem:
        // L5 depends on the state of L6
        const l6Active = Math.random() < props.pL6;
        const pL5 = l6Active ? props.pL5GivenL6 : props.pL5GivenNotL6;
        const l5Active = Math.random() < pL5;

        ALL_LINKS.forEach(link => {
            if (link.id === 'l6') linkStatus[link.id] = l6Active;
            else if (link.id === 'l5') linkStatus[link.id] = l5Active;
            else {
                // @ts-ignore - dynamic lookup of probability from props
                const prob = props[link.probKey] || 0.5;
                linkStatus[link.id] = Math.random() < prob;
            }
        });

        // 2. Evaluate System Connectivity (Reliability Block Diagram Logic)
        let systemSuccess = false;

        // "pathOrder" defines our parallel branches (Top, Bottom, etc.).
        // The system is functional if ANY of these paths conducts power (OR Logic).
        const activePathIds = pathOrder.filter(id => id !== 'unused');

        const pathSuccesses: { [key: string]: boolean } = {};

        // Check each path individually:
        activePathIds.forEach(pathId => {
            const path = paths[pathId];
            if (path.linkIds.length === 0) return; // Empty path doesn't conduct

            // Within a single path, components are in SERIES.
            // Power flows only if ALL components in the path are active (AND Logic).
            const pathWorks = path.linkIds.every(lid => linkStatus[lid]);
            pathSuccesses[pathId] = pathWorks;

            // System is successful if at least one path works.
            if (pathWorks) systemSuccess = true;
        });

        // Update State with the result of this iteration
        setCurrentStatus({ ...linkStatus, success: systemSuccess, ...pathSuccesses });

        setSimulationCount(prev => {
            const newCount = prev + 1;
            const newSuccess = successCount + (systemSuccess ? 1 : 0);
            setSuccessCount(newSuccess);

            // Periodically update convergence graph data
            // We throttle updates to avoid excessive re-renders
            if (newCount % 10 === 0 || newCount < 100) {
                setConvergenceData(prevData => {
                    const newData = [...prevData, { simulations: newCount, probability: newSuccess / newCount }];
                    if (newData.length > 100) return newData.slice(-100); // Keep graph manageable
                    return newData;
                });
            }
            return newCount;
        });
    }, [paths, pathOrder, props, successCount]);

    // Interval Effect for Auto-Play
    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            interval = window.setInterval(() => {
                runStep();
                // If speed is high, run multiple steps per interval tick for better performance
                if (simulationSpeed > 20) for (let i = 0; i < 4; i++) runStep();
            }, 1000 / Math.min(60, simulationSpeed));
        }
        return () => clearInterval(interval);
    }, [isPlaying, runStep, simulationSpeed]);

    // Reset Simulation
    const reset = () => {
        setIsPlaying(false);
        setSimulationCount(0);
        setSuccessCount(0);
        setCurrentStatus(null);
        setConvergenceData([]);
    };

    // Handler for Drag and Drop events (React Beautiful DnD)
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const startPath = paths[source.droppableId];
        const finishPath = paths[destination.droppableId];

        // Case 1: Reordering links within the same path
        if (startPath === finishPath) {
            const newLinkIds = Array.from(startPath.linkIds);
            newLinkIds.splice(source.index, 1);
            newLinkIds.splice(destination.index, 0, draggableId);
            const newPath = { ...startPath, linkIds: newLinkIds };
            setPaths({ ...paths, [newPath.id]: newPath });
            return;
        }

        // Case 2: Moving link from one path to another
        const startLinkIds = Array.from(startPath.linkIds);
        startLinkIds.splice(source.index, 1);
        const newStart = { ...startPath, linkIds: startLinkIds };

        const finishLinkIds = Array.from(finishPath.linkIds);
        finishLinkIds.splice(destination.index, 0, draggableId);
        const newFinish = { ...finishPath, linkIds: finishLinkIds };

        setPaths({ ...paths, [newStart.id]: newStart, [newFinish.id]: newFinish });
    };

    // Add a new dynamic path to the editor
    const addPath = () => {
        const newId = `path-${Date.now()}`;
        setPaths(prev => ({ ...prev, [newId]: { id: newId, title: 'New Path', linkIds: [] } }));
        setPathOrder(prev => {
            const newOrder = [...prev];
            // Insert before 'unused' (which is always at the end or acting as "store")
            newOrder.splice(newOrder.length - 1, 0, newId);
            return newOrder;
        });
    };

    const experimentalProb = simulationCount > 0 ? successCount / simulationCount : 0;

    if (!enabled) return null; // Prevent hydration mismatch / strict mode issues

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
                {/* Left Column: Network Editor (Drag & Drop) */}
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
                                                {/* Links within the path */}
                                                {path.linkIds.map((linkId, index) => {
                                                    const link = ALL_LINKS.find(l => l.id === linkId)!;
                                                    const isActive = currentStatus ? currentStatus[linkId] : true;
                                                    // While simulation is running, color code based on Active/Inactive status
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

                {/* Right Column: Controls & Stats */}
                <div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                            {/* Play/Pause Button */}
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors w-full ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isPlaying ? 'Pause' : 'Start'}
                            </button>
                            {/* Reset Button */}
                            <button
                                onClick={reset}
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors w-full"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                        {/* Speed Control */}
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
                        {/* Status Indicator */}
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

                        {/* Statistical Results */}
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
                                {/* Convergence Graph */}
                                {convergenceData.length > 0 && (
                                    <div className="bg-slate-900/50 rounded-lg p-4 mt-6 border border-slate-700">
                                        <h3 className="text-sm text-slate-400 mb-3 uppercase tracking-widest">Reliability Convergence</h3>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={convergenceData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis
                                                        dataKey="simulations"
                                                        stroke="#94a3b8"
                                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                        tickFormatter={(val) => val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toString()}
                                                    />
                                                    <YAxis
                                                        domain={[0, 1]}
                                                        stroke="#94a3b8"
                                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                                        labelStyle={{ color: '#94a3b8' }}
                                                        formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Reliability']}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="probability"
                                                        stroke="#facc15"
                                                        dot={false}
                                                        strokeWidth={2}
                                                        isAnimationActive={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2">
                                            Graph shows experimental system reliability over time.
                                        </div>
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
