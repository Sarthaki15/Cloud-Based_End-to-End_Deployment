import { useCart } from "../context/CartContext";

export default function MenuCard({ item }) {
  const { addItem } = useCart();

  return (
    <div className="menu-card">
      <div className="menu-card-top">
        <h3>{item.name}</h3>
        <span className="price">₹{item.price}</span>
      </div>
      <div className="badges">
        {item.popular && <span className="badge popular">Popular</span>}
        {item.veg && <span className="badge veg">Veg</span>}
        {item.spicy && <span className="badge spicy">Spicy</span>}
      </div>
      <p className="desc">{item.description}</p>
      <div className="menu-card-foot">
        <button className="add-btn" onClick={() => addItem(item)}>
          + Add to order
        </button>
      </div>
    </div>
  );
}
