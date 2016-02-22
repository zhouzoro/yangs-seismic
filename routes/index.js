var express = require('express');
var router = express.Router();
var fs = require('fs-extra')
    /* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/person', function(req, res, next) {

    fs.readFile(__dirname + '/../public/files/person/rh.json', 'utf8', (err, data) => {
        console.log(__dirname);
        var person = JSON.parse(data);
        res.render('person', { person: person });
    })
});

module.exports = router;
