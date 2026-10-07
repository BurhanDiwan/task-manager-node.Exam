require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Task = require('./models/Task');
const Category = require('./models/Category');
const { requireAuth, checkUser } = require('./middleware/auth');

const app = express();
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkUser);

app.get('/', (req, res) => res.redirect('/tasks'))

app.get('/register', (req, res) => {
    if (res.locals.user) return res.redirect('/tasks')
    res.render('register')
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();
        res.redirect('/login')
    } catch (err) {
        res.redirect('/register')
    }
});

app.get('/login', (req, res) => {
    if (res.locals.user) return res.redirect('/tasks');
    res.render('login')
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (user) {
            const auth = await bcrypt.compare(password, user.password);
            if (auth) {
                const token = jwt.sign({ 
                    id: user._id, 
                    role: user.role, 
                    username: user.username 
                }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
                res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
                res.redirect('/tasks')
            } else {
                res.redirect('/login')
            }
        } else {
            res.redirect('/login');
        }
    } catch (err) {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/login');
});

app.get('/tasks', requireAuth, async (req, res) => {
    try {
        let items;
        
        if (req.user.role === 'admin') {
            items = await Task.find().populate('user').populate('category');
        } else {
            items = await Task.find({ user: req.user.id }).populate('user').populate('category');
        }
        res.render('taskList', { tasks: items });
    } catch (err) {
        res.redirect('/');
    }
});

app.get('/tasks/all', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.redirect('/tasks');
        }
        const items = await Task.find().populate('user').populate('category');
        res.render('taskList', { tasks: items });
    } catch (err) {
        res.redirect('/');
    }
});

app.get('/task/new', requireAuth, async (req, res) => {
    try {
        const groups = await Category.find();
        res.render('taskForm', { task: null, categories: groups });
    } catch(err) {
        res.redirect('/tasks');
    }
});

app.post('/task/new', requireAuth, async (req, res) => {
    try {
        const { title, description, category } = req.body;
        const task = new Task({ title, description, category: category || null, user: req.user.id });
        await task.save();
        
        const user = await User.findById(req.user.id);
        user.tasks.push(task._id);
        await user.save();

        res.redirect('/tasks')
    } catch (err) {
        res.redirect('/task/new')
    }
});

app.get('/task/edit/:id', requireAuth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.redirect('/tasks');
        }
        const groups = await Category.find();
        res.render('taskForm', { task, categories: groups })
    } catch (err) {
        res.redirect('/tasks');
    }
});

app.post('/task/edit/:id', requireAuth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.redirect('/tasks')
        }
        task.title = req.body.title;
        task.description = req.body.description;
        task.category = req.body.category || null;
        await task.save();
        res.redirect('/tasks');
    } catch (err) {
        res.redirect('/tasks');
    }
});

app.get('/task/delete/:id', requireAuth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
        if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.redirect('/tasks');
        }
        await Task.findByIdAndDelete(req.params.id);
        res.redirect('/tasks');
    } catch (err) {
        res.redirect('/tasks');
    }
});

module.exports = app
