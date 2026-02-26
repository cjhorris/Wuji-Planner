import { useState } from "react";
import Modal from "./Modal";
import Btn from "./Btn";
import { INP, LBL, ROW } from "../styles";
import { toISO } from "../utils/helpers";
import { EMOJIS_TRIP, COLORS_TRIP } from "../constants";

export default function EditTripModal({ trip, onClose, onSave, onDelete }) {
  const [f, setF] = useState({
    ...trip,
    startDate: toISO(trip.dates.start),
    endDate: toISO(trip.dates.end),
  });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title="✏️ Edit Trip" onClose={onClose} width={440}>
      <div>
        <label style={LBL}>Icon</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {EMOJIS_TRIP.map((e) => (
            <button
              key={e}
              onClick={() => s("emoji", e)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: `2px solid ${f.emoji === e ? "#e8a44a" : "#2a2d3a"}`,
                background: f.emoji === e ? "#1e1a12" : "#141728",
                fontSize: 17,
                cursor: "pointer",
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div style={ROW}>
        <label style={LBL}>Trip Name</label>
        <input
          style={INP}
          value={f.name}
          onChange={(e) => s("name", e.target.value)}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Departure</label>
          <input
            style={INP}
            type="date"
            value={f.startDate}
            onChange={(e) => s("startDate", e.target.value)}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Return</label>
          <input
            style={INP}
            type="date"
            value={f.endDate}
            onChange={(e) => s("endDate", e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Travelers</label>
          <input
            style={INP}
            type="number"
            min={1}
            max={20}
            value={f.travelers}
            onChange={(e) => s("travelers", parseInt(e.target.value))}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Status</label>
          <select
            style={INP}
            value={f.status}
            onChange={(e) => s("status", e.target.value)}
          >
            {["planning", "upcoming", "ongoing", "completed"].map((st) => (
              <option key={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label style={LBL}>Color</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLORS_TRIP.map((c) => (
            <button
              key={c}
              onClick={() => s("color", c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: c,
                border: `3px solid ${f.color === c ? "#fff" : "transparent"}`,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <Btn
          variant="danger"
          onClick={() => {
            onDelete(trip.id);
            onClose();
          }}
        >
          🗑 Delete Trip
        </Btn>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              onSave({
                ...f,
                color: f.color,
                textColor: ["#e8a44a", "#f472b6", "#84cc16"].includes(f.color)
                  ? "#171a28"
                  : "#fff",
                dates: {
                  start: new Date(f.startDate + "T00:00"),
                  end: new Date(f.endDate + "T00:00"),
                },
              });
              onClose();
            }}
          >
            Save Changes
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
