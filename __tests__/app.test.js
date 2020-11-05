require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;

    beforeAll(async done => {
      execSync('npm run setup-db');

      client.connect();

      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });

      token = signInData.body.token;

      return done();
    });

    afterAll(done => {
      return client.end(done);
    });

    //TEST GETs ALL OF THE BEES
    test('returns all the bees', async () => {

      const expectation = [
        {
          id: 1,
          name: 'italians',
          winterization: 2,
          domesticated: true,
          characteristics: 'golden colors, larger winter cluster, and super honey production',
          owner_id: 1

        },
        {
          id: 2,
          name: 'carniolans',
          winterization: 4,
          domesticated: true,
          characteristics: 'browner colors, small winter cluster, and nice honey production',
          owner_id: 1
        },
        {
          id: 3,
          name: 'africanized',
          winterization: 1,
          domesticated: false,
          characteristics: 'these guys are assholes. But boy do they make a lot of honey',
          owner_id: 1
        },
        {
          id: 4,
          name: 'russian',
          winterization: 5,
          domesticated: true,
          characteristics: 'dark brown, smaller honey producers, but excellent survivors',
          owner_id: 1
        }
      ];

      const data = await fakeRequest(app)
        .get('/bees')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
    });

    // GETs a single bee
    test('resturns a single bee variety', async () => {
      const expectation = {
        id: 1,
        name: 'italians',
        winterization: 2,
        domesticated: true,
        characteristics: 'golden colors, larger winter cluster, and super honey production',
        owner_id: 1
      };

      const data = await fakeRequest(app)
        .get('/bees/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
    });

    // ADDs a bee to the DB and RETURNS it -POST
    test('adds a bee to the DB', async () => {
      const expectation = {
        id: 5,
        name: 'russian',
        winterization: 5,
        domesticated: true,
        characteristics: 'dark brown, smaller honey producers, but excellent survivors',
        owner_id: 1
      };

      const data = await fakeRequest(app)
        .post('/bees')
        .send({
          name: 'russian',
          winterization: 5,
          domesticated: true,
          characteristics: 'dark brown, smaller honey producers, but excellent survivors',
          owner_id: 1
        })
        .expect('Content-Type', /json/)
        .expect(200);

      const allBees = await fakeRequest(app)
        .get('/bees')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
      expect(allBees.body.length).toEqual(5);
    });

    //TEST REplace a bee with a new one - PUT


    //TEST - remove a bee -DELETE
    test('deletes Bee with id of 3', async () => {

      // const expectation = [
      //   {
      //     id: 1,
      //     name: 'italians',
      //     winterization: 2,
      //     domesticated: true,
      //     characteristics: 'golden colors, larger winter cluster, and super honey production',
      //     owner_id: 1

      //   },
      //   {
      //     id: 2,
      //     name: 'carniolans',
      //     winterization: 4,
      //     domesticated: true,
      //     characteristics: 'browner colors, small winter cluster, and nice honey production',
      //     owner_id: 1
      //   }
      // ];

      const deletedItem =
      {
        id: 3,
        name: 'africanized',
        winterization: 1,
        domesticated: false,
        characteristics: 'these guys are assholes. But boy do they make a lot of honey',
        owner_id: 1
      }
        ;

      const data = await fakeRequest(app)
        .delete('/bees/3')
        .expect('Content-Type', /json/)
        .expect(200);

      // const allBees = await fakeRequest(app)
      //   .get('/bees')
      //   .expect('Content-Type', /json/)
      //   .expect(200);


      expect(data.body).toEqual(deletedItem);
      // expect(allBees.body.length).toEqual(2);
    });

    //PUT test
    test('replaces Bee with id of 2', async () => {


      const replacedItem =
      {
        id: 2,
        name: 'bumble',
        winterization: 1,
        domesticated: false,
        characteristics: 'so cute',
        owner_id: 1
      }
        ;

      const data = await fakeRequest(app)
        .put('/bees/2')
        .send(replacedItem)
        .expect('Content-Type', /json/)
        .expect(200);


      expect(data.body).toEqual(replacedItem);
      // expect(allBees.body.length).toEqual(2);
    });
  });
});
