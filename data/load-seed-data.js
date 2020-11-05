const client = require('../lib/client');
// import our seed data:
const bees = require('./bees.js');
const friends = require('./friends.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
          [user.email, user.hash]);
      })
    );


    await Promise.all(
      friends.map(friend => {
        return client.query(`
                    INSERT INTO friends (name, friendliness)
                    VALUES ($1, $2)
                    RETURNING *;
                `,
          [friend.name, friend.friendliness]);
      })
    );

    const user = users[0].rows[0];


    await Promise.all(
      bees.map(bee => {
        return client.query(`
                    INSERT INTO bees (name_id, winterization, domesticated, characteristics, owner_id)
                    VALUES ($1, $2, $3, $4, $5);
                `,
          [bee.name_id, bee.winterization, bee.domesticated, bee.characteristics, user.id]);
      })
    );


    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch (err) {
    console.log(err);
  }
  finally {
    client.end();
  }

}
