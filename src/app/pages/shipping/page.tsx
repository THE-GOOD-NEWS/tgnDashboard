'use client'

import ShippingZoneModal from '@/components/ShippingZonesModal';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { ShippingZone } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const ShippingZonesPage = () => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
  const [selectedZone, setSelectedZone] = useState<ShippingZone>({
    _id: '',
    zone_name: '',
    zone_rate: { local: 0, global: 0 },
    localGlobal: 'local',
    states: [],
    countries: [],
  });

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axios.get('/api/shipping-zones');
        setZones(res.data);
      } catch (error) {
        console.error("Error fetching shipping zones:", error);
      }
    };
    fetchZones();
  }, []);

  const openModal = (type: 'edit' | 'delete' | 'add', zone?: ShippingZone) => {
    setModalType(type);
    setSelectedZone(
      zone || { _id: '', zone_name: '', zone_rate: { local: 0, global: 0 }, localGlobal: 'local', states: [], countries: [] }
    );
  };

  return (
    <DefaultLayout>
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-start items-center gap-4 bg-backgroundColor">
        <div className="text-primary w-[97%] flex justify-end underline">
          <h3 className="hover:cursor-pointer" onClick={() => openModal('add')}>
            ADD NEW SHIPPING ZONE
          </h3>
        </div>

        {zones.length > 0 ? (
          <table className="w-[97%] text-left border border-gray-300 rounded">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Zone Name</th>
                <th className="p-2 border">Zone Type</th>
                <th className="p-2 border">Local Rate</th>
                <th className="p-2 border">Global Rate</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, index) => (
                <tr key={zone._id} className="hover:bg-gray-50 text-sm">
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border">{zone.zone_name}</td>
                  <td className="p-2 border">{zone.localGlobal}</td>
                  <td className="p-2 border">{zone.zone_rate?.local ?? '-'}</td>
                  <td className="p-2 border">{zone.zone_rate?.global ?? '-'}</td>
                  {/* <td className="p-2 border">
                    {zone.localGlobal === 'local'
                      ? (zone.states?.join(', ') || '-')
                      : (zone.countries?.join(', ') || '-')}
                  </td> */}
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => openModal('edit', zone)}
                      className="text-blue-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openModal('delete', zone)}
                      className="text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <h1>No shipping zones</h1>
        )}

        {/* Modal */}
        {modalType && (
          <ShippingZoneModal
            type={modalType}
            zone={selectedZone}
            closeModal={() => setModalType(null)}
            refreshZones={() => {
              axios.get('/api/shipping-zones').then((res) => {
                setZones(res.data);
              });
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default ShippingZonesPage;
