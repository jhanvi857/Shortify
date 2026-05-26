import {Request, Response } from "express";
export const shortenURL = async (req: Request, res: Response) => {
    const { originalURL } = req.body;
    if(!originalURL) {
        return res.status(400).json({message: "Original URL is required"});
    }
    return res.json({message: "URL shortened successfully", originalURL});
};