const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const dbo = require("../db/conn");

const middlewares = require("./middlewares");
const api = require("./api");

const app = express();
const port = process.env.PORT || 5000;

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

app.get("/", async (req, res) => {
  try {
    const db_connect = dbo.getDb();
    if (!db_connect) {
      throw new Error("Database connection not established");
    }

    // const projection = { title: 1, _id: 0, price: 1 };

    // Query Meat Department Collection
    const meatDepartmentsCollection = db_connect.collection("meatdepartments"); // importante!!!

    // Buscar os documentos, incluindo o documento com title 'pork'
    const resultMeatDepartments = await meatDepartmentsCollection
      .find({
        title: {
          $nin: [
            "Chicken Drumstick",
            "Free From Boneless Pork Fast Fry Center Chop, Tray Pack",
            "Boneless Pork Chop Center & Rib, Club Pack",
            "Beef Stir-fry Strips Inside Round",
            "Outside Round Steak, Club Pack",
          ],
        },
      })
      .toArray();

    // Query Bakery Department Collection
    const bakeryDepartmentsCollection =
      db_connect.collection("bakerydepartments");
    const resultBakeryDepartments = await bakeryDepartmentsCollection
      .find({})
      .toArray();

    // Query Produce Department Collection
    const produceDepartmentsCollection =
      db_connect.collection("producedepartments");
    const resultProduceDepartments = await produceDepartmentsCollection
      .find({})
      .toArray();

    // Query ONLY the title of docs from second collection
    const cannedAndDryDepartmentsCollection = db_connect.collection(
      "cannedanddrydepartments"
    );
    const resultCannedAndDryDepartments =
      await cannedAndDryDepartmentsCollection.find({}).toArray();

    // Query Frozen Food Department Collection
    const frozenFoodDepartments = db_connect.collection(
      "frozenfooddepartments"
    );
    const resultFrozenFoodDepartments = await frozenFoodDepartments
      .find({
        title: {
          $nin: [
            "Unsweetened Orange Juice from Concentrate",
            "Unsweetened Frozen Concentrated Pulp Free Orange Juice ",
          ],
        },
      })
      .toArray();

    // Query ONLY the title of docs from second collection
    const refrigeratedFoodSections = db_connect.collection(
      "refrigeratedfoodsections"
    );
    const resultRefrigeratedFoodSections = await refrigeratedFoodSections
      .find({})
      .toArray();

    // Combine ALL results from collections
    const combinedResults = [
      ...resultMeatDepartments,
      ...resultBakeryDepartments,
      ...resultProduceDepartments,
      ...resultCannedAndDryDepartments,
      ...resultFrozenFoodDepartments,
      ...resultRefrigeratedFoodSections,
    ];

    // Order result alphabetically
    combinedResults.sort((a, b) => {
      const titleA = (a?.title || '').toUpperCase();
      const titleB = (b?.title || '').toUpperCase();

      if (titleA < titleB) {
        return -1;
      }
      if (titleA > titleB) {
        return 1;
      }
      return 0;
    });

    // Remove duplicated results
    const uniqueNames = {};

    const filteredArray = combinedResults.filter((obj) => {
      if (!obj?.title) return false; // Skip items without titles
      if (!uniqueNames[obj.title]) {
        uniqueNames[obj.title] = true;
        return true;
      }
      return false;
    });

    // console.log(filteredArray);
    console.log(`${filteredArray.length} products in the basket`);
    console.log("Sending response:", filteredArray);
    res.json(filteredArray);
  } catch (error) {
    console.error("Error querying collections:", error);
    res.status(500).json({
      error: "Error querying collections",
      message: error.message
    });
  }
});

