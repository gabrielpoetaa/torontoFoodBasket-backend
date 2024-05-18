const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const recordRoutes = express.Router();
const { ObjectId } = require('mongodb');
const dbo = require('../db/conn');

require('dotenv').config();

const middlewares = require('./middlewares');
const api = require('./api');

const app = express();
const port = process.env.PORT || 5000;

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());


async function connectToDB() {
  const dbo = require('../db/conn');

  // perform a database connection when server starts
  await dbo.connectToServer((err) => {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
}

app.get('/', async (req, res) => {
  try {
    await connectToDB();
    const db_connect = dbo.getDb('foodbasket');

    // const projection = { title: 1, _id: 0, price: 1 };

    // Query Meat Department Collection
    const meatDepartmentsCollection = db_connect.collection('meatdepartments'); // importante!!!

    // Buscar os documentos, incluindo o documento com title 'pork'
    const resultMeatDepartments = await meatDepartmentsCollection
        .find({ title: { $ne: "Chicken Drumstick" } })
        .toArray();
    
    // Query Bakery Department Collection
    const bakeryDepartmentsCollection = db_connect.collection('bakerydepartments');
    const resultBakeryDepartments = await bakeryDepartmentsCollection
    .find({})
    .toArray();

    // Query Produce Department Collection
    const produceDepartmentsCollection = db_connect.collection('producedepartments');
    const resultProduceDepartments = await produceDepartmentsCollection
      .find({})
      .toArray();

    // Query ONLY the title of docs from second collection
    const cannedAndDryDepartmentsCollection = db_connect.collection("cannedanddrydepartments");
    const resultCannedAndDryDepartments = await cannedAndDryDepartmentsCollection
      .find({})
      .toArray();


    // Query Frozen Food Department Collection
    const frozenFoodDepartments = db_connect.collection(
      'frozenfooddepartments',
    );
    const resultFrozenFoodDepartments = await frozenFoodDepartments
    .find({ url: { $ne: 'https://www.nofrills.ca/unsweetened-frozen-concentrated-pulp-free-orange-j/p/20552223001_EA' } })
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
      const titleA = a.title.toUpperCase();
      const titleB = b.title.toUpperCase();

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
      if (!uniqueNames[obj.title]) {
        uniqueNames[obj.title] = true;
        return true;
      }
      return false;
    });

    // console.log(filteredArray);
    console.log(`${filteredArray.length} products in the basket`);
    console.log('Sending response:', filteredArray);
    res.json(filteredArray);
  } catch (error) {
    console.error('Error querying collections:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/details/:title', async (req, res) => {
  try {
    await connectToDB();
    const db_connect = dbo.getDb('foodbasket');
    const collectionNames = [
      'meatdepartments',
      'bakerydepartments',
      'producedepartments',
      'cannedanddrydepartments',
      'frozenfooddepartments',
      'refrigeratedfoodsections',
    ];

    const combinedResults = [];

    for (const collectionName of collectionNames) {
      const currentCollection = db_connect.collection(collectionName);

      // Your existing aggregation pipeline
      const updateField = [
        {
          $group: {
            _id: '$title',
            lowestPrice: { $min: '$pricePer100g' },
            totalPrice: { $sum: '$pricePer100g' },
            count: { $sum: 1 }, // Count the number of documents in each group
          },
        },
        {
          $project: {
            _id: 1,
            lowestPrice: 1,
            averagePricePer100g: { $divide: ['$totalPrice', '$count'] },
          },
        },
        {
          $project: {
            _id: 1,
            lowestPrice: 1,
            averagePricePer100g: { $round: ['$averagePricePer100g', 3] },
          },
        },
      ];

      const resultAggregation = await currentCollection.aggregate(updateField).toArray();

      // Retrieve and modify all documents in the current collection
      const resultDocuments = await currentCollection
        .find({})
        .sort({ pricePer100g: -1 })
        .toArray();

      const combinedResultsForCollection = resultDocuments.map((doc) => {
        const matchingAggregationResult = resultAggregation.find((aggr) => aggr._id === doc.title);
        doc.lowestPricePer100g = matchingAggregationResult ? matchingAggregationResult.lowestPrice : null;
        doc.averagePricePer100g = matchingAggregationResult ? matchingAggregationResult.averagePricePer100g : null;
        return doc;
      });

      combinedResults.push(...combinedResultsForCollection);
    }

    // Order result alphabetically
    combinedResults.sort((a, b) => a.title.localeCompare(b.title));

    // Remove duplicated results
    const uniqueNames = {};
    const filteredArray = combinedResults.filter((obj) => {
      if (!uniqueNames[obj.title]) {
        uniqueNames[obj.title] = true;
        return true;
      }
      return false;
    });

    console.log(`${filteredArray.length} products in the basket`);

    // IT QUERIES ALL DOCUMENTS, BUT RENDERS ONLY THE FIRST ONE
    const { title } = req.params;
    const selectedDocument = filteredArray.find((doc) => doc.title === title);

    if (!selectedDocument) {
      res.status(404).json({ error: 'Document not found' });
    } else {
      res.json(selectedDocument);
      console.log('User selected: ');
      console.log(selectedDocument);
    }
  } catch (error) {
    console.error('Error querying collections:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/record-count', async (req, res) => {
  try {
    await connectToDB();
    const db_connect = dbo.getDb("foodbasket");
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
      const hasSavedDateField = await currentCollection.findOne({ date: { $exists: true } });

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
                        new Date(),  // Current date
                        "$date"  // Document's saved date
                      ]
                    },
                    1000 * 60 * 60 * 24  // Convert milliseconds to days
                  ]
                }
              }
            }
          ])
          .toArray();

        resultAggregation.push(...result);

        // Retrieve and modify all documents in the current collection
        const resultDocuments = await currentCollection.find({}).toArray();

        combinedResults.push(...resultDocuments);
      }
    }

    // Find the document with the maximum daysSinceSaved value
    const maxDaysDocument = resultAggregation.reduce((maxDoc, currentDoc) => {
      return currentDoc.daysSinceSaved > maxDoc.daysSinceSaved ? currentDoc : maxDoc;
    }, { daysSinceSaved: -Infinity }); // Initialize with a very small value

    const roundeddaysCount = Math.ceil(maxDaysDocument.daysSinceSaved);


    const combinedResultsFinal = {
      recordsOfData: combinedResults.length,
      daysCount: roundeddaysCount
    };

    res.json(combinedResultsFinal);
  } catch (error) {
    console.error("Error querying collections:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/price/:title', async (req, res) => {
  try {
    const db_connect = dbo.getDb("foodbasket");
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
      const collection = db_connect.collection(department);
      const departmentResults = await collection.find({ title: req.params.title }).toArray();
      combinedResults = [...combinedResults, ...departmentResults];
    }

    console.log("Total number of documents for title " + req.params.title + ": " + combinedResults.length);

    combinedResults.sort((a, b) => a.title.localeCompare(b.title));

    const uniqueNames = {};
    const filteredArray = combinedResults.filter((obj) => {
      if (!uniqueNames[obj.title]) {
        uniqueNames[obj.title] = true;
        return true;
      }
      return false;
    });

    const resultWithAvgPricePerMonth = filteredArray.map((product) => {
      const avgPricePerMonth = calculateAvgPricePerMonth(product, combinedResults);
      return {
        ...product,
        avgPricePerMonth,
      };
    });

    res.json(resultWithAvgPricePerMonth);
  } catch (error) {
    console.error("Error querying collections:", error);
    res.status(500).send("Internal Server Error");
  }
});



// Helper function to calculate average pricePer100g for every month
function calculateAvgPricePerMonth(product, allProducts) {
  try {
    const pricesPerMonth = {};

    for (const entry of allProducts) {
      const date = new Date(entry.date);

      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!pricesPerMonth[monthYear]) {
        pricesPerMonth[monthYear] = [];
      }

      // Only consider entries with the same title
      if (entry.title === product.title) {
        pricesPerMonth[monthYear].push(entry.pricePer100g);
      }
    }

    const avgPricePerMonth = {};

    for (const [monthYear, prices] of Object.entries(pricesPerMonth)) {
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      avgPricePerMonth[monthYear] = averagePrice.toFixed(2); // Adjust decimal places if needed
    }

    return avgPricePerMonth;
  } catch (error) {
    console.error("Error calculating average pricePer100g per month:", error);
    return {};
  }
}



app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
