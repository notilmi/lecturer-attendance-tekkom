import { Button } from "@/components/ui/button";

export function Header({ title }: { title: string }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      <div className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
      <Button
        onClick={async () => {
          const res = await fetch("/api/reset-status");
          const data = await res.json();
          alert(`Reset status: ${data.message}`);
        }}
      >
        Trigger Reset Status
      </Button>
    </div>
  );
}
