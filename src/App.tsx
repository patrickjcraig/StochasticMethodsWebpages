import { useState, useCallback } from 'react';
import { RefreshCw, Info, ChevronDown, ChevronUp, Shield, Dices, Zap, Video, Package, DollarSign, Spade } from 'lucide-react';
import { SequenceVisualizer } from './components/SequenceVisualizer';
import { ProbabilityCalculator } from './components/ProbabilityCalculator';

import { PokerDice } from './components/PokerDice';
import { PowerballCalculator } from './components/PowerballCalculator';
import { BlackjackCalculator } from './components/BlackjackCalculator';
import { PacketErrorCalculator } from './components/PacketErrorCalculator';
import { DiceRollCalculator } from './components/DiceRollCalculator';
import { PowerNetworkCalculator } from './components/PowerNetworkCalculator';
import { VideoEncoderCalculator } from './components/VideoEncoderCalculator';

type PageType = 'honeypot' | 'poker' | 'powerball' | 'blackjack' | 'packets' | 'diceroll' | 'power' | 'video';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('honeypot');
  const [totalComputers, setTotalComputers] = useState(10);
  const [honeypots, setHoneypots] = useState(3);
  const [numAttacks, setNumAttacks] = useState(5);
  const [currentSequence, setCurrentSequence] = useState<string>('VVVVHHVVVH');
  const [showExplanation, setShowExplanation] = useState(true);

  const victims = totalComputers - honeypots;

  const generateRandomSequence = useCallback(() => {
    const computers = [
      ...Array(honeypots).fill('H'),
      ...Array(victims).fill('V')
    ];

    // Fisher-Yates shuffle
    for (let i = computers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [computers[i], computers[j]] = [computers[j], computers[i]];
    }

    setCurrentSequence(computers.join(''));
  }, [honeypots, victims]);

  const navButtons = [
    { id: 'honeypot' as const, label: 'Honeypot', icon: Shield },
    { id: 'poker' as const, label: 'Poker Dice', icon: Dices },
    { id: 'powerball' as const, label: 'Powerball', icon: DollarSign },
    { id: 'blackjack' as const, label: 'Blackjack', icon: Spade },
    { id: 'packets' as const, label: 'Packets', icon: Package },
    { id: 'diceroll' as const, label: 'Die Rolls', icon: Dices },
    { id: 'power' as const, label: 'Power Network', icon: Zap },
    { id: 'video' as const, label: 'Video Encoder', icon: Video },
  ];

  const renderNavigation = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {navButtons.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setCurrentPage(id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === id
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );

  if (currentPage === 'poker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {renderNavigation()}
          <PokerDice />
        </div>
      </div>
    );
  }

  if (currentPage === 'powerball') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {renderNavigation()}
          <PowerballCalculator />
        </div>
      </div>
    );
  }

  if (currentPage === 'blackjack') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {renderNavigation()}
          <BlackjackCalculator />
        </div>
      </div>
    );
  }

  if (currentPage === 'packets') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {renderNavigation()}
          <PacketErrorCalculator />
        </div>
      </div>
    );
  }

  if (currentPage === 'diceroll') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {renderNavigation()}
          <DiceRollCalculator />
        </div>
      </div>
    );
  }

  if (currentPage === 'power') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {renderNavigation()}
          <PowerNetworkCalculator />
        </div>
      </div>
    );
  }

  if (currentPage === 'video') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {renderNavigation()}
          <VideoEncoderCalculator />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        {renderNavigation()}

        <header className="mb-8">
          <h1 className="text-4xl mb-2">Honeypot Attack Probability</h1>
          <p className="text-slate-300">
            Interactive exploration of the modified honeypot detection problem
          </p>
        </header>

        <div className="bg-slate-800 border border-slate-700 rounded-lg mb-8">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex justify-between items-center p-6 hover:bg-slate-700/50 transition-colors"
          >
            <h2 className="text-xl flex items-center gap-2">
              <Info className="w-5 h-5" />
              Problem Description
            </h2>
            {showExplanation ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showExplanation && (
            <div className="px-6 pb-6 space-y-3 text-slate-300">
              <p>
                A hacker attacks a network with <strong>{totalComputers}</strong> computers,
                of which <strong>{honeypots}</strong> are honeypots (H) and <strong>{victims}</strong> are
                regular victims (V).
              </p>
              <p>
                <strong>Modified Game Rules:</strong> The game always involves exactly <strong>{numAttacks}</strong> attacks.
                Each attack selects 2 computers from the remaining pool.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Attack Detected:</strong> If the first computer selected in an attack is a honeypot,
                  the attack is detected. The hacker still selects a second computer, then starts a new attack.
                </li>
                <li>
                  <strong>Hacker Wins:</strong> If the first computer is a victim AND the second is a honeypot,
                  the hacker gains control of the honeypot system and wins.
                </li>
              </ul>
              <p>
                Since all {totalComputers} computers are eventually selected, we get a {totalComputers}-tuple like:
                <code className="bg-slate-900 px-2 py-1 rounded mx-2">VVVVHHVVVH</code>
              </p>
              <p>
                The hacker is caught if a honeypot appears at positions <strong>1, 3, 5, 7, ...</strong> (odd positions
                up to 2×{numAttacks}-1). These are the "first picks" of each attack.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <label className="block mb-2 text-slate-300">Total Computers</label>
            <input
              type="range"
              min="2"
              max="50"
              value={totalComputers}
              onChange={(e) => {
                const newTotal = Number(e.target.value);
                setTotalComputers(newTotal);
                setNumAttacks(Math.floor(newTotal / 2));
              }}
              className="w-full"
            />
            <div className="text-2xl mt-2">{totalComputers}</div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <label className="block mb-2 text-slate-300">Honeypots</label>
            <input
              type="range"
              min="0"
              max={Math.floor(totalComputers * 0.8)}
              value={honeypots}
              onChange={(e) => setHoneypots(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-2xl mt-2">{honeypots}</div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <label className="block mb-2 text-slate-300">Number of Attacks</label>
            <input
              type="range"
              min="2"
              max={Math.floor(totalComputers / 2)}
              value={numAttacks}
              onChange={(e) => setNumAttacks(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-2xl mt-2">{numAttacks}</div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Random Sequence Generator</h2>
            <button
              onClick={generateRandomSequence}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Generate New
            </button>
          </div>
          <SequenceVisualizer
            sequence={currentSequence}
            numAttacks={numAttacks}
          />
        </div>

        <div className="max-w-5xl mx-auto">
          <ProbabilityCalculator
            totalComputers={totalComputers}
            honeypots={honeypots}
            victims={victims}
            numAttacks={numAttacks}
          />
        </div>
      </div>
    </div>
  );
}