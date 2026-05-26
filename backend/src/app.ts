import express from 'express';
import cors from 'cors';
import urlRouter from './routes/URLRouter';
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api",urlRouter);
app.get("/",(req,res)=> {
    res.send("Hello world!");
});
app.get("/health",(req,res)=> {
    return res.status(200).json({message: "Server is healthy"});
});

app.listen(3000,()=> {
    console.log("Server is running on port 3000");
});