const fs = require('fs/promises');
const path = require('path');

const oldFile = path.join(__dirname, '..', 'data', 'team.json');
const newFile = path.join(__dirname, '..', 'data', 'teammates.json');

function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

async function migrate() {
  try {
    const raw = await fs.readFile(oldFile, 'utf-8');
    const data = JSON.parse(raw);
    const expanded = data.map((item) => ({
      order: item.order ?? null,
      slug: item.slug,
      name: item.name,
      role: item.role || '',
      jobTitle: item.jobTitle || '',
      nmls: item.nmls || '',
      phone: item.phone || '',
      email: item.email || '',
      photoFile: item.photoFile || '',
      location: item.location || '',
      bio: item.bio || '',
      specialties: ensureArray(item.specialties),
      certifications: ensureArray(item.certifications),
      languages: ensureArray(item.languages),
      hireDate: item.hireDate || '',
      funFact: item.funFact || '',
      socialHandles: {
        facebook: item.socialHandles?.facebook || '',
        instagram: item.socialHandles?.instagram || '',
        linkedin: item.socialHandles?.linkedin || '',
        twitter: item.socialHandles?.twitter || '',
        tiktok: item.socialHandles?.tiktok || '',
      },
      states: ensureArray(item.states),
      links: {
        apply: item.links?.apply || '',
        calendly: item.links?.calendly || '',
        linkedin: item.links?.linkedin || '',
        reviews: item.links?.reviews || '',
        personalSite: item.links?.personalSite || '',
      },
    }));
    await fs.writeFile(newFile, JSON.stringify(expanded, null, 2));
    console.log(`Migrated ${expanded.length} teammates`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No existing team.json file found, skipping migration.');
      return;
    }
    throw err;
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
