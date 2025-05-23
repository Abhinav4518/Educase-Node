const express = require('express');
const router = express.Router();
const db = require('../config/db');
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = angle => (angle * Math.PI) / 180;
  const R = 6400;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/addSchool', async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );
    res.status(201).json({ message: 'School added', schoolId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/listSchools', async (req, res) => {
  const { lat, lng } = req.query;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }

  try {
    const [schools] = await db.execute('SELECT * FROM schools');
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const sorted = schools.map(school => ({
      ...school,
      distance: getDistance(userLat, userLng, school.latitude, school.longitude)
    })).sort((a, b) => a.distance - b.distance);

    res.status(200).json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
