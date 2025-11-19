import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const CustomerCommerce = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const qProducts = query(
      collection(db, 'products'),
      where('isAvailable', '==', true)
    );
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubProducts();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qOrders = query(
      collection(db, 'commerceOrders'),
      where('customerId', '==', user.uid)
    );
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubOrders();
  }, [user]);

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !address || !quantity) return;

    await addDoc(collection(db, 'commerceOrders'), {
      customerId: user.uid,
      shopId: selectedProduct.shopId,
      productId: selectedProduct.id,
      quantity: parseInt(quantity, 10),
      status: 'pending', // pending, accepted, rejected, ready_for_delivery, out_for_delivery, delivered
      deliveryPartnerId: null,
      address,
      createdAt: serverTimestamp(),
    });

    setQuantity(1);
    setAddress('');
  };

  return (
    <div>
      <h1>Quick Commerce (Customer)</h1>

      <h2>Available products</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id} style={{ marginBottom: '6px' }}>
            {p.name} ({p.category}) | ₹{p.price}{' '}
            {p.stock != null && <span>| Stock: {p.stock}</span>}
            <button
              onClick={() => setSelectedProduct(p)}
              style={{ marginLeft: '8px' }}
            >
              Select
            </button>
          </li>
        ))}
      </ul>

      {selectedProduct && (
        <div style={{ marginTop: '16px' }}>
          <h2>Order: {selectedProduct.name}</h2>
          <form
            onSubmit={placeOrder}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxWidth: '400px',
            }}
          >
            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </label>

            <label>
              Delivery address
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </label>

            <button type="submit">Place order</button>
          </form>
        </div>
      )}

      <h2>Your commerce orders</h2>
      <ul>
        {orders.map((o) => (
          <li key={o.id} style={{ marginBottom: '6px' }}>
            Product: {o.productId} | Qty: {o.quantity} | Status: {o.status}{' '}
            {o.deliveryPartnerId && (
              <span>| Delivery partner: {o.deliveryPartnerId}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomerCommerce;
