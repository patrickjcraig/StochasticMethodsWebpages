import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SequenceVisualizerProps {
  sequence: string;
  numAttacks: number;
}

export function SequenceVisualizer({ sequence, numAttacks }: SequenceVisualizerProps) {
  const getOutcome = () => {
    for (let i = 0; i < numAttacks; i++) {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;

      // Check bounds just in case
      if (idx1 >= sequence.length) break;

      // Check for Detection (First index is H)
      if (sequence[idx1] === 'H') {
        return { type: 'caught', index: idx1 };
      }

      // Check for Hacker Win (First V, Second H)
      // Ensure idx2 exists
      if (idx2 < sequence.length) {
        if (sequence[idx1] === 'V' && sequence[idx2] === 'H') {
          return { type: 'hackerWin', index: idx2 };
        }
      }
    }
    return { type: 'inconclusive', index: -1 };
  };

  const checkPositions = Array.from({ length: numAttacks }, (_, i) => i * 2);
  const outcome = getOutcome();
  const isCaught = outcome.type === 'caught';
  const hackerWins = outcome.type === 'hackerWin';
  const caughtPos = isCaught ? outcome.index : -1;
  const hackerWinPos = hackerWins ? outcome.index - 1 : -1; // index is 2nd item, so pos is 1st of pair? 
  // Wait, existing code used hackerWinPos to highlight pos and pos+1.
  // My getOutcome returns index of the H (2nd item).
  // So if I want hackerWinPos to be the start of the pair (V), it should be outcome.index - 1.

  const endIndex = outcome.index;

  const getAttackNumber = (index: number) => {
    return Math.floor(index / 2) + 1;
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {sequence.split('').map((char, index) => {
          const isCheckPosition = checkPositions.includes(index);
          const isSecondPick = index % 2 === 1;
          const attackNum = getAttackNumber(index);
          const isGrayedOut = endIndex !== -1 && index > endIndex;

          let borderColor = 'border-slate-600'; // Default border
          let bgColor = char === 'H' ? 'bg-red-900/30' : 'bg-green-900/30';
          let isHighlighted = false;

          // Only highlight if NOT grayed out (or if it is the event itself)
          if (!isGrayedOut) {
            if (isCaught && index === caughtPos) {
              borderColor = 'border-yellow-500';
              bgColor = 'bg-yellow-900/50';
              isHighlighted = true;
            } else if (hackerWins && (index === hackerWinPos || index === hackerWinPos + 1)) {
              borderColor = 'border-purple-500';
              bgColor = 'bg-purple-900/50';
              isHighlighted = true;
            } else if (isCheckPosition) {
              borderColor = 'border-blue-500';
            }
          }

          return (
            <div key={index} className={`flex flex-col items-center ${isGrayedOut ? 'opacity-25 grayscale' : ''}`}>
              <div className="text-xs text-slate-500 mb-1">
                {index + 1}
              </div>
              <div
                className={`w-12 h-12 border-2 ${borderColor} ${bgColor} rounded-lg flex items-center justify-center transition-all ${isHighlighted ? 'ring-2 ring-white shadow-lg' : ''
                  }`}
              >
                <span className="text-xl">{char}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                A{attackNum}{isSecondPick ? '₂' : '₁'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded"></div>
            <span className="text-sm text-slate-300">Check Positions</span>
          </div>
          <div className="text-xs text-slate-400">
            Positions {checkPositions.map(p => p + 1).join(', ')} (first pick of each attack)
          </div>
        </div>

        {isCaught && (
          <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500">Attack Detected!</span>
            </div>
            <div className="text-sm text-slate-300">
              Honeypot found at position {caughtPos + 1} (Attack {getAttackNumber(caughtPos)})
            </div>
          </div>
        )}

        {hackerWins && (
          <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-purple-500" />
              <span className="text-purple-500">Hacker Wins!</span>
            </div>
            <div className="text-sm text-slate-300">
              V→H sequence at positions {hackerWinPos + 1}-{hackerWinPos + 2}
            </div>
          </div>
        )}

        {!isCaught && !hackerWins && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">Inconclusive</span>
            </div>
            <div className="text-sm text-slate-400">
              Neither condition met
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-slate-400 bg-slate-900/30 rounded p-3">
        <strong>Legend:</strong> H = Honeypot (red), V = Victim (green).
        A{getAttackNumber(0)}₁ = Attack number & pick (₁ = first, ₂ = second)
      </div>
    </div>
  );
}
