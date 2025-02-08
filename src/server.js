const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

require('dotenv').config();
// Connect to MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err.message));

// Define Space Schema
const SpaceSchema = new mongoose.Schema({
    SpCode: { type: String, required: true, unique: true },
    name: { type: String, required: true }
});

// Define Project Schema
const projectSchema = new mongoose.Schema({
    SpCode: { type: String, required: true },
    projectCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true },
    teamLead: { type: String, required: true },
    members: [{ type: String }],
    comments: [{
        comment: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }]
});

// Define Task Schema
const taskSchema = new mongoose.Schema({
    SpCode: { type: String, required: true },
    projectId: { type: String, required: true },
    taskId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    status: { type: String, required: true },
    assignedTo: { type: String, required: true },
    priority: { type: String, required: true },
    assignedBy: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    comments: [{
        author: { type: String },
        text: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
});

// Define Models
const Space = mongoose.model('Spaces', SpaceSchema);
const Project = mongoose.model('Projects', projectSchema);
const Task = mongoose.model('Tasks', taskSchema);

// API Routes

// Get a space by SpCode
app.get('/api/space/:SpCode', async (req, res) => {
    try {
        const space = await Space.findOne({ SpCode: req.params.SpCode });
        if (!space) return res.status(404).json({ error: 'Space not found' });
        res.json(space);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching Space details' });
    }
});

// Create a new space
app.post('/api/space/create', async (req, res) => {
    try {
        const { SpCode, name } = req.body;

        if (!SpCode || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newSpace = new Space({ SpCode, name });
        await newSpace.save();
        res.status(201).json(newSpace);
    } catch (err) {
        res.status(400).json({ error: 'Error creating Space', details: err.message });
    }
});

// Get all projects for an Space
app.get('/api/space/:SpCode/projects', async (req, res) => {
    try {
        const projects = await Project.find({ SpCode: req.params.SpCode });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get a single project by projectCode
app.get('/api/space/:SpCode/projects/:projectCode', async (req, res) => {
    try {
        const project = await Project.findOne({ SpCode: req.params.SpCode, projectCode: req.params.projectCode });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching project details' });
    }
});

// Create a new project
app.post('/api/space/:SpCode/projects/create', async (req, res) => {
    try {
        const { SpCode, projectCode, name, description, teamLead, members, status } = req.body;

        if (!SpCode || !projectCode || !name || !description || !teamLead || !members || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newProject = new Project({ SpCode, projectCode, name, description, teamLead, members, status });
        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(400).json({ error: 'Error creating project', details: err.message });
    }
});

// Update a project by projectCode
app.put('/api/space/:SpCode/projects/:projectCode/update', async (req, res) => {
    try {
        const { name, description, teamLead, members, status } = req.body;

        if (!name && !description && !teamLead && !members && !status) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updatedProject = await Project.findOneAndUpdate(
            { SpCode: req.params.SpCode, projectCode: req.params.projectCode },
            { $set: { name, description, teamLead, members, status } },
            { new: true }
        );

        if (!updatedProject) return res.status(404).json({ error: 'Project not found' });
        res.json(updatedProject);
    } catch (err) {
        res.status(400).json({ error: 'Error updating project', details: err.message });
    }
});

// Get all tasks for an Space
app.get('/api/space/:SpCode/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({ SpCode: req.params.SpCode });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get a single task by taskId
app.get('/api/space/:SpCode/tasks/:taskId', async (req, res) => {
    try {
        const task = await Task.findOne({ SpCode: req.params.SpCode, taskId: req.params.taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching task details' });
    }
});

// Create a new task
app.post('/api/space/:SpCode/tasks/create', async (req, res) => {
    try {
        const { SpCode, projectId, taskId, title, status, assignedTo, priority, assignedBy, description, deadline } = req.body;

        if (!SpCode || !projectId || !taskId || !title || !status || !assignedTo || !priority || !assignedBy || !description || !deadline) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const newTask = new Task({ SpCode, projectId, taskId, title, status, assignedTo, priority, assignedBy, description, deadline });
        await newTask.save();

        res.status(201).json(newTask);
    } catch (err) {
        console.error("Error creating task:", err);
        res.status(500).json({ error: 'Error creating task', details: err.message });
    }
});

// Update a task by taskId
app.put('/api/space/:SpCode/tasks/:taskId/update', async (req, res) => {
    try {
        const { title, status, assignedTo, priority, assignedBy, description, deadline } = req.body;

        if (!title && !status && !assignedTo && !priority && !assignedBy && !description && !deadline) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updatedTask = await Task.findOneAndUpdate(
            { SpCode: req.params.SpCode, taskId: req.params.taskId },
            { $set: { title, status, assignedTo, priority, assignedBy, description, deadline } },
            { new: true }
        );

        if (!updatedTask) return res.status(404).json({ error: 'Task not found' });
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ error: 'Error updating task', details: err.message });
    }
});

// Add a comment to a project
app.post('/api/space/:SpCode/projects/:projectCode/comments', async (req, res) => {
    try {
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ error: 'Comment is required' });
        }

        const project = await Project.findOneAndUpdate(
            { SpCode: req.params.SpCode, projectCode: req.params.projectCode },
            { $push: { comments: { comment, date: Date.now() } } },
            { new: true }  // This returns the updated document
        );
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Error adding comment to project', details: err.message });
    }
});

// Add a comment to a task
app.post('/api/space/:SpCode/tasks/:taskId/comments', async (req, res) => {
    try {
        const { author, text } = req.body;

        if (!author || !text) {
            return res.status(400).json({ error: 'Author, and text are required' });
        }

        const task = await Task.findOne({ SpCode: req.params.SpCode, taskId: req.params.taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        task.comments.push({ author, text, timestamp: Date.now() });
        await task.save();

        res.json(task);
    } catch (err) {
        res.status(400).json({ error: 'Error adding comment to task', details: err.message });
    }
});

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));


app.get(/^(?!\/api).+/, (req, res) =>{
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  })

// Start the server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});