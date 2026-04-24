function formatBytes(bytes) {
  if (!bytes && bytes !== 0) {
    return "Unknown";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function FileItem({ file, onDownload, onDelete, busy }) {
  return (
    <tr>
      <td className="file-name">{file.filename}</td>
      <td>{formatBytes(file.size)}</td>
      <td>{formatDate(file.created_at)}</td>
      <td>
        <div className="actions">
          <button
            type="button"
            className="btn btn-sm subtle"
            onClick={() => onDownload(file)}
            disabled={busy}
          >
            Download
          </button>
          <button
            type="button"
            className="btn btn-sm danger"
            onClick={() => onDelete(file)}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default FileItem;
