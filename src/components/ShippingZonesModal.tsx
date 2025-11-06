'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShippingZone } from '@/interfaces/interfaces';
import ZoneStates from './ZoneStates';

interface Props {
  type: 'edit' | 'delete' | 'add';
  zone: ShippingZone;
  closeModal: () => void;
  refreshZones: () => void;
}

const ShippingZoneModal = ({ type, zone, closeModal, refreshZones }: Props) => {
  const [zoneName, setZoneName] = useState(zone?.zone_name || '');
  const [zoneRate, setZoneRate] = useState<{ local: number; global: number }>(zone?.zone_rate || { local: 0, global: 0 });
  const [localGlobal, setLocalGlobal] = useState<'local' | 'global'>(zone?.localGlobal || 'local');
  const [zoneStates, setZoneStates] = useState<string[]>(zone?.states || []); // State IDs
  const [zoneCountries, setZoneCountries] = useState<string[]>(zone?.countries || []); // Country IDs
  const [allStates, setAllStates] = useState<{ _id: string; name: string }[]>([]);
  const [allCountries, setAllCountries] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    if (localGlobal === 'local') {
      axios.get('/api/states').then(res => setAllStates(res.data));
    } else {
      axios.get('/api/countries').then(res => setAllCountries(res.data));
    }
  }, [localGlobal]);

  useEffect(() => {
    setZoneName(zone?.zone_name || '');
    setZoneRate(zone?.zone_rate || { local: 0, global: 0 });
    setLocalGlobal(zone?.localGlobal || 'local');
    setZoneStates(zone?.states || []);
    setZoneCountries(zone?.countries || []);
  }, [zone]);

  const handleSave = async () => {
    try {
      await axios.put(`/api/shipping-zones?zoneID=${zone._id}`, {
        zone_name: zoneName,
        zone_rate: zoneRate,
        localGlobal,
        states: localGlobal === 'local' ? zoneStates : [],
        countries: localGlobal === 'global' ? zoneCountries : [],
      });
      refreshZones();
      closeModal();
    } catch (err) {
      console.error('Error updating zone:', err);
    }
  };

  const addNewZone = async () => {
    try {
      await axios.post(`/api/shipping-zones`, {
        zone_name: zoneName,
        zone_rate: zoneRate,
        localGlobal,
        states: localGlobal === 'local' ? zoneStates : [],
        countries: localGlobal === 'global' ? zoneCountries : [],
      });
      refreshZones();
      closeModal();
    } catch (err) {
      console.error('Error adding zone:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/shipping-zones`, {
        data: { zoneID: zone._id },
      });
      refreshZones();
      closeModal();
    } catch (err) {
      console.error('Error deleting zone:', err);
    }
  };

  return (
    <div onClick={closeModal} className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 max-h-[95vh] overflow-y-scroll rounded w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">
          {type === 'edit' ? 'Edit Shipping Zone' : type === 'add' ? 'Add Shipping Zone' : 'Delete Shipping Zone'}
        </h2>

        {type === 'delete' ? (
          <>
            <p>Are you sure you want to delete <strong>{zone.zone_name}</strong>?</p>
            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded mt-4">
              Delete
            </button>
          </>
        ) : (
          <>
            <label className="block mb-2">Zone Name</label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2">Zone Type</label>
            <select
              value={localGlobal}
              onChange={e => setLocalGlobal(e.target.value as 'local' | 'global')}
              className="w-full border px-3 py-2 rounded mb-4"
            >
              <option value="local">Local</option>
              <option value="global">Global</option>
            </select>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-2">Local Rate</label>
                <input
                  type="number"
                  value={zoneRate.local}
                  onChange={e => setZoneRate(r => ({ ...r, local: Number(e.target.value) }))}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2">Global Rate</label>
                <input
                  type="number"
                  value={zoneRate.global}
                  onChange={e => setZoneRate(r => ({ ...r, global: Number(e.target.value) }))}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            {localGlobal === 'local' ? (
              <div className="mb-4">
                <label className="block mb-2">Assign States</label>
                <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-scroll border p-2 rounded">
                  {allStates.map(state => (
                    <label key={state._id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={zoneStates.includes(state._id)}
                        onChange={() => setZoneStates(prev => prev.includes(state._id)
                          ? prev.filter(id => id !== state._id)
                          : [...prev, state._id])}
                      />
                      <span>{state.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block mb-2">Assign Countries</label>
                <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-scroll border p-2 rounded">
                  {allCountries.map(country => (
                    <label key={country._id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={zoneCountries.includes(country._id)}
                        onChange={() => setZoneCountries(prev => prev.includes(country._id)
                          ? prev.filter(id => id !== country._id)
                          : [...prev, country._id])}
                      />
                      <span>{country.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={type === 'edit' ? handleSave : addNewZone}
              className="bg-primary text-white px-4 py-2 rounded mr-2 mt-4"
            >
              {type === 'edit' ? 'Save Changes' : 'Add Zone'}
            </button>
          </>
        )}

        <button onClick={closeModal} className="ml-2 mt-4 text-gray-600 underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ShippingZoneModal;
