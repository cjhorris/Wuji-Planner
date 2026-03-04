import { useState, useEffect } from "react";
import { MONTHS, DAYS_SHORT, TYPE_META } from "../constants";
import { sameD, inRange } from "../utils/helpers";

export default function CalendarView({ trips, onSelectDate, onSelectTrip, viewYear, viewMonth, onNavChange }) {
  const today = new Date();
  const [vy, setVY] = useState(viewYear ?? today.getFullYear());
  const [vm, setVM] = useState(viewMonth ?? today.getMonth());
  const [sel, setSel] = useState(today);

  useEffect(() => {
    if (viewYear != null) setVY(viewYear);
    if (viewMonth != null) setVM(viewMonth);
  }, [viewYear, viewMonth]);

  const first = new Date(vy, vm, 1).getDay(),
    dim = new Date(vy, vm + 1, 0).getDate(),
    dimPrev = new Date(vy, vm, 0).getDate(),
    cells = [];
  for (let i = first - 1; i >= 0; i--)
    cells.push({ d: dimPrev - i, cur: false, date: new Date(vy, vm - 1, dimPrev - i) });
  for (let d = 1; d <= dim; d++)
    cells.push({ d, cur: true, date: new Date(vy, vm, d) });
  while (cells.length < 42) {
    const n = cells.length - first - dim + 1;
    cells.push({ d: n, cur: false, date: new Date(vy, vm + 1, n) });
  }

  function prev() {
    const ny = vm === 0 ? vy - 1 : vy;
    const nm = vm === 0 ? 11 : vm - 1;
    setVY(ny); setVM(nm);
    onNavChange?.(ny, nm);
  }
  function next() {
    const ny = vm === 11 ? vy + 1 : vy;
    const nm = vm === 11 ? 0 : vm + 1;
    setVY(ny); setVM(nm);
    onNavChange?.(ny, nm);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
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
            style={{ width: 28, height: 28, borderRadius: 7, background: "#252840", border: "none", color: "#777", cursor: "pointer", fontSize: 13 }}
          >‹</button>
          <button
            onClick={next}
            style={{ width: 28, height: 28, borderRadius: 7, background: "#252840", border: "none", color: "#777", cursor: "pointer", fontSize: 13 }}
          >›</button>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: "#f0ece4" }}>
            {MONTHS[vm]} <span style={{ color: "#2a2d3a" }}>{vy}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setVY(today.getFullYear()); setVM(today.getMonth());
            setSel(today); onSelectDate(today);
            onNavChange?.(today.getFullYear(), today.getMonth());
          }}
          style={{ padding: "5px 12px", borderRadius: 7, background: "#252840", border: "1px solid #2a2d3a", color: "#777", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
        >
          Today
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #30354f", flexShrink: 0 }}>
        {DAYS_SHORT.map((d) => (
          <div key={d} className="cal-day-lbl" style={{ padding: "7px 0", textAlign: "center", fontWeight: 800, color: "#4a5060", letterSpacing: 1, textTransform: "uppercase" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridTemplateRows: "repeat(6,1fr)", flex: 1, overflow: "hidden" }}
      >
        {cells.map((cell, i) => {
          const isToday = sameD(cell.date, today);
          const isSel = sameD(cell.date, sel);
          const dayTrips = trips.filter((t) => inRange(cell.date, t.dates.start, t.dates.end));

          // Collect all events for this day across all trips
          const dayEvents = trips.flatMap((t) => {
            const evts = [];
            t.flights.forEach((f) => {
              if (sameD(f.from.date, cell.date))
                evts.push({ icon: "🛫", label: `${f.from.code}→${f.to.code}`, color: "#3b82f6", trip: t });
              else if (sameD(f.to.date, cell.date))
                evts.push({ icon: "🛬", label: `${f.from.code}→${f.to.code}`, color: "#10b981", trip: t });
            });
            t.hotels.forEach((h) => {
              if (sameD(h.checkin, cell.date))
                evts.push({ icon: "🏨", label: h.name, color: "#f59e0b", trip: t });
            });
            t.itinerary
              .filter((d) => sameD(d.date, cell.date))
              .forEach((d) =>
                (d.events || []).forEach((ev) =>
                  evts.push({
                    icon: ev.icon,
                    label: ev.label,
                    color: TYPE_META[ev.type]?.color || "#8b5cf6",
                    trip: t,
                  })
                )
              );
            return evts;
          });

          const MAX = 3;
          const visible = dayEvents.slice(0, MAX);
          const overflow = dayEvents.length - MAX;

          return (
            <div
              key={i}
              className="cal-cell"
              onClick={() => { setSel(cell.date); onSelectDate(cell.date); }}
              style={{
                borderRight: "1px solid #141620",
                borderBottom: "1px solid #141620",
                padding: "4px 5px",
                cursor: "pointer",
                transition: "background .1s",
                background: isSel ? "#1e1a12" : isToday ? "#19182880" : "transparent",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Day number */}
              <div
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: isToday ? 800 : 500, marginBottom: 3, flexShrink: 0,
                  background: isToday ? "#e8a44a" : "transparent",
                  color: isToday ? "#171a28" : cell.cur ? "#c0bdb8" : "#2a2d3a",
                }}
              >
                {cell.d}
              </div>

              {/* Trip duration bars */}
              {dayTrips.map((t) => {
                const isStart = sameD(cell.date, t.dates.start);
                const isEnd = sameD(cell.date, t.dates.end);
                return (
                  <div
                    key={t.id}
                    onClick={(e) => { e.stopPropagation(); onSelectTrip(t); }}
                    style={{
                      height: 4,
                      borderRadius: isStart ? "3px 0 0 3px" : isEnd ? "0 3px 3px 0" : "0",
                      background: t.color,
                      marginBottom: 3,
                      opacity: 0.9,
                      marginLeft: isStart ? 0 : -5,
                      marginRight: isEnd ? 0 : -5,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                );
              })}

              {/* Event chips */}
              {visible.map((ev, idx) => (
                <div
                  key={idx}
                  className="cal-event"
                  onClick={(e) => { e.stopPropagation(); onSelectTrip(ev.trip); }}
                  title={ev.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    background: `${ev.color}25`,
                    color: ev.color,
                    borderRadius: 4,
                    padding: "2px 5px",
                    marginBottom: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    flexShrink: 0,
                    minWidth: 0,
                  }}
                >
                  <span style={{ flexShrink: 0, fontSize: 12 }}>{ev.icon}</span>
                  <span className="cal-event-label" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                    {ev.label}
                  </span>
                </div>
              ))}

              {overflow > 0 && (
                <div style={{ fontSize: 10, color: "#7a8090", paddingLeft: 3, flexShrink: 0 }}>
                  +{overflow} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
