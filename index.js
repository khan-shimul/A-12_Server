const express= require('express')
const app =express();
const cors =require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const port= process.env.PORT || 5000;

// middlewar
app.use(cors())
app.use(express.json())






const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hzfjxhp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection =client.db('12RealEstate').collection('user')
    const propertyCollection =client.db('12RealEstate').collection('property')
    const wishCollection = client.db("12RealEstate").collection('wish')
    const reviewCollection = client.db("12RealEstate").collection('review')
    const offerPropertyCollection = client.db("12RealEstate").collection('offeredProperty')
    const paymentCollection = client.db("12RealEstate").collection('payment')



// jwt api
app.post('/jwt',async(req,res)=>{
  const user= req.body;
  const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
    expiresIn:'4h'
  })
  res.send({token})
})



// middleware
const verifyToken= (req,res,next)=>{
  // console.log( 'inside verify',req.headers.authorization)

  if(!req.headers.authorization){
return res.status(401).send({message: 'unauthorized access'})
  }
  const token= req.headers.authorization.split(' ')[1]
 jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
  if(err){
    return res.status(401).send({message: 'unauthorized access'})
  }
  req.decoded= decoded
  next()
 }) 
}

// admin verify
const verifyAdmin= async(req,res,next)=>{
  const email= req.decoded.email
  const query ={email: email}
  const user= await userCollection.findOne(query)
  const isAdmin= user?.role === 'admin'
  if(!isAdmin){
    return res.status(403).send({message: 'forbidden access'})
  }
  next()
}

// agent verify
const verifyAgent= async(req,res,next)=>{
  const email= req.decoded.email
  const query ={email: email}
  const user= await userCollection.findOne(query)
  const isAgent= user?.role === 'agent'
  if(!isAgent){
    return res.status(403).send({message: 'forbidden access'})
  }
  next()
}


// user related apis

app.get('/users',verifyToken,verifyAdmin, async (req,res)=>{
  const result= await userCollection.find().toArray();
  
  res.send(result)
})

    app.post('/users',async(req,res)=>{
      const user = req.body
      const query= {email:user.email}
      const existingUser= await userCollection.findOne(query)
      if(existingUser){
        return res.send({message:'user already exist'})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    
    })


    app.delete('/users/:id', verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id
      const query= {_id: new ObjectId(id)}
      const result= await userCollection.deleteOne(query)
      res.send(result)
    })

// Admin apies

app.patch('/users/admin/:id', verifyToken,verifyAdmin, async(req,res)=>{
  const id = req.params.id
  const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      role:'admin'
    }
  }
  const result =await userCollection.updateOne(filter,updatedDoc)
  res.send(result)
})

// admin check
app.get('/user/admin/:email',verifyToken,async(req,res)=>{
  const email= req.params.email
  if(email !== req.decoded.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  const query={email:email};
  const user= await userCollection.findOne(query)
  let admin=false;
  if(user){
    admin = user?.role === 'admin';
  
  }
  res.send({admin})
  })

  // agent api
app.patch('/users/agent/:id', verifyToken,verifyAdmin, async(req,res)=>{
  const id = req.params.id
  const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      role:'agent'
    }
  }
  const result =await userCollection.updateOne(filter,updatedDoc)
  res.send(result)
})

// agent check
app.get('/user/agent/:email',verifyToken,async(req,res)=>{
  const email= req.params.email
  if(email !== req.decoded.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  const query={email:email};
  const user= await userCollection.findOne(query)
  let agent=false;
  if(user){
    agent = user?.role === 'agent';
  
  }
  res.send({agent})
  })



  // property apis
  app.post('/property',verifyToken,verifyAgent, async(req,res)=>{
    const item = req.body
    const result = await propertyCollection.insertOne(item)
    res.send(result)
    })

app.get('/property',verifyToken,async(req,res)=>{
  const cursor =propertyCollection.find();
  const result =await cursor.toArray()
  res.send(result)
})



app.get('/propertu',verifyToken,verifyAgent,async(req,res)=>{
  const email = req.query.email
  const query= {agentEmail:email}
  const result =await propertyCollection.find(query).toArray()
  res.send(result)
})
// app.get('/property/:email',verifyToken,verifyAgent,async(req,res)=>{
//   const email = req.params.email
//   const query= {agentEmail:email}
//   const result =await propertyCollection.find(query).toArray()
//   res.send(result)
// })


// property verify
app.patch('/property/verify/:id', verifyToken,verifyAdmin, async(req,res)=>{
  const id = req.params.id
  const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      isVerified:true
    }
  }
  const result =await propertyCollection.updateOne(filter,updatedDoc)
  res.send(result)
})
// property reject
app.patch('/property/reject/:id', verifyToken,verifyAdmin, async(req,res)=>{
  const id = req.params.id
  const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      isVerified:'reject'
    }
  }
  const result =await propertyCollection.updateOne(filter,updatedDoc)
  res.send(result)
})

// admin verified property
app.get('/allproperty',verifyToken,async(req,res)=>{
  const query = { isVerified:true };
  const result = await propertyCollection.find(query).toArray();
  res.send(result)
})

// delete
app.delete('/property/:id',verifyToken,verifyAgent, async(req,res)=>{
  const id = req.params.id
  const query= {_id: new ObjectId(id)}
  const result= await propertyCollection.deleteOne(query)
  res.send(result)
})

// update