app.get("/details/:title", async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title);
    console.log("Searching for document with title:", title);

    if (!title) {
      return res.status(400).json({ 
        error: "Invalid title", 
        message: "Title parameter is required" 
      });
    }

    const db_connect = dbo.getDb();
    if (!db_connect) {
      throw new Error("Database connection not established");
    }

    const collectionNames = [
      "meatdepartments",
      "bakerydepartments",
      "producedepartments",
      "cannedanddrydepartments",
      "frozenfooddepartments",
      "refrigeratedfoodsections",
    ];

    let foundDocument = null;
    let foundCollection = null;

    // First try to find the document directly in each collection
    for (const collectionName of collectionNames) {
      console.log(`Searching in collection: ${collectionName}`);
      const currentCollection = db_connect.collection(collectionName);
      
      // Try to find the document directly
      const result = await currentCollection.findOne({ 
        title: { $regex: new RegExp(`^${title}$`, 'i') } // Case-insensitive exact match
      });
      
      if (result) {
        console.log(`Found document in ${collectionName}`);
        foundDocument = result;
        foundCollection = collectionName;
        break;
      }
    }

    if (!foundDocument) {
      console.log("Document not found with title:", title);
      return res.status(404).json({ 
        error: "Document not found", 
        title: title,
        message: "No document found with the specified title"
      });
    }

    // If we found the document, get its aggregation data
    const collection = db_connect.collection(foundCollection);
    const aggregationResult = await collection.aggregate([
      {
        $match: { 
          title: { $regex: new RegExp(`^${title}$`, 'i') } // Case-insensitive exact match
        }
      },
      {
        $group: {
          _id: "$title",
          lowestPrice: { $min: "$pricePer100g" },
          totalPrice: { $sum: "$pricePer100g" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          lowestPrice: 1,
          averagePricePer100g: { 
            $round: [
              { $divide: ["$totalPrice", "$count"] },
              3
            ]
          }
        }
      }
    ]).toArray();

    console.log("Aggregation result:", aggregationResult);

    // Combine the document with aggregation results
    const finalDocument = {
      ...foundDocument,
      lowestPricePer100g: aggregationResult[0]?.lowestPrice || null,
      averagePricePer100g: aggregationResult[0]?.averagePricePer100g || null
    };

    // Ensure all required fields have default values
    const safeDocument = {
      title: finalDocument.title || title,
      price: finalDocument.price || null,
      pricePer100g: finalDocument.pricePer100g || null,
      lowestPricePer100g: finalDocument.lowestPricePer100g || null,
      averagePricePer100g: finalDocument.averagePricePer100g || null,
      date: finalDocument.date || null,
      url: finalDocument.url || null
    };

    console.log("Final document:", safeDocument);
    res.json(safeDocument);

  } catch (error) {
    console.error("Error fetching document details:", error);
    res.status(500).json({
      error: "Error fetching document details",
      message: error.message,
      stack: error.stack
    });
  }
});

