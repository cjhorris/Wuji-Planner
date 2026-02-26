import { useState } from "react";
import { MONTHS, DAYS_SHORT } from "../constants";
import { sameD, inRange } from "../utils/helpers";

export default function CalendarView({ trips, onSelectDate, onSelectTrip }) {
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
          const hasActivity = trips.some((t) =>
            t.itinerary.some((d) => sameD(d.date, cell.date) && d.events.length > 0),
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
                {hasActivity && <span style={{ fontSize: 8 }}>🎯</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
