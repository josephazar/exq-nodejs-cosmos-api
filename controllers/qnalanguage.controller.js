require('dotenv').config();
const fs = require('fs');
const {MongoClient, ObjectId} = require('mongodb');
const axios = require('axios');
const url = process.env.COSMOS_CONNECTION_STRING;
const dbname = process.env.COSMOS_DB_NAME;

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

 exports.chatbotqaAdd = async function(req, res, next) {
    const client = new MongoClient(url);
    try {
        // Get the question, answer, and department from the request body
        const question = req.body.question;
        const answer = req.body.answer;
        const department = req.body.department;
        const category = req.body.category;

        // Access the required database and collection
        const db = client.db(dbname);
        const collection = db.collection("questionsanswers");

        // Insert the new document
        const result = await collection.insertOne({
            question: question,
            answer: answer,
            department: department,
            category: category
        });
      res.status(200).json({ message: "Question and answer added successfully." });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    } finally {
      // Close the database connection
      await client.close();
  }
}
exports.chatbotqaDelete = async (req, res) => { 
    const client = new MongoClient(url);
    try {
        // Extract ID from request body
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: "ID is required" });
            return;
        }
        console.log(id);
        // Connect to the database
        await client.connect();
        // Access the required database and collection
        const db = client.db(dbname);
        const collection = db.collection("questionsanswers");
        // Delete the document with the specified ID
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        // Check if a document was actually deleted
        if (result.deletedCount === 1) {
            res.json({ success: true, message: 'Document successfully deleted!' });
        } else {
            res.json({ success: false, message: 'No document found with the provided ID.' });
        }
    } catch (err) {
      console.log(err);
      res.json({ success: false });
    } finally {
      // Close the database connection
      await client.close();
    }
 }

exports.chatbotqaUpdateSource = async function(req, res) {
  req.setTimeout(600000); // 10 minutes
  console.log("Source URI:", process.env.AZURE_FAQ_SOURCE_URI);
  const refreshData = [
    {
        "op": "replace",
        "value": {
            "displayName": process.env.AZURE_FAQ_SOURCE_NAME,
            "sourceKind": "url",
            "sourceUri": process.env.AZURE_FAQ_SOURCE_URI,
            "source": process.env.AZURE_FAQ_SOURCE_URI,
            "refresh": "true"
        }
    }
];
    console.log(refreshData);
    await axios({
        method: 'patch',
        url: `${process.env.LANGUAGE_ENDPOINT}language/query-knowledgebases/projects/${process.env.LANGUAGE_PROJECT}/sources?api-version=2021-10-01`,
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.Ocp_Apim_Subscription_Key,
            'Content-Type': 'application/json'
        },
        data: refreshData
    }).then(response => {
        console.log('Response Code:', response.status);
        console.log('Response Data:', response);
        console.log('Request Succeeded');
    })
    .catch(error => {
        if (error.response) {
            console.log('Response Code:', error.response.status);
        }
        console.log(error.message)
        console.log('Request Failed');
    });
    // Update the knowledge base
    await delay(3000); // Delay in seconds
    // If soruce url refresh succeeded, then deploy
    let response = await axios({
        method: 'put',
        url: `${process.env.LANGUAGE_ENDPOINT}language/query-knowledgebases/projects/${process.env.LANGUAGE_PROJECT}/deployments/production?api-version=2021-10-01`,
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.Ocp_Apim_Subscription_Key,
            'Content-Type': 'application/json'
        },
    });
    res.status(200).json({ message: "Question and answer added and knowledge base deployed" });
}


 exports.getQNA = async function(req, res) {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('questionsanswers');
        const questions = await collection.find().toArray();
        const response = questions.map(doc => {
            return {
                id: doc._id,
                questions: doc.question,
                answer: doc.answer,
                department: doc.department,
                category: doc.category,
            }
        });
        res.json(response);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
 }

 exports.initMongoDbQNA = async function(req, res) {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log("Connected correctly to server")
        const db = client.db(dbname);
        console.log(`Connected correctly to database ${db.databaseName}`)
        const collection = db.collection('questionsanswers');
        console.log(`Connected correctly to collection ${collection.collectionName}`);
        const documents = JSON.parse(fs.readFileSync('./data/kb_init.json', 'utf8'));
        await collection.insertMany(documents);
        console.log("Inserted documents into the collection");
        const questions = await collection.find().toArray();
        res.json(questions);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
 }

 exports.getQnAHtml = async function(req, res) {
    req.setTimeout(600000); // 10 minutes
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('questionsanswers');
        const questions = await collection.find().toArray();
        // Generate HTML
        let html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Q&A</title></head><body>';

        // Sort by department and category
        const sortedByDepartment = questions.reduce((acc, curr) => {
            const department = acc.find(dep => dep.name === curr.department);
            if (department) {
                const category = department.categories.find(cat => cat.name === curr.category);
                if (category) {
                    category.questions.push(curr);
                } else {
                    department.categories.push({
                        name: curr.category,
                        questions: [curr]
                    });
                }
            } else {
                acc.push({
                    name: curr.department,
                    categories: [{
                        name: curr.category,
                        questions: [curr]
                    }]
                });
            }
            return acc;
        }, []);

        // Append to HTML
        sortedByDepartment.forEach(dep => {
            html += `<h1>${dep.name}</h1>`;
            dep.categories.forEach(cat => {
                html += `<h2>${cat.name}</h2>`;
                cat.questions.forEach(q => {
                    html += `<h3>${q.question}</h3><p>${q.answer}</p>`;
                });
            });
        });

        html += '</body></html>';
        // Send HTML response
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
 };