/** Member settings only expose data the v1 account system actually persists. */
import { useEffect, useState } from "react";

interface Session { username: string; role: "member" | "admin"; }
interface SessionResponse { user?: null; username?: string; role?: "member" | "admin"; }

export default function AccountPanel() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/v1/auth/session", { credentials: "include" }).then((response) => response.json() as Promise<SessionResponse>).then((data) => setSession(data.username && data.role ? { username: data.username, role: data.role } : null)).catch(() => setSession(null));
  }, []);

  if (session === undefined) return <p>Loading account…</p>;
  if (!session) return <div className="card"><p>You are browsing as a guest. Sign in from the header to synchronize favorites and language preferences.</p></div>;
  return <div className="card"><p className="eyebrow">Signed in</p><h2>{session.username}</h2><p>Your account synchronizes favorites and language preferences. Email verification, comments and uploads are intentionally not enabled in this first release.</p>{session.role === "admin" && <a className="pill pill--gold" href="/admin">Open administration</a>}</div>;
}
