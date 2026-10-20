import { useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import TienLenScreen from "./screens/TienLenScreen";

function App() {
  const [screen, setScreen] = useState("home");

  const page = screen === "tienlen"
    ? <TienLenScreen goHome={() => setScreen("home")} />
    : <HomeScreen onSelect={(mode) => setScreen(mode)} />;

  return (
    <>
      <div className="rotate-hint">Xoay dọc điện thoại để tính điểm</div>
      {page}
    </>
  );
}

export default App;
