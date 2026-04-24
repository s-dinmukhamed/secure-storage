import UploadArea from "../components/UploadArea";
import FileList from "../components/FileList";
import FeedbackMessage from "../components/FeedbackMessage";

function VaultPage({
  user,
  files,
  loadingFiles,
  uploadBusy,
  actionBusy,
  listFeedback,
  uploadFeedback,
  onRefresh,
  onUpload,
  onDownload,
  onDelete,
  onLogout
}) {
  return (
    <section className="vault-shell">
      <header className="topbar">
        <div>
          <h1 className="heading">Secure File Vault</h1>
          <p className="muted">
            Signed in as <strong>{user.username}</strong>
          </p>
        </div>
        <div className="toolbar">
          <button className="btn secondary" type="button" onClick={onRefresh} disabled={loadingFiles}>
            {loadingFiles ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn subtle" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="vault-grid">
        <div>
          <UploadArea onUpload={onUpload} busy={uploadBusy} />
          <FeedbackMessage message={uploadFeedback.message} tone={uploadFeedback.tone} />
        </div>

        <div>
          <FileList
            files={files}
            loading={loadingFiles}
            actionBusy={actionBusy}
            onDownload={onDownload}
            onDelete={onDelete}
          />
          <FeedbackMessage message={listFeedback.message} tone={listFeedback.tone} />
        </div>
      </div>
    </section>
  );
}

export default VaultPage;
