import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import './ThankYouPage.css';

const { Title, Text } = Typography;

const ThankYouPage = () => {
  return (
    <div className="thankyou-container">
      <Card className="thankyou-card">
        <Title level={2} className="thankyou-title">
          Thank You for Your RSVP!
        </Title>
        <Text className="thankyou-subtitle">
          Your response has been received. We look forward to celebrating with you!
        </Text>
        
      </Card>
    </div>
  );
};

export default ThankYouPage;
