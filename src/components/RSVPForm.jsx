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
  Divider,
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

        // Initialize form values
        const initialValues = {
          events: {},
          additionalGuests: {},
          dietaryPreferences: "",
          specialRequirements: "",
        };

        // Set existing RSVP status if available
        if (guestData.rsvpStatus) {
          initialValues.events = guestData.rsvpStatus;
        }

        // Set additional guests if available
        if (guestData.additionalGuests) {
          initialValues.additionalGuests = guestData.additionalGuests;
        }

        // Set other fields if available
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
      // Prepare the data to be saved
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
        style={{ display: "block", margin: "20% auto" }}
      />
    );
  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Card title={`Hi ${guest?.name}!`}>
        <p style={{ marginBottom: 24 }}>
          Please let us know if you'll be attending our wedding events:
        </p>

        <Form form={form} onFinish={onFinish} layout="vertical">
          {guest?.invitedEvents?.map((event) => (
            <div key={event} style={{ marginBottom: 24 }}>
              <Divider orientation="left" plain>
                {event.charAt(0).toUpperCase() + event.slice(1)}
              </Divider>

              <Form.Item
                name={["events", event]}
                label="Will you attend?"
                rules={[{ required: true, message: "Please select an option" }]}
              >
                <Radio.Group>
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
                      label="Number of additional guests (max 4)"
                      initialValue={0}
                      rules={[
                        {
                          type: "number",
                          min: 0,
                          max: 4,
                          message: "Please enter a number between 0 and 4",
                          transform: (value) => Number(value),
                        },
                      ]}
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>
            </div>
          ))}

          <Divider orientation="left">Extra Info</Divider>

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