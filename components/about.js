export const metadata = {
  title: 'About Us - ReWear',
  description: 'Learn about the ReWear vision and team behind the sustainable clothing swap movement.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-20">
        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-green-800 mb-6">About ReWear</h1>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
            <span className="font-bold text-green-800">ReWear</span> is a community-driven platform that
            allows people to swap their gently used clothes with others. It’s our way of promoting 
            sustainable fashion by giving old garments a new home — reducing waste and encouraging 
            eco-friendly wardrobe habits.
          </p>
        </div>

        {/* Mission */}
        <div>
          <h2 className="text-4xl font-bold text-green-700 mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            At ReWear, we aim to create a culture where swapping clothes becomes as natural as buying them. 
            By connecting people who care about the planet, we reduce landfill waste, limit overproduction, 
            and make sustainable fashion accessible for everyone.
          </p>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-4xl font-bold text-green-700 mb-8">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              'Priyansh Pankhaniya',
              'Darshan Patanvadiya',
              'Harsh Chavda',
              'Virang Chandresha',
            ].map((member, index) => (
              <div
                key={index}
                className="text-center bg-white p-8 rounded-3xl shadow-xl hover:scale-105 transition duration-300"
              >
                <div className="w-20 h-20 mx-auto bg-green-200 text-green-800 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
                  {member.split(' ')[0][0]}
                </div>
                <h3 className="text-xl font-semibold text-green-800">{member}</h3>
                <p className="text-gray-500 text-sm mt-1">Co-Founder</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
