type Props = {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function BulkDeleteConfirmModal({ count, onCancel, onConfirm }: Props) {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <section className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon">!</div>
        <h2>Xoá {count} file đã chọn?</h2>
        <p>Các file sẽ được chuyển vào thùng rác và có thể khôi phục sau. Bạn chắc chắn muốn tiếp tục?</p>
        <div>
          <button onClick={onCancel}>Huỷ</button>
          <button className="delete-confirm" onClick={onConfirm}>Xoá {count} file</button>
        </div>
      </section>
    </div>
  );
}
