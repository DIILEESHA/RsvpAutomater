import React, { useState, useEffect } from "react";
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
  Image,
  Divider,
  Descriptions,
  Badge,
  Row,
  Col,
} from "antd";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "./RSVPForm.css";

const { Title } = Typography;

// Event data with dates and locations
const eventDetails = {
  sangeet: {
    name: "Sangeet Ceremony",
    date: "June 15, 2024",
    time: "6:00 PM",
    location: "Grand Ballroom, Taj Hotel, Mumbai",
    description: "An evening of music and dance performances",
  },
  mehndi: {
    name: "Mehndi Celebration",
    date: "June 16, 2024",
    time: "2:00 PM",
    location: "Outdoor Garden, The Leela Palace, Mumbai",
    description: "Traditional henna application with live music",
  },
  haldi: {
    name: "Haldi Ceremony",
    date: "June 17, 2024",
    time: "10:00 AM",
    location: "Family Residence, Bandra West, Mumbai",
    description: "Turmeric ceremony with close family and friends",
  },
  wedding: {
    name: "Wedding Ceremony",
    date: "June 18, 2024",
    time: "7:00 PM",
    location: "Sea View Lawn, The Oberoi, Mumbai",
    description: "Traditional wedding ceremony followed by reception",
  },
  reception: {
    name: "Reception",
    date: "June 19, 2024",
    time: "8:00 PM",
    location: "Grand Ballroom, The St. Regis, Mumbai",
    description: "Evening celebration with dinner and dancing",
  },
};

// PDF Component for Event Details
const EventDetailsPDF = ({ guest, events }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}> Wedding Celebration Details</Text>
        <Text style={styles.subtitle}>Honoring our special guest, {guest.name}</Text>
      </View>

      <View style={styles.line} />

      {events.map((eventKey) => {
        const event = eventDetails[eventKey];
        return (
          <View key={eventKey} style={styles.eventSection}>
            <Text style={styles.eventName}>{event.name}</Text>
            <Text style={styles.eventDetail}> Date: {event.date}</Text>
            <Text style={styles.eventDetail}> Time: {event.time}</Text>
            <Text style={styles.eventDetail}> Location: {event.location}</Text>
            {event.description && (
              <Text style={styles.eventDescription}>{event.description}</Text>
            )}
            <View style={styles.divider} />
          </View>
        );
      })}

      <Text style={styles.footer}>We can't wait to celebrate with you! 💐</Text>
    </Page>
  </Document>
);


const styles = StyleSheet.create({
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
    // backgroundColor: "#fdebd0",
  },
  title: {
    fontSize: 20,
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
    marginBottom: 20,
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
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    marginBottom: 4,
    color: "#2e4053",
  },
  eventDescription: {
    fontSize: 12,
    marginTop: 10,
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
});


const RSVPForm = () => {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const q = query(
          collection(db, "guests"),
          where("uniqueLink", "==", guestId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError(`No guest found with RSVP code: ${guestId}`);
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const guestData = docSnap.data();

        if (
          !guestData.invitedEvents ||
          !Array.isArray(guestData.invitedEvents)
        ) {
          setError("This guest has no events assigned");
          return;
        }

        setGuest({
          id: docSnap.id,
          ...guestData,
        });

        const initialValues = {
          events: {},
          additionalGuests: {},
          dietaryPreferences: guestData.dietaryPreferences || "",
          specialRequirements: guestData.specialRequirements || "",
        };

        guestData.invitedEvents.forEach((event) => {
          initialValues.events[event] =
            guestData.rsvpStatus?.[event] || "pending";
          initialValues.additionalGuests[event] =
            guestData.additionalGuests?.[event] || 0;
        });

        form.setFieldsValue(initialValues);
      } catch (err) {
        console.error("Failed to fetch guest:", err);
        setError(`Failed to load RSVP: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();
  }, [guestId, form]);

  const onFinish = async (values) => {
    if (!guest) return;

    setSubmitting(true);

    try {
      const additionalGuests = values.additionalGuests || {};

      const cleanedAdditionalGuests = {};
      Object.keys(additionalGuests).forEach((event) => {
        cleanedAdditionalGuests[event] =
          values.events?.[event] === "accepted"
            ? additionalGuests[event] || 0
            : 0;
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
  };

  const handleContinue = () => {
    setShowWelcome(true);
  };

  if (loading) {
    return (
      <Spin
        tip="Loading RSVP..."
        style={{ display: "block", margin: "20% auto", minHeight: "100vh" }}
      />
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (showWelcome) {
    ("");
  }

  return (
    <div className="rsvp-container">
      <Card className="rsvp-card">
        <div className="formier">
          <h2 className="rsvp_ttle">Wedding RSVP</h2>

          <Title level={3} className="rsvp-title">
            Hi {guest?.name}!
          </Title>

          <Text style={{textAlign:"center"}} className="rsvp-subtext">
            We can't wait to celebrate our special day with you! Please let us
            know if you'll be attending each event.
          </Text>

          <Divider />
          <div className="event-details-section">
            <Title level={4} className="section-title">
              Your Invited Events
            </Title>
          <Divider />

            <Row gutter={[16, 16]}>
              {guest?.invitedEvents?.map((eventKey) => {
                const event = eventDetails[eventKey];
                return (
                  <Col xs={24} sm={12} key={eventKey}>
                    <Card className="event-card">
                      <Badge.Ribbon text={event.name} color="#722ed1">
                        <div className="event-content">
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="Date">
                              {event.date}
                            </Descriptions.Item>
                            <Descriptions.Item label="Time">
                              {event.time}
                            </Descriptions.Item>
                            <Descriptions.Item label="Location">
                              {event.location}
                            </Descriptions.Item>
                    
                          </Descriptions>
                        </div>
                      </Badge.Ribbon>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          <Divider />

          <Form form={form} onFinish={onFinish} layout="vertical">
            {guest?.invitedEvents?.map((event) => {
              const maxAdditional = (guest.eventGuests?.[event] || 1) - 1;
              const eventInfo = eventDetails[event];

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
                    rules={[
                      { required: true, message: "Please select an option" },
                    ]}
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
            })}

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
                  <PDFDownloadLink
                    document={
                      <EventDetailsPDF
                        guest={guest}
                        events={guest.invitedEvents}
                      />
                    }
                    fileName={`${guest.name}_wedding_details.pdf`}
                  >
                    {({ loading }) => (
                      <Button
                        style={{ border: "none", textDecoration: "underline" }}
                        type="default"
                        size="large"
                        block
                        loading={loading}
                      >
                        {loading
                          ? "Preparing PDF..."
                          : "Download Event Details"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              )}
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default RSVPForm;
