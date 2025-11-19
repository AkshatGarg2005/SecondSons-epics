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

const CustomerServiceRequest = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'serviceRequests'),
      where('customerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !description || !address) return;

    await addDoc(collection(db, 'serviceRequests'), {
      customerId: user.uid,
      category,
      description,
      address,
      scheduledTime: scheduledTime || null,
      status: 'pending', // pending, assigned, completed, cancelled, rejected
      workerId: null,
      basePrice: null,
      createdAt: serverTimestamp(),
    });

    setCategory('');
    setDescription('');
    setAddress('');
    setScheduledTime('');
  };

  const cancelRequest = async (id, status) => {
    if (status !== 'pending' && status !== 'assigned') return;
    await updateDoc(doc(db, 'serviceRequests', id), {
      status: 'cancelled',
    });
  };

  return (
    <div>
      <h1>Service on Rent (Customer)</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
        <label>
          Category (plumber, electrician, etc.)
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </label>

        <label>
          Problem description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <label>
          Address
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </label>

        <label>
          Preferred time (optional)
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </label>

        <button type="submit">Create service request</button>
      </form>

      <h2>Your service requests</h2>
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: '8px' }}>
            [{r.category}] {r.description.slice(0, 60)}... | Status: {r.status}{' '}
            {r.workerId && <span>| Worker: {r.workerId}</span>}
            {typeof r.basePrice === 'number' && (
              <span> | Base price: ₹{r.basePrice}</span>
            )}
            {(r.status === 'pending' || r.status === 'assigned') && (
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

export default CustomerServiceRequest;
