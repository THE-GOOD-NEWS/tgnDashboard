"use client";
import axios from "axios";
import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/jsvectormap.css";
import "jsvectormap/dist/maps/world.js";
import React, { useEffect, useState, useMemo, useRef } from "react";

const MapOne: React.FC = () => {
  interface Visit {
    deviceType: string;
    countryCode: string;
  }
  const [visits, setVisits] = useState<Visit[]>([]);
  const countryCountsRef = useRef<{ [key: string]: number }>({});
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Calculate country counts
  const countryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    visits.forEach((visit) => {
      const code = visit.countryCode?.toUpperCase();
      if (code) {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [visits]);
const [duration,setDuration]= useState("thisWeek")

  useEffect(() => {
    countryCountsRef.current = countryCounts;
  }, [countryCounts]);

  // Sort countries and get names
  const sortedCountries = useMemo(() => {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({
        code,
        count,
        name: regionNames.of(code) || code,
      }));
  }, [countryCounts]);

  useEffect(() => {
    const mapContainer = document.getElementById('mapOne');
    if (!mapContainer) return;

    // Initialize map
 // Inside your useEffect for map initialization:
new jsVectorMap({
  selector: "#mapOne",
  map: "world",
  zoomButtons: true,
  regionStyle: {
    initial: { fill: "#C8D0D8" },
    hover: {
      fillOpacity: 1,
      fill: "#473728",
    },
  },
  regionLabelStyle: {
    initial: {
      fontFamily: "Satoshi",
      fontWeight: "semibold",
      fill: "#fff",
    },
    hover: { cursor: "pointer" },
  },
  // labels: {
  //   regions: {
  //     render() {
  //       return ""; // This hides the original country code labels
  //     },
  //   },
  // },
  // In your map initialization config:
// labels: {
//   regions: {
//     render() {
//       return ""; // Return empty string to hide default labels
//     },
//   },
// },
});

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute z-10 bg-white dark:bg-boxdark text-black dark:text-white px-2 py-1 rounded shadow text-sm';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    mapContainer.appendChild(tooltip);
    tooltipRef.current = tooltip;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.classList.contains('jvm-region')) {
        const code = target.getAttribute('data-code');
        if (code) {
          const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
          const countryName = regionNames.of(code) || code;
          const count = countryCountsRef.current[code] || 0;
          
          if (tooltipRef.current) {
            tooltipRef.current.textContent = `${countryName}: ${count} visit${count !== 1 ? 's' : ''}`;
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = `${e.clientX - mapContainer.getBoundingClientRect().left + 10}px`;
            tooltipRef.current.style.top = `${e.clientY - mapContainer.getBoundingClientRect().top + 10}px`;
          }
        }
      } else {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      }
    };

    mapContainer.addEventListener('mousemove', handleMouseMove);

    return () => {
      mapContainer.removeEventListener('mousemove', handleMouseMove);
      mapContainer.replaceChildren();
      tooltipRef.current = null;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios(`/api/visites?duration=${duration}`);
        if (Array.isArray(response.data.data)) {
          setVisits(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching visit data:", error);
      }
    };
    fetchData();
  }, [duration]);

  return (
    <div className="col-span-12  rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-12">
     <div className="flex w-full justify-between items-center"
     >

      <h4 className="mb-2 text-xl font-semibold text-black dark:text-white">
        Sessions by Country
      </h4>
      <div className="relative z-20 inline-block">
            <select
            onChange={(e) => setDuration(e.target.value)}
              name=""
              id=""
              className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 text-sm font-medium outline-none"
            >
              <option value="thisWeek" className="dark:bg-boxdark">
                this week
              </option>
              <option value="lastWeek" className="dark:bg-boxdark">
                last week
              </option>
              <option value="thisMonth" className="dark:bg-boxdark">
                this month
              </option>
              <option value="lastMonth" className="dark:bg-boxdark">
                last month
              </option>
              <option value="thisYear" className="dark:bg-boxdark">
                this year
              </option>
            </select>
            <span className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.47072 1.08816C0.47072 1.02932 0.500141 0.955772 0.54427 0.911642C0.647241 0.808672 0.809051 0.808672 0.912022 0.896932L4.85431 4.60386C4.92785 4.67741 5.06025 4.67741 5.14851 4.60386L9.09079 0.896932C9.19376 0.793962 9.35557 0.808672 9.45854 0.911642C9.56151 1.01461 9.5468 1.17642 9.44383 1.27939L5.50155 4.98632C5.22206 5.23639 4.78076 5.23639 4.51598 4.98632L0.558981 1.27939C0.50014 1.22055 0.47072 1.16171 0.47072 1.08816Z"
                  fill="#637381"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.22659 0.546578L5.00141 4.09604L8.76422 0.557869C9.08459 0.244537 9.54201 0.329403 9.79139 0.578788C10.112 0.899434 10.0277 1.36122 9.77668 1.61224L9.76644 1.62248L5.81552 5.33722C5.36257 5.74249 4.6445 5.7544 4.19352 5.32924C4.19327 5.32901 4.19377 5.32948 4.19352 5.32924L0.225953 1.61241C0.102762 1.48922 -4.20186e-08 1.31674 -3.20269e-08 1.08816C-2.40601e-08 0.905899 0.0780105 0.712197 0.211421 0.578787C0.494701 0.295506 0.935574 0.297138 1.21836 0.539529L1.22659 0.546578ZM4.51598 4.98632C4.78076 5.23639 5.22206 5.23639 5.50155 4.98632L9.44383 1.27939C9.5468 1.17642 9.56151 1.01461 9.45854 0.911642C9.35557 0.808672 9.19376 0.793962 9.09079 0.896932L5.14851 4.60386C5.06025 4.67741 4.92785 4.67741 4.85431 4.60386L0.912022 0.896932C0.809051 0.808672 0.647241 0.808672 0.54427 0.911642C0.500141 0.955772 0.47072 1.02932 0.47072 1.08816C0.47072 1.16171 0.50014 1.22055 0.558981 1.27939L4.51598 4.98632Z"
                  fill="#637381"
                />
              </svg>
            </span>
          </div>
     </div>
      <div className="h-90 w-full">
        <div id="mapOne" className="mapOne map-btn" ref={mapContainerRef}></div>
      </div>
      
      {/* Country Ranking Section */}
      <div className="mt-6">
        <h5 className="mb-3 text-lg font-medium text-black dark:text-white">
          Country Rankings
        </h5>
        <div className="space-y-2">
          {sortedCountries.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No visits data available
            </div>
          ) : (
            sortedCountries.slice(0, 10).map((country, index) => (
              <div
                key={country.code}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm">
                  {index + 1}. {country.name}
                </span>
                <span className="text-sm font-semibold">
                  {country.count}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MapOne;