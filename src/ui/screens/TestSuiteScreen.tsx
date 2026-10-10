import React, { useState } from 'react';
import { runAllDomainTests, TestCaseResult } from '../../tests/testRunner';
import { CheckCircle2, XCircle, Play, RefreshCw, Terminal, Layers } from 'lucide-react';

export const TestSuiteScreen: React.FC = () => {
  const [results, setResults] = useState<TestCaseResult[]>(() => runAllDomainTests());
  const [running, setRunning] = useState(false);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  const handleRunTests = () => {
    setRunning(true);
    setTimeout(() => {
      const res = runAllDomainTests();
      setResults(res);
      setRunning(false);
    }, 150);
  };

  // Group by test suite
  const grouped = results.reduce<Record<string, TestCaseResult[]>>((acc, item) => {
    acc[item.suite] = acc[item.suite] || [];
    acc[item.suite].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                allPassed
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {allPassed ? 'ALL PASSING' : 'FAILURES DETECTED'}
            </span>
            <span className="text-xs font-mono text-slate-400">Vitest Test Runner</span>
          </div>

          <h1 className="text-2xl font-black text-white">Domain & Services Unit Test Suite</h1>
          <p className="text-xs text-slate-400 mt-1">
            Validates State transitions, Chain of Responsibility, Capacity, Cooldown, Money math, Forfeit policies,
            Settlement pre-checks, and Observers (Section 15).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center font-mono">
            <span className="text-2xl font-black text-emerald-400">{passedCount}</span>
            <span className="text-slate-500 text-base"> / {totalCount}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-sans">Passed</span>
          </div>

          <button
            disabled={running}
            onClick={handleRunTests}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{running ? 'Running Tests...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Test Suites Accordion / Groups */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([suiteName, tests]) => {
          const suitePassed = tests.every((t) => t.passed);

          return (
            <div key={suiteName} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Suite: {suiteName}</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    suitePassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {tests.filter((t) => t.passed).length}/{tests.length} Passed
                </span>
              </div>

              <div className="space-y-2">
                {tests.map((t) => (
                  <div
                    key={t.name}
                    className={`p-3 rounded-xl border text-xs font-mono transition-colors flex items-start justify-between gap-3 ${
                      t.passed
                        ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">{t.name}</div>
                        {t.error && <div className="text-[11px] text-rose-400 mt-1 font-mono">{t.error}</div>}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0">{t.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
