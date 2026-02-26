import { useState } from "react";
import Modal from "./Modal";
import Btn from "./Btn";
import { INP, LBL, ROW } from "../styles";
import { uid, toISO } from "../utils/helpers";

export default function DayModal({ day, onClose, onSave, onDelete, tripStart }) {
  const isEdit = !!day?.id;
  const [f, setF] = useState(
    day || { title: "", date: tripStart || new Date() },
  );
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={isEdit ? "✏️ Edit Day" : "📅 Add Day"}
      onClose={onClose}
      width={360}
    >
      <div style={ROW}>
        <label style={LBL}>Day Title</label>
        <input
          style={INP}
          value={f.title}
          placeholder="e.g. Arrival & First Explorations"
          onChange={(e) => s("title", e.target.value)}
          autoFocus
        />
      </div>
      <div style={ROW}>
        <label style={LBL}>Date</label>
        <input
          style={INP}
          type="date"
          value={f.date ? toISO(f.date) : ""}
          onChange={(e) => s("date", new Date(e.target.value + "T00:00"))}
        />
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
              onDelete(f.id);
              onClose();
            }}
          >
            🗑 Delete Day
          </Btn>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={!f.title.trim()}
            onClick={() => {
              onSave({ ...f, id: f.id || uid(), events: f.events || [] });
              onClose();
            }}
          >
            Save Day
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
