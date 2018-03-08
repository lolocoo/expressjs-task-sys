
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    secret: 'ep_task_system'
}));
app.use(routes.auth_user);
// app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes.getAllUsers);
app.use(routes.getAllPM);
// development only
if ('development' === app.get('env')) {
    app.configure('development', function(){
        app.use(express.errorHandler());
        // app.locals.pretty = true;
    });
}

// get method
app.get('/', routes.signinRequired, routes.index);
app.get('/index', routes.signinRequired, routes.index);
app.get('/index/:state', routes.signinRequired, routes.index);

app.get('/my', routes.signinRequired, routes.myTask);
app.get('/my/:state', routes.signinRequired, routes.myTask);

app.get('/performance', routes.signinRequired, routes.performTask);
app.get('/performance/:id', routes.signinRequired, routes.performTask);

app.get('/task/create', routes.createTask);
app.post('/task/create', routes.createTaskAction);
app.get('/task/:id', routes.signinRequired, routes.taskDetail);

app.get('/user', routes.signinRequired, routes.user);
app.get('/user/new', routes.signinRequired, routes.userNew);
app.post('/user/new', routes.signinRequired, routes.userNewAction);

app.get('/project/create', routes.signinRequired, routes.createProject);
app.post('/project/create', routes.signinRequired, routes.createProjectAction);

app.get('/project/:id', routes.signinRequired, routes.projectDetail);
app.post('/project/:id', routes.projectDetailAction);
app.get('/get_newPorjects', routes.signinRequired, routes.newProjects);

app.get('/login', routes.login);
app.post('/login', routes.loginAction);
app.get('/logout', routes.logout);
app.get('/change_password', routes.signinRequired, routes.changePassword);
app.post('/change_password', routes.signinRequired, routes.changePasswordAction);

app.get('/schedule', routes.signinRequired, routes.schedule);
app.get('/schedule/:id', routes.signinRequired, routes.scheduleId);
app.get('/schedule_list', routes.signinRequired, routes.scheduleList);
app.post('/sendScheduleMail', routes.sendScheduleMail);

// post method
app.post('/addremark', routes.addRemark);
app.post('/assess_project_time', routes.setAssessTime);
app.post('/set_task', routes.set_task);
app.post('/set_task_review', routes.set_taskReview);
app.post('/set_taskStatus', routes.set_taskStatus);
app.post('/get_task_list', routes.get_TaskList);
app.post('/get_index_task_list', routes.get_indexTaskList);
app.post('/get_index_task_list_of_user', routes.get_indexTaskListOfUser);
app.post('/update_task', routes.adjust_workPeriod);
app.post('/send_mail', routes.send_mail);
app.post('/comments', routes.comments);
app.post('/post_schedule_task', routes.postScheduleTask);

app.use(function(req, res, next){
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', {
            title : 'You are get lost!'
        });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
