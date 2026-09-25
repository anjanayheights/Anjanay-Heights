import { motion } from 'motion/react';

export default function Locations() {
  const locations = [
    {
      name: "Central Noida",
      desc: "Premium residential developments with excellent metro connectivity, schools, hospitals, shopping destinations, and business districts.",
      keywords: "Real estate consultant in Noida · Property consultant Noida"
    },
    {
      name: "Noida Extension",
      desc: "Modern townships featuring affordable luxury apartments, villas, and commercial investment opportunities with rapid infrastructure growth.",
      keywords: "Property consultant Noida Extension · Residential property consultant"
    },
    {
      name: "Greater Noida",
      desc: "Integrated smart city developments offering premium residential communities, educational institutions, IT parks, and industrial hubs.",
      keywords: "Real estate consultant Greater Noida · Property investment consultant"
    },
    {
      name: "Greater Noida West",
      desc: "One of the fastest-growing real estate destinations with luxury housing, commercial projects, and outstanding investment potential.",
      keywords: "Property consultant Greater Noida West · Commercial property consultant"
    },
    {
      name: "Yamuna Expressway",
      desc: "Property opportunities around the expressway corridor, major infrastructure projects and emerging investment destinations.",
      keywords: "Yamuna Expressway property consultant · Property investment"
    },
    {
      name: "Jewar",
      desc: "Emerging property market around the airport and wider infrastructure corridor, with residential, commercial and land opportunities.",
      keywords: "Jewar property consultant · Jewar real estate investment"
    },
    {
      name: "Ghaziabad",
      desc: "Residential and commercial property assistance across established neighbourhoods and growing NCR connectivity corridors.",
      keywords: "Real estate consultant Ghaziabad · Property consultant Ghaziabad"
    },
    {
      name: "Delhi NCR",
      desc: "End-to-end property buying, selling and investment assistance across selected residential, commercial, plot and land opportunities.",
      keywords: "Delhi NCR property consultant · Real estate investment consultant"
    }
  ];

  return (
    <section id="locations" className="py-20 bg-[#1A365D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-4 border-[#C2A36B] pl-8 py-2">
          <div className="text-[10px] text-[#C2A36B] font-bold uppercase tracking-widest mb-4">Noida · Greater Noida · NCR</div>
          <h2 className="text-3xl md:text-4xl font-serif font-light">
            Property Consultant Coverage Areas
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-white/70 leading-relaxed font-light">
            Find residential, commercial, plot, land and investment opportunities with Anjanay Heights across Noida, Greater Noida and key NCR growth corridors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {locations.map((loc, idx) => (
            <motion.div 
              key={loc.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1A365D] p-8 md:p-10 hover:bg-white/5 transition-colors border border-white/5"
            >
              <h3 className="text-xl font-serif text-white mb-3">{loc.name}</h3>
              <p className="text-sm text-white/70 leading-relaxed font-light">{loc.desc}</p>
              <div className="mt-5 text-[10px] font-semibold uppercase tracking-widest text-[#C2A36B]">{loc.keywords}</div>
              <a
                href={"/locations/"+(loc.name==="Central Noida"?"noida":loc.name.toLowerCase().replace(/ /g,"-"))}
                className="inline-flex mt-6 text-[10px] font-bold uppercase tracking-widest text-white hover:text-[#C2A36B] transition-colors"
              >
                View Properties →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
