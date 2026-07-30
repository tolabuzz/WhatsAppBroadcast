import { createContext, useContext, useState, type ReactNode } from "react";

const STORAGE_KEY = "broadcast_account_email";

interface AccountContextValue {
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  function login(newEmail: string) {
    const normalized = newEmail.trim().toLowerCase();
    localStorage.setItem(STORAGE_KEY, normalized);
    setEmail(normalized);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setEmail(null);
  }

  return <AccountContext.Provider value={{ email, login, logout }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
