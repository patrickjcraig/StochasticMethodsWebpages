import React, { useState, useMemo } from 'react';
import { Dices, Calculator } from 'lucide-react';
import { DiceRollSimulation } from './DiceRollSimulation';

export function DiceRollCalculator() {
  const [targetProb, setTargetProb] = useState(0.95);
  const [selectedFaces, setSelectedFaces] = useState<number[]>([5, 6]);

  const calculations = useMemo(() => {
    // For a fair die:
    // P(success) = |selectedFaces| / 6

    const pSuccess = selectedFaces.length / 6;
    const pFail = 1 - pSuccess;

    // We want P(at least one success in M rolls) >= targetProb
    // M >= log(1 - targetProb) / log(pFail)

    let M = 0;
    let actualProb = 0;

    if (pSuccess === 0) {
      M = Infinity;
      actualProb = 0;
    } else if (pSuccess === 1) {
      M = 1;
      actualProb = 1;
    } else {
      M = Math.ceil(Math.log(1 - targetProb) / Math.log(pFail));
      actualProb = 1 - Math.pow(pFail, M);
    }

    return {
      pSuccess,
      pFail,
      M,
      actualProb,
      targetProb
    };
  }, [targetProb, selectedFaces]);

  const toggleFace = (face: number) => {
    setSelectedFaces(prev => {
      if (prev.includes(face)) {
        return prev.filter(f => f !== face);
      } else {
        return [...prev, face].sort((a, b) => a - b);
      }
    });
  };

  const getDieFace = (val: number) => {
    return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1];
  };

  const commonTargets = [
    { label: '95%', value: 0.95 },
    { label: '99%', value: 0.99 },
    { label: '99.9%', value: 0.999 },
    { label: '99.99%', value: 0.9999 }
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl mb-2 flex items-center gap-3">
          <Dices className="w-10 h-10" />
          Die Rolling Probability Calculator
        </h1>
        <p className="text-slate-300">
          Determine the number of rolls needed to achieve a target probability (Problem 7)
        </p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Problem Setup</h2>
        <p className="text-slate-300 mb-4">
          How many times M must we roll a fair die to have at least a certain probability of seeing
          a specific outcome at least once?
        </p>
        <div className="text-sm text-slate-400 bg-slate-900/50 rounded p-3">
          <strong>Formula:</strong> If we want P(at least one success) ≥ p, then:<br />
          M ≥ log(1 - p) / log(P(failure))
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Parameters</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Success Faces (Select Multiple)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map(face => (
                <button
                  key={face}
                  onClick={() => toggleFace(face)}
                  className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all ${selectedFaces.includes(face)
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-lg shadow-blue-900/50'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  title={`Toggle face ${face}`}
                >
                  {getDieFace(face)}
                </button>
              ))}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Selected: {selectedFaces.length > 0 ? selectedFaces.join(', ') : 'None'}
              <span className="mx-2">•</span>
              P(Success) = {calculations.pSuccess.toFixed(4)} ({selectedFaces.length}/6)
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Target Probability</label>
            <div className="flex gap-2 mb-3">
              {commonTargets.map((target) => (
                <button
                  key={target.label}
                  onClick={() => setTargetProb(target.value)}
                  className={`px-3 py-1 rounded text-sm ${targetProb === target.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {target.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.5"
              max="0.9999"
              step="0.0001"
              value={targetProb}
              onChange={(e) => setTargetProb(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl mt-2">
              {(targetProb * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Calculation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">P(Success on one roll)</div>
            <div className="text-2xl">{calculations.pSuccess.toFixed(4)}</div>
            <div className="text-xs text-slate-500 mt-1">
              = {selectedFaces.length}/6
            </div>
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">P(Failure on one roll)</div>
            <div className="text-2xl">{calculations.pFail.toFixed(4)}</div>
            <div className="text-xs text-slate-500 mt-1">
              = {6 - selectedFaces.length}/6
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-2 border-green-500/30 rounded-lg p-6">
          <div className="text-sm text-slate-300 mb-2">Minimum Number of Rolls Required:</div>
          <div className="text-6xl text-green-300 mb-3">
            {calculations.M === Infinity ? '∞' : calculations.M}
          </div>
          <div className="text-sm text-slate-400">
            Formula: M = ⌈log(1 - {targetProb}) / log({calculations.pFail.toFixed(4)})⌉
          </div>
        </div>

        <div className="mt-4 bg-slate-900/50 rounded p-4">
          <div className="text-sm text-slate-400 mb-1">Actual Probability Achieved:</div>
          <div className="text-3xl text-blue-300">
            {(calculations.actualProb * 100).toFixed(4)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            = 1 - ({calculations.pFail.toFixed(4)})^{calculations.M}
          </div>
          <div className={`text-sm mt-2 ${calculations.actualProb >= calculations.targetProb ? 'text-green-400' : 'text-red-400'
            }`}>
            {calculations.actualProb >= calculations.targetProb ? '✓' : '✗'}
            {' '}Meets target of {(calculations.targetProb * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <DiceRollSimulation />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg mb-3">Problem 7 Parts (a) & (b)</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">(a) Outcome &gt; 4, P ≥ 0.95</div>
              <div className="text-xl text-green-300">
                M = {Math.ceil(Math.log(1 - 0.95) / Math.log(2 / 3))} rolls
              </div>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">(b) Outcome &gt; 4, P ≥ 0.999</div>
              <div className="text-xl text-green-300">
                M = {Math.ceil(Math.log(1 - 0.999) / Math.log(2 / 3))} rolls
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg mb-3">Problem 7 Parts (c) & (d)</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">(c) Outcome = 6, P ≥ 0.95</div>
              <div className="text-xl text-purple-300">
                M = {Math.ceil(Math.log(1 - 0.95) / Math.log(5 / 6))} rolls
              </div>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <div className="text-slate-400 mb-1">(d) Outcome = 6, P ≥ 0.999</div>
              <div className="text-xl text-purple-300">
                M = {Math.ceil(Math.log(1 - 0.999) / Math.log(5 / 6))} rolls
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm mb-2">Understanding the Formula</h3>
        <div className="text-xs text-slate-400 space-y-2">
          <p>
            <strong>Why this works:</strong> The probability of getting at least one success in M rolls
            is the complement of getting all failures.
          </p>
          <p>
            P(at least 1 success) = 1 - P(all M rolls fail) = 1 - (P(fail))^M
          </p>
          <p>
            To find M: Set 1 - (P(fail))^M ≥ target, solve for M using logarithms.
          </p>
        </div>
      </div>
    </div>
  );
}
