"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import Swal from "sweetalert2";
import InteractionModal from "./InteractionModal";

interface Interaction {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName?: string;
    email: string;
    imageURL?: string;
  };
  targetId:
    | string
    | {
        _id: string;
        title: string;
        thumbnailUrl: string;
        url: string;
      };
  targetType: "video" | "comment" | "reply";
  actionType: "like" | "unlike" | "comment" | "reply";
  parentType: "video" | "blog";
  parentId: {
    _id: string;
    title: string;
    thumbnail: string;
  };
  content?: string;
  read: boolean;
  createdAt: string;
}

const InteractionsTable = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [filters, setFilters] = useState({
    targetType: "",
    actionType: "",
    read: "",
  });
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedInteraction, setSelectedInteraction] =
    useState<Interaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch interactions with current filters, pagination, and sorting
  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortField,
        sortOrder,
      });

      // Add filters if they're set
      if (filters.targetType) params.append("targetType", filters.targetType);
      if (filters.actionType) params.append("actionType", filters.actionType);
      if (filters.read) params.append("read", filters.read);

      const response = await axios.get(
        `/api/interactions?${params.toString()}`,
      );
      for (const item of response.data.data) {
        if (item.targetType === "video") {
          console.log("hnaaaa" + item.parentId.title);
        }
      }
      setInteractions(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load interactions",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchInteractions();
  }, [currentPage, limit, filters, sortField, sortOrder]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle sort changes
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Default to descending for new sort field
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Handle marking as read/unread
  const handleReadStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/interactions/${id}`, {
        read: !currentStatus,
      });

      // Update local state
      setInteractions((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, read: !currentStatus } : item,
        ),
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Interaction marked as ${!currentStatus ? "read" : "unread"}`,
        timer: 1500,
      });
    } catch (error) {
      console.error("Error updating read status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update interaction",
      });
    }
  };

  // Handle deletion
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/interactions/${id}`);

        // Remove from local state
        setInteractions((prev) => prev.filter((item) => item._id !== id));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Interaction has been deleted.",
          timer: 1500,
        });
      } catch (error) {
        console.error("Error deleting interaction:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete interaction",
        });
      }
    }
  };

  // Handle edit
  const handleEdit = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedInteraction(null);
  };

  // Handle interaction update
  const handleInteractionUpdate = (updatedInteraction: Interaction) => {
    setInteractions((prev) =>
      prev.map((item) =>
        item._id === updatedInteraction._id ? updatedInteraction : item,
      ),
    );
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-full overflow-x-auto">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <label
            htmlFor="targetType"
            className="mr-2 text-black dark:text-white"
          >
            Target Type:
          </label>
          <select
            id="targetType"
            name="targetType"
            value={filters.targetType}
            onChange={handleFilterChange}
            className="rounded border border-stroke px-2 py-1 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
          >
            <option value="">All</option>
            <option value="video">Video</option>
            <option value="comment">Comment</option>
            <option value="reply">Reply</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="actionType"
            className="mr-2 text-black dark:text-white"
          >
            Action Type:
          </label>
          <select
            id="actionType"
            name="actionType"
            value={filters.actionType}
            onChange={handleFilterChange}
            className="rounded border border-stroke px-2 py-1 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
          >
            <option value="">All</option>
            <option value="like">Like</option>
            <option value="unlike">Unlike</option>
            <option value="comment">Comment</option>
            <option value="reply">Reply</option>
          </select>
        </div>

        {/* <div>
          <label htmlFor="read" className="mr-2 text-black dark:text-white">
            Read Status:
          </label>
          <select
            id="read"
            name="read"
            value={filters.read}
            onChange={handleFilterChange}
            className="rounded border border-stroke px-2 py-1 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
          >
            <option value="">All</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>
        </div> */}

        <div className="ml-auto">
          <label htmlFor="limit" className="mr-2 text-black dark:text-white">
            Show:
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-stroke px-2 py-1 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
              <div
                className="flex cursor-pointer items-center"
                onClick={() => handleSort("userId.name")}
              >
                User
                {sortField === "userId.name" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
              <div
                className="flex cursor-pointer items-center"
                onClick={() => handleSort("actionType")}
              >
                Action
                {sortField === "actionType" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
              <div
                className="flex cursor-pointer items-center"
                onClick={() => handleSort("targetType")}
              >
                Target Type
                {sortField === "targetType" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
              Target
            </th>

            <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
              Content
            </th>
            {/* <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
              <div
                className="flex cursor-pointer items-center"
                onClick={() => handleSort("read")}
              >
                Status
                {sortField === "read" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th> */}
            <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
              <div
                className="flex cursor-pointer items-center"
                onClick={() => handleSort("createdAt")}
              >
                Date
                {sortField === "createdAt" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={7}
                className="border-b border-[#eee] px-4 py-5 text-center dark:border-strokedark"
              >
                Loading...
              </td>
            </tr>
          ) : interactions.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="border-b border-[#eee] px-4 py-5 text-center dark:border-strokedark"
              >
                No interactions found
              </td>
            </tr>
          ) : (
            interactions.map((interaction) => (
              <tr key={interaction._id}>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full">
                      {interaction.userId &&
                      "imageURL" in interaction.userId ? (
                        <img
                          src={interaction.userId.imageURL as string}
                          alt={`${interaction.userId?.firstName || "User"}'s avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                          {(interaction.userId?.firstName?.[0] || "") +
                            ((interaction.userId &&
                            "lastName" in interaction.userId
                              ? (interaction.userId.lastName as string)[0]
                              : "") || "")}
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-medium text-black dark:text-white">
                        {`${interaction.userId?.firstName || ""} ${interaction.userId && "lastName" in interaction.userId ? (interaction.userId.lastName as string) : ""}`}
                      </h5>
                      <p className="text-sm">
                        {interaction.userId?.email || "No email"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <span
                    className={`inline-block rounded px-2.5 py-1 text-sm font-medium capitalize ${
                      interaction.actionType === "like"
                        ? "bg-success bg-opacity-10 text-success"
                        : interaction.actionType === "unlike"
                          ? "bg-danger bg-opacity-10 text-danger"
                          : "bg-primary bg-opacity-10 text-primary"
                    }`}
                  >
                    {interaction.actionType}
                  </span>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <span className="inline-block rounded bg-opacity-10 px-2.5 py-1 text-sm font-medium capitalize">
                    {interaction.targetType}
                  </span>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  {typeof interaction.parentId === "object" &&
                    interaction.parentId && (
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-20 overflow-hidden rounded">
                          {interaction.parentId &&
                          "thumbnail" in interaction.parentId &&
                          interaction.parentId.thumbnail ? (
                            <img
                              src={interaction.parentId.thumbnail}
                              alt={
                                (interaction.parentId &&
                                  "title" in interaction.parentId &&
                                  interaction.parentId.title) ||
                                "Video thumbnail"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <h6 className="font-medium text-black dark:text-white">
                            {interaction.parentId &&
                            "title" in interaction.parentId &&
                            interaction.parentId.title
                              ? interaction.parentId.title
                              : "Untitled Video"}
                          </h6>
                        </div>
                      </div>
                    )}
                </td>

                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {interaction.content
                      ? interaction.content.length > 50
                        ? `${interaction.content.substring(0, 50)}...`
                        : interaction.content
                      : interaction.actionType === "like"
                        ? "💗"
                        : interaction.actionType === "unlike"
                          ? "🥹"
                          : "💗"}
                  </p>
                </td>
                {/* <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <span
                    className={`inline-block cursor-pointer rounded px-2.5 py-1 text-sm font-medium ${
                      interaction.read
                        ? "bg-success bg-opacity-10 text-success"
                        : "bg-warning bg-opacity-10 text-warning"
                    }`}
                    onClick={() =>
                      handleReadStatus(interaction._id, interaction.read)
                    }
                  >
                    {interaction.read ? "Read" : "Unread"}
                  </span>
                </td> */}
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  {format(
                    new Date(interaction.createdAt),
                    "MMM dd, yyyy HH:mm",
                  )}
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <div className="flex items-center space-x-3.5">
                    {/* <button
                      className="hover:text-primary"
                      onClick={() => handleEdit(interaction)}
                    >
                      <svg
                        className="fill-current"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.5562 8.99981 13.5562C13.1061 13.5562 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.44374 8.99981 4.44374C4.89356 4.44374 2.4748 7.95936 1.85605 8.99999Z"
                          fill=""
                        />
                        <path
                          d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.875C8.38125 7.875 7.875 8.38125 7.875 9C7.875 9.61875 8.38125 10.125 9 10.125C9.61875 10.125 10.125 9.61875 10.125 9C10.125 8.38125 9.61875 7.875 9 7.875Z"
                          fill=""
                        />
                      </svg>
                    </button> */}
                    <button
                      className="hover:text-danger"
                      onClick={() => handleDelete(interaction._id)}
                    >
                      <svg
                        className="fill-current"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                          fill=""
                        />
                        <path
                          d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                          fill=""
                        />
                        <path
                          d="M10.8789 9.67504C10.5414 9.64692 10.2602 9.90004 10.232 10.2375L10.0039 13.2375C9.97578 13.5469 10.2039 13.8281 10.5133 13.8563C10.5414 13.8563 10.5414 13.8563 10.5695 13.8563C10.8508 13.8563 11.0758 13.6313 11.1039 13.35L11.332 10.35C11.3602 10.0125 11.1071 9.73129 10.8789 9.67504Z"
                          fill=""
                        />
                        <path
                          d="M7.1758 9.67504C6.91268 9.70317 6.6877 10.0125 6.71582 10.35L6.94395 13.35C6.97207 13.6313 7.19707 13.8563 7.47832 13.8563C7.50645 13.8563 7.50645 13.8563 7.53457 13.8563C7.84395 13.8281 8.07207 13.5469 8.04395 13.2375L7.81582 10.2375C7.7877 9.90004 7.50645 9.64692 7.1758 9.67504Z"
                          fill=""
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`flex h-9 min-w-[36px] items-center justify-center rounded-md border border-[#e2e8f0] px-4 text-base text-black hover:bg-primary hover:text-white dark:border-strokedark dark:text-white ${
                currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-md border ${
                  currentPage === page
                    ? "border-primary bg-primary text-white"
                    : "border-[#e2e8f0] text-black hover:bg-primary hover:text-white dark:border-strokedark dark:text-white"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`flex h-9 min-w-[36px] items-center justify-center rounded-md border border-[#e2e8f0] px-4 text-base text-black hover:bg-primary hover:text-white dark:border-strokedark dark:text-white ${
                currentPage === totalPages
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {/* {isModalOpen && selectedInteraction && (
        <InteractionModal
          interaction={selectedInteraction}
          onClose={handleModalClose}
          onUpdate={handleInteractionUpdate}
        />
      )} */}
    </div>
  );
};

export default InteractionsTable;
