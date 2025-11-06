"use client";
import AddPlaylistModal from "@/components/AddPlaylistModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import PlaylistComponent from "@/components/PlaylistComponent";
import { Playlist } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ItemTypes = { PLAYLIST: "playlist" };

function DraggablePlaylist({ playlist, index, movePlaylist, setPlaylists, children }: any) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: ItemTypes.PLAYLIST,
    hover(item: { index: number }) {
      if (item.index !== index) {
        movePlaylist(item.index, index);
        item.index = index;
      }
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PLAYLIST,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
}

const PlaylistsPage = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addModalisOpen, setAddModalisOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prevOrder, setPrevOrder] = useState<string[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `/api/playlists?search=${searchQuery}`
      );
      console.log("Playlists data:", res.data);
      setPlaylists(res.data.data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists, searchQuery]);

  useEffect(() => {
    setPrevOrder(playlists.map((p) => String(p._id)));
  }, [isLoading]); // set initial order after loading

  useEffect(() => {
    if (orderChanged) {
      const updateOrder = async () => {
        try {
          await axios.patch("/api/playlists", {
            orderedIds: playlists.map((p) => p._id),
          });
        } catch (error) {
          console.error("Failed to update playlist order", error);
        }
      };
      updateOrder();
      setOrderChanged(false);
      setPrevOrder(playlists.map((p) => String(p._id)));
    }
  }, [orderChanged, playlists]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const movePlaylist = (from: number, to: number) => {
    setPlaylists((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(from, 1);
      updated.splice(to, 0, removed);
      // Check if order actually changed
      if (JSON.stringify(updated.map((p) => p._id)) !== JSON.stringify(prevOrder)) {
        setOrderChanged(true);
      }
      return updated;
    });
  };

  return (
    <DefaultLayout>
      <DndProvider backend={HTML5Backend}>
      <div className="flex h-auto px-2 md:px-4 min-h-screen w-full flex-col items-center justify-between gap-4 overflow-hidden bg-backgroundColor  md:py-4">
        <div className="flex h-full w-full flex-col items-center space-y-4">
          <div className="flex w-full flex-col-reverse items-center justify-between gap-4 md:flex-row">
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search playlists..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex w-full justify-end text-primary underline md:w-auto">
              <button
                className="hover:cursor-pointer rounded-md px-4 bg-primary text-creamey py-2 text-sm"
                onClick={() => setAddModalisOpen(true)}
              >
                ADD NEW PLAYLIST
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading playlists...</div>
            </div>
          ) : playlists.length > 0 ? (
            playlists.map((playlist, idx) => (
              <DraggablePlaylist
                key={playlist._id}
                playlist={playlist}
                index={idx}
                movePlaylist={movePlaylist}
                setPlaylists={setPlaylists}
              >
                <PlaylistComponent
                  setPlaylists={setPlaylists}
                  playlist={playlist}
                />
              </DraggablePlaylist>
            ))
          ) : (
            <div className="flex items-center justify-center py-8">
              <h1 className="text-lg text-gray-500">No playlists found</h1>
            </div>
          )}
        </div>
        
        <AddPlaylistModal
          isModalOpen={addModalisOpen}
          setModalOpen={setAddModalisOpen}
          setPlaylists={setPlaylists}
        />
      </div>
      </DndProvider>
    </DefaultLayout>
  );
};

export default PlaylistsPage;