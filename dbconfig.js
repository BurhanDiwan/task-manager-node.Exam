const mongoose = require('mongoose')
const Category = require('./models/Category')

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Category.countDocuments()
        if (count === 0) {
            await Category.insertMany([{ name: 'Work' }, { name: 'Personal' }])
        }
    } catch (err) {
        process.exit(1);
    }
};

module.exports = connectDB