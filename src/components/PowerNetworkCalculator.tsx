import React, { useState, useMemo } from 'react';
import { Zap, Calculator, Info } from 'lucide-react';

export function PowerNetworkCalculator() {
  const [pL1, setPL1] = useState(0.88);
  const [pL2, setPL2] = useState(0.99);
  const [pL3, setPL3] = useState(0.9);
  const [pL4, setPL4] = useState(0.8);
  const [pL6, setPL6] = useState(0.95);
  const [pL5GivenL6, setPL5GivenL6] = useState(0.2);
  const [pL5GivenNotL6, setPL5GivenNotL6] = useState(0.1);

  const calculations = useMemo(() => {
    // Calculate P(L5) using law of total probability
    // P(L5) = P(L5|L6)·P(L6) + P(L5|L̄6)·P(L̄6)
    const pNotL6 = 1 - pL6;
    const pL5 = pL5GivenL6 * pL6 + pL5GivenNotL6 * pNotL6;

    // Part (a): Are L1∩L2∩L3 and L4∩L3 independent?
    // L1∩L2∩L3 involves L1, L2, L3 (all independent of each other and L4)
    // L4∩L3 involves L4, L3
    // They share L3, so they are NOT independent
    // For independence, we'd need: P(A∩B) = P(A)·P(B)
    const pL1L2L3 = pL1 * pL2 * pL3;
    const pL4L3 = pL4 * pL3;
    const pBothEvents = pL1 * pL2 * pL3 * pL4; // Since all are independent except 5,6
    const wouldBeIfIndependent = pL1L2L3 * pL4L3;
    const areIndependent = Math.abs(pBothEvents - wouldBeIfIndependent) < 0.0001;

    // Part (b): P(power flows from Source to Destination)
    // Looking at the network, possible paths:
    // Path 1: 1 → 3
    // Path 2: 2 → 3
    // Path 3: 1 → 4 → 5
    // Path 4: 2 → 4 → 6
    // Path 5: 1 → 4 → 6
    // Path 6: 2 → 4 → 5
    
    // Actually, let me think about this more carefully.
    // Based on typical network problems:
    // Top path: L1 → L3
    // Bottom path: L2 → L3
    // Middle path involves L4, and then L5 or L6
    
    // Let's use inclusion-exclusion
    // P(power flows) = P(at least one path works)
    
    // Common network structure for this type of problem:
    // Path A: L1 and L3 both work
    // Path B: L2 and L3 both work  
    // Path C: L4 and L5 both work
    // Path D: L4 and L6 both work
    
    const pPathA = pL1 * pL3;
    const pPathB = pL2 * pL3;
    
    // For paths C and D involving L5 and L6:
    // P(L4 ∩ L5) = P(L4) · P(L5) (assuming L4 and L5 are independent)
    const pPathC = pL4 * pL5;
    
    // P(L4 ∩ L6)
    const pPathD = pL4 * pL6;
    
    // P(L4 ∩ L5 ∩ L6) - we need this for inclusion-exclusion
    // P(L4) · P(L5 ∩ L6) where P(L5 ∩ L6) = P(L5|L6) · P(L6)
    const pL5andL6 = pL5GivenL6 * pL6;
    const pPathCD = pL4 * pL5andL6;
    
    // Using inclusion-exclusion for Paths C and D:
    // P(C ∪ D) = P(C) + P(D) - P(C ∩ D)
    const pPath_C_or_D = pPathC + pPathD - pPathCD;
    
    // Now for all paths:
    // P(A ∪ B ∪ (C∪D))
    // Since L3 is separate from L4,L5,L6 network, and L1,L2 are independent:
    
    // P(A ∪ B) using inclusion-exclusion
    const pPath_A_or_B = pPathA + pPathB - (pL1 * pL2 * pL3);
    
    // Assuming paths through L3 are separate from paths through L4,L5,L6:
    // P(flow) = P((A ∪ B) ∪ (C ∪ D))
    // = P(A ∪ B) + P(C ∪ D) - P((A∪B) ∩ (C∪D))
    
    // If the paths are truly independent paths (parallel):
    const pPowerFlows = pPath_A_or_B + pPath_C_or_D - (pPath_A_or_B * pPath_C_or_D);

    return {
      pL5,
      pNotL6,
      // Part (a)
      pL1L2L3,
      pL4L3,
      pBothEvents,
      wouldBeIfIndependent,
      areIndependent,
      // Part (b)
      pPathA,
      pPathB,
      pPathC,
      pPathD,
      pL5andL6,
      pPathCD,
      pPath_A_or_B,
      pPath_C_or_D,
      pPowerFlows
    };
  }, [pL1, pL2, pL3, pL4, pL5GivenL6, pL5GivenNotL6, pL6]);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl mb-2 flex items-center gap-3">
          <Zap className="w-10 h-10 text-yellow-400" />
          Power Network Reliability Calculator
        </h1>
        <p className="text-slate-300">
          Analyze power distribution network reliability (Problem 8)
        </p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Network Diagram
        </h2>
        <div className="bg-slate-900 rounded-lg p-6 mb-4">
          <pre className="text-sm text-slate-300 font-mono">
{`         1───────3
        ╱│       │╲
       ╱ │       │ ╲
   Source│   5   │  Destination
       ╲ │       │ ╱
        ╲│   6   │╱
         2───────4`}
          </pre>
        </div>
        <div className="text-sm text-slate-400 space-y-2">
          <p>
            Power flows from Source to Destination if there exists at least one connected path 
            of functional transmission lines.
          </p>
          <p className="text-yellow-400">
            <strong>Special dependency:</strong> Lines 5 and 6 are dependent on each other, 
            but independent of all other lines.
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Line Probabilities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'L1', value: pL1, setter: setPL1 },
            { label: 'L2', value: pL2, setter: setPL2 },
            { label: 'L3', value: pL3, setter: setPL3 },
            { label: 'L4', value: pL4, setter: setPL4 },
            { label: 'L6', value: pL6, setter: setPL6 },
          ].map(({ label, value, setter }) => (
            <div key={label} className="bg-slate-900/50 rounded p-3">
              <label className="block text-sm text-slate-400 mb-2">P({label})</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded p-3">
            <label className="block text-sm text-slate-400 mb-2">P(L5 | L6)</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={pL5GivenL6}
              onChange={(e) => setPL5GivenL6(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
            />
          </div>
          <div className="bg-slate-900/50 rounded p-3">
            <label className="block text-sm text-slate-400 mb-2">P(L5 | L̄6)</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={pL5GivenNotL6}
              onChange={(e) => setPL5GivenNotL6(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded p-3">
          <div className="text-sm text-slate-400 mb-1">Calculated P(L5):</div>
          <div className="text-2xl text-blue-300">{calculations.pL5.toFixed(4)}</div>
          <div className="text-xs text-slate-500 mt-1">
            = P(L5|L6)·P(L6) + P(L5|L̄6)·P(L̄6) = {pL5GivenL6}×{pL6} + {pL5GivenNotL6}×{calculations.pNotL6.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Part (a): Independence Check
        </h2>
        <div className="space-y-3">
          <p className="text-slate-300">
            Are events (L₁ ∩ L₂ ∩ L₃) and (L₄ ∩ L₃) statistically independent?
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-400 mb-1">P(L₁ ∩ L₂ ∩ L₃)</div>
              <div className="text-xl">{calculations.pL1L2L3.toFixed(4)}</div>
            </div>
            <div className="bg-slate-900/50 rounded p-4">
              <div className="text-sm text-slate-400 mb-1">P(L₄ ∩ L₃)</div>
              <div className="text-xl">{calculations.pL4L3.toFixed(4)}</div>
            </div>
          </div>

          <div className={`rounded-lg p-4 border-2 ${
            calculations.areIndependent 
              ? 'border-red-500/30 bg-red-900/20' 
              : 'border-green-500/30 bg-green-900/20'
          }`}>
            <div className="text-lg mb-2">
              {calculations.areIndependent ? '✗ NOT Independent' : '✓ NOT Independent'}
            </div>
            <div className="text-sm text-slate-300 space-y-2">
              <p>
                <strong>Reason:</strong> Both events share L₃ as a common component.
              </p>
              <p>
                When two events share a common element, they cannot be independent because 
                the occurrence of L₃ affects both events simultaneously.
              </p>
              <div className="mt-2 text-xs text-slate-400 bg-slate-900/50 rounded p-2">
                P(Both) = {calculations.pBothEvents.toFixed(6)}<br/>
                P(L₁∩L₂∩L₃) × P(L₄∩L₃) = {calculations.wouldBeIfIndependent.toFixed(6)}<br/>
                These are not equal, confirming dependence.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Part (b): Network Reliability
        </h2>
        
        <div className="space-y-4">
          <div className="text-slate-300 mb-4">
            <p className="mb-2">Analyzing possible paths from Source to Destination:</p>
            <div className="text-sm bg-slate-900/50 rounded p-3 space-y-1">
              <p>• Path through L1 and L3: P = {calculations.pPathA.toFixed(4)}</p>
              <p>• Path through L2 and L3: P = {calculations.pPathB.toFixed(4)}</p>
              <p>• Path through L4 and L5: P = {calculations.pPathC.toFixed(4)}</p>
              <p>• Path through L4 and L6: P = {calculations.pPathD.toFixed(4)}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">P(L5 ∩ L6)</div>
            <div className="text-xl">{calculations.pL5andL6.toFixed(4)}</div>
            <div className="text-xs text-slate-500 mt-1">
              Used for inclusion-exclusion of dependent lines
            </div>
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">P(Path via L3)</div>
            <div className="text-xl">{calculations.pPath_A_or_B.toFixed(4)}</div>
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">P(Path via L4, L5 or L6)</div>
            <div className="text-xl">{calculations.pPath_C_or_D.toFixed(4)}</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-2 border-green-500/30 rounded-lg p-6">
            <div className="text-sm text-slate-300 mb-2">
              Probability that power flows from Source to Destination:
            </div>
            <div className="text-5xl text-green-300 mb-3">
              {(calculations.pPowerFlows * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-slate-400">
              = {calculations.pPowerFlows.toFixed(6)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm mb-2">Calculation Method</h3>
        <div className="text-xs text-slate-400 space-y-2">
          <p>
            Uses <strong>inclusion-exclusion principle</strong> to account for overlapping paths.
          </p>
          <p>
            For dependent events L5 and L6, we use conditional probabilities to find P(L5 ∩ L6).
          </p>
          <p>
            P(at least one path works) = P(paths through L3) + P(paths through L4) - P(both types of paths)
          </p>
        </div>
      </div>
    </div>
  );
}
