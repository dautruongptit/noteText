import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

type Note = { id: string; name: string; content: string; updated: Date };
type NoteSyncStatus = "synced" | "pending" | "syncing";
type MenuPos = { top?: number; bottom?: number; right: number };

const DEFAULT_SW = 220;
const MIN_SW = 180;
const MAX_SW = 480;
const MENU_EST_H = 160;

const initialNotes: Note[] = [
  { id: "welcome", name: "welcome.txt", content: "# Ghi chú của tôi\n\nChào mừng bạn đến với Noted.\n\n• Ctrl + S để lưu nhanh\n• Mọi thay đổi được tự động lưu\n• Mở nhiều ghi chú trong các tab", updated: new Date(Date.now() - 1000 * 60 * 3) },
  { id: "ideas", name: "ý tưởng.txt", content: "Ý tưởng tuần này\n\n1. Hoàn thiện trang giới thiệu\n2. Gửi bản thiết kế\n3. Đặt lịch review", updated: new Date(Date.now() - 1000 * 60 * 42) },
  { id: "readme", name: "README.txt", content: "NOTED / personal workspace\n\nKhông gian yên tĩnh để viết và lưu giữ điều quan trọng.", updated: new Date(Date.now() - 1000 * 60 * 60 * 5) },
];

const timeAgo = (date: Date) => {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  return `${Math.floor(minutes / 60)} giờ trước`;
};

const nameTaken = (notes: Note[], name: string, excludeId?: string) =>
  notes.some((n) => n.name.toLowerCase() === name.trim().toLowerCase() && n.id !== excludeId);

const uniqueName = (notes: Note[], base: string, excludeId?: string): string => {
  if (!nameTaken(notes, base, excludeId)) return base;
  const dot = base.lastIndexOf(".");
  const [stem, ext] = dot > 0 ? [base.slice(0, dot), base.slice(dot)] : [base, ""];
  let i = 2;
  while (nameTaken(notes, `${stem} (${i})${ext}`, excludeId)) i++;
  return `${stem} (${i})${ext}`;
};

const localBackup = (note: Note) => {
  try {
    localStorage.setItem(`noted-bk-${note.id}`, JSON.stringify({ ...note, updated: note.updated.toISOString() }));
  } catch {}
};

