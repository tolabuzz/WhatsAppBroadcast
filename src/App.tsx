import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/ui/Toast";
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
    <ToastProvider>
      <Routes>
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
      </Routes>
    </ToastProvider>
  );
}

export default App;
