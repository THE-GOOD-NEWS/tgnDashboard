import { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { thirdFont } from "@/app/lib/fonts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const options: ApexOptions = {
  colors: ["#D32333"],
  chart: {
    fontFamily: "Satoshi, sans-serif",
    type: "bar",
    height: 335,
    stacked: false,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  yaxis: [
    {
      title: { text: "Local Profit (EGP)" },
      min: 0,
      max: 25000,
      tickAmount: 5, 
      labels: {
        formatter: (value) => value.toFixed(0),
      },
    },
    // {
    //   title: { text: "Global Profit ($)" },
    //   min: 0,
    //   max: 1000,
    //   tickAmount: 5,
    //   labels: {
    //     formatter: (value) => value.toFixed(0),
    //   },
    // },
  ],
  responsive: [
    {
      breakpoint: 1536,
      options: {
        plotOptions: {
          bar: {
            borderRadius: 0,
            columnWidth: "25%",
          },
        },
      },
    },
  ],
  plotOptions: {
    bar: {
      horizontal: false,
      borderRadius: 0,
      columnWidth: "25%",
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: ["S","M", "T", "W", "T", "F", "S" ],
  },
  legend: {
    position: "top",
    horizontalAlign: "left",
    fontFamily: "Satoshi",
    fontWeight: 500,
    fontSize: "14px",
  },
  fill: { opacity: 1 },
};

const ChartTwo: React.FC = () => {
  const [series, setSeries] = useState([
    { name: "Local Profit", data: [0, 0, 0, 0, 0, 0, 0] },
    // { name: "Global Profit", data: [0, 0, 0, 0, 0, 0, 0] },
  ]);
  const [week, setWeek] = useState("thisWeek"); // state to store week selection

  const fetchOrders = async (week: string) => {
    try {
      const response = await axios.get(`/api/localGlobalProfit?week=${week}`);
      const orders = response.data.data || [];
  
      if (!Array.isArray(orders)) {
        console.error("Invalid data format:", orders);
        return;
      }
  
      const localProfits = new Array(7).fill(0);
      // const globalProfits = new Array(7).fill(0);
  
      orders.forEach((order: any) => {
        const date = new Date(order.createdAt);
        const dayOfWeek = date.getDay();
  
       
          localProfits[dayOfWeek] += order.subTotal || 0;
 
      });
  
      setSeries([
        { name: "Local Profit", data: localProfits },
        // { name: "Global Profit", data: globalProfits },
      ]);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders(week); // fetch orders based on selected week
  }, [week]); // fetch data again when 'week' state changes
  
  return (
    <div className="col-span-12 rounded-2xl border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-6">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className={`${thirdFont.className} text-secondary text-2xl tracking-normal font-semibold  dark:text-white`}>
            Profit this week
          </h4>
        </div>
        <div>
          <div className="relative z-20 inline-block">
            <select
              name="#"
              id="#"
              className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 text-sm font-medium outline-none"
              onChange={(e) => setWeek(e.target.value)} // Update 'week' state on selection
            >
              <option value="thisWeek" className="dark:bg-boxdark">This Week</option>
              <option value="lastWeek" className="dark:bg-boxdark">Last Week</option>
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
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div>
        <div id="chartTwo" className="-mb-9 -ml-5">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartTwo;
