import { useEffect, useMemo, useState } from "react";
import MenuCard from "../components/MenuCard";
import { API_BASE_URL } from "../aws-config";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/menu`);
        if (!res.ok) throw new Error("Failed to load menu");
        const data = await res.json();
        setItems(data.items);
      } catch (err) {
        setError("Couldn't reach the menu service. Showing nothing to order right now.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = useMemo(() => ["All", ...new Set(items.map((i) => i.category))], [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (category !== "All" && i.category !== category) return false;
      if (vegOnly && !i.veg) return false;
      if (query && !`${i.name} ${i.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [items, category, vegOnly, query]);

  return (
    <section className="section container">
      <div className="section-head">
        <div>
          <span className="eyebrow">All-day menu</span>
          <h2>Order ahead</h2>
        </div>
      </div>

      <div className="search-box">
        <span>🔍</span>
        <input
          placeholder="Search the menu…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="filters">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? "active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
        <button className={`chip ${vegOnly ? "active" : ""}`} onClick={() => setVegOnly((v) => !v)}>
          🌱 Veg only
        </button>
      </div>

      {loading && <p className="empty-state">Loading menu…</p>}
      {error && <p className="empty-state">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="empty-state">Nothing matches those filters. Try clearing a few.</p>
      )}

      {!loading && !error && (
        <div className="menu-grid">
          {filtered.map((item) => (
            <MenuCard item={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  );
}
