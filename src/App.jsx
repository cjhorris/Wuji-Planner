import { useState, useMemo, useEffect, useRef } from "react";
import Modal from "./components/Modal";
import Btn from "./components/Btn";
import { supabase } from "./supabase";

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#1d2030;overflow:hidden;color:#e8e6f0;font-size:16px;line-height:1.6;}
::-webkit-scrollbar{width:8px;height:8px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#30354f;border-radius:8px;}
input,select,textarea{font-family:'Syne',sans-serif;color-scheme:dark;background:#272b40;color:#e8e6f0;border:1px solid #30354f;font-size:15px;}
button{font-family:'Syne',sans-serif;font-size:15px;color:#e8e6f0;background:#272b40;border:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
.hover-row:hover{background:rgba(232,164,74,.10)!important;cursor:pointer;}
.hover-card:hover{border-color:#e8a44a!important;transform:translateY(-2px);}
.hover-card{transition:border-color .2s,transform .2s;}
.nav-item:hover{background:rgba(232,164,74,.10)!important;}
.cal-cell:hover{background:rgba(232,164,74,.15)!important;}
.btn-gold:hover{background:#c8891f!important;color:#1d2030!important;}
.btn-ghost-dark:hover{background:rgba(232,164,74,.12)!important;color:#e8a44a!important;}
.btn-danger:hover{background:#7f1d1d!important;color:#fff!important;}
.tab-btn:hover{background:#272b40!important;color:#e8a44a!important;}
.del-btn:hover{opacity:1!important;}
@media(max-width:700px){
  body{overflow:auto;}
  .app-sidebar{display:none!important;}
  .trip-detail-panel{position:fixed!important;inset:0!important;width:100%!important;z-index:50!important;background:#1d2030!important;}
  .trip-detail-panel .tab-btn{font-size:12px!important;padding:8px 6px!important;}
}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const fmt = (d) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
const fmtS = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
const toISO = (d) => {
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const sameD = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const inRange = (d, s, e) => d >= s && d <= e;
const nightsBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
const DATE_KEYS = new Set(["start", "end", "date", "checkin", "checkout"]);
function serializeTrip(trip) {
  return JSON.parse(
    JSON.stringify(trip, (k, v) => (v instanceof Date ? v.toISOString() : v)),
  );
}
function deserializeTrip(raw) {
  return JSON.parse(JSON.stringify(raw), (k, v) => {
    if (DATE_KEYS.has(k) && typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
      return new Date(v);
    return v;
  });
}
const LS_KEY = "wuji_trip_ids";
function getOwnedIds() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function addOwnedId(id) {
  const ids = getOwnedIds();
  if (!ids.includes(id)) localStorage.setItem(LS_KEY, JSON.stringify([...ids, id]));
}
function removeOwnedId(id) {
  localStorage.setItem(LS_KEY, JSON.stringify(getOwnedIds().filter((x) => x !== id)));
}

const TYPE_META = {
  flight: { color: "#3b82f6", icon: "✈️", label: "Flight" },
  checkin: { color: "#f59e0b", icon: "🏨", label: "Hotel Check-in" },
  transfer: { color: "#10b981", icon: "🚗", label: "Transfer" },
  activity: { color: "#8b5cf6", icon: "🎯", label: "Activity" },
  food: { color: "#ef4444", icon: "🍽", label: "Food & Dining" },
};
const COLORS_TRIP = [
  "#e8a44a",
  "#6b7fff",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#f472b6",
  "#06b6d4",
  "#84cc16",
];
const EMOJIS_TRIP = [
  "🌍",
  "🌴",
  "🗼",
  "🏝",
  "🏔",
  "🗺",
  "🛫",
  "⛵",
  "🧳",
  "🎌",
  "🏖",
  "🌋",
  "🗽",
  "🏰",
  "🎡",
];

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const INP = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#141728",
  border: "1px solid #2a2d3a",
  color: "#d0cdc8",
  fontSize: 12,
  outline: "none",
  width: "100%",
};
const LBL = {
  fontSize: 10,
  color: "#7a8090",
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 4,
  display: "block",
};
const ROW = { display: "flex", flexDirection: "column", gap: 4 };
const HR = () => (
  <div style={{ height: 1, background: "#252840", margin: "2px 0" }} />
);

// ─── FLIGHT MODAL ─────────────────────────────────────────────────────────────
function FlightModal({ flight, onClose, onSave, onDelete, defaultDate }) {
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

// ─── HOTEL MODAL ─────────────────────────────────────────────────────────────
function HotelModal({ hotel, onClose, onSave, onDelete, defaultDate }) {
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

// ─── ACTIVITY MODAL ───────────────────────────────────────────────────────────
function ActivityModal({ event, dayId, onClose, onSave, onDelete }) {
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
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...ROW, flex: 2 }}>
          <label style={LBL}>Time</label>
          <input
            style={INP}
            value={f.time}
            placeholder="09:00 or 'All day'"
            onChange={(e) => s("time", e.target.value)}
          />
        </div>
        <div style={{ ...ROW, flex: 1 }}>
          <label style={LBL}>Emoji</label>
          <input
            style={INP}
            value={f.icon}
            onChange={(e) => s("icon", e.target.value)}
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

// ─── DAY MODAL ────────────────────────────────────────────────────────────────
function DayModal({ day, onClose, onSave, onDelete, tripStart }) {
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

// ─── EDIT TRIP MODAL ──────────────────────────────────────────────────────────
function EditTripModal({ trip, onClose, onSave, onDelete }) {
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

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────
function MiniCal({ year, month, onSelect, selected, trips }) {
  const first = new Date(year, month, 1).getDay(),
    dim = new Date(year, month + 1, 0).getDate(),
    today = new Date(),
    cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            style={{
              fontSize: 9,
              color: "#7a8499",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {d[0]}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const date = new Date(year, month, d),
            isToday = sameD(date, today),
            isSel = selected && sameD(date, selected),
            tripDay = trips.find((t) =>
              inRange(date, t.dates.start, t.dates.end),
            );
          return (
            <div
              key={i}
              onClick={() => onSelect(date)}
              style={{
                position: "relative",
                height: 22,
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: isSel || isToday ? 700 : 400,
                background: isSel
                  ? "#e8a44a"
                  : tripDay
                    ? `${tripDay.color}30`
                    : "transparent",
                color: isSel ? "#171a28" : isToday ? "#e8a44a" : "#888",
                cursor: "pointer",
                transition: "all .1s",
              }}
            >
              {d}
              {isToday && !isSel && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "#e8a44a",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BIG CALENDAR ────────────────────────────────────────────────────────────
function CalendarView({ trips, onSelectDate, onSelectTrip }) {
  const today = new Date();
  const [vy, setVY] = useState(today.getFullYear());
  const [vm, setVM] = useState(today.getMonth());
  const [sel, setSel] = useState(today);
  const first = new Date(vy, vm, 1).getDay(),
    dim = new Date(vy, vm + 1, 0).getDate(),
    dimPrev = new Date(vy, vm, 0).getDate(),
    cells = [];
  for (let i = first - 1; i >= 0; i--)
    cells.push({
      d: dimPrev - i,
      cur: false,
      date: new Date(vy, vm - 1, dimPrev - i),
    });
  for (let d = 1; d <= dim; d++)
    cells.push({ d, cur: true, date: new Date(vy, vm, d) });
  while (cells.length < 42) {
    const n = cells.length - first - dim + 1;
    cells.push({ d: n, cur: false, date: new Date(vy, vm + 1, n) });
  }
  function prev() {
    if (vm === 0) {
      setVM(11);
      setVY(vy - 1);
    } else setVM(vm - 1);
  }
  function next() {
    if (vm === 11) {
      setVM(0);
      setVY(vy + 1);
    } else setVM(vm + 1);
  }
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 20px",
          borderBottom: "1px solid #30354f",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={prev}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "#252840",
              border: "none",
              color: "#777",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ‹
          </button>
          <button
            onClick={next}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "#252840",
              border: "none",
              color: "#777",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ›
          </button>
          <div
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#f0ece4",
            }}
          >
            {MONTHS[vm]} <span style={{ color: "#2a2d3a" }}>{vy}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setVY(today.getFullYear());
            setVM(today.getMonth());
            setSel(today);
            onSelectDate(today);
          }}
          style={{
            padding: "5px 12px",
            borderRadius: 7,
            background: "#252840",
            border: "1px solid #2a2d3a",
            color: "#777",
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Today
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          borderBottom: "1px solid #30354f",
          flexShrink: 0,
        }}
      >
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            style={{
              padding: "6px 0",
              textAlign: "center",
              fontSize: 9,
              fontWeight: 800,
              color: "#2a2d3a",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gridTemplateRows: "repeat(6,1fr)",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {cells.map((cell, i) => {
          const isToday = sameD(cell.date, today),
            isSel = sameD(cell.date, sel),
            dayTrips = trips.filter((t) =>
              inRange(cell.date, t.dates.start, t.dates.end),
            );
          const hasFlight = trips.some((t) =>
            t.flights.some(
              (f) =>
                sameD(f.from.date, cell.date) || sameD(f.to.date, cell.date),
            ),
          );
          const hasHotel = trips.some((t) =>
            t.hotels.some((h) => sameD(h.checkin, cell.date)),
          );
          return (
            <div
              key={i}
              className="cal-cell"
              onClick={() => {
                setSel(cell.date);
                onSelectDate(cell.date);
              }}
              style={{
                borderRight: "1px solid #141620",
                borderBottom: "1px solid #141620",
                padding: "4px 6px",
                cursor: "pointer",
                transition: "background .1s",
                background: isSel
                  ? "#1e1a12"
                  : isToday
                    ? "#19182880"
                    : "transparent",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: isToday ? 800 : 400,
                  marginBottom: 2,
                  background: isToday ? "#e8a44a" : "transparent",
                  color: isToday ? "#171a28" : cell.cur ? "#aaa" : "#2a2d3a",
                }}
              >
                {cell.d}
              </div>
              {dayTrips.map((t) => {
                const isStart = sameD(cell.date, t.dates.start),
                  isEnd = sameD(cell.date, t.dates.end);
                return (
                  <div
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrip(t);
                    }}
                    style={{
                      height: 4,
                      borderRadius: isStart
                        ? "2px 0 0 2px"
                        : isEnd
                          ? "0 2px 2px 0"
                          : "0",
                      background: t.color,
                      marginBottom: 2,
                      opacity: 0.85,
                      marginLeft: isStart ? 0 : -6,
                      marginRight: isEnd ? 0 : -6,
                      cursor: "pointer",
                    }}
                  />
                );
              })}
              <div style={{ display: "flex", gap: 1 }}>
                {hasFlight && <span style={{ fontSize: 8 }}>✈️</span>}
                {hasHotel && <span style={{ fontSize: 8 }}>🏨</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TRIP DETAIL PANEL ────────────────────────────────────────────────────────
function TripDetail({ trip, onClose, onUpdateTrip, onDeleteTrip, onShareTrip }) {
  const [tab, setTab] = useState("itinerary");
  const [expDays, setExpDays] = useState({});
  const [modal, setModal] = useState(null);

  function updateTrip(patch) {
    onUpdateTrip({ ...trip, ...patch });
  }
  function saveFlight(f) {
    updateTrip({
      flights: trip.flights.some((x) => x.id === f.id)
        ? trip.flights.map((x) => (x.id === f.id ? f : x))
        : [...trip.flights, f],
    });
  }
  function deleteFlight(id) {
    updateTrip({ flights: trip.flights.filter((f) => f.id !== id) });
  }
  function saveHotel(h) {
    updateTrip({
      hotels: trip.hotels.some((x) => x.id === h.id)
        ? trip.hotels.map((x) => (x.id === h.id ? h : x))
        : [...trip.hotels, h],
    });
  }
  function deleteHotel(id) {
    updateTrip({ hotels: trip.hotels.filter((h) => h.id !== id) });
  }
  function saveDay(d) {
    updateTrip({
      itinerary: trip.itinerary.some((x) => x.id === d.id)
        ? trip.itinerary.map((x) => (x.id === d.id ? d : x))
        : [...trip.itinerary, d]
            .sort((a, b) => a.date - b.date)
            .map((x, i) => ({ ...x, day: i + 1 })),
    });
  }
  function deleteDay(id) {
    updateTrip({
      itinerary: trip.itinerary
        .filter((d) => d.id !== id)
        .map((x, i) => ({ ...x, day: i + 1 })),
    });
  }
  function saveActivity(dayId, ev) {
    updateTrip({
      itinerary: trip.itinerary.map((d) =>
        d.id === dayId
          ? {
              ...d,
              events: d.events.some((e) => e.id === ev.id)
                ? d.events.map((e) => (e.id === ev.id ? ev : e))
                : [...d.events, ev],
            }
          : d,
      ),
    });
  }
  function deleteActivity(dayId, evId) {
    updateTrip({
      itinerary: trip.itinerary.map((d) =>
        d.id === dayId
          ? { ...d, events: d.events.filter((e) => e.id !== evId) }
          : d,
      ),
    });
  }

  const budget =
    trip.flights.reduce((s, f) => s + (f.price || 0), 0) +
    trip.hotels.reduce((s, h) => s + (h.price || 0), 0);

  const AddRowBtn = ({ onClick, label }) => (
    <button
      onClick={onClick}
      className="btn-ghost-dark"
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: 9,
        border: "1px dashed #30354f",
        background: "transparent",
        color: "#2a2d3a",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        marginTop: 6,
        transition: "background .15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: "slideIn .25s ease",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #30354f",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: trip.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                flexShrink: 0,
              }}
            >
              {trip.emoji}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f0ece4",
                  lineHeight: 1.2,
                }}
              >
                {trip.name}
              </div>
              <div style={{ fontSize: 9, color: "#6a7080", marginTop: 2 }}>
                {fmtS(trip.dates.start)} – {fmtS(trip.dates.end)} ·{" "}
                {trip.travelers} pax
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button
              onClick={() => onShareTrip(trip.id)}
              title="Copy share link"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "#252840",
                border: "none",
                color: "#777",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              🔗
            </button>
            <button
              onClick={() => setModal({ type: "editTrip" })}
              title="Edit trip settings"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "#252840",
                border: "none",
                color: "#777",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              ✏️
            </button>
            <button
              onClick={onClose}
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "#252840",
                border: "none",
                color: "#7a8090",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              ✕
            </button>
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          {[
            { i: "✈️", l: `${trip.flights.length} flights` },
            { i: "🏨", l: `${trip.hotels.length} hotels` },
            { i: "💰", l: budget > 0 ? `$${budget.toLocaleString()}` : "—" },
          ].map((x) => (
            <div
              key={x.l}
              style={{
                flex: 1,
                background: "#141728",
                borderRadius: 7,
                padding: "5px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12 }}>{x.i}</div>
              <div style={{ fontSize: 9, color: "#7a8090", marginTop: 1 }}>
                {x.l}
              </div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#141728",
            borderRadius: 8,
            padding: 3,
          }}
        >
          {["itinerary", "flights", "hotels"].map((t) => (
            <button
              key={t}
              className="tab-btn"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "5px 0",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: tab === t ? "#252840" : "transparent",
                color: tab === t ? "#f0ece4" : "#8892a4",
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                transition: "background .12s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {/* ── ITINERARY ── */}
        {tab === "itinerary" && (
          <div>
            {trip.itinerary.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "28px 0",
                  opacity: 0.35,
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>📅</div>
                <div style={{ fontSize: 11, color: "#6a7080" }}>No days yet</div>
              </div>
            )}
            {trip.itinerary.map((day) => (
              <div
                key={day.id}
                style={{
                  marginBottom: 7,
                  border: "1px solid #30354f",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  className="hover-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 10px",
                    background: "#1e2235",
                    transition: "background .1s",
                  }}
                >
                  <div
                    onClick={() =>
                      setExpDays((e) => ({ ...e, [day.id]: !e[day.id] }))
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      flex: 1,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        background: trip.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 800,
                        color: trip.textColor,
                        flexShrink: 0,
                      }}
                    >
                      D{day.day}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#c0bdb8",
                        }}
                      >
                        {day.title}
                      </div>
                      <div
                        style={{ fontSize: 9, color: "#7a8499", marginTop: 1 }}
                      >
                        {fmtS(day.date)} · {day.events.length} events
                      </div>
                    </div>
                    <div
                      style={{
                        color: "#2a2d3a",
                        fontSize: 10,
                        transition: "transform .2s",
                        transform: expDays[day.id] ? "rotate(90deg)" : "none",
                      }}
                    >
                      ›
                    </div>
                  </div>
                  <button
                    onClick={() => setModal({ type: "editDay", day })}
                    title="Edit day"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: "#252840",
                      border: "none",
                      color: "#7a8090",
                      cursor: "pointer",
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    ✏️
                  </button>
                </div>
                {expDays[day.id] && (
                  <div
                    style={{
                      borderTop: "1px solid #141620",
                      padding: "6px 8px",
                    }}
                  >
                    {day.events.map((ev) => {
                      const col = TYPE_META[ev.type]?.color || "#888";
                      return (
                        <div
                          key={ev.id}
                          className="hover-row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "5px 7px",
                            borderRadius: 7,
                            transition: "background .1s",
                            marginBottom: 1,
                          }}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              background: `${col}20`,
                              border: `1px solid ${col}30`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              flexShrink: 0,
                            }}
                          >
                            {ev.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#c8c5d4",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {ev.label}
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                color: "#7a8499",
                                marginTop: 1,
                              }}
                            >
                              {ev.time}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setModal({
                                type: "editActivity",
                                dayId: day.id,
                                event: ev,
                              })
                            }
                            className="del-btn"
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 5,
                              background: "transparent",
                              border: "none",
                              color: "#7a8499",
                              cursor: "pointer",
                              fontSize: 9,
                              opacity: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => {
                        setExpDays((e) => ({ ...e, [day.id]: true }));
                        setModal({ type: "addActivity", dayId: day.id });
                      }}
                      className="btn-ghost-dark"
                      style={{
                        width: "100%",
                        padding: "5px",
                        borderRadius: 7,
                        border: "1px dashed #30354f",
                        background: "transparent",
                        color: "#2a2d3a",
                        fontSize: 9,
                        fontWeight: 700,
                        cursor: "pointer",
                        marginTop: 3,
                        transition: "background .15s",
                      }}
                    >
                      + Add Activity
                    </button>
                  </div>
                )}
              </div>
            ))}
            <AddRowBtn
              onClick={() => setModal({ type: "addDay" })}
              label="+ Add Day"
            />
          </div>
        )}

        {/* ── FLIGHTS ── */}
        {tab === "flights" && (
          <div>
            {trip.flights.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "28px 0",
                  opacity: 0.35,
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>✈️</div>
                <div style={{ fontSize: 11, color: "#6a7080" }}>
                  No flights yet
                </div>
              </div>
            )}
            {trip.flights.map((f) => (
              <div
                key={f.id}
                className="hover-card"
                style={{
                  background: "#171a28",
                  border: "1px solid #30354f",
                  borderRadius: 11,
                  marginBottom: 9,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#1e2235",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <span style={{ fontSize: 13 }}>
                      {f.type === "outbound" ? "🛫" : "🛬"}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: f.type === "outbound" ? "#6b7fff" : "#10b981",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {f.type}
                      </div>
                      <div style={{ fontSize: 9, color: "#7a8499" }}>
                        {f.airline} · {f.flightNo}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        background:
                          f.status === "confirmed" ? "#10b98118" : "#f59e0b18",
                        color: f.status === "confirmed" ? "#10b981" : "#f59e0b",
                        padding: "2px 7px",
                        borderRadius: 7,
                        fontWeight: 700,
                      }}
                    >
                      ✓ {f.status}
                    </div>
                    <button
                      onClick={() =>
                        setModal({ type: "editFlight", flight: f })
                      }
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "#252840",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        fontSize: 9,
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    gap: 6,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#f0ece4",
                        lineHeight: 1,
                      }}
                    >
                      {f.from.code}
                    </div>
                    <div style={{ fontSize: 9, color: "#6a7080" }}>
                      {f.from.city}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#e8a44a",
                        marginTop: 2,
                      }}
                    >
                      {f.from.time}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#7a8499",
                        marginBottom: 3,
                      }}
                    >
                      {f.duration}
                    </div>
                    <div
                      style={{
                        height: 1,
                        background:
                          "linear-gradient(to right,#2a2d3a,#e8a44a,#2a2d3a)",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: -5,
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: 9,
                        }}
                      >
                        ✈️
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: "#7a8499",
                        marginTop: 3,
                      }}
                    >
                      {f.class}
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#f0ece4",
                        lineHeight: 1,
                      }}
                    >
                      {f.to.code}
                    </div>
                    <div style={{ fontSize: 9, color: "#6a7080" }}>
                      {f.to.city}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#e8a44a",
                        marginTop: 2,
                      }}
                    >
                      {f.to.time}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "7px 12px",
                    borderTop: "1px solid #30354f",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    [" Seat", f.seat],
                    ["Date", f.from.date ? fmtS(f.from.date) : "—"],
                    ["Fare", f.price ? `$${f.price}` : "—"],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div
                        style={{
                          fontSize: 8,
                          color: "#7a8499",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {l}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#777",
                          marginTop: 1,
                        }}
                      >
                        {v || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <AddRowBtn
              onClick={() => setModal({ type: "addFlight" })}
              label="+ Add Flight"
            />
          </div>
        )}

        {/* ── HOTELS ── */}
        {tab === "hotels" && (
          <div>
            {trip.hotels.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "28px 0",
                  opacity: 0.35,
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>🏨</div>
                <div style={{ fontSize: 11, color: "#6a7080" }}>No hotels yet</div>
              </div>
            )}
            {trip.hotels.map((h) => (
              <div
                key={h.id}
                className="hover-card"
                style={{
                  background: "#171a28",
                  border: "1px solid #30354f",
                  borderRadius: 11,
                  marginBottom: 9,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 12px",
                    background: "#1e2235",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#d0cdc8",
                      }}
                    >
                      {h.name}
                    </div>
                    <div style={{ fontSize: 9, color: "#7a8499" }}>
                      📍 {h.location} · {"★".repeat(h.rating)}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#e8a44a",
                      }}
                    >
                      {h.price ? `$${h.price}` : "—"}
                    </div>
                    <button
                      onClick={() => setModal({ type: "editHotel", hotel: h })}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "#252840",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        fontSize: 9,
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", background: "#141728" }}>
                  {[
                    { l: "In", v: fmtS(h.checkin) },
                    { l: `${h.nights || "?"}n`, v: "🌙" },
                    { l: "Out", v: fmtS(h.checkout) },
                  ].map((x, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        textAlign: "center",
                        borderRight: i < 2 ? "1px solid #30354f" : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 8,
                          color: "#7a8499",
                          textTransform: "uppercase",
                        }}
                      >
                        {x.l}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#666",
                          marginTop: 1,
                        }}
                      >
                        {x.v}
                      </div>
                    </div>
                  ))}
                </div>
                {(h.roomType || h.confirmation) && (
                  <div
                    style={{
                      padding: "0 12px 8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#6a7080" }}>
                      {h.roomType}
                    </div>
                    {h.confirmation && (
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 9,
                          color: "#10b981",
                          background: "#10b98112",
                          padding: "2px 7px",
                          borderRadius: 5,
                        }}
                      >
                        {h.confirmation}
                      </div>
                    )}
                  </div>
                )}
                {h.amenities?.length > 0 && (
                  <div
                    style={{
                      padding: "0 12px 8px",
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    {h.amenities.map((a) => (
                      <span
                        key={a}
                        style={{
                          fontSize: 9,
                          background: "#252840",
                          color: "#6a7080",
                          padding: "2px 7px",
                          borderRadius: 9,
                        }}
                      >
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <AddRowBtn
              onClick={() => setModal({ type: "addHotel" })}
              label="+ Add Hotel"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "editTrip" && (
        <EditTripModal
          trip={trip}
          onClose={() => setModal(null)}
          onSave={(t) => onUpdateTrip(t)}
          onDelete={(id) => {
            onDeleteTrip(id);
            onClose();
          }}
        />
      )}
      {modal?.type === "addFlight" && (
        <FlightModal
          onClose={() => setModal(null)}
          onSave={saveFlight}
          onDelete={deleteFlight}
          defaultDate={trip.dates.start}
        />
      )}
      {modal?.type === "editFlight" && (
        <FlightModal
          flight={modal.flight}
          onClose={() => setModal(null)}
          onSave={saveFlight}
          onDelete={deleteFlight}
        />
      )}
      {modal?.type === "addHotel" && (
        <HotelModal
          onClose={() => setModal(null)}
          onSave={saveHotel}
          onDelete={deleteHotel}
          defaultDate={trip.dates.start}
        />
      )}
      {modal?.type === "editHotel" && (
        <HotelModal
          hotel={modal.hotel}
          onClose={() => setModal(null)}
          onSave={saveHotel}
          onDelete={deleteHotel}
        />
      )}
      {modal?.type === "addDay" && (
        <DayModal
          tripStart={trip.dates.start}
          onClose={() => setModal(null)}
          onSave={saveDay}
          onDelete={deleteDay}
        />
      )}
      {modal?.type === "editDay" && (
        <DayModal
          day={modal.day}
          tripStart={trip.dates.start}
          onClose={() => setModal(null)}
          onSave={saveDay}
          onDelete={deleteDay}
        />
      )}
      {modal?.type === "addActivity" && (
        <ActivityModal
          dayId={modal.dayId}
          onClose={() => setModal(null)}
          onSave={saveActivity}
          onDelete={deleteActivity}
        />
      )}
      {modal?.type === "editActivity" && (
        <ActivityModal
          event={modal.event}
          dayId={modal.dayId}
          onClose={() => setModal(null)}
          onSave={saveActivity}
          onDelete={deleteActivity}
        />
      )}
    </div>
  );
}

// ─── NEW TRIP MODAL ───────────────────────────────────────────────────────────
function NewTripModal({ onClose, onAdd, defaultDate }) {
  const defISO = defaultDate ? toISO(defaultDate) : "";
  const [f, setF] = useState({
    name: "",
    emoji: "🌍",
    startDate: defISO,
    endDate: defISO,
    travelers: 2,
    color: "#e8a44a",
  });
  const s = (k, v) =>
    setF((p) => {
      const next = { ...p, [k]: v };
      if (k === "startDate" && (p.endDate === p.startDate || !p.endDate))
        next.endDate = v;
      return next;
    });
  return (
    <Modal title="✈️ Plan New Trip" onClose={onClose} width={440}>
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
          placeholder="e.g. Bali Honeymoon"
          onChange={(e) => s("name", e.target.value)}
          autoFocus
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
      <div style={ROW}>
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
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 4,
        }}
      >
        <Btn variant="ghost" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          disabled={!f.name || !f.startDate || !f.endDate}
          onClick={() => {
            onAdd({
              id: uid(),
              name: f.name,
              emoji: f.emoji,
              color: f.color,
              textColor: ["#e8a44a", "#f472b6", "#84cc16"].includes(f.color)
                ? "#171a28"
                : "#fff",
              dates: {
                start: new Date(f.startDate + "T00:00"),
                end: new Date(f.endDate + "T00:00"),
              },
              travelers: f.travelers,
              status: "planning",
              flights: [],
              hotels: [],
              itinerary: [],
            });
            onClose();
          }}
        >
          Create Trip ✈️
        </Btn>
      </div>
    </Modal>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function WanderplanCalendar() {
  const today = new Date();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState("");
  const [activeView, setActiveView] = useState("calendar");
  const [selectedTrip, setSel] = useState(null);
  const [selectedDate, setSelDate] = useState(today);
  const [miniYear, setMY] = useState(today.getFullYear());
  const [miniMonth, setMM] = useState(today.getMonth());
  const [showNew, setShowNew] = useState(false);
  const selRef = useRef(null);
  selRef.current = selectedTrip;

  // ── Load trips from Supabase on mount ──────────────────────────────────────
  useEffect(() => {
    async function loadTrips() {
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get("share");
      const ownedIds = getOwnedIds();
      const idsToFetch = [...new Set([...ownedIds, shareId].filter(Boolean))];

      if (idsToFetch.length === 0 || !supabase) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("trips")
        .select("data")
        .in("id", idsToFetch);

      if (error) { console.error("Load error:", error); setLoading(false); return; }

      const loaded = (data || []).map((row) => deserializeTrip(row.data));
      setTrips(loaded);

      if (shareId) {
        const shared = loaded.find((t) => t.id === shareId);
        if (shared) {
          addOwnedId(shareId);
          setSel(shared);
          setSelDate(shared.dates.start);
          setMY(shared.dates.start.getFullYear());
          setMM(shared.dates.start.getMonth());
        }
        // Clean ?share= from URL without reloading
        window.history.replaceState({}, "", window.location.pathname);
      }
      setLoading(false);
    }
    loadTrips();
  }, []);

  // ── Supabase write helpers ──────────────────────────────────────────────────
  async function saveTrip(trip) {
    if (!supabase) return;
    const { error } = await supabase
      .from("trips")
      .upsert({ id: trip.id, data: serializeTrip(trip), updated_at: new Date().toISOString() });
    if (error) console.error("Save error:", error);
  }
  async function removeTripFromDB(id) {
    if (!supabase) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) console.error("Delete error:", error);
  }

  const dateTrips = useMemo(
    () =>
      trips.filter((t) => inRange(selectedDate, t.dates.start, t.dates.end)),
    [trips, selectedDate],
  );
  const upcomingTrips = trips
    .filter((t) => t.dates.end >= today)
    .sort((a, b) => a.dates.start - b.dates.start);
  const pastTrips = trips.filter((t) => t.dates.end < today);

  function updateTrip(updated) {
    setTrips((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    setSel(updated);
    saveTrip(updated);
  }
  function deleteTrip(id) {
    setTrips((ts) => ts.filter((t) => t.id !== id));
    setSel(null);
    removeOwnedId(id);
    removeTripFromDB(id);
  }
  function addTrip(t) {
    setTrips((ts) => [...ts, t]);
    setSel(t);
    setActiveView("calendar");
    setSelDate(t.dates.start);
    setMY(t.dates.start.getFullYear());
    setMM(t.dates.start.getMonth());
    addOwnedId(t.id);
    saveTrip(t);
  }
  function handleShare(tripId) {
    const url = `${window.location.origin}${window.location.pathname}?share=${tripId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg("Link copied!");
      setTimeout(() => setShareMsg(""), 2500);
    });
  }
  function handleDateSelect(date) {
    setSelDate(date);
    setMY(date.getFullYear());
    setMM(date.getMonth());
    const hit = trips.find((t) => inRange(date, t.dates.start, t.dates.end));
    if (hit) setSel(hit);
    else setSel(null);
  }
  function handleSelectTrip(t) {
    setSel(t);
    setSelDate(t.dates.start);
    setMY(t.dates.start.getFullYear());
    setMM(t.dates.start.getMonth());
  }

  return (
    <div
      style={{
        fontFamily: "'Syne',sans-serif",
        background: "#1d2030",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        color: "#d0cdc8",
        overflow: "hidden",
      }}
    >
      <style>{G}</style>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, background: "#171a28",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, flexDirection: "column", gap: 12,
        }}>
          <div style={{ fontSize: 28 }}>🌍</div>
          <div style={{ fontSize: 12, color: "#7a8499", fontWeight: 700 }}>Loading trips…</div>
        </div>
      )}

      {/* Share toast */}
      {shareMsg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#252840", color: "#e8a44a", padding: "8px 18px",
          borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 9999,
          border: "1px solid #e8a44a40", animation: "fadeUp .2s ease",
        }}>
          🔗 {shareMsg}
        </div>
      )}

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 48,
          background: "#141728",
          borderBottom: "1px solid #30354f",
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg,#e8a44a,#c8891f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            🌍
          </div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 17,
              fontWeight: 700,
              color: "#f0ece4",
            }}
          >
            Wanderplan
          </div>
        </div>
        <div
          style={{
            display: "flex",
            background: "#1e2235",
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}
        >
          {[
            { id: "calendar", icon: "📅", label: "Calendar" },
            { id: "trips", icon: "🧳", label: "My Trips" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: activeView === v.id ? "#252840" : "transparent",
                color: activeView === v.id ? "#f0ece4" : "#7a8499",
                fontSize: 11,
                fontWeight: 700,
                transition: "all .15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowNew(true)} style={{ padding: "6px 14px" }}>
          + New Trip
        </Btn>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <aside
          className="app-sidebar"
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: "1px solid #30354f",
            display: "flex",
            flexDirection: "column",
            background: "#141728",
            overflowY: "auto",
          }}
        >
          <div
            style={{ padding: "12px 10px", borderBottom: "1px solid #30354f" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <button
                onClick={() => {
                  if (miniMonth === 0) {
                    setMM(11);
                    setMY(miniYear - 1);
                  } else setMM(miniMonth - 1);
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: "#252840",
                  border: "none",
                  color: "#7a8090",
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                ‹
              </button>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#7a8090" }}>
                {MONTHS[miniMonth].slice(0, 3)} {miniYear}
              </div>
              <button
                onClick={() => {
                  if (miniMonth === 11) {
                    setMM(0);
                    setMY(miniYear + 1);
                  } else setMM(miniMonth + 1);
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: "#252840",
                  border: "none",
                  color: "#7a8090",
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                ›
              </button>
            </div>
            <MiniCal
              year={miniYear}
              month={miniMonth}
              selected={selectedDate}
              onSelect={handleDateSelect}
              trips={trips}
            />
          </div>
          <div style={{ padding: "8px 7px", flex: 1 }}>
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: "#252840",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 5,
                paddingLeft: 5,
              }}
            >
              Upcoming
            </div>
            {upcomingTrips.map((t) => (
              <div
                key={t.id}
                className="nav-item"
                onClick={() => handleSelectTrip(t)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 6px",
                  borderRadius: 7,
                  cursor: "pointer",
                  transition: "background .1s",
                  marginBottom: 1,
                  background:
                    selectedTrip?.id === t.id ? "#252840" : "transparent",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: t.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {t.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: selectedTrip?.id === t.id ? "#f0ece4" : "#888",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ fontSize: 8, color: "#2a2d3a" }}>
                    {fmtS(t.dates.start)}
                  </div>
                </div>
              </div>
            ))}
            {pastTrips.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#252840",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 5,
                    paddingLeft: 5,
                    marginTop: 12,
                  }}
                >
                  Past
                </div>
                {pastTrips.map((t) => (
                  <div
                    key={t.id}
                    className="nav-item"
                    onClick={() => handleSelectTrip(t)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 6px",
                      borderRadius: 7,
                      cursor: "pointer",
                      opacity: 0.4,
                      transition: "background .1s",
                      marginBottom: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        background: t.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {t.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#888",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.name}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Calendar View */}
        {activeView === "calendar" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <CalendarView
                trips={trips}
                onSelectDate={handleDateSelect}
                onSelectTrip={handleSelectTrip}
              />
            </div>
            <div
              className="trip-detail-panel"
              style={{
                width: 300,
                flexShrink: 0,
                borderLeft: "1px solid #30354f",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "#141728",
              }}
            >
              {selectedTrip ? (
                <TripDetail
                  trip={selectedTrip}
                  onClose={() => setSel(null)}
                  onUpdateTrip={updateTrip}
                  onDeleteTrip={deleteTrip}
                  onShareTrip={handleShare}
                />
              ) : (
                <div
                  style={{
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      padding: "11px 13px",
                      background: "#1e2235",
                      borderRadius: 10,
                      border: "1px solid #30354f",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        color: "#7a8499",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 2,
                      }}
                    >
                      Selected Date
                    </div>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#f0ece4",
                      }}
                    >
                      {selectedDate.getDate()}
                    </div>
                    <div style={{ fontSize: 10, color: "#6a7080" }}>
                      {MONTHS[selectedDate.getMonth()]}{" "}
                      {selectedDate.getFullYear()}
                    </div>
                  </div>
                  {dateTrips.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 8,
                          color: "#7a8499",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 6,
                        }}
                      >
                        Trips on this day
                      </div>
                      {dateTrips.map((t) => (
                        <div
                          key={t.id}
                          className="hover-card"
                          onClick={() => setSel(t)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 10px",
                            background: "#1e2235",
                            border: "1px solid #30354f",
                            borderRadius: 9,
                            cursor: "pointer",
                            marginBottom: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: t.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                            }}
                          >
                            {t.emoji}
                          </div>
                          <div>
                            <div
                              style={{
                                fontFamily: "'Cormorant Garamond',serif",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#d0cdc8",
                              }}
                            >
                              {t.name}
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                color: "#6a7080",
                                marginTop: 1,
                              }}
                            >
                              {fmtS(t.dates.start)} – {fmtS(t.dates.end)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {dateTrips.length === 0 && (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        opacity: 0.3,
                      }}
                    >
                      <div style={{ fontSize: 30 }}>🗺</div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#6a7080",
                          textAlign: "center",
                        }}
                      >
                        No trips on this date
                      </div>
                    </div>
                  )}
                  <Btn
                    onClick={() => setShowNew(true)}
                    style={{
                      marginTop: "auto",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    ✈️ Plan a New Trip
                  </Btn>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Trips View */}
        {activeView === "trips" && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 22px",
              animation: "fadeUp .3s ease",
            }}
          >
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#f0ece4",
                  marginBottom: 3,
                }}
              >
                My Trips
              </div>
              <div style={{ fontSize: 11, color: "#7a8499", marginBottom: 18 }}>
                {trips.length} trip{trips.length !== 1 ? "s" : ""} planned
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                  gap: 12,
                }}
              >
                {trips.map((t) => {
                  const budget =
                    t.flights.reduce((s, f) => s + (f.price || 0), 0) +
                    t.hotels.reduce((s, h) => s + (h.price || 0), 0);
                  const days = Math.max(
                    1,
                    Math.round((t.dates.end - t.dates.start) / 86400000),
                  );
                  const isPast = t.dates.end < today;
                  return (
                    <div
                      key={t.id}
                      className="hover-card"
                      onClick={() => {
                        setSel(t);
                        setActiveView("calendar");
                        setSelDate(t.dates.start);
                        setMY(t.dates.start.getFullYear());
                        setMM(t.dates.start.getMonth());
                      }}
                      style={{
                        background: "#1e2235",
                        border: "1px solid #30354f",
                        borderRadius: 13,
                        overflow: "hidden",
                        cursor: "pointer",
                        opacity: isPast ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          height: 3,
                          background: `linear-gradient(to right,${t.color},${t.color}60)`,
                        }}
                      />
                      <div style={{ padding: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                            marginBottom: 11,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: t.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                              flexShrink: 0,
                            }}
                          >
                            {t.emoji}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontFamily: "'Cormorant Garamond',serif",
                                fontSize: 17,
                                fontWeight: 700,
                                color: "#f0ece4",
                              }}
                            >
                              {t.name}
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                color: "#7a8499",
                                marginTop: 2,
                              }}
                            >
                              {fmt(t.dates.start)} → {fmt(t.dates.end)}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 8,
                              background: isPast
                                ? "#2a2d3a"
                                : t.status === "upcoming"
                                  ? "#10b98118"
                                  : "#e8a44a18",
                              color: isPast
                                ? "#7a8090"
                                : t.status === "upcoming"
                                  ? "#10b981"
                                  : "#e8a44a",
                              padding: "2px 7px",
                              borderRadius: 7,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {isPast ? "past" : t.status}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4,1fr)",
                            gap: 5,
                          }}
                        >
                          {[
                            { icon: "🌙", l: "Nights", v: days },
                            { icon: "👥", l: "Pax", v: t.travelers },
                            { icon: "✈️", l: "Flights", v: t.flights.length },
                            { icon: "🏨", l: "Hotels", v: t.hotels.length },
                          ].map((x) => (
                            <div
                              key={x.l}
                              style={{
                                background: "#171a28",
                                borderRadius: 6,
                                padding: "6px 7px",
                                textAlign: "center",
                              }}
                            >
                              <div style={{ fontSize: 12 }}>{x.icon}</div>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: "#e8a44a",
                                  marginTop: 1,
                                }}
                              >
                                {x.v}
                              </div>
                              <div
                                style={{
                                  fontSize: 8,
                                  color: "#2a2d3a",
                                  marginTop: 1,
                                }}
                              >
                                {x.l}
                              </div>
                            </div>
                          ))}
                        </div>
                        {budget > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 10,
                              color: "#7a8499",
                              textAlign: "right",
                            }}
                          >
                            💰{" "}
                            <span style={{ color: "#e8a44a", fontWeight: 700 }}>
                              ${budget.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div
                  className="hover-card"
                  onClick={() => setShowNew(true)}
                  style={{
                    background: "transparent",
                    border: "1px dashed #30354f",
                    borderRadius: 13,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 32,
                    cursor: "pointer",
                    minHeight: 150,
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: "#252840",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    ✈️
                  </div>
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: "#2a2d3a" }}
                  >
                    Plan New Trip
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <NewTripModal onClose={() => setShowNew(false)} onAdd={addTrip} defaultDate={selectedDate} />
      )}
    </div>
  );
}
