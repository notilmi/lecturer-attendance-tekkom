import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TabList() {
  return (
    <TabsList>
      <TabsTrigger value="daily">Laporan Harian</TabsTrigger>
      <TabsTrigger value="summary">Ringkasan</TabsTrigger>
    </TabsList>
  );
}
