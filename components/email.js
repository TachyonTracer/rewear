'use client';

import { useRef } from 'react';
import emailjs from '@emailjs/browser';

export default function ContactForm() {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      'service_zwz6dwq',      // from EmailJS dashboard
      'template_5nq47o8',     // your email template id
      form.current,           // form reference
      'is3iCABwsinPZZbCK'       // your EmailJS public key
    )
    .then((result) => {
      alert('Email sent successfully!');
      console.log(result.text);
    }, (error) => {
      alert('Failed to send email.');
      console.error(error.text);
    });

    e.target.reset();
  };

  return (
    <form ref={form} onSubmit={sendEmail} className="space-y-6 bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Contact Us</h2>
      <input type="text" name="user_name" placeholder="Your Name" required className="w-full border px-4 py-2 rounded-lg" />
      <input type="email" name="user_email" placeholder="Your Email" required className="w-full border px-4 py-2 rounded-lg" />
      <textarea name="message" placeholder="Your Message" required className="w-full border px-4 py-2 rounded-lg h-28"></textarea>
      <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">Send Email</button>
    </form>
  );
}
