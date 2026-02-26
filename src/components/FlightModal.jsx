import { useState } from "react";
import Modal from "./Modal";
import Btn from "./Btn";
import { INP, LBL, ROW, HR } from "../styles";
import { uid, toISO } from "../utils/helpers";

export default function FlightModal({ flight, onClose, onSave, onDelete, defaultDate }) {
  const isEdit = !!flight?.id;
  const defDate = defaultDate || new Date();
  const [f, setF] = useState(
    flight || {
      type: "outbound",
      airline: "",
      flightNo: "",
      from: { code: "", city: "", time: "", date: defDate },
      to: { code: "", city: "", time: "", date: defDate },
      duration: "",
      class: "Economy",
      seat: "",
      status: "confirmed",
      price: "",
    },
  );
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const sf = (side, k, v) =>
    setF((p) => {
      const next = { ...p, [side]: { ...p[side], [k]: v } };
      if (side === "from" && k === "date" &&
          p.from.date?.getTime() === p.to.date?.getTime())
        next.to = { ...next.to, date: v };
      return next;
    });
  return (
    <Modal
      title={isEdit ? "✈️ Edit Flight" : "✈️ Add Flight"}
      onClose={onClose}
      width={500}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Type</label>
          <select
            style={INP}
            value={f.type}
            onChange={(e) => s("type", e.target.value)}
          >
            <option value="outbound">🛫 Outbound</option>
            <option value="return">🛬 Return</option>
            <option value="connecting">🔄 Connecting</option>
          </select>
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Status</label>
          <select
            style={INP}
            value={f.status}
            onChange={(e) => s("status", e.target.value)}
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 2 }}>
          <label style={LBL}>Airline</label>
          <input
            style={INP}
            value={f.airline}
            placeholder="Singapore Airlines"
            onChange={(e) => s("airline", e.target.value)}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Flight No.</label>
          <input
            style={INP}
            value={f.flightNo}
            placeholder="SQ 947"
            onChange={(e) => s("flightNo", e.target.value)}
          />
        </div>
      </div>
      <HR />
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#6a7080",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        🛫 Departure
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, width: 80 }}>
          <label style={LBL}>IATA</label>
          <input
            style={INP}
            value={f.from.code}
            placeholder="SIN"
            onChange={(e) => sf("from", "code", e.target.value.toUpperCase())}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>City</label>
          <input
            style={INP}
            value={f.from.city}
            placeholder="Singapore"
            onChange={(e) => sf("from", "city", e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Date</label>
          <input
            style={INP}
            type="date"
            value={f.from.date ? toISO(f.from.date) : ""}
            onChange={(e) =>
              sf("from", "date", new Date(e.target.value + "T00:00"))
            }
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Time</label>
          <input
            style={INP}
            value={f.from.time}
            placeholder="08:15"
            onChange={(e) => sf("from", "time", e.target.value)}
          />
        </div>
      </div>
      <HR />
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#6a7080",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        🛬 Arrival
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, width: 80 }}>
          <label style={LBL}>IATA</label>
          <input
            style={INP}
            value={f.to.code}
            placeholder="DPS"
            onChange={(e) => sf("to", "code", e.target.value.toUpperCase())}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>City</label>
          <input
            style={INP}
            value={f.to.city}
            placeholder="Denpasar"
            onChange={(e) => sf("to", "city", e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Date</label>
          <input
            style={INP}
            type="date"
            value={f.to.date ? toISO(f.to.date) : ""}
            onChange={(e) =>
              sf("to", "date", new Date(e.target.value + "T00:00"))
            }
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Time</label>
          <input
            style={INP}
            value={f.to.time}
            placeholder="11:45"
            onChange={(e) => sf("to", "time", e.target.value)}
          />
        </div>
      </div>
      <HR />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Duration</label>
          <input
            style={INP}
            value={f.duration}
            placeholder="3h 30m"
            onChange={(e) => s("duration", e.target.value)}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Class</label>
          <select
            style={INP}
            value={f.class}
            onChange={(e) => s("class", e.target.value)}
          >
            {["Economy", "Premium Economy", "Business", "First"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Seat(s)</label>
          <input
            style={INP}
            value={f.seat}
            placeholder="24A/24B"
            onChange={(e) => s("seat", e.target.value)}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Total Fare ($)</label>
          <input
            style={INP}
            type="number"
            value={f.price}
            placeholder="0"
            onChange={(e) => s("price", parseFloat(e.target.value) || 0)}
          />
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
              onDelete(f.id);
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
            onClick={() => {
              onSave({ ...f, id: f.id || uid() });
              onClose();
            }}
          >
            Save Flight
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
