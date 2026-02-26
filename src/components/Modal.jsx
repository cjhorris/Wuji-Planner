import React from "react";

export default function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,22,30,0.92)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1d2030",
          border: "1px solid #30354f",
          borderRadius: 18,
          width,
          maxWidth: "calc(100vw - 24px)",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 100px rgba(0,0,0,.7)",
          animation: "fadeUp .25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #30354f",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#f0ece4",
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#252840",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
