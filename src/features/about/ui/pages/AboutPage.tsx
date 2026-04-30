import { AboutHero } from "../sections/AboutHero";
import { MissionSection } from "../sections/MissionSection";
import { StorySection } from "../sections/StorySection";
import { TeamSection } from "../sections/TeamSection";
import { TechSection } from "../sections/TechSection";
import { ImpactSection } from "../sections/ImpactSection";
import { ContactCta } from "../sections/ContactCta";

export async function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <AboutHero />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <MissionSection />
        <StorySection />
        <TeamSection />
        <TechSection />
        <ImpactSection />
        <ContactCta />
      </div>
    </div>
  );
}
