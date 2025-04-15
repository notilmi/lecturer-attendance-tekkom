import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TabList } from "./tab-list";
import { OverviewTab } from "./overview-tab";
import { AttendanceTab } from "./attendance-tab";
import { RfidSimulator } from "@/components/admin/rfid-simulator";
import { UseDashboardPage } from "../use-dashboard-page";

export function tabs() {

    const { activeTab, setActiveTab } = UseDashboardPage()

    return (
        <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab} 
            className="space-y-6"
          >
            <TabList/>
            
            {/* Overview Tab */}
            <OverviewTab/>
            
            {/* Attendance Tab */}
            <AttendanceTab/>
            
            {/* RFID Simulator Tab */}
            <TabsContent value="simulator">
              <RfidSimulator />
            </TabsContent>
          </Tabs>
    )
}