var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var path = require('path');
var _ = require('lodash');
var shell = require('shelljs');
var Promise = require('bluebird');//Promisify all mongo func
var mongoDb = require('mongodb');
Promise.promisifyAll(mongoDb);
var MongoClient = mongoDb.MongoClient;
var ObjectID = mongoDb.ObjectID;
//mongorestore -h ds061464.mongolab.com:61464 -d zyoldb2 -u zhouzoro -p mydb1acc C:\zhouy\_wrkin\mongoDB-11-24\test
//mongorestore -d test -u zhouzoro -p mydb1acc C:\zhouy\_wrkin\mongoDB-11-24\test
var dbport = process.env.MONGO_PORT || 65123
var url = process.env.MONGO_URl || 'mongodb://127.0.0.1:' + dbport + '/yss';
var coll_name = 'main'; //mongodb collection name

var formidable = require('formidable'); //formidable to handle form upload
var util = require('util');

var jade = require('jade');

var winston = require('winston'); //winston.js to log info and error
winston.add(winston.transports.File, {
    filename: path.join(__dirname, '/../public/logs.log'),
    handleExceptions: true,
    humanReadableUnhandledException: true
});
var logErr = function(err) {
    Promise.resolve(winston.error(err.toString())).catch(function(errs) {
        winston.error(err)
    });
};
var aboutHtml = path.join(__dirname, '/../views/contents/about.html');
var vacanciesHtml = path.join(__dirname, '/../views/contents/vacancies.html');

/**
 * middleware function to log info
 */

router.use(function(req, res, next) {
    console.log(req.cookies);
    console.log(req.cookies.editmode === 'right on');
    winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
    next();
});

function doADump() {
    shell.exec('mongodump --db yss --port 65123 --out /home/web/projects/running/yangs-seismic/yangs-seismic-master/mongodump-' + GetCurrentDatetime());
};

function importData(coll) {
    shell.exec('mongoimport --db yss --port 65123 --jsonArray --collection ' + coll + ' --file /home/web/projects/running/yangs-seismic/yangs-seismic-master/' + coll + '-0301.json');
}

function saveFile(req, res, ftype, fixedName) {
    var uDir = path.join(__dirname, '/../public/', ftype);
    var form = new formidable.IncomingForm({
        uploadDir: uDir
    });
    form.on('progress', function(bytesReceived, bytesExpected) {
        var pct = (100 * (bytesReceived / bytesExpected)).toString();
        if (pct.substr(pct.lastIndexOf('.') + 1, 2) == '00') {
            var progress = pct.substring(0, pct.lastIndexOf('.')) + "%";
            console.log(progress);
        }
    });
    form.on('file', function(name, file) {
        var tempPath = file.path;
        var fileName = Date.now() + file.name;
        console.log(fixedName)
        var filename = fixedName ? fixedName : fileName;
        var newPath = uDir + '/' + filename;
        fs.rename(tempPath, newPath);
        res.json({
            location: '/' + ftype + '/' + filename
        });
    });
    form.on('error', function(err) {
        console.log(err);
    });

    form.on('aborted', function() {
        console.log('ABORTED!');
    });
    form.parse(req);
}
router.post('/images', function(req, res, next) {
    saveFile(req, res, 'images');
});
router.post('/files', function(req, res, next) {
    saveFile(req, res, 'files');
});

