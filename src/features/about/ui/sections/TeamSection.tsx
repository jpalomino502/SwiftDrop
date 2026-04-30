"use client";

const teamMembers = [
  {
    name: "Carlos Mendoza",
    role: "CEO & Co-Founder",
    bio: "Ingeniero de sistemas con 12 años en logística y startups fintech.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Ana Rodríguez",
    role: "CTO & Co-Founder",
    bio: "Desarrolladora full-stack especializada en sistemas de IoT y drone control.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Miguel Torres",
    role: "Head of Operations",
    bio: "Experto en optimización de rutas y gestión de flotas con 8 años de experiencia.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Laura Sánchez",
    role: "Head of Product",
    bio: "Diseñadora UX/UI enfocada en experiencias de usuario intuitivas y accesibles.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
  },
];

export function TeamSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl mb-4">
          Nuestro Equipo
        </h2>
        <p className="text-base md:text-lg text-gray-600">
          Talento y pasión detrás de SwiftDrop
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teamMembers.map((member) => (
          <div
            key={member.name}
            className="group overflow-hidden"
          >
            <div className="relative overflow-hidden h-56 bg-gray-100 mb-4">
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">
                {member.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3 font-medium">
                {member.role}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {member.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