export default function App() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [tabs, setTabs] = useState(["welcome", "ideas"]);
  const [activeId, setActiveId] = useState("welcome");
  const [dark, setDark] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [saveError, setSaveError] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPos>({ top: 0, right: 0 });
  const [cursorLine, setCursorLine] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<number | null>(null);

  // — Sidebar resize —
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const v = localStorage.getItem("noted-sw");
    return v ? Number(v) : DEFAULT_SW;
  });
  const swRef = useRef(sidebarWidth);
  const dragging = useRef(false);
  const dragX = useRef(0);
  const dragW = useRef(0);

  // — Google Drive —
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showDrivePanel, setShowDrivePanel] = useState(false);
  const [noteSyncMap, setNoteSyncMap] = useState<Record<string, NoteSyncStatus>>({});
  const notesRef = useRef(notes);
  const driveConnectedRef = useRef(driveConnected);

  // — Rename modal —
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameError, setRenameError] = useState("");
  const renameInput = useRef<HTMLInputElement>(null);

  // — Select mode —
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [trash, setTrash] = useState<Note[]>([]);
  const longPressTimer = useRef<number | null>(null);

  const active = notes.find((n) => n.id === activeId) ?? notes[0];
  const lines = active?.content.split("\n") ?? [""];

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { driveConnectedRef.current = driveConnected; }, [driveConnected]);
  useEffect(() => { swRef.current = sidebarWidth; }, [sidebarWidth]);

  // Autosave debounce — stores timer ref so manualSave can cancel it
  useEffect(() => {
    if (status !== "unsaved") return;
    autoSaveTimer.current = window.setTimeout(() => {
      autoSaveTimer.current = null;
      performSave(activeId);
    }, 1300);
    return () => {
      if (autoSaveTimer.current !== null) {
        window.clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [active?.content, activeId, status]);

  // Ctrl/Cmd+S — cancels pending auto-save timer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        manualSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Sidebar resize listeners
  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      const next = Math.min(MAX_SW, Math.max(MIN_SW, dragW.current + e.clientX - dragX.current));
      setSidebarWidth(next);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem("noted-sw", String(swRef.current));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // Auto-sync after save
  useEffect(() => {
    if (status !== "saved" || !driveConnectedRef.current) return;
    const t = setTimeout(() => {
      setNoteSyncMap((prev) => ({ ...prev, [activeId]: "pending" }));
      doSync();
    }, 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const performSave = (noteId: string) => {
    setStatus("saving");
    setSaveError(false);
    setTimeout(() => {
      if (!navigator.onLine) {
        const note = notesRef.current.find((n) => n.id === noteId);
        if (note) localBackup(note);
        setSaveError(true);
        setStatus("error");
        return;
      }
      setNotes((items) => items.map((n) => n.id === noteId ? { ...n, updated: new Date() } : n));
      setSaveError(false);
      setStatus("saved");
    }, 320);
  };

  const manualSave = () => {
    if (autoSaveTimer.current !== null) {
      window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    if (status === "saved") return;
    performSave(activeId);
  };

  const doSync = useCallback(() => {
    setSyncStatus("syncing");
    setNoteSyncMap((prev) => {
      const next: Record<string, NoteSyncStatus> = {};
      notesRef.current.forEach((n) => { next[n.id] = "syncing"; });
      Object.keys(prev).forEach((k) => { if (!next[k]) next[k] = "syncing"; });
      return next;
    });
    setTimeout(() => {
      setSyncStatus("synced");
      setLastSynced(new Date());
      setNoteSyncMap((prev) => {
        const next = { ...prev };
        notesRef.current.forEach((n) => { next[n.id] = "synced"; });
        return next;
      });
    }, 1800);
  }, []);

  const connectDrive = () => {
    setDriveConnecting(true);
    setTimeout(() => {
      setDriveConnecting(false);
      setDriveConnected(true);
      driveConnectedRef.current = true;
      const map: Record<string, NoteSyncStatus> = {};
      notesRef.current.forEach((n) => { map[n.id] = "pending"; });
      setNoteSyncMap(map);
      doSync();
    }, 2000);
  };

  const disconnectDrive = () => {
    setDriveConnected(false);
    driveConnectedRef.current = false;
    setSyncStatus("idle");
    setLastSynced(null);
    setNoteSyncMap({});
    setShowDrivePanel(false);
  };

  const openNote = (id: string) => {
    if (selectMode) return;
    if (!tabs.includes(id)) setTabs((t) => [...t, id]);
    setActiveId(id);
    setMenuId(null);
  };

  const newNote = () => {
    const name = uniqueName(notes, "New Note.txt");
    const note: Note = { id: crypto.randomUUID(), name, content: "", updated: new Date() };
    setNotes((n) => [...n, note]);
    setTabs((t) => [...t, note.id]);
    setActiveId(note.id);
    setStatus("saved");
    setTimeout(() => textarea.current?.focus(), 0);
  };

  const closeTab = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const next = tabs.filter((t) => t !== id);
    setTabs(next);
    if (id === activeId && next.length) setActiveId(next[next.length - 1]);
    if (!next.length) newNote();
  };

  const duplicate = (id: string) => {
    const src = notes.find((n) => n.id === id)!;
    const dot = src.name.lastIndexOf(".");
    const base = dot > 0 ? `${src.name.slice(0, dot)} (copy)${src.name.slice(dot)}` : `${src.name} (copy)`;
    const name = uniqueName(notes, base);
    const copy: Note = { ...src, id: crypto.randomUUID(), name, updated: new Date() };
    setNotes((n) => [...n, copy]);
    setTabs((t) => [...t, copy.id]);
    setActiveId(copy.id);
    setMenuId(null);
  };

  const download = (id: string) => {
    const note = notes.find((n) => n.id === id)!;
    const url = URL.createObjectURL(new Blob([note.content], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = note.name; a.click();
    URL.revokeObjectURL(url);
    setMenuId(null);
  };

  const deleteNote = () => {
    if (!deleteId) return;
    const remaining = notes.filter((n) => n.id !== deleteId);
    setNotes(remaining);
    const newTabs = tabs.filter((id) => id !== deleteId);
    setTabs(newTabs);
    if (activeId === deleteId) setActiveId(newTabs[0] ?? remaining[0]?.id ?? "");
    setDeleteId(null);
    if (!newTabs.length && !remaining.length) newNote();
  };

  const openRename = (id: string) => {
    const note = notes.find((n) => n.id === id)!;
    setRenameId(id);
    setRenameName(note.name);
    setRenameError("");
    setMenuId(null);
    setTimeout(() => renameInput.current?.select(), 60);
  };

  const onRenameChange = (val: string) => {
    setRenameName(val);
    if (!val.trim()) { setRenameError("Tên file không được để trống"); return; }
    if (nameTaken(notes, val, renameId ?? undefined)) { setRenameError("Tên file đã tồn tại, vui lòng chọn tên khác"); return; }
    setRenameError("");
  };

  const commitRename = () => {
    if (!renameId || renameError || !renameName.trim()) return;
    setNotes((n) => n.map((x) => x.id === renameId ? { ...x, name: renameName.trim() } : x));
    setRenameId(null);
  };

  // Smart dropdown positioning
  const handleMoreClick = (e: MouseEvent<HTMLButtonElement>, noteId: string) => {
    e.stopPropagation();
    if (menuId === noteId) { setMenuId(null); return; }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < MENU_EST_H) {
      setMenuPos({ bottom: window.innerHeight - rect.top + 2, right: window.innerWidth - rect.right });
    } else {
      setMenuPos({ top: rect.bottom + 2, right: window.innerWidth - rect.right });
    }
    setMenuId(noteId);
  };

  // Select mode
  const enterSelectMode = (firstId?: string) => {
    setSelectMode(true);
    setSelected(firstId ? new Set([firstId]) : new Set());
    setMenuId(null);
  };
  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmBulkDelete = () => {
    const toDelete = [...selected];
    setTrash((prev) => [...prev, ...notes.filter((n) => toDelete.includes(n.id))]);
    const remaining = notes.filter((n) => !toDelete.includes(n.id));
    setNotes(remaining);
    const newTabs = tabs.filter((id) => !toDelete.includes(id));
    setTabs(newTabs);
    if (toDelete.includes(activeId)) setActiveId(newTabs[0] ?? remaining[0]?.id ?? "");
    exitSelectMode();
    setBulkDeleteConfirm(false);
    if (!remaining.length) newNote();
  };

  // Long-press for mobile select mode
  const handleTouchStart = (noteId: string) => {
    longPressTimer.current = window.setTimeout(() => enterSelectMode(noteId), 600);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current !== null) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const driveIcon = () => {
    if (!driveConnected) return "☁";
    if (syncStatus === "syncing") return "↻";
    if (syncStatus === "error") return "⚠";
    if (syncStatus === "synced") return "✓";
    return "☁";
  };

  const noteSyncIcon = (id: string) => {
    if (!driveConnected) return null;
    const s = noteSyncMap[id];
    if (s === "syncing") return <span className="sync-dot syncing" title="Đang đồng bộ" />;
    if (s === "synced") return <span className="sync-dot synced" title="Đã đồng bộ" />;
    return <span className="sync-dot pending" title="Chưa đồng bộ" />;
  };

  const statusLabel = () => {
    if (status === "saving") return "Đang lưu...";
    if (status === "error") return "Lưu thất bại — đã lưu tạm";
    if (status === "saved") return "Đã lưu";
    return "Chưa lưu";
  };

  return (
    <main className={dark ? "app dark" : "app"} onClick={() => setMenuId(null)}>
      <header className="topbar">
        <button className="brand" onClick={(e) => { e.stopPropagation(); setSidebar(!sidebar); }}>
          <span className="brand-mark">N</span><span>noted</span>
        </button>
        <div className="tabs">
          {tabs.map((id) => {
            const note = notes.find((n) => n.id === id);
            if (!note) return null;
            return (
              <button key={id} onClick={() => setActiveId(id)} className={`tab ${activeId === id ? "active" : ""}`}>
                <span className="file-glyph">▤</span>
                <span className="tab-name">{note.name}</span>
                {(status === "unsaved" || status === "error") && activeId === id && <i className="unsaved" />}
                <span className="close" onClick={(e) => closeTab(e, id)}>×</span>
              </button>
            );
          })}
          <button className="new-tab" onClick={newNote}>+</button>
        </div>
        <div className="top-actions">
          <button
            className={`drive-btn ${driveConnected ? (syncStatus === "syncing" ? "syncing" : syncStatus === "error" ? "error" : "connected") : ""}`}
            onClick={(e) => { e.stopPropagation(); setShowDrivePanel(true); }}
            title={driveConnected ? "Google Drive đã kết nối" : "Kết nối Google Drive"}
          >
            <span className={syncStatus === "syncing" && driveConnected ? "spin" : ""}>{driveIcon()}</span>
          </button>
          <button className="save-btn" onClick={manualSave}>⌘ <span>Lưu</span></button>
          <button className="mode" onClick={() => setDark(!dark)}>{dark ? "☀" : "◐"}</button>
        </div>
      </header>

      <section className="workspace">
        <aside
          className={`sidebar ${sidebar ? "" : "collapsed"}`}
          style={sidebar ? { width: sidebarWidth } : undefined}
        >
          {/* Sidebar header — switches to select-mode toolbar */}
          {selectMode ? (
            <div className="select-head">
              <span className="select-count">{selected.size} đã chọn</span>
              <div className="select-actions">
                <button
                  className="select-delete-btn"
                  disabled={selected.size === 0}
                  onClick={() => setBulkDeleteConfirm(true)}
                >
                  Xoá
                </button>
                <button className="select-cancel-btn" onClick={exitSelectMode}>Huỷ</button>
              </div>
            </div>
          ) : (
            <div className="side-head">
              <span>FILE CỦA BẠN</span>
              <div className="side-head-actions">
                <button className="select-mode-btn" onClick={() => enterSelectMode()} title="Chọn nhiều file">☑</button>
                <button onClick={newNote}>+</button>
              </div>
            </div>
          )}

          <div className="file-list">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => selectMode ? toggleSelect(note.id) : openNote(note.id)}
                onTouchStart={() => handleTouchStart(note.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                className={`file-row ${activeId === note.id && !selectMode ? "selected" : ""} ${selectMode && selected.has(note.id) ? "selecting" : ""}`}
              >
                {selectMode && (
                  <span className={`file-checkbox ${selected.has(note.id) ? "checked" : ""}`}>
                    {selected.has(note.id) ? "☑" : "☐"}
                  </span>
                )}
                <span className="doc-icon">▤</span>
                <div className="file-info">
                  <b>{note.name}</b>
                  <small>{timeAgo(note.updated)}</small>
                </div>
                {!selectMode && noteSyncIcon(note.id)}
                {!selectMode && (
                  <button
                    className="more"
                    onClick={(e) => handleMoreClick(e, note.id)}
                  >
                    •••
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="side-foot">
            <span className={`cloud-foot ${syncStatus === "syncing" && driveConnected ? "spin" : ""}`}>
              {driveConnected ? (syncStatus === "syncing" ? "↻" : syncStatus === "synced" ? "✓" : "☁") : "☁"}
            </span>
            <div>
              <b>{driveConnected ? "Google Drive" : "Đồng bộ hoá"}</b>
              <small>
                {!driveConnected && "Chưa kết nối"}
                {driveConnected && syncStatus === "syncing" && "Đang đồng bộ..."}
                {driveConnected && syncStatus === "synced" && lastSynced && `Lưu lúc ${lastSynced.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`}
                {driveConnected && syncStatus === "idle" && "Đã kết nối"}
              </small>
            </div>
          </div>
        </aside>

        {/* Resize handle — flex sibling between sidebar and editor */}
        {sidebar && (
          <div
            className="sidebar-resizer"
            onMouseDown={(e) => {
              e.preventDefault();
              dragging.current = true;
              dragX.current = e.clientX;
              dragW.current = swRef.current;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            onDoubleClick={() => {
              setSidebarWidth(DEFAULT_SW);
              localStorage.setItem("noted-sw", String(DEFAULT_SW));
            }}
          />
        )}

        <section className="editor-pane">
          {active && (
            <>
              <div className="editor-wrap">
                <div className="line-numbers">
                  {lines.map((_, i) => <span className={cursorLine === i + 1 ? "current" : ""} key={i}>{i + 1}</span>)}
                </div>
                <textarea
                  ref={textarea}
                  spellCheck={false}
                  value={active.content}
                  onSelect={(e) => setCursorLine(e.currentTarget.value.slice(0, e.currentTarget.selectionStart).split("\n").length)}
                  onKeyUp={(e) => setCursorLine(e.currentTarget.value.slice(0, e.currentTarget.selectionStart).split("\n").length)}
                  onChange={(e) => {
                    setNotes((items) => items.map((note) => note.id === activeId ? { ...note, content: e.target.value } : note));
                    setStatus("unsaved");
                    setSaveError(false);
                    setCursorLine(e.target.value.slice(0, e.target.selectionStart).split("\n").length);
                  }}
                  aria-label="Vùng soạn thảo ghi chú"
                />
              </div>
            </>
          )}
        </section>
      </section>

      <footer className="statusbar">
        <div>
          <span className={`save-status ${status}`} />
          <span className={status === "error" ? "status-error-text" : ""}>{statusLabel()}</span>
        </div>
        <div>
          <span>Ln {cursorLine}</span>
          <span>Lines {lines.length}</span>
          <span>{active?.content.length ?? 0} ký tự</span>
          <span>UTF-8</span>
          <span>Plain Text</span>
        </div>
      </footer>

      {/* Fixed-position dropdown — escapes all overflow containers */}
      {menuId && (() => {
        const note = notes.find((n) => n.id === menuId);
        if (!note) return null;
        return (
          <div
            className="file-menu"
            style={{ position: "fixed", top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => duplicate(note.id)}>⧉ <span>Duplicate</span></button>
            <button onClick={() => openRename(note.id)}>✎ <span>Rename</span></button>
            <button onClick={() => download(note.id)}>↓ <span>Download</span></button>
            <hr />
            <button className="danger" onClick={() => { setDeleteId(note.id); setMenuId(null); }}>× <span>Delete</span></button>
          </div>
        );
      })()}

      {/* Delete single */}
      {deleteId && (
        <div className="dialog-backdrop" onClick={() => setDeleteId(null)}>
          <section className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon">!</div>
            <h2>Xoá ghi chú?</h2>
            <p>"{notes.find((n) => n.id === deleteId)?.name}" sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.</p>
            <div>
              <button onClick={() => setDeleteId(null)}>Huỷ</button>
              <button className="delete-confirm" onClick={deleteNote}>Xoá ghi chú</button>
            </div>
          </section>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkDeleteConfirm && (
        <div className="dialog-backdrop" onClick={() => setBulkDeleteConfirm(false)}>
          <section className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon">!</div>
            <h2>Xoá {selected.size} file đã chọn?</h2>
            <p>Các file sẽ được chuyển vào thùng rác và có thể khôi phục sau. Bạn chắc chắn muốn tiếp tục?</p>
            <div>
              <button onClick={() => setBulkDeleteConfirm(false)}>Huỷ</button>
              <button className="delete-confirm" onClick={confirmBulkDelete}>Xoá {selected.size} file</button>
            </div>
          </section>
        </div>
      )}

      {/* Rename dialog */}
      {renameId && (
        <div className="dialog-backdrop" onClick={() => setRenameId(null)}>
          <section className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon rename-icon">✎</div>
            <h2>Đổi tên ghi chú</h2>
            <div className="rename-field">
              <input
                ref={renameInput}
                value={renameName}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenameId(null); }}
                className={renameError ? "has-error" : ""}
                autoFocus
              />
              {renameError && <p className="field-error">{renameError}</p>}
            </div>
            <div>
              <button onClick={() => setRenameId(null)}>Huỷ</button>
              <button className="action-confirm" onClick={commitRename} disabled={!!renameError || !renameName.trim()}>Lưu tên</button>
            </div>
          </section>
        </div>
      )}

      {/* Drive panel */}
      {showDrivePanel && (
        <div className="dialog-backdrop" onClick={() => setShowDrivePanel(false)}>
          <section className="dialog drive-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon drive-icon">☁</div>
            <h2>Google Drive</h2>
            {!driveConnected && !driveConnecting && (
              <>
                <p>Kết nối với Google Drive để tự động sao lưu và đồng bộ tất cả ghi chú của bạn lên đám mây.</p>
                <div>
                  <button onClick={() => setShowDrivePanel(false)}>Huỷ</button>
                  <button className="action-confirm" onClick={connectDrive}>Kết nối Google Drive</button>
                </div>
              </>
            )}
            {driveConnecting && (
              <>
                <div className="drive-connecting"><span className="spin">↻</span><span>Đang xác thực với Google...</span></div>
                <div><button onClick={() => { setDriveConnecting(false); setShowDrivePanel(false); }}>Huỷ</button></div>
              </>
            )}
            {driveConnected && (
              <>
                <div className="drive-status-row">
                  <span className={`drive-status-icon ${syncStatus}`}>{driveIcon()}</span>
                  <div>
                    <b>{syncStatus === "syncing" ? "Đang đồng bộ..." : syncStatus === "synced" ? "Đã đồng bộ" : "Sẵn sàng"}</b>
                    {lastSynced && <small>Lần cuối: {lastSynced.toLocaleString("vi-VN")}</small>}
                  </div>
                  <button className="sync-now-btn" onClick={doSync} disabled={syncStatus === "syncing"}>↻ Ngay</button>
                </div>
                <div className="drive-folder-row">
                  <span>📁</span>
                  <div><b>Thư mục đồng bộ</b><small>/Noted Workspace</small></div>
                  <button className="link-btn">Thay đổi</button>
                </div>
                <div className="drive-notes-list">
                  {notes.map((note) => {
                    const s = noteSyncMap[note.id];
                    return (
                      <div key={note.id} className="drive-note-row">
                        <span className="doc-icon">▤</span>
                        <span className="drive-note-name">{note.name}</span>
                        <span className={`sync-label ${s ?? "pending"}`}>
                          {s === "syncing" ? "↻ Đang sync" : s === "synced" ? "✓ Đã sync" : "○ Chờ sync"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="drive-actions">
                  <button className="disconnect-btn" onClick={disconnectDrive}>Ngắt kết nối</button>
                  <button className="action-confirm" onClick={() => setShowDrivePanel(false)}>Xong</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
