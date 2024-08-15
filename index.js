const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.ythezyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {

    const productCollections = client.db("Product").collection("product");

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page) || 0; 
      const size = parseInt(req.query.size) || 10; 
      const search = req.query.search || "";
      const brands = req.query.brands ? req.query.brands.split(",") : [];
      const categories = req.query.categories
        ? req.query.categories.split(",")
        : [];
      const minPrice = parseInt(req.query.minPrice);
      const maxPrice = parseInt(req.query.maxPrice) || Infinity;
      const sortBy = req.query.sortBy || "default"; 

      const query = {
        productName: { $regex: search, $options: "i" },
        ...(brands.length > 0 && { brand: { $in: brands } }),
        ...(categories.length > 0 && { category: { $in: categories } }),
        price: { $gte: minPrice, $lte: maxPrice },
      };
      let sortOption = {};
      if (sortBy === "priceLowToHigh") {
        sortOption = { price: 1 }; 
      } else if (sortBy === "priceHighToLow") {
        sortOption = { price: -1 }; 
      } else if (sortBy === "dateNewestFirst") {
        sortOption = { productCreationDate: -1 }; 
      }

      try {
        const result = await productCollections
          .find(query)
          .sort(sortOption) 
          .skip(page * size)
          .limit(size)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res
          .status(500)
          .send({ error: "An error occurred while fetching products." });
      }
    });

    app.get("/productsCount", async (req, res) => {
      try {
        const search = req.query.search || "";
        const brands = req.query.brands ? req.query.brands.split(",") : [];
        const categories = req.query.categories
          ? req.query.categories.split(",")
          : [];
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || Infinity;

        const query = {
          productName: { $regex: search, $options: "i" },
          ...(brands.length > 0 && { brand: { $in: brands } }),
          ...(categories.length > 0 && { category: { $in: categories } }),
          price: { $gte: minPrice, $lte: maxPrice },
        };

        const count = await productCollections.countDocuments(query);

        res.send({ count });
      } catch (error) {
        console.error("Error fetching product count:", error);
        res
          .status(500)
          .send({
            error: "An error occurred while fetching the product count.",
          });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Product server is running on port " + port);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
