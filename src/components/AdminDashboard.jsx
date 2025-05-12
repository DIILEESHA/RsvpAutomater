// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, Statistic, Row, Col } from 'antd';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const { Option } = Select;

const AdminDashboard = () => {
  const [user] = useAuthState(auth);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    const fetchGuests = async () => {
      setLoading(true);
      try {
        let q;
        
        if (user.email === 'bride@example.com') {
          q = query(collection(db, 'guests'), where('side', '==', 'bride'));
        } else if (user.email === 'groom@example.com') {
          q = query(collection(db, 'guests'), where('side', '==', 'groom'));
        } else {
          q = collection(db, 'guests');
        }
        
        const querySnapshot = await getDocs(q);
        const guestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGuests(guestsData);
      } catch (error) {
        console.error('Error fetching guests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchGuests();
    }
  }, [user]);

  const filteredGuests = guests.filter(guest => {
    // Apply status filter
    if (filter === 'pending') {
      return !guest.rsvpStatus || Object.keys(guest.rsvpStatus).length === 0;
    } else if (filter === 'responded') {
      return guest.rsvpStatus && Object.keys(guest.rsvpStatus).length > 0;
    }
    
    // Apply event filter
    if (eventFilter !== 'all') {
      return guest.invitedEvents?.includes(eventFilter);
    }
    
    return true;
  });

  const acceptedCount = guests.filter(guest => 
    guest.rsvpStatus && Object.values(guest.rsvpStatus).includes('accepted')
  ).length;

  const pendingCount = guests.filter(guest => 
    !guest.rsvpStatus || Object.keys(guest.rsvpStatus).length === 0
  ).length;

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Side', 
      dataIndex: 'side', 
      key: 'side',
      render: side => <span style={{ textTransform: 'capitalize' }}>{side}</span>
    },
    { 
      title: 'Invited Events', 
      dataIndex: 'invitedEvents', 
      key: 'invitedEvents',
      render: events => events?.join(', ')
    },
    { 
      title: 'RSVP Status', 
      key: 'rsvpStatus',
      render: (_, guest) => {
        if (!guest.rsvpStatus) return 'No response';
        
        return Object.entries(guest.rsvpStatus).map(([event, status]) => (
          <div key={event}>
            <strong>{event}:</strong> {status === 'accepted' ? '✅' : '❌'}
            {guest.additionalGuests?.[event] > 0 && ` (+${guest.additionalGuests[event]})`}
          </div>
        ));
      }
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Total Guests" value={guests.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Confirmed" value={acceptedCount} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Pending" value={pendingCount} />
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Select
          defaultValue="all"
          style={{ width: 200 }}
          onChange={setFilter}
        >
          <Option value="all">All Guests</Option>
          <Option value="pending">Pending RSVP</Option>
          <Option value="responded">Responded</Option>
        </Select>
        
        <Select
          defaultValue="all"
          style={{ width: 200 }}
          onChange={setEventFilter}
        >
          <Option value="all">All Events</Option>
          {['sangeet', 'reception', 'wedding', 'mehndi', 'haldi'].map(event => (
            <Option key={event} value={event}>{event.charAt(0).toUpperCase() + event.slice(1)}</Option>
          ))}
        </Select>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredGuests}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AdminDashboard;