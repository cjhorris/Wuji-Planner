import React from "react";

export default function Btn({
  children,
  onClick,
  variant = "gold",
  style = {},
  disabled = false,
}) {
  const base = {
    padding: "7px 16px",
    borderRadius: 9,
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background .15s",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };
  const bg = {
    gold: "#e8a44a",
    ghost: "transparent",
    danger: "#3f0a0a",
    subtle: "#23253a",
  }[variant];
  const clr = {
    gold: "#181a22",
    ghost: "#888",
    danger: "#f87171",
    subtle: "#888",
  }[variant];
  const brd =
    {
      ghost: "1px solid #23253a",
      danger: "1px solid #7f1d1d",
      subtle: "1px solid #23253a",
    }[variant] || "none";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, background: bg, color: clr, border: brd }}
    >
      {children}
    </button>
  );
}
