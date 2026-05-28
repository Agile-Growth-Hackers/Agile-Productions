#!/usr/bin/env node
/**
 * Upload section images to the production storage API.
 *
 * Usage:
 *   $env:ADMIN_USERNAME='<user>'; $env:ADMIN_PASSWORD='<pass>'; node scripts/upload-section-images.js
 *
 * Flags:
 *   --api-url=<url>          Override API base URL
 *   --motorsports-dir=<path> Override MOTORSPORTS folder path
 *   --crew-dir=<path>        Override Crew folder path
 *   --help                   Show this help
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`Usage:
  $env:ADMIN_USERNAME='<user>'; $env:ADMIN_PASSWORD='<pass>'; node scripts/upload-section-images.js

Flags:
  --api-url=<url>          Override API base URL
  --motorsports-dir=<path> Override MOTORSPORTS folder path
  --crew-dir=<path>        Override Crew folder path
  --help                   Show this help
`);
  process.exit(0);
}

function getFlag(name) {
  const prefix = `--${name}=`;
  const found = args.find(a => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

const API_BASE_URL =
  getFlag('api-url') ||
  process.env.API_URL ||
  'https://agile-productions-api.cool-bonus-e67f.workers.dev';

const DEFAULT_MOTORSPORTS_DIR =
  'C:\\Users\\itisc\\OneDrive\\Desktop\\DELETE LATER\\AGILE PRODUCTIONS\\Images for Website\\Images for Website\\MOTORSPORTS';

const DEFAULT_CREW_DIR =
  'C:\\Users\\itisc\\OneDrive\\Desktop\\DELETE LATER\\AGILE PRODUCTIONS\\Images for Website\\Images for Website\\Crew';

const MOTORSPORTS_DIR = getFlag('motorsports-dir') || DEFAULT_MOTORSPORTS_DIR;
const CREW_DIR = getFlag('crew-dir') || DEFAULT_CREW_DIR;

const GENERATED_JSON_PATH = path.resolve(
  fileURLToPath(import.meta.url),
  '../../../frontend/src/data/sectionImageUrls.generated.json'
);

// ---------------------------------------------------------------------------
// Credentials check
// ---------------------------------------------------------------------------

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error(
    'Error: ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required.\n' +
    'Example (PowerShell):\n' +
    "  $env:ADMIN_USERNAME='myuser'; $env:ADMIN_PASSWORD='mypass'; node scripts/upload-section-images.js"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

async function login() {
  const url = `${API_BASE_URL}/api/auth/login`;
  console.log(`Logging in to ${url} as ${ADMIN_USERNAME} …`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.error || JSON.stringify(body);
    } catch (_) {
      detail = await response.text();
    }
    console.error(`Login failed (${response.status}): ${detail}`);
    process.exit(1);
  }

  const body = await response.json();
  const { token, csrfToken, csrfHeader } = body;

  if (!token || !csrfToken || !csrfHeader) {
    console.error('Login response missing expected fields (token / csrfToken / csrfHeader).');
    process.exit(1);
  }

  // Extract the csrf_token cookie value (the SHA-256 hash stored by the server).
  // Node 20+ fetch exposes getSetCookie() returning an array.
  let csrfCookieHash = null;

  const setCookieHeaders =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : (() => {
          const raw = response.headers.get('set-cookie');
          return raw ? [raw] : [];
        })();

  for (const cookieStr of setCookieHeaders) {
    const match = cookieStr.match(/csrf_token=([^;]+)/);
    if (match) {
      csrfCookieHash = match[1];
      break;
    }
  }

  if (!csrfCookieHash) {
    console.error('Could not extract csrf_token cookie from login response.');
    process.exit(1);
  }

  console.log('Login successful.\n');

  return { token, csrfToken, csrfHeader, csrfCookieHash };
}

// ---------------------------------------------------------------------------
// Upload a single file
// ---------------------------------------------------------------------------

async function uploadFile({ filePath, fileName, category, token, csrfToken, csrfHeader, csrfCookieHash }) {
  const fileBuffer = await fs.readFile(filePath);

  const formData = new FormData();
  formData.append('image', new Blob([fileBuffer], { type: 'image/jpeg' }), fileName);
  formData.append('category', category);

  const response = await fetch(`${API_BASE_URL}/api/admin/storage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      [csrfHeader]: csrfToken,
      Cookie: `csrf_token=${csrfCookieHash}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.error || JSON.stringify(body);
    } catch (_) {
      detail = await response.text();
    }
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  const result = await response.json();

  if (!result.cdn_url) {
    throw new Error(`Response missing cdn_url: ${JSON.stringify(result)}`);
  }

  return result.cdn_url;
}

// ---------------------------------------------------------------------------
// Collect files from a directory (sorted alphabetically, JPGs only)
// ---------------------------------------------------------------------------

async function collectJpgs(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    console.error(`Cannot read directory "${dir}": ${err.message}`);
    return [];
  }

  return entries
    .filter(f => /\.(jpg|jpeg)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

// ---------------------------------------------------------------------------
// Read / write the generated JSON file
// ---------------------------------------------------------------------------

async function readExistingJson() {
  try {
    const raw = await fs.readFile(GENERATED_JSON_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

async function writeJson(data) {
  // Ensure parent directory exists
  await fs.mkdir(path.dirname(GENERATED_JSON_PATH), { recursive: true });
  await fs.writeFile(GENERATED_JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { token, csrfToken, csrfHeader, csrfCookieHash } = await login();

  const motorsportsFiles = await collectJpgs(MOTORSPORTS_DIR);
  const crewFiles = await collectJpgs(CREW_DIR);

  const totalFiles = motorsportsFiles.length + crewFiles.length;
  console.log(`Found ${motorsportsFiles.length} MOTORSPORTS file(s) and ${crewFiles.length} Crew file(s). Total: ${totalFiles}\n`);

  const failures = [];
  let done = 0;

  // Accumulated results
  const motorsportUrls = [];
  let crewUrl = null;

  // --- MOTORSPORTS ---
  for (const fileName of motorsportsFiles) {
    done++;
    const filePath = path.join(MOTORSPORTS_DIR, fileName);
    process.stdout.write(`[${done}/${totalFiles}] uploading motorsports/${fileName} … `);
    try {
      const cdnUrl = await uploadFile({
        filePath,
        fileName,
        category: 'motorsports',
        token,
        csrfToken,
        csrfHeader,
        csrfCookieHash,
      });
      console.log(`→ ${cdnUrl}`);
      motorsportUrls.push(cdnUrl);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failures.push(`motorsports/${fileName}`);
    }
  }

  // --- CREW ---
  for (const fileName of crewFiles) {
    done++;
    const filePath = path.join(CREW_DIR, fileName);
    process.stdout.write(`[${done}/${totalFiles}] uploading crew/${fileName} … `);
    try {
      const cdnUrl = await uploadFile({
        filePath,
        fileName,
        category: 'crew',
        token,
        csrfToken,
        csrfHeader,
        csrfCookieHash,
      });
      console.log(`→ ${cdnUrl}`);
      crewUrl = cdnUrl;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failures.push(`crew/${fileName}`);
    }
  }

  // --- Merge and write JSON ---
  const existing = await readExistingJson();

  if (motorsportUrls.length > 0) {
    existing.motorsports = motorsportUrls;
  }
  if (crewUrl !== null) {
    existing.crew = crewUrl;
  }

  await writeJson(existing);
  console.log(`\nWrote ${GENERATED_JSON_PATH}`);

  // --- Summary ---
  const succeeded = totalFiles - failures.length;
  if (failures.length === 0) {
    console.log(`\nUploaded ${succeeded}/${totalFiles} — all succeeded.`);
  } else {
    console.error(
      `\nUploaded ${succeeded}/${totalFiles} (${failures.length} failed: ${failures.join(', ')})`
    );
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
