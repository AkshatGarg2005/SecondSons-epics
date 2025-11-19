import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const CustomerCommerce = () => {
  const { user, profile, loading } = useAuth();
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // All shops (users with role SHOP)
    const qShops = query(
      collection(db, 'users'),
      where('role', '==', 'SHOP')
    );
    const unsubShops = onSnapshot(qShops, (snapshot) => {
      setShops(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // All available products (we filter by shopId in UI)
    const qProducts = query(
      collection(db, 'products'),
      where('isAvailable', '==', true)
    );
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubShops();
      unsubProducts();
    };
  }, []);

  if (loading || !profile) {
    return <div>Loading...</div>;
  }

  const savedAddress = profile.address || '';

  const shopProducts = selectedShop
    ? products.filter((p) => p.shopId === selectedShop.id)
    : [];

  const selectShop = (shop) => {
    setSelectedShop(shop);
    setMessage('');
    setError('');
  };

  const addToCart = async (product) => {
    setMessage('');
    setError('');

    if (!savedAddress) {
      setError(
        'Please set your address in My Profile before adding items to cart.'
      );
      return;
    }

    try {
      // We keep one cart item doc per (userId, productId)
      const q = query(
        collection(db, 'cartItems'),
        where('userId', '==', user.uid),
        where('productId', '==', product.id)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        // New item with quantity 1
        await addDoc(collection(db, 'cartItems'), {
          userId: user.uid,
          shopId: product.shopId,
          productId: product.id,
          quantity: 1,
          createdAt: serverTimestamp(),
        });
      } else {
        // Increment existing quantity
        const docRef = snap.docs[0].ref;
        const existingData = snap.docs[0].data();
        const currentQty = existingData.quantity || 1;
        await updateDoc(docRef, {
          quantity: currentQty + 1,
        });
      }

      setMessage('Added to cart. You can review and place order from the Cart page.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add to cart');
    }
  };

  return (
    <div>
      <h1>Quick Commerce (Customer)</h1>
      <p>
        Your order history is in the <strong>"My Orders"</strong> page.  
        Adding items here will store them in your <strong>Cart</strong>.
      </p>

      <p>
        <strong>Using your saved address:</strong>{' '}
        {savedAddress
          ? savedAddress
          : 'No address set. Go to "My Profile" and set your address.'}
      </p>

      {message && (
        <p style={{ color: 'green', marginTop: '8px' }}>{message}</p>
      )}
      {error && (
        <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>
      )}

      {/* Shops list */}
      <h2>Shops</h2>
      <ul>
        {shops.map((s) => (
          <li key={s.id} style={{ marginBottom: '6px' }}>
            <div>
              <strong>{s.name}</strong>
            </div>
            {s.address && <div>Address: {s.address}</div>}
            {s.phone && <div>Phone: {s.phone}</div>}
            <button
              onClick={() => selectShop(s)}
              style={{ marginTop: '4px' }}
            >
              View products
            </button>
          </li>
        ))}
        {shops.length === 0 && <p>No shops found.</p>}
      </ul>

      {/* Products of selected shop */}
      {selectedShop && (
        <div style={{ marginTop: '16px' }}>
          <h2>Products from {selectedShop.name}</h2>
          <ul>
            {shopProducts.map((p) => (
              <li key={p.id} style={{ marginBottom: '6px' }}>
                <div>
                  <strong>{p.name}</strong> ({p.category}) | ₹{p.price}
                </div>
                {p.stock != null && <div>Stock: {p.stock}</div>}
                <button
                  onClick={() => addToCart(p)}
                  style={{ marginTop: '4px' }}
                  disabled={!savedAddress}
                >
                  Add to cart
                </button>
              </li>
            ))}
            {shopProducts.length === 0 && (
              <p>No products for this shop.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerCommerce;
