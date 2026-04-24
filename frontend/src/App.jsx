import { useCallback, useEffect, useMemo, useState } from "react";
import AuthPage from "./pages/AuthPage";
import VaultPage from "./pages/VaultPage";
import {
  clearTokens,
  deleteFile,
  getCurrentUser,
  getDownloadLink,
  getStoredTokens,
  listFiles,
  loginUser,
  persistTokens,
  registerUser,
  uploadFile
} from "./services/api";

const EMPTY_FEEDBACK = { message: "", tone: "info" };

function App() {
  const [tokens, setTokens] = useState(() => getStoredTokens());
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [authFeedback, setAuthFeedback] = useState(EMPTY_FEEDBACK);
  const [uploadFeedback, setUploadFeedback] = useState(EMPTY_FEEDBACK);
  const [listFeedback, setListFeedback] = useState(EMPTY_FEEDBACK);

  const isAuthenticated = useMemo(() => Boolean(tokens.accessToken && user), [tokens, user]);

  const forceLogout = useCallback(() => {
    clearTokens();
    setTokens({ accessToken: null, refreshToken: null });
    setUser(null);
    setFiles([]);
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!tokens.accessToken) {
      return;
    }

    setLoadingFiles(true);
    setListFeedback(EMPTY_FEEDBACK);

    try {
      const data = await listFiles(tokens, setTokens);
      const normalized = Array.isArray(data) ? data : [];
      normalized.sort((first, second) => {
        return new Date(second.created_at || 0) - new Date(first.created_at || 0);
      });
      setFiles(normalized);
    } catch (error) {
      if (error.status === 401) {
        forceLogout();
        setAuthFeedback({ message: "Session expired. Please sign in again.", tone: "error" });
      } else {
        setListFeedback({ message: error.message, tone: "error" });
      }
    } finally {
      setLoadingFiles(false);
    }
  }, [forceLogout, tokens]);

  useEffect(() => {
    async function initializeSession() {
      if (!tokens.accessToken) {
        return;
      }
      try {
        const profile = await getCurrentUser(tokens, setTokens);
        setUser(profile);
      } catch (_error) {
        forceLogout();
      }
    }
    initializeSession();
  }, [forceLogout, tokens]);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [fetchFiles, user]);

  async function handleLogin(credentials) {
    setLoadingAuth(true);
    setAuthFeedback(EMPTY_FEEDBACK);

    try {
      const result = await loginUser(credentials);
      const nextTokens = {
        accessToken: result.access_token,
        refreshToken: result.refresh_token
      };
      persistTokens(nextTokens);
      setTokens(nextTokens);

      const profile = await getCurrentUser(nextTokens, setTokens);
      setUser(profile);
      setAuthFeedback({ message: "Signed in successfully.", tone: "success" });
    } catch (error) {
      setAuthFeedback({ message: error.message, tone: "error" });
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleRegister(payload, onSuccess) {
    setLoadingAuth(true);
    setAuthFeedback(EMPTY_FEEDBACK);

    try {
      await registerUser(payload);
      setAuthFeedback({ message: "Account created. You can now sign in.", tone: "success" });
      onSuccess();
    } catch (error) {
      setAuthFeedback({ message: error.message, tone: "error" });
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleUpload(selectedFiles) {
    if (!isAuthenticated) {
      return;
    }

    setUploadBusy(true);
    setUploadFeedback(EMPTY_FEEDBACK);

    let successCount = 0;
    const failures = [];

    try {
      for (const file of selectedFiles) {
        try {
          await uploadFile(file, tokens, setTokens);
          successCount += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        setUploadFeedback({
          message: `${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully.`,
          tone: "success"
        });
      }

      if (failures.length > 0) {
        setUploadFeedback({
          message: failures.join(" "),
          tone: "error"
        });
      }

      await fetchFiles();
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleDownload(file) {
    if (!isAuthenticated) {
      return;
    }

    setActionBusy(true);
    setListFeedback(EMPTY_FEEDBACK);

    try {
      const result = await getDownloadLink(file.id, tokens, setTokens);
      window.location.assign(result.url);
      setListFeedback({ message: `Started download for ${file.filename}.`, tone: "info" });
    } catch (error) {
      setListFeedback({ message: error.message, tone: "error" });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete(file) {
    if (!isAuthenticated) {
      return;
    }

    const confirmDelete = window.confirm(`Delete "${file.filename}"?`);
    if (!confirmDelete) {
      return;
    }

    setActionBusy(true);
    setListFeedback(EMPTY_FEEDBACK);

    try {
      await deleteFile(file.id, tokens, setTokens);
      setFiles((previous) => previous.filter((candidate) => candidate.id !== file.id));
      setListFeedback({ message: `${file.filename} deleted.`, tone: "success" });
    } catch (error) {
      setListFeedback({ message: error.message, tone: "error" });
    } finally {
      setActionBusy(false);
    }
  }

  function handleLogout() {
    forceLogout();
    setAuthFeedback({ message: "You have been logged out.", tone: "info" });
    setUploadFeedback(EMPTY_FEEDBACK);
    setListFeedback(EMPTY_FEEDBACK);
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={loadingAuth}
        feedback={authFeedback}
      />
    );
  }

  return (
    <AppLayout>
      <VaultPage
        user={user}
        files={files}
        loadingFiles={loadingFiles}
        uploadBusy={uploadBusy}
        actionBusy={actionBusy}
        listFeedback={listFeedback}
        uploadFeedback={uploadFeedback}
        onRefresh={fetchFiles}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onLogout={handleLogout}
      />
    </AppLayout>
  );
}

function AppLayout({ children }) {
  return <main className="app-container">{children}</main>;
}

export default App;
