import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, LabelList } from 'recharts';
import { DrugCandidate, Language } from '../types';
import { translations } from '../translations';

interface ComparisonChartProps {
  candidates: DrugCandidate[];
  language: Language;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ candidates, language }) => {
  const t = translations[language];
  
  const data = candidates.map(c => ({
    name: c.name,
    x: c.efficacyScore,
    y: c.safetyScore,
    type: c.type
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-xl">
          <p className="font-bold text-white">{data.name}</p>
          <p className="text-sm text-emerald-400">{t.safetyScore}: {data.y}</p>
          <p className="text-sm text-blue-400">{t.efficacyScore}: {data.x}</p>
          <p className="text-xs text-slate-400 mt-1">{data.type}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] bg-slate-900 rounded-xl p-4 border border-slate-800">
      <h3 className="text-lg font-semibold text-slate-300 mb-4 text-center">{t.chartTitle}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Efficacy" 
            domain={[0, 100]} 
            label={{ value: t.efficacyScore, position: 'insideBottomRight', offset: -10, fill: '#94a3b8' }}
            stroke="#475569"
            tick={{ fill: '#64748b' }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Safety" 
            domain={[0, 100]} 
            label={{ value: t.safetyScore, angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            stroke="#475569"
            tick={{ fill: '#64748b' }}
          />
          <ZAxis type="number" range={[100, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Drugs" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.type === 'Original' ? '#64748b' : entry.y > 80 ? '#10b981' : '#3b82f6'} 
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
            <LabelList dataKey="name" position="top" style={{ fill: '#cbd5e1', fontSize: '12px' }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;