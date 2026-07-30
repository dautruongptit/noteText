import type { RefObject } from "react";

type Props = {
  content: string;
  lines: string[];
  cursorLine: number;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onCursorMove: (line: number) => void;
  onChange: (value: string) => void;
};

export function EditorPane({ content, lines, cursorLine, textareaRef, onCursorMove, onChange }: Props) {
  const computeLine = (value: string, selectionStart: number) =>
    value.slice(0, selectionStart).split("\n").length;

  return (
    <section className="editor-pane">
      <div className="editor-wrap">
        <div className="line-numbers">
          {lines.map((_, i) => <span className={cursorLine === i + 1 ? "current" : ""} key={i}>{i + 1}</span>)}
        </div>
        <textarea
          ref={textareaRef}
          spellCheck={false}
          value={content}
          onSelect={(e) => onCursorMove(computeLine(e.currentTarget.value, e.currentTarget.selectionStart))}
          onKeyUp={(e) => onCursorMove(computeLine(e.currentTarget.value, e.currentTarget.selectionStart))}
          onChange={(e) => {
            onChange(e.target.value);
            onCursorMove(computeLine(e.target.value, e.target.selectionStart));
          }}
          aria-label="Vùng soạn thảo ghi chú"
        />
      </div>
    </section>
  );
}
