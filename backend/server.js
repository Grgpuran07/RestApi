const app = require("./app")
const { connecDatabase } = require("./config/database")

connecDatabase();

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})