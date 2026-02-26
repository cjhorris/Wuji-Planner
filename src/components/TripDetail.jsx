import { useState } from "react";
import Btn from "./Btn";
import EditTripModal from "./EditTripModal";
import FlightModal from "./FlightModal";
import HotelModal from "./HotelModal";
import DayModal from "./DayModal";
import ActivityModal from "./ActivityModal";
import { TYPE_META } from "../constants";
import { fmtS } from "../utils/helpers";

export default function TripDetail({ trip, onClose, onUpdateTrip, onDeleteTrip, onShareTrip }) {
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
