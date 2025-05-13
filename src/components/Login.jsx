// src/components/Login.js
import { useState } from 'react';
import { Button, Card, Form, Input, message, Modal } from 'antd';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { MailOutlined } from '@ant-design/icons';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error) {
      message.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      message.warning('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      message.success(`Password reset email sent to ${resetEmail}`);
      setResetModalVisible(false);
      setResetEmail('');
    } catch (error) {
      message.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card title="Wedding Admin Login" style={{ width: 400 }}>
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { 
                required: true, 
                message: 'Please input your email!' 
              },
              {
                type: 'email',
                message: 'Please enter a valid email address',
              }
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              Log in
            </Button>
          </Form.Item>

          <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
            <Button 
              type="link" 
              onClick={() => setResetModalVisible(true)}
            >
              Forgot password?
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Password Reset Modal */}
      <Modal
        title="Reset Password"
        visible={resetModalVisible}
        onOk={handleResetPassword}
        onCancel={() => {
          setResetModalVisible(false);
          setResetEmail('');
        }}
        confirmLoading={resetLoading}
        okText="Send Reset Link"
        cancelText="Cancel"
      >
        <p>Enter your email address to receive a password reset link:</p>
        <Input
          placeholder="Your email address"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          prefix={<MailOutlined />}
          type="email"
        />
      </Modal>
    </div>
  );
};

export default Login;