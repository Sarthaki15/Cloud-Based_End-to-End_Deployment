import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="eyebrow">Small-batch roastery · Pune</span>
            <h1>
              Coffee brewed slow,<br /><em>served on time.</em>
            </h1>
            <p className="lead">
              Single-origin beans roasted twice weekly, pastries baked each morning,
              and a menu built around what's actually in season. Order ahead and skip the queue.
            </p>
            <div className="hero-actions">
              <Link to="/menu" className="btn btn-primary">View the menu</Link>
              <Link to="/signup" className="btn btn-ghost">Create an account</Link>
            </div>
          </div>

          <div className="steam-scene">
            <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="steam-wisp" d="M110 90 C 100 70, 120 60, 110 40" stroke="#C89B4A" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
              <path className="steam-wisp" d="M140 90 C 130 65, 150 55, 140 30" stroke="#E0B667" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
              <path className="steam-wisp" d="M170 90 C 160 70, 180 60, 170 40" stroke="#C89B4A" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
              <ellipse cx="140" cy="190" rx="80" ry="14" fill="#2D2019" />
              <path d="M75 110 H205 L192 195 A15 15 0 0 1 177 208 H103 A15 15 0 0 1 88 195 Z" fill="#C89B4A" opacity="0.15" stroke="#C89B4A" strokeWidth="2"/>
              <path d="M205 130 C 235 130, 235 175, 205 172" stroke="#C89B4A" strokeWidth="6" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Today, on rotation</span>
            <h2>What's brewing</h2>
          </div>
          <Link to="/menu" className="btn btn-ghost">Full menu →</Link>
        </div>
        <div className="menu-grid">
          {[
            { name: "Espresso", desc: "Double shot, dense crema.", price: 130 },
            { name: "Masala Chai", desc: "Slow-simmered, hand-pounded spice.", price: 110 },
            { name: "Basque Burnt Cheesecake", desc: "Caramelized top, molten center.", price: 260 },
          ].map((item) => (
            <div className="menu-card" key={item.name}>
              <div className="menu-card-top">
                <h3>{item.name}</h3>
                <span className="price">₹{item.price}</span>
              </div>
              <p className="desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
