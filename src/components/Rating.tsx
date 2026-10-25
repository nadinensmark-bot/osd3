"use client";

export default function Rating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ flex: 1, minWidth: 170, fontSize: "0.92rem" }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <Btn active={value === 0} onClick={() => onChange(0)} label="–" title="nehodnoceno" />
        {[1, 2, 3, 4, 5].map((n) => (
          <Btn key={n} active={value === n} onClick={() => onChange(n)} label={String(n)} />
        ))}
      </div>
    </div>
  );
}

function Btn({ active, onClick, label, title }: { active: boolean; onClick: () => void; label: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "1px solid " + (active ? "var(--navy)" : "var(--line)"),
        background: active ? "var(--navy)" : "#fff",
        color: active ? "#fff" : "var(--muted)",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: "0.9rem",
      }}
    >
      {label}
    </button>
  );
}
