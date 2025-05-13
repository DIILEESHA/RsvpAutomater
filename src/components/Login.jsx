import { useState } from "react";
import { Button, Card, Form, Input, message, Modal } from "antd";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { MailOutlined } from "@ant-design/icons";
import "./login.css";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();

// In your Login.js component
const onFinish = async (values) => {
  setLoading(true);
  try {
    await signInWithEmailAndPassword(auth, values.email, values.password);
    message.success('Logged in successfully!');
    localStorage.setItem('isAuthenticated', 'true'); // Add this line
    navigate('/dashboard');
  } catch (error) {
    message.error('Invalid email or password');
  } finally {
    setLoading(false);
  }
};

  const handleResetPassword = async () => {
    if (!resetEmail) {
      message.warning("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      message.success(`Password reset email sent to ${resetEmail}`);
      setResetModalVisible(false);
      setResetEmail("");
    } catch (error) {
      message.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="Wedding Admin Login">
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          className="login-form"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input prefix={<MailOutlined />} className="login-input" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password className="login-input" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="login-btn"
            >
              Log in
            </Button>
          </Form.Item>

          <Form.Item style={{ textAlign: "center", marginBottom: 0 }}>
            <Button
              type="link"
              onClick={() => setResetModalVisible(true)}
              className="forgot-password-link"
              style={{ color: "#000" }}
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
          setResetEmail("");
        }}
        confirmLoading={resetLoading}
        okText="Send Reset Link"
        cancelText="Cancel"
        className="reset-password-modal"
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