app.get("/record-count", async (req, res) => {
  try {
    const db_connect = dbo.getDb();
    if (!db_connect) {
      throw new Error("Database connection not established");
    }

    const collectionNames = [
      "meatdepartments",
      "bakerydepartments",
      "producedepartments",
      "cannedanddrydepartments",
      "frozenfooddepartments",
      "refrigeratedfoodsections",
    ];

    let resultAggregation = [];
    const combinedResults = [];

    for (const collectionName of collectionNames) {
      const currentCollection = db_connect.collection(collectionName);

      // Check if the savedDate field exists in the documents
      const hasSavedDateField = await currentCollection.findOne({
        date: { $exists: true },
      });

      if (hasSavedDateField) {
        // Calculate daysSinceSaved for each document in the collection
        const result = await currentCollection
          .aggregate([
            {
              $project: {
                daysSinceSaved: {
                  $divide: [
                    {
                      $subtract: [
                        new Date(), // Current date
                        "$date", // Document's saved date
                      ],
                    },
                    1000 * 60 * 60 * 24, // Convert milliseconds to days
                  ],
                },
              },
            },
          ])
          .toArray();

        resultAggregation.push(...result);

        // Retrieve and modify all documents in the current collection
        const resultDocuments = await currentCollection.find({}).toArray();

        combinedResults.push(...resultDocuments);
      }
    }

    // Find the document with the maximum daysSinceSaved value
    const maxDaysDocument = resultAggregation.reduce(
      (maxDoc, currentDoc) => {
        return currentDoc.daysSinceSaved > maxDoc.daysSinceSaved
          ? currentDoc
          : maxDoc;
      },
      { daysSinceSaved: -Infinity }
    ); // Initialize with a very small value

    const roundeddaysCount = Math.ceil(maxDaysDocument.daysSinceSaved);

    const combinedResultsFinal = {
      recordsOfData: combinedResults.length,
      daysCount: roundeddaysCount,
    };

    res.json(combinedResultsFinal);
  } catch (error) {
    console.error("Error querying collections:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/price/:title", async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title);
    console.log("=== Price Endpoint Debug ===");
    console.log("1. Received request for title:", title);
    console.log("2. Raw title parameter:", req.params.title);

    if (!title) {
      console.log("3. Error: Title is empty or undefined");
      return res.status(400).json({ 
        error: "Invalid title", 
        message: "Title parameter is required" 
      });
    }

    const db_connect = dbo.getDb();
    if (!db_connect) {
      console.log("4. Error: Database connection not established");
      throw new Error("Database connection not established");
    }
    console.log("4. Database connection established");

    const allDepartments = [
      "meatdepartments",
      "bakerydepartments",
      "producedepartments",
      "cannedanddrydepartments",
      "frozenfooddepartments",
      "refrigeratedfoodsections",
    ];

    let combinedResults = [];

    for (const department of allDepartments) {
      try {
        console.log(`5. Searching in ${department} for title: ${title}`);
        const collection = db_connect.collection(department);
        
        // Use case-insensitive regex search
        const departmentResults = await collection.find({ 
          title: { $regex: new RegExp(`^${title}$`, 'i') } 
        }).toArray();
        
        console.log(`6. Found ${departmentResults.length} results in ${department}`);
        if (departmentResults.length > 0) {
          console.log("7. Sample document:", {
            title: departmentResults[0].title,
            price: departmentResults[0].price,
            pricePer100g: departmentResults[0].pricePer100g,
            date: departmentResults[0].date
          });
        }
        
        combinedResults = [...combinedResults, ...departmentResults];
      } catch (error) {
        console.error(`Error searching in ${department}:`, error);
        continue;
      }
    }

    console.log("8. Total number of documents found:", combinedResults.length);

    // Filter out any documents with null or undefined titles
    const validResults = combinedResults.filter(doc => doc && doc.title);
    console.log("9. Number of valid documents after filtering:", validResults.length);

    // Sort results with null checks
    validResults.sort((a, b) => {
      if (!a.title || !b.title) return 0;
      return a.title.localeCompare(b.title);
    });

    // Remove duplicates using a Map to preserve order
    const uniqueMap = new Map();
    validResults.forEach(doc => {
      if (!uniqueMap.has(doc.title)) {
        uniqueMap.set(doc.title, doc);
      }
    });

    const filteredArray = Array.from(uniqueMap.values());
    console.log("10. Number of unique documents:", filteredArray.length);

    const resultWithAvgPricePerMonth = filteredArray.map((product) => {
      try {
        console.log(`11. Calculating average price for ${product.title}`);
        const avgPricePerMonth = calculateAvgPricePerMonth(product, combinedResults);
        console.log(`12. Average price calculation result:`, avgPricePerMonth);
        return {
          ...product,
          avgPricePerMonth,
        };
      } catch (error) {
        console.error(`Error calculating average price for ${product.title}:`, error);
        return {
          ...product,
          avgPricePerMonth: {},
        };
      }
    });

    console.log(`13. Returning ${resultWithAvgPricePerMonth.length} results for ${title}`);
    res.json(resultWithAvgPricePerMonth);
  } catch (error) {
    console.error("14. Error in /price endpoint:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Helper function to calculate average pricePer100g for every month
function calculateAvgPricePerMonth(product, allProducts) {
  try {
    if (!product || !product.title || !Array.isArray(allProducts)) {
      console.error("Invalid input to calculateAvgPricePerMonth:", { product, allProducts });
      return {};
    }

    const pricesPerMonth = {};

    for (const entry of allProducts) {
      if (!entry || !entry.title || !entry.date || entry.title !== product.title) {
        continue;
      }

      try {
        const date = new Date(entry.date);
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", entry.date);
          continue;
        }

        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!pricesPerMonth[monthYear]) {
          pricesPerMonth[monthYear] = [];
        }

        if (typeof entry.pricePer100g === 'number') {
          pricesPerMonth[monthYear].push(entry.pricePer100g);
        }
      } catch (error) {
        console.error("Error processing entry:", error);
        continue;
      }
    }

    const avgPricePerMonth = {};

    for (const [monthYear, prices] of Object.entries(pricesPerMonth)) {
      if (prices.length > 0) {
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        avgPricePerMonth[monthYear] = Number(averagePrice.toFixed(2));
      }
    }

    return avgPricePerMonth;
  } catch (error) {
    console.error("Error calculating average pricePer100g per month:", error);
    return {};
  }
}

app.use("/api/v1", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
