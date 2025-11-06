'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface State {
  _id: string;
  name: string;
  shipping_zone: string;
}

const ZoneStates = ({
  zoneId,
  zoneStates,
  setZoneStates,
}: {
  zoneId: string;
  zoneStates: string[];
  setZoneStates: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [states, setStates] = useState<State[]>([]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get('/api/states');
        setStates(res.data);
        const preSelected = res.data
          .filter((s: State) => s.shipping_zone === zoneId)
          .map((s: State) => s._id);
        setZoneStates(preSelected); // initialize checked states for this zone
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, [zoneId]);

  const toggleState =async (stateId: string) => {
    const newShippingZone = zoneStates.includes(stateId) ? "x" : zoneId;
    setZoneStates((prev) =>
      prev.includes(stateId)
    ? prev.filter((id) => id !== stateId)
    : [...prev, stateId]
  );
  
  try{   
    console.log("zoneID"+zoneId)
       await axios.put(`/api/states?stateID=${stateId}`, {
      shipping_zone: newShippingZone
    });}
    catch (error) {
      console.log(error)
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold mb-1">Assign States to This Zone</h3>
      <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-scroll border p-2 rounded">
        {states.map((state) => (
          <label key={state._id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={zoneStates.includes(state._id)}
              onChange={() => toggleState(state._id)}
            />
            <span>{state.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ZoneStates;
