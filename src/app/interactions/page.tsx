import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";
import InteractionsTable from "./components/InteractionsTable";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Interactions | Wifey Dashboard",
  description:
    "Manage user interactions including likes, comments, and replies",
};

const InteractionsPage = () => {
  return (
    <>
      <DefaultLayout>
        <div className="">
          <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <InteractionsTable />
          </div>
        </div>
      </DefaultLayout>
    </>
  );
};

export default InteractionsPage;
