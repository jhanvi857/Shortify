import {Router} from "express";
const router = Router();
router.post("/shorter",(req,res)=> {
    res.send("Shorter URL endpoint");
});
export default router;