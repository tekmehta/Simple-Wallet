const express = require("express");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const cors = require("cors");

const app = express();
app.use(cors());

const port = process.env.port || 8082;

mongoose.connect("mongodb://127.0.0.1:27017/BankAccount").then(()=>console.log("connection successfull...")).catch((error)=>console.log("fail to connect",error));

const accountschema =new mongoose.Schema({
    AccountName : String,
    AccountNumber : Number,
    Amount : Number,
    Pin : Number,
    SessionToken : String
},{versionKey: false});

const AccountModel = mongoose.model("client", accountschema);

app.use(express.json());

const verifySessionToken = (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token not provided' });
    }
    try {
      const decoded = jwt.verify(token, 'getAccountNumber');
      req.userData = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired token' ,error});
    }
  };
app.post('/client', async(req,res)=>{
    try {
        const {AccountName, AccountNumber,Pin} = req.body;
        const clientdetail = new AccountModel({AccountName, AccountNumber,Amount:100, Pin,  SessionToken:null});
        // const newaccount = clientdetail.AccountNumber;
        const existaccount = await AccountModel.findOne({AccountNumber})
        console.log(existaccount);
        if(existaccount){
            return res.status(202).json("this account number is already register");
        }
        await clientdetail.save();
        res.status(200).json("Congratulations... Your Account Is Created");
    } catch (error) {
        res.status(200).json({error:error.message})
    }
})
app.put('/client/loginaccount',async(req,res)=>{
    try {
        const getAccountNumber = req.body.AccountNumber;
        const getaccountPin = req.body.Pin;
        const findAccount = await AccountModel.findOne({AccountNumber:getAccountNumber});
        if(!findAccount){
            return res.status(404).json("Account Number Does Not Exist");
        }
        if(getAccountNumber == findAccount.AccountNumber && getaccountPin == findAccount.Pin){
            const GenerateSessionToken = jwt.sign({getAccountNumber, getaccountPin}, 'getAccountNumber', {expiresIn: '30m'})
            findAccount.SessionToken = GenerateSessionToken;
            findAccount.save();
            return res.status(200).json({
                message: "login successfully",
                "your token":GenerateSessionToken
            });
        }
        res.status(400).json("Check Pin Or Account Number");
        } catch (error) {
        res.status(404).json(error);
    }
})
app.get("/client/getAccount/detail", verifySessionToken, async (req, res) => {
    try {
      const getAccountNumber = req.query.AccountNumber; // Use req.query instead of req.body
      const getaccountPin = req.query.Pin; // Use req.query instead of req.body
      if (req.userData.getAccountNumber !== getAccountNumber) {
        return res.status(401).json("Please log in with your account to perform this action");
      }
      const findAccount = await AccountModel.findOne({ AccountNumber: getAccountNumber });
      if (getAccountNumber == findAccount.AccountNumber && getaccountPin == findAccount.Pin) {
        return res.status(200).json({
          "Account Namee": findAccount.AccountName,
          "Account Number": findAccount.AccountNumber,
          "Amount": findAccount.Amount
        });
      }
      res.status(404).json('Check account number or pin');
    } catch (error) {
      res.status(404).json(error);
    }
  });
  
app.put("/client/deposit", async(req,res)=>{
    try {
        const getaccount = req.body.AccountNumber;
        const getAmount = req.body.Amount;
        if(getAmount<=1){
            return res.status(200).json("minimum amount is 1")
        }
        const findAccount = await AccountModel.findOne({AccountNumber:getaccount});
        if(!findAccount){
            return res.status(404).json("Account not found");
        }
        findAccount.Amount = findAccount.Amount+ getAmount;
        await findAccount.save();
        res.status(200).json("Amount Credit, Thank you");
    } catch (error) {
        res.status(404).json(error.message);
    }
})
app.put("/client/Transfer/amount", verifySessionToken, async(req,res)=>{
    try {
        const TransferFrom = req.body.From;
        console.log("account from enter"+TransferFrom);
        const TransferTo= req.body.To;
        console.log("account to enter "+TransferTo);
        const TransferAmount = req.body.Amount;
        console.log("amount enter"+TransferAmount);
        const TransferPin = req.body.Pin;
        console.log("pin enter"+TransferPin);
        const getTransferFromAccount = await AccountModel.findOne({AccountNumber:TransferFrom}); 
        const getTransferToAccount = await AccountModel.findOne({AccountNumber:TransferTo}); 
        console.log("pin from"+getTransferFromAccount.Pin);
        console.log("pint enter"+TransferPin)
        if(!getTransferFromAccount){
            return res.status(400).json("You Do Not Have An Account, Please Create An Account First");
        }
        if(!getTransferToAccount){
            return res.status(400).json("Your Friend Does Not Have An Account, Please Tell Him To Create An Account First");
        }
        if(TransferFrom===TransferTo){
            return res.status(401).json("You Can Not Transfer To Yourself");
        }
        if(TransferAmount<=1){
            return res.status(200).json("Minimum Amount is 1")
        }
        if(TransferPin == getTransferFromAccount.Pin){
            if(getTransferFromAccount){
                if(getTransferFromAccount.Amount >= TransferAmount){
                    getTransferFromAccount.Amount= getTransferFromAccount.Amount-TransferAmount;
                    await getTransferFromAccount.save();
                }else{
                    return res.status(201).json("YOu Dont Have Enough Money To Transfer");
                }
            }
            if(getTransferToAccount){
                getTransferToAccount.Amount = getTransferToAccount.Amount+TransferAmount;
                await getTransferToAccount.save();
            }
            res.status(200).json("Transfer Successfully");
        }
        else{
            res.status(404).json("Check Your Pin Correctly");
        }
    } catch (error) {
        res.status(404).json(error.message);
    }
})
app.put('/client/withdraw/Amount', verifySessionToken, async(req, res)=>{
    const getAccountNumber = req.body.AccountNumber;
    const getwithrewAmount = req.body.Amount;
    const TransferPin = req.body.Pin;
    if (req.userData.getAccountNumber !== getAccountNumber) {
        return res.status(401).json("Please Log In With Your Account To Perform This Action ");
    }
    const findAccount = await AccountModel.findOne({AccountNumber:getAccountNumber});
    if(!findAccount){
        return res.status(404).json("Account Not Found");
    }
    if(TransferPin == findAccount.Pin){
        if(findAccount.Amount>getwithrewAmount){
            findAccount.Amount=findAccount.Amount-getwithrewAmount;
            await findAccount.save();
        }
        else{
            return res.status(200).json("You Do Not Have Enough Money To Withdrawal ");
        }
    }else{
        return res.status(404).json("Check PYur Pin Correctly");
    }
    res.status(200).json("Withdraw Your Amount! New Balance Is" + findAccount.Amount);
})
app.listen(port,()=>{
    console.log("Server is running at port " + port);
});