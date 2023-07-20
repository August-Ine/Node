const path = require('path');
const express = require('express');
const hbs = require('hbs');

//create app
const app = express();

//use hbs template engine
app.set('view engine', 'hbs');

//customize hbs views path
const viewsPath = path.join(__dirname, '../public/templates/views');
app.set('views', viewsPath);

//register hbs partials path
const partialsPath = path.join(__dirname, '../public/templates/partials');
hbs.registerPartials(partialsPath);

//serve up public dir
const publicPath = path.join(__dirname, '../public'); //abs path to public
app.use(express.static(publicPath));

//endpoints
app.get('', (req, res) => {
    res.render('index')
})

app.get('/about', (req, res) => {
    res.send('about is working');
})

//listen on port 3000
app.listen(3000, () => {
    console.log("app listening on port 3000")
})