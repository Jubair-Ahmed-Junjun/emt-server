const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_CLIENT_SECRET);

app.use(cors());
app.use(express.json());

//USER_DB = mt-db
//USER_PASS = SWsVrwCOg4faRVw4

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Forbidden Access" });
    } else {
      req.verified = decoded;
      next();
    }
  });
}
//Connected with mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jojhd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    //DB CREATE WITH NECESSARY TABLES
    const userCollection = client.db("mt_db").collection("users");
    const partsCollection = client.db("mt_db").collection("parts");
    const reviewCollection = client.db("mt_db").collection("reviews");
    const purchaseCollection = client.db("mt_db").collection("purchases");

    app.put("/users", async (req, res) => {
      const email = req.query.email;
      const user = req.body;
      const filter = { email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ result, accessToken: token });
    });
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.put("/usersById", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    app.put("/usersByEmail", async (req, res) => {
      const email = req.query.email;
      const mobile = req.body;
      const filter = { email };
      const updatedDoc = {
        $set: mobile,
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.get("/usersByEmail", async (req, res) => {
      const email = req.query.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });
    app.post("/parts", async (req, res) => {
      const data = req.body;
      const result = await partsCollection.insertOne(data);
      res.send(result);
    });
    app.get("/parts", async (req, res) => {
      const result = await partsCollection.find().sort({ _id: -1 }).toArray();
      res.send(result);
    });
    app.get("/partsById", async (req, res) => {
      const id = req.query.id;
      const query = { _id: ObjectId(id) };
      const result = await partsCollection.findOne(query);
      res.send(result);
    });
    app.delete("/partsById", async (req, res) => {
      const id = req.query.id;
      const query = { _id: ObjectId(id) };
      const result = await partsCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.get("/review", async (req, res) => {
      const result = await reviewCollection
        .find()
        .sort({ _id: -1 })
        .limit(3)
        .toArray();
      res.send(result);
    });
    app.post("/purchase", async (req, res) => {
      const purchaseData = req.body;
      const result = await purchaseCollection.insertOne(purchaseData);
      res.send(result);
    });
    app.get("/purchase", async (req, res) => {
      const result = await purchaseCollection.find().toArray();
      res.send(result);
    });
    app.get("/purchaseByEmail", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const result = await purchaseCollection.find({ email }).toArray();
      res.send(result);
    });
    app.get("/purchaseById/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await purchaseCollection.findOne(query);
      res.send(result);
    });
    app.delete("/purchaseById/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/purchaseById/:id", async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: item,
      };
      const result = await purchaseCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.post("/create-payment-intent", async (req, res) => {
      const item = req.body;
      const price = item.price;
      const amount = price * 100;

      if (amount > 999999) {
        return res.send({ message: "Amount limit excess" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "bdt",
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
  }
}
run().catch(console.dir);

//Default just ensure that project is successfully work or not
app.get("/", (req, res) => {
  res.send("Manufacturing is going on!");
});
app.listen(port, () => {
  console.log("listening from", port);
});
