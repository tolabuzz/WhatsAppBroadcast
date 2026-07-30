import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../context/AccountContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { apiFetch } from "../lib/apiClient";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function Login() {
  const { login, logout } = useAccount();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    login(email);
    try {
      await apiFetch("/account/init", { method: "POST" });
      navigate("/", { replace: true });
    } catch {
      setError("Couldn't reach the server. Please try again.");
      logout();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 bg-surface-muted">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-dark flex items-center justify-center text-white font-bold text-xl mb-3">
            B
          </div>
          <h1 className="text-xl font-bold text-ink">Broadcast</h1>
          <p className="text-sm text-ink-muted text-center mt-1">
            Personalized WhatsApp messaging for your community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-black/5 p-5 flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            autoFocus
          />
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? "Loading..." : "Continue"}
          </Button>
          <p className="text-xs text-ink-muted text-center">
            No password needed. Enter the same email on any device to access your data.
          </p>
        </form>
      </div>
    </div>
  );
}
