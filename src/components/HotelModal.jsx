import { useState, useMemo } from "react";
import Modal from "./Modal";
import Btn from "./Btn";
import { INP, LBL, ROW } from "../styles";
import { uid, toISO, nightsBetween } from "../utils/helpers";

export default function HotelModal({ hotel, onClose, onSave, onDelete, defaultDate }) {
  const isEdit = !!hotel?.id;
  const defDate = defaultDate || new Date();
  const [h, setH] = useState(
    hotel || {
      name: "",
      location: "",
      checkin: defDate,
      checkout: defDate,
      roomType: "",
      rating: 5,
      price: "",
      confirmation: "",
      amenities: [],
    },
  );
  const s = (k, v) =>
    setH((p) => {
      const next = { ...p, [k]: v };
      if (k === "checkin" && p.checkin?.getTime() === p.checkout?.getTime())
        next.checkout = v;
      return next;
    });
  const [am, setAm] = useState("");
  const nights = useMemo(
    () => nightsBetween(h.checkin, h.checkout),
    [h.checkin, h.checkout],
  );
  return (
    <Modal title={isEdit ? "🏨 Edit Hotel" : "🏨 Add Hotel"} onClose={onClose}>
      <div style={ROW}>
        <label style={LBL}>Hotel Name</label>
        <input
          style={INP}
          value={h.name}
          placeholder="Four Seasons Bali"
          onChange={(e) => s("name", e.target.value)}
          autoFocus
        />
      </div>
      <div style={ROW}>
        <label style={LBL}>Location</label>
        <input
          style={INP}
          value={h.location}
          placeholder="Ubud, Bali"
          onChange={(e) => s("location", e.target.value)}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Check-in</label>
          <input
            style={INP}
            type="date"
            value={h.checkin ? toISO(h.checkin) : ""}
            onChange={(e) => s("checkin", new Date(e.target.value + "T00:00"))}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Check-out</label>
          <input
            style={INP}
            type="date"
            value={h.checkout ? toISO(h.checkout) : ""}
            onChange={(e) => s("checkout", new Date(e.target.value + "T00:00"))}
          />
        </div>
      </div>
      <div
        style={{
          padding: "7px 12px",
          background: "#141728",
          borderRadius: 8,
          fontSize: 12,
          color: "#e8a44a",
          fontWeight: 700,
        }}
      >
        🌙 {nights} night{nights !== 1 ? "s" : ""}
      </div>
      <div style={ROW}>
        <label style={LBL}>Room Type</label>
        <input
          style={INP}
          value={h.roomType}
          placeholder="Deluxe Ocean View"
          onChange={(e) => s("roomType", e.target.value)}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Stars</label>
          <select
            style={INP}
            value={h.rating}
            onChange={(e) => s("rating", parseInt(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Price ($)</label>
          <input
            style={INP}
            type="number"
            value={h.price}
            placeholder="0"
            onChange={(e) => s("price", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      <div style={ROW}>
        <label style={LBL}>Confirmation No.</label>
        <input
          style={INP}
          value={h.confirmation}
          placeholder="Booking ref"
          onChange={(e) => s("confirmation", e.target.value)}
        />
      </div>
      <div style={ROW}>
        <label style={LBL}>Amenities</label>
        <div
          style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}
        >
          {h.amenities.map((a) => (
            <span
              key={a}
              style={{
                fontSize: 10,
                background: "#252840",
                color: "#6a7080",
                padding: "3px 10px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {a}
              <span
                onClick={() =>
                  s(
                    "amenities",
                    h.amenities.filter((x) => x !== a),
                  )
                }
                style={{
                  cursor: "pointer",
                  color: "#ef4444",
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                ✕
              </span>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            style={{ ...INP, flex: 1 }}
            value={am}
            placeholder="Pool, Spa, Breakfast…"
            onChange={(e) => setAm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && am.trim()) {
                s("amenities", [...h.amenities, am.trim()]);
                setAm("");
              }
            }}
          />
          <Btn
            variant="subtle"
            onClick={() => {
              if (am.trim()) {
                s("amenities", [...h.amenities, am.trim()]);
                setAm("");
              }
            }}
            style={{ flexShrink: 0, padding: "7px 12px" }}
          >
            Add
          </Btn>
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
              onDelete(h.id);
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
              onSave({ ...h, id: h.id || uid(), nights });
              onClose();
            }}
          >
            Save Hotel
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
