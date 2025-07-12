// pages/about.js or app/about/page.js
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const About = () => {
  const teamMembers = [
    { name: 'Priyansh Pankhaniya', role: 'Co-Founder & Developer', initials: 'PP' },
    { name: 'Darshan Patanvadiya', role: 'Co-Founder & Developer', initials: 'DP' },
    { name: 'Harsh Chavda', role: 'Co-Founder & Developer', initials: 'HC' },
    { name: 'Virang Chandresha', role: 'Co-Founder & Developer', initials: 'VC' }
  ];

  const features = [
    {
      number: '1',
      title: 'Upload Your Clothes',
      description: 'Take photos of your pre-loved clothing items and upload them to our platform with detailed descriptions.'
    },
    {
      number: '2',
      title: 'Browse & Discover',
      description: 'Explore thousands of unique clothing items from our community members and find pieces that match your style.'
    },
    {
      number: '3',
      title: 'Swap & Refresh',
      description: 'Connect with other users and arrange clothing swaps, giving your wardrobe a fresh new look sustainably.'
    }
  ];

  const benefits = [
    {
      icon: '♻️',
      title: 'Eco-Friendly',
      description: 'Reduce textile waste and carbon footprint by giving clothes a second life through our sustainable swapping platform.'
    },
    {
      icon: '💰',
      title: 'Cost-Effective',
      description: 'Refresh your wardrobe without breaking the bank. Swap clothes instead of buying new ones.'
    },
    {
      icon: '👥',
      title: 'Community-Driven',
      description: 'Connect with like-minded individuals who share your passion for sustainable fashion and conscious living.'
    }
  ];

  return (
    <>
      <Head>
        <title>About Us - Rewear</title>
        <meta name="description" content="Learn about Rewear's mission to create a sustainable fashion ecosystem through clothing swaps and circular economy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="font-sans bg-gradient-to-br from-green-50 to-green-100 min-h-screen">
        
       
        

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-white bg-opacity-10 animate-pulse"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">About Rewear</h1>
            <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
              Transforming the way we think about fashion through sustainable clothing swaps and community-driven circular economy
            </p>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Mission & Vision */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold text-gray-800 text-center mb-12 relative">
              Our Mission & Vision
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-4"></div>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🌱
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  To create a sustainable fashion ecosystem where pre-loved clothes find new homes, 
                  reducing textile waste and promoting conscious consumption through community-driven clothing swaps.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🌍
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To build a world where fashion is circular, accessible, and environmentally responsible, 
                  where every piece of clothing gets a second chance to be loved and worn.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold text-gray-800 text-center mb-12 relative">
              How Rewear Works
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-4"></div>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-500"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-6">
                    {feature.number}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold text-gray-800 text-center mb-12 relative">
              Meet Our Team
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-4"></div>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 group-hover:scale-110 transition-transform relative z-10">
                    {member.initials}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 relative z-10">{member.name}</h3>
                  <p className="text-green-500 font-medium relative z-10">{member.role}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold text-gray-800 text-center mb-12 relative">
              Why Choose Rewear?
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-4"></div>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 animate-pulse"></div>
            <div className="text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Give Your Clothes a Second Life?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of fashion-conscious individuals who are making a difference, one swap at a time.
              </p>
              <Link href="/signup" className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                Join Rewear Today
              </Link>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </>
  );
};

export default About;
