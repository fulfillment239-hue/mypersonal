/** Account dialog supports direct browsing, member registration and same-origin Worker login. */
import { FormEvent, useRef, useState } from "react";
import type { Locale } from "@462019/contracts";

interface Props { label: string; locale: Locale; }
type Mode = "login" | "register";

export default function AuthDialog({ label, locale }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { username: form.get("username"), password: form.get("password"), email: form.get("email") || undefined, turnstileToken: "dev-token" };
    const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" });
    if (!response.ok) return setError(locale === "en" ? "We could not complete that request." : "无法完成该请求。" );
    const result = await response.json() as { csrfToken: string };
    sessionStorage.setItem("portfolio_csrf", result.csrfToken);
    location.assign("/account");
  }

  return <>
    <button className="pill pill--gold" onClick={() => dialog.current?.showModal()}>{label}</button>
    <dialog ref={dialog} aria-label={locale === "en" ? "Account access" : "账号访问"}>
      <form className="auth-form" onSubmit={submit}>
        <div className="eyebrow">{mode === "login" ? (locale === "en" ? "Welcome back" : "欢迎回来") : (locale === "en" ? "Join the archive" : "加入档案")}</div>
        <h2>{mode === "login" ? (locale === "en" ? "Sign in" : "登录") : (locale === "en" ? "Create account" : "创建账号")}</h2>
        <input name="username" pattern="[a-z0-9_]{3,32}" placeholder={locale === "en" ? "username" : "用户名（英文小写）"} required />
        <input name="password" type="password" minLength={12} placeholder={locale === "en" ? "password" : "密码"} required />
        {mode === "register" && <><input name="email" type="email" placeholder={locale === "en" ? "email (optional)" : "邮箱（可选）"} /><small>{locale === "en" ? "Email is stored as unverified profile data and cannot recover an account." : "邮箱未经验证，不能用于找回账号。"}</small></>}
        <div className="auth-error">{error}</div>
        <button className="pill pill--gold" type="submit">{mode === "login" ? (locale === "en" ? "Sign in" : "登录") : (locale === "en" ? "Register" : "注册")}</button>
        <button className="pill" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? (locale === "en" ? "Create an account" : "注册账号") : (locale === "en" ? "I already have an account" : "已有账号")}</button>
        <button className="pill" type="button" onClick={() => dialog.current?.close()}>{locale === "en" ? "Continue as guest" : "以游客身份继续"}</button>
      </form>
    </dialog>
  </>;
}
