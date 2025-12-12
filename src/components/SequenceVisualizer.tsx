import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SequenceVisualizerProps {
  sequence: string;
  numAttacks: number;
}

export function SequenceVisualizer({ sequence, numAttacks }: SequenceVisualizerProps) {
  const checkPositions = Array.from({ length: numAttacks }, (_, i) => i * 2); // 0, 2, 4, 6, ...
  
  const getCaughtPosition = () => {
    for (let i = 0; i < checkPositions.length; i++) {
      const pos = checkPositions[i];
      if (sequence[pos] === 'H') {
        return pos;
      }
    }
    return -1;
  };

  const getHackerWinPosition = () => {
    for (let i = 0; i < checkPositions.length; i++) {
      const pos = checkPositions[i];
      if (sequence[pos] === 'V' && sequence[pos + 1] === 'H') {
        return pos;
      }
    }
    return -1;
  };

  const caughtPos = getCaughtPosition();
  const hackerWinPos = getHackerWinPosition();
  const isCaught = caughtPos !== -1;
  const hackerWins = hackerWinPos !== -1;

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
          
          let borderColor = 'border-slate-600';
          let bgColor = char === 'H' ? 'bg-red-900/30' : 'bg-green-900/30';
          let isHighlighted = false;

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

          return (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs text-slate-500 mb-1">
                {index + 1}
              </div>
              <div
                className={`w-12 h-12 border-2 ${borderColor} ${bgColor} rounded-lg flex items-center justify-center transition-all ${
                  isHighlighted ? 'ring-2 ring-white shadow-lg' : ''
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
