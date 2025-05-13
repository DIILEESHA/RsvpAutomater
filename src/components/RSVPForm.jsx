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
          dietaryPreferences: "",
          specialRequirements: "",
        };

        if (guestData.rsvpStatus) {
          initialValues.events = guestData.rsvpStatus;
        }
        if (guestData.additionalGuests) {
          initialValues.additionalGuests = guestData.additionalGuests;
        }
        if (guestData.dietaryPreferences) {
          initialValues.dietaryPreferences = guestData.dietaryPreferences;
        }
        if (guestData.specialRequirements) {
          initialValues.specialRequirements = guestData.specialRequirements;
        }

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
      const updateData = {
        rsvpStatus: values.events || {},
        additionalGuests: values.additionalGuests || {},
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
          {guest?.invitedEvents?.map((event) => (
            <div key={event} className="rsvp-event">
              <Title level={4} className="event-title">
                {event.charAt(0).toUpperCase() + event.slice(1)}
              </Title>

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
                  return attendance === "accepted" ? (
                    <Form.Item
                      name={["additionalGuests", event]}
                      label="Number of additional guests"
                      initialValue={0} // Default value is 0
                    >
                      <Input
                        type="number"
                        placeholder="Enter number of guests"
                      />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>
            </div>
          ))}

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
