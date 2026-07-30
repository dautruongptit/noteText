import type { MouseEvent } from "react";

type Props = {
  onMouseDown: (e: MouseEvent) => void;
  onDoubleClick: () => void;
};

export function SidebarResizer({ onMouseDown, onDoubleClick }: Props) {
  return <div className="sidebar-resizer" onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} />;
}
