import { useState } from "react";
import { useNotes } from "./hooks/useNotes";
import { useRename } from "./hooks/useRename";
import { useAutoSave } from "./hooks/useAutoSave";
import { useDriveSync } from "./hooks/useDriveSync";
import { useSidebarResize } from "./hooks/useSidebarResize";
import { useSelectMode } from "./hooks/useSelectMode";
import { TopBar } from "./components/layout/TopBar";
import { StatusBar } from "./components/layout/StatusBar";
import { EditorPane } from "./components/layout/EditorPane";
import { Sidebar } from "./components/sidebar/Sidebar";
import { SidebarResizer } from "./components/sidebar/SidebarResizer";
import { ContextMenu } from "./components/ContextMenu";
import { DeleteConfirmModal } from "./components/modals/DeleteConfirmModal";
import { BulkDeleteConfirmModal } from "./components/modals/BulkDeleteConfirmModal";
import { RenameModal } from "./components/modals/RenameModal";
import { DrivePanel } from "./components/modals/DrivePanel";

export default function App() {
  const [dark, setDark] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [cursorLine, setCursorLine] = useState(1);

  // notesApi.newNote() calls markSaved() once autosave is initialized below.
  // Safe: this closure only runs on user interaction, well after render.
  const notesApi = useNotes(() => autosave.markSaved());
  const autosave = useAutoSave(notesApi.notes, notesApi.setNotes, notesApi.activeId, notesApi.active?.content);
  const drive = useDriveSync(notesApi.notes, autosave.status, notesApi.activeId);
  const sidebarResize = useSidebarResize();
  const selectModeApi = useSelectMode(
    notesApi.notes, notesApi.setNotes,
    notesApi.tabs, notesApi.setTabs,
    notesApi.activeId, notesApi.setActiveId,
    () => notesApi.setMenuId(null),
    notesApi.newNote,
  );
  const renameApi = useRename(notesApi.notes, notesApi.setNotes, () => notesApi.setMenuId(null));

  const handleChangeContent = (value: string) => {
    notesApi.setNotes((items) =>
      items.map((note) => (note.id === notesApi.activeId ? { ...note, content: value } : note))
    );
    autosave.markUnsaved();
  };

  const menuNote = notesApi.menuId ? notesApi.notes.find((n) => n.id === notesApi.menuId) : null;
  const deleteNote = notesApi.deleteId ? notesApi.notes.find((n) => n.id === notesApi.deleteId) : null;

  return (
    <main className={dark ? "app dark" : "app"} onClick={() => notesApi.setMenuId(null)}>
      <TopBar
        dark={dark}
        onToggleSidebar={() => setSidebarVisible((v) => !v)}
        tabs={notesApi.tabs}
        notes={notesApi.notes}
        activeId={notesApi.activeId}
        status={autosave.status}
        onSelectTab={notesApi.setActiveId}
        onCloseTab={notesApi.closeTab}
        onNewNote={notesApi.newNote}
        onManualSave={autosave.manualSave}
        onToggleDark={() => setDark((d) => !d)}
      />

      <section className="workspace">
        <Sidebar
          visible={sidebarVisible}
          width={sidebarResize.sidebarWidth}
          notes={notesApi.notes}
          activeId={notesApi.activeId}
          selectMode={selectModeApi.selectMode}
          selected={selectModeApi.selected}
          driveConnected={drive.driveConnected}
          syncStatus={drive.syncStatus}
          lastSynced={drive.lastSynced}
          noteSyncMap={drive.noteSyncMap}
          onOpenNote={(id) => notesApi.openNote(id, selectModeApi.selectMode)}
          onNewNote={notesApi.newNote}
          onEnterSelectMode={() => selectModeApi.enterSelectMode()}
          onExitSelectMode={selectModeApi.exitSelectMode}
          onToggleSelect={selectModeApi.toggleSelect}
          onBulkDeleteRequest={() => selectModeApi.setBulkDeleteConfirm(true)}
          onTouchStart={selectModeApi.handleTouchStart}
          onTouchEnd={selectModeApi.handleTouchEnd}
          onMoreClick={notesApi.handleMoreClick}
        />

        {sidebarVisible && (
          <SidebarResizer onMouseDown={sidebarResize.startResize} onDoubleClick={sidebarResize.resetWidth} />
        )}

        {notesApi.active && (
          <EditorPane
            content={notesApi.active.content}
            lines={notesApi.lines}
            cursorLine={cursorLine}
            textareaRef={notesApi.textarea}
            onCursorMove={setCursorLine}
            onChange={handleChangeContent}
          />
        )}
      </section>

      <StatusBar
        status={autosave.status}
        statusLabel={autosave.statusLabel()}
        driveConnected={drive.driveConnected}
        syncStatus={drive.syncStatus}
        driveIconChar={drive.driveIcon()}
        onOpenDrivePanel={() => drive.setShowDrivePanel(true)}
        cursorLine={cursorLine}
        linesCount={notesApi.lines.length}
        charCount={notesApi.active?.content.length ?? 0}
      />

      {/* Fixed-position dropdown — escapes all overflow containers */}
      {menuNote && (
        <ContextMenu
          pos={notesApi.menuPos}
          onDuplicate={() => notesApi.duplicate(menuNote.id)}
          onRename={() => renameApi.openRename(menuNote.id)}
          onDownload={() => notesApi.download(menuNote.id)}
          onDeleteRequest={() => { notesApi.setDeleteId(menuNote.id); notesApi.setMenuId(null); }}
        />
      )}

      {deleteNote && (
        <DeleteConfirmModal
          noteName={deleteNote.name}
          onCancel={() => notesApi.setDeleteId(null)}
          onConfirm={notesApi.deleteNote}
        />
      )}

      {selectModeApi.bulkDeleteConfirm && (
        <BulkDeleteConfirmModal
          count={selectModeApi.selected.size}
          onCancel={() => selectModeApi.setBulkDeleteConfirm(false)}
          onConfirm={selectModeApi.confirmBulkDelete}
        />
      )}

      {renameApi.renameId && (
        <RenameModal
          name={renameApi.renameName}
          error={renameApi.renameError}
          inputRef={renameApi.renameInput}
          onChange={renameApi.onRenameChange}
          onCancel={() => renameApi.setRenameId(null)}
          onCommit={renameApi.commitRename}
        />
      )}

      {drive.showDrivePanel && (
        <DrivePanel
          notes={notesApi.notes}
          driveConnected={drive.driveConnected}
          driveConnecting={drive.driveConnecting}
          syncStatus={drive.syncStatus}
          lastSynced={drive.lastSynced}
          noteSyncMap={drive.noteSyncMap}
          driveIconChar={drive.driveIcon()}
          onClose={() => drive.setShowDrivePanel(false)}
          onConnect={drive.connectDrive}
          onCancelConnecting={drive.cancelConnecting}
          onSyncNow={drive.doSync}
          onDisconnect={drive.disconnectDrive}
        />
      )}
    </main>
  );
}
