import React from 'react';
import Hero from "./animated-shader-hero";

// Demo Component showing how to use the Hero
const HeroDemo: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const handlePrimaryClick = () => {
    console.log('Get Started clicked!');
    alert('Get Started clicked!');
  };

  const handleSecondaryClick = () => {
    console.log('Explore Features clicked!');
    alert('Explore Features clicked!');
  };

  return (
    <div className="w-full min-h-screen text-white relative">
      {/* Absolute Back Button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-50 px-4 py-2 bg-black/60 hover:bg-black border border-white/20 hover:border-white/50 text-white rounded-lg text-xs font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition-all active:scale-95"
        >
          ⬅️ መመለሻ (Back to Lodge Portal)
        </button>
      )}

      <Hero
        trustBadge={{
          text: "Hawassa Paradise Digital Immersive Experiences.",
          icons: ["✨"]
        }}
        headline={{
          line1: "Launch Your",
          line2: "Lodge Stay Into Orbit"
        }}
        subtitle="Supercharge your vacation or business retreat with premium hospitality, digital touch-less smart ordering, automated room controls, and stunning lake views."
        buttons={{
          primary: {
            text: "Book Your Room Now",
            onClick: handlePrimaryClick
          },
          secondary: {
            text: "Explore Digital Menu",
            onClick: handleSecondaryClick
          }
        }}
      />
      
      {/* Additional content below hero */}
      <div className="bg-[#121212] border-t border-white/15 p-8 md:p-12 relative z-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight mb-4 uppercase">
            🛠️ How to Use the Hero Component (የአጠቃቀም መመሪያ)
          </h2>
          <p className="text-xs text-white/60 mb-6 leading-relaxed">
            ይህ የአኒሜሽን ሼደር ጀማሪ ገጽ (Animated Shader Hero Component) በዌብ-ጂኤል (WebGL2) የተደገፈ እና በተጠቃሚው ጣት ወይም ማውዝ ንክኪ የሚነቃቃ ተንቀሳቃሽ ህያው የጀርባ አኒሜሽን ያለው ነው። ለዲጂታል ሲስተም ማስተዋወቂያ፣ ለዋና መግቢያ ገጽ እንዲሁም ለአስደናቂ የእይታ ማሳያነት ያገለግላል።
          </p>

          <div className="bg-[#0b0b0b] border border-white/10 p-6 rounded-xl shadow-lg">
            <pre className="text-xs text-[#C1FF00] overflow-x-auto font-mono leading-relaxed">
{`import Hero from "@/src/components/ui/animated-shader-hero";

<Hero
  trustBadge={{
    text: "Your trust badge text",
    icons: ["🚀", "⭐", "✨"] // optional
  }}
  headline={{
    line1: "Your First Line",
    line2: "Your Second Line"
  }}
  subtitle="Your compelling subtitle text goes here..."
  buttons={{
    primary: {
      text: "Primary CTA",
      onClick: handlePrimaryClick
    },
    secondary: {
      text: "Secondary CTA", 
      onClick: handleSecondaryClick
    }
  }}
  className="custom-classes" // optional
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDemo;
