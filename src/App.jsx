import { AIInput } from "./components/widgets";
import { Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";

// Main App component
const App = () => {
  return (
    <div className="">
      <Routes>
        <Route path="/" element={<AIInput />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>
  )
};

export default App;
