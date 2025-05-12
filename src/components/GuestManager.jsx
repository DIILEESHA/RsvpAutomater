import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Upload,
  Select,
  Modal,
  message,
  Card,
  Statistic,
  Tooltip,
  Input,
  Row,
  Col,
  Tag,
  Tabs,
  Badge,
  notification,
  Popover,
  List
} from 'antd';
import {
  UploadOutlined,
  WhatsAppOutlined,
  PlusOutlined,
  CopyOutlined,
  LinkOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionOutlined,
  BellOutlined
} from '@ant-design/icons';
import Papa from 'papaparse';
import { collection, onSnapshot, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { nanoid } from 'nanoid';
import notificationSound from '../assets/notification.mp3'; 

const { Option } = Select;
const { TabPane } = Tabs;

const GuestManager = () => {
  const [guests, setGuests] = useState([]);
  const [events] = useState(['sangeet', 'reception', 'wedding', 'mehndi', 'haldi']);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: '',
    phone: '',
    email: '',
    side: 'groom',
    invitedEvents: []
  });
  const [baseUrl, setBaseUrl] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedSide, setSelectedSide] = useState(null);
  const [selectedRsvpStatus, setSelectedRsvpStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  // Initialize notification sound
  const audio = new Audio(notificationSound);

  useEffect(() => {
    setBaseUrl(
      window.location.host.includes('localhost')
        ? `${window.location.protocol}//${window.location.host}/rsvp`
        : 'https://yourwedding.com/rsvp'
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(collection(db, 'guests'), (snapshot) => {
      const guestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        key: doc.id,
        ...doc.data()
      }));
      setGuests(guestsData);
    });

    // Set up listener for RSVP updates
    const rsvpQuery = query(collection(db, 'guests'), where('lastUpdated', '>', new Date()));
    const rsvpUnsubscribe = onSnapshot(rsvpQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const guest = change.doc.data();
          const notificationMsg = `${guest.name} has updated their RSVP`;
          
          // Play sound
          audio.play().catch(e => console.log("Audio play failed:", e));
          
          // Show notification
          notification.info({
            message: 'New RSVP Update',
            description: notificationMsg,
            duration: 5,
          });
          
          // Add to notifications list
          setNotifications(prev => [{
            id: Date.now(),
            message: notificationMsg,
            guestId: change.doc.id,
            timestamp: new Date().toISOString()
          }, ...prev]);
        }
      });
    });

    return () => {
      unsubscribe();
      rsvpUnsubscribe();
    };
  }, []);

  const fetchGuests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'guests'));
      const guestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        key: doc.id,
        ...doc.data()
      }));
      setGuests(guestsData);
    } catch (error) {
      message.error('Failed to fetch guests');
    }
  };

  const handleUpload = info => {
    const file = info.file.originFileObj;
    Papa.parse(file, {
      header: true,
      complete: results => {
        const formatted = results.data.map(guest => ({
          ...guest,
          key: nanoid(),
          invitedEvents: guest.invitedEvents ? guest.invitedEvents.split(',') : [],
          side: guest.side || 'groom'
        }));
        setGuests(formatted);
        message.success(`${info.file.name} file uploaded successfully`);
      },
      error: () => {
        message.error(`${info.file.name} file upload failed`);
      }
    });
  };

  const handleEventChange = (value, record) => {
    setGuests(guests.map(g => g.key === record.key ? {...g, invitedEvents: value} : g));
  };

  const saveGuests = async () => {
    try {
      await Promise.all(guests.map(async guest => {
        if (guest.id) {
          await updateDoc(doc(db, 'guests', guest.id), {
            invitedEvents: guest.invitedEvents
          });
        } else {
          const uniqueLink = nanoid(8);
          await setDoc(doc(db, 'guests', uniqueLink), {
            ...guest,
            uniqueLink,
            invitationSent: false,
            rsvpStatus: {}
          });
        }
      }));
      message.success('Guests saved successfully!');
    } catch (error) {
      message.error('Error saving guests');
    }
  };

  const sendWhatsApp = (guest) => {
    const url = `https://wa.me/${guest.phone}?text=Hi%20${guest.name},%20You're%20invited%20to%20${guest.invitedEvents.join('%20and%20')}.%20RSVP:%20${baseUrl}/${guest.uniqueLink}`;
    window.open(url, '_blank');
  };

  const handleAddGuest = async () => {
    try {
      const uniqueLink = nanoid(8);
      await setDoc(doc(db, 'guests', uniqueLink), {
        ...newGuest,
        uniqueLink,
        invitationSent: false,
        rsvpStatus: {}
      });

      message.success('Guest added successfully!');
      setIsModalVisible(false);
      setNewGuest({
        name: '',
        phone: '',
        email: '',
        side: 'groom',
        invitedEvents: []
      });
    } catch (error) {
      message.error('Error adding guest');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Link copied to clipboard!');
    }).catch(() => {
      message.error('Failed to copy link');
    });
  };

  const testRSVPLink = (guest) => {
    if (!guest.invitedEvents || guest.invitedEvents.length === 0) {
      message.warning('Please assign events to this guest first');
      return;
    }

    if (!guest.uniqueLink) {
      message.error('This guest has no RSVP link assigned');
      return;
    }

    const url = `${baseUrl}/${guest.uniqueLink}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getRsvpStatus = (guest) => {
    if (!guest.rsvpStatus || Object.keys(guest.rsvpStatus).length === 0) {
      return 'pending';
    }
    
    const allAccepted = Object.values(guest.rsvpStatus).every(s => s === 'accepted');
    if (allAccepted) return 'accepted';
    
    const allRejected = Object.values(guest.rsvpStatus).every(s => s === 'rejected');
    if (allRejected) return 'rejected';
    
    return 'partial';
  };

  // Memoized filtered guests and statistics
  const { filteredGuests, pendingCount, confirmedCount, rejectedCount, partialCount } = useMemo(() => {
    const filtered = guests.filter(guest => {
      // Filter by search text
      const matchesSearch =
        guest.name.toLowerCase().includes(searchText.toLowerCase()) ||
        guest.phone.includes(searchText) ||
        guest.email.toLowerCase().includes(searchText.toLowerCase());

      // Filter by selected events
      const matchesEvents = 
        selectedEvents.length === 0 || 
        selectedEvents.some(event => guest.invitedEvents?.includes(event));

      // Filter by side
      const matchesSide = 
        !selectedSide || 
        guest.side === selectedSide;

      // Filter by RSVP status
      const matchesRsvpStatus = () => {
        if (!selectedRsvpStatus) return true;
        const status = getRsvpStatus(guest);
        return status === selectedRsvpStatus;
      };

      // Filter by active tab
      const matchesTab = () => {
        if (activeTab === 'all') return true;
        return getRsvpStatus(guest) === activeTab;
      };

      return matchesSearch && matchesEvents && matchesSide && matchesRsvpStatus() && matchesTab();
    });

    // Calculate counts
    const pending = guests.filter(g => getRsvpStatus(g) === 'pending').length;
    const confirmed = guests.filter(g => getRsvpStatus(g) === 'accepted').length;
    const rejected = guests.filter(g => getRsvpStatus(g) === 'rejected').length;
    const partial = guests.filter(g => getRsvpStatus(g) === 'partial').length;

    return {
      filteredGuests: filtered,
      pendingCount: pending,
      confirmedCount: confirmed,
      rejectedCount: rejected,
      partialCount: partial
    };
  }, [guests, searchText, selectedEvents, selectedSide, selectedRsvpStatus, activeTab]);

  const renderRsvpStatus = (rsvpStatus) => {
    if (!rsvpStatus || Object.keys(rsvpStatus).length === 0) {
      return <Tag icon={<QuestionOutlined />} color="default">Pending</Tag>;
    }

    const allAccepted = Object.values(rsvpStatus).every(s => s === 'accepted');
    const allRejected = Object.values(rsvpStatus).every(s => s === 'rejected');

    if (allAccepted) {
      return <Tag icon={<CheckOutlined />} color="success">All Accepted</Tag>;
    } else if (allRejected) {
      return <Tag icon={<CloseOutlined />} color="error">All Rejected</Tag>;
    } else {
      return <Tag icon={<QuestionOutlined />} color="warning">Partial Response</Tag>;
    }
  };

  const notificationContent = (
    <List
      size="small"
      dataSource={notifications.slice(0, 5)}
      renderItem={item => (
        <List.Item>
          <div style={{ fontSize: 12 }}>{item.message}</div>
        </List.Item>
      )}
    />
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div>
          {text} 
          {record.side === 'bride' && <Tag color="magenta" style={{ marginLeft: 8 }}>Bride</Tag>}
          {record.side === 'groom' && <Tag color="blue" style={{ marginLeft: 8 }}>Groom</Tag>}
        </div>
      )
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      sorter: (a, b) => a.phone.localeCompare(b.phone)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || '')
    },
    {
      title: 'Invited Events',
      dataIndex: 'invitedEvents',
      key: 'events',
      render: (events, record) => (
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          value={events}
          onChange={value => handleEventChange(value, record)}
          placeholder="Select events"
        >
          {events.map(event => (
            <Option key={event} value={event}>
              {event.charAt(0).toUpperCase() + event.slice(1)}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'RSVP Status',
      key: 'rsvpStatus',
      render: (_, record) => (
        <div>
          {renderRsvpStatus(record.rsvpStatus)}
          {record.rsvpStatus && (
            <div style={{ marginTop: 4 }}>
              {Object.entries(record.rsvpStatus).map(([event, status]) => (
                <div key={event} style={{ fontSize: 12 }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {event.charAt(0).toUpperCase() + event.slice(1)}: 
                  </span> 
                  {status === 'accepted' ? ' ✅' : ' ❌'}
                  {record.additionalGuests?.[event] > 0 && ` (+${record.additionalGuests[event]})`}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Tooltip title="Send WhatsApp Invite">
            <Button
              icon={<WhatsAppOutlined />}
              onClick={() => sendWhatsApp(record)}
              disabled={!record.invitedEvents?.length}
            />
          </Tooltip>
          <Tooltip title="Copy RSVP Link">
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(`${baseUrl}/${record.uniqueLink}`)}
            />
          </Tooltip>
          <Tooltip title="Test RSVP Link">
            <Button
              icon={<LinkOutlined />}
              onClick={() => testRSVPLink(record)}
              disabled={!record.invitedEvents?.length}
            />
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Guests"
              value={guests.length}
              prefix={<PlusOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Confirmed"
              value={confirmedCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending RSVPs"
              value={pendingCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<QuestionOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={rejectedCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Popover
          content={notificationContent}
          title="Recent RSVP Updates"
          trigger="click"
          visible={notificationVisible}
          onVisibleChange={setNotificationVisible}
        >
          <Badge count={notifications.length} overflowCount={9}>
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              onClick={() => setNotificationVisible(!notificationVisible)}
            />
          </Badge>
        </Popover>

        <Upload
          accept=".csv"
          beforeUpload={() => false}
          onChange={handleUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Import CSV</Button>
        </Upload>
        
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Guest
        </Button>
        
        <Button 
          type="primary" 
          onClick={saveGuests}
          disabled={!guests.length}
        >
          Save Changes
        </Button>

        <Input.Search
          placeholder="Search guests..."
          allowClear
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <Select
          placeholder="Filter by side"
          style={{ width: 150 }}
          onChange={setSelectedSide}
          allowClear
        >
          <Option value="groom">Groom's Side</Option>
          <Option value="bride">Bride's Side</Option>
        </Select>

        <Select
          mode="multiple"
          placeholder="Filter by events"
          style={{ width: 200 }}
          onChange={setSelectedEvents}
          allowClear
        >
          {events.map(event => (
            <Option key={event} value={event}>
              {event.charAt(0).toUpperCase() + event.slice(1)}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="RSVP Status"
          style={{ width: 150 }}
          onChange={setSelectedRsvpStatus}
          allowClear
        >
          <Option value="accepted">Accepted</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="pending">Pending</Option>
          <Option value="partial">Partial</Option>
        </Select>
      </div>

      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
      >
        <TabPane tab={<span>All <Badge count={guests.length} style={{ backgroundColor: '#1890ff' }} /></span>} key="all" />
        <TabPane tab={<span>Pending <Badge count={pendingCount} style={{ backgroundColor: '#faad14' }} /></span>} key="pending" />
        <TabPane tab={<span>Confirmed <Badge count={confirmedCount} style={{ backgroundColor: '#52c41a' }} /></span>} key="accepted" />
        <TabPane tab={<span>Rejected <Badge count={rejectedCount} style={{ backgroundColor: '#f5222d' }} /></span>} key="rejected" />
        <TabPane tab={<span>Partial <Badge count={partialCount} style={{ backgroundColor: '#fa8c16' }} /></span>} key="partial" />
      </Tabs>

      <Table 
        columns={columns} 
        dataSource={filteredGuests} 
        rowKey="key"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        bordered
      />

      <Modal
        title="Add New Guest"
        visible={isModalVisible}
        onOk={handleAddGuest}
        onCancel={() => setIsModalVisible(false)}
        okText="Add Guest"
        cancelText="Cancel"
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Full Name</label>
            <Input
              placeholder="Enter guest's full name"
              value={newGuest.name}
              onChange={e => setNewGuest({...newGuest, name: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Phone Number</label>
            <Input
              placeholder="Enter phone number with country code"
              value={newGuest.phone}
              onChange={e => setNewGuest({...newGuest, phone: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Email (Optional)</label>
            <Input
              placeholder="Enter email address"
              value={newGuest.email}
              onChange={e => setNewGuest({...newGuest, email: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Side</label>
            <Select
              style={{ width: '100%' }}
              value={newGuest.side}
              onChange={value => setNewGuest({...newGuest, side: value})}
            >
              <Option value="groom">Groom's Side</Option>
              <Option value="bride">Bride's Side</Option>
            </Select>
          </div>
          
          <div>
            <label>Invited Events</label>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              value={newGuest.invitedEvents}
              onChange={value => setNewGuest({...newGuest, invitedEvents: value})}
              placeholder="Select events"
            >
              {events.map(event => (
                <Option key={event} value={event}>
                  {event.charAt(0).toUpperCase() + event.slice(1)}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GuestManager;