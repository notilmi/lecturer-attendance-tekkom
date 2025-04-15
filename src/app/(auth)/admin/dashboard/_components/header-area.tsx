export function HeaderArea() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>
      <div className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  );
}
