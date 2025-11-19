import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const CustomerCab = () => {
  const { user } = useAuth();
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'cabRequests'),
      where('customerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRequests(data);
    });
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickupLocation || !dropLocation) return;

    await addDoc(collection(db, 'cabRequests'), {
      customerId: user.uid,
      pickupLocation,
      dropLocation,
      scheduledTime: scheduledTime || null,
      notes: notes || '',
      status: 'pending', // pending, accepted, completed, cancelled
      driverId: null,
      createdAt: serverTimestamp(),
    });

    setPickupLocation('');
    setDropLocation('');
    setScheduledTime('');
    setNotes('');
  };

  const cancelRequest = async (id, status) => {
    if (status !== 'pending') return;
    await updateDoc(doc(db, 'cabRequests', id), {
      status: 'cancelled',
    });
  };

  return (
    <div>
      <h1>Cab Booking (Customer)</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
        <label>
          Pickup location
          <input
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            required
          />
        </label>

        <label>
          Drop location
          <input
            value={dropLocation}
            onChange={(e) => setDropLocation(e.target.value)}
            required
          />
        </label>

        <label>
          Scheduled time (optional)
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </label>

        <label>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button type="submit">Create cab request</button>
      </form>

      <h2>Your cab requests</h2>
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: '8px' }}>
            {r.pickupLocation} → {r.dropLocation} | Status: {r.status}{' '}
            {r.driverId && <span>| Driver: {r.driverId}</span>}
            {r.status === 'pending' && (
              <button
                onClick={() => cancelRequest(r.id, r.status)}
                style={{ marginLeft: '8px' }}
              >
                Cancel
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomerCab;
