import connectDb from "./config/database.connection.js";
import app from "./app.js";
import dotenv from "dotenv"
dotenv.config();


connectDb()
   .then(()=>{
    app.listen(process.env.PORT || 5100 , ()=>{
        console.log(`Server is running on Port : ${process.env.PORT}`);
    })
   })
   .catch((err)=>{
      console.log(`MongoDb connection error : ${err}`);
   })