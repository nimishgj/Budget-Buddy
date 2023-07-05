const express = require('express');
const cors=require('cors')
const {connectToDb,getDb}=require('./db')
const port =8000

const bcrypt=require('bcrypt')

const app=express()
app.use(express.json())
app.use(cors())




let db


connectToDb((err)=>{
  if(!err){
    app.listen(port,()=>{console.log("Booting up....\nBooted up and ready to recieve on port 8080")})
    db=getDb()
  }
})




//routes

app.get('/b',(req,res)=>{
  const ipAddress = req.connection.remoteAddress;
  console.log('IP address:', ipAddress,"has accessed db");

  let col=[]

  db.collection('colection')
  .find()
  .sort({age:1})
  .forEach(co=>col.push(co))
  .then(()=>{
    res.status(200)
    res.json(col)
  })
  .catch(()=>{
    res.status(500)
    res.json({message:"error"})
  })
})


// app.get('/trail', (req, res) => {
//   const vr={
//     "name":"Siddharth",
//     "age":19
//   }
//     res.statusCode=210
//     res.send(vr)
//   }
// )

// app.post('/code/:id',(req,res)=>{
//   if(req.params.id%2==0){
//     res.status(201)
//     console.log(JSON.stringify(req.body))
//     res.send({
//       "message":"yup a even number",
//       "statuscode":201,
      
//     })
//   }
// })

// app.post('/login',async(req,res)=>{
//   const password=req.body.password
//   const hashed = await bcrypt.hash(password,16)
//   console.log(hashed);

//   const password1=req.body.password
//   const hashed1 = await bcrypt.hash(password,10)
//   console.log(hashed);

//   console.log(password)

//   res.status(200).json({msg:"yup got it"})

//   const matched= await bcrypt.compare(password,hashed)
//   console.log(matched)

//   const matched1= await bcrypt.compare(password1,hashed1)
//   console.log(matched)
// })




//create a user ,create a transaction for the user with respective ID ,add an initial transaction

let id=0

app.post('/signup',async(req,res)=>{
  if(req.body.userName && req.body.password){
    const hashedPassword = await bcrypt.hash(req.body.password,10)
    const hashedUserName = await bcrypt.hash(req.body.userName,10)

    db.collection(`users`)
    .insertOne({"userName":hashedUserName,"password":hashedPassword,"id":id})
    .then(result=>{
      if(result.acknowledged===true){
        res.status(201).json({msg:"user created"})
      }
    })

    db.collection(`transaction_${id}`).insertOne({
      "amount":0,
      "type":"initial",
      "date":new Date()

    })

    id+=1

  } else {
    res.status(400).json({msg:"bad request"})
  }
})









//login authentication and send transactions of the user as json object

app.post('/login', async (req, res) => {
  if (req.body.userName && req.body.password) {
    const users = await db.collection('users').find().toArray();
    
    for (const user of users) {

      if (await bcrypt.compare(req.body.userName, user.userName) && await bcrypt.compare(req.body.password, user.password)) {
        db.collection(`transaction_${user.id}`).find()
        .forEach(transaction=>{
          console.log(transaction)
        })
      }
    }
    
    res.status(404).json({ msg: "user not found" });
  } else {
    res.status(400).json({ msg: "bad request" });
  }
});




//Insert a transaction for a user

app.post('/addtransaction', async (req, res) => {

  await db.collection(`transaction_${req.body.id}`).insertOne({
    amount: req.body.amount,
    type: req.body.type,
    date: req.body.date,
    isHidden: req.body.isHidden || false,
    categories: req.body.categories
  });

  const type = req.body.type.trim().toUpperCase();
  const amount = req.body.amount;

  await db.collection('users').updateOne(
    { id: req.body.id },
    {
      $inc: {
        totalAmount: (type === "DEBIT") ? -amount : (type === "CREDIT") ? amount : 0
      }
    }
  );

  res.sendStatus(200);
});



