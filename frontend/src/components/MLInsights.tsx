import React from 'react';
import {
  BrainCircuit,
  ShieldAlert,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import type { MLlibMetrics } from '../types/seismic';

interface MLInsightsProps {
  mllib: MLlibMetrics;
}

export const MLInsights: React.FC<MLInsightsProps> = ({ mllib }) => {
  const { evaluation_metrics, class_metrics, confusion_matrix } = mllib;

  const labels = confusion_matrix.labels;
  const matrix = confusion_matrix.matrix_rows_actual;

  // Calculate totals for matrix
  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));
  const colTotals = [0, 1, 2].map((colIdx) => matrix.reduce((sum, row) => sum + row[colIdx], 0));
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Section Header: Model Evaluation Inquiry - Signature Liquid Glass Material */}
      <div className="liquid-glass-card p-6 lg:p-8 relative overflow-hidden group">
        {/* Environmental chromatic backlight */}
        <div className="absolute -top-12 left-1/4 w-[500px] h-48 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none -z-10" />
        <div className="absolute -top-12 right-12 w-[350px] h-48 bg-cyan-400/20 rounded-full blur-[80px] pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/15 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <BrainCircuit className="w-5 h-5 text-emerald-300" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300 font-mono">
                Model Evaluation Inquiry
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-1">
              Where does the classifier perform well, and where does it fail?
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Diagnostic evaluation of the Apache Spark MLlib Decision Tree across dominant and minority seismic classes (3,827 test events)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="liquid-glass-pill px-3 py-1 text-emerald-200 font-mono text-xs font-semibold">
              Accuracy: {(evaluation_metrics.test_accuracy * 100).toFixed(2)}%
            </span>
            <span className="liquid-glass-pill px-3 py-1 text-slate-200 font-mono text-xs">
              Depth: {mllib.tree_depth} · Nodes: {mllib.tree_num_nodes}
            </span>
          </div>
        </div>

        {/* Model Architecture & Features Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3.5 rounded-xl liquid-glass-pill border border-white/20 shadow-md">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">Target Column</span>
            <span className="font-mono text-cyan-300 font-bold text-sm block mt-0.5">{mllib.target_column}</span>
            <span className="text-[11px] font-semibold text-slate-200 block mt-1">3 Multiclass Tiers</span>
          </div>
          <div className="p-3.5 rounded-xl liquid-glass-pill border border-white/20 shadow-md">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">Input Features</span>
            <span className="font-mono text-white font-bold text-xs block mt-0.5">latitude, longitude, depth</span>
            <span className="text-[11px] font-semibold text-emerald-300 block mt-1">Zero Target Leakage</span>
          </div>
          <div className="p-3.5 rounded-xl liquid-glass-pill border border-white/20 shadow-md">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">Split Partitioning</span>
            <span className="font-mono text-white font-bold text-xs block mt-0.5">
              {mllib.training_records.toLocaleString()} Train / {mllib.test_records.toLocaleString()} Test
            </span>
            <span className="text-[11px] font-semibold text-slate-200 block mt-1">{mllib.split_ratio} Deterministic</span>
          </div>
          <div className="p-3.5 rounded-xl liquid-glass-pill border border-white/20 shadow-md">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">Baseline Comparison</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="font-mono text-emerald-300 font-extrabold text-sm">
                +{(
                  (evaluation_metrics.test_accuracy - evaluation_metrics.majority_baseline_accuracy) *
                  100
                ).toFixed(2)}%
              </span>
              <span className="text-[11px] font-medium text-white/90">
                over {(evaluation_metrics.majority_baseline_accuracy * 100).toFixed(2)}% baseline
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-200 block mt-1">Majority-Class Dummy</span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl liquid-glass-pill border border-white/20 shadow-md hover:border-emerald-400/50 transition-all">
          <span className="text-xs font-bold text-white block">Held-Out Accuracy</span>
          <span className="text-2xl font-black font-mono text-emerald-300 block my-1">
            {(evaluation_metrics.test_accuracy * 100).toFixed(2)}%
          </span>
          <span className="text-[11px] font-semibold text-slate-200 block">3,294 / 3,827 correct</span>
        </div>
        <div className="p-4 rounded-xl liquid-glass-pill border border-white/20 shadow-md hover:border-sky-400/50 transition-all">
          <span className="text-xs font-bold text-white block">Majority Baseline</span>
          <span className="text-2xl font-black font-mono text-sky-200 block my-1">
            {(evaluation_metrics.majority_baseline_accuracy * 100).toFixed(2)}%
          </span>
          <span className="text-[11px] font-semibold text-slate-200 block">Predict all &quot;Light&quot;</span>
        </div>
        <div className="p-4 rounded-xl liquid-glass-pill border border-white/20 shadow-md hover:border-cyan-400/50 transition-all">
          <span className="text-xs font-bold text-white block">Balanced Accuracy</span>
          <span className="text-2xl font-black font-mono text-cyan-300 block my-1">
            {(evaluation_metrics.balanced_accuracy * 100).toFixed(2)}%
          </span>
          <span className="text-[11px] font-semibold text-slate-200 block">Mean per-class recall</span>
        </div>
        <div className="p-4 rounded-xl liquid-glass-pill border border-white/20 shadow-md hover:border-violet-400/50 transition-all">
          <span className="text-xs font-bold text-white block">Weighted Precision</span>
          <span className="text-2xl font-black font-mono text-violet-300 block my-1">
            {evaluation_metrics.weighted_precision.toFixed(4)}
          </span>
          <span className="text-[11px] font-semibold text-slate-200 block">Support-weighted</span>
        </div>
        <div className="p-4 rounded-xl liquid-glass-pill border border-white/20 shadow-md hover:border-indigo-400/50 transition-all">
          <span className="text-xs font-bold text-white block">Weighted F1 Score</span>
          <span className="text-2xl font-black font-mono text-indigo-300 block my-1">
            {evaluation_metrics.weighted_f1_score.toFixed(4)}
          </span>
          <span className="text-[11px] font-semibold text-slate-200 block">Harmonic mean</span>
        </div>
        <div className="p-4 rounded-xl liquid-glass-pill border border-white/20 shadow-md hover:border-amber-400/50 transition-all">
          <span className="text-xs font-bold text-white block">Macro F1 Score</span>
          <span className="text-2xl font-black font-mono text-amber-300 block my-1">
            {evaluation_metrics.macro_f1_score.toFixed(4)}
          </span>
          <span className="text-[11px] font-semibold text-slate-200 block">Unweighted mean</span>
        </div>
      </div>

      {/* Confusion Matrix and Per-Class Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labeled Confusion Matrix - Signature Liquid Glass Material */}
        <div className="liquid-glass-card p-6 lg:p-7 flex flex-col justify-between relative overflow-hidden group">
          {/* Chromatic backlight flares */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-cyan-400/20 rounded-full blur-[70px] pointer-events-none -z-10" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-violet-500/20 rounded-full blur-[70px] pointer-events-none -z-10" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4 text-cyan-300" />
                <h4 className="text-base font-semibold text-white tracking-tight">
                  Labeled Confusion Matrix
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-200 liquid-glass-pill px-2.5 py-0.5 rounded-full">
                3,827 Test Samples
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              Rows denote ground truth actual classes; columns denote model predicted classes.
            </p>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/15">
                    <th className="p-2.5 text-left text-white font-extrabold uppercase tracking-wider text-[11px]">
                      Actual \ Predicted
                    </th>
                    {labels.map((lbl) => (
                      <th key={lbl} className="p-2.5 font-mono text-white font-extrabold text-xs">
                        {lbl}
                      </th>
                    ))}
                    <th className="p-2.5 font-mono text-cyan-300 font-extrabold text-xs">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {matrix.map((row, rIdx) => {
                    const actualLabel = labels[rIdx];
                    const isModeratePlus = actualLabel === 'Moderate_Plus';
                    return (
                      <tr key={actualLabel} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 text-left font-sans font-bold text-white text-xs">
                          {actualLabel}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          let cellBg = 'bg-white/[0.06] border border-white/10 text-slate-200 font-semibold';
                          if (isDiagonal) {
                            cellBg =
                              isModeratePlus
                                ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                          } else if (val > 100) {
                            cellBg = 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30';
                          }
                          return (
                            <td key={cIdx} className="p-2">
                              <span className={`inline-block px-3 py-1.5 rounded-lg w-full ${cellBg}`}>
                                {val.toLocaleString()}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-white font-extrabold">
                          {rowTotals[rIdx].toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-white/20 text-white font-bold">
                    <td className="p-2.5 text-left font-sans text-white font-bold">Predicted Total</td>
                    {colTotals.map((colSum, idx) => (
                      <td key={idx} className="p-2.5 text-white font-bold">
                        {colSum.toLocaleString()}
                      </td>
                    ))}
                    <td className="p-2.5 text-cyan-300 font-black">{grandTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-200 font-medium flex items-center justify-between">
            <span>Diagonal cells denote true positive matches.</span>
            <span className="text-rose-300 font-semibold">398 Moderate+ classified as Light</span>
          </div>
        </div>

        {/* Detailed Per-Class Performance Table - Signature Liquid Glass Material */}
        <div className="liquid-glass-card p-6 lg:p-7 flex flex-col justify-between relative overflow-hidden group">
          {/* Chromatic backlight flares */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-violet-500/20 rounded-full blur-[70px] pointer-events-none -z-10" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-[70px] pointer-events-none -z-10" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-violet-300" />
                <h4 className="text-base font-semibold text-white tracking-tight">
                  Per-Class Precision, Recall & F1
                </h4>
              </div>
              <span className="text-xs font-mono text-violet-200 liquid-glass-pill px-2.5 py-0.5 rounded-full">
                Class-Level Auditing
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              Evaluating precision vs recall trade-offs across imbalanced magnitude tiers.
            </p>

            <div className="space-y-3">
              {class_metrics.map((cm) => {
                const isModerate = cm.class_name === 'Moderate_Plus';
                return (
                  <div
                    key={cm.class_name}
                    className={`p-4 rounded-xl border transition-all ${
                      isModerate
                        ? 'bg-rose-950/25 border-rose-500/35 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                        : 'liquid-glass-pill border border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">
                          Class {cm.class_index}: {cm.class_name}
                        </span>
                        {isModerate && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Recall (1.69%)</span>
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-white">
                        F1: {cm.f1_score.toFixed(4)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                        <span className="text-[11px] text-white font-bold font-sans block">Precision</span>
                        <span className="font-extrabold text-white text-sm block mt-0.5">{(cm.precision * 100).toFixed(2)}%</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                        <span className="text-[11px] text-white font-bold font-sans block">Recall</span>
                        <span
                          className={`font-extrabold text-sm block mt-0.5 ${isModerate ? 'text-rose-300' : 'text-emerald-300'}`}
                        >
                          {(cm.recall * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                        <span className="text-[11px] text-white font-bold font-sans block">F1-Score</span>
                        <span className="font-extrabold text-cyan-300 text-sm block mt-0.5">{(cm.f1_score * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-200 font-medium">
            Light quakes exhibit 96.92% recall; Minor quakes show 87.50% recall.
          </div>
        </div>
      </div>

      {/* Critical Scientific Interpretation & Model Limitation Disclosure */}
      <div className="glass-panel-chart p-5 lg:p-6 border-l-4 border-l-amber-500 space-y-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-bold text-white tracking-tight">
            Scientific Integrity: Explaining the Moderate_Plus Recall Limitation & System Boundaries
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <p>
              <strong className="text-amber-300">1. Physical and Seismological Boundary:</strong> The input features consist strictly of spatial coordinates (<code className="text-cyan-300 font-mono">latitude</code>, <code className="text-cyan-300 font-mono">longitude</code>, and <code className="text-cyan-300 font-mono">depth</code>). While spatial hypocenters effectively locate fault structures and subduction dip angles, static location alone cannot predict the dynamic slip amplitude, rupture length, or total energy released during an earthquake.
            </p>
            <p>
              Small (M4.0) and large (M7.0+) earthquakes frequently nucleate at the exact same hypocentral depths along the same tectonic interface.
            </p>
          </div>

          <div className="space-y-2">
            <p>
              <strong className="text-amber-300">2. Gutenberg-Richter Class Imbalance:</strong> Under the Gutenberg-Richter power law, small earthquakes exponentially outnumber major ruptures (~82.3% Light vs ~10.8% Moderate+). The MLlib decision tree achieves 86.07% accuracy by successfully classifying the dominant Light class, but conservatively classifies 398 out of 413 Moderate_Plus events into the Light tier to minimize global entropy loss.
            </p>
            <p className="p-3 rounded-lg glass-sub-card text-slate-300">
              <strong className="text-cyan-300">Operational Scope:</strong> QuakeScope classifies historical tectonic observations into categorical magnitude bands. It is an analytical classification model and <strong className="text-white">NOT an earthquake forecasting or early-warning system</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
