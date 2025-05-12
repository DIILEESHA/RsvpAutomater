import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, Radio, message, Spin, Alert } from "antd";
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
        console.log("Searching for guest with uniqueLink:", guestId);

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

        console.log("Found guest:", guestData);

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

        if (guestData.rsvpStatus) {
          form.setFieldsValue({
            events: guestData.rsvpStatus,
            additionalGuests: guestData.additionalGuests || {},
          });
        }
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
      await updateDoc(doc(db, "guests", guest.id), {
        rsvpStatus: values.events,
        additionalGuests: values.additionalGuests,
        lastUpdated: new Date().toISOString(),
      });
      message.success("Thank you for your RSVP!");

      // Optional: Redirect after a delay
      setTimeout(() => {
        window.location.href = "/thank-you"; // Create this page
      }, 2000);
    } catch (error) {
      console.error("RSVP submission error:", error);
      message.error("Error submitting your RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ... rest of your component remains the same until the return statement

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Card title={`Hi ${guest?.name}!`}>
        <p style={{ marginBottom: 24 }}>
          Please let us know if you'll be attending our wedding events:
        </p>

        <Form form={form} onFinish={onFinish} layout="vertical">
          {guest?.invitedEvents?.map((event) => (
            <div key={event} style={{ marginBottom: 24 }}>
              <h3 style={{ textTransform: "capitalize" }}>{event}</h3>

              <Form.Item
                name={["events", event]}
                label="Will you attend?"
                rules={[{ required: true, message: "Please select an option" }]}
              >
                <Radio.Group>
                  <Radio value="accepted">Yes, I'll be there</Radio>
                  <Radio value="declined">No, I can't make it</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name={["additionalGuests", event]}
                label="Number of additional guests"
              >
                <Input type="number" min={0} style={{ width: "100%" }} />
              </Form.Item>
            </div>
          ))}

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
