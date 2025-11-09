"use client";
import { Ipackage, PackageCard, PackageItem } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { headerFont } from "@/app/lib/fonts";
import { UploadButton } from "@/utils/uploadthing";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  package?: Ipackage & { _id: string };
  setPackages: React.Dispatch<
    React.SetStateAction<(Ipackage & { _id: string })[]>
  >;
}

const PackageModal = ({
  isOpen,
  onClose,
  package: packageItem,
  setPackages,
}: PackageModalProps) => {
  const [formData, setFormData] = useState<Ipackage>({
    name: "",
    imgUrl: "",
    images: [],
    price: 0,
    duration: "",
    items: [],
    notes: [],
    cards: [],
  });

  const [newItem, setNewItem] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [newCardImage, setNewCardImage] = useState("");
  const [newCardPoints, setNewCardPoints] = useState<string[]>([]);
  const [newPointText, setNewPointText] = useState("");
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [editingCardImage, setEditingCardImage] = useState("");
  const [editingCardPoints, setEditingCardPoints] = useState<string[]>([]);
  const [editingPointText, setEditingPointText] = useState("");

  useEffect(() => {
    if (packageItem) {
      // Handle potential legacy data where items might be strings instead of objects
      const formattedItems = Array.isArray(packageItem.items)
        ? packageItem.items.map((item) => {
            // Check if item is already in the correct format
            if (
              typeof item === "object" &&
              item !== null &&
              "value" in item &&
              "included" in item
            ) {
              return item as PackageItem;
            }
            // Convert string items to the new format
            return { value: String(item), included: true };
          })
        : [];

      setFormData({
        name: packageItem.name,
        imgUrl: packageItem.imgUrl,
        images: packageItem.images || [],
        price: packageItem.price,
        duration: packageItem.duration,
        items: formattedItems,
        notes: [...packageItem.notes],
        cards: packageItem.cards || [],
      });
    } else {
      setFormData({
        name: "",
        imgUrl: "",
        images: [],
        price: 0,
        duration: "",
        items: [],
        notes: [],
        cards: [],
      });
    }
  }, [packageItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Log the form data to debug
      console.log("Submitting form data:", JSON.stringify(formData, null, 2));
      console.log("Cards in form data:", formData.cards);
      console.log("Images in form data:", formData.images);

      if (packageItem) {
        // Update existing package
        const response = await axios.put(
          `/api/packages?packageID=${packageItem._id}`,
          formData,
        );
        console.log("Update response:", response.data);
        console.log("Updated package data:", response.data.data);

        if (response.status === 200) {
          setPackages((prevPackages) =>
            prevPackages.map((p) =>
              p._id === packageItem._id ? response.data.data : p,
            ),
          );

          Swal.fire({
            background: "#FFFFF",
            color: "black",
            toast: false,
            iconColor: "#473728",
            position: "bottom-right",
            text: "PACKAGE UPDATED SUCCESSFULLY",
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: "no-rounded-corners small-popup",
            },
          });
        }
      } else {
        // Create new package
        const response = await axios.post("/api/packages", formData);
        console.log("Create response:", response.data);
        console.log("Created package data:", response.data.data);

        if (response.status === 201) {
          setPackages((prevPackages) => [response.data.data, ...prevPackages]);

          Swal.fire({
            background: "#FFFFF",
            color: "black",
            toast: false,
            iconColor: "#473728",
            position: "bottom-right",
            text: "PACKAGE CREATED SUCCESSFULLY",
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: "no-rounded-corners small-popup",
            },
          });
        }
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving package:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Error response:", error.response);
      Swal.fire({
        background: "#FFFFF",
        color: "black",
        toast: false,
        iconColor: "#473728",
        position: "bottom-right",
        text: "SAVE FAILED",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "no-rounded-corners small-popup",
        },
      });
    }
  };

  const addItem = () => {
    if (newItem.trim()) {
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, { value: newItem.trim(), included: true }],
      }));
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addNote = () => {
    if (newNote.trim()) {
      setFormData((prev) => ({
        ...prev,
        notes: [...prev.notes, newNote.trim()],
      }));
      setNewNote("");
    }
  };
  const editNote = (index: number) => {
    if (editingNoteText.trim()) {
      setFormData((prev) => ({
        ...prev,
        notes: prev.notes.map((note, i) =>
          i === index ? editingNoteText.trim() : note,
        ),
      }));
      setEditingNoteIndex(null);
      setEditingNoteText("");
    }
  };

  const startEditNote = (index: number, noteText: string) => {
    setEditingNoteIndex(index);
    setEditingNoteText(noteText);
  };

  const cancelEditNote = () => {
    setEditingNoteIndex(null);
    setEditingNoteText("");
  };

  const removeNote = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index),
    }));
  };

  // Card management functions
  const addCard = () => {
    if (newCardImage.trim() && newCardPoints.length > 0) {
      const newCard: PackageCard = {
        image: newCardImage.trim(),
        points: [...newCardPoints],
      };
      setFormData((prev) => ({
        ...prev,
        cards: [...prev.cards, newCard],
      }));
      setNewCardImage("");
      setNewCardPoints([]);
    }
  };

  const addPointToNewCard = () => {
    if (newPointText.trim()) {
      setNewCardPoints((prev) => [...prev, newPointText.trim()]);
      setNewPointText("");
    }
  };

  const removePointFromNewCard = (index: number) => {
    setNewCardPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const removeCard = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index),
    }));
  };

  const startEditCard = (index: number, card: PackageCard) => {
    setEditingCardIndex(index);
    setEditingCardImage(card.image);
    setEditingCardPoints([...card.points]);
  };

  const editCard = (index: number) => {
    if (editingCardImage.trim() && editingCardPoints.length > 0) {
      setFormData((prev) => ({
        ...prev,
        cards: prev.cards.map((card, i) =>
          i === index
            ? {
                image: editingCardImage.trim(),
                points: [...editingCardPoints],
              }
            : card,
        ),
      }));
      setEditingCardIndex(null);
      setEditingCardImage("");
      setEditingCardPoints([]);
    }
  };

  const addPointToEditingCard = () => {
    if (editingPointText.trim()) {
      setEditingCardPoints((prev) => [...prev, editingPointText.trim()]);
      setEditingPointText("");
    }
  };

  const removePointFromEditingCard = (index: number) => {
    setEditingCardPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const cancelEditCard = () => {
    setEditingCardIndex(null);
    setEditingCardImage("");
    setEditingCardPoints([]);
    setEditingPointText("");
  };

  // Image management functions
  const addImage = (url: string) => {
    if (url.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, url.trim()],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:pl-72.5">
      <div className="input:bg-creamey mx-4 max-h-[90vh]  w-full max-w-2xl overflow-y-auto rounded-lg border-primary bg-creamey p-6 text-primary/80">
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`${headerFont.className} text-2xl`}>
            {packageItem ? "Edit Package" : "Add New Package"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-primary"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Package Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-md border border-primary/50 bg-creamey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaryLight"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Main Image *
            </label>
            {formData.imgUrl && (
              <div className="mb-2">
                <img
                  src={formData.imgUrl}
                  alt="Package"
                  className="h-32 w-32 rounded border border-primary/50 object-cover"
                />
              </div>
            )}
            <UploadButton
              endpoint="mediaUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  setFormData((prev) => ({ ...prev, imgUrl: res[0].url }));
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Upload error:", error);
                alert(`ERROR! ${error.message}`);
              }}
              className="mt-2 w-fit rounded-md bg-primary px-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Additional Images
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {formData.images.map((image, index) => (
                <div
                  key={index}
                  className="relative h-24 w-24 overflow-hidden rounded border border-primary/50"
                >
                  <img
                    src={image}
                    alt={`Package Image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <UploadButton
              endpoint="mediaUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  // Add all uploaded images to the images array
                  res.forEach((file) => {
                    addImage(file.url);
                  });
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Upload error:", error);
                alert(`ERROR! ${error.message}`);
              }}
              className="mt-2 w-fit rounded-md bg-primary px-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Price (LE) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-md border border-primary/50 bg-creamey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaryLight"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Duration *
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
                placeholder="e.g., 30 days, 3 months"
                className="w-full rounded-md border border-primary/50 bg-creamey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaryLight"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Items
            </label>
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add an item"
                className="flex-1 rounded-md border border-primary/50 bg-creamey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaryLight"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addItem())
                }
              />
              <button
                type="button"
                onClick={addItem}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-secondary"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded border border-primary/50 bg-creamey p-2"
                >
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={() => {
                      setFormData((prev) => ({
                        ...prev,
                        items: prev.items.map((i, idx) =>
                          idx === index ? { ...i, included: !i.included } : i,
                        ),
                      }));
                    }}
                    className="mr-2"
                  />
                  <span className="flex-1">
                    {typeof item.value === "string"
                      ? item.value
                      : String(item.value)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Notes
            </label>
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note"
                className="flex-1 rounded-md border border-primary/50 bg-creamey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaryLight"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addNote())
                }
              />
              <button
                type="button"
                onClick={addNote}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-secondary"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.notes.map((note, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded border border-primary/50 bg-creamey p-2"
                >
                  {editingNoteIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="flex-1 rounded border border-primary/50 bg-creamey px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primaryLight"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), editNote(index))
                        }
                        onKeyDown={(e) =>
                          e.key === "Escape" && cancelEditNote()
                        }
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => editNote(index)}
                        className="text-green-500 hover:text-green-700"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditNote}
                        className="text-gray-500 hover:text-gray-700"
                        title="Cancel"
                      >
                        ✗
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{note}</span>
                      <button
                        type="button"
                        onClick={() => startEditNote(index, note)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNote(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Cards (Image & Points)
            </label>
            <div className="mb-4 space-y-4">
              {formData.cards.map((card, index) => (
                <div
                  key={index}
                  className="rounded border border-primary/50 bg-creamey p-3"
                >
                  {editingCardIndex === index ? (
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-primary">
                          Card Image
                        </label>
                        {editingCardImage && (
                          <div className="mb-2">
                            <img
                              src={editingCardImage}
                              alt="Card Preview"
                              className="h-32 w-32 rounded border border-primary/50 object-cover"
                            />
                          </div>
                        )}
                        <UploadButton
                          endpoint="mediaUploader"
                          onClientUploadComplete={(res) => {
                            if (res && res.length > 0) {
                              setEditingCardImage(res[0].url);
                            }
                          }}
                          onUploadError={(error: Error) => {
                            console.error("Upload error:", error);
                            alert(`ERROR! ${error.message}`);
                          }}
                          className="w-fit rounded-md bg-primary px-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-primary">
                          Points
                        </label>
                        <div className="space-y-2">
                          {editingCardPoints.map((point, pointIndex) => (
                            <div
                              key={pointIndex}
                              className="flex items-center gap-2"
                            >
                              <span className="flex-1">{point}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  removePointFromEditingCard(pointIndex)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingPointText}
                              onChange={(e) =>
                                setEditingPointText(e.target.value)
                              }
                              placeholder="Add a point"
                              className="flex-1 rounded border border-primary/50 bg-creamey px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primaryLight"
                              onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), addPointToEditingCard())
                              }
                            />
                            <button
                              type="button"
                              onClick={addPointToEditingCard}
                              className="rounded-md bg-primary px-2 py-1 text-xs text-white"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editCard(index)}
                          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditCard}
                          className="rounded-md bg-gray-500 px-3 py-1 text-sm text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="h-20 w-20 flex-shrink-0">
                        <img
                          src={card.image}
                          alt="Card"
                          className="h-full w-full rounded border border-primary/50 object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="text-sm font-medium">
                          <p>Points:</p>
                          <ul className="mt-1 list-disc pl-5">
                            {card.points.map((point, pointIndex) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCard(index, card)}
                            className="text-sm text-blue-500 hover:text-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCard(index)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded border border-primary/50 bg-creamey p-3">
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-primary">
                    Card Image
                  </label>
                  {newCardImage && (
                    <div className="mb-2">
                      <img
                        src={newCardImage}
                        alt="Card Preview"
                        className="h-32 w-32 rounded border border-primary/50 object-cover"
                      />
                    </div>
                  )}
                  <UploadButton
                    endpoint="mediaUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res.length > 0) {
                        setNewCardImage(res[0].url);
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error("Upload error:", error);
                      alert(`ERROR! ${error.message}`);
                    }}
                    className="w-fit rounded-md bg-primary px-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-primary">
                    Points
                  </label>
                  <div className="space-y-2">
                    {newCardPoints.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex items-center gap-2">
                        <span className="flex-1">{point}</span>
                        <button
                          type="button"
                          onClick={() => removePointFromNewCard(pointIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPointText}
                        onChange={(e) => setNewPointText(e.target.value)}
                        placeholder="Add a point"
                        className="flex-1 rounded border border-primary/50 bg-creamey px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primaryLight"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addPointToNewCard())
                        }
                      />
                      <button
                        type="button"
                        onClick={addPointToNewCard}
                        className="rounded-md bg-primary px-2 py-1 text-xs text-white"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addCard}
                  className="rounded-md bg-primary px-3 py-1 text-sm text-white"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-secondary"
            >
              {packageItem ? "Update Package" : "Create Package"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border  border-primary/60 px-4 py-2 text-primary hover:bg-primary hover:text-creamey"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageModal;
