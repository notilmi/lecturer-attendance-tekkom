"use client";

import { Button } from "@/components/ui/button";
import { Header } from "../_components/header";
import { TabsArea } from "./_components/tabs-area";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <Header title="Dashboard" />
          <Button
          className="mb-4"
            onClick={async () => {
              const res = await fetch("/api/reset-status");
              const data = await res.json();
              alert(`Reset status: ${data.message}`);
            }}
          >
            Trigger Reset Status
          </Button>
          <TabsArea />
        </div>
      </div>
    </div>
  );
}
