export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <strong style={{ color: "var(--cream)" }}>The Roasted Leaf</strong>
          <p>14 Camphor Lane, Pune · Open 7:30am – 9pm daily</p>
        </div>
        <div>
          <p>hello@roastedleaf.example</p>
          <p>+91 98xxxxxx21</p>
        </div>
        <div>
          <p>© {new Date().getFullYear()} The Roasted Leaf. Brewed on AWS.</p>
        </div>
      </div>
    </footer>
  );
}
