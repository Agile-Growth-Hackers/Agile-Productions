// Seed initial page content for production database
import { execSync } from 'child_process';

const PAGE_CONTENT = {
  IN: [
    { key: 'hero_title', text: 'HOME OF<br />VISUAL CONTENT<br />BUILT TO RACE.' },
    { key: 'about_title', text: 'About Us' },
    { key: 'about_tagline', text: 'We Are Speed Chasers, Storytellers, And Visual Engineers For The Fast Lane.' },
    { key: 'about_content', text: '<p>Born at the crossroads of horsepower and creativity, we specialize in capturing the untamed energy of motorsports and the raw passion behind every automotive event. Whether it\'s the roar of a superbike at the apex, the freedom of a long ride shared with a pack, or the intimate silence of a key handover at a showroom, we transform fleeting moments into lasting cinematic experiences that resonate deeply with your audience.</p><p>At Agile, every frame we shoot is built to race bold, precise, and impossible to ignore.</p>' },
    { key: 'services_known_for_title', text: 'WE ARE<br/>KNOWN FOR' },
    { key: 'services_known_for_items', text: '<ul><li>Motorsports Coverage: Track days, Championships, Behind-The-Scenes</li><li>Automotive Events: Product launches, Community Rides, Dealership Experiences</li><li>Ad Films & Commercials: High-quality promotional videos designed for engagement</li></ul>' },
    { key: 'services_event_coverage_title', text: 'EVENT<br/>COVERAGE' },
    { key: 'services_event_coverage_description', text: 'We specialize in bringing automotive events to life with vibrant footage and emotional resonance. Rolls-Royce Private Dinner, Malaysian Harley Davidson Gathering, Dosas With Ducati, BMW 1000RR Ride, Malaysian Auto Expo, Rynox Store Launch, Sip A Cofftee With 6kiom' },
    { key: 'services_ad_films_title', text: 'AD & PROMO FILMS' },
    { key: 'services_ad_films_description', text: '<p>We craft ad films that fuel your brand\'s presence</p><ul><li>Instagram Reels, Shorts & YouTube Ads</li><li>Dealer Testimonials with cinematic visuals</li><li>Campaigns for automotive brands and gear companies</li></ul>' },
    { key: 'services_brand_coverage_title', text: 'BRAND COVERAGE' },
    { key: 'services_brand_coverage_description', text: 'We create powerful visuals for automotive brands like Rolls-Royce, Bentley, Lexus, Ultraviolette, Ducati and more capturing their identity, performance, and lifestyle with impact.' },
    { key: 'footer_phone', text: '+91 86086 86286' },
    { key: 'footer_email', text: 'hello@agilegrowthhackers.in' },
    { key: 'footer_address', text: '213, 2nd Floor, Ramnashree Arcade, MG Road, Bangalore - 560001' },
    { key: 'footer_copyright', text: 'Copyright @ AgileGrowthHackers2025' }
  ],
  AE: [
    { key: 'hero_title', text: 'HOME OF<br />VISUAL CONTENT<br />BUILT TO RACE.' },
    { key: 'about_title', text: 'About Us' },
    { key: 'about_tagline', text: 'We Are Speed Chasers, Storytellers, And Visual Engineers For The Fast Lane.' },
    { key: 'about_content', text: '<p>Born at the crossroads of horsepower and creativity, we specialize in capturing the untamed energy of motorsports and the raw passion behind every automotive event. Whether it\'s the roar of a superbike at the apex, the freedom of a long ride shared with a pack, or the intimate silence of a key handover at a showroom, we transform fleeting moments into lasting cinematic experiences that resonate deeply with your audience.</p><p>At Agile, every frame we shoot is built to race bold, precise, and impossible to ignore.</p>' },
    { key: 'services_known_for_title', text: 'WE ARE<br/>KNOWN FOR' },
    { key: 'services_known_for_items', text: '<ul><li>Motorsports Coverage: Track days, Championships, Behind-The-Scenes</li><li>Automotive Events: Product launches, Community Rides, Dealership Experiences</li><li>Ad Films & Commercials: High-quality promotional videos designed for engagement</li></ul>' },
    { key: 'services_event_coverage_title', text: 'EVENT<br/>COVERAGE' },
    { key: 'services_event_coverage_description', text: 'We specialize in bringing automotive events to life with vibrant footage and emotional resonance. Rolls-Royce Private Dinner, Malaysian Harley Davidson Gathering, Dosas With Ducati, BMW 1000RR Ride, Malaysian Auto Expo, Rynox Store Launch, Sip A Cofftee With 6kiom' },
    { key: 'services_ad_films_title', text: 'AD & PROMO FILMS' },
    { key: 'services_ad_films_description', text: '<p>We craft ad films that fuel your brand\'s presence</p><ul><li>Instagram Reels, Shorts & YouTube Ads</li><li>Dealer Testimonials with cinematic visuals</li><li>Campaigns for automotive brands and gear companies</li></ul>' },
    { key: 'services_brand_coverage_title', text: 'BRAND COVERAGE' },
    { key: 'services_brand_coverage_description', text: 'We create powerful visuals for automotive brands like Rolls-Royce, Bentley, Lexus, Ultraviolette, Ducati and more capturing their identity, performance, and lifestyle with impact.' },
    { key: 'footer_phone', text: '+971 XX XXX XXXX' },
    { key: 'footer_email', text: 'hello@agileproductions.ae' },
    { key: 'footer_address', text: 'Dubai, United Arab Emirates' },
    { key: 'footer_copyright', text: 'Copyright @ Agile Productions 2025' }
  ]
};

function escapeForSQL(str) {
  return str.replace(/'/g, "''");
}

async function seedRegion(regionCode, content) {
  console.log(`\n📝 Seeding content for region: ${regionCode}`);

  for (const item of content) {
    const sql = `INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('${regionCode}', '${item.key}', '${escapeForSQL(item.text)}');`;

    try {
      execSync(
        `npx wrangler d1 execute agile-productions-db --remote --command "${sql}"`,
        {
          cwd: process.cwd(),
          stdio: 'pipe',
          encoding: 'utf-8'
        }
      );
      console.log(`   ✅ ${item.key}`);
    } catch (error) {
      console.error(`   ❌ Failed to insert ${item.key}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting production database content seeding...\n');

  // Seed IN region
  await seedRegion('IN', PAGE_CONTENT.IN);

  // Seed AE region
  await seedRegion('AE', PAGE_CONTENT.AE);

  console.log('\n✅ Seeding complete!');
}

main().catch(console.error);
