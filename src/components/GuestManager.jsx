import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Avatar,
  Row,
  Col,
  Tag,
  Tabs,
  Badge,
  notification,
  Popover,
  List,
  Descriptions,
  Checkbox,
  Dropdown,
  Menu,
  Space,
  Divider,
  InputNumber,
} from "antd";
import {
  UploadOutlined,
  WhatsAppOutlined,
  PlusOutlined,
  CopyOutlined,
  LinkOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionOutlined,
  BellOutlined,
  EyeOutlined,
  DownOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  FilterOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Papa from "papaparse";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { nanoid } from "nanoid";
import notificationSound from "../assets/notification.mp3";
import * as XLSX from "xlsx";

const { Option } = Select;
const { TabPane } = Tabs;

const GuestManager = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [events] = useState([
    "sangeet",
    "reception",
    "wedding",
    "mehndi",
    "haldi",
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
    phone: "",
    email: "",
    side: "groom",
    invitedEvents: [],
    eventGuests: {}, // New field for event-specific guest counts
  });
  const [baseUrl, setBaseUrl] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedSide, setSelectedSide] = useState(null);
  const [selectedRsvpStatus, setSelectedRsvpStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkUpdateModalVisible, setBulkUpdateModalVisible] = useState(false);
  const [bulkUpdateEvents, setBulkUpdateEvents] = useState([]);
  const [bulkUpdateSide, setBulkUpdateSide] = useState(null);
  const [bulkUpdateAction, setBulkUpdateAction] = useState("add");
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [whatsappBaseUrl, setWhatsappBaseUrl] = useState(
    "https://rsvp-automater.vercel.app/rsvp"
  );
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const audio = new Audio(notificationSound);

  useEffect(() => {
    setBaseUrl(
      window.location.host.includes("localhost")
        ? `${window.location.protocol}//${window.location.host}/rsvp`
        : "https://rsvp-automater.vercel.app/rsvp"
    );

    setWhatsappBaseUrl("https://rsvp-automater.vercel.app//rsvp");

    const unsubscribe = onSnapshot(collection(db, "guests"), (snapshot) => {
      const guestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        key: doc.id,
        ...doc.data(),
      }));
      setGuests(guestsData);
    });

    const rsvpQuery = query(
      collection(db, "guests"),
      where("lastUpdated", ">", new Date(Date.now() - 1000 * 60 * 5)) // Last 5 minutes
    );
    const rsvpUnsubscribe = onSnapshot(rsvpQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const guest = change.doc.data();
          const notificationMsg = `${guest.name} has updated their RSVP`;

          audio.play().catch((e) => console.log("Audio play failed:", e));

          notification.info({
            message: "New RSVP Update",
            description: notificationMsg,
            duration: 5,
          });

          setNotifications((prev) => [
            {
              id: Date.now(),
              message: notificationMsg,
              guestId: change.doc.id,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      });
    });

    return () => {
      unsubscribe();
      rsvpUnsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const showGuestDetails = (guest) => {
    setSelectedGuest(guest);
    setDetailModalVisible(true);
  };

  const handleDeleteGuest = async (guestId) => {
    try {
      await deleteDoc(doc(db, "guests", guestId));
      message.success("Guest deleted successfully");
    } catch (error) {
      message.error("Error deleting guest");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select guests to delete");
      return;
    }

    try {
      const batch = writeBatch(db);
      selectedRowKeys.forEach((guestId) => {
        batch.delete(doc(db, "guests", guestId));
      });
      await batch.commit();
      message.success(`Deleted ${selectedRowKeys.length} guests successfully`);
      setSelectedRowKeys([]);
      setDeleteConfirmVisible(false);
    } catch (error) {
      message.error("Error deleting guests");
    }
  };

  const handleUpload = async (info) => {
    const { file } = info;
    setUploading(true);

    try {
      const parsedData = await new Promise((resolve, reject) => {
        Papa.parse(file.originFileObj, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error("Error parsing CSV file"));
            } else {
              resolve(results.data);
            }
          },
          error: (error) => {
            reject(error);
          },
        });
      });

      const formatted = parsedData.map((guest) => {
        let invitedEvents = [];
        if (guest.invitedEvents) {
          if (Array.isArray(guest.invitedEvents)) {
            invitedEvents = guest.invitedEvents;
          } else if (typeof guest.invitedEvents === "string") {
            invitedEvents = guest.invitedEvents.split(",").map((e) => e.trim());
          }
        }

        // Parse event guests from CSV
        const eventGuests = {};
        events.forEach((event) => {
          if (guest[`${event}_guests`]) {
            eventGuests[event] = parseInt(guest[`${event}_guests`]) || 1;
          }
        });

        if (!guest.name || !guest.phone) {
          throw new Error("Name and phone are required fields");
        }

        return {
          ...guest,
          key: nanoid(),
          invitedEvents,
          eventGuests,
          side: guest.side || "groom",
          email: guest.email || "",
          rsvpStatus: guest.rsvpStatus || {},
          additionalGuests: guest.additionalGuests || {},
        };
      });

      setGuests(formatted);
      message.success(
        `${file.name} imported successfully (${formatted.length} guests)`
      );
    } catch (error) {
      message.error(`Failed to import CSV: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEventChange = (value, record) => {
    setGuests(
      guests.map((g) =>
        g.key === record.key ? { ...g, invitedEvents: value } : g
      )
    );
  };

  const handleEventGuestChange = (event, value, record) => {
    setGuests(
      guests.map((g) => {
        if (g.key === record.key) {
          const updatedEventGuests = {
            ...g.eventGuests,
            [event]: value,
          };
          return { ...g, eventGuests: updatedEventGuests };
        }
        return g;
      })
    );
  };

  const saveGuests = async () => {
    try {
      await Promise.all(
        guests.map(async (guest) => {
          if (guest.id) {
            await updateDoc(doc(db, "guests", guest.id), {
              ...guest,
              lastUpdated: new Date(),
            });
          } else {
            const uniqueLink = nanoid(8);
            await setDoc(doc(db, "guests", uniqueLink), {
              ...guest,
              uniqueLink,
              invitationSent: false,
              rsvpStatus: guest.rsvpStatus || {},
              additionalGuests: guest.additionalGuests || {},
              eventGuests: guest.eventGuests || {},
              lastUpdated: new Date(),
            });
          }
        })
      );
      message.success("Guests saved successfully!");
    } catch (error) {
      message.error("Error saving guests");
    }
  };

  const sendWhatsApp = (guest) => {
    if (!guest.phone) {
      message.error("No phone number provided for this guest");
      return;
    }

    const url = `https://wa.me/${guest.phone}?text=Hi%20${
      guest.name
    },%20You're%20invited%20to%20${
      guest.invitedEvents?.join("%20and%20") || "our wedding events"
    }.%20RSVP:%20${whatsappBaseUrl}/${guest.uniqueLink || "pending"}`;
    window.open(url, "_blank");
  };

  const handleAddGuest = async () => {
    if (!newGuest.name || !newGuest.phone) {
      message.error("Name and phone number are required");
      return;
    }

    try {
      const uniqueLink = nanoid(8);

      // Initialize eventGuests with default values for selected events
      const eventGuests = {};
      newGuest.invitedEvents.forEach((event) => {
        eventGuests[event] = newGuest.eventGuests[event] || 1;
      });

      await setDoc(doc(db, "guests", uniqueLink), {
        ...newGuest,
        eventGuests,
        uniqueLink,
        invitationSent: false,
        rsvpStatus: {},
        additionalGuests: {},
        lastUpdated: new Date(),
      });

      message.success("Guest added successfully!");
      setIsModalVisible(false);
      setNewGuest({
        name: "",
        phone: "",
        email: "",
        side: "groom",
        invitedEvents: [],
        eventGuests: {},
      });
    } catch (error) {
      message.error("Error adding guest");
    }
  };

  const copyToClipboard = (text) => {
    if (!text) {
      message.warning("No link available to copy");
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success("Link copied to clipboard!");
      })
      .catch(() => {
        message.error("Failed to copy link");
      });
  };

  const testRSVPLink = (guest) => {
    if (!guest.invitedEvents || guest.invitedEvents.length === 0) {
      message.warning("Please assign events to this guest first");
      return;
    }

    if (!guest.uniqueLink) {
      message.error("This guest has no RSVP link assigned");
      return;
    }

    const url = `${baseUrl}/${guest.uniqueLink}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getRsvpStatus = (guest) => {
    if (!guest.rsvpStatus || Object.keys(guest.rsvpStatus).length === 0) {
      return "pending";
    }

    const allAccepted = guest.invitedEvents?.every(
      (event) => guest.rsvpStatus[event] === "accepted"
    );
    if (allAccepted) return "accepted";

    const allRejected = guest.invitedEvents?.every(
      (event) => guest.rsvpStatus[event] === "rejected"
    );
    if (allRejected) return "rejected";

    return "partial";
  };

  const {
    filteredGuests,
    pendingCount,
    confirmedCount,
    rejectedCount,
    partialCount,
  } = useMemo(() => {
    const filtered = guests.filter((guest) => {
      const matchesSearch =
        (guest.name &&
          guest.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (guest.phone && guest.phone.includes(searchText)) ||
        (guest.email &&
          guest.email.toLowerCase().includes(searchText.toLowerCase()));

      const matchesEvents =
        selectedEvents.length === 0 ||
        (guest.invitedEvents &&
          selectedEvents.some((event) => guest.invitedEvents.includes(event)));

      const matchesSide = !selectedSide || guest.side === selectedSide;

      const matchesRsvpStatus = () => {
        if (!selectedRsvpStatus) return true;
        const status = getRsvpStatus(guest);
        return status === selectedRsvpStatus;
      };

      const matchesTab = () => {
        if (activeTab === "all") return true;
        return getRsvpStatus(guest) === activeTab;
      };

      return (
        matchesSearch &&
        matchesEvents &&
        matchesSide &&
        matchesRsvpStatus() &&
        matchesTab()
      );
    });

    const counts = guests.reduce(
      (acc, guest) => {
        const status = getRsvpStatus(guest);
        acc[status]++;
        return acc;
      },
      { pending: 0, accepted: 0, rejected: 0, partial: 0 }
    );

    return {
      filteredGuests: filtered,
      pendingCount: counts.pending,
      confirmedCount: counts.accepted,
      rejectedCount: counts.rejected,
      partialCount: counts.partial,
    };
  }, [
    guests,
    searchText,
    selectedEvents,
    selectedSide,
    selectedRsvpStatus,
    activeTab,
  ]);

  const renderRsvpStatus = (rsvpStatus, invitedEvents) => {
    if (!rsvpStatus || Object.keys(rsvpStatus).length === 0) {
      return (
        <Tag icon={<QuestionOutlined />} color="default">
          Pending
        </Tag>
      );
    }

    const allAccepted = invitedEvents?.every(
      (event) => rsvpStatus[event] === "accepted"
    );
    const allRejected = invitedEvents?.every(
      (event) => rsvpStatus[event] === "rejected"
    );

    if (allAccepted) {
      return (
        <Tag icon={<CheckOutlined />} color="green">
          Accepted
        </Tag>
      );
    }

    if (allRejected) {
      return (
        <Tag icon={<CloseOutlined />} color="red">
          Rejected
        </Tag>
      );
    }

    return (
      <Tag icon={<BellOutlined />} color="orange">
        Partial
      </Tag>
    );
  };

  const notificationContent = (
    <List
      size="small"
      dataSource={notifications.slice(0, 5)}
      renderItem={(item) => (
        <List.Item>
          <div style={{ fontSize: 12 }}>{item.message}</div>
          <div style={{ fontSize: 10, color: "#999" }}>
            {new Date(item.timestamp).toLocaleString()}
          </div>
        </List.Item>
      )}
    />
  );

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  const handleBulkUpdate = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select guests to update");
      return;
    }

    try {
      const batch = writeBatch(db);
      const selectedGuests = guests.filter((guest) =>
        selectedRowKeys.includes(guest.key)
      );

      selectedGuests.forEach((guest) => {
        const guestRef = doc(db, "guests", guest.id || guest.key);
        let updatedEvents = [...guest.invitedEvents];

        if (bulkUpdateAction === "add") {
          // Add events that aren't already present
          bulkUpdateEvents.forEach((event) => {
            if (!updatedEvents.includes(event)) {
              updatedEvents.push(event);
            }
          });
        } else if (bulkUpdateAction === "remove") {
          // Remove selected events
          updatedEvents = updatedEvents.filter(
            (event) => !bulkUpdateEvents.includes(event)
          );
        } else if (bulkUpdateAction === "replace") {
          // Replace all events with selected ones
          updatedEvents = [...bulkUpdateEvents];
        }

        const updateData = {
          invitedEvents: updatedEvents,
          lastUpdated: new Date(),
        };

        if (bulkUpdateSide) {
          updateData.side = bulkUpdateSide;
        }

        batch.update(guestRef, updateData);
      });

      await batch.commit();
      message.success(
        `Updated ${selectedGuests.length} guest${
          selectedGuests.length !== 1 ? "s" : ""
        } successfully`
      );
      setBulkUpdateModalVisible(false);
      setSelectedRowKeys([]);
      setBulkUpdateEvents([]);
      setBulkUpdateSide(null);
    } catch (error) {
      message.error("Error updating guests");
      console.error(error);
    }
  };

  const exportToCSV = () => {
    if (filteredGuests.length === 0) {
      message.warning("No data to export");
      return;
    }

    const data = filteredGuests.map((guest) => {
      const rsvpStatus = {};
      events.forEach((event) => {
        rsvpStatus[`${event}_status`] = guest.rsvpStatus?.[event] || "pending";
        rsvpStatus[`${event}_additional`] =
          guest.additionalGuests?.[event] || 0;
        rsvpStatus[`${event}_allowed`] = guest.eventGuests?.[event] || 1;
      });

      return {
        Name: guest.name,
        Phone: guest.phone,
        Email: guest.email || "",
        Side: guest.side,
        "Invited Events": guest.invitedEvents?.join(", ") || "",
        "Unique Link": `${baseUrl}/${guest.uniqueLink}`,
        ...rsvpStatus,
        "Dietary Preferences": guest.dietaryPreferences || "",
        "Special Requirements": guest.specialRequirements || "",
        "Last Updated": guest.lastUpdated
          ? new Date(guest.lastUpdated).toLocaleString()
          : "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, "wedding_guests.xlsx");
    message.success("Exported to Excel successfully");
  };

  const exportToExcel = () => {
    exportToCSV(); // Using the same function since XLSX handles both
  };
  const menu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );
  const exportMenu = (
    <Menu
      items={[
        {
          key: "1",
          label: "Export to Excel",
          icon: <ExportOutlined />,
          onClick: exportToExcel,
        },
        {
          key: "2",
          label: "Export to CSV",
          icon: <ExportOutlined />,
          onClick: exportToCSV,
        },
      ]}
    />
  );

  const actionMenu = (record) => (
    <Menu
      items={[
        {
          key: "1",
          label: "View Details",
          icon: <EyeOutlined />,
          onClick: () => showGuestDetails(record),
        },
        {
          key: "2",
          label: "Send WhatsApp",
          icon: <WhatsAppOutlined />,
          onClick: () => sendWhatsApp(record),
          disabled: !record.invitedEvents?.length || !record.phone,
        },
        {
          key: "3",
          label: "Copy RSVP Link",
          icon: <CopyOutlined />,
          onClick: () => copyToClipboard(`${baseUrl}/${record.uniqueLink}`),
          disabled: !record.uniqueLink,
        },
        {
          key: "4",
          label: "Test RSVP Link",
          icon: <LinkOutlined />,
          onClick: () => testRSVPLink(record),
          disabled: !record.invitedEvents?.length || !record.uniqueLink,
        },
        {
          key: "5",
          label: "Delete Guest",
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDeleteGuest(record.id),
        },
      ]}
    />
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (text, record) => (
        <div>
          {text}
          {record.side === "bride" && (
            <Tag color="magenta" style={{ marginLeft: 8 }}>
              Bride
            </Tag>
          )}
          {record.side === "groom" && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              Groom
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: "Invited Events",
      dataIndex: "invitedEvents",
      key: "events",
      render: (events, record) => (
        <div>
          <Select
            mode="multiple"
            style={{ width: "100%", marginBottom: 8 }}
            value={events || []}
            onChange={(value) => handleEventChange(value, record)}
            placeholder="Select events"
          >
            {events?.map((event) => (
              <Option key={event} value={event}>
                {event.charAt(0).toUpperCase() + event.slice(1)}
              </Option>
            ))}
          </Select>
          {events?.map((event) => (
            <div key={event} style={{ marginBottom: 4 }}>
              <span style={{ marginRight: 8 }}>{event}:</span>
              <InputNumber
                min={1}
                max={10}
                value={record.eventGuests?.[event] || 1}
                onChange={(value) =>
                  handleEventGuestChange(event, value, record)
                }
                style={{ width: 60 }}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "RSVP Status",
      key: "rsvpStatus",
      render: (_, record) => (
        <div>
          {renderRsvpStatus(record.rsvpStatus, record.invitedEvents)}
          {record.rsvpStatus && (
            <div style={{ marginTop: 4 }}>
              {Object.entries(record.rsvpStatus).map(([event, status]) => (
                <div key={event} style={{ fontSize: 12 }}>
                  <span style={{ fontWeight: "bold" }}>
                    {event.charAt(0).toUpperCase() + event.slice(1)}:
                  </span>
                  {status === "accepted" ? " ✅" : " ❌"}
                  {record.additionalGuests?.[event] > 0 &&
                    ` (+${record.additionalGuests[event]})`}
                  {record.eventGuests?.[event] > 1 &&
                    ` (allowed: ${record.eventGuests[event]})`}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Full Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => showGuestDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Send WhatsApp Invite">
            <Button
              icon={<WhatsAppOutlined />}
              onClick={() => sendWhatsApp(record)}
              disabled={!record.invitedEvents?.length || !record.phone}
            />
          </Tooltip>
          <Dropdown overlay={actionMenu(record)} trigger={["click"]}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const mobileFilterContent = (
    <div style={{ padding: "10px" }}>
      <Input.Search
        placeholder="Search guests..."
        allowClear
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <Select
        placeholder="Filter by side"
        style={{ width: "100%", marginBottom: "10px" }}
        onChange={setSelectedSide}
        allowClear
      >
        <Option value="groom">Groom's Side</Option>
        <Option value="bride">Bride's Side</Option>
      </Select>

      <Select
        mode="multiple"
        placeholder="Filter by events"
        style={{ width: "100%", marginBottom: "10px" }}
        onChange={setSelectedEvents}
        allowClear
      >
        {events.map((event) => (
          <Option key={event} value={event}>
            {event.charAt(0).toUpperCase() + event.slice(1)}
          </Option>
        ))}
      </Select>

      <Select
        placeholder="RSVP Status"
        style={{ width: "100%" }}
        onChange={setSelectedRsvpStatus}
        allowClear
      >
        <Option value="accepted">Accepted</Option>
        <Option value="rejected">Rejected</Option>
        <Option value="pending">Pending</Option>
        <Option value="partial">Partial</Option>
      </Select>
    </div>
  );

  return (
    <div className="pl">
      <div>
        <div
          style={{
            textAlign: "right",
            padding: "10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
            <Avatar
              size="large"
              icon={<UserOutlined />}
              style={{
                backgroundColor: "#1890ff",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              className="profile-avatar"
            />
          </Dropdown>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
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
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending RSVPs"
              value={pendingCount}
              valueStyle={{ color: "#faad14" }}
              prefix={<QuestionOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={rejectedCount}
              valueStyle={{ color: "#cf1322" }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div
        className="samiya"
        style={{
          marginBottom: "20px",
          display: { xs: "none", sm: "flex" },
          gap: "10px",
          flexWrap: "nowrap",
        }}
      >
        <div
          style={{
            marginBottom: "30px",
            display: "flex",
            gap: "20px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <Popover
              content={notificationContent}
              title="Recent RSVP Updates"
              trigger="click"
              open={notificationVisible}
              onOpenChange={setNotificationVisible}
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
              beforeUpload={(file) => {
                const isCSV =
                  file.type === "text/csv" || file.name.endsWith(".csv");
                if (!isCSV) {
                  message.error("You can only upload CSV files!");
                }
                return isCSV || Upload.LIST_IGNORE;
              }}
              onChange={handleUpload}
              showUploadList={false}
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Import CSV
              </Button>
            </Upload>

            <Dropdown overlay={exportMenu} trigger={["click"]}>
              <Button icon={<ExportOutlined />}>
                Export <DownOutlined />
              </Button>
            </Dropdown>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
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

            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  type="primary"
                  onClick={() => setBulkUpdateModalVisible(true)}
                >
                  Bulk Update ({selectedRowKeys.length})
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
        >
          <Input.Search
            placeholder="Search guests..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
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
            {events.map((event) => (
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
      </div>

      <div
        className="bultiya"
        style={{
          marginBottom: "20px",
          display: { xs: "flex", sm: "none" },
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <Space wrap>
          <Popover
            content={notificationContent}
            title="Recent RSVP Updates"
            trigger="click"
            open={notificationVisible}
            onOpenChange={setNotificationVisible}
          >
            <Badge count={notifications.length} overflowCount={9}>
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => setNotificationVisible(!notificationVisible)}
              />
            </Badge>
          </Popover>

          <Dropdown
            overlay={
              <Menu
                items={[
                  {
                    key: "1",
                    label: "Import CSV",
                    icon: <UploadOutlined />,
                    onClick: () =>
                      document
                        .querySelector('.mobile-upload input[type="file"]')
                        .click(),
                  },
                  {
                    key: "2",
                    label: "Add Guest",
                    icon: <PlusOutlined />,
                    onClick: () => setIsModalVisible(true),
                  },
                  {
                    key: "3",
                    label: "Save Changes",
                    icon: <CheckOutlined />,
                    onClick: saveGuests,
                    disabled: !guests.length,
                  },
                  selectedRowKeys.length > 0 && {
                    key: "4",
                    label: "Bulk Update",
                    icon: <CheckOutlined />,
                    onClick: () => setBulkUpdateModalVisible(true),
                  },
                  selectedRowKeys.length > 0 && {
                    key: "5",
                    label: "Delete Selected",
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => setDeleteConfirmVisible(true),
                  },
                ].filter(Boolean)}
              />
            }
            trigger={["click"]}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>

          <Upload
            accept=".csv"
            beforeUpload={(file) => {
              const isCSV =
                file.type === "text/csv" || file.name.endsWith(".csv");
              if (!isCSV) {
                message.error("You can only upload CSV files!");
              }
              return isCSV || Upload.LIST_IGNORE;
            }}
            onChange={handleUpload}
            showUploadList={false}
            disabled={uploading}
            className="mobile-upload"
            style={{ display: "none" }}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              Import CSV
            </Button>
          </Upload>

          <Dropdown overlay={exportMenu} trigger={["click"]}>
            <Button icon={<ExportOutlined />} />
          </Dropdown>

          <Popover
            content={mobileFilterContent}
            title="Filters"
            trigger="click"
            open={mobileFilterVisible}
            onOpenChange={setMobileFilterVisible}
          >
            <Button icon={<FilterOutlined />} />
          </Popover>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
      >
        <TabPane
          tab={
            <span>
              All{" "}
              <Badge
                count={guests.length}
                style={{ backgroundColor: "#1890ff" }}
              />
            </span>
          }
          key="all"
        />
        <TabPane
          tab={
            <span>
              Pending{" "}
              <Badge
                count={pendingCount}
                style={{ backgroundColor: "#faad14" }}
              />
            </span>
          }
          key="pending"
        />
        <TabPane
          tab={
            <span>
              Confirmed{" "}
              <Badge
                count={confirmedCount}
                style={{ backgroundColor: "#52c41a" }}
              />
            </span>
          }
          key="accepted"
        />
        <TabPane
          tab={
            <span>
              Rejected{" "}
              <Badge
                count={rejectedCount}
                style={{ backgroundColor: "#f5222d" }}
              />
            </span>
          }
          key="rejected"
        />
        <TabPane
          tab={
            <span>
              Partial{" "}
              <Badge
                count={partialCount}
                style={{ backgroundColor: "#fa8c16" }}
              />
            </span>
          }
          key="partial"
        />
      </Tabs>

      <Table
        columns={columns}
        dataSource={filteredGuests}
        rowKey="key"
        rowSelection={rowSelection}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        bordered
      />

      {/* Add Guest Modal */}
      <Modal
        title="Add New Guest"
        open={isModalVisible}
        onOk={handleAddGuest}
        onCancel={() => setIsModalVisible(false)}
        okText="Add Guest"
        cancelText="Cancel"
        width={600}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label>
              Full Name <span style={{ color: "red" }}>*</span>
            </label>
            <Input
              placeholder="Enter guest's full name"
              value={newGuest.name}
              onChange={(e) =>
                setNewGuest({ ...newGuest, name: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>
              Phone Number <span style={{ color: "red" }}>*</span>
            </label>
            <Input
              placeholder="Enter phone number with country code"
              value={newGuest.phone}
              onChange={(e) =>
                setNewGuest({ ...newGuest, phone: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Email (Optional)</label>
            <Input
              placeholder="Enter email address"
              value={newGuest.email}
              onChange={(e) =>
                setNewGuest({ ...newGuest, email: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Side</label>
            <Select
              style={{ width: "100%" }}
              value={newGuest.side}
              onChange={(value) => setNewGuest({ ...newGuest, side: value })}
            >
              <Option value="groom">Groom's Side</Option>
              <Option value="bride">Bride's Side</Option>
            </Select>
          </div>

          <div>
            <label>Invited Events</label>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              value={newGuest.invitedEvents}
              onChange={(value) =>
                setNewGuest({ ...newGuest, invitedEvents: value })
              }
              placeholder="Select events"
            >
              {events.map((event) => (
                <Option key={event} value={event}>
                  {event.charAt(0).toUpperCase() + event.slice(1)}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label>Guest Counts</label>
            {newGuest.invitedEvents.map((event) => (
              <div key={event} style={{ marginBottom: 8 }}>
                <span style={{ marginRight: 8 }}>{event}:</span>
                <InputNumber
                  min={1}
                  max={10}
                  value={newGuest.eventGuests[event] || 1}
                  onChange={(value) => {
                    setNewGuest((prev) => ({
                      ...prev,
                      eventGuests: {
                        ...prev.eventGuests,
                        [event]: value,
                      },
                    }));
                  }}
                />
                <span style={{ marginLeft: 8 }}>
                  (Total: {newGuest.eventGuests[event] || 1} - You +{" "}
                  {Math.max(0, (newGuest.eventGuests[event] || 1) - 1)}{" "}
                  additional)
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Guest Details Modal */}
      <Modal
        title="Guest Details"
        open={detailModalVisible}
        onOk={() => setDetailModalVisible(false)}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              handleDeleteGuest(selectedGuest.id);
              setDetailModalVisible(false);
            }}
          >
            Delete Guest
          </Button>,
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedGuest && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Name">
              {selectedGuest.name}
            </Descriptions.Item>
            <Descriptions.Item label="Side">
              <Tag color={selectedGuest.side === "bride" ? "magenta" : "blue"}>
                {selectedGuest.side === "bride" ? "Bride" : "Groom"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedGuest.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedGuest.email || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="RSVP Link">
              {selectedGuest.uniqueLink ? (
                <a
                  href={`${baseUrl}/${selectedGuest.uniqueLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`${baseUrl}/${selectedGuest.uniqueLink}`}
                </a>
              ) : (
                "Not generated"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Overall Status">
              {renderRsvpStatus(
                selectedGuest.rsvpStatus,
                selectedGuest.invitedEvents
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Invited Events" span={2}>
              {selectedGuest.invitedEvents?.length > 0 ? (
                <div>
                  {selectedGuest.invitedEvents.map((event) => (
                    <div key={event} style={{ marginBottom: 8 }}>
                      <Tag style={{ marginBottom: 4 }}>
                        {event.charAt(0).toUpperCase() + event.slice(1)}
                      </Tag>
                      <span style={{ marginLeft: 8 }}>
                        Allowed guests:{" "}
                        {selectedGuest.eventGuests?.[event] || 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                "No events assigned"
              )}
            </Descriptions.Item>

            {selectedGuest.rsvpStatus &&
              Object.keys(selectedGuest.rsvpStatus).length > 0 && (
                <Descriptions.Item label="RSVP Details" span={2}>
                  <div style={{ marginTop: 8 }}>
                    {selectedGuest.invitedEvents?.map((event) => (
                      <div key={event} style={{ marginBottom: 8 }}>
                        <strong>
                          {event.charAt(0).toUpperCase() + event.slice(1)}:
                        </strong>
                        <div style={{ marginLeft: 16 }}>
                          <div>
                            Status:{" "}
                            {selectedGuest.rsvpStatus[event] === "accepted" ? (
                              <Tag icon={<CheckOutlined />} color="green">
                                Accepted
                              </Tag>
                            ) : (
                              <Tag icon={<CloseOutlined />} color="red">
                                Rejected
                              </Tag>
                            )}
                          </div>
                          <div>
                            Allowed Guests:{" "}
                            {selectedGuest.eventGuests?.[event] || 1}
                          </div>
                          {selectedGuest.additionalGuests?.[event] > 0 && (
                            <div>
                              Additional Guests:{" "}
                              {selectedGuest.additionalGuests[event]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Descriptions.Item>
              )}

            {selectedGuest.dietaryPreferences && (
              <Descriptions.Item label="Dietary Preferences">
                {selectedGuest.dietaryPreferences}
              </Descriptions.Item>
            )}

            {selectedGuest.specialRequirements && (
              <Descriptions.Item label="Special Requirements">
                {selectedGuest.specialRequirements}
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Last Updated">
              {selectedGuest.lastUpdated
                ? new Date(selectedGuest.lastUpdated).toLocaleString()
                : "Never updated"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        title={`Bulk Update ${selectedRowKeys.length} Guest${
          selectedRowKeys.length !== 1 ? "s" : ""
        }`}
        open={bulkUpdateModalVisible}
        onOk={handleBulkUpdate}
        onCancel={() => setBulkUpdateModalVisible(false)}
        width={600}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label>Update Action</label>
            <Select
              style={{ width: "100%" }}
              value={bulkUpdateAction}
              onChange={setBulkUpdateAction}
            >
              <Option value="add">Add Events</Option>
              <Option value="remove">Remove Events</Option>
              <Option value="replace">Replace All Events</Option>
            </Select>
          </div>

          <div>
            <label>Events</label>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              value={bulkUpdateEvents}
              onChange={setBulkUpdateEvents}
              placeholder="Select events to add"
            >
              {events.map((event) => (
                <Option key={event} value={event}>
                  {event.charAt(0).toUpperCase() + event.slice(1)}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label>Update Side (Optional)</label>
            <Select
              style={{ width: "100%" }}
              value={bulkUpdateSide}
              onChange={setBulkUpdateSide}
              placeholder="Select side"
              allowClear
            >
              <Option value="groom">Groom's Side</Option>
              <Option value="bride">Bride's Side</Option>
            </Select>
          </div>

          <div>
            <label>Selected Guests:</label>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              <List
                size="small"
                dataSource={guests.filter((guest) =>
                  selectedRowKeys.includes(guest.key)
                )}
                renderItem={(guest) => (
                  <List.Item>
                    {guest.name} ({guest.phone})
                  </List.Item>
                )}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={deleteConfirmVisible}
        onOk={handleBulkDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete {selectedRowKeys.length} selected
          guest{selectedRowKeys.length !== 1 ? "s" : ""}? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

export default GuestManager;
