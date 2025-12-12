import React, { useState } from 'react';
import { Dices, RefreshCw } from 'lucide-react';
import { PokerDiceCalculator } from './PokerDiceCalculator';
import { PokerDiceSimulation } from './PokerDiceSimulation';

export function PokerDice() {
  const [numDice, setNumDice] = useState(5);
  const [currentRoll, setCurrentRoll] = useState<number[]>([1, 2, 3, 4, 5]);

  const rollDice = () => {
    const newRoll = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
    setCurrentRoll(newRoll);
  };

  const analyzeRoll = (dice: number[]) => {
    const counts = new Map<number, number>();
    dice.forEach(d => counts.set(d, (counts.get(d) || 0) + 1));
    const frequencies = Array.from(counts.values()).sort((a, b) => b - a);
    
    if (frequencies[0] === 5) return 'Five Alike';
    if (frequencies[0] === 4) return 'Four Alike';
    if (frequencies[0] === 3 && frequencies[1] === 2) return 'Full House';
    if (frequencies[0] === 3) return 'Three Alike';
    if (frequencies[0] === 2 && frequencies[1] === 2) return 'Two Pair';
    if (frequencies[0] === 2) return 'One Pair';
    return 'No Two Alike';
  };

  const getDiceEmoji = (value: number) => {
    const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return emojis[value - 1];
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl mb-2 flex items-center gap-3">
          <Dices className="w-10 h-10" />
          Poker Dice Probability
        </h1>
        <p className="text-slate-300">
          Interactive exploration of poker dice hand probabilities
        </p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
        <h2 className="text-xl mb-4">Problem Statement</h2>
        <p className="text-slate-200 mb-3">
          Poker dice is played by simultaneously rolling <strong>{numDice}</strong> dice. 
          Calculate the probability of each possible outcome:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-200">
          <div className="bg-slate-900/50 rounded p-2">
            <div>No two alike: 0.0926</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div>One pair: 0.4630</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div>Two pair: 0.2315</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div>Three alike: 0.1543</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div>Full house: 0.0386</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div>Four alike: 0.0193</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div>Five alike: 7.72×10⁻⁴</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Dice Roller</h2>
            <button
              onClick={rollDice}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Roll Dice
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            {currentRoll.map((die, i) => (
              <div
                key={i}
                className="w-20 h-20 bg-white text-slate-900 rounded-lg flex items-center justify-center text-5xl shadow-lg"
              >
                {getDiceEmoji(die)}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <div className="text-sm text-slate-300 mb-1">Result:</div>
            <div className="text-2xl text-slate-200">{analyzeRoll(currentRoll)}</div>
            <div className="text-sm text-slate-400 mt-2">
              Roll: [{currentRoll.join(', ')}]
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PokerDiceCalculator numDice={numDice} />
        <PokerDiceSimulation numDice={numDice} />
      </div>
    </div>
  );
}