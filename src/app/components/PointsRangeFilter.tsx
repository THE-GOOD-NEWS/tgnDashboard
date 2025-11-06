import React, { useState } from 'react';

type Props = {
  onFilter: (min: number, max: number) => void;
};

const PointsRangeFilter: React.FC<Props> = ({ onFilter }) => {
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(Number(min) || 0, Number(max) || Infinity);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2 items-end">
      <div>
        <label className="block text-sm">Min Points</label>
        <input type="number" value={min} onChange={e => setMin(e.target.value)} className="border p-1 rounded" min={0} />
      </div>
      <div>
        <label className="block text-sm">Max Points</label>
        <input type="number" value={max} onChange={e => setMax(e.target.value)} className="border p-1 rounded" min={0} />
      </div>
      <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Filter</button>
    </form>
  );
};

export default PointsRangeFilter; 