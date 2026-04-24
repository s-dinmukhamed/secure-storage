import FileItem from "./FileItem";

function FileList({ files, loading, actionBusy, onDownload, onDelete }) {
  return (
    <section className="card">
      <h2>Your Files</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="placeholder">
                  Loading files...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={4} className="placeholder">
                  No files uploaded yet.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  busy={actionBusy}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default FileList;
