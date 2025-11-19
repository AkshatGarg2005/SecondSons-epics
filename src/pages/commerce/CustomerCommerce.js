import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
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
  const [shopProfiles, setShopProfiles] = useState({});
  const [deliveryProfiles, setDeliveryProfiles] = useState({});

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

  useEffect(() => {
    const loadShops = async () => {
      const shopIds = new Set([
        ...products.map((p) => p.shopId),
        ...orders.map((o) => o.shopId),
      ].filter(Boolean));
      const profiles = {};
      for (const id of shopIds) {
        try {
          const snap = await getDoc(doc(db, 'users', id));
          if (snap.exists()) {
            profiles[id] = snap.data();
          }
        } catch (err) {
          console.error('Failed to fetch shop profile', err);
        }
      }
      setShopProfiles(profiles);
    };

    if (products.length > 0 || orders.length > 0) {
      loadShops();
    } else {
      setShopProfiles({});
    }
  }, [products, orders]);

  useEffect(() => {
    const loadDeliveryPartners = async () => {
      const ids = Array.from(
        new Set(
          orders
            .map((o) => o.deliveryPartnerId)
            .filter(Boolean)
        )
      );
      const profiles = {};
      for (const id of ids) {
        try {
          const snap = await getDoc(doc(db, 'users', id));
          if (snap.exists()) {
            profiles[id] = snap.data();
          }
        } catch (err) {
          console.error('Failed to fetch delivery profile', err);
        }
      }
      setDeliveryProfiles(profiles);
    };

    if (orders.length > 0) {
      loadDeliveryPartners();
    } else {
      setDeliveryProfiles({});
    }
  }, [orders]);

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
      <p>
        Each product may be listed from multiple shops with different prices.
        Choose the shop you want.
      </p>
      <ul>
        {products.map((p) => {
          const shop = shopProfiles[p.shopId];
          return (
            <li key={p.id} style={{ marginBottom: '6px' }}>
              <div>
                <strong>{p.name}</strong> ({p.category}) | ₹{p.price}
              </div>
              <div>
                Shop:{' '}
                {shop ? shop.name : p.shopId}
                {shop?.phone && ` (Phone: ${shop.phone})`}
              </div>
              {p.stock != null && <div>Stock: {p.stock}</div>}
              <button
                onClick={() => setSelectedProduct(p)}
                style={{ marginTop: '4px' }}
              >
                Select this shop
              </button>
            </li>
          );
        })}
        {products.length === 0 && <p>No products available.</p>}
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
        {orders.map((o) => {
          const product = products.find((p) => p.id === o.productId);
          const shop = shopProfiles[o.shopId];
          const delivery =
            o.deliveryPartnerId &&
            o.status !== 'delivered'
              ? deliveryProfiles[o.deliveryPartnerId]
              : null;

          return (
            <li
              key={o.id}
              style={{ marginBottom: '6px', padding: '6px', border: '1px solid #ccc' }}
            >
              <div>
                Product:{' '}
                {product ? product.name : o.productId} | Qty:{' '}
                {o.quantity}
              </div>
              <div>
                Shop:{' '}
                {shop ? shop.name : o.shopId}
                {shop?.phone && ` (Phone: ${shop.phone})`}
              </div>
              <div>Status: {o.status}</div>
              <div>Address: {o.address}</div>
              {delivery && (
                <div>
                  Delivery partner: {delivery.name}
                  {delivery.phone && ` (Phone: ${delivery.phone})`}
                </div>
              )}
            </li>
          );
        })}
        {orders.length === 0 && <p>No orders yet.</p>}
      </ul>
    </div>
  );
};

export default CustomerCommerce;
