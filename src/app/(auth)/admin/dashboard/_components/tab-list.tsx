import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TabList() {
  return (
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="simulator">Simulator RFID</TabsTrigger>
    </TabsList>
  );
}
