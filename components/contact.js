import React from 'react';
import ContactForm from './email';
export const metadata = {
  title: 'Contact Us - Rewear',
  description: 'Get in touch with us through this form.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-green-800 mb-10 text-center">Contact Us</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          We had love to hear from you! Send us a message and we will get back to you shortly.
         
        </p>
        <ContactForm />
      </div>
    </div>
  );
}