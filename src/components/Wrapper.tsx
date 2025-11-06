"use client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useEffect, useState } from "react";

function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        {children}
      </div>
    </DndProvider>
  );
}
export default ClientWrapper;
// Update RootLayout
