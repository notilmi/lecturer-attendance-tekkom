"use client"

import * as React from "react"
import {
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconReport,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image";
import { usePathname } from "next/navigation";


const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard, // Tetap karena sudah cocok
    },
    {
      title: "Kelola Admin",
      url: "/admin/admins",
      icon: IconUsers, // Mengganti IconListDetails menjadi IconUsers
    },
    {
      title: "Kelola Dosen",
      url: "/admin/lecturers",
      icon: IconReport, // Lebih cocok untuk manajemen dosen
    },
    {
      title: "Kelola RFID",
      url: "/admin/rfids",
      icon: IconDatabase, // Mengganti IconChartBar menjadi IconDatabase
    },
    {
      title: "Kelola Kehadiran",
      url: "/admin/attendances",
      icon: IconFileDescription, // Lebih cocok menggambarkan absensi atau laporan kehadiran
    },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { user } = useAuth();  
  const pathname = usePathname();
  const isActive = (url: string) => pathname === url;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Image
                  src="/logo_tekkom.png"
                  alt="Logo"
                  width={28}
                  height={28}/>
                <span className="text-base font-semibold">Admin Tekkom.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} activePath={pathname}  />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{email: user?.email || "no emaill"}} />
      </SidebarFooter>
    </Sidebar>
  )
}
