export default function Avatar({ name, src, size = 48, placeholder = "?" }) {
  const letter = (name || "").trim().charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        className="avatar-img"
        src={src}
        alt=""
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="avatar-fallback"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {letter || placeholder}
    </span>
  );
}
