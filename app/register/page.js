// app/register/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../hooks/useAuth.js';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    type: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [step, setStep] = useState(1); // For multi-step form
  const fileInputRef = useRef(null);
  
  const { register, loading, error, isAuthenticated, user, clearError } = useAuth();
  const router = useRouter();

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  // Password regex: at least 8 chars, one uppercase, one lowercase, one number, one special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  // Redirect if already authenticated to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoutes = {
        admin: '/dashboard/admin',
        user: '/dashboard/user'
      };
      
      const route = dashboardRoutes[user.account_type] || '/dashboard/user';
      router.push(route);
    }
  }, [isAuthenticated, user, router]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Check password match
  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload a valid image file (JPEG, PNG, GIF, WebP)',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please upload an image smaller than 5MB',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    setProfileImage(file);
    const imageUrl = URL.createObjectURL(file);
    setProfileImagePreview(imageUrl);
  };

  const uploadProfileImage = async (token) => {
    if (!profileImage) return null;
    if (!token) {
      console.error('Token is required for image upload');
      return null;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('images', profileImage);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.files[0].url;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error; // We'll handle this in the calling function
    } finally {
      setUploadingImage(false);
    }
  };

  // Toast notification for successful image upload
  const showImageUploadSuccess = () => {
    Swal.fire({
      icon: 'success',
      title: 'Profile Image Uploaded',
      text: 'Your profile image has been successfully uploaded.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  // Toast notification for failed image upload
  const showImageUploadError = (error) => {
    Swal.fire({
      icon: 'warning',
      title: 'Profile Image Not Uploaded',
      text: `Your account was created successfully, but we couldn't upload your profile image: ${error}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    });
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate first step
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please fill out all required fields',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setPasswordMatch(false);
        Swal.fire({
          icon: 'error',
          title: 'Password Mismatch',
          text: 'Passwords do not match. Please check and try again.',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      if (formData.password.length < 6) {
        Swal.fire({
          icon: 'warning',
          title: 'Weak Password',
          text: 'Password must be at least 6 characters long.',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      await Swal.fire({
        icon: 'warning',
        title: 'Terms and Conditions',
        text: 'Please agree to the terms and conditions to continue.',
        confirmButtonColor: '#10b981',
        showConfirmButton: true,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields.',
        confirmButtonColor: '#10b981',
        showConfirmButton: true,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }
    if (!passwordRegex.test(formData.password)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Weak Password',
        text: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
        confirmButtonColor: '#10b981',
        showConfirmButton: true,
        timer: 4000,
        timerProgressBar: true
      });
      return;
    }

    try {
      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...registrationData } = formData;
      
      // Register the user first to get authentication token
      const result = await register(registrationData);
      
      // After successful registration, upload profile image if provided
      let profileImageUrl = null;
      if (profileImage) {
        try {
          // Make sure to pass the token that was returned from registration
          profileImageUrl = await uploadProfileImage(result.token);
          
          // If profile image was uploaded successfully, update user profile
          if (profileImageUrl) {
            try {
              // Update user profile with the image URL
              const updateResponse = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${result.token}`
                },
                body: JSON.stringify({ profile_image: profileImageUrl })
              });
              
              if (!updateResponse.ok) {
                console.error('Failed to update profile with image:', await updateResponse.json());
                throw new Error('Failed to update profile with image');
              }
              
              // Show success toast for image upload
              showImageUploadSuccess();
            } catch (updateError) {
              console.error('Error updating profile with image:', updateError);
              showImageUploadError('Could not update profile');
            }
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          showImageUploadError(uploadError.message || 'Upload failed');
          // Continue registration process even if image upload fails
        }
      }
      
      // Determine redirect route based on account type
      const dashboardRoutes = {
        admin: '/dashboard/admin',
        user: '/dashboard/user'
      };
      
      const redirectRoute = dashboardRoutes[result.user.account_type] || '/dashboard/user';
      
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'Welcome to Rewear! Your account has been created.',
        confirmButtonColor: '#10b981',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      
      // Redirect to appropriate dashboard
      router.push(redirectRoute);
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Show error popup
      await Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.message || 'Failed to create account. Please try again.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Try Again',
        showConfirmButton: true,
        allowOutsideClick: true,
        allowEscapeKey: true
      });
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center p-8 bg-white rounded-lg shadow-lg"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto"></div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-emerald-800 font-medium"
          >
            Redirecting you to your dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch">
      {/* Left side - Image and branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-12 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center mb-8"
          >
            <motion.div 
              whileHover={{ rotate: 5 }}
              className="h-12 w-12 flex items-center justify-center bg-white rounded-full"
            >
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </motion.div>
            <h1 className="ml-3 text-2xl font-bold">Rewear</h1>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.h2 variants={fadeIn} className="text-4xl font-bold mb-4 leading-tight">Join the sustainable fashion movement</motion.h2>
            <motion.p variants={fadeIn} className="text-lg opacity-90 mb-8">Create your account and start making a positive impact on the planet, one garment at a time.</motion.p>
          </motion.div>
        </div>
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden" 
          animate="visible"
          className="relative z-10 space-y-6"
        >
          <motion.div variants={fadeIn} className="flex items-start space-x-4">
            <motion.div 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
              className="bg-white bg-opacity-20 p-2 rounded-full"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </motion.div>
            <div>
              <h3 className="font-medium">Buy & sell pre-loved clothing</h3>
              <p className="opacity-80 text-sm">Give fashion a second chance</p>
            </div>
          </motion.div>
          
          <motion.div variants={fadeIn} className="flex items-start space-x-4">
            <motion.div 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
              className="bg-white bg-opacity-20 p-2 rounded-full"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <div>
              <h3 className="font-medium">Earn rewards</h3>
              <p className="opacity-80 text-sm">Get points for sustainable choices</p>
            </div>
          </motion.div>
          
          <motion.div variants={fadeIn} className="flex items-start space-x-4">
            <motion.div 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
              className="bg-white bg-opacity-20 p-2 rounded-full"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <div>
              <h3 className="font-medium">Join a community</h3>
              <p className="opacity-80 text-sm">Connect with like-minded eco-conscious people</p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Animated background elements */}
        <motion.div 
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 2, 0] 
          }}
          transition={{ 
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut" 
          }}
          className="absolute -bottom-8 -right-8 w-40 h-40 bg-white opacity-5 rounded-full"
        />
        <motion.div 
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -3, 0] 
          }}
          transition={{ 
            repeat: Infinity,
            duration: 7,
            ease: "easeInOut",
            delay: 1 
          }}
          className="absolute -top-16 -left-16 w-48 h-48 bg-white opacity-5 rounded-full"
        />
      </motion.div>
      
      {/* Right side - Registration form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 flex items-center justify-center p-8 bg-white md:bg-gray-50"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg bg-white rounded-xl shadow-xl p-8 transition-all duration-300"
        >
          <div className="text-center mb-6">
            <div className="mx-auto h-14 w-14 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full mb-4">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {step === 1 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                )}
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              {step === 1 ? 'Create your account' : 'Complete your profile'}
            </h2>
            <p className="text-gray-600">
              {step === 1 ? 'Join Rewear and start your sustainable fashion journey' : 'Add a few more details to get started'}
            </p>
          </div>

          {/* Progress steps */}
          <div className="relative mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((item) => (
                <motion.div 
                  key={item}
                  initial={{ scale: 1 }}
                  animate={{ 
                    scale: step === item ? 1.1 : 1,
                    backgroundColor: step >= item ? '#10b981' : '#e5e7eb'
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${step >= item ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  {item}
                </motion.div>
              ))}
            </div>
            <div className="absolute top-4 left-0 right-0 -z-10 flex">
              <div className={`h-1 flex-1 transition-all duration-300 ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
              <div className={`h-1 flex-1 transition-all duration-300 ${step >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* Full Name */}
                <motion.div variants={fadeIn}>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name
                    </span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="appearance-none relative block w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </motion.div>

                {/* Email */}
                <motion.div variants={fadeIn}>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none relative block w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={fadeIn}>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="appearance-none relative block w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.052 8.052M14.121 14.121l1.827 1.827M12 18.75v-2.625" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formData.password && formData.password.length > 0 && formData.password.length < 6 && (
                    <p className="mt-1 text-sm text-red-600">Password must be at least 6 characters long</p>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={fadeIn}>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Confirm Password
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={`appearance-none relative block w-full px-4 py-3 pl-10 border ${!passwordMatch && formData.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'} rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.052 8.052M14.121 14.121l1.827 1.827M12 18.75v-2.625" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {!passwordMatch && formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* Profile Image Upload */}
                <motion.div variants={fadeIn} className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture (Optional)
                  </label>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 relative">
                      {profileImagePreview ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden">
                          <Image 
                            src={profileImagePreview} 
                            alt="Profile preview" 
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProfileImage(null);
                              setProfileImagePreview(null);
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfileImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current.click()}
                      className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-md hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      {profileImagePreview ? 'Change Image' : 'Upload Image'}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div variants={fadeIn}>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone Number (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="appearance-none relative block w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Address */}
                <motion.div variants={fadeIn}>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Address (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      className="appearance-none relative block w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* City and State */}
                <motion.div variants={fadeIn} className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        City
                      </span>
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        State
                      </span>
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Account Type & Terms */}
            {step === 3 && (
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Account Type */}
                <motion.div variants={fadeIn}>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Account Type
                    </span>
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="relative flex items-center p-4 border border-gray-300 rounded-lg transition-all hover:border-emerald-500 hover:shadow-sm cursor-pointer">
                      <input
                        id="type-buyer"
                        name="type"
                        type="radio"
                        value="user"
                        checked={formData.type === 'user'}
                        onChange={handleChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <label htmlFor="type-buyer" className="ml-3 flex items-center cursor-pointer">
                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-3">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Buyer</p>
                          <p className="text-xs text-gray-500">Browse and purchase sustainable fashion</p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="relative flex items-center p-4 border border-gray-300 rounded-lg transition-all hover:border-emerald-500 hover:shadow-sm cursor-pointer">
                      <input
                        id="type-seller"
                        name="type"
                        type="radio"
                        value="seller"
                        checked={formData.type === 'seller'}
                        onChange={handleChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <label htmlFor="type-seller" className="ml-3 flex items-center cursor-pointer">
                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-3">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Seller</p>
                          <p className="text-xs text-gray-500">List and sell your pre-loved clothing</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    You can change this later in your profile settings
                  </p>
                </motion.div>

                {/* Terms and Conditions */}
                <motion.div variants={fadeIn} className="flex items-center">
                  <motion.input
                    whileHover={{ scale: 1.2 }}
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                    I agree to the{' '}
                    <a href="#" className="text-emerald-600 hover:text-emerald-500">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-emerald-600 hover:text-emerald-500">
                      Privacy Policy
                    </a>
                  </label>
                </motion.div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md bg-red-50 p-4"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {error}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              {step > 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={prevStep}
                  className="flex items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </motion.button>
              ) : (
                <div></div> // Empty div to maintain flex spacing
              )}

              {step < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={nextStep}
                  className="flex items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading || !agreeTerms || uploadingImage}
                  className="group relative w-32 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(loading || uploadingImage) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Register
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </>
                  )}
                </motion.button>
              )}
            </div>

            <div className="text-center">
              <p className="mt-2 text-sm text-gray-600">
                Already have an account?{' '}
                <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                  <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                    Sign in here
                  </Link>
                </motion.span>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
