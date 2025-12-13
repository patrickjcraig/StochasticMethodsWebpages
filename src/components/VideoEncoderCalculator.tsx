import React, { useMemo } from 'react';
import { Video, Calculator } from 'lucide-react';
import { VideoEncoderSimulation } from './VideoEncoderSimulation';

export function VideoEncoderCalculator() {
  const probabilities = useMemo(() => {
    return {
      100: 1 / 2,
      200: 1 / 4,
      300: 1 / 8,
      400: 1 / 16,
      500: 1 / 16
    };
  }, []);

  const calculations = useMemo(() => {
    // Event J: packet length >= 300
    // J = {300, 400, 500}
    const pJ = probabilities[300] + probabilities[400] + probabilities[500];

    // Event K: packet length is multiple of 200
    // K = {200, 400}
    const pK = probabilities[200] + probabilities[400];

    // J ∩ K: length >= 300 AND multiple of 200
    // J ∩ K = {400}
    const pJandK = probabilities[400];

    // J̄ ∩ K: length < 300 AND multiple of 200
    // J̄ = {100, 200}, K = {200, 400}
    // J̄ ∩ K = {200}
    const pNotJandK = probabilities[200];

    // J ∪ K: length >= 300 OR multiple of 200
    // J ∪ K = {200, 300, 400, 500}
    const pJorK = pJ + pK - pJandK;

    return {
      J: {
        set: [300, 400, 500],
        prob: pJ
      },
      K: {
        set: [200, 400],
        prob: pK
      },
      JandK: {
        set: [400],
        prob: pJandK
      },
      notJandK: {
        set: [200],
        prob: pNotJandK
      },
      JorK: {
        set: [200, 300, 400, 500],
        prob: pJorK
      }
    };
  }, [probabilities]);

  const formatProbability = (p: number) => {
    // Convert to fraction
    const denominators = [2, 4, 8, 16, 32];
    for (const denom of denominators) {
      const numer = p * denom;
      if (Math.abs(numer - Math.round(numer)) < 0.0001) {
        return `${Math.round(numer)}/${denom}`;
      }
    }
    return p.toFixed(4);
  };

  const getColorClass = (eventName: string) => {
    const colors: { [key: string]: string } = {
      'J': 'border-blue-500/30 bg-blue-900/20',
      'K': 'border-green-500/30 bg-green-900/20',
      'JandK': 'border-purple-500/30 bg-purple-900/20',
      'notJandK': 'border-orange-500/30 bg-orange-900/20',
      'JorK': 'border-pink-500/30 bg-pink-900/20',
    };
    return colors[eventName] || 'border-slate-500/30 bg-slate-900/20';
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl mb-2 flex items-center gap-3">
          <Video className="w-10 h-10" />
          Video Encoder Packet Lengths
        </h1>
        <p className="text-slate-300">
          Calculate probabilities for packet length events (Problem 6)
        </p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Problem Setup</h2>
        <div className="space-y-3 text-slate-300">
          <p>
            A video encoder outputs packets of various lengths L ∈ {'{100, 200, 300, 400, 500}'} bytes.
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(probabilities).map(([length, prob]) => (
              <div key={length} className="bg-slate-900/50 rounded p-3 text-center">
                <div className="text-sm text-slate-400">L = {length}</div>
                <div className="text-lg mt-1">{formatProbability(prob)}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {(prob * 100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Event Definitions</h2>
        <div className="space-y-3">
          <div className="bg-slate-900/50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <strong className="text-blue-300">Event J:</strong>
              <span className="text-slate-300">Packet length ≥ 300 bytes</span>
            </div>
            <div className="text-sm text-slate-400 ml-5">
              J = {'{300, 400, 500}'}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <strong className="text-green-300">Event K:</strong>
              <span className="text-slate-300">Packet length is a multiple of 200 bytes</span>
            </div>
            <div className="text-sm text-slate-400 ml-5">
              K = {'{200, 400}'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Probability Calculations
        </h2>

        <div className="space-y-3">
          {/* Part (a): J */}
          <div className={`rounded-lg p-4 border ${getColorClass('J')}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-lg text-slate-100">(a) P(J)</div>
                <div className="text-sm text-slate-400">Length ≥ 300 bytes</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400">Event set:</div>
                <div className="text-white">{JSON.stringify(calculations.J.set)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Probability:</div>
                <div className="text-2xl text-white">{formatProbability(calculations.J.prob)}</div>
                <div className="text-sm text-slate-500">= {(calculations.J.prob * 100).toFixed(2)}%</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 rounded p-2">
              = P(L=300) + P(L=400) + P(L=500) = 1/8 + 1/16 + 1/16 = 1/4
            </div>
          </div>

          {/* Part (b): K */}
          <div className={`rounded-lg p-4 border ${getColorClass('K')}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-lg text-slate-100">(b) P(K)</div>
                <div className="text-sm text-slate-400">Multiple of 200 bytes</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400">Event set:</div>
                <div className="text-white">{JSON.stringify(calculations.K.set)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Probability:</div>
                <div className="text-2xl text-white">{formatProbability(calculations.K.prob)}</div>
                <div className="text-sm text-slate-500">= {(calculations.K.prob * 100).toFixed(2)}%</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 rounded p-2">
              = P(L=200) + P(L=400) = 1/4 + 1/16 = 5/16
            </div>
          </div>

          {/* Part (c): J ∩ K */}
          <div className={`rounded-lg p-4 border ${getColorClass('JandK')}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-lg text-slate-100">(c) P(J ∩ K)</div>
                <div className="text-sm text-slate-400">Length ≥ 300 AND multiple of 200</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400">Event set:</div>
                <div className="text-white">{JSON.stringify(calculations.JandK.set)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Probability:</div>
                <div className="text-2xl text-white">{formatProbability(calculations.JandK.prob)}</div>
                <div className="text-sm text-slate-500">= {(calculations.JandK.prob * 100).toFixed(2)}%</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 rounded p-2">
              = P(L=400) = 1/16
            </div>
          </div>

          {/* Part (d): J̄ ∩ K */}
          <div className={`rounded-lg p-4 border ${getColorClass('notJandK')}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-lg text-slate-100">(d) P(J̄ ∩ K)</div>
                <div className="text-sm text-slate-400">Length &lt; 300 AND multiple of 200</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400">Event set:</div>
                <div className="text-white">{JSON.stringify(calculations.notJandK.set)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Probability:</div>
                <div className="text-2xl text-white">{formatProbability(calculations.notJandK.prob)}</div>
                <div className="text-sm text-slate-500">= {(calculations.notJandK.prob * 100).toFixed(2)}%</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 rounded p-2">
              J̄ = {'{100, 200}'}, K = {'{200, 400}'} → J̄ ∩ K = {'{200}'} → P = 1/4
            </div>
          </div>

          {/* Part (e): J ∪ K */}
          <div className={`rounded-lg p-4 border ${getColorClass('JorK')}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-lg text-slate-100">(e) P(J ∪ K)</div>
                <div className="text-sm text-slate-400">Length ≥ 300 OR multiple of 200</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400">Event set:</div>
                <div className="text-white">{JSON.stringify(calculations.JorK.set)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Probability:</div>
                <div className="text-2xl text-white">{formatProbability(calculations.JorK.prob)}</div>
                <div className="text-sm text-slate-500">= {(calculations.JorK.prob * 100).toFixed(2)}%</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 rounded p-2">
              = P(J) + P(K) - P(J ∩ K) = 1/4 + 5/16 - 1/16 = 8/16 = 1/2
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm mb-3">Verification</h3>
        <div className="text-xs text-slate-400 space-y-2">
          <p>
            <strong>Sum of all probabilities:</strong> 1/2 + 1/4 + 1/8 + 1/16 + 1/16 = 16/16 = 1 ✓
          </p>
          <p>
            <strong>Union formula check:</strong> P(J ∪ K) = P(J) + P(K) - P(J ∩ K)
            <br />= 4/16 + 5/16 - 1/16 = 8/16 = 1/2 ✓
          </p>
          <p>
            <strong>Note:</strong> Event J̄ ∩ K represents packets that are multiples of 200 but less than 300,
            which is only the 200-byte packet.
          </p>
        </div>
      </div>

      <VideoEncoderSimulation />
    </div>
  );
}
