import { Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { RequireAccount } from "./components/RequireAccount";
import { ToastProvider } from "./components/ui/Toast";
import { AccountProvider } from "./context/AccountContext";
import { queryClient } from "./lib/queryClient";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Contacts } from "./pages/Contacts";
import { Groups } from "./pages/Groups";
import { GroupDetail } from "./pages/GroupDetail";
import { Templates } from "./pages/Templates";
import { Broadcasts } from "./pages/Broadcasts";
import { BroadcastNew } from "./pages/BroadcastNew";
import { BroadcastDetail } from "./pages/BroadcastDetail";
import { BroadcastRunner } from "./pages/BroadcastRunner";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccountProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAccount />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:id" element={<GroupDetail />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/broadcasts" element={<Broadcasts />} />
                <Route path="/broadcasts/new" element={<BroadcastNew />} />
                <Route path="/broadcasts/:id" element={<BroadcastDetail />} />
              </Route>
              <Route path="/broadcasts/:id/run" element={<BroadcastRunner />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AccountProvider>
    </QueryClientProvider>
  );
}

export default App;
