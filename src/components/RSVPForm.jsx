import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "antd/dist/reset.css";
import {
  Card,
  Form,
  Input,
  Button,
  Radio,
  message,
  Spin,
  Alert,
  Typography,
  InputNumber,
  Tag,
  Divider,
  Descriptions,
  Row,
  Col,
  Modal,
  Image,
} from "antd";
import { useParams, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  HomeOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { db } from "../firebase";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
} from "@react-pdf/renderer";
import "./RSVPForm.css";

const { Title, Paragraph, Text: AntText } = Typography;

const EVENT_DETAILS = {
  sangeet: {
    name: "Sangeet Ceremony",
    date: "Wednesday 20th August 2025",
    time: "6:30 PM",
    location: "Crown Plaza Gerrards Cross",
    description:
      "An evening of music and dance performances where families come together to celebrate through song and dance. Expect live performances, delicious food, and lots of fun!",
    image: "https://i.imgur.com/BjhRR47.jpeg",
    color: "#722ed1",
    dressCode: "Colorful traditional",
    parkingInfo: "Valet parking available at the venue",
    specialNotes: "Please arrive 15 minutes early for seating",
  },
  mehndi: {
    name: "Mehndi Celebration",
    date: "Wednesday 20th August 2025",
    time: "6:30 PM",
    location: "Crown Plaza Gerrards Cross",
    description: "Traditional henna application ceremony with music and dance",
    image: "https://i.imgur.com/BjhRR47.jpeg",
    color: "#52c41a",
    dressCode: "Colorful traditional",
    parkingInfo: "Valet parking available at the venue",
  },
  wedding: {
    name: "Wedding Ceremony",
    date: "Tuesday 26th August 2025",
    time: "11:45 AM",
    location: "The Grove Hotel",
    description:
      "Our sacred wedding ceremony with traditional rituals followed by dinner and celebrations.",
    image: "https://i.imgur.com/zTXENpe.jpeg",
    color: "#f5222d",
    dressCode: "Traditional Indian",
    parkingInfo: "Valet service available at hotel entrance",
  },
  haldi: {
    name: "Haldi Ceremony",
    date: "Tuesday 19th August 2025",
    time: "10:00 AM",
    location: "Family Residence",
    description:
      "Traditional turmeric ceremony where close family applies turmeric paste to the bride and groom",
    image: "https://i.imgur.com/example.jpeg",
    color: "#faad14",
    dressCode: "Yellow traditional",
    parkingInfo: "Street parking available",
  },
  reception: {
    name: "Reception",
    date: "Wednesday 27th August 2025",
    time: "7:00 PM",
    location: "Grand Ballroom",
    description: "Evening celebration with dinner and dancing",
    image: "https://i.imgur.com/example2.jpeg",
    color: "#1890ff",
    dressCode: "Formal attire",
    parkingInfo: "Valet parking available",
  },
};

