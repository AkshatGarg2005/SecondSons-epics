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

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'serviceRequests'),
      where('workerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const markCompleted = async (job) => {
    if (job.status !== 'assigned') return;
    await updateDoc(doc(db, 'serviceRequests', job.id), {
      status: 'completed',
    });
  };

  return (
    <div>
      <h1>Worker Dashboard</h1>
      <p>Jobs assigned to you by admin.</p>
      <ul>
        {jobs.map((job) => (
          <li
            key={job.id}
            style={{
              marginBottom: '10px',
              padding: '8px',
              border: '1px solid #ccc',
            }}
          >
            <div>
              <strong>{job.category}</strong> | Status: {job.status}
            </div>
            <div>Description: {job.description}</div>
            <div>Address: {job.address}</div>
            {typeof job.basePrice === 'number' && (
              <div>Base price: ₹{job.basePrice}</div>
            )}
            {job.status === 'assigned' && (
              <button onClick={() => markCompleted(job)}>
                Mark completed
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkerDashboard;
