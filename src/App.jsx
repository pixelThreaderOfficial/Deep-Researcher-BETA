import { AIInput } from "./components/widgets";
import { Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/Chat";

// Main App component
const App = () => {
  return (
    <div className="">
      <Routes>
        <Route path="/" element={<AIInput />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/chat" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
};

export default App;
