import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    const qAvailable = query(
      collection(db, 'commerceOrders'),
      where('status', '==', 'ready_for_delivery'),
      where('deliveryPartnerId', '==', null)
    );
    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      setAvailableOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qMine = query(
      collection(db, 'commerceOrders'),
      where('deliveryPartnerId', '==', user.uid)
    );
    const unsubMine = onSnapshot(qMine, (snapshot) => {
      setMyOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAvailable();
      unsubMine();
    };
  }, [user]);

  const acceptDelivery = async (order) => {
    await updateDoc(doc(db, 'commerceOrders', order.id), {
      deliveryPartnerId: user.uid,
      status: 'out_for_delivery',
    });
  };

  const markDelivered = async (order) => {
    if (order.status !== 'out_for_delivery') return;
    await updateDoc(doc(db, 'commerceOrders', order.id), {
      status: 'delivered',
    });
  };

  return (
    <div>
      <h1>Delivery Dashboard</h1>

      <h2>Available deliveries</h2>
      <ul>
        {availableOrders.map((o) => (
          <li
            key={o.id}
            style={{
              marginBottom: '8px',
              padding: '6px',
              border: '1px solid #ccc',
            }}
          >
            <div>Order: {o.id}</div>
            <div>Shop: {o.shopId}</div>
            <div>Address: {o.address}</div>
            <button onClick={() => acceptDelivery(o)}>Accept delivery</button>
          </li>
        ))}
      </ul>

      <h2>Your deliveries</h2>
      <ul>
        {myOrders.map((o) => (
          <li
            key={o.id}
            style={{
              marginBottom: '8px',
              padding: '6px',
              border: '1px solid #ccc',
            }}
          >
            <div>Order: {o.id}</div>
            <div>Status: {o.status}</div>
            <div>Address: {o.address}</div>
            {o.status === 'out_for_delivery' && (
              <button onClick={() => markDelivered(o)}>
                Mark delivered
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeliveryDashboard;
