import { Navigate, Outlet } from "react-router-dom";
import { useAccount } from "../context/AccountContext";

export function RequireAccount() {
  const { email } = useAccount();
  if (!email) return <Navigate to="/login" replace />;
  return <Outlet />;
}
