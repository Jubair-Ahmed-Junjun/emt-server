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
