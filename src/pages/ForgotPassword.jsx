import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setSubmitted(true);
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="card" style={{ padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--success-accent)" style={{ margin: '0 auto 16px auto' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Check Your Email</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                If an account matches <strong>{email}</strong>, a password reset link has been dispatched.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Forgot Password?</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Enter your account email to receive a secure password reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input
                      type="email"
                      placeholder="admin@eventgen.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <Send size={16} />
                  <span>{loading ? 'Sending Request...' : 'Send Reset Link'}</span>
                </button>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <Link to="/login" style={{ fontSize: '13px', color: 'var(--primary-600)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
