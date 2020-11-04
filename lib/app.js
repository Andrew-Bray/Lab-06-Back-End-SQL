const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/bees', async (req, res) => {
  try {
    const data = await client.query('SELECT * from bees');

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/bees/:id', async (req, res) => {
  try {
    const beeId = req.params.id;

    const data = await client.query(`
        SELECT * FROM bees 
        WHERE bees.id=$1 
    `, [beeId]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

//POST
app.post('/bees/', async (req, res) => {
  try {
    const newBeeName = req.body.name;
    const newWinter = req.body.winterization;
    const newDomest = req.body.domesticated;
    const newChar = req.body.characteristics;
    const newOwenerId = req.body.owner_id;

    const data = await client.query(`
    INSERT INTO bees (name, winterization, domesticated, characteristics, owner_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
      [newBeeName, newWinter, newDomest, newChar, newOwenerId]);
    res.json(data.rows[0]);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//DELETE
app.delete('bees/:id', async (req, res) => {
  try {
    const beeId = req.params.id;

    // use an insert statement to make a new banjo
    const data = await client.query(`
      DELETE from bees 
      WHERE bees.id=$1
    `,
      // use the weird $ syntax and this array to prevent SQL injection (i.e. Bobby "DROP TABLES")
      [beeId]);

    res.json(data.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//PUT (which is a replace)
app.put('/bees/:id', async (req, res) => {
  try {
    const newBeeName = req.body.name;
    const newWinter = req.body.winterization;
    const newDomest = req.body.domesticated;
    const newChar = req.body.characteristics;
    const newOwenerId = req.body.owner_id;

    const data = await client.query(`
    UPDATE bees 
    SET name = $1, 
    winterization = $2, 
    domesticated = $3, 
    characteristics = $4, 
    owner_id = $5,
    WHERE bees.id = $2
    RETURNING *
    `,
      [newBeeName, newWinter, newDomest, newChar, newOwenerId, req.params.id]);
    res.json(data.rows[0]);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.use(require('./middleware/error'));

module.exports = app;