app.get('/property/:id',async(req,res)=>{
  const id= req.params.id
  const query={_id:new ObjectId(id)}
  const result=await propertyCollection.findOne(query)
  res.send(result)
})


app.put('/property/:id',async(req,res)=>{
  const id=req.params.id
  const filter={_id:new ObjectId(id)}
  const options={upsert:true}
  const updatedProperty=req.body
  const property={
    $set:{
      propertyName:updatedProperty.propertyName, 
     location:updatedProperty.location,
     agentName:updatedProperty.agentName,
     agentEmail:updatedProperty.agentEmail,
     photo:updatedProperty.photo,
     minPrice:updatedProperty.minPrice,
     maxPrice:updatedProperty.maxPrice,
    }
  }
const result=await propertyCollection.updateOne(filter,property,options)
res.send(result)
})
  
// wish
app.post('/wishlist', async (req, res) => {
  const  wishedProperty  = req.body;
//  console.log(wishedProperty)
  const result = await wishCollection.insertOne(wishedProperty);
  res.send(result);
});
app.get('/wishlists/:id', async(req,res)=>{
  const id = req.params.id
  const query= {_id: new ObjectId(id)}
  const result= await wishCollection.findOne(query)
  res.send(result)
})

app.get('/wishlist/:userEmail',verifyToken , async (req, res) => {
  const email= req.params.userEmail;
  const query = { userEmail: (email) }
  const wishedProperty = await wishCollection.find(query).toArray();
  res.send(wishedProperty);
})

app.delete('/wishlist/:id', async(req,res)=>{
  const id = req.params.id
  const query= {_id: new ObjectId(id)}
  const result= await wishCollection.deleteOne(query)
  res.send(result)
})
// review
app.post('/review', async (req, res) => {
  const review = req.body;
  // console.log(review)
  const result = await reviewCollection.insertOne(review);
  res.send(result)
});

app.get('/reviews', async (req, res) => {

  const review = await reviewCollection.find().sort({time: -1}).toArray();
  res.send(review);
});



app.get('/review/:propertyId', async (req, res) => {
  const id = req.params.propertyId;
  // console.log(id)
  const query = { propertyId: id };
  const review = await reviewCollection.find(query).toArray();
  res.send(review);
});

app.get('/reviews/:userEmail' , async (req, res) => {
  const email= req.params.userEmail;
  const query = { userEmail: (email) }
  const myReview = await reviewCollection.find(query).toArray();
  res.send(myReview);
})
app.delete('/reviews/:id', async(req,res)=>{
  const id = req.params.id
  const query= {_id: new ObjectId(id)}
  const result= await reviewCollection.deleteOne(query)
  res.send(result)
})
// offered property
app.post('/offeredProperty',verifyToken, async(req,res)=>{
  const item = req.body
  const result = await offerPropertyCollection.insertOne(item)
  res.send(result)
  })

  app.get('/offeredProperty/:userEmail',verifyToken,verifyAgent , async (req, res) => {
    const email= req.params.userEmail;
    // console.log(email)
    const query = { agentemail: (email) }
    const offeredProperty = await offerPropertyCollection.find(query).toArray();
    res.send(offeredProperty);
  })
  app.get('/offeredProperties/:userEmail',verifyToken , async (req, res) => {
    const email= req.params.userEmail;
    // console.log(email)
    const query = { buyeremail: (email) }
    const offeredProperty = await offerPropertyCollection.find(query).toArray();
    res.send(offeredProperty);
  })

  app.get('/offerproperybyid/:id', async(req,res)=>{
    const id = req.params.id
    const query= {_id: new ObjectId(id)}
    const result= await offerPropertyCollection.findOne(query)
    res.send(result)
  })

// offeredproperty accept
app.patch('/offeredProperty/accept/:id', verifyToken,verifyAgent, async(req,res)=>{
  const id = req.params.id
  const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      isAccepted:'true'
    }
  }
  const result =await offerPropertyCollection.updateOne(filter,updatedDoc)
  res.send(result)
})
// property reject
app.patch('/offeredProperty/reject/:id', verifyToken,verifyAgent, async(req,res)=>{
  const id = req.params.id
  const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      isAccepted:'reject'
    }
  }
  const result =await offerPropertyCollection.updateOne(filter,updatedDoc)
  res.send(result)
})

// advertise Post   
app.patch('/allproperty/advertise/:id', verifyToken,verifyAdmin, async(req,res)=>{
  const id = req.params.id
  const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      isAdvertise:'true'
    }
  }
  const result =await propertyCollection.updateOne(filter,updatedDoc)
  res.send(result)
})              

app.get('/allproperties',async(req,res)=>{
  const query = { isAdvertise:'true' };
  const result = await propertyCollection.find(query).toArray();
  res.send(result)
})



    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      // console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });

    app.get('/payments/:email', verifyToken, async (req, res) => {
      const query = { agentemail: req.params.email }
     
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

    
      console.log('payment info', payment);


  

      res.send({ paymentResult});
    })
    
    app.patch('/offeredProperty/bought/:id',async (req,res)=>{
      const id= req.params.id
      console.log('id',req.params)
      const filter ={ _id : new ObjectId(id)}
  const updatedDoc ={
    $set:{
      isAccepted:'bought'
    }
  }
      const result = await offerPropertyCollection.updateOne(filter,updatedDoc);
      res.send(result)
    })
     

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/',(req,res)=>{
    res.send('Assignment 12 is Running')
})
app.listen(port,()=>{
console.log(`Assignment 12 is Running on port${port}`)
})