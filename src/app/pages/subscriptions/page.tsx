"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Ipackage } from "@/interfaces/interfaces";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

interface Subscription {
  _id: string;
  paymentID: string;
  packageID: (Ipackage & { _id: string }) | null;
  email: string;
  subscribed: boolean;
  expiryDate: string;
  createdAt: string;
  redeemedLoyaltyPoints?: number;
  appliedDiscount?: string;
  appliedDiscountAmount?: number;
  // User information
  firstName?: string;
  lastName?: string;
  phone?: string;
  whatsAppNumber?: string;
  // Gift information
  isGift?: boolean;
  giftRecipientEmail?: string;
  specialMessage?: string;
  giftCardName?: string;
  // Address information
  country?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalZip?: string;
  // Billing information
  billingCountry?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingState?: string;
  billingAddress?: string;
  billingApartment?: string;
  billingPostalZip?: string;
  billingCity?: string;
  billingPhone?: string;
  // Payment information
  total?: number;
  subTotal?: number;
  shipping?: number;
  currency?: string;
}

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [packages, setPackages] = useState<(Ipackage & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete" | null>(
    null,
  );
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [search, setSearch] = useState("");
  // Filter states
  const [subscribedFilter, setSubscribedFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed items per page

  // Form state for add/edit
  const [form, setForm] = useState({
    paymentID: "",
    packageID: "",
    email: "",
    subscribed: false,
    expiryDate: "",
    // User information
    firstName: "",
    lastName: "",
    phone: "",
    whatsAppNumber: "",
    // Gift information
    isGift: false,
    giftRecipientEmail: "",
    specialMessage: "",
    giftCardName: "",
    // Address information
    country: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    postalZip: "",
    // Billing information
    billingCountry: "",
    billingFirstName: "",
    billingLastName: "",
    billingState: "",
    billingAddress: "",
    billingApartment: "",
    billingPostalZip: "",
    billingCity: "",
    billingPhone: "",
    // Payment information
    total: 0,
    subTotal: 0,
    shipping: 0,
    currency: "",
    redeemedLoyaltyPoints: 0,
    appliedDiscount: "",
    appliedDiscountAmount: 0,
  });
  useEffect(() => {
    fetchPackages();
    fetchSubscriptions(); // Initial fetch of subscriptions
  }, []);

  // Use a ref to track if this is the first render
  // const isInitialMount = React.useRef(true);

  useEffect(() => {
    // Skip the first render to prevent double fetching
    // if (isInitialMount.current) {
    //   isInitialMount.current = false;
    //   return;
    // }

    fetchSubscriptions();
    setCurrentPage(1); // Reset to first page when filters change
  }, [subscribedFilter, typeFilter, packageFilter]);

  // Pagination logic
  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.paymentID?.toLowerCase().includes(search.toLowerCase()) ||
      (s.firstName &&
        s.firstName.toLowerCase().includes(search.toLowerCase())) ||
      (s.lastName && s.lastName.toLowerCase().includes(search.toLowerCase())),
  );

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(
    startIndex,
    endIndex,
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let params: any = {};
      if (subscribedFilter !== "all") params.subscribed = subscribedFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (packageFilter !== "all") params.packageID = packageFilter;
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(
        `/api/subscriptions${query ? `?${query}` : ""}`,
      );
      setSubscriptions(res.data.data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get("/api/packages?all=true");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const openModal = (
    type: "add" | "edit" | "delete",
    subscription?: Subscription,
  ) => {
    setModalType(type);
    setSelectedSubscription(subscription || null);
    if (type === "edit" && subscription) {
      setForm({
        paymentID: subscription.paymentID,
        packageID: subscription.packageID?._id || "",
        email: subscription.email,
        subscribed: subscription.subscribed,
        expiryDate: subscription.expiryDate?.slice(0, 10) || "",
        // User information
        firstName: subscription.firstName || "",
        lastName: subscription.lastName || "",
        phone: subscription.phone || "",
        whatsAppNumber: subscription.whatsAppNumber || "",
        // Gift information
        isGift: subscription.isGift || false,
        giftRecipientEmail: subscription.giftRecipientEmail || "",
        specialMessage: subscription.specialMessage || "",
        giftCardName: subscription.giftCardName || "",
        // Address information
        country: subscription.country || "",
        address: subscription.address || "",
        apartment: subscription.apartment || "",
        city: subscription.city || "",
        state: subscription.state || "",
        postalZip: subscription.postalZip || "",
        // Billing information
        billingCountry: subscription.billingCountry || "",
        billingFirstName: subscription.billingFirstName || "",
        billingLastName: subscription.billingLastName || "",
        billingState: subscription.billingState || "",
        billingAddress: subscription.billingAddress || "",
        billingApartment: subscription.billingApartment || "",
        billingPostalZip: subscription.billingPostalZip || "",
        billingCity: subscription.billingCity || "",
        billingPhone: subscription.billingPhone || "",
        // Payment information
        total: subscription.total || 0,
        subTotal: subscription.subTotal || 0,
        shipping: subscription.shipping || 0,
        currency: subscription.currency || "",
        redeemedLoyaltyPoints: subscription.redeemedLoyaltyPoints || 0,
        appliedDiscount: subscription.appliedDiscount || "",
        appliedDiscountAmount: subscription.appliedDiscountAmount || 0,
      });
    } else if (type === "add") {
      setForm({
        paymentID: "",
        packageID: "",
        email: "",
        subscribed: false,
        expiryDate: "",
        // User information
        firstName: "",
        lastName: "",
        phone: "",
        whatsAppNumber: "",
        // Gift information
        isGift: false,
        giftRecipientEmail: "",
        specialMessage: "",
        giftCardName: "",
        // Address information
        country: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        postalZip: "",
        // Billing information
        billingCountry: "",
        billingFirstName: "",
        billingLastName: "",
        billingState: "",
        billingAddress: "",
        billingApartment: "",
        billingPostalZip: "",
        billingCity: "",
        billingPhone: "",
        // Payment information
        total: 0,
        subTotal: 0,
        shipping: 0,
        currency: "",
        redeemedLoyaltyPoints: 0,
        appliedDiscount: "",
        appliedDiscountAmount: 0,
      });
    }
  };

  const closeModal = (e?: React.MouseEvent) => {
    // If the click event exists and the target is the same as the currentTarget (the overlay),
    // or if no event was passed (called directly), close the modal
    if (!e || e.target === e.currentTarget) {
      setModalType(null);
      setSelectedSubscription(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;
    try {
      await axios.delete(
        `/api/subscriptions?subscriptionID=${selectedSubscription._id}`,
      );
      closeModal();
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === "add") {
        await axios.post("/api/subscriptions", form);
      } else if (modalType === "edit" && selectedSubscription) {
        await axios.put(
          `/api/subscriptions?subscriptionID=${selectedSubscription._id}`,
          form,
        );
      }
      closeModal();
      fetchSubscriptions();
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex min-h-[calc(100vh-124px)] w-full flex-col items-center p-4">
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by email or paymentID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded border p-2"
            />
            <select
              value={subscribedFilter}
              onChange={(e) => setSubscribedFilter(e.target.value)}
              className="rounded border p-2"
            >
              <option value="all">All</option>
              <option value="true">Paid</option>
              <option value="false">Paymob Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded border p-2"
            >
              <option value="all">All Types</option>
              <option value="real">Real</option>
              <option value="gift">Free</option>
            </select>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="rounded border p-2"
            >
              <option value="all">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg._id} value={pkg._id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="rounded bg-primary px-4 py-2 text-white"
            onClick={() => openModal("add")}
          >
            Add Subscription
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full border text-left">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Payment ID</th>
                <th className="border p-2">Package</th>
                {/* <th className="p-2 border">Total</th> */}
                <th className="border p-2">Paid</th>
                <th className="border p-2">Gift</th>
                <th className="border p-2">Expiry</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="border p-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                      <p className="text-gray-600">Loading subscriptions...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSubscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="border p-8 text-center text-gray-500"
                  >
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                paginatedSubscriptions.map((sub, idx) => (
                  <tr key={sub._id} className="hover:bg-gray-50">
                    <td className="border p-2">{startIndex + idx + 1}</td>
                    <td className="border p-2">{sub.email || "-"}</td>
                    <td className="border p-2">
                      {`${sub.firstName || ""} ${sub.lastName || ""}`.trim() ||
                        "-"}
                    </td>
                    <td className="border p-2">{sub.paymentID}</td>
                    <td className="border p-2">
                      {sub.packageID ? sub.packageID.name : "-"}
                    </td>
                    {/* <td className="p-2 border">{sub.total ? `${sub.currency || ""} ${sub.total.toFixed(2)}` : "-"}</td> */}
                    <td className="border p-2">
                      {sub.subscribed ? "Yes" : "No"}
                    </td>
                    <td className="border p-2">{sub.isGift ? "Yes" : "No"}</td>
                    <td className="border p-2">
                      {sub.expiryDate
                        ? new Date(sub.expiryDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="space-x-2 border p-2">
                      <button
                        onClick={() => openModal("edit", sub)}
                        className="text-blue-600 underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openModal("delete", sub)}
                        className="text-red-600 underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to{" "}
              {Math.min(
                startIndex + itemsPerPage,
                filteredSubscriptions.length,
              )}{" "}
              of {filteredSubscriptions.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`rounded px-3 py-1 text-sm ${
                            currentPage === page
                              ? "bg-blue-500 text-white"
                              : "border hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-sm text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  },
                )}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit */}
        {(modalType === "add" || modalType === "edit") && (
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:pl-72.5"
          >
            <div className="max-h-[90vh] w-[800px] overflow-y-auto rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">
                {modalType === "add" ? "Add Subscription" : "Edit Subscription"}
              </h2>
              <form
                onSubmit={handleSubmit}
                className="max-h-[80vh] space-y-4 overflow-y-auto p-2"
              >
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    required
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Payment ID
                  </label>
                  <input
                    type="text"
                    value={form.paymentID}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paymentID: e.target.value }))
                    }
                    required
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Package
                  </label>
                  <select
                    value={form.packageID}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, packageID: e.target.value }))
                    }
                    required
                    className="w-full rounded border p-2"
                  >
                    <option value="">Select a package</option>
                    {packages.map((pkg) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Paid</label>
                  <select
                    value={form.subscribed ? "true" : "false"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        subscribed: e.target.value === "true",
                      }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiryDate: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>

                <h3 className="mt-6 text-lg font-medium">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-medium">Gift Information</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Gifted
                  </label>
                  <select
                    value={form.isGift ? "true" : "false"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        isGift: e.target.value === "true",
                      }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Gift Card Name
                  </label>
                  <input
                    type="text"
                    value={form.giftCardName || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        giftCardName: e.target.value,
                      }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Gift Recipient Email
                  </label>
                  <input
                    type="email"
                    value={form.giftRecipientEmail}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        giftRecipientEmail: e.target.value,
                      }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Special Message
                  </label>
                  <textarea
                    value={form.specialMessage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, specialMessage: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={form.whatsAppNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          whatsAppNumber: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-medium">
                  Address Information
                </h3>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Country
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Apartment
                  </label>
                  <input
                    type="text"
                    value={form.apartment}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apartment: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, state: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Postal/Zip
                    </label>
                    <input
                      type="text"
                      value={form.postalZip}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, postalZip: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-medium">
                  Billing Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing First Name
                    </label>
                    <input
                      type="text"
                      value={form.billingFirstName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          billingFirstName: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing Last Name
                    </label>
                    <input
                      type="text"
                      value={form.billingLastName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          billingLastName: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Country
                  </label>
                  <input
                    type="text"
                    value={form.billingCountry}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, billingCountry: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    value={form.billingAddress}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, billingAddress: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Apartment
                  </label>
                  <input
                    type="text"
                    value={form.billingApartment}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        billingApartment: e.target.value,
                      }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing City
                    </label>
                    <input
                      type="text"
                      value={form.billingCity}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, billingCity: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing State
                    </label>
                    <input
                      type="text"
                      value={form.billingState}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, billingState: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing Postal/Zip
                    </label>
                    <input
                      type="text"
                      value={form.billingPostalZip}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          billingPostalZip: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Phone
                  </label>
                  <input
                    type="text"
                    value={form.billingPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, billingPhone: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>

                <h3 className="mt-6 text-lg font-medium">
                  Payment Information
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Total
                    </label>
                    <input
                      type="number"
                      value={form.total}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          total: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Subtotal
                    </label>
                    <input
                      type="number"
                      value={form.subTotal}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          subTotal: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Shipping
                    </label>
                    <input
                      type="number"
                      value={form.shipping}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shipping: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={form.currency}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, currency: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Redeemed Loyalty Points
                    </label>
                    <input
                      type="number"
                      value={form.redeemedLoyaltyPoints}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          redeemedLoyaltyPoints: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Applied Discount
                    </label>
                    <input
                      type="text"
                      value={form.appliedDiscount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          appliedDiscount: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      value={form.appliedDiscountAmount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          appliedDiscountAmount:
                            parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-white"
                  >
                    {modalType === "add" ? "Add" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {modalType === "delete" && selectedSubscription && (
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="w-96 rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Delete Subscription</h2>
              <p>Are you sure you want to delete this subscription?</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default SubscriptionsPage;
