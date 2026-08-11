import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface SidebarSectionProps {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export default function SidebarSection({
  title,
  children,
  defaultOpen = false,
}: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full
          flex
          items-center
          gap-2
          py-2
          text-sm
          font-semibold
          hover:text-violet-600
          transition
        "
      >
        {open ? (
          <ChevronDown size={15} />
        ) : (
          <ChevronRight size={15} />
        )}

        {title}
      </button>

      {open && (
        <div className="ml-5 mt-2">
          {children}
        </div>
      )}
    </div>
  );
}