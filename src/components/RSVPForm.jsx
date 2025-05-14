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
} from "antd";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import "./RSVPForm.css";

const { Title } = Typography;

const RSVPForm = () => {
  const { guestId } = useParams();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

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

        if (!guestData.invitedEvents || !Array.isArray(guestData.invitedEvents)) {
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

        // Initialize with existing values or 0
        guestData.invitedEvents.forEach(event => {
          initialValues.events[event] = guestData.rsvpStatus?.[event] || "pending";
          initialValues.additionalGuests[event] = guestData.additionalGuests?.[event] || 0;
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
      // Clean up additional guests - set to 0 if not attending
      const cleanedAdditionalGuests = {};
      Object.keys(values.additionalGuests).forEach(event => {
        cleanedAdditionalGuests[event] = 
          values.events[event] === "accepted" ? (values.additionalGuests[event] || 0) : 0;
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

  if (loading)
    return (
      <Spin
        tip="Loading RSVP..."
        style={{ display: "block", margin: "20% auto", minHeight: "100vh" }}
      />
    );

  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div className="rsvp-container">
      <Card className="rsvp-card">
        <Title level={3} className="rsvp-title">
          Hi {guest?.name}!
        </Title>
        <p className="rsvp-subtext">
          Please let us know if you'll be attending our wedding events:
        </p>

        <Form form={form} onFinish={onFinish} layout="vertical">
          {guest?.invitedEvents?.map((event) => {
            const maxAdditional = (guest.eventGuests?.[event] || 1) - 1;
            return (
              <div key={event} className="rsvp-event">
                <Title level={4} className="event-title">
                  {event.charAt(0).toUpperCase() + event.slice(1)}
                </Title>
                
                {maxAdditional > 0 ? (
                  <p className="event-guest-info">
                    You can bring up to {maxAdditional} additional guest{maxAdditional !== 1 ? 's' : ''}
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
                                return Promise.reject(`Maximum ${maxAdditional} additional guest${maxAdditional !== 1 ? 's' : ''} allowed`);
                              }
                              if (value < 0) {
                                return Promise.reject("Cannot be negative");
                              }
                              return Promise.resolve();
                            }
                          }
                        ]}
                      >
                        <InputNumber
                          min={0}
                          max={maxAdditional}
                          placeholder="0"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    ) : null;
                  }}
                </Form.Item>
              </div>
            );
          })}

          <Title level={4} className="extra-title">
            Extra Info
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

          <Form.Item>
            <Button
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
        </Form>
      </Card>
    </div>
  );
};

export default RSVPForm;