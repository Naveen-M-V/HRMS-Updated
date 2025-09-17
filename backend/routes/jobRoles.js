const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Get all job roles
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('hrms');
    const collection = database.collection('jobroles');
    
    const jobRoles = await collection.find({}).toArray();
    res.json(jobRoles);
  } catch (error) {
    console.error('Error fetching job roles:', error);
    res.status(500).json({ error: 'Failed to fetch job roles' });
  } finally {
    await client.close();
  }
});

// Search job roles
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    await client.connect();
    const database = client.db('hrms');
    const collection = database.collection('jobroles');
    
    const jobRoles = await collection.find({
      name: { $regex: q, $options: 'i' }
    }).toArray();
    
    res.json(jobRoles);
  } catch (error) {
    console.error('Error searching job roles:', error);
    res.status(500).json({ error: 'Failed to search job roles' });
  } finally {
    await client.close();
  }
});

// Add new job role
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Job role name is required' });
    }

    await client.connect();
    const database = client.db('hrms');
    const collection = database.collection('jobroles');
    
    // Check if job role already exists
    const existingJobRole = await collection.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' }
    });
    
    if (existingJobRole) {
      return res.status(409).json({ error: 'Job role already exists' });
    }
    
    const newJobRole = {
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(newJobRole);
    const insertedJobRole = await collection.findOne({ _id: result.insertedId });
    
    res.status(201).json(insertedJobRole);
  } catch (error) {
    console.error('Error adding job role:', error);
    res.status(500).json({ error: 'Failed to add job role' });
  } finally {
    await client.close();
  }
});

module.exports = router;
