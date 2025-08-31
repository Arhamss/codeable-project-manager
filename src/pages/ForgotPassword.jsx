import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

const ForgotPassword = () => {
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    getValues
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data) => {
    const result = await resetPassword(data.email);
    
    if (result.success) {
      setEmailSent(true);
      toast.success('Password reset email sent successfully!');
    } else {
      if (result.error.includes('user-not-found')) {
        setError('email', { message: 'No account found with this email address' });
      } else if (result.error.includes('too-many-requests')) {
        setError('email', { message: 'Too many requests. Please try again later.' });
      } else {
        setError('email', { message: result.error });
      }
      toast.error(result.error);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (email) {
      const result = await resetPassword(email);
      if (result.success) {
        toast.success('Password reset email sent again!');
      } else {
        toast.error(result.error);
      }
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-xl mb-4"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-gray-400">We've sent a password reset link to your email address</p>
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="card text-center"
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                If an account with that email exists, you'll receive a password reset link shortly.
              </p>
              <p className="text-sm text-gray-400">
                Didn't receive the email? Check your spam folder or click the button below to resend.
              </p>
              
              <motion.button
                onClick={handleResendEmail}
                disabled={isLoading}
                className="btn-secondary w-full flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  'Resend Email'
                )}
              </motion.button>

              <Link
                to="/login"
                className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
                      <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl mb-4 p-2"
            >
              <img src={logo} alt="Codeable Logo" className="w-full h-full object-contain" />
            </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-gray-400">Enter your email to reset your password</p>
        </div>

        {/* Forgot Password Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="card"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`input-primary pl-10 w-full ${
                    errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'Send Reset Link'
              )}
            </motion.button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          © 2024 Codeable Project Manager. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