// PDF Component for Event Details
const EventDetailsPDF = React.memo(({ guest, events }) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: {
          padding: 40,
          fontFamily: "Helvetica",
          backgroundColor: "#fff8f0",
        },
        header: {
          marginBottom: 30,
          textAlign: "center",
          padding: 10,
          borderRadius: 10,
        },
        title: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#000",
          marginBottom: 5,
        },
        subtitle: {
          fontSize: 16,
          color: "#5d6d7e",
        },
        line: {
          height: 1,
          backgroundColor: "#d5d8dc",
          marginVertical: 20,
        },
        eventSection: {
          marginBottom: 30,
          padding: 15,
          backgroundColor: "#ffffff",
          borderRadius: 8,
          borderColor: "#f2f3f4",
          borderWidth: 1,
        },
        eventName: {
          fontSize: 18,
          fontWeight: "bold",
          color: "#000",
          marginBottom: 12,
        },
        eventDetail: {
          fontSize: 14,
          marginBottom: 6,
          color: "#2e4053",
        },
        eventDescription: {
          fontSize: 12,
          marginTop: 10,
          marginBottom: 10,
          color: "#7f8c8d",
          fontStyle: "italic",
        },
        divider: {
          height: 1,
          backgroundColor: "#f0f0f0",
          marginTop: 15,
        },
        footer: {
          marginTop: 40,
          fontSize: 14,
          textAlign: "center",
          color: "#6e2c00",
          fontStyle: "italic",
        },
        imageContainer: {
          marginBottom: 15,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 500,
        },
        eventImage: {
          maxWidth: "100%",
          maxHeight: 500,
          marginBottom: 10,
          borderRadius: 4,
          objectFit: "contain",
        },
      }),
    []
  );

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Wedding Celebration Details</Text>
          <Text style={styles.subtitle}>
            Honoring our special guest, {guest?.name || "Guest"}
          </Text>
        </View>

        <View style={styles.line} />

        {events?.map((eventKey) => {
          const event = EVENT_DETAILS[eventKey];
          if (!event) return null;

          return (
            <View key={eventKey} style={styles.eventSection} wrap={false}>
              <Text style={styles.eventName}>{event.name}</Text>

              {event.image && (
                <View style={styles.imageContainer}>
                  <PDFImage
                    style={styles.eventImage}
                    src={event.image}
                    cache={false}
                  />
                </View>
              )}

              <Text style={styles.eventDetail}>Date: {event.date}</Text>
              <Text style={styles.eventDetail}>Time: {event.time}</Text>
              <Text style={styles.eventDetail}>Location: {event.location}</Text>
              <Text style={styles.eventDetail}>
                Dress Code: {event.dressCode}
              </Text>

              {event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}

              {event.parkingInfo && (
                <Text style={styles.eventDetail}>
                  Parking: {event.parkingInfo}
                </Text>
              )}

              {event.specialNotes && (
                <Text style={styles.eventDetail}>
                  Notes: {event.specialNotes}
                </Text>
              )}

              <View style={styles.divider} />
            </View>
          );
        })}

        <Text style={styles.footer}>
          We can't wait to celebrate with you! 💐
        </Text>
      </Page>
    </Document>
  );
});

