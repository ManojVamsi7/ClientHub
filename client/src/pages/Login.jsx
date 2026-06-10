import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity, AlertCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Successfully logged in!', {
        id: 'login-toast',
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Invalid email or password. Please try again.'
      );
      toast.error('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container-page">
      {/* Background glow effects */}
      <div className="login-glow-orb login-glow-orb-1" />
      <div className="login-glow-orb login-glow-orb-2" />

      <div className="login-card">
        <div className="login-header-logo">
          <div className="login-logo-orb">
            <Activity size={18} />
          </div>
          <span className="logo-text" style={{ fontSize: '1.25rem' }}>ClientHub</span>
        </div>

        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to manage clients and recruiter performance</p>

        {error && (
          <div className="login-error-msg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            id="login-email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            id="login-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <div className="login-btn-wrapper">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
              loading={loading}
            >
              Sign In
            </Button>
          </div>
        </form>

        <div className="login-footer-info">
          <p>Internal portal. Default seeded admin:</p>
          <p>
            <code>admin@example.com</code> / <code>Admin123!</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
