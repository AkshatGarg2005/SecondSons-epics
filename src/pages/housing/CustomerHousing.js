import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';

const CustomerHousing = () => {
  useAuth();
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredProperties = properties.filter((p) => {
    const term = searchTerm.toLowerCase();
    const address = (p.address || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    return address.includes(term) || title.includes(term);
  });

  return (
    <div>
      <h1>Housing (Customer)</h1>
      <p>Your house bookings are available in the "My Orders" page.</p>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by location or property name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            width: '100%',
            maxWidth: '400px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />
      </div>

      <h2>Available properties</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {filteredProperties.map((p) => (
          <div
            key={p.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              width: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Main Image */}
            {p.images && p.images.length > 0 ? (
              <img
                src={p.images[0]}
                alt={p.title}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
              />
            ) : p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.title}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
              />
            ) : (
              <div style={{ width: '100%', height: '200px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: '10px' }}>
                No Image
              </div>
            )}

            <h3>{p.title}</h3>
            <p style={{ color: '#666', fontSize: '0.9em' }}>{p.propertyType}</p>
            <p style={{ margin: '5px 0' }}>{p.address}</p>

            <div style={{ marginTop: 'auto' }}>
              {p.pricePerDay && (
                <div style={{ fontWeight: 'bold' }}>₹{p.pricePerDay}/day</div>
              )}
              {p.pricePerMonth && (
                <div style={{ fontWeight: 'bold' }}>₹{p.pricePerMonth}/month</div>
              )}

              <a
                href={`/property/${p.id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  marginTop: '10px'
                }}
              >
                View Details
              </a>
            </div>
          </div>
        ))}
        {filteredProperties.length === 0 && (
          <p>No properties found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default CustomerHousing;
