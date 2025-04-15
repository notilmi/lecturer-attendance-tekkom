"use client";

import { HeaderArea } from "./_components/header-area";
import { TabsArea } from "./_components/tabs-area";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        {/* <header className="border-b p-4 flex items-center justify-between bg-background/95">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline-block">Halaman Utama</span>
              </Button>
            </Link>
          </div>
        </header> */}

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <HeaderArea />
          <TabsArea />
        </div>
      </div>
    </div>
  );
}
