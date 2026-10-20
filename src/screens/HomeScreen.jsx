import { useState } from "react";
import "../App.css";
import tableImg from '../assets/images/table.jpg'
function HomeScreen({ onSelect }) {
  const [notice, setNotice] = useState("");

  return (
    <div className="app-phone" style={{ backgroundImage: `url(${tableImg})` }}>
      <div className="select-container">
        <div className="select-box" onClick={() => onSelect("tienlen")}>
          Tiến Lên
        </div>

        <div className="select-box" onClick={() => setNotice("Tính năng chưa phát triển.")}>
          Phỏm
        </div>

        {notice && <p className="home-notice">{notice}</p>}
      </div>
    </div>
  );
}

export default HomeScreen;
