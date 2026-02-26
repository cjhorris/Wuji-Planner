import { useState, useMemo, useEffect, useRef } from "react";
import Btn from "./components/Btn";
import CalendarView from "./components/CalendarView";
import MiniCal from "./components/MiniCal";
import TripDetail from "./components/TripDetail";
import NewTripModal from "./components/NewTripModal";
import { supabase } from "./supabase";
import { MONTHS } from "./constants";
import { fmt, fmtS, inRange, serializeTrip, deserializeTrip, getOwnedIds, addOwnedId, removeOwnedId } from "./utils/helpers";

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#1d2030;overflow:hidden;color:#e8e6f0;font-size:16px;line-height:1.6;}
::-webkit-scrollbar{width:8px;height:8px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#30354f;border-radius:8px;}
input,select,textarea{font-family:'Syne',sans-serif;color-scheme:dark;background:#272b40;color:#e8e6f0;border:1px solid #30354f;font-size:16px;}
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
  .trip-detail-panel{display:none!important;}
  .trip-detail-panel.has-trip{display:flex!important;flex-direction:column!important;position:fixed!important;inset:0!important;width:100%!important;z-index:200!important;background:#1d2030!important;}
  .trip-detail-panel .tab-btn{font-size:13px!important;padding:9px 6px!important;min-height:40px!important;}
}
`;

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
              className={`trip-detail-panel${selectedTrip ? " has-trip" : ""}`}
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
