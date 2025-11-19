import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const CustomerOrders = () => {
  const { user } = useAuth();
  const [commerceOrders, setCommerceOrders] = useState([]);
  const [cabRequests, setCabRequests] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [housingBookings, setHousingBookings] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Quick commerce
    const qCommerce = query(
      collection(db, 'commerceOrders'),
      where('customerId', '==', user.uid)
    );
    const unsubCommerce = onSnapshot(qCommerce, (snapshot) => {
      setCommerceOrders(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });

    // Cab
    const qCab = query(
      collection(db, 'cabRequests'),
      where('customerId', '==', user.uid)
    );
    const unsubCab = onSnapshot(qCab, (snapshot) => {
      setCabRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Services
    const qService = query(
      collection(db, 'serviceRequests'),
      where('customerId', '==', user.uid)
    );
    const unsubService = onSnapshot(qService, (snapshot) => {
      setServiceRequests(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });

    // Housing
    const qHousing = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid)
    );
    const unsubHousing = onSnapshot(qHousing, (snapshot) => {
      setHousingBookings(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });

    return () => {
      unsubCommerce();
      unsubCab();
      unsubService();
      unsubHousing();
    };
  }, [user]);

  return (
    <div>
      <h1>My Orders</h1>

      <section>
        <h2>Quick commerce orders</h2>
        <ul>
          {commerceOrders.map((o) => (
            <li key={o.id}>
              {o.productId} | Qty: {o.quantity} | Status: {o.status}
            </li>
          ))}
          {commerceOrders.length === 0 && <p>No commerce orders.</p>}
        </ul>
      </section>

      <section>
        <h2>Cab bookings</h2>
        <ul>
          {cabRequests.map((c) => (
            <li key={c.id}>
              {c.pickupLocation} → {c.dropLocation} | Status:{' '}
              {c.status}
            </li>
          ))}
          {cabRequests.length === 0 && <p>No cab bookings.</p>}
        </ul>
      </section>

      <section>
        <h2>Service requests</h2>
        <ul>
          {serviceRequests.map((s) => (
            <li key={s.id}>
              [{s.category}] {s.description} | Status: {s.status}
            </li>
          ))}
          {serviceRequests.length === 0 && (
            <p>No service requests.</p>
          )}
        </ul>
      </section>

      <section>
        <h2>Housing bookings</h2>
        <ul>
          {housingBookings.map((b) => (
            <li key={b.id}>
              {b.propertyId} | {b.stayType} | {b.startDate}
              {b.endDate &&
                b.endDate !== b.startDate &&
                ` → ${b.endDate}`}{' '}
              | Status: {b.status}
            </li>
          ))}
          {housingBookings.length === 0 && (
            <p>No housing bookings.</p>
          )}
        </ul>
      </section>
    </div>
  );
};

export default CustomerOrders;
