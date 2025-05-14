"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
      title: "Admin Management",
      url: "/admin/admins",
      icon: IconUsers, // Mengganti IconListDetails menjadi IconUsers
    },
    {
      title: "Lecture Management",
      url: "/admin/lecturers",
      icon: IconReport, // Lebih cocok untuk manajemen dosen
    },
    {
      title: "RFID Management",
      url: "/admin/rfids",
      icon: IconDatabase, // Mengganti IconChartBar menjadi IconDatabase
    },
    {
      title: "Presence Management",
      url: "/admin/attendances",
      icon: IconFileDescription, // Lebih cocok menggambarkan absensi atau laporan kehadiran
    },
    // {
    //   title: "Settings",
    //   url: "/admin/settings",
    //   icon: IconSettings, // Mengganti IconChartBar menjadi IconSettings
    // },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { user } = useAuth();

  console.log(user);
  

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
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Admin Tekkom.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{email: user?.email || "no emaill"}} />
      </SidebarFooter>
    </Sidebar>
  )
}
