import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Missing reset token');
      return;
    }
    if (newPassword.length < 8) {
      toast.warning('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        email,
        newPassword
      });
      if (res.success) {
        setSuccess(true);
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
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
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--success-accent)" style={{ margin: '0 auto 16px auto' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Password Reset Complete</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Your password has been successfully updated. You can now log in with your new credentials.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Set New Password</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Please create a strong new password for your account.
              </p>

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%' }}
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%' }}
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
