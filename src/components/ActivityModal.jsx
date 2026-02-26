import { useState } from "react";
import Modal from "./Modal";
import Btn from "./Btn";
import { INP, LBL, ROW } from "../styles";
import { uid } from "../utils/helpers";
import { TYPE_META } from "../constants";

const EMOJI_OPTIONS = [
  "🎯","🎪","🎨","🎭","🎬","🎤","🎵","🎸","🎹","🎲",
  "🏖","🏝","🏔","🏕","🌋","🗺","🗼","🗽","🏰","⛩",
  "🚗","🚕","🚌","🚂","🚢","✈️","🚁","🛵","🚴","🛶",
  "🍽","🍜","🍣","🍕","🍔","🥗","🍷","🍸","☕","🧁",
  "🏨","🛎","🛏","🏊","🧖","💆","🛁","🛒","🎁","💍",
  "🏄","🤿","🧗","🪂","⛷","🏇","🎾","⛳","🎿","🚵",
  "🌅","🌄","🌉","🌃","🌇","🌆","🌠","🎑","🏞","🌌",
  "🎡","🎢","🎠","🎆","🎇","🧨","🎉","🎊","🎈","🎀",
];

export default function ActivityModal({ event, dayId, onClose, onSave, onDelete }) {
  const isEdit = !!event?.id;
  const TYPE_ICONS = {
    flight: "✈️",
    checkin: "🏨",
    transfer: "🚗",
    activity: "🎯",
    food: "🍽",
  };
  const [f, setF] = useState(
    event || { type: "activity", time: "09:00", label: "", icon: "🎯" },
  );
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={isEdit ? "✏️ Edit Activity" : "➕ Add Activity"}
      onClose={onClose}
      width={380}
    >
      <div style={ROW}>
        <label style={LBL}>Type</label>
        <select
          style={INP}
          value={f.type}
          onChange={(e) =>
            setF((p) => ({
              ...p,
              type: e.target.value,
              icon: TYPE_ICONS[e.target.value] || "🎯",
            }))
          }
        >
          {Object.entries(TYPE_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
      </div>
      <div style={ROW}>
        <label style={LBL}>Description</label>
        <input
          style={INP}
          value={f.label}
          placeholder="What's happening?"
          onChange={(e) => s("label", e.target.value)}
          autoFocus
        />
      </div>
      <div style={ROW}>
        <label style={LBL}>Time</label>
        <input
          style={INP}
          value={f.time}
          placeholder="09:00 or 'All day'"
          onChange={(e) => s("time", e.target.value)}
        />
      </div>
      <div style={ROW}>
        <label style={LBL}>Icon — selected: {f.icon}</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 4,
            background: "#141728",
            borderRadius: 8,
            padding: 8,
            maxHeight: 160,
            overflowY: "auto",
          }}
        >
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => s("icon", e)}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 6,
                border: f.icon === e ? "2px solid #e8a44a" : "2px solid transparent",
                background: f.icon === e ? "#2a2010" : "transparent",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              {e}
            </button>
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
        {isEdit ? (
          <Btn
            variant="danger"
            onClick={() => {
              onDelete(dayId, f.id);
              onClose();
            }}
          >
            🗑 Delete
          </Btn>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={!f.label.trim()}
            onClick={() => {
              onSave(dayId, { ...f, id: f.id || uid() });
              onClose();
            }}
          >
            Save
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
