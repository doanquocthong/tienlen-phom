import { useEffect, useRef } from "react";
import "../App.css";
import Avatar from "./Avatar";
import { pointClass } from "../storage/tienlenSession";

function spawnBurst(width, height) {
  const x = width * (0.12 + Math.random() * 0.76);
  const y = height * (0.08 + Math.random() * 0.42);
  const hue = [42, 18, 200, 350, 120][Math.floor(Math.random() * 5)];
  const count = 78;
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
    const speed = 1.6 + Math.random() * 4.8;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.007 + Math.random() * 0.012,
      hue,
      size: 1.6 + Math.random() * 2.4,
    });
  }
  return particles;
}

function Fireworks() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const ctx = canvas.getContext("2d");
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let bursts = [];
    let frame = 0;
    let raf = 0;

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    bursts.push(spawnBurst(window.innerWidth, window.innerHeight));

    const tick = () => {
      frame += 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (frame % 26 === 0) bursts.push(spawnBurst(width, height));
      ctx.clearRect(0, 0, width, height);
      bursts.forEach((particles) => {
        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.04;
          particle.vx *= 0.992;
          particle.life -= particle.decay;
          ctx.globalAlpha = Math.max(particle.life, 0);
          ctx.fillStyle = `hsl(${particle.hue} 100% 62%)`;
          ctx.shadowColor = `hsl(${particle.hue} 100% 60%)`;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      bursts = bursts
        .map((particles) => particles.filter((particle) => particle.life > 0))
        .filter((particles) => particles.length);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />;
}

export default function Congratulation({ players, goal, onClose }) {
  if (!players?.length) return null;
  const tied = players.length > 1;
  const reached = goal && players.some((player) => player.currentScore >= goal);

  return (
    <div className="celebration-root" role="dialog" aria-label={tied ? "Hòa điểm" : "Người thắng"}>
      <Fireworks />
      <div className="celebration-lights" />
      <div className="celebration-flash" />
      <div className="modal-overlay celebration-overlay">
        <div className="modal-box congratulation-box">
          <div className="trophy" aria-hidden="true">🏆</div>
          <h2 className="modal-title">{tied ? "Hòa điểm" : "Người thắng"}</h2>
          {reached && <p className="celebration-goal">Đạt mốc {goal}</p>}

          <div className="winner-list">
            {players.map((player) => (
              <div key={player.id} className="winner-card">
                <Avatar name={player.name} src={player.avatar} size={72} />
                <div className="winner-name">{player.name}</div>
                <div className="winner-info">
                  Điểm: <span className={pointClass(player.currentScore)}>{player.currentScore}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="btn-row">
            <button type="button" onClick={onClose} className="confirm-btn">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
