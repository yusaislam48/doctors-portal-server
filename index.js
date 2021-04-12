const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const app = express()
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('doctors'));
app.use(fileUpload());

const port = process.env.PORT || 4000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gxiyr.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db("doctorsPortal").collection("appointments");
  
  const doctorCollection = client.db("doctorsPortal").collection("doctors");
  
  //Add Appointment Form Client
  app.post('/addAppointment', (req, res) => {
      const appointment = req.body;
      console.log(appointment)
      appointmentCollection.insertOne(appointment)
      .then(result => {
          res.send(result);
      })
  })

  //find appointments by date appointments
  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;

    doctorCollection.find({email: email})
    .toArray((error, doctors) => {
      const filter = {date: date.date};
      if(doctors.length == 0){
        filter.email = email;
      }

      appointmentCollection.find(filter)
      .toArray((error, documents) => {
        res.send(documents);
      })

    })     
})

//get all appointments info
  app.get('/appointments', (req, res) => {
    appointmentCollection.find({})
    .toArray((error, documents) => {
      res.send(documents);
    })  
  })

  //add a new doctor to database
  app.post('/addADoctor', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const filePath = `${__dirname}/doctors/${file.name}`;
    console.log(name, email, file)

    file.mv(filePath, err => {
      if(err){
        console.log(err)
        res.status(500).send({msg: 'Failed to upload image to server'})
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString('base64');

      var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
      };

      doctorCollection.insertOne({name, email, image})
      .then(result => {
        fs.remove(filePath, error => {
          if(error) {
            console.log(error)
          res.status(500).send({msg: 'Failed to upload image to mongo'})
          }
          res.send(result.insertedCount > 0);
        })
      })
      // return res.send({name: file.name, path: `/${file.name}`})
    })
  })

  //get all doctor data prom database
  app.get('/doctors', (req, res) => {
    doctorCollection.find({})
        .toArray((err, documents) => {
            res.send(documents);
        })
  });

  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;

    doctorCollection.find({email: email})
    .toArray((error, doctors) => {
      res.send(doctors.length > 0);
    })     
})



});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})