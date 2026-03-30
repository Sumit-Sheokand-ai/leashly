import { RefreshCw } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin text-[#00ff88]" size={20} />
    </div>
  );
}
