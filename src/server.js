// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const User = require('../models/user'); // Import User model
// const User = require('../models/comment'); // Import Comment model
const path = require("path")
const app = express();
const port = 3000;
const Grid = require('gridfs-stream');
const { Readable } = require('stream');
const { GridFSBucket } = require('mongodb');



app.use(express.json()); // For parsing JSON data
app.use(express.urlencoded({ extended: true }));
app.use("/css",express.static(__dirname+"/css"))
app.use("/img",express.static(__dirname+"/img"))
console.log(__dirname);

// Serve the static HTML page
app.use(express.static('public'));


// MongoDB connection
const mongoURI = 'mongodb+srv://MiVii:MiVii%40123@userauth.q7w4z.mongodb.net/userDB?retryWrites=true&w=majority&appName=userauth'; // Use your MongoDB URI
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB:', err));
const conn = mongoose.connection;

// Registration route
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
   
    try {
        const user = new User({ name, email, password });
        await user.save();
        console.log("user created")
        res.status(201).json({msg:'User registered successfully'})

    } catch (err) {
        res.status(500).send({ message: 'Error registering user', error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({email:email})
        if(!user){
            res.status(400).json({error:"no user found"})
            return
        }
        if(user.password !== password){
            res.status(400).json({error:"Invalid password"})
            return
        }

        res.status(200).json({msg:'User login success'})

    } catch (err) {
        res.status(500).send({ message: 'Error registering user', error: err.message });
    }
});


app.post('/admin_login', (req, res) => {
    const { email, password } = req.body;

    // Check if credentials match the admin's
    if (email === 'admin@gmail.com' && password === 'admin') {
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

// API route to fetch all comments for admin view
app.get('/admin/comments', async (req, res) => {
    try {
        const comments = await Comment.find(); // Fetch all comments from the database
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching comments' });
    }
});




app.get("/",(req,res) => {
    res.sendFile(path.join(path.resolve(),"views","login.html"))
})


app.get("/admin",(req,res) => {
    res.sendFile(path.join(path.resolve(),"views","admin_login.html"))
})

app.get("/register", (req,res) => {
    res.sendFile(path.join(path.resolve(),"views","signup.html"))
})

app.get("/admin_frame",(req,res) => {
    res.sendFile(path.join(path.resolve(),"views","admin_frame.html"))
})

app.get("/frame", (req,res) => {
    res.sendFile(path.join(path.resolve(),"views","frame.html"))
})

app.get("/redirect", (req,res) => {
    res.sendFile(path.join(path.resolve(),"views","login.html"))
})

app.get("/admin_museums", (req,res) => {
    res.sendFile(path.join(path.resolve(),"views","admin_museums.html"))
})

app.get("/admin_events", (req,res) => {
    res.sendFile(path.join(path.resolve(),"views","admin_events_imageinclude.html"))
})

// Route to serve distance.html
app.get('/distance.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'distance.html'));
  });

// Route to login page upon clicking logout feature 
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  
  // Route to admin_login page upon clicking logout feature

  app.get('/admin_login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_login.html'));
  });

 


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});




// Comments DATA STORAGE FLOW


const commentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique:true
    },
        comment: String,
        date: { type: Date, default: Date.now }
});

// Create a Model for Comments
const Comment = mongoose.model('Comment', commentSchema);

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// API to handle form submission and save comments
app.post('/submit-comment', (req, res) => {
    const newComment = new Comment({
        email: req.body.email,
        comment: req.body.comment
    });

    newComment.save()
        .then(() => res.send('Comment saved successfully'))
        .catch(err => res.status(500).send('Error saving comment'));
});


app.get('/help.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'help.html'));
  });

  app.get('/museums.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'museums.html'));
  });

  app.get('/event.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'event.html'));
  });


  
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



  // Museum Database 

// Define a Mongoose schema for the museum
// Define a schema for museums
const MuseumSchema = new mongoose.Schema({
    museum_name: String,
    location: String,
    established: String,
    theme: String,
    timings: {
        weekdays: String,
        weekends: String,
    },
});


// Create a model from the schema
const Museum = mongoose.model('Museum', MuseumSchema);

// API route for searching museums
app.get('/search', async (req, res) => {
    const { museumName, location, artwork, maxPrice } = req.query;

    // Build the MongoDB query dynamically
    let query = {};
    if (museumName) query.museum_name = new RegExp(museumName, 'i'); // Case-insensitive search
    if (location) query.location = location;
    if (artwork) query.famous_artworks = { $regex: artwork, $options: 'i' }; // Case-insensitive artwork search
    if (maxPrice) query.ticket_price = { $lte: parseFloat(maxPrice) }; // Less than or equal to specified price

    try {
        // Fetch data from MongoDB using the query
        const museums = await Museum.find(query);
        res.json(museums);
    } catch (err) {
        res.status(500).send({ error: 'Database query failed' });
    }
});



// CREATE: Add a new museum
app.post('/admin/museums', async (req, res) => {
    try {
        const newMuseum = new Museum(req.body);
        await newMuseum.save();
        res.status(201).json(newMuseum);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// READ: Get all museums
app.get('/admin/museums', async (req, res) => {
    try {
        const museums = await Museum.find();
        res.json(museums);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE: Update an existing museum
app.put('/admin/museums/:id', async (req, res) => {
    try {
        const updatedMuseum = await Museum.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedMuseum);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE: Remove a museum
app.delete('/admin/museums/:id', async (req, res) => {
    try {
        await Museum.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// admin page events add 

// Set up storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid filename conflicts
    }
});

const upload = multer({ storage: storage });

// Define Mongoose schema for events
const eventSchema = new mongoose.Schema({
    museumName: String,
    location: String,
    description: String,
    imageUrl: String
});

const Event = mongoose.model('Event', eventSchema);

// API to handle file upload and store event data
app.post('/api/events', upload.single('image'), async (req, res) => {
    try {
        const { museumName, location, description } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

        const event = new Event({
            museumName,
            location,
            description,
            imageUrl
        });

        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save event' });
    }
});

// API to serve images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API to get all events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve events' });
    }
});

// API to delete an event
app.delete('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        // Check if the provided ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        // Try to find and delete the event by ID
        const deletedEvent = await Event.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);  // Log the error to debug
        res.status(500).json({ error: 'Failed to delete event' });
    }
});