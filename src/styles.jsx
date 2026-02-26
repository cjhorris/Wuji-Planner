import React from "react";

export const INP = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#141728",
  border: "1px solid #2a2d3a",
  color: "#d0cdc8",
  fontSize: 12,
  outline: "none",
  width: "100%",
};
export const LBL = {
  fontSize: 10,
  color: "#7a8090",
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 4,
  display: "block",
};
export const ROW = { display: "flex", flexDirection: "column", gap: 4 };
export const HR = () => (
  <div style={{ height: 1, background: "#252840", margin: "2px 0" }} />
);