router.post('/logo', function(req, res, next) {
    saveFile(req, res, 'images', 'logo.jpg');
});
MongoClient.connectAsync(url).then(function(db) {
        console.log('mongoDB connected!');
        var posts = db.collection(coll_name);
        var findPostsAsync = function(qFilter) {
            return new Promise(function(fulfill, reject) {
                if (qFilter.limit === 1) {
                    posts.findOneAsync(qFilter.selector).then(function(doc) {
                        fulfill(doc)
                    }).catch(function(err) {
                        reject(err)
                    });
                } else if (qFilter.limit > 1) {
                    posts.findAsync(qFilter.selector).then(function(cursor) {
                        return cursor.toArrayAsync()
                    }).then(function(docs) {
                        docs = _.slice(_.sortBy(docs, qFilter.sorter.iteratee, qFilter.sorter.order), qFilter.skip, qFilter.skip + qFilter.limit);
                        fulfill(docs);
                        //console.log(docs);
                    }).catch(function(err) {
                        reject(err)
                    });
                } else(reject({
                    message: 'int limit out of bound!'
                }))
            })
        }
        var findAllAsync = function(collname, sorter) {
            var tempcoll = db.collection(collname);
            return new Promise(function(fulfill, reject) {

                tempcoll.findAsync({}).then(function(cursor) {
                    if (collname == 'publication') {
                        var tempSorter = [
                            ['index', -1]
                        ];
                        tempSorter.push(sorter);
                        sorter = tempSorter;
                    }
                    return cursor.sort(sorter)
                }).then(function(cursor) {
                    return cursor.toArrayAsync()
                }).then(function(docs) {

                    docs = _.sortBy(docs, sorter.iteratee).reverse();
                    fulfill(docs);
                    //console.log(docs);
                }).catch(function(err) {
                    reject(err)
                });
            })
        }
        var defaultSorter = function() {
            return [
                'date', -1
            ]
        }
        var defaultFilter = function() {
            return {
                selector: {
                    type: 'news'
                },
                skip: 0,
                limit: 6,
                sorter: defaultSorter()
            }
        }

        function isEdit(req) {
            return req.cookies.editmode === 'right on' ? true : false
        }
        /* GET home page. */
        router.get('/', function(req, res, next) {
            fs.readFile(aboutHtml, 'utf8', (err, data) => {
                if (err) console.log(err);

                var allDataOp = [
                    findAllAsync('news', defaultSorter()),
                    findAllAsync('research', defaultSorter()),
                    findAllAsync('teaching', defaultSorter()),
                    findAllAsync('people', defaultSorter())
                ];
                Promise.all(allDataOp).then(function(val) {
                    console.log(val);
                    fs.writeJson('/home/web/projects/running/yangs-seismic/yangs-seismic-master/public/temp.json', val, (err, data) => {
                        if (err) logErr(err);
                    });
                    res.render('contents/index', {
                        news: val[0],
                        research: val[1],
                        teaching: val[2],
                        people: val[3],
                        about: data
                    });
                }).catch(function(err) {
                    res.send(err);
                    logErr(err);
                });
            })
        });

        function getDetailOf(req, res, type) {
            Promise.resolve(convertId(req.query._id))
                .then(function(id) {
                    var project = db.collection(type);
                    project.findOneAsync({ _id: id }).then(function(doc) {
                        var template = (type == 'publication') ? 'publication' : (type == 'people') ? 'onep' : 'article';
                        res.render('contents/' + template, {
                            doc: doc,
                            doctype: type,
                            editmode: isEdit(req)
                        });
                    })
                }).catch(function(err) {
                    res.send(err);
                    logErr(err);
                });
        }
        var needDataFromDB = ['research', 'publication', 'teaching', 'people', 'news'];
        _.forEach(needDataFromDB, function(val, index) {
            router.get('/' + val, function(req, res, next) {
                if (req.query && req.query._id) {
                    next();
                } else {
                    getPageOf(req, res, val);
                }
            });
            if (val == 'people') {
                router.get('/add_people', function(req, res, next) {
                    var uploadpJade = jade.compileFile(path.join(__dirname, '/../views/uploads/uploadp.jade'));
                    var html = uploadpJade();
                    res.send(html);
                });
            } else {
                router.get('/add_' + val, function(req, res, next) {
                    var uploadpJade = jade.compileFile(path.join(__dirname, '/../views/uploads/uploadproj.jade'));
                    var html = uploadpJade();
                    res.send(html);
                });
            }
            router.get('/' + val + '?', function(req, res) {
                getDetailOf(req, res, val);
            });
        });

        function getPageOf(req, res, type) {
            findAllAsync(type, defaultSorter()).then(
                function(docs) {
                    fs.writeJson(path.join(__dirname, '/../../temp.json'), docs, (err, data) => {
                        if (err) logErr(err);
                    });
                    var data = {};
                    data[type] = docs;
                    data.doctype = type;
                    data.editmode = isEdit(req);
                    res.render('contents/' + type, data);
                }).catch(function(err) {
                res.send(err);
                logErr(err);
            });
        }
        router.get('/vacancies', function(req, res) {
            fs.readFile(vacanciesHtml, 'utf8', (err, data) => {
                if (err) console.log(err);
                res.render('contents/vacancies', {
                    doc: data,
                    doctype: 'vacancies',
                    editmode: isEdit(req)
                });
            })
        })

        router.get('/about', function(req, res) {
            fs.readFile(aboutHtml, 'utf8', (err, data) => {
                if (err) console.log(err);
                res.render('contents/about', {
                    doc: data,
                    doctype: 'about',
                    editmode: isEdit(req)
                });
            })
        })

        router.get('/edit?', function(req, res, next) {
            console.log(req.query);
            var editmode;
            if (req.query.editor === 'zhang_fan' && req.query.key === 'yangs_seismic_lab_2016') {
                editmode = true;
            }

            var allDataOp = [
                findAllAsync('news', defaultSorter()),
                findAllAsync('event', defaultSorter()),
                findAllAsync('project', defaultSorter()),
                findAllAsync('people', defaultSorter()),
                findAllAsync('research', defaultSorter()),
            ];
            fs.readFile(aboutHtml, 'utf8', (err, data) => {
                if (err) console.log(err);

                Promise.all(allDataOp).then(function(val) {
                    res.render('contents/index', {
                        news: val[0],
                        event: val[1],
                        project: val[2],
                        people: val[3],
                        research: val[4],
                        about: data,
                        editmode: editmode
                    });
                }).catch(function(err) {
                    res.send(err);
                    logErr(err);
                });
            })
        });

        router.get('/details?', function(req, res) {
            Promise.resolve(convertId(req.query._id))
                .then(function(id) {
                    var deFilter = defaultFilter();
                    deFilter.selector = {
                        _id: id
                    };
                    deFilter.limit = 1;
                    return deFilter;
                })
                .then(function(qFilter) {
                    findPostsAsync(qFilter)
                        .then(function(doc) {
                            var html = detailsJade({
                                doc: doc
                            });
                            res.send(html);
                        })
                }).catch(function(err) {
                    res.send(err);
                    logErr(err);
                });
        });

        router.get('/people?', function(req, res) {
            Promise.resolve(convertId(req.query._id))
                .then(function(id) {
                    var people = db.collection('people');
                    people.findOneAsync({ _id: id }).then(function(doc) {
                        res.render('contents/onep', {
                            doc: doc,
                            doctype: 'people',
                            editmode: isEdit(req)
                        });
                    })
                }).catch(function(err) {
                    res.send(err);
                    logErr(err);
                });
        });

        router.get('/vitae', function(req, res) {
            var people = db.collection('people');
            people.findOneAsync({ name: 'Hong-feng YANG 楊宏峰' }).then(function(doc) {
                res.render('contents/onep', {
                    doc: doc,
                    doctype: 'vitae',
                    editmode: isEdit(req)
                });
            }).catch(function(err) {
                res.send(err);
                logErr(err);
            });
        });

        function findByIdAsync(coll, id) {
            var collection = db.collection(coll);
            return collection.findOneAsync({ _id: id })
        }
        /**
         * [simply get the data from mongodb and render the view of the about page]
         */

        router.post('/change/about', function(req, res) {
            fs.writeFile(aboutHtml, req.body.html, 'utf8', (err) => {
                if (err) throw err;
                res.send('It\'s saved!');
                console.log('It\'s saved!');
            });
        });

        router.post('/change/vacancies', function(req, res) {
            fs.writeFile(vacanciesHtml, req.body.html, 'utf8', (err) => {
                if (err) throw err;
                res.send('It\'s saved!');
                console.log('It\'s saved!');
            });
        });
        /**
         * [function to delete a certain record
         * And delete the directory consists the related files.]
         * @param  {[type]} req [contains parameters including username and record ID]
         * @param  {[type]} res [send back a json object with the delete result(true or false)]
         */
        router.post('/delete', function(req, res) {
            console.log(req.body);
            var tempcoll = db.collection(req.body.doctype);
            doADump();
            Promise.resolve(convertId(req.body._id))
                .then(function(id) {
                    tempcoll.deleteOneAsync({ //delete from mongodb
                        _id: id
                    }).then(function(result) {
                        winston.info('deleted:' + result);
                        res.json({
                            url: '/edit?editor=zhang_fan&key=yangs_seismic_lab_2016'
                        });
                    })
                }).catch(function(err) {
                    res.json({
                        result: false
                    });
                    logErr(err);
                })
        });

        /**
         * [simply get the staff data from mongodb and render the view of the staff page]
         */
        router.get('/staff', function(req, res) {
            var staff = db.collection('staff');
            staff.findAsync().then(function(cursor) {
                return cursor.toArrayAsync()
            }).then(function(docs) {
                docs = _.sortByOrder(docs, 'inst', 'desc');
                var html = staffJade({
                    data: docs
                });
                res.send(html);
            }).catch(function(err) {
                res.send(err);
                logErr(err);
            })
        });

        router.post('/authentication', function(req, res) {
            var users = db.collection('users');
            users.countAsync({
                username: req.body.username,
                password: req.body.password
            }).then(function(count) {
                res.json({
                    result: count == 1
                });
            }).catch(function(err) {
                res.send(err);
                logErr(err);
            })
        });

        router.post('/add_people', function(req, res) {
            uploadDoc(res, 'people', req.body);
        });

        router.post('/add_publication', function(req, res) {
            uploadDoc(res, 'publication', req.body);
        });
        router.post('/add_teaching', function(req, res) {
            uploadDoc(res, 'teaching', req.body);
        });
        router.post('/add_project', function(req, res) {
            uploadDoc(res, 'project', req.body);
        });
        router.post('/add_event', function(req, res) {
            uploadDoc(res, 'event', req.body);
        });
        router.post('/add_research', function(req, res) {
            uploadDoc(res, 'research', req.body);
        });
        router.post('/add_news', function(req, res) {
            uploadDoc(res, 'news', req.body);
        });

        function uploadDoc(res, doctype, doc) {
            doADump();
            console.log(doc);
            var tempColl = db.collection(doctype);
            if (doc.id) {
                var docId = convertId(doc.id);
                console.log(doc.id + '--------------updating--------------' + docId);
                console.log(doc);
                tempColl.updateOne({ _id: docId }, { $set: doc }, function(err, r) {
                    res.send({
                        url: '/' + doctype + '?_id=' + r.insertedId
                    });
                });
            } else {
                console.log('--------------adding--------------');
                tempColl.insertOne(doc, function(err, r) {
                    res.send({
                        url: '/' + doctype + '?_id=' + r.insertedId
                    });
                });
            }
        }
    })
    .catch(function(err) {
        logErr(err);
    });

function convertId(id) {
    try {
        return require('mongodb').ObjectID(id)
    } catch (err) {
        return require('mongodb').ObjectID(id.substr(1, 24))
    }
}

function GetCurrentDate() {
    var cdate = new Date();
    var month = cdate.getMonth() < 9 ? ('0' + (cdate.getMonth() + 1)) : (cdate.getMonth() + 1)
    var currentDate = cdate.getFullYear() + "-" +
        month + "-" +
        cdate.getDate();
    return currentDate;
}

function GetCurrentTime() {
    var cdate = new Date();
    var currentTime = cdate.toString().substr(16, 8);
    return currentTime;
}

function GetCurrentDatetime() {
    var currentDatetime = GetCurrentDate() + "_at_" + GetCurrentTime();
    return currentDatetime;
}

function DatetimeDash() {
    return GetCurrentDatetime().replace(/:/g, "-")
}

function DatetimeDashMin() {
    return DatetimeDash().substring(0, DatetimeDash().length - 3)
}
module.exports = router;
