const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 500;

// MiddleWare
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.nqtfzbx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const teacherCollection = client.db("schoolDB").collection("request");
        const userCollection = client.db("schoolDB").collection("users");

        // Jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ token });
        })

        // Create Teacher Request
        app.post('/request', async (req, res) => {
            const newRequest = req.body;
            console.log(newRequest);
            const result = await teacherCollection.insertOne(newRequest);
            res.send(result);
        })

        // Read Teacher Request
        app.get('/request', async (req, res) => {
            const cursor = teacherCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // Users related api (Create)
        app.post('/users', async (req, res) => {
            const user = req.body;
            // Exists user check
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            // ---------
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // Read
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        // Make Admin User
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // Check Admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            // if(email !== res.user.email){
            //     return res.status(403).send({message: 'unauthorized access'})
            // }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('CyberHub is running!')
})

app.listen(port, () => {
    console.log(`CyberHub is running on port ${port}`);
})