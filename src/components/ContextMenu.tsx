import type { MenuPos } from "../types";

type Props = {
  pos: MenuPos;
  onDuplicate: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDeleteRequest: () => void;
};

export function ContextMenu({ pos, onDuplicate, onRename, onDownload, onDeleteRequest }: Props) {
  return (
    <div
      className="file-menu"
      style={{ position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onDuplicate}>⧉ <span>Duplicate</span></button>
      <button onClick={onRename}>✎ <span>Rename</span></button>
      <button onClick={onDownload}>↓ <span>Download</span></button>
      <hr />
      <button className="danger" onClick={onDeleteRequest}>× <span>Delete</span></button>
    </div>
  );
}