const EventCard = React.memo(({ eventKey, onClick }) => {
  const event = EVENT_DETAILS[eventKey];
  if (!event) return null;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="event-card"
        style={{
          borderLeft: `4px solid ${event.color}`,
          cursor: "pointer",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <div className="event-card-content">
          <div className="event-details">
            <h3 className="event-name">{event.name}</h3>
            <div className="event-date">
              <h2 className="hals">
                <CalendarOutlined />
                {event.date}
              </h2>
            </div>
            <div className="event-time">
              <h2 className="hals">
                <ClockCircleOutlined /> {event.time}
              </h2>
            </div>
            <div className="event-dresscode">
              <Tag color={event.color}>{event.dressCode}</Tag>
            </div>
          </div>
          <div className="view-more-btn">
            <Button
              style={{ background: "#333", color: "#fff" }}
              type="text"
              icon={<DownloadOutlined />}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

const EventModal = React.memo(({ eventKey, visible, onClose }) => {
  const event = EVENT_DETAILS[eventKey];
  if (!event) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={800}
      className="event-modal"
      bodyStyle={{ padding: 0 }}
      zIndex={1000}
    >
      <div className="event-modal-container">
        <div className="event-modal-image">
          <Image
            src={event.image}
            alt={event.name}
            preview={false}
            style={{
              width: "100%",
              height: "300px",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        <div className="event-modal-content" style={{ padding: "24px" }}>
          <Title level={2} className="event-modal-title">
            {event.name}
          </Title>

          <Descriptions column={1} bordered>
            <Descriptions.Item label="Date">
              <CalendarOutlined /> {event.date}
            </Descriptions.Item>
            <Descriptions.Item label="Time">
              <ClockCircleOutlined /> {event.time}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              <EnvironmentOutlined /> {event.location}
            </Descriptions.Item>
            <Descriptions.Item label="Dress Code">
              {event.dressCode}
            </Descriptions.Item>
            {event.parkingInfo && (
              <Descriptions.Item label="">
                {/* {event.parkingInfo} */}
              </Descriptions.Item>
            )}
          </Descriptions>
          {/* 
          {event.description && (
            <>
              <Divider />
              <Paragraph strong>Event Description:</Paragraph>
              <Paragraph>{event.description}</Paragraph>
            </>
          )}

          {event.specialNotes && (
            <>
              <Divider />
              <Paragraph strong>Special Notes:</Paragraph>
              <Paragraph>{event.specialNotes}</Paragraph>
            </>
          )} */}

          <div
            className="event-modal-actions"
            style={{ marginTop: "24px", textAlign: "center" }}
          >
            {/* <PDFDownloadLink
              document={<EventDetailsPDF guest={{ name: "Guest" }} events={[eventKey]} />}
              fileName={`${event.name}_details.pdf`}
            >
              {({ loading }) => (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={loading}
                >
                  {loading ? "Preparing..." : "Download Details"}
                </Button>
              )}
            </PDFDownloadLink> */}
          </div>
        </div>
      </div>
    </Modal>
  );
});

const RSVPForm = () => {
  const { guestId } = useParams();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchGuest = useCallback(async () => {
    try {
      const q = query(
        collection(db, "guests"),
        where("uniqueLink", "==", guestId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(`No guest found with RSVP code: ${guestId}`);
        setLoading(false);
        return;
      }

      const docSnap = querySnapshot.docs[0];
      const guestData = docSnap.data();

      if (!guestData.invitedEvents || !Array.isArray(guestData.invitedEvents)) {
        setError("This guest has no events assigned");
        setLoading(false);
        return;
      }

      // Filter out any events that aren't defined in EVENT_DETAILS
      const validEvents = guestData.invitedEvents.filter((event) =>
        EVENT_DETAILS.hasOwnProperty(event)
      );

      if (validEvents.length === 0) {
        setError("No valid events assigned to this guest");
        setLoading(false);
        return;
      }

      const initialValues = {
        events: {},
        additionalGuests: {},
        dietaryPreferences: guestData.dietaryPreferences || "",
        specialRequirements: guestData.specialRequirements || "",
      };

      validEvents.forEach((event) => {
        initialValues.events[event] =
          guestData.rsvpStatus?.[event] || "pending";
        initialValues.additionalGuests[event] =
          guestData.additionalGuests?.[event] || 0;
      });

      setGuest({
        id: docSnap.id,
        ...guestData,
        invitedEvents: validEvents, // Update with filtered events
      });
      form.setFieldsValue(initialValues);
    } catch (err) {
      console.error("Failed to fetch guest:", err);
      setError(`Failed to load RSVP: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [guestId, form]);

  useEffect(() => {
    fetchGuest();
  }, [fetchGuest]);

  const handleSubmit = useCallback(
    async (values) => {
      if (!guest) return;

      setSubmitting(true);

      try {
        const additionalGuests = values.additionalGuests || {};
        const cleanedAdditionalGuests = {};

        Object.keys(additionalGuests).forEach((event) => {
          if (EVENT_DETAILS[event]) {
            cleanedAdditionalGuests[event] =
              values.events?.[event] === "accepted"
                ? additionalGuests[event] || 0
                : 0;
          }
        });

        const updateData = {
          rsvpStatus: values.events || {},
          additionalGuests: cleanedAdditionalGuests,
          dietaryPreferences: values.dietaryPreferences || "",
          specialRequirements: values.specialRequirements || "",
          lastUpdated: new Date().toISOString(),
        };

        await updateDoc(doc(db, "guests", guest.id), updateData);
        message.success("Thank you for your RSVP!");

        setTimeout(() => {
          window.location.href = "/thank-you";
        }, 2000);
      } catch (error) {
        console.error("RSVP submission error:", error);
        message.error("Error submitting your RSVP. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [guest]
  );

  const renderEventFormItems = useMemo(() => {
    if (!guest?.invitedEvents) return null;

    return guest.invitedEvents.map((event) => {
      const eventInfo = EVENT_DETAILS[event];
      if (!eventInfo) return null;

      const maxAdditional = (guest.eventGuests?.[event] || 1) - 1;

      return (
        <div key={event} className="rsvp-event">
          <Title level={4} className="event-title">
            {eventInfo.name}
          </Title>

          {maxAdditional > 0 ? (
            <p className="event-guest-info">
              You can bring up to {maxAdditional} additional guest
              {maxAdditional !== 1 ? "s" : ""}
            </p>
          ) : (
            <Tag color="orange" style={{ marginBottom: 8 }}>
              No additional guests allowed for this event
            </Tag>
          )}

          <Form.Item
            name={["events", event]}
            label="Will you attend?"
            rules={[{ required: true, message: "Please select an option" }]}
          >
            <Radio.Group className="rsvp-radio-group">
              <Radio value="accepted">Yes, I'll be there</Radio>
              <Radio value="rejected">No, I can't make it</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item shouldUpdate>
            {() => {
              const attendance = form.getFieldValue(["events", event]);
              return attendance === "accepted" && maxAdditional > 0 ? (
                <Form.Item
                  name={["additionalGuests", event]}
                  label="Number of additional guests"
                  initialValue={0}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value > maxAdditional) {
                          return Promise.reject(
                            `Maximum ${maxAdditional} additional guest${
                              maxAdditional !== 1 ? "s" : ""
                            } allowed`
                          );
                        }
                        if (value < 0) {
                          return Promise.reject("Cannot be negative");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={maxAdditional}
                    placeholder="0"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
          <Divider />
        </div>
      );
    });
  }, [guest, form]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin tip="Loading RSVP..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className="rsvp-container">
      <Card className="rsvp-card">
        <div className="seca">
          <Link to="/">
            <HomeOutlined style={{ fontSize: "16px", color: "#000" }} />
          </Link>
          <h2 className="">/</h2>
          <h2 className="daspi">rsvp</h2>
        </div>
        <h2 className="rsvp_ttle">Wedding RSVP</h2>

        <Title level={3} className="ty">
          Hi {guest?.name}!
        </Title>
        <div className="lka">
          <AntText style={{ textAlign: "center" }} className="rsvpt">
            We can't wait to celebrate our special day with you! Please let us
            know if you'll be attending each event.
          </AntText>
        </div>
        <div className="formier">
          <div className="event-details-section">
            <Row gutter={[16, 16]}>
              {guest?.invitedEvents?.map((eventKey) => {
                if (!EVENT_DETAILS[eventKey]) return null;
                return (
                  <Col xs={24} sm={12} key={eventKey}>
                    <EventCard
                      eventKey={eventKey}
                      onClick={() => setSelectedEvent(eventKey)}
                    />
                  </Col>
                );
              })}
            </Row>
          </div>

          <AnimatePresence>
            {selectedEvent && (
              <EventModal
                eventKey={selectedEvent}
                visible={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
              />
            )}
          </AnimatePresence>

          <Divider />

          <Form
            className="dull"
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
          >
            {renderEventFormItems}

            <Title level={4} className="extra-title">
              Additional Information
            </Title>

            <Form.Item
              name="dietaryPreferences"
              label="Dietary preferences (optional)"
            >
              <Input.TextArea placeholder="e.g., Vegetarian, Gluten-free, etc." />
            </Form.Item>

            <Form.Item
              name="specialRequirements"
              label="Special requirements or notes"
            >
              <Input.TextArea placeholder="e.g., wheelchair access, baby seat, etc." />
            </Form.Item>

            <div
              className="hab"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Form.Item>
                <Button
                  className="habibi"
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={submitting}
                  disabled={!guest}
                  block
                >
                  Submit RSVP
                </Button>
              </Form.Item>

              {guest?.invitedEvents && (
                <div className="download-section">
                  {/* <PDFDownloadLink
                    document={<EventDetailsPDF guest={guest} events={guest.invitedEvents} />}
                    fileName={`${guest.name}_wedding_details.pdf`}
                  >
                    {({ loading }) => (
                      <Button
                        type="default"
                        size="large"
                        block
                        loading={loading}
                        icon={<DownloadOutlined />}
                      >
                        {loading ? "Preparing PDF..." : "Download All Event Details"}
                      </Button>
                    )}
                  </PDFDownloadLink> */}
                </div>
              )}
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(RSVPForm);
