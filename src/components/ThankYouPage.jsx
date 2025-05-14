// ThankYouPage.js
import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Image, Row, Col, Spin } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import './ThankYouPage.css';

const { Title } = Typography;

// Reuse the same PDF component from RSVPForm
const EventDetailsPDF = ({ guest, events }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Wedding Event Details</Text>
        <Text style={styles.subtitle}>For {guest.name}</Text>
      </View>
      
      {events.map((eventKey) => {
        const event = eventDetails[eventKey];
        return (
          <View key={eventKey} style={styles.eventSection}>
            <Text style={styles.eventName}>{event.name}</Text>
            <Text style={styles.eventDetail}>Date: {event.date}</Text>
            <Text style={styles.eventDetail}>Time: {event.time}</Text>
            <Text style={styles.eventDetail}>Location: {event.location}</Text>
            <Text style={styles.eventDescription}>{event.description}</Text>
            <View style={styles.divider} />
          </View>
        );
      })}
      
      <Text style={styles.footer}>
        We look forward to celebrating with you!
      </Text>
    </Page>
  </Document>
);

const ThankYouPage = () => {
  const { guestId } = useParams();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const q = query(
          collection(db, "guests"),
          where("uniqueLink", "==", guestId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setGuest({
            id: docSnap.id,
            ...docSnap.data(),
          });
        }
      } catch (err) {
        console.error("Error fetching guest:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();
  }, [guestId]);

  if (loading) {
    return (
      <Spin
        tip="Loading..."
        style={{ display: "block", margin: "20% auto", minHeight: "100vh" }}
      />
    );
  }

  return (
    <div className="thankyou-container">
      <Card className="thankyou-card">
        <Image
          src="/thank-you-image.jpg" // Replace with your image
          alt="Thank You"
          preview={false}
          className="thankyou-image"
        />
        
        <Title level={2} className="thankyou-title">
          Thank You for Your RSVP!
        </Title>
        
        <Text className="thankyou-subtitle">
          Your response has been received. We look forward to celebrating with you!
        </Text>
        
        {guest?.invitedEvents && (
          <div className="download-section">
            <PDFDownloadLink 
              document={<EventDetailsPDF guest={guest} events={guest.invitedEvents} />}
              fileName={`${guest.name}_wedding_details.pdf`}
            >
              {({ loading }) => (
                <Button 
                  type="primary" 
                  size="large"
                  loading={loading}
                >
                  {loading ? 'Preparing PDF...' : 'Download Your Event Details'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        )}
        
        <div className="thankyou-footer">
          <Text type="secondary">
            Need to make changes? Contact us at wedding@example.com
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ThankYouPage;