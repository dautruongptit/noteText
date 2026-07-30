import type { RefObject } from "react";

type Props = {
  name: string;
  error: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onCancel: () => void;
  onCommit: () => void;
};

export function RenameModal({ name, error, inputRef, onChange, onCancel, onCommit }: Props) {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <section className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon rename-icon">✎</div>
        <h2>Đổi tên ghi chú</h2>
        <div className="rename-field">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onCommit(); if (e.key === "Escape") onCancel(); }}
            className={error ? "has-error" : ""}
            autoFocus
          />
          {error && <p className="field-error">{error}</p>}
        </div>
        <div>
          <button onClick={onCancel}>Huỷ</button>
          <button className="action-confirm" onClick={onCommit} disabled={!!error || !name.trim()}>Lưu tên</button>
        </div>
      </section>
    </div>
  );
}
