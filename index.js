const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const app = express()
const jwt = require('jsonwebtoken')
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//middle ware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xgyce0q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })

}

async function run() {
    try {
        const categoryCollection = client.db('Laptop-Genics').collection('categories')
        const productsCollection = client.db('Laptop-Genics').collection('products')
        const bookingCollection = client.db('Laptop-Genics').collection('laptop-bookings')
        const usersCollection = client.db('Laptop-Genics').collection('users')
        const paymentsCollection = client.db('Laptop-Genics').collection('payments');
        const advertiseCollection = client.db('Laptop-Genics').collection('advertise');
        const reportCollection = client.db('Laptop-Genics').collection('admin-report');

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).toArray()
            res.send(result)
        })
        //-----------------products data -----------------------
        app.get('/products', async (req, res) => {
            const query = {}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            
            const query = { category_id: id };
            // const paidProduct = await paymentsCollection.find(query).toArray()  
            //  console.log(paidProduct)  
            const result = await productsCollection.find(query).toArray();
           
            // paidProduct.forEach( option => {
            //     const optionBooked = result.filter(book => book.name === option.name)
            //     const bookedSlot = optionBooked.map(book => book.name)
            //     const remainingSlots = result.filter( slot => !bookedSlot.includes(slot))
            //     option.name = remainingSlots
               
                
            // console.log(remainingSlots)
             
            // })

  
            res.send(result);
        })
        //--------------------------jwt token--------------------
        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            console.log(user)
            res.status(403).send({ accessToken: '' })

        })

        //-------------------------booked products-----------------------
        app.get('/bookedLaptop', verifyJWT, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }       
            const query = { email: email};
           
            // console.log(req.headers.authorization)
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/bookedLaptop/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
        })

        app.post('/bookedLaptop', async (req, res) => {
            const booking = req.body
            const query = {productName: booking.productName }     
            const alreadyBooked = await bookingCollection.find(query).toArray()
            // console.log(alreadyBooked)
            if(alreadyBooked.length){
                const message = `Sorry, This Product Booked`
                return res.send({acknowledged: false, message})
            }
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })

        // -----------user data -----------------
        app.get('/users', async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const queryAll = {}
            // console.log(req.headers.authorization)
            const result = await usersCollection.find(query).toArray()

            // console.log(result)
            res.send(result)
        })
       
        app.post('/users', async (req, res) => {
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

        app.get('/dashboard/allSellers/:id', async (req, res) => {
            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result)
        })
        app.delete('/dashboard/allSellers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        //------------------------ALL buyer--------------------------
        app.get('/users/allBuyers', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            const sellers = users.filter(user => user.role === 'buyer')
            res.send(sellers);
        })

        app.get('/dashboard/allBuyers/:id', async (req, res) => {
            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result)
        })
        app.delete('/dashboard/allBuyers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })


        //--------------------add a product and my product----------------------
        app.post('/products', async (req, res) => {
            const item = req.body
            // console.log(item)
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
        app.get('/dashboard/products/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result)
        })
        app.delete('/dashboard/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        //------------------------------payment------------------------
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.resalePrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });
        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
            // console.log(updatedResult)
            res.send(result);
        })
         //////-----------------advertise product --------------------------

         app.get('/advertise', async (req, res) => {
            const query = {};

            const result = await advertiseCollection.find(query).toArray()
            res.send(result);
        })
         app.post('/advertise', async (req, res) => {
            const user = req.body;
            // const query = {name: user.name }     
            // const alreadyAdvertised = await productsCollection.find(query).toArray()
            // console.log(alreadyAdvertised)
            // if(alreadyAdvertised){
            //     const message = `Sorry, This Product Advertised`
            //     return res.send({acknowledged: false, message})
            // }
            const result = await advertiseCollection.insertOne(user)
            res.send(result);
        })

        /// -----------------report to admin---------------------
        
        app.get('/reportAdmin', async (req, res) => {
            const query = {};
            const result = await reportCollection.find(query).toArray()
            res.send(result);
        })
        app.post('/reportAdmin', async (req, res) => {
            const user = req.body;
            const result = await reportCollection.insertOne(user)
            res.send(result);
        })
        app.delete('/dashboard/adminReport/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reportCollection.deleteOne(query);
            res.send(result)
        })



    }
    finally {

    }
}
run().catch(err => console.log(err))

app.get('/', (req, res) => {
    res.send('laptop genic running')
})

app.listen(port, () => {
    console.log(`laptop genic is running ${port}`)
})