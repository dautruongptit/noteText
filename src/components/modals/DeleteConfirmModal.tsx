type Props = {
  noteName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({ noteName, onCancel, onConfirm }: Props) {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <section className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon">!</div>
        <h2>Xoá ghi chú?</h2>
        <p>"{noteName}" sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.</p>
        <div>
          <button onClick={onCancel}>Huỷ</button>
          <button className="delete-confirm" onClick={onConfirm}>Xoá ghi chú</button>
        </div>
      </section>
    </div>
  );
}
