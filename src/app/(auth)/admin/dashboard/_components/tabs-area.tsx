import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TabList } from "./tab-list";
import { OverviewTab } from "./overview-tab";
import { AttendanceTab } from "./attendance-tab";
import { RfidSimulator } from "@/components/admin/rfid-simulator";
import { useDashboardPage } from "../use-dashboard-page";

export function TabsArea() {

    const { activeTab, setActiveTab } = useDashboardPage()

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