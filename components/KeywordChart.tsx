import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label
} from 'recharts';
import { KeywordMetric } from '../types';

interface KeywordChartProps {
  data: KeywordMetric[];
}

const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="font-bold text-slate-200 mb-1">{data.keyword}</p>
        <p className="text-slate-400">意圖: <span className="text-white">{data.intent}</span></p>
        <p className="text-slate-400">搜尋量: <span className="text-white">{data.volume}</span></p>
        <p className="text-slate-400">競爭度: <span className="text-white">{data.difficulty}</span></p>
      </div>
    );
  }
  return null;
};

const KeywordChart: React.FC<KeywordChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[400px] bg-slate-800/50 rounded-xl p-4 border border-slate-700 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 px-2">機會分佈圖</h3>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            type="number" 
            dataKey="difficulty" 
            name="Difficulty" 
            domain={[0, 100]} 
            stroke="#94a3b8"
            tick={{fill: '#94a3b8', fontSize: 12}}
          >
            <Label value="競爭難度 (低 → 高)" offset={0} position="insideBottom" fill="#64748b" fontSize={12} />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="volume" 
            name="Volume" 
            domain={[0, 100]} 
            stroke="#94a3b8"
            tick={{fill: '#94a3b8', fontSize: 12}}
          >
             <Label value="搜尋量 (低 → 高)" angle={-90} position="insideLeft" fill="#64748b" fontSize={12} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Keywords" data={data} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KeywordChart;