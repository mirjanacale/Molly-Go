import { useRef, useState, useEffect, useCallback } from "react";
import ChatBot from "./components/ChatBot.jsx";

// ─── Scroll reveal hook ───
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── Staggered card slide-in ───
function useCardSlideIn(ref) {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const cards = container.querySelectorAll(".card-slide-in");
          cards.forEach((card, i) => {
            setTimeout(() => card.classList.add("visible"), i * 100);
          });
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, []);
}

// ─── Image with gradient fallback ───
function Img({ src, alt, className = "", gradient = "from-molly-amber to-molly-orange" }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className={`bg-gradient-to-br ${gradient} ${className}`} />;
  }
  return (
    <img src={src} alt={alt} loading="lazy"
         onError={() => setFailed(true)}
         className={`object-cover ${className}`} />
  );
}

// ═══════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1555990793-da11153b2473?auto=format&fit=crop&w=1920&q=80",
];

const DESTINATIONS = [
  { name: "Kyoto", country: "Japan", emoji: "🌸", query: "Hotels in Kyoto",
    desc: "Ancient temples, cherry blossoms, and centuries of artistic tradition. Kyoto is the soul of Japanese culture.",
    img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80",
    gradient: "from-pink-400 to-rose-600" },
  { name: "Florence", country: "Italy", emoji: "🎨", query: "Hotels in Florence",
    desc: "The birthplace of the Renaissance. Every street is a gallery, every piazza a masterpiece.",
    img: "https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-400 to-orange-600" },
  { name: "Marrakech", country: "Morocco", emoji: "🕌", query: "Hotels in Marrakech",
    desc: "A sensory explosion of colors, spices, and intricate mosaics. The medina is a living artwork.",
    img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=600&q=80",
    gradient: "from-red-400 to-orange-600" },
  { name: "Santorini", country: "Greece", emoji: "🏛️", query: "Hotels in Santorini",
    desc: "White-washed villages against deep blue seas. Sunsets here are the stuff of legend.",
    img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80",
    gradient: "from-blue-400 to-cyan-600" },
  { name: "Zagreb", country: "Croatia", emoji: "🏰", query: "Hotels in Zagreb",
    desc: "A hidden gem with vibrant street art, cozy cafés, and a thriving contemporary art scene.",
    img: "https://images.unsplash.com/photo-1555990793-da11153b2473?auto=format&fit=crop&w=600&q=80",
    gradient: "from-teal-400 to-emerald-600" },
  { name: "Barcelona", country: "Spain", emoji: "🎪", query: "Hotels in Barcelona",
    desc: "Gaudí's surreal architecture, Mediterranean beaches, and a nightlife that never stops.",
    img: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80",
    gradient: "from-yellow-400 to-amber-600" },
  { name: "Prague", country: "Czech Republic", emoji: "🌉", query: "Hotels in Prague",
    desc: "Gothic spires, baroque palaces, and the most magical Christmas markets in Europe.",
    img: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-400 to-purple-600" },
  { name: "Amsterdam", country: "Netherlands", emoji: "🌷", query: "Hotels in Amsterdam",
    desc: "World-class museums, canal-side charm, and a creative spirit that's impossible to resist.",
    img: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=600&q=80",
    gradient: "from-orange-400 to-red-500" },
];

const FESTIVALS = [
  { name: "Cherry Blossom Season", location: "Kyoto, Japan", date: "Mar – Apr",
    desc: "Witness thousands of cherry trees transform Japan into a pink wonderland. Hanami picnics under the blossoms are a centuries-old tradition.",
    img: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=500&q=80",
    gradient: "from-pink-300 to-pink-500", query: "Hotels in Kyoto" },
  { name: "Carnival of Venice", location: "Venice, Italy", date: "Feb",
    desc: "Elaborate masks, gondola parades, and costume balls in the world's most romantic city. A feast for the senses.",
    img: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=500&q=80",
    gradient: "from-violet-400 to-purple-600", query: "Hotels in Venice" },
  { name: "Diwali Festival", location: "Jaipur, India", date: "Oct – Nov",
    desc: "The festival of lights illuminates every corner of India. Fireworks, lanterns, sweets, and deep spiritual meaning.",
    img: "https://images.unsplash.com/photo-1574265935856-0015041ecca4?auto=format&fit=crop&w=500&q=80",
    gradient: "from-amber-400 to-orange-500", query: "Hotels in Jaipur" },
  { name: "La Tomatina", location: "Buñol, Spain", date: "Aug",
    desc: "The world's biggest food fight. Tens of thousands hurl tomatoes in this legendary Spanish festival.",
    img: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=500&q=80",
    gradient: "from-red-400 to-rose-600", query: "Hotels in Valencia" },
  { name: "Oktoberfest", location: "Munich, Germany", date: "Sep – Oct",
    desc: "Beer, bratwurst, and Bavarian culture at the world's largest folk festival. Six million visitors annually.",
    img: "https://images.unsplash.com/photo-1505489435671-80a165c60816?auto=format&fit=crop&w=500&q=80",
    gradient: "from-yellow-400 to-amber-500", query: "Hotels in Munich" },
];

const ART_EXPERIENCES = [
  { title: "Watercolor in Tuscany", location: "Florence, Italy", duration: "5 days", price: "$890",
    desc: "Paint the rolling hills of Tuscany with a local master artist. Includes vineyard visits, studio time, and all materials.",
    img: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=500&q=80",
    gradient: "from-amber-400 to-orange-500", query: "Hotels in Florence" },
  { title: "Pottery Workshop", location: "Kyoto, Japan", duration: "3 days", price: "$450",
    desc: "Learn the ancient art of Japanese pottery from a 4th-generation ceramicist in a traditional Kyoto workshop.",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=500&q=80",
    gradient: "from-rose-400 to-pink-500", query: "Hotels in Kyoto" },
  { title: "Street Art Tour", location: "Berlin, Germany", duration: "1 day", price: "$65",
    desc: "Explore Berlin's legendary street art scene with a local graffiti artist. From Kreuzberg to Friedrichshain.",
    img: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&w=500&q=80",
    gradient: "from-fuchsia-400 to-purple-500", query: "Hotels in Berlin" },
  { title: "Mosaic Masterclass", location: "Marrakech, Morocco", duration: "4 days", price: "$520",
    desc: "Create traditional Zellige mosaics with Moroccan artisans in the heart of the Marrakech medina.",
    img: "https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=500&q=80",
    gradient: "from-teal-400 to-emerald-500", query: "Hotels in Marrakech" },
];

const TESTIMONIALS = [
  { name: "Sarah M.", location: "London, UK", rating: 5,
    text: "MOLLY found us a hidden boutique hotel in Florence that wasn't on any other platform. The art workshop she recommended was life-changing!",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
  { name: "James K.", location: "Toronto, Canada", rating: 5,
    text: "Booked a full week in Kyoto during cherry blossom season through MOLLY. Every recommendation was spot on. Best trip of my life.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
  { name: "Ana L.", location: "Zagreb, Croatia", rating: 5,
    text: "As an artist, I love how MOLLY understands cultural travel. She suggested a pottery workshop in Japan that I never would have found on my own.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" },
  { name: "Marco D.", location: "Barcelona, Spain", rating: 4,
    text: "The festival recommendations are incredible. MOLLY helped me plan around Carnival in Venice — the hotel was perfect and the timing was flawless.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" },
];

// ═══════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════

// ─── Section dividers ───
function WaveDivider({ from, to, flip = false }) {
  return (
    <div className={`relative h-16 md:h-24 -mb-px ${flip ? "rotate-180" : ""}`}
         style={{ background: from }}>
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none"
           className="absolute bottom-0 w-full h-full">
        <path d="M0,40 C360,100 1080,0 1440,60 L1440,100 L0,100 Z" fill={to} />
      </svg>
    </div>
  );
}

function CurveDivider({ from, to }) {
  return (
    <div className="relative h-16 md:h-24 -mb-px" style={{ background: from }}>
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none"
           className="absolute bottom-0 w-full h-full">
        <path d="M0,80 Q720,0 1440,80 L1440,100 L0,100 Z" fill={to} />
      </svg>
    </div>
  );
}

function DiagonalDivider({ from, to }) {
  return (
    <div className="relative h-12 md:h-20 -mb-px" style={{ background: from }}>
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none"
           className="absolute bottom-0 w-full h-full">
        <path d="M0,30 L1440,100 L1440,100 L0,100 Z" fill={to} />
      </svg>
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div className="text-center mb-10">
      <h2 className="text-3xl md:text-4xl font-bold font-poppins text-gray-800">
        {children}
      </h2>
      {sub && <p className="mt-3 text-gray-500 max-w-xl mx-auto">{sub}</p>}
    </div>
  );
}

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? "text-molly-amber" : "text-gray-300"}>★</span>
      ))}
    </div>
  );
}

