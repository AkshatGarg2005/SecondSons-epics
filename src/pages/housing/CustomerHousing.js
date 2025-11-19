import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const CustomerHousing = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [stayType, setStayType] = useState('DAY'); // DAY, LONG_TERM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'properties'),
      where('isActive', '==', true)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setProperties(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const bookProperty = async (e) => {
    e.preventDefault();
    if (!selectedProperty || !startDate) return;

    await addDoc(collection(db, 'bookings'), {
      propertyId: selectedProperty.id,
      hostId: selectedProperty.hostId,
      customerId: user.uid,
      stayType,
      startDate,
      endDate: stayType === 'DAY' ? endDate || startDate : endDate || null,
      status: 'pending', // pending, confirmed, cancelled
      createdAt: serverTimestamp(),
    });

    setStartDate('');
    setEndDate('');
  };

  const cancelBooking = async (booking) => {
    if (booking.status !== 'pending') return;
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'cancelled',
    });
  };

  return (
    <div>
      <h1>Housing (Customer)</h1>

      <h2>Available properties</h2>
      <ul>
        {properties.map((p) => (
          <li
            key={p.id}
            style={{
              marginBottom: '8px',
              padding: '6px',
              border: '1px solid #ccc',
            }}
          >
            <strong>{p.title}</strong> ({p.propertyType})
            {p.pricePerDay && (
              <span> | ₹{p.pricePerDay}/day</span>
            )}
            {p.pricePerMonth && (
              <span> | ₹{p.pricePerMonth}/month</span>
            )}
            <div>{p.address}</div>
            {p.facilities && p.facilities.length > 0 && (
              <div>Facilities: {p.facilities.join(', ')}</div>
            )}
            <button
              onClick={() => setSelectedProperty(p)}
              style={{ marginTop: '4px' }}
            >
              Select
            </button>
          </li>
        ))}
      </ul>

      {selectedProperty && (
        <div style={{ marginTop: '16px' }}>
          <h2>Book: {selectedProperty.title}</h2>
          <form
            onSubmit={bookProperty}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxWidth: '300px',
            }}
          >
            <label>
              Stay type
              <select
                value={stayType}
                onChange={(e) => setStayType(e.target.value)}
              >
                <option value="DAY">Short term (day-based)</option>
                <option value="LONG_TERM">Long term (rental)</option>
              </select>
            </label>

            <label>
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>

            {stayType === 'DAY' && (
              <label>
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            )}

            <button type="submit">Book property</button>
          </form>
        </div>
      )}

      <h2>Your bookings</h2>
      <ul>
        {bookings.map((b) => {
          const property = properties.find((p) => p.id === b.propertyId);
          return (
            <li key={b.id} style={{ marginBottom: '8px' }}>
              {property ? property.title : b.propertyId} | {b.stayType}{' '}
              | {b.startDate}
              {b.endDate && b.endDate !== b.startDate && ` → ${b.endDate}`}{' '}
              | Status: {b.status}
              {b.status === 'pending' && (
                <button
                  onClick={() => cancelBooking(b)}
                  style={{ marginLeft: '8px' }}
                >
                  Cancel
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CustomerHousing;
