// Seed initial page content for production database
import { execSync } from 'child_process';

const PAGE_CONTENT = {
  IN: [
    { key: 'hero_title', text: 'HOME OF<br />VISUAL CONTENT<br />BUILT TO RACE.' },
    { key: 'about_title', text: 'About Us' },
    { key: 'about_tagline', text: 'We Are Speed Chasers, Storytellers, And Visual Engineers For The Fast Lane.' },
    { key: 'about_paragraph_1', text: 'Born at the crossroads of horsepower and creativity, we live and breathe motorsports. From roaring circuits to adrenaline-fueled rallies, we capture the speed, drama, and soul of every event—frame by frame.' },
    { key: 'about_paragraph_2', text: "We don't just film; we engineer visual experiences that put you in the driver's seat. Whether it's a high-octane race weekend, a slick automotive ad, or brand-defining motorsport content, we deliver cinematic storytelling built for the fast lane." },
    { key: 'services_known_for_title', text: 'WE ARE<br/>KNOWN FOR' },
    { key: 'services_known_for_items', text: '["Motorsports Event Coverage", "Commercial Ad Films", "Automotive Brand Coverage", "Documentary-Style Production", "High-Speed Action Filming"]' },
    { key: 'services_event_coverage_title', text: 'Motorsports Event Coverage' },
    { key: 'services_event_coverage_description', text: 'From circuits to off-road tracks, we capture every thrilling moment with cinematic precision. Our team specializes in high-speed action shots, driver interviews, and immersive race day storytelling.' },
    { key: 'services_ad_films_title', text: 'Commercial Ad Films' },
    { key: 'services_ad_films_description', text: 'We create visually stunning ad films that showcase automotive brands in motion. From sleek product reveals to dynamic brand narratives, our productions are designed to accelerate engagement.' },
    { key: 'services_brand_coverage_title', text: 'Automotive Brand Coverage' },
    { key: 'services_brand_coverage_description', text: 'We partner with automotive brands to create compelling visual content that resonates with enthusiasts. Our coverage includes launch events, brand activations, and lifestyle content that drives connection.' },
    { key: 'gallery_title', text: 'Our Work' },
    { key: 'clients_title', text: 'Our Clients' },
    { key: 'clients_button_text', text: 'VIEW ALL CLIENTS' },
    { key: 'footer_phone', text: '+91 86086 86286' },
    { key: 'footer_email', text: 'hello@agilegrowthhackers.in' },
    { key: 'footer_address', text: '213, 2nd Floor, Ramnashree Arcade, MG Road, Bangalore - 560001' },
    { key: 'footer_copyright', text: 'Copyright @ AgileGrowthHackers2025' },
    { key: 'navbar_items', text: '["HOME","ABOUT US","SERVICES","GALLERY","CONTACT"]' }
  ],
  AE: [
    { key: 'hero_title', text: 'HOME OF<br />VISUAL CONTENT<br />BUILT TO RACE.' },
    { key: 'about_title', text: 'About Us' },
    { key: 'about_tagline', text: 'We Are Speed Chasers, Storytellers, And Visual Engineers For The Fast Lane.' },
    { key: 'about_paragraph_1', text: 'Born at the crossroads of horsepower and creativity, we live and breathe motorsports. From roaring circuits to adrenaline-fueled rallies, we capture the speed, drama, and soul of every event—frame by frame.' },
    { key: 'about_paragraph_2', text: "We don't just film; we engineer visual experiences that put you in the driver's seat. Whether it's a high-octane race weekend, a slick automotive ad, or brand-defining motorsport content, we deliver cinematic storytelling built for the fast lane." },
    { key: 'services_known_for_title', text: 'WE ARE<br/>KNOWN FOR' },
    { key: 'services_known_for_items', text: '["Motorsports Event Coverage", "Commercial Ad Films", "Automotive Brand Coverage", "Documentary-Style Production", "High-Speed Action Filming"]' },
    { key: 'services_event_coverage_title', text: 'Motorsports Event Coverage' },
    { key: 'services_event_coverage_description', text: 'From circuits to off-road tracks, we capture every thrilling moment with cinematic precision. Our team specializes in high-speed action shots, driver interviews, and immersive race day storytelling.' },
    { key: 'services_ad_films_title', text: 'Commercial Ad Films' },
    { key: 'services_ad_films_description', text: 'We create visually stunning ad films that showcase automotive brands in motion. From sleek product reveals to dynamic brand narratives, our productions are designed to accelerate engagement.' },
    { key: 'services_brand_coverage_title', text: 'Automotive Brand Coverage' },
    { key: 'services_brand_coverage_description', text: 'We partner with automotive brands to create compelling visual content that resonates with enthusiasts. Our coverage includes launch events, brand activations, and lifestyle content that drives connection.' },
    { key: 'gallery_title', text: 'Our Work' },
    { key: 'clients_title', text: 'Our Clients' },
    { key: 'clients_button_text', text: 'VIEW ALL CLIENTS' },
    { key: 'footer_phone', text: '+971 XX XXX XXXX' },
    { key: 'footer_email', text: 'hello@agileproductions.ae' },
    { key: 'footer_address', text: 'Dubai, United Arab Emirates' },
    { key: 'footer_copyright', text: 'Copyright @ Agile Productions 2025' },
    { key: 'navbar_items', text: '["HOME","ABOUT US","SERVICES","GALLERY","CONTACT"]' }
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
        `CLOUDFLARE_ACCOUNT_ID=a80eabbb536a884ecd8ba3dc123bee10 npx wrangler d1 execute agile-productions-db --remote --command "${sql}"`,
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
