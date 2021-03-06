const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
//const friends = require('../data/friends.js');

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

//GET some BEES
app.get('/bees', async (req, res) => {
  try {
    const data = await client.query(`
      SELECT bees.id,
      bees.winterization,
      bees.domesticated,
      bees.characteristics, 
      friends.friendliness as friendliness,
            friends.name as name
            from bees
            join friends
            on friends.id = bees.name_id
            order by friends.name desc
            `);

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

//add all of the deets in case we want to make a friendliness dropdown
app.get('/friends', async (req, res) => {
  try {
    const data = await client.query('select * from friends');

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});


app.get('/bees/:id', async (req, res) => {
  try {
    const beeId = req.params.id;

    const data = await client.query(`
    SELECT bees.id,
    bees.winterization,
    bees.domesticated,
    bees.characteristics,
    bees.owner_id, 
          friends.name as name
          from bees
          join friends
          on friends.id = bees.name_id
        WHERE bees.id=$1 
    `, [beeId]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

//POST
app.post('/bees', async (req, res) => {
  try {
    const newBeeName = req.body.name_id;
    const newWinter = req.body.winterization;
    const newDomest = req.body.domesticated;
    const newChar = req.body.characteristics;
    const newOwenerId = req.body.owner_id;

    const data = await client.query(`
    INSERT INTO bees (name_id, winterization, domesticated, characteristics, owner_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
      [newBeeName, newWinter, newDomest, newChar, newOwenerId]);
    res.json(data.rows[0]);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/friends', async (req, res) => {
  try {
    const newBeeName = req.body.name;
    const newFr = req.body.friendliness;


    const data = await client.query(`
    INSERT INTO friends (name, friendliness)
    VALUES ($1, $2)
    RETURNING *
    `,
      [newBeeName, newFr]);
    res.json(data.rows[0]);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//DELETE
app.delete('/bees/:id', async (req, res) => {
  try {
    const beeId = req.params.id;

    // use an insert statement to make a new banjo
    const data = await client.query(`
      DELETE from bees 
      WHERE bees.id=$1
      RETURNING *
    `,

      [beeId]);

    res.json(data.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//PUT (which is a replace)
app.put('/bees/:id', async (req, res) => {
  try {
    const newBeeName = req.body.name_id;
    const newWinter = req.body.winterization;
    const newDomest = req.body.domesticated;
    const newChar = req.body.characteristics;
    const newOwenerId = req.body.owner_id;

    const data = await client.query(`
    UPDATE bees 
    SET name_id = $1, 
    winterization = $2, 
    domesticated = $3, 
    characteristics = $4, 
    owner_id = $5
    WHERE bees.id = $6
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
