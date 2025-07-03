import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './SignUpForm.css'; // Create corresponding CSS file

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setLoading(true);
    
    try {
      // Check if user exists first
      const userExists = await authService.checkUserExists(formData.email);
      if (userExists) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const { success, data, error } = await authService.createNewUser(
        formData.email,
        formData.password
      );

      if (success) {
        setSuccess(true);
        // Optionally redirect after delay
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        throw new Error(error || 'Failed to create user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create New Account</h2>
      {error && <div className="error-message">{error}</div>}
      {success ? (
        <div className="success-message">
          <p>Account created successfully!</p>
          <p>Please check your email to confirm your account.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create password (min 8 chars)"
              minLength="8"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <div className="login-link">
            Already have an account? <a href="/login">Log in</a>
          </div>
        </form>
      )}
    </div>
  );
};

export default SignUpForm;