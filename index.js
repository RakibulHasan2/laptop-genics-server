const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const app = express()
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//middle ware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xgyce0q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
 

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
         req.decoded = decoded;
         next()
    })

 }

async function run(){
    try{
        const categoryCollection = client.db('Laptop-Genics').collection('categories')
        const productsCollection = client.db('Laptop-Genics').collection('products')
        const bookingCollection = client.db('Laptop-Genics').collection('laptop-bookings')
        const usersCollection = client.db('Laptop-Genics').collection('users')
        
        app.get('/categories', async( req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).toArray()
            res.send(result)
        })
     //-----------------products data -----------------------
        app.get('/products', async( req, res) => {
            const query = {}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })
        //--------------------------jwt token--------------------
        app.get('/jwt', async(req, res) =>{
            const email  = req.query.email
            const query = {email :email}
            const user = await usersCollection.findOne(query)
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'})
                 return res.send({accessToken: token})
            }
            console.log(user)
            res.status(403).send({accessToken: ''})

        })

        //-------------------------booked products-----------------------
        app.get('/bookedLaptop',verifyJWT, async( req,res) =>{
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = {email: email};
            // console.log(req.headers.authorization)
            const result =  await bookingCollection.find(query).toArray()
            res.send(result)
        })
       
        app.post('/bookedLaptop', async(req, res) => {
            const booking = req.body
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })

        // -----------user data -----------------
        app.get('/users', async(req, res) =>{
            const query = {}
            const users = await usersCollection.find(query).toArray()
            res.send(users)
          })
        app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result);
        })
         //------------------------ALL seller--------------------------
       app.get('/users/allSellers', async (req, res) => {
        const query = {};
        const users = await usersCollection.find(query).toArray();     
        const sellers = users.filter(user => user.role === 'seller')
        res.send(sellers);
    })
    //------------------------ALL buyer--------------------------
    app.get('/users/allBuyers', async (req, res) => {
        const query = {};
        const users = await usersCollection.find(query).toArray();     
        const sellers = users.filter(user => user.role === 'buyer')
        res.send(sellers);
    })


   //--------------------add a product and my product----------------------
      app.post('/products', async( req, res) => {
       const item = req.body
       console.log(item)
       const result = await productsCollection.insertOne(item)
       res.send(result)
       })  

       app.get('/dashboard/products', async (req, res) => {
        const email = req.query.email
        // const decodedEmail = req.decoded.email
        // if(email !== decodedEmail){
        //     return res.status(403).send({message: 'forbidden access'})
        // }
        const query = { email: email };
        // console.log(req.headers.authorization)
        const result = await productsCollection.find(query).toArray()
        res.send(result)
    })   

    }
    finally{

    }
}
run().catch(err=> console.log(err))

app.get('/', (req, res)=>{
    res.send('laptop genic running')
})

app.listen(port,() => {
    console.log(`laptop genic is running ${port}`)
})