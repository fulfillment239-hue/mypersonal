/** Administration landing verifies the second-gate API before exposing any content tools. */
import { useEffect, useState } from "react";

interface Overview { username: string; projects: number; environment: string; }

export default function AdminPanel() {
  const [state, setState] = useState<Overview | "denied" | "loading">("loading");
  const [kind, setKind] = useState("projects");
  const [documentText, setDocumentText] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { fetch("/api/admin/v1/overview", { credentials: "include" }).then(async (response) => response.ok ? setState(await response.json()) : setState("denied")).catch(() => setState("denied")); }, []);
  if (state === "loading") return <p>Checking administrator access…</p>;
  if (state === "denied") return <div className="card"><p>Administration requires both Cloudflare Access and a D1 administrator session.</p></div>;
  return <div className="card"><p className="eyebrow">Administrator verified</p><h2>{state.username}</h2><p>{state.projects} project records are available in the current content store.</p><div className="admin-tools"><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="site">site.json</option><option value="categories">categories.json</option><option value="projects">projects.json</option><option value="media">media.json</option></select><button className="pill" onClick={() => loadDocument(kind, setDocumentText, setNotice)}>Load JSON</button></div><textarea className="json-editor" value={documentText} onChange={(event) => setDocumentText(event.target.value)} placeholder="Load a content document to edit it." /><div className="admin-tools"><button className="pill pill--gold" onClick={() => saveDocument(kind, documentText, setNotice)}>Validate and save</button><span>{notice}</span></div></div>;
}

async function loadDocument(kind: string, setDocumentText: (value: string) => void, setNotice: (value: string) => void): Promise<void> {
  const response = await fetch(`/api/admin/v1/content/${kind}`, { credentials: "include" });
  if (!response.ok) return setNotice("Could not load this document.");
  setDocumentText(JSON.stringify(await response.json(), null, 2));
  setNotice("Loaded from the active content store.");
}

async function saveDocument(kind: string, documentText: string, setNotice: (value: string) => void): Promise<void> {
  try {
    const csrf = await fetchCsrf();
    const body = JSON.parse(documentText);
    const response = await fetch(`/api/admin/v1/content/${kind}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf }, body: JSON.stringify(body) });
    setNotice(response.ok ? "Saved with a revision backup." : "The document did not pass validation.");
  } catch { setNotice("Enter valid JSON before saving."); }
}

async function fetchCsrf(): Promise<string> {
  const stored = sessionStorage.getItem("portfolio_csrf");
  if (stored) return stored;
  const response = await fetch("/api/v1/auth/csrf", { credentials: "include" });
  const payload = await response.json() as { csrfToken?: string };
  if (!payload.csrfToken) throw new Error("No CSRF token.");
  sessionStorage.setItem("portfolio_csrf", payload.csrfToken);
  return payload.csrfToken;
}
