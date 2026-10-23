import express from "express";
import { createDonationOrder, verifyDonation } from "../controllers/donationController.js";

const donationRouter = express.Router();

donationRouter.post("/create-order", createDonationOrder);
donationRouter.post("/verify", verifyDonation);

export default donationRouter;