// ─── Detail Modal ───
function DetailModal({ item, onClose, onAskMolly }) {
  if (!item) return null;

  const title = item.title || item.name;
  const location = item.location || [item.country, item.name].filter(Boolean).join(" · ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg
                      max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>

        {/* Image */}
        <div className="relative h-56 overflow-hidden rounded-t-2xl">
          <Img src={item.img} alt={title} gradient={item.gradient}
               className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button onClick={onClose}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/30 hover:bg-black/50
                             rounded-full flex items-center justify-center text-white
                             transition-colors text-lg leading-none">
            ×
          </button>
          {/* Badges */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs text-white/70 uppercase tracking-wider">
              {item.country || ""}
            </p>
            <h3 className="text-2xl font-bold text-white font-poppins leading-tight">
              {item.emoji ? `${item.emoji} ` : ""}{title}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            📍 {location}
          </p>

          {item.desc && (
            <p className="text-gray-700 leading-relaxed">{item.desc}</p>
          )}

          {/* Meta row */}
          {(item.date || item.duration || item.price) && (
            <div className="flex flex-wrap gap-3">
              {item.date && (
                <span className="px-3 py-1 bg-orange-50 text-molly-orange rounded-full text-xs font-medium">
                  📅 {item.date}
                </span>
              )}
              {item.duration && (
                <span className="px-3 py-1 bg-orange-50 text-molly-orange rounded-full text-xs font-medium">
                  ⏱️ {item.duration}
                </span>
              )}
              {item.price && (
                <span className="px-3 py-1 bg-orange-50 text-molly-orange rounded-full text-xs font-medium font-bold">
                  {item.price}
                </span>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { onAskMolly(item.query || `Hotels in ${item.name}`); onClose(); }}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm
                         bg-gradient-to-r from-molly-amber to-molly-orange
                         hover:shadow-lg hover:shadow-amber-200
                         hover:-translate-y-0.5 active:translate-y-0 transition-all">
              💬 Ask Molly
            </button>
            <button
              onClick={() => { onAskMolly(`Hotels in ${item.name || title}`); onClose(); }}
              className="flex-1 py-3 rounded-xl font-semibold text-sm
                         border-2 border-molly-amber text-molly-orange
                         hover:bg-molly-amber hover:text-white
                         hover:-translate-y-0.5 active:translate-y-0 transition-all">
              🏨 Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════

export default function App() {
  const chatbotRef = useRef(null);
  const chatSectionRef = useRef(null);

  const [heroIdx, setHeroIdx] = useState(0);
  const [modalItem, setModalItem] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const [destRef, destVis] = useScrollReveal();
  const [festRef, festVis] = useScrollReveal();
  const [artRef, artVis] = useScrollReveal();
  const [testRef, testVis] = useScrollReveal();

  const destCardsRef = useRef(null);
  const artCardsRef = useRef(null);
  const testCardsRef = useRef(null);
  useCardSlideIn(destCardsRef);
  useCardSlideIn(artCardsRef);
  useCardSlideIn(testCardsRef);

  const sendToMolly = useCallback((query) => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => chatbotRef.current?.sendMessage(query), 500);
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ═══ HERO ═══ */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div key={i}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out
              ${i === heroIdx ? "opacity-100" : "opacity-0"}`}>
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in-down">
            <img src="/images/mipmap-xxxhdpi/ic_launcher_foreground.png" alt="MOLLY Go"
                 className="h-10 w-10 object-contain drop-shadow-lg" />
            <p className="text-white/70 text-sm tracking-[0.3em] uppercase font-inter">
              MOLLY Go Travel
            </p>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-white
                         drop-shadow-xl leading-tight mb-5 animate-fade-in-up">
            Discover the World<br />
            Through <span className="text-molly-amber">Art & Culture</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mb-8 font-inter
                        leading-relaxed animate-fade-in-up animation-delay-200">
            Festivals, galleries, hidden workshops, and once-in-a-lifetime cultural
            experiences — curated by AI, booked in seconds.
          </p>
          <button
            onClick={() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3.5 bg-gradient-to-r from-molly-amber to-molly-orange
                       text-white rounded-full font-semibold shadow-xl
                       hover:shadow-amber-400/40 hover:-translate-y-1
                       active:translate-y-0 transition-all animate-fade-in-up animation-delay-400">
            Start Planning Your Trip
          </button>
        </div>
      </section>

      {/* Hero → Chatbot divider */}
      <WaveDivider from="#111" to="#2a6b6b" />

      {/* ═══ CHATBOT — directly under hero, full width ═══ */}
      <section ref={chatSectionRef} className="relative overflow-hidden"
               style={{ backgroundColor: "#2a6b6b" }}>
        <div className="dragon-breathe absolute inset-[-3%] pointer-events-none"
             style={{
               backgroundImage: "url('/images/mipmap-xxxhdpi/ic_launcher_foreground.png')",
               backgroundSize: "cover",
               backgroundPosition: "center center",
               backgroundRepeat: "no-repeat",
             }} />
        <div className="relative z-10 pt-10 pb-2 px-4 text-center">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-white drop-shadow-lg">
              💬 Chat with MOLLY
            </h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto drop-shadow">
              Tell MOLLY where you want to go — she'll find hotels, events, and experiences instantly.
            </p>
          </div>
        </div>
        <div className="relative z-10 min-h-[200px]">
          <ChatBot ref={chatbotRef} />
        </div>
      </section>

      {/* Chatbot → Destinations divider */}
      <CurveDivider from="#2a6b6b" to="#ffffff" />

      {/* ═══ TRENDING DESTINATIONS ═══ */}
      <section ref={destRef}
               className={`py-20 px-4 bg-white scroll-reveal ${destVis ? "revealed" : ""}`}>
        <div className="max-w-6xl mx-auto">
          <SectionTitle sub="Hand-picked destinations where art, culture, and joy meet.">
            🌍 Trending Destinations
          </SectionTitle>
          <div ref={destCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DESTINATIONS.map((d, i) => (
              <div key={d.name}
                   onClick={() => setModalItem(d)}
                   className="card-slide-in amber-glow group relative rounded-2xl overflow-hidden h-72 cursor-pointer
                              shadow-lg hover:-translate-y-2 transition-all
                              duration-300">
                <Img src={d.img} alt={d.name} gradient={d.gradient}
                     className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-xs text-white/70 uppercase tracking-wider">{d.country}</p>
                  <h3 className="text-xl font-bold text-white font-poppins">{d.emoji} {d.name}</h3>
                  <div className="mt-3 inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm
                                  rounded-full text-xs text-white font-medium
                                  group-hover:bg-molly-amber group-hover:text-white transition-colors">
                    Explore →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations → Festivals divider */}
      <DiagonalDivider from="#ffffff" to="#2a6b6b" />

      {/* ═══ UPCOMING FESTIVALS ═══ */}
      <section ref={festRef}
               className="relative py-20 px-4 overflow-hidden"
               style={{ backgroundColor: "#2a6b6b" }}>
        <div className="dragon-breathe absolute inset-[-3%] pointer-events-none"
             style={{
               backgroundImage: "url('/images/mipmap-xxxhdpi/ic_launcher_foreground.png')",
               backgroundSize: "cover",
               backgroundPosition: "center center",
               backgroundRepeat: "no-repeat",
             }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-white drop-shadow-lg">
              🎪 Upcoming Festivals
            </h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto drop-shadow">
              Don't miss the world's most vibrant celebrations.
            </p>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory
                          scrollbar-hide -mx-4 px-4">
            {FESTIVALS.map((f) => (
              <div key={f.name}
                   onClick={() => setModalItem(f)}
                   className="amber-glow flex-shrink-0 w-72 snap-start rounded-2xl overflow-hidden
                              shadow-lg hover:-translate-y-2
                              transition-all duration-300 bg-white cursor-pointer">
                <div className="relative h-44">
                  <Img src={f.img} alt={f.name} gradient={f.gradient} className="w-full h-full" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm
                                  rounded-lg px-3 py-1 shadow-sm">
                    <span className="text-xs font-bold text-molly-orange">{f.date}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 font-poppins">{f.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">📍 {f.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Festivals → Art divider */}
      <WaveDivider from="#2a6b6b" to="#fff7ed" />

      {/* ═══ ART EXPERIENCES ═══ */}
      <section ref={artRef}
               className={`py-20 px-4 bg-orange-50 scroll-reveal ${artVis ? "revealed" : ""}`}>
        <div className="max-w-6xl mx-auto">
          <SectionTitle sub="Hands-on workshops, gallery walks, and creative immersions around the globe.">
            🎨 Art & Culture Experiences
          </SectionTitle>
          <div ref={artCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ART_EXPERIENCES.map((exp) => (
              <div key={exp.title}
                   onClick={() => setModalItem(exp)}
                   className="card-slide-in amber-glow bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer
                              hover:-translate-y-2 transition-all duration-300">
                <div className="relative h-48">
                  <Img src={exp.img} alt={exp.title} gradient={exp.gradient} className="w-full h-full" />
                </div>
                <div className="p-5">
                  <h4 className="font-semibold text-gray-800 font-poppins text-sm">{exp.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">📍 {exp.location}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{exp.duration}</span>
                    <span className="text-sm font-bold text-molly-orange">{exp.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Art → Testimonials divider */}
      <CurveDivider from="#fff7ed" to="#ffffff" />

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionTitle sub="Real stories from travelers who found joy with MOLLY.">
            ⭐ What Travelers Say
          </SectionTitle>
          <div ref={testCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name}
                   className="card-slide-in amber-glow bg-white rounded-2xl p-6 shadow-lg border border-gray-100
                              hover:-translate-y-1 transition-all duration-300">
                <Stars count={t.rating} />
                <p className="mt-4 text-sm text-gray-600 leading-relaxed italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                  <Img src={t.avatar} alt={t.name} gradient="from-molly-amber to-molly-orange"
                       className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials → Footer divider */}
      <DiagonalDivider from="#ffffff" to="#111827" />

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <img src="/images/mipmap-xxxhdpi/ic_launcher_foreground.png" alt="MOLLY Go"
                     className="h-8 w-8 object-contain" />
                <h3 className="text-xl font-bold font-poppins">MOLLY Go</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Go Where Joy Lives. AI-powered travel for art lovers and culture seekers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>🏨 Real-time hotels</li>
                <li>🎪 Local events & festivals</li>
                <li>🤖 AI-powered planning</li>
                <li>🌍 200+ countries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Our World</h4>
              <ul className="space-y-2 text-sm">
                {["MollyFinishArt", "Mollycolor", "Blockart", "Mollavie"].map((s) => (
                  <li key={s}><a href={`https://${s.toLowerCase()}.com`} target="_blank" rel="noopener noreferrer"
                       className="text-gray-500 hover:text-molly-amber transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Connect</h4>
              <div className="flex gap-3">
                {["Instagram", "Twitter", "Facebook", "YouTube"].map((s) => (
                  <span key={s}
                    className="w-9 h-9 rounded-full bg-gray-800 hover:bg-molly-amber
                               flex items-center justify-center text-xs text-gray-400
                               hover:text-white transition-all cursor-pointer">
                    {s[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row
                          items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} MOLLY Go. All rights reserved. Powered by LiteAPI & Gemini.
            </p>
            <div className="flex gap-4 text-xs text-gray-600">
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Support</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ DETAIL MODAL ═══ */}
      {modalItem && (
        <DetailModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onAskMolly={sendToMolly}
        />
      )}
    </div>
  );
}
