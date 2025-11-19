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

const DriverCab = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myRides, setMyRides] = useState([]);

  useEffect(() => {
    if (!user) return;

    const qPending = query(
      collection(db, 'cabRequests'),
      where('status', '==', 'pending')
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qMine = query(
      collection(db, 'cabRequests'),
      where('driverId', '==', user.uid)
    );
    const unsubMine = onSnapshot(qMine, (snapshot) => {
      setMyRides(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPending();
      unsubMine();
    };
  }, [user]);

  const acceptRequest = async (request) => {
    if (request.status !== 'pending') return;
    await updateDoc(doc(db, 'cabRequests', request.id), {
      status: 'accepted',
      driverId: user.uid,
    });
  };

  const completeRide = async (request) => {
    if (request.status !== 'accepted') return;
    await updateDoc(doc(db, 'cabRequests', request.id), {
      status: 'completed',
    });
  };

  return (
    <div>
      <h1>Cab Dashboard (Driver)</h1>

      <h2>Pending cab requests</h2>
      <ul>
        {pendingRequests.map((r) => (
          <li key={r.id} style={{ marginBottom: '8px' }}>
            {r.pickupLocation} → {r.dropLocation}{' '}
            {r.scheduledTime && <span>| Time: {r.scheduledTime}</span>}
            <button
              onClick={() => acceptRequest(r)}
              style={{ marginLeft: '8px' }}
            >
              Accept
            </button>
          </li>
        ))}
      </ul>

      <h2>Your rides</h2>
      <ul>
        {myRides.map((r) => (
          <li key={r.id} style={{ marginBottom: '8px' }}>
            {r.pickupLocation} → {r.dropLocation} | Status: {r.status}
            {r.status === 'accepted' && (
              <button
                onClick={() => completeRide(r)}
                style={{ marginLeft: '8px' }}
              >
                Mark completed
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DriverCab;
