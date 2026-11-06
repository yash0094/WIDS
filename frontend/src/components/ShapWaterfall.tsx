import React from 'react';
import { ShapExplanation } from '../types';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ShapWaterfallProps {
  explanation: ShapExplanation | null | undefined;
  predictedLabel: string;
  confidence: number;
}

export const ShapWaterfall: React.FC<ShapWaterfallProps> = ({
  explanation,
  predictedLabel,
  confidence
}) => {
  if (!explanation || !explanation.feature_contributions) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-white text-center text-[#687684] text-xs shadow-neu font-medium">
        Select an event to view SHAP feature-level attributions.
      </div>
    );
  }

  // Find maximum absolute SHAP value for scaling bars
  const maxAbsShap = Math.max(
    ...explanation.feature_contributions.map((c) => Math.abs(c.shap_value)),
    0.05
  );

  return (
    <div className="bg-white rounded-3xl border border-white p-5 shadow-neu flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#D7F3EE] text-[#1E9E88] rounded-xl shadow-inner">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#14171A]">SHAP Feature Explanations</h4>
            <p className="text-xs text-[#687684]">
              Target: <span className="text-[#1E9E88] font-mono font-semibold">{explanation.target_class}</span> (Confidence: {(confidence * 100).toFixed(1)}%)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-mono text-[#687684] block font-semibold">Baseline E[f(x)]</span>
          <span className="text-xs font-mono font-bold text-[#14171A]">
            {explanation.base_value.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Narrative summary of driver features */}
      <div className="bg-[#ECEFF4] p-3 rounded-2xl border border-slate-200/60 text-xs text-[#14171A] leading-relaxed flex items-start space-x-2.5 shadow-inner">
        <AlertCircle className="w-4 h-4 text-[#1E9E88] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#14171A]">Attribution Summary: </span>
          <span className="text-[#687684]">{explanation.summary_text}</span>
        </div>
      </div>

      {/* Feature Contributions Waterfall List */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-mono font-bold text-[#687684] uppercase tracking-wider px-1">
          <span>Feature & Observed Value</span>
          <span>SHAP Impact (f(x) Shift)</span>
        </div>

        {explanation.feature_contributions.slice(0, 8).map((item) => {
          const isPositive = item.shap_value >= 0;
          const barWidth = Math.min(100, Math.round((Math.abs(item.shap_value) / maxAbsShap) * 100));

          return (
            <div
              key={item.feature}
              className="group p-2.5 rounded-2xl bg-[#ECEFF4]/60 hover:bg-[#ECEFF4] transition border border-transparent hover:border-slate-300/60"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[#14171A] font-semibold">{item.feature}</span>
                  <span className="text-[10px] text-[#687684] bg-white border border-slate-200/60 px-2 py-0.5 rounded-full font-mono shadow-xs">
                    = {item.feature_value}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 font-mono text-xs">
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-[#1E9E88]" />
                  )}
                  <span className={`font-bold ${isPositive ? 'text-rose-600' : 'text-[#1E9E88]'}`}>
                    {isPositive ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Impact Bar */}
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden flex shadow-inner">
                {isPositive ? (
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                ) : (
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-[#1E9E88] rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Footer */}
      <div className="text-[11px] text-[#687684] pt-2 border-t border-slate-100 flex items-center justify-between font-medium">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
          <span>Pushes toward {explanation.target_class}</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1E9E88] inline-block"></span>
          <span>Pushes toward Normal</span>
        </span>
      </div>
    </div>
  );
};
