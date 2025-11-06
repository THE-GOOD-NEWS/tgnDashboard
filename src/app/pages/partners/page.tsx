"use client";

import React from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PartnerComponent from "@/components/PartnerComponent";

const PartnersPage = () => {
  return (
    <DefaultLayout>
      {/* <Breadcrumb pageName="Partners" /> */}
      <div className="gap-5 md:gap-10">
        <PartnerComponent />
      </div>
    </DefaultLayout>
  );
};

export default PartnersPage;
