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
  getDoc,
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
  const [driverProfiles, setDriverProfiles] = useState({});

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

  useEffect(() => {
    const loadDrivers = async () => {
      const ids = Array.from(
        new Set(
          requests
            .map((r) => r.driverId)
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
          console.error('Failed to fetch driver profile', err);
        }
      }
      setDriverProfiles(profiles);
    };

    if (requests.length > 0) {
      loadDrivers();
    } else {
      setDriverProfiles({});
    }
  }, [requests]);

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

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '400px',
        }}
      >
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
        {requests.map((r) => {
          const driver =
            r.driverId &&
            r.status === 'accepted'
              ? driverProfiles[r.driverId]
              : null;
          return (
            <li key={r.id} style={{ marginBottom: '8px' }}>
              {r.pickupLocation} → {r.dropLocation} | Status: {r.status}
              {driver && (
                <div>
                  Driver: {driver.name}
                  {driver.phone && ` (Phone: ${driver.phone})`}
                </div>
              )}
              {r.status === 'pending' && (
                <button
                  onClick={() => cancelRequest(r.id, r.status)}
                  style={{ marginLeft: '8px' }}
                >
                  Cancel
                </button>
              )}
            </li>
          );
        })}
        {requests.length === 0 && (
          <p>No cab requests yet.</p>
        )}
      </ul>
    </div>
  );
};

export default CustomerCab;
