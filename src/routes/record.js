const express = require("express");

// recordRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const recordRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../routes/record");

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// recordRoutes.route("/api/items/:itemName").get(async function (req, res) {

//   const itemName = req.params.itemName;
//   let db_connect = dbo.getDb("foodbasket");

//  db_connect
//    .collection("meatdepartments")
//    .find({title: itemName})
//    .toArray(function (err, result) {
//      if (err) throw err;
//      res.json(result);
//    })
//    .then((data) => {
//     console.log(data);
//     // console.log(db_connect)
//     res.json(data);
//   });
//   });

// This section will help you get a list of all the records at ONE collection
// recordRoutes.route("/record").get(function (req, res) {
//  let db_connect = dbo.getDb("foodbasket");
//  db_connect
//    .collection("meatdepartments").collection("bakerydepartments") // important!!!
//    .find({})
//    .toArray(function (err, result) {
//      if (err) throw err;
//      res.json(result);
//    })
//    .then((data) => {
//     console.log(data);
//     // console.log(db_connect)
//     res.json(data);
//   });
//   });

// Return all documents from all collections for drop-down list component
recordRoutes.route("/list").get(async function (req, res) {
  try {
    const db_connect = dbo.getDb("foodbasket");

    // const projection = { title: 1, _id: 0, price: 1 };

    // Query ONLY the title of docs from first collection
    const meatDepartmentsCollection = db_connect.collection("meatdepartments"); // important!!!
    const resultMeatDepartmens = await meatDepartmentsCollection
      .find({})
      .toArray();

    // Query ONLY the title of docs from second collection
    const bakeryDepartmentsCollection =
      db_connect.collection("bakerydepartments");
    const resultBakeryDepartments = await bakeryDepartmentsCollection
      .find({})
      .toArray();

    // Query ONLY the title of docs from second collection
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

    // Query ONLY the title of docs from second collection
    const frozenFoodDepartments = db_connect.collection(
      "frozenfooddepartments"
    );
    const resultFrozenFoodDepartments = await frozenFoodDepartments
      .find({})
      .toArray();

    // Query ONLY the title of docs from second collection
    const refrigeratedFoodSections = db_connect.collection(
      "cannedanddrydepartments"
    );
    const resultRefrigeratedFoodSections = await refrigeratedFoodSections
      .find({})
      .toArray();

    // Combine ALL results from collections
    const combinedResults = [
      ...resultMeatDepartmens,
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
    console.log(filteredArray.length + " products in the basket");
    console.log("Sending response:", filteredArray);    
    res.json(filteredArray);
  } catch (error) {
    console.error("Error querying collections:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route for details
// recordRoutes.route("/details/:title").get(async function (req, res) {
//   try {
//     const db_connect = dbo.getDb("foodbasket");
    

//     // const projection = { title: 1, _id: 0, price: 1 };

//     // Query ONLY the title of docs from first collection
//     const meatDepartmentsCollection = db_connect.collection("meatdepartments"); // important!!!
//     const resultMeatDepartmens = await meatDepartmentsCollection
//       .find({})
//       .sort({ pricePer100g: -1 })

//       .toArray();

//     // Query ONLY the title of docs from second collection
//     const bakeryDepartmentsCollection =
//       db_connect.collection("bakerydepartments");
//     const resultBakeryDepartments = await bakeryDepartmentsCollection
//       .find({})
//       .sort({ pricePer100g: -1 })

//       .toArray();

//     // Query ONLY the title of docs from second collection
//     const produceDepartmentsCollection =
//       db_connect.collection("producedepartments");
//     const resultProduceDepartments = await produceDepartmentsCollection
//       .find({})
//       .sort({ pricePer100g: -1 })

//       .toArray();

//     // Query ONLY the title of docs from second collection
//     const cannedAndDryDepartmentsCollection = db_connect.collection(
//       "cannedanddrydepartments"
//     );
//     const resultCannedAndDryDepartments =
//       await cannedAndDryDepartmentsCollection
//         .find({})
//         .sort({ pricePer100g: -1 })
//         .toArray();

//     // Query ONLY the title of docs from second collection
//     const frozenFoodDepartments = db_connect.collection(
//       "frozenfooddepartments"
//     );
//     const resultFrozenFoodDepartments = await frozenFoodDepartments
//       .find({})
//       .sort({ pricePer100g: -1 })

//       .toArray();

//     // Query ONLY the title of docs from second collection
//     const refrigeratedFoodSections = db_connect.collection(
//       "cannedanddrydepartments"
//     );
//     const resultRefrigeratedFoodSections = await refrigeratedFoodSections
//       .find({})
//       .sort({ pricePer100g: -1 })

//       .toArray();

//     // Combine ALL results from collections
//     const combinedResults = [
//       ...resultMeatDepartmens,
//       ...resultBakeryDepartments,
//       ...resultProduceDepartments,
//       ...resultCannedAndDryDepartments,
//       ...resultFrozenFoodDepartments,
//       ...resultRefrigeratedFoodSections,
//     ];

//     // Order result alphabetically
//     combinedResults.sort((a, b) => {
//       const titleA = a.title.toUpperCase();
//       const titleB = b.title.toUpperCase();

//       if (titleA < titleB) {
//         return -1;
//       }
//       if (titleA > titleB) {
//         return 1;
//       }
//       return 0;
//     });

//     // Remove duplicated results
//     // const uniqueNames = {};

//     // const filteredArray = combinedResults.filter((obj) => {
//     //   if (!uniqueNames[obj.title]) {
//     //     uniqueNames[obj.title] = true;
//     //     return true;
//     //   }
//     //   return false;
//     // });

//     // console.log(filteredArray);
//     // console.log(filteredArray.length + ' products in the basket');

//     // IT QUERIES ALL DOCUMENTS, BUT RENDERS ONLY THE FIRST ONE
//     const title = req.params.title;
//     const selectedDocument = combinedResults.find((doc) => doc.title === title);

//     if (!selectedDocument) {
//       res.status(404).json({ error: "Document not found" });
//     } else {
//       res.json(selectedDocument);
//       console.log("User selected: ");
//       console.log(selectedDocument);
//     }
//   } catch (error) {
//     console.error("Error querying collections:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });


// Route for TESTING single documents //
// Route for TESTING single documents //
// Route for TESTING single documents //

recordRoutes.route("/test").get(async function (req, res) {
  try {
    const db_connect = dbo.getDb("foodbasket");

    const projection = { title: 1, _id: 0, price: 1, url: 1 };

    // Query ONLY the title of docs from the second collection
    const produceDepartments = db_connect.collection("producedepartments");

/* create lowestPricePer100g and averagePricePer100g field */
/* create lowestPricePer100g and averagePricePer100g field */
/* create lowestPricePer100g and averagePricePer100g field */

const updateField = [
  {
    $group: {
      _id: "$title",
      lowestPrice: { $min: "$pricePer100g" },
      totalPrice: { $sum: "$pricePer100g" },
      count: { $sum: 1 } // Count the number of documents in each group
    }
  },
  {
    $project: {
      _id: 1,
      lowestPrice: 1,
      averagePricePer100g: { $divide: ["$totalPrice", "$count"] }
    }
  },
  {
    $project: {
      _id: 1,
      lowestPrice: 1,
      averagePricePer100g: { $round: ["$averagePricePer100g", 4] }
    }
  }
];

const resultAggregation = await produceDepartments.aggregate(updateField).toArray();

// Update all documents in the collection
const resultAdded = await produceDepartments.updateMany(
  {},
  [
    {
      $set: {
        lowestPricePer100g: {
          $first: "$lowestPrice"
        },
        averagePricePer100g: {
          $first: "$averagePricePer100g"
        }
      }
    }
  ]
);

// Retrieve and modify all documents in the collection
const resultProduceDepartments = await produceDepartments.find({}).toArray();

const combinedResults = resultProduceDepartments.map(doc => {
  const matchingAggregationResult = resultAggregation.find(aggr => aggr._id === doc.title);
  doc.lowestPricePer100g = matchingAggregationResult ? matchingAggregationResult.lowestPrice : null;
  doc.averagePricePer100g = matchingAggregationResult ? matchingAggregationResult.averagePricePer100g : null;
  return doc;
});

console.log(combinedResults.length + " items");
res.json(combinedResults);



  
} catch (error) {
  console.error("Error querying collections:", error);
  res.status(500).send("Internal Server Error");
}
});

recordRoutes.route("/details/:title").get(async function (req, res) {
    try {
      const db_connect = dbo.getDb("foodbasket");
      const collectionNames = [
        "meatdepartments",
        "bakerydepartments",
        "producedepartments",
        "cannedanddrydepartments",
        "frozenfooddepartments",
        "refrigeratedfoodsections",
      ];
    
      const combinedResults = [];
    
      for (const collectionName of collectionNames) {
        const currentCollection = db_connect.collection(collectionName);
    
        // Your existing aggregation pipeline
        const updateField = [
          {
            $group: {
              _id: "$title",
              lowestPrice: { $min: "$pricePer100g" },
              totalPrice: { $sum: "$pricePer100g" },
              count: { $sum: 1 } // Count the number of documents in each group
            }
          },
          {
            $project: {
              _id: 1,
              lowestPrice: 1,
              averagePricePer100g: { $divide: ["$totalPrice", "$count"] }
            }
          },
          {
            $project: {
              _id: 1,
              lowestPrice: 1,
              averagePricePer100g: { $round: ["$averagePricePer100g", 3] }
            },
          }
        ];
    
        const resultAggregation = await currentCollection.aggregate(updateField).toArray();
    
        // Retrieve and modify all documents in the current collection
        const resultDocuments = await currentCollection
        .find({})
        .sort({ pricePer100g: -1 })
        .toArray();
    
        const combinedResultsForCollection = resultDocuments.map(doc => {
          const matchingAggregationResult = resultAggregation.find(aggr => aggr._id === doc.title);
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
    
      console.log(filteredArray.length + " products in the basket");
    
      // IT QUERIES ALL DOCUMENTS, BUT RENDERS ONLY THE FIRST ONE
      const title = req.params.title;
      const selectedDocument = filteredArray.find((doc) => doc.title === title);
    
      if (!selectedDocument) {
        res.status(404).json({ error: "Document not found" });
      } else {
        res.json(selectedDocument);
        console.log("User selected: ");
        console.log(selectedDocument);
      }
    } catch (error) {
      console.error("Error querying collections:", error);
      res.status(500).send("Internal Server Error");
    }
  });
    

module.exports = recordRoutes;