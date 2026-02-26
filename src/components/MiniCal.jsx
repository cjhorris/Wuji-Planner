import { DAYS_SHORT } from "../constants";
import { sameD, inRange } from "../utils/helpers";

export default function MiniCal({ year, month, onSelect, selected, trips }) {
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
