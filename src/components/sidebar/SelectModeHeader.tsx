type Props = {
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
};

export function SelectModeHeader({ selectedCount, onDelete, onCancel }: Props) {
  return (
    <div className="select-head">
      <span className="select-count">{selectedCount} đã chọn</span>
      <div className="select-actions">
        <button
          className="select-delete-btn"
          disabled={selectedCount === 0}
          onClick={onDelete}
        >
          Xoá
        </button>
        <button className="select-cancel-btn" onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  );
}
