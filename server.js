const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'teammates.json');
const IMAGE_DIR = path.join(ROOT_DIR, 'images');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
      console.error('Failed to ensure upload directory', err);
    }
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(IMAGE_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(ROOT_DIR));

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (err) {
    // fall through
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
  const headerToken = req.headers['x-admin-token'] || req.headers['authorization'];
  const token = headerToken && headerToken.replace(/^Bearer\s+/i, '');
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function coerceObject(value, fallbackKeys) {
  const base = fallbackKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {});
  if (!value) {
    return base;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return { ...base, ...parsed };
      }
    } catch (err) {
      // fall through and use fallback parsing below
    }
  }
  if (typeof value === 'object') {
    return { ...base, ...value };
  }
  return base;
}

function normalizeRecord(body, file) {
  const slug = String(body.slug || '').trim();
  const name = String(body.name || '').trim();
  if (!slug || !name) {
    const err = new Error('Slug and name are required');
    err.status = 400;
    throw err;
  }

  const links = coerceObject(body.links || {
    apply: body.apply,
    calendly: body.calendly,
    linkedin: body.linkedin,
    reviews: body.reviews,
    personalSite: body.personalSite,
  }, ['apply', 'calendly', 'linkedin', 'reviews', 'personalSite']);
  const socialHandles = coerceObject(body.socialHandles || {
    facebook: body.facebook,
    instagram: body.instagram,
    linkedin: body.socialLinkedin || body.linkedin,
    twitter: body.twitter,
    tiktok: body.tiktok,
  }, ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok']);

  const record = {
    order:
      body.order !== undefined && body.order !== ''
        ? Number(body.order)
        : null,
    slug,
    name,
    role: body.role,
    jobTitle: body.jobTitle || '',
    nmls: body.nmls || '',
    phone: body.phone || '',
    email: body.email || '',
    photoFile: body.photoFile || '',
    location: body.location || '',
    bio: body.bio || '',
    specialties: parseList(body.specialties),
    certifications: parseList(body.certifications),
    languages: parseList(body.languages),
    hireDate: body.hireDate || '',
    funFact: body.funFact || '',
    socialHandles,
    states: parseList(body.states),
    links,
  };

  if (file) {
    record.photoFile = path.join('uploads', file.filename);
  }

  return record;
}

app.get('/api/teammates', async (req, res) => {
  const data = await readData();
  res.json(data);
});

app.post('/api/auth/login', (req, res) => {
  const { password, token } = req.body || {};
  if (token && token === ADMIN_TOKEN) {
    return res.json({ token: ADMIN_TOKEN });
  }
  if (!password || password !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ token: ADMIN_TOKEN });
});

app.post('/api/teammates', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const data = await readData();
    const existing = data.find((p) => p.slug === req.body.slug);
    if (existing) {
      return res.status(409).json({ error: 'Teammate with this slug already exists' });
    }
    const record = normalizeRecord(req.body, req.file);
    data.push(record);
    await writeData(data);
    res.status(201).json(record);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Failed to create teammate' });
  }
});

app.put('/api/teammates/:slug', requireAuth, upload.single('photo'), async (req, res) => {
  const { slug } = req.params;
  try {
    const data = await readData();
    const index = data.findIndex((p) => p.slug === slug);
    if (index === -1) {
      return res.status(404).json({ error: 'Teammate not found' });
    }
    const incoming = normalizeRecord({ ...data[index], ...req.body, slug }, req.file);
    data[index] = incoming;
    await writeData(data);
    res.json(incoming);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Failed to update teammate' });
  }
});

app.delete('/api/teammates/:slug', requireAuth, async (req, res) => {
  const { slug } = req.params;
  const data = await readData();
  const index = data.findIndex((p) => p.slug === slug);
  if (index === -1) {
    return res.status(404).json({ error: 'Teammate not found' });
  }
  const removed = data.splice(index, 1)[0];
  await writeData(data);
  res.json(removed);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
