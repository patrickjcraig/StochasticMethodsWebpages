import React, { useState, useMemo } from 'react';
import { Package, Calculator, AlertCircle } from 'lucide-react';
import { PacketErrorSimulation } from './PacketErrorSimulation';

export function PacketErrorCalculator() {
  const [totalPackets] = useState(100);
  const [errorPacketsA, setErrorPacketsA] = useState(5);
  const [errorPacketsB, setErrorPacketsB] = useState(10);
  const [scenario, setScenario] = useState<'a' | 'b'>('a');

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const binomial = (n: number, k: number): number => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    return factorial(n) / (factorial(k) * factorial(n - k));
  };

  const scenarioACalc = useMemo(() => {
    // Scenario A: Test 2 packets, retransmit if EITHER has errors

    const calc5 = (errorPackets: number) => {
      const goodPackets = totalPackets - errorPackets;
      // Total ways to choose 2 from 100
      const totalWays = binomial(totalPackets, 2);
      // Ways to choose 2 packets without error
      const goodWays = binomial(goodPackets, 2);
      // Probability of NOT retransmitting = both packets are good
      const probNoRetransmit = goodWays / totalWays;
      return { totalWays, goodWays, probNoRetransmit };
    };

    const result5 = calc5(5);
    const result10 = calc5(10);

    return {
      errorPackets5: result5,
      errorPackets10: result10
    };
  }, [totalPackets]);

  const scenarioBCalc = useMemo(() => {
    // Scenario B: Test 3 packets, retransmit if MORE THAN ONE has errors
    // Don't retransmit if: 0 errors OR exactly 1 error

    const calc = (errorPackets: number) => {
      const goodPackets = totalPackets - errorPackets;
      const totalWays = binomial(totalPackets, 3);

      // Ways to choose 3 packets without error
      const zeroErrorWays = binomial(goodPackets, 3);

      // Ways to choose exactly 1 packet with error and 2 without
      const oneErrorWays = binomial(errorPackets, 1) * binomial(goodPackets, 2);

      const noRetransmitWays = zeroErrorWays + oneErrorWays;
      const probNoRetransmit = noRetransmitWays / totalWays;

      return { totalWays, zeroErrorWays, oneErrorWays, noRetransmitWays, probNoRetransmit };
    };

    const result5 = calc(5);
    const result10 = calc(10);

    return {
      errorPackets5: result5,
      errorPackets10: result10
    };
  }, [totalPackets]);

  const currentCalc = scenario === 'a' ? scenarioACalc : scenarioBCalc;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl mb-2 flex items-center gap-3">
          <Package className="w-10 h-10" />
          Packet Error Detection Calculator
        </h1>
        <p className="text-slate-300">
          Calculate probability of avoiding retransmission with error-detecting codes (SS-4)
        </p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Problem Setup
        </h2>
        <div className="space-y-3 text-slate-300">
          <p>
            A large image is split into <strong>100 packets</strong> and transmitted over a noisy channel.
          </p>
          <p>
            Each packet contains an error-detecting code, but the receiver only tests a specified
            number of packets for errors.
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl mb-4">Scenario Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setScenario('a')}
            className={`p-4 rounded-lg border-2 transition-all ${scenario === 'a'
              ? 'border-blue-500 bg-blue-900/30'
              : 'border-slate-600 bg-slate-900/20 hover:border-slate-500'
              }`}
          >
            <div className="text-lg mb-2">Scenario A</div>
            <div className="text-sm text-slate-400">Test 2 packets</div>
            <div className="text-sm text-slate-400">Retransmit if either has errors</div>
          </button>
          <button
            onClick={() => setScenario('b')}
            className={`p-4 rounded-lg border-2 transition-all ${scenario === 'b'
              ? 'border-blue-500 bg-blue-900/30'
              : 'border-slate-600 bg-slate-900/20 hover:border-slate-500'
              }`}
          >
            <div className="text-lg mb-2">Scenario B</div>
            <div className="text-sm text-slate-400">Test 3 packets</div>
            <div className="text-sm text-slate-400">Retransmit if &gt;1 has errors</div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            5 Error Packets
          </h2>

          {scenario === 'a' ? (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Total ways to choose 2 packets:</div>
                <div className="text-2xl">{scenarioACalc.errorPackets5.totalWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(100, 2)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Ways to choose 2 good packets:</div>
                <div className="text-2xl">{scenarioACalc.errorPackets5.goodWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(95, 2) - both from {totalPackets - 5} good packets</div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">P(No Retransmit):</div>
                <div className="text-3xl text-green-300">
                  {scenarioACalc.errorPackets5.probNoRetransmit.toFixed(4)}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  ≈ {(scenarioACalc.errorPackets5.probNoRetransmit * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Total ways to choose 3 packets:</div>
                <div className="text-2xl">{scenarioBCalc.errorPackets5.totalWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(100, 3)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Ways: 0 errors</div>
                <div className="text-xl">{scenarioBCalc.errorPackets5.zeroErrorWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(95, 3)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Ways: exactly 1 error</div>
                <div className="text-xl">{scenarioBCalc.errorPackets5.oneErrorWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(5, 1) × C(95, 2)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Total no-retransmit ways:</div>
                <div className="text-xl">{scenarioBCalc.errorPackets5.noRetransmitWays.toLocaleString()}</div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">P(No Retransmit):</div>
                <div className="text-3xl text-green-300">
                  {scenarioBCalc.errorPackets5.probNoRetransmit.toFixed(4)}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  ≈ {(scenarioBCalc.errorPackets5.probNoRetransmit * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            10 Error Packets
          </h2>

          {scenario === 'a' ? (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Total ways to choose 2 packets:</div>
                <div className="text-2xl">{scenarioACalc.errorPackets10.totalWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(100, 2)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Ways to choose 2 good packets:</div>
                <div className="text-2xl">{scenarioACalc.errorPackets10.goodWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(90, 2) - both from {totalPackets - 10} good packets</div>
              </div>

              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">P(No Retransmit):</div>
                <div className="text-3xl text-orange-300">
                  {scenarioACalc.errorPackets10.probNoRetransmit.toFixed(4)}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  ≈ {(scenarioACalc.errorPackets10.probNoRetransmit * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Total ways to choose 3 packets:</div>
                <div className="text-2xl">{scenarioBCalc.errorPackets10.totalWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(100, 3)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Ways: 0 errors</div>
                <div className="text-xl">{scenarioBCalc.errorPackets10.zeroErrorWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(90, 3)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Ways: exactly 1 error</div>
                <div className="text-xl">{scenarioBCalc.errorPackets10.oneErrorWays.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">C(10, 1) × C(90, 2)</div>
              </div>

              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-sm text-slate-400 mb-1">Total no-retransmit ways:</div>
                <div className="text-xl">{scenarioBCalc.errorPackets10.noRetransmitWays.toLocaleString()}</div>
              </div>

              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">P(No Retransmit):</div>
                <div className="text-3xl text-orange-300">
                  {scenarioBCalc.errorPackets10.probNoRetransmit.toFixed(4)}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  ≈ {(scenarioBCalc.errorPackets10.probNoRetransmit * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PacketErrorSimulation />

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm mb-3">Key Insights</h3>
        <div className="text-xs text-slate-400 space-y-2">
          <p>
            <strong>Scenario A:</strong> As error packets increase from 5 to 10, the probability
            of avoiding retransmission drops from ~90% to ~81% (testing 2 packets).
          </p>
          <p>
            <strong>Scenario B:</strong> Testing 3 packets with a tolerance of 1 error provides
            much higher reliability: ~99.4% for 5 errors and ~97.4% for 10 errors.
          </p>
          <p className="text-blue-400">
            Testing more packets with appropriate thresholds significantly improves detection accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
