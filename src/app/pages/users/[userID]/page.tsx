"use client";

import {
  UserCircle,
  Heart,
  ShoppingBag,
  Gift,
  BadgeCheck,
  BadgeAlert,
  Package,
  Truck,
  CheckCircle,
  Edit,
  Camera,
  ShoppingCart,
  Trash2,
  Crown,
} from "lucide-react";
import { useEffect, useState, useContext, Suspense, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
import { lifeyFont, thirdFont } from "@/app/lib/fonts";
// import { useToast } from '@/hooks/use-toast';
// import CartItemSmall from '../cart/CartItemSmall';
// import { useAuth } from '@/hooks/useAuth';
import { ILoyaltyTransaction, IOrder } from "@/interfaces/interfaces";
import { UploadDropzone } from "@/utils/uploadthing";
import { compressImage } from "@/utils/imageCompression";
import CartItemSmall from "@/components/CartItemSmall";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export default function AccountPage() {
  // No session, use userID from params
  const params = useParams();
  const userID = params?.userID;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  // const {loyaltyPoints} =useAuth()
  const [userInfo, setUserInfo] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    imageUrl: "",
    subscripton: { subscribed: false, expiryDate: new Date() },
  });
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [modalStatus, setModalStatus] = useState<string>("pending");
  const [modalPayment, setModalPayment] = useState<string>("pending");
  const [showUploader, setShowUploader] = useState(false);
  const [subscription, setSubscription] = useState({
    subscribed: false,
    expiryDate: new Date(),
  });
  // const handleRemoveFromWishlist = (productId: string, variant: any, attributes: any) => {
  //   setWishList((prevList) =>
  //     prevList.filter(
  //       (item) =>
  //         item.productId !== productId ||
  //         item.variant !== variant ||
  //         item.attributes !== attributes
  //     )
  //   );
  //   toast({
  //     title: "Removed from wishlist",
  //     description: "Item has been removed from your wishlist.",
  //   });
  // };
  // const { addItem } = useCart();
  // const { toast } = useToast();
  const fetchUserData = async () => {
    if (!userID) return;
    try {
      const response = await axios.get(`/api/users/profile?userID=${userID}`);
      const userData = response.data.user;
      const subscription = await axios(
        `/api/subscriptions?email=${userData.email}`,
      );
      console.log("DATA" + JSON.stringify(subscription.data));
      const subscriptionRecord = subscription.data?.data?.[0]; // Get first subscription record
      const expiryDateRaw = subscriptionRecord?.expiryDate;
      const expiryDate = expiryDateRaw ? new Date(expiryDateRaw) : null;
      const subscriptionData = {
        subscribed:
          expiryDate && expiryDate.getTime() > Date.now() ? true : false,
        expiryDate: expiryDateRaw,
      };
      console.log(JSON.stringify(subscriptionData) + " subscriptionData");
      setUserInfo({
        name: userData.username || "User",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "user@example.com",
        imageUrl: userData.imageURL || "",
        subscripton: subscriptionData,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserInfo((oldUser) => ({
        ...oldUser,
        name: "User",
        firstName: "",
        lastName: "",
        email: "user@example.com",
        imageUrl: "",
      }));
    }
  };

  const fetchUserOrders = async () => {
    if (!userID) return;
    setLoading(true);
    try {
      // alert(email);
      const response = await axios.get(`/api/orders?email=${userInfo.email}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchUserSubscription = async () => {
    const subscription = await axios(
      `/api/subscriptions?email=${userInfo.email}`,
    );
    const subscriptionData = subscription.data;
    console.log(subscriptionData);
    const subscriptionRecord = subscriptionData?.data?.[0]; // Get first subscription record
    const subscriptionNeededData = {
      subscribed: subscriptionRecord?.expiryDate > Date.now() ? true : false,
      expiryDate: subscriptionRecord?.expiryDate,
    };
    setSubscription(subscriptionNeededData);
  };

  useEffect(() => {
    if (userID) {
      fetchUserData();
    }
    if (userInfo.email) {
      // fetchUserSubscription();
      fetchUserOrders();
    }
  }, [userID, userInfo.email]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<
    ILoyaltyTransaction[]
  >([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  const fetchLoyaltyTransactions = async () => {
    if (!userID) return;
    setLoadingLoyalty(true);
    try {
      const response = await axios.get(
        `/api/loyalty/transactions?email=${userInfo.email}`,
      );
      setLoyaltyTransactions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching loyalty transactions:", error);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Loyality") {
      fetchLoyaltyTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userID]);

  //   addItem(item);
  //   handleRemoveFromWishlist(item.productId, item.variant, item.attributes);
  //   toast({
  //     title: "Added to cart",
  //     description: `${item.productName} has been moved to your cart.`,
  //   });
  // };

  // No session, skip unauthenticated redirect

  const [isUploading, setIsUploading] = useState(false);

  const handleComperession = async (files: File[]) => {
    setIsUploading(true);
    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith("image/")) {
            return await compressImage(file);
          }
          return file;
        }),
      );
      return compressedFiles;
    } catch (error) {
      console.error("Error during compression:", error);
      return files;
    } finally {
      setIsUploading(false);
    }
  };

  const [loyaltyPoints, setLoyaltyPoints] = useState({
    lifeTimePoints: 0,
    realLoyaltyPoints: 0,
  });

  // useEffect(() => {
  //   async function fetchLoyaltyPoints(userID: string) {
  //     try {
  //       const res = await fetch(`/api/loyalty/userPoints?userID=${userID}`);
  //       const data = await res.json();
  //       setLoyaltyPoints(
  //         data.loyaltyPoints || { lifeTimePoints: 0, realLoyaltyPoints: 0 },
  //       );
  //     } catch (error) {
  //       setLoyaltyPoints({
  //         lifeTimePoints: 0,
  //         realLoyaltyPoints: 0,
  //       });
  //     }
  //   }
  //   if (userID) {
  //     fetchLoyaltyPoints(userID.toString());
  //   }
  // }, [userID]);
  // Show loading state while fetching userInfo
  if (!userID || !userInfo.email) {
    return <ProfileSkeleton />;
  }

  // Dummy user object for UI compatibility
  const user = {
    name: userInfo.name || "User",
    email: userInfo.email || "user@example.com",
    isSubscribed: userInfo.subscripton.subscribed ? true : false, // You may fetch this from userInfo if available
    subscriptionExpiryDate: userInfo.subscripton.expiryDate, // You may fetch this from userInfo if available
    imgUrl: userInfo.imageUrl,
    loyaltyPoints: loyaltyPoints,
    wishlistItems: 0, // Set to 0 or fetch if available
    orders: orders.length,
  };

  const stats = [
    {
      name: "Loyalty Points",
      value: user.loyaltyPoints.lifeTimePoints,
      icon: Gift,
      color: "text-primary",
      bgColor: "bg-creamey",
    },
    // {
    //   name: "Wishlist Items",
    //   value: user.wishlistItems,
    //   icon: Heart,
    //   color: "text-primary",
    //   bgColor: "bg-creamey",
    // },
    {
      name: "Total Orders",
      value: user.orders,
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-creamey",
    },
  ];

  const tabs = [
    { id: "orders", label: "Recent Orders", icon: ShoppingBag },
    // { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "Loyality", label: "Loyalty", icon: Gift },
    { id: "info", label: "Info", icon: UserCircle },
  ];

  // Helper for order status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-creamey" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-creamey" />;
      case "confirmed":
        return <Package className="h-4 w-4 text-creamey" />;
      default:
        return <Package className="h-4 w-4 text-creamey" />;
    }
  };

  // Helper for order status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <DefaultLayout>
        <div className="space-y-6 px-4 py-4 text-creamey">
          {/* Profile Header */}
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex min-w-0 items-center space-x-4">
              {userInfo.imageUrl ? (
                <div className="relative h-24 w-24 flex-shrink-0 rounded-full border-2 border-primary">
                  <Image
                    className="rounded-full object-cover"
                    alt={user.name}
                    src={userInfo.imageUrl}
                    fill
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                  <UserCircle className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1
                  className={`break-words text-2xl font-bold tracking-normal text-primary sm:text-4xl ${thirdFont.className}`}
                >
                  {user.name}
                </h1>
                <p className="break-all text-sm font-semibold text-primary/80">
                  {user.email}
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary/80">
                  Subscription :{" "}
                  <span>
                    {userInfo.subscripton.subscribed ? (
                      <BadgeCheck className="text-primary/80" />
                    ) : (
                      <BadgeAlert />
                    )}
                  </span>
                </p>
                {user.isSubscribed && (
                  <p className="text-sm font-semibold text-primary/80">
                    Expires at :{" "}
                    {user.subscriptionExpiryDate
                      ? (() => {
                          const expiry = new Date(user.subscriptionExpiryDate);
                          const now = new Date();
                          const tenYearsFromNow = new Date(
                            now.setFullYear(now.getFullYear() + 10),
                          );
                          return expiry > tenYearsFromNow ? (
                            <span className="inline-flex items-end gap-2">
                              Lifetime Wifey <Crown />
                            </span>
                          ) : (
                            expiry.toLocaleDateString()
                          );
                        })()
                      : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="relative overflow-hidden rounded-lg bg-primary px-4 py-5 shadow sm:px-6"
              >
                <dt>
                  <div className={`absolute rounded-md ${stat.bgColor} p-3`}>
                    <stat.icon
                      className={`h-6 w-6 ${stat.color}`}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-16 truncate text-sm font-semibold text-creamey">
                    {stat.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                  <p className="text-2xl font-semibold text-creamey">
                    {stat.value}
                  </p>
                </dd>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="border-pinkey overflow-x-auto border-b">
            <nav className="-mb-px flex min-w-max space-x-4 sm:space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 whitespace-nowrap border-b-2 px-1 py-2 text-xs font-medium sm:space-x-2 sm:text-sm ${
                    activeTab === tab.id
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-primary/90 duration-300 hover:border-primary hover:text-primary"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "orders" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-primary">
                    Recent Orders
                  </h2>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 rounded-lg bg-gray-200"></div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-primary" />
                    <p className="text-primary">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="overflow-hidden rounded-lg  bg-primary text-creamey shadow"
                      >
                        <div className="border-b  px-4 py-5 text-creamey sm:px-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center space-x-3 text-creamey">
                              {getStatusIcon(order.status || "pending")}
                              <h3 className="truncate text-lg font-medium  leading-6">
                                Order : {order._id}
                              </h3>
                            </div>
                            <div className="flex flex-shrink-0 items-center space-x-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status || "pending")}`}
                              >
                                {order.status
                                  ? order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1)
                                  : "Pending"}
                              </span>
                              <span className="text-sm text-creamey">
                                {new Date(
                                  order.createdAt || "",
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-5 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-creamey">
                              <span className="font-medium ">Total:</span>{" "}
                              {order.total} LE
                            </div>
                            <button
                              className="hover:bg-everGreen rounded-md bg-creamey px-4 py-2 text-primary transition duration-300 hover:text-creamey"
                              // variant="outline"
                              // size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setModalStatus(order.status || "pending");
                                setModalPayment(order.payment || "pending");
                                setDetailsModal(true);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      className="rounded-2xl bg-primary text-creamey hover:border hover:border-primary hover:bg-creamey hover:text-primary"
                      // variant="outline"
                      // size="sm"
                      onClick={() => setShowAllOrders(!showAllOrders)}
                    >
                      {showAllOrders ? "Hide All" : "See All"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Loyality" && (
              <div className="">
                <h2 className="mb-4 text-lg font-semibold text-primary">
                  Loyalty Points
                </h2>
                <div className="w-full items-center justify-center">
                  {loadingLoyalty ? (
                    <div className="py-8 text-center">
                      Loading transactions...
                    </div>
                  ) : loyaltyTransactions.length === 0 ? (
                    <div className="py-8 text-center text-primary">
                      No loyalty transactions found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-primary/20">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-primary">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-primary">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-primary">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-primary">
                              Reason
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-primary">
                              Bonus
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                          {loyaltyTransactions.map((tx, idx) => (
                            <tr className="text-primary" key={idx}>
                              <td className="whitespace-nowrap px-4 py-2">
                                {tx.timestamp
                                  ? new Date(tx.timestamp).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2 capitalize">
                                {tx.type}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2">
                                {tx.type === "earn"
                                  ? `+${tx.amount}`
                                  : `-${tx.amount}`}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2">
                                {tx.reason || "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2">
                                {tx.bonusID && tx.bonusID?.bonusPoints
                                  ? `+${tx.bonusID.bonusPoints}`
                                  : `${tx.type === "earn" ? `+${tx.amount}` : "-"}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "info" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-primary">
                    Profile Information
                  </h2>
                  <button
                    className="border border-primary bg-creamey text-primary hover:cursor-pointer hover:bg-creamey hover:text-primary"
                    // variant="outline"
                    // size="sm"
                    onClick={() => setEditingInfo(!editingInfo)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {editingInfo ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className=" rounded-lg border-2  p-6 shadow-xl">
                  <div className="space-y-6">
                    {/* Profile Image */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {userInfo.imageUrl ? (
                          <div className="group relative h-20 w-20 overflow-hidden rounded-full">
                            <Image
                              src={userInfo.imageUrl}
                              alt="Profile"
                              fill
                              className="object-cover"
                            />
                            {editingInfo && (
                              <div
                                className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => setShowUploader(true)}
                              >
                                <Camera className="h-8 w-8 text-creamey" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                            <UserCircle className="h-12 w-12 text-gray-400" />
                            {editingInfo && (
                              <div
                                className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => setShowUploader(true)}
                              >
                                <Camera className="h-8 w-8 text-creamey" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-primary/80">
                          Profile Picture
                        </p>
                        {editingInfo && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-primary/80">
                              Click the camera icon to change
                            </p>
                            <button
                              type="button"
                              className="rounded-full bg-primary p-1 transition hover:bg-primary/80"
                              onClick={() => setShowUploader(true)}
                              aria-label="Change profile picture"
                            >
                              <Camera className="h-4 w-4 text-creamey" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Name */}
                    <div className="flex items-center gap-2 max-md:flex-col">
                      <label
                        htmlFor="name"
                        className="whitespace-nowrap text-sm font-medium text-primary/90"
                      >
                        User Name :
                      </label>
                      {editingInfo ? (
                        <input
                          id="name"
                          value={userInfo.name}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="border-primary bg-creamey text-primary"
                        />
                      ) : (
                        <p className=" text-sm text-primary">{userInfo.name}</p>
                      )}
                    </div>

                    {/* First Name */}
                    <div className="flex  items-center gap-2 max-md:flex-col">
                      <label
                        htmlFor="firstName"
                        className="whitespace-nowrap text-sm font-medium text-primary/90"
                      >
                        First Name :
                      </label>
                      {editingInfo ? (
                        <input
                          id="firstName"
                          value={userInfo.firstName}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          className="border-primary bg-creamey text-primary"
                        />
                      ) : (
                        <p className="text-sm text-primary">
                          {userInfo.firstName}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="flex items-center gap-2 max-md:flex-col">
                      <label
                        htmlFor="lastName"
                        className="whitespace-nowrap text-sm font-medium text-primary/90"
                      >
                        Last Name :
                      </label>
                      {editingInfo ? (
                        <input
                          id="lastName"
                          value={userInfo.lastName}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          className="border-primary bg-creamey text-primary"
                        />
                      ) : (
                        <p className=" text-sm text-primary">
                          {userInfo.lastName}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 max-md:flex-col">
                      <label
                        htmlFor="email"
                        className="whitespace-nowrap text-sm font-medium text-primary/90"
                      >
                        Email Address :
                      </label>
                      {editingInfo ? (
                        <input
                          id="email"
                          type="email"
                          value={userInfo.email}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="border-primary bg-creamey text-primary"
                        />
                      ) : (
                        <p className=" text-sm text-primary">
                          {userInfo.email}
                        </p>
                      )}
                    </div>

                    {/* Subscription Status */}
                    <div className="flex items-center gap-2 max-md:flex-col">
                      <label className="text-sm font-medium text-primary/90">
                        Subscription Status :
                      </label>
                      <div className=" flex items-center space-x-1">
                        {user.isSubscribed ? (
                          <>
                            <BadgeCheck className="h-4 w-4 text-primary" />
                            <span className="text-sm text-primary">
                              Active Subscription
                            </span>
                          </>
                        ) : (
                          <>
                            <BadgeAlert className="h-4 w-4 text-primary/80" />
                            <span className="text-sm text-primary/80">
                              No Active Subscription
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {editingInfo && (
                      <div className="flex space-x-3 pt-4">
                        <button
                          // onClick={handleSaveInfo}
                          className="bg-primary text-creamey hover:bg-primary/90"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Orders Section for "See All" button */}
          {showAllOrders && (
            <div id="orders-section" className="mt-12">
              <h2 className="mb-6 text-2xl font-bold text-primary">
                All Orders
              </h2>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 rounded-lg bg-gray-200"></div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-primary">
                    No orders yet
                  </h3>
                  <p className="text-gray-500">
                    Start shopping to see your order history here
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.slice(3, orders.length).map((order) => (
                    <div
                      key={order._id}
                      className="overflow-hidden rounded-lg  bg-primary text-creamey shadow"
                    >
                      <div className="border-b  px-4 py-5 text-creamey sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center space-x-3 text-creamey">
                            {getStatusIcon(order.status || "pending")}
                            <h3 className="truncate text-lg font-medium  leading-6">
                              Order : {order._id}
                            </h3>
                          </div>
                          <div className="flex flex-shrink-0 items-center space-x-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status || "pending")}`}
                            >
                              {order.status
                                ? order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)
                                : "Pending"}
                            </span>
                            <span className="text-sm text-creamey">
                              {new Date(
                                order.createdAt || "",
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-5 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-creamey">
                            <span className="font-medium ">Total:</span>{" "}
                            {order.total} LE
                          </div>
                          <button
                            className="hover:bg-everGreen bg-creamey text-primary transition duration-300 hover:text-creamey"
                            // variant="outline"
                            // size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setModalStatus(order.status || "pending");
                              setModalPayment(order.payment || "pending");
                              setDetailsModal(true);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isDetailsModalOpen && selectedOrder && (
            <div
              onClick={() => setDetailsModal(false)}
              className="fixed inset-0 z-50  flex items-center justify-center bg-black bg-opacity-50"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="scrollbar-hide text-everGreen h-[90vh] w-[90%] max-w-3xl overflow-y-scroll rounded-2xl bg-creamey p-6 shadow-lg"
              >
                <div className="mb-2 flex w-full items-center justify-end">
                  <span
                    className="hover:cursor-pointer"
                    onClick={() => setDetailsModal(false)}
                  >
                    x
                  </span>
                </div>
                <h2 className="text-everGreen mb-4 text-lg font-bold">
                  ORDER DETAILS
                </h2>
                <div className="space-y-2 text-left">
                  <p>
                    <strong>Order ID:</strong>{" "}
                    {selectedOrder.orderID || selectedOrder._id || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedOrder.email || "N/A"}
                  </p>
                  <p>
                    <strong>Customer:</strong> {selectedOrder.firstName || ""}{" "}
                    {selectedOrder.lastName || ""}
                  </p>
                  <p>
                    <strong>Cart:</strong>
                  </p>
                  <div className="flex flex-col gap-2">
                    {selectedOrder.cart?.map((item, index) => (
                      <CartItemSmall
                        key={index}
                        item={item}
                        wishListBool={false}
                      />
                    ))}
                  </div>
                  <p>
                    <strong>Phone:</strong> {selectedOrder.phone || "N/A"}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedOrder.address || ""}
                    {selectedOrder.address ? "," : ""}{" "}
                    {selectedOrder.city || ""}
                    {selectedOrder.city ? "," : ""} {selectedOrder.state || ""}
                    {selectedOrder.state ? "," : ""}{" "}
                    {selectedOrder.country || ""}
                  </p>
                  <p>
                    <strong>Postal Code:</strong>{" "}
                    {selectedOrder.postalZip || "N/A"}
                  </p>
                  {/* Status Dropdown */}
                  <label className="mt-4 block font-semibold">Status:</label>
                  <select
                    className="w-full border bg-creamey p-2"
                    value={modalStatus}
                    disabled
                    onChange={() => {}}
                  >
                    {[
                      "pending",
                      "confirmed",
                      "shipped",
                      "delivered",
                      "cancelled",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {/* Payment Dropdown */}
                  <label className="mt-4 block font-semibold">Payment:</label>
                  <select
                    className="w-full border bg-creamey p-2"
                    value={modalPayment}
                    disabled
                    onChange={() => {}}
                  >
                    {["pending", "failed", "confirmed"].map((payment) => (
                      <option key={payment} value={payment}>
                        {payment}
                      </option>
                    ))}
                  </select>
                  <p>
                    <strong>Sub-Total:</strong>{" "}
                    {selectedOrder.subTotal !== undefined
                      ? selectedOrder.subTotal.toFixed(2)
                      : "N/A"}{" "}
                    LE
                  </p>
                  {/* <p><strong>Shipping:</strong> {selectedOrder.shipping !== undefined ? selectedOrder.shipping.toFixed(2) : 'N/A'} LE</p> */}
                  <p>
                    <strong>Total:</strong>{" "}
                    {selectedOrder.total !== undefined
                      ? selectedOrder.total.toFixed(2)
                      : "N/A"}{" "}
                    LE
                  </p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleString(
                          "en-EG",
                          { timeZone: "Africa/Cairo" },
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal for UploadDropzone */}
          {showUploader && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              onClick={() => setShowUploader(false)}
            >
              <div
                className="rounded-lg bg-creamey p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Loading Overlay */}
                {isUploading && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity">
                    <div className="animate-fadeIn flex min-w-[280px] flex-col items-center rounded-2xl bg-creamey px-8 py-8 shadow-xl">
                      <div className="mb-4 h-14 w-14 animate-spin rounded-full border-b-4 border-t-4 border-primary"></div>
                      <span className="mb-2 text-lg font-bold text-primary">
                        Hang tight!
                      </span>
                      <span className="mb-4 text-center text-sm text-primary/80">
                        We&apos;re compressing your image for a faster upload.
                      </span>
                      {/* Optional: Cancel button */}
                      {/* <button
                    className="mt-2 text-primary underline text-xs hover:text-pinkey"
                    onClick={() => setIsUploading(false)}
                  >
                    Cancel
                  </button> */}
                    </div>
                  </div>
                )}
                <UploadDropzone
                  endpoint="mediaUploader"
                  onBeforeUploadBegin={handleComperession}
                  onClientUploadComplete={(res) => {
                    if (res && res[0] && res[0].url) {
                      setUserInfo((prev) => ({
                        ...prev,
                        imageUrl: res[0].url,
                      }));
                      setShowUploader(false);
                    }
                  }}
                  onUploadError={(error) => {
                    console.error("Image upload failed:", error);
                  }}
                  appearance={{
                    uploadIcon: "text-primary",

                    allowedContent: "text-primary/90",
                    button:
                      "bg-primary text-creamey rounded-full px-6 py-2 font-bold hover:bg-primary/80 transition hover:cursor-pointer",
                    container:
                      "flex text-primary/80 flex-col items-center gap-4",
                  }}
                  className="w-64"
                />
                <button
                  className="mt-4 text-sm text-primary underline"
                  onClick={() => setShowUploader(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </DefaultLayout>
    </Suspense>
  );
}
