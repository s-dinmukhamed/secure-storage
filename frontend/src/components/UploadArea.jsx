import { useRef, useState } from "react";

function UploadArea({ onUpload, busy }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) {
      return;
    }
    onUpload(files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragOver(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <section className="card">
      <h2>Upload Files</h2>
      <p className="muted">Drag files below or choose files from your device.</p>

      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        tabIndex={0}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
      >
        <p>Drop files here</p>
        <p className="muted small">or</p>
        <button
          className="btn secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden-input"
          onChange={(event) => handleFiles(event.target.files)}
          disabled={busy}
        />
      </div>
    </section>
  );
}

export default UploadArea;
