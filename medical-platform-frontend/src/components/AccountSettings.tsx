"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { changePassword, updateAccount } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";

export default function AccountSettings() {
  const { user, setUser } = useAuth();
  const [account, setAccount] = useState({
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(null); setMessage(null);
    try {
      const updated = await updateAccount(account);
      setUser(updated);
      setMessage("Account settings saved.");
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Unable to update account settings.");
    } finally { setSaving(false); }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(null); setMessage(null);
    try {
      const updated = await changePassword(password);
      setUser(updated.user);
      setPassword({ currentPassword: "", newPassword: "" });
      setMessage("Password changed. Your session has been refreshed.");
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Unable to change password.");
    } finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <header><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">Security and identity</p><h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">Account settings</h1><p className="mt-1 text-xs text-zinc-500">Manage your own contact details and password.</p></header>
    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">{message}</div>}
    {error && <div className="rounded-xl border border-red-500/30 bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
    <form onSubmit={saveAccount} className="card space-y-5 border-zinc-200/80 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900"><div className="flex items-center gap-3 border-b border-zinc-200 pb-4 dark:border-white/[0.08]"><ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-brand" /><div><h2 className="font-semibold text-zinc-900 dark:text-white">Personal details</h2><p className="text-xs text-zinc-500">These details identify you across the clinic.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" value={account.firstName} onChange={(value) => setAccount({ ...account, firstName: value })} /><Field label="Last name" value={account.lastName} onChange={(value) => setAccount({ ...account, lastName: value })} /><Field label="Email address" type="email" value={account.email} onChange={(value) => setAccount({ ...account, email: value })} /><Field label="Phone" value={account.phone} onChange={(value) => setAccount({ ...account, phone: value })} /></div><div className="flex justify-end"><button disabled={saving} className="btn-primary"><Save className="h-3.5 w-3.5" />Save details</button></div></form>
    <form onSubmit={savePassword} className="card space-y-5 border-zinc-200/80 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900"><div className="flex items-center gap-3 border-b border-zinc-200 pb-4 dark:border-white/[0.08]"><KeyRound className="h-5 w-5 text-emerald-600 dark:text-brand" /><div><h2 className="font-semibold text-zinc-900 dark:text-white">Change password</h2><p className="text-xs text-zinc-500">Use at least 10 characters and do not reuse your current password.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Current password" type="password" value={password.currentPassword} onChange={(value) => setPassword({ ...password, currentPassword: value })} /><Field label="New password" type="password" value={password.newPassword} onChange={(value) => setPassword({ ...password, newPassword: value })} /></div><div className="flex justify-end"><button disabled={saving} className="btn-primary"><KeyRound className="h-3.5 w-3.5" />Update password</button></div></form>
  </div>;
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs text-zinc-500">{label}<input required={label !== "Phone"} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input mt-1 text-sm" /></label>;
}
