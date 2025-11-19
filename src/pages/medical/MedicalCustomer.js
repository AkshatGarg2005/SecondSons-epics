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

const MedicalCustomer = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'medicalConsultations'),
      where('customerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setConsultations(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms) return;

    await addDoc(collection(db, 'medicalConsultations'), {
      customerId: user.uid,
      doctorId: null,
      symptoms,
      preferredTime: preferredTime || null,
      status: 'pending', // pending, accepted, completed, cancelled
      notes: '',
      prescription: '',
      createdAt: serverTimestamp(),
    });

    setSymptoms('');
    setPreferredTime('');
  };

  const cancelConsultation = async (c) => {
    if (c.status !== 'pending') return;
    await updateDoc(doc(db, 'medicalConsultations', c.id), {
      status: 'cancelled',
    });
  };

  return (
    <div>
      <h1>Medical Consultation (Customer)</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
        <label>
          Describe your symptoms
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            required
          />
        </label>

        <label>
          Preferred time (optional)
          <input
            type="datetime-local"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />
        </label>

        <button type="submit">Request consultation</button>
      </form>

      <h2>Your consultations</h2>
      <ul>
        {consultations.map((c) => (
          <li key={c.id} style={{ marginBottom: '8px' }}>
            Symptoms: {c.symptoms.slice(0, 60)}... | Status: {c.status}{' '}
            {c.doctorId && <span>| Doctor: {c.doctorId}</span>}
            {c.prescription && (
              <div>Prescription: {c.prescription}</div>
            )}
            {c.status === 'pending' && (
              <button
                onClick={() => cancelConsultation(c)}
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

export default MedicalCustomer;
