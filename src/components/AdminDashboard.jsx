import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Select, 
  Statistic, 
  Row, 
  Col, 
  Tabs, 
  Badge, 
  Tag, 
  Input, 
  Avatar,
  Popover,
  List,
  notification,
  Tooltip,
  Modal
} from 'antd';
import { 
  FilterOutlined, 
  SearchOutlined, 
  UserOutlined, 
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionOutlined,
  ExportOutlined,
  MailOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Papa from 'papaparse';
import { nanoid } from 'nanoid';
import notificationSound from '../assets/notification.mp3';

const { Option } = Select;
const { TabPane } = Tabs;

const AdminDashboard = () => {
  const [user] = useAuthState(auth);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedSide, setSelectedSide] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  
  // Initialize notification sound
  const audio = new Audio(notificationSound);

  useEffect(() => {
    const fetchGuests = async () => {
      setLoading(true);
      try {
        let q;
        
        if (user?.email === 'bride@example.com') {
          q = query(collection(db, 'guests'), where('side', '==', 'bride'));
        } else if (user?.email === 'groom@example.com') {
          q = query(collection(db, 'guests'), where('side', '==', 'groom'));
        } else {
          q = collection(db, 'guests');
        }
        
        const querySnapshot = await getDocs(q);
        const guestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          key: doc.id,
          ...doc.data()
        }));
        setGuests(guestsData);
      } catch (error) {
        console.error('Error fetching guests:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load guest data',
          duration: 4.5,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchGuests();
      
      // Set up real-time listener for RSVP updates
      const unsubscribe = onSnapshot(collection(db, 'guests'), (snapshot) => {
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
      
      return () => unsubscribe();
    }
  }, [user]);

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

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      // Search filter
      const matchesSearch = 
        guest.name.toLowerCase().includes(searchText.toLowerCase()) ||
        guest.phone?.includes(searchText) ||
        guest.email?.toLowerCase().includes(searchText.toLowerCase());

      // Side filter
      const matchesSide = 
        !selectedSide || 
        guest.side === selectedSide;

      // Event filter
      const matchesEvent = 
        selectedEvent === 'all' || 
        guest.invitedEvents?.includes(selectedEvent);

      // Tab filter
      const matchesTab = 
        activeTab === 'all' || 
        getRsvpStatus(guest) === activeTab;

      return matchesSearch && matchesSide && matchesEvent && matchesTab;
    });
  }, [guests, searchText, selectedSide, selectedEvent, activeTab]);

  const stats = useMemo(() => {
    const total = guests.length;
    const pending = guests.filter(g => getRsvpStatus(g) === 'pending').length;
    const accepted = guests.filter(g => getRsvpStatus(g) === 'accepted').length;
    const rejected = guests.filter(g => getRsvpStatus(g) === 'rejected').length;
    const partial = guests.filter(g => getRsvpStatus(g) === 'partial').length;

    return { total, pending, accepted, rejected, partial };
  }, [guests]);

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

  const handleExport = () => {
    let dataToExport = filteredGuests.map(guest => ({
      Name: guest.name,
      Phone: guest.phone,
      Email: guest.email,
      Side: guest.side,
      'Invited Events': guest.invitedEvents?.join(', '),
      'RSVP Status': getRsvpStatus(guest),
      ...Object.entries(guest.rsvpStatus || {}).reduce((acc, [event, status]) => {
        acc[`${event} RSVP`] = status;
        if (guest.additionalGuests?.[event]) {
          acc[`${event} +Guests`] = guest.additionalGuests[event];
        }
        return acc;
      }, {})
    }));

    if (exportFormat === 'csv') {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `wedding_guests_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // JSON export
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `wedding_guests_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setIsExportModalVisible(false);
    notification.success({
      message: 'Export Successful',
      description: `Guest data has been exported as ${exportFormat.toUpperCase()}`,
    });
  };

  const sendWhatsApp = (guest) => {
    const url = `https://wa.me/${guest.phone}?text=Hi%20${guest.name},%20Just%20a%20friendly%20reminder%20about%20your%20RSVP%20for%20our%20wedding.%20Please%20respond%20at%20your%20earliest%20convenience.`;
    window.open(url, '_blank');
  };

  const sendEmailReminder = (guest) => {
    window.location.href = `mailto:${guest.email}?subject=Wedding RSVP Reminder&body=Dear ${guest.name},\n\nThis is a friendly reminder to submit your RSVP for our wedding events.\n\nThank you!`;
  };

  const columns = [
    {
      title: 'Guest',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            style={{ 
              backgroundColor: record.side === 'bride' ? '#ffadd2' : '#91d5ff',
              marginRight: 8 
            }}
            icon={<UserOutlined />}
          />
          {text}
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>{record.phone}</div>
          {record.email && <div style={{ fontSize: 12 }}>{record.email}</div>}
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Tag color={record.side === 'bride' ? 'magenta' : 'blue'}>
            {record.side === 'bride' ? "Bride's Side" : "Groom's Side"}
          </Tag>
          <div style={{ marginTop: 4 }}>
            {record.invitedEvents?.map(event => (
              <Tag key={event} style={{ marginBottom: 4 }}>
                {event.charAt(0).toUpperCase() + event.slice(1)}
              </Tag>
            ))}
          </div>
        </div>
      ),
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
      ),
      sorter: (a, b) => {
        const statusA = getRsvpStatus(a);
        const statusB = getRsvpStatus(b);
        const statusOrder = { 'accepted': 1, 'partial': 2, 'pending': 3, 'rejected': 4 };
        return statusOrder[statusA] - statusOrder[statusB];
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {record.email && (
            <Tooltip title="Send Email Reminder">
              <Button 
                size="small" 
                icon={<MailOutlined />} 
                onClick={() => sendEmailReminder(record)}
              />
            </Tooltip>
          )}
          {record.phone && (
            <Tooltip title="Send WhatsApp Reminder">
              <Button 
                size="small" 
                icon={<WhatsAppOutlined />} 
                onClick={() => sendWhatsApp(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Guests"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Confirmed"
              value={stats.accepted}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<QuestionOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Popover
          content={notificationContent}
          title="Recent RSVP Updates"
          trigger="click"
          visible={notificationVisible}
          onVisibleChange={setNotificationVisible}
        >
          <Badge count={notifications.length} overflowCount={9}>
            <Button 
              icon={<BellOutlined />} 
              onClick={() => setNotificationVisible(!notificationVisible)}
            />
          </Badge>
        </Popover>

        <Input
          placeholder="Search guests..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <Select
          placeholder="Filter by side"
          style={{ width: 180 }}
          onChange={setSelectedSide}
          allowClear
          suffixIcon={<FilterOutlined />}
        >
          <Option value="groom">Groom's Side</Option>
          <Option value="bride">Bride's Side</Option>
        </Select>

        <Select
          placeholder="Filter by event"
          style={{ width: 180 }}
          onChange={setSelectedEvent}
          allowClear
          suffixIcon={<FilterOutlined />}
        >
          <Option value="all">All Events</Option>
          {['sangeet', 'reception', 'wedding', 'mehndi', 'haldi'].map(event => (
            <Option key={event} value={event}>
              {event.charAt(0).toUpperCase() + event.slice(1)}
            </Option>
          ))}
        </Select>

        <Button 
          icon={<ExportOutlined />}
          onClick={() => setIsExportModalVisible(true)}
        >
          Export Data
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
      >
        <TabPane tab={<span>All <Badge count={stats.total} style={{ backgroundColor: '#1890ff' }} /></span>} key="all" />
        <TabPane tab={<span>Pending <Badge count={stats.pending} style={{ backgroundColor: '#faad14' }} /></span>} key="pending" />
        <TabPane tab={<span>Confirmed <Badge count={stats.accepted} style={{ backgroundColor: '#52c41a' }} /></span>} key="accepted" />
        <TabPane tab={<span>Rejected <Badge count={stats.rejected} style={{ backgroundColor: '#f5222d' }} /></span>} key="rejected" />
        <TabPane tab={<span>Partial <Badge count={stats.partial} style={{ backgroundColor: '#fa8c16' }} /></span>} key="partial" />
      </Tabs>

      <Table
        columns={columns}
        dataSource={filteredGuests}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        bordered
      />

      <Modal
        title="Export Guest Data"
        visible={isExportModalVisible}
        onOk={handleExport}
        onCancel={() => setIsExportModalVisible(false)}
        okText="Export"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 16 }}>
          <label>Export Format:</label>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={exportFormat}
            onChange={setExportFormat}
          >
            <Option value="csv">CSV (Excel compatible)</Option>
            <Option value="json">JSON</Option>
          </Select>
        </div>
        <div>
          <p>This will export {filteredGuests.length} guest records.</p>
          <p style={{ fontSize: 12, color: '#888' }}>
            Note: The export will include all visible filtered data.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;