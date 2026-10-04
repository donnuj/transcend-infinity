"use client";

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "rgb(6,7,15)", color: "rgba(180,160,220,0.7)", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 48, fontWeight: 900, margin: 0 }}>404</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>Página não encontrada</p>
      </div>
    </div>
  );
}
