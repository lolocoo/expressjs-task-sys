var moment     = require('moment'),
    _          = require('underscore'),
    check      = require('validator').check,
    sanitize   = require('validator').sanitize,
    crypto     = require('crypto'),
    async      = require('async'),
    nodemailer = require("nodemailer");

var mysql      = require('mysql'),
    connection = mysql.createConnection({
        host : 'localhost',
        user : 'username',
        password : 'password',
        database : 'task'
    });

connection.connect();

var transport = nodemailer.createTransport("SMTP", {
    host: 'xxx@domain.com',
    port: 25,
    auth: {
      user: 'xxx@domain.com',
      pass: 'qwe123!'
    }
});

var mail_from = 'xxx@domain.com';
var base_url = 'url';
var config = {
    debug: false
};

var sendMail = function (data) {
    if (config.debug) {
        console.log('******************** 在测试环境下，不会真的发送邮件*******************');
        for (var k in data) {
            console.log('%s: %s', k, data[k]);
        }
        return;
    }
    transport.sendMail(data, function (err) {
        if (err) {
            // 写为日志
            console.log(err);
        }
    });
};

var userPostions = {
    '1': 'UD',
    '2': 'UI',
    '3': 'FE'
};

exports.index = function(req, res) {
    var p = Math.max((req.query.p || 1), 1);
    var state = 1;
    if(req.params.state==='done'){
        state = 4;
    }
    async.series({
        progressTask: function(callback){
            if(req.params.state !== 'stop') {
                getTasks(state, 9, p*9-9, function(err, tasks, fields) {
                    callback(null, tasks);
                });
            } else {
                connection.query('select * from ued_task where isQ=0 and (taskState=2 or taskState=3) order by taskState desc limit 8 offset ?', [p*8-8], function(err, rows){
                    callback(null, rows);
                });
            }
        },
        allPM: function(callback) {
            getAllPM(function(err, rows){
                callback(null, rows);
            });
        },
        taskCount: function(callback) {
            if(req.params.state !== 'stop') {
                connection.query('select count(*) as count from ued_task where isQ=0 and taskState = ?', [state], function(err, rows){
                    callback(null, rows[0]);
                });
            } else {
                connection.query('select count(*) as count from ued_task where isQ=0 and taskState=2 or taskState = 3', [state], function(err, rows){
                    callback(null, rows[0]);
                });
            }
        },
        newCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=0 and taskState=-1', function(err, rows){
                callback(null, rows[0]);
            });
        },
        processCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=0 and taskState=1', function(err, rows){
                callback(null, rows[0]);
            });
        },
        pauseCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=0 and (taskState=2 or taskState=3)', function(err, rows){
                callback(null, rows[0]);
            });
        },
        accomplishCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=0 and taskState=4', function(err, rows){
                callback(null, rows[0]);
            });
        }
    },
    function(err, results){
        res.render('home', { 
            title: '部门任务',
            user: req.session.user,
            allPM: results.allPM,
            progressTask: results.progressTask,
            completeTask: results.completeTask,
            newCount: results.newCount,
            processCount: results.processCount,
            accomplishCount: results.accomplishCount,
            calc_workday: calc_workday,
            selected: req.params.name,
            taskCount: Math.ceil(results.taskCount.count/9),
            pauseCount: results.pauseCount.count,
            flag : 'index',
            p : p,
            _ : _,
            moment: moment
        });
    });
};

exports.myTask = function(req, res) {
    var p = Math.max((req.query.p || 1), 1);
    var userId = parseInt(res.locals.current_user.userId, 10);
    var position = userPostions[res.locals.current_user.position]
    var state = 1;
    if(req.params.state==='done'){
        state = 4;
    }
    async.series({
        progressTask: function(callback){
            if(req.params.state !== 'stop') {
                // connection.query('select * from ued_task where ?? like "?%" and (taskState=0 or taskState = ?) order by taskState asc, isQ asc,  departStartDate desc limit ? offset ?', [position, userId, state, 8, p*10-10], function(err, rows){
                connection.query('select * from ued_task where ?? REGEXP "?" and (taskState=0 or taskState = ?) order by taskState asc, isQ asc,  departStartDate desc limit ? offset ?', [position, userId, state, 8, p*10-10], function(err, rows){
                    callback(null, rows);
                });
            } else {
                // connection.query('select * from ued_task where ?? like "?%" and (taskState=2 or taskState=3) order by taskState asc, isQ asc,  departStartDate desc limit ? offset ?', [position, userId, 8, p*10-10], function(err, rows){
                connection.query('select * from ued_task where ?? REGEXP "?" and (taskState=2 or taskState=3) order by taskState asc, isQ asc,  departStartDate desc limit ? offset ?', [position, userId, 8, p*10-10], function(err, rows){
                    callback(null, rows);
                });
            }
        },
        allPM: function(callback) {
            getAllPM(function(err, rows){
                callback(null, rows);
            });
        },
        taskCount: function(callback) {
            if(req.params.state !== 'stop') {
                connection.query('select count(*) as count from ued_task where ?? like "?%"', [position, userId], function(err, rows){
                    callback(null, rows[0]);
                });
            } else {
                connection.query('select count(*) as count from ued_task where ?? like "?%" and (taskState=2 or taskState=3)', [position, userId], function(err, rows){
                    callback(null, rows[0]);
                });
            }
        },
        processCount: function(callback) {
            connection.query('select count(*) as count from ued_task where taskState=1 and ?? like "?%"', [position, userId], function(err, rows){
                callback(null, rows[0]);
            });
        },
        pauseCount: function(callback) {
            connection.query('select count(*) as count from ued_task where (taskState=2 or taskState=3) and ?? like "?%"', [position, userId], function(err, rows){
                callback(null, rows[0]);
            });
        },
        accomplishCount: function(callback) {
            connection.query('select count(*) as count from ued_task where taskState=4 and ?? like "?%"', [position, userId], function(err, rows){
                callback(null, rows[0]);
            });
        }
    },
    function(err, results){
        res.render('home', { 
            title: '任务管理系统',
            user: req.session.user,
            allPM: results.allPM,
            progressTask: results.progressTask,
            newCount: results.newCount,
            processCount: results.processCount,
            accomplishCount: results.accomplishCount,
            calc_workday: calc_workday,
            selected: req.params.id,
            taskCount: Math.floor(results.taskCount.count/8),
            pauseCount: results.pauseCount.count,
            flag :'my',
            p : p,
            _ : _,
            moment: moment
        });
    });
};

exports.performTask = function(req, res) {
    var p = Math.max((req.query.p || 1), 1);
    var state = 1;
    if(req.params.state==='done'){
        state = 4;
    }

    async.series({
        progressTask: function(callback){
            if(req.params.state !== 'stop') {
                connection.query('select * from ued_task where isQ=1 and (taskState=0 or taskState=?) order by taskState asc limit ? offset ?', [state, 8, p*10-10], function(err, rows){
                    callback(null, rows);
                });
            } else {
                connection.query('select * from ued_task where isQ=1 and (taskState=2 or taskState=3) order by taskState asc,  departStartDate desc limit ? offset ?', [8, p*10-10], function(err, rows){
                    callback(null, rows);
                });
            }
        },
        allPM: function(callback) {
            getAllPM(function(err, rows){
                callback(null, rows);
            });
        },
        taskCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=1 and taskState != 0', function(err, rows){
                callback(null, rows[0]);
            });
        },
        newCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=-1 and taskState=0', function(err, rows){
                callback(null, rows[0]);
            });
        },
        processCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=1 and taskState=1', function(err, rows){
                callback(null, rows[0]);
            });
        },
        pauseCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=1 and (taskState=2 or taskState=3)', function(err, rows){
                callback(null, rows[0]);
            });
        },
        accomplishCount: function(callback) {
            connection.query('select count(*) as count from ued_task where isQ=1 and taskState=4', function(err, rows){
                callback(null, rows[0]);
            });
        }
    },
    function(err, results){
        res.render('home', { 
            title: '绩效任务',
            user: req.session.user,
            allPM: results.allPM,
            progressTask: results.progressTask,
            newCount: results.newCount,
            processCount: results.processCount,
            accomplishCount: results.accomplishCount,
            pauseCount: results.pauseCount.count,
            calc_workday: calc_workday,
            selected: req.params.name,
            taskCount: Math.floor(results.taskCount.count/8),
            flag: 'performance',
            _ : _,
            p : p,
            moment: moment
        });
    });
};

exports.taskDetail = function(req, res, next) {
    var user = req.session.user,
        id = req.params.id,
        path = req.path.split('/')[1],
        comment_page = Math.abs(parseInt(req.query.p, 10)) === 0 ? 1 : Math.abs(parseInt(req.query.p, 10)) || 1,
        userId   = false;

    if (user) {
        var isQ  = 0 ,
        offsets  = 0 ,
        position = userPostions[user.position],
        userId   = user.userId ;
    }
    async.series({
        taskList: function(callback){
            if(user){
                getTaskList(0, 0, 0, function(err, rows){
                    callback(null, rows);
                });
            }else{
                getTasksByState(0, function(err, rows){
                    callback(null, rows);
                });
            }
        },
        endTaskList: function(callback){
            getTaskList(1, 0, 0, function(err, rows){
                callback(null, rows);
            });
        },
        task: function(callback){
            getTaskById(id, function(err, rows) {
                console.log(err);
                if (err) {
                    return next(err);                    
                }
                var task = rows[0];
                getRemarksByTaskId(task['taskId'], function(err, rows){
                    if(err){
                        return next(err);
                    }
                    err === null ? task.remarks = rows : task.remarks = [];
                    callback(null, task);
                });
            });
        },
        comments: function(callback) {
            connection.query('select * from ued_review where taskId= ? order by time', [id, Math.abs(comment_page-1)*5],  function(err, rows){
                callback(null, rows);
            });
        }
    },
    function(err, results){
        res.render('task_detail', {
            title: '任务详细',
            user: req.session.user,
            taskList: results.taskList,
            endTask: results.endTaskList,
            task: results.task,
            comments: results.comments,
            page_num: results.page_num,
            current_page: comment_page,
            path: path,
            calc_workday: calc_workday,
            getPauseDays: getPauseDays,
            getDurationDays: getDurationDays,
            back_url: req.headers.referer,
            _ : _,
            moment: moment
        });
    });
};

exports.createProject = function(req, res) {
    var person = {};
    getAllPM(function(err, pm) {
        person.pm = pm;
        getUserList(function(err, ued){
            person.ued = ued;
            res.render('create_project', {
                title: '发布新项目',
                user: req.session.user,
                person: person
            });
        });
    });
};

exports.createProjectAction = function(req, res) {
    var project = req.body;
    var post    = {
        'taskName'         : project.taskName,
        'taskState'        : -1,
        'mainPM'           : _.isArray(project.mainPM) ? project.mainPM.join(',') : project.mainPM,
        'projStartDate'    : project.projectStartDate,
        'projEndDate'      : project.projectEndDate,
        'projUEDStartDate' : project.projectUEDStartDate,
        'projUEDEndDate'   : project.projectUEDEndDate,
        'taskIntro'        : project.taskIntro,
    };

    putTask(post, function(err, result) {
        console.log(err);
        var content = "";
        var to_mail = ['hexl@bitauto.com'];
        var cc_mail = [];
        var main_pm = _.isArray(project.mainPM) && project.mainPM != null ? project.mainPM :  project.mainPM.split(',');

        content += '<p style="margin-bottom:10px;">项目名称：' + project.taskName + '</p>';
        content += '<p style="margin-bottom:10px;">项目描述：' + project.taskIntro + '</p>';
        
        if (main_pm) {
            cc_mail = _.union(getPMMailAddrsByNames(project.mainPM, res.locals.allPM), cc_mail);
            content += '<p style="margin-bottom:10px;">产品经理：' + main_pm.join(' ') + '</p>';
        }
        
        content += '<p style="margin-bottom:10px;">参考资料：<a href=' + project.ReferenceUrl + ">" + project.ReferenceUrl + '</a></p>';
        content += '<p style="margin-bottom:10px;">项目整体时间：' + project.projectStartDate + ' / ' + project.projectEndDate + '</p>';
        content += '<p style="margin-bottom:10px;">UED总时间：' + project.projectUEDStartDate + ' / ' + project.projectUEDEndDate + '</p>'; 
        content += '<p>请UED总监<a href='+ base_url +'"/project/'+ result.insertId +'">分配工作</a></p>';

        var mailOptions = {
            from: mail_from,
            to: to_mail.join(','),
            cc: cc_mail,
            subject: project.taskName+ "-任务通知",
            html: mail_template({
                title: project.taskName, 
                content: content
            })
        };
        sendMail(mailOptions);
        res.redirect('/project/create');
    });

};

exports.projectDetail = function(req, res) {
    var id = req.params.id;
    async.series({
        task : function(callback) {
             getTaskById (id, function(err, rows){
                callback(null, rows[0]);
             });
        }
    },
    function(err, results) {
        res.render('confirm_project', {
            title : '确认项目',
            task: results.task,
            moment: moment
        });
    });   
};

exports.projectDetailAction = function(req, res) {
    var id   = parseInt(req.params.id, 10);
    var task = req.body;
    var post = {
        'taskState'       : 1,
        'departStartDate' : task.departStartDate,
        'departEndDate'   : task.departEndDate
    };

    var current = moment().format('YYYY-MM-DD');

    if (typeof(task.taskUD) != 'undefined') {
        post.UDStartDate = current;
        post.UDtaskStatus = 1;
    }else if (typeof(task.taskUI) != 'undefined') {
        post.UIStartDate = current;
        post.UItaskStatus = 1;
    }else if (typeof(task.taskFE) != 'undefined') {
        post.FEStartDate = current;
        post.FEtaskStatus = 1;
    }
    
    post['UD'] = _.isArray(task.taskUD) ? task.taskUD.join(',') : (typeof(task.taskUD) === 'undefined' ? '' : task.taskUD);
    post['UI'] = _.isArray(task.taskUI) ? task.taskUI.join(',') : (typeof(task.taskUI) === 'undefined' ? '' : task.taskUI);
    post['FE'] = _.isArray(task.taskFE) ? task.taskFE.join(',') : (typeof(task.taskFE) === 'undefined' ? '' : task.taskFE);

    var mark = {
        taskId: id, 
        content: task.remark,
        markDate: moment().format('YYYY-MM-DD'),
        action: 'bz',
        userId: parseInt(res.locals.current_user.userId, 10),
        position: parseInt(res.locals.current_user.position, 10)
    };

    var to_mail = [];
    var cc_mail = ['hexl@bitauto.com'];
    async.series({
        task : function(callback) {
            updateTaskById(id, post, function(err, rows){
                callback(null, rows);
            });
        },
        taskDetail: function(callback) {
            getTaskById (id, function(err, rows){
                callback(null, rows[0]);
            });
        },
        addRemark : function(callback) {
            putRemark(mark, function(err, rows){
                callback(null, rows);
            });
        } ,
        mail : function(callback) {
            var content = "";
            var getNameAndPushMail = function(names, toMail) {
                var arr = [];
                _.each(names, function(user){
                    _.each(res.locals.allUsers, function(item){
                        if(item.userId == user){
                            arr.push(item.name)
                            toMail.push(item.userName+'@bitauto.com');
                        }
                    });
                });
                return arr;
            };
            if (post['UD']) {
                var UDUser = post['UD'].split(',');
                var UDNames = getNameAndPushMail(UDUser, to_mail);
                content += '<p style="margin-bottom:10px;">交互设计师2222：' + UDNames.join(',') + '</p>';
            }
            if (post['UI']) {
                var UIUser = post['UI'].split(',');
                var UINames = getNameAndPushMail(UIUser, to_mail);
                content += '<p style="margin-bottom:10px;">视觉设计师：' + UINames.join(',') + '</p>';
            }
            if (post['FE']) {
                var FEUser = post['FE'].split(',');
                var FENames = getNameAndPushMail(FEUser, to_mail);
                content += '<p style="margin-bottom:10px;">前端工程师：' + FENames.join(',') + '</p>';
            }
            callback(null, content);
        }
    },
    function(err, results) {
        var projectTask = results.taskDetail;
        var content = "";
        
        var main_pm = projectTask.mainPM.split(',');

        content += '<p style="margin-bottom:10px;">项目名称：' + projectTask.taskName + '</p>';
        content += '<p style="margin-bottom:10px;">项目描述：' + projectTask.taskIntro + '</p>';
        
        if (main_pm) {
            cc_mail = _.union(getPMMailAddrsByNames(projectTask.mainPM, res.locals.allPM), cc_mail);
            content += '<p style="margin-bottom:10px;">产品经理：' + projectTask.mainPM.split(',') + '</p>';
        }
        
        content += '<p style="margin-bottom:10px;">参考资料：<a href=' + projectTask.ReferenceUrl + ">" + projectTask.ReferenceUrl + '</a></p>';
        content += '<p style="margin-bottom:10px;">UED预估时间：' + task.departStartDate + '-' + task.departEndDate + '</p>';
        
        content += results.mail;

        content += '<p>请相关人员分别<a href="/task/'+ id +'">评估工作时长</a></p>';
        var mailOptions = {
            from: mail_from,
            to: to_mail.join(','),
            cc: cc_mail.join(','),
            subject: projectTask.taskName+ "-任务通知",
            html: mail_template({
                title: projectTask.taskName, 
                content: content
            })
        };
        sendMail(mailOptions);
        res.redirect('/task/'+id);
    });
};

exports.newProjects = function(req, res) {
    getNewProjectList(function(err, rows){
        res.jsonp(rows);
    });
};

exports.login = function(req, res){
    res.render('login');
};

exports.loginAction = function(req, res, next){
    var loginname = sanitize(req.body.userName).trim().toLowerCase(),
        pass      = sanitize(req.body.password).trim();

    if(!loginname || !pass) {
        return res.render('login', { error: '用户名或密码不能为空' });
    }

    getUserByName(loginname, function(err, user){
        if (err) {
            return next(err);
        }
        
        var user = user[0];
        pass = md5(pass);

        if(!user || (pass !== user.password)) {
            return res.render('login', { error: '用户名或密码不正确' });
        }
        
        gen_session(user, res);
        res.locals.current_user = req.session.user;
        
        if(user.position == 0){
            res.redirect('/');
        }else{
            res.redirect('/my');
        }
        
    });
};

exports.logout = function(req, res){
    req.session.destroy();
    res.clearCookie('uedTask', { path: '/' });
    res.redirect('/');
};

exports.changePassword = function(req, res) {
    res.render('change_pw', {
        title: '修改密码'
    });
};

exports.changePasswordAction = function(req, res) {
    var pw         = req.body;
    var origin_pw  = req.body.origin_pw;
    var new_pw     = req.body.new_pw;
    var comfirm_pw = req.body.confirm_pw;
    var user_id = res.locals.current_user.userId;

    if (md5(sanitize(origin_pw).trim()) == res.locals.current_user.password &&
        sanitize(new_pw).trim() == sanitize(comfirm_pw).trim()
       ) {
        connection.query('update ued_user set password = ? where userId = ?', [md5(new_pw), user_id], function(err, rows){
            console.log(err);
            req.session.destroy();
            res.clearCookie('uedTask', { path: '/' });
            res.redirect('/login');
        });
    } else {
        return res.render('change_pw', { title: '修改密码', error: '密码不正确'});
    } 
};

exports.getAllUsers = function(req, res, next){
    getAllUsers(function(err, rows){
        res.locals.allUsers = rows;
        next();
    });
};

exports.getAllPM = function(req, res, next){
    getAllPM(function(err, rows){
        res.locals.allPM = rows;
        next();
    });
};

exports.createTask = function(req, res) {
    if(res.locals.current_user && res.locals.current_user.position === 0){
        var person = {}; 
        getAllPM(function(err, pm) {
            person.pm = pm;
            getUserList(function(err, ued){
                person.ued = ued;
                res.render('create_task', {
                    title: '添加任务',
                    user: req.session.user,
                    person: person
                });
            });
        });
    } else {
        res.redirect('/');
    }
};

exports.createTaskAction = function(req, res) {
    var task = req.body;  
    var post = {
        'taskName'        : task.taskName,
        'mainPM'          : _.isArray(task.mainPM) ? task.mainPM.join(',') : task.mainPM,
        'taskState'       : 0,
        'isQ'             : task.taskType,
        'departStartDate' : task.departStartDate,
        'departEndDate'   : task.departEndDate,
        'UD'              : _.isArray(task.UD) ? task.UD.join(',') : task.UD,
        'UI'              : _.isArray(task.UI) ? task.UI.join(',') : task.UI,
        'FE'              : _.isArray(task.FE) ? task.FE.join(',') : task.FE,
        'taskIntro'       : task.taskIntro
    };
    // if (task.UD) {
    //     post['UDStartDate'] = task.departStartDate;
    //     post['UDtaskStatus'] = 1;
    // } else if (task.UI) {
    //     post['UIStartDate'] = task.departStartDate;
    //     post['UItaskStatus'] = 1;
    // } else if (task.FE) {
    //     post['FEStartDate'] = task.departStartDate;
    //     post['FEtaskStatus'] = 1;
    // }

    putTask(post, function(err, result) {
        // var content = "";
        // var cc_mail = ['hexl@bitauto.com'];
        // var to_mail = getUserMailAddrs(_.compact([post.UD, post.UI, post.FE]), res.locals.allUsers);
        // var getNameAndPushMail = function(names, toMail) {
        //     var arr = [];
        //     _.each(names, function(user){
        //         _.each(res.locals.allUsers, function(item){
        //             if(item.userId == user){
        //                 arr.push(item.name)
        //                 toMail.push(item.userName+'@bitauto.com');
        //             }
        //         });
        //     });
        //     return arr;
        // };

        // content += '<p style="margin-bottom:10px;">项目名称：' + task.taskName + '</p>';
        // content += '<p style="margin-bottom:10px;">项目描述：' + task.taskIntro + '</p>';
        
        // if (task.mainPM) {
        //     // cc_mail = _.union(getPMMailAddrsByNames(task.mainPM, res.locals.allPM), cc_mail);
        //     content += '<p style="margin-bottom:10px;">产品经理：' + task.mainPM + '</p>';
        // }
        
        // content += '<p style="margin-bottom:10px;">参考资料：<a href=' + task.ReferenceUrl + ">" + task.ReferenceUrl + '</a></p>';
        // content += '<p style="margin-bottom:10px;">UED预估时间：' + moment(task.departStartDate).format('YYYY.MM.DD') + '-' + moment(task.departEndDate).format('YYYY.MM.DD') + '</p>';
        
        // if (typeof(task.UD) != 'undefined') {
        //     var UDUser =  _.isArray(task.UD) ? task.UD : task.UD.split(',');
        //     var UDNames = getNameAndPushMail(UDUser, to_mail);
        //     content += '<p style="margin-bottom:10px;">交互设计师：' + UDNames.join(',') + '</p>';
        // }

        // if (typeof(task.UI) != 'undefined') {
        //     var UIUser = _.isArray(task.UI) ? task.UI : task.UI.split(',');
        //     var UINames = getNameAndPushMail(UIUser, to_mail);
        //     content += '<p style="margin-bottom:10px;">交互设计师：' + UINames.join(',') + '</p>';
        // }

        // if (typeof(task.FE) != 'undefined') {
        //     var FEUser = _.isArray(task.FE) ? task.FE : task.FE.split(',');
        //     var FENames = getNameAndPushMail(FEUser, to_mail);
        //     content += '<p style="margin-bottom:10px;">前端工程师：' + FENames.join(',') + '</p>';
        // }

        // content += '<p>请相关人员分别<a href="'+base_url+'/task/'+ result.insertId +'">评估工作时长</a></p>';

        // var mailOptions = {
        //     from: mail_from,
        //     to: to_mail.join(','),
        //     cc: cc_mail.join(','),
        //     subject: task.taskName+ "-任务通知",
        //     html: mail_template({
        //         title: task.taskName, 
        //         content: content
        //     })
        // };
        // sendMail(mailOptions);
        res.redirect('/task/'+result.insertId);
    });
};

exports.schedule = function(req, res){
    async.series({
        sendSheetUserId: function(callback){
            connection.query("select distinct userid from ued_worksheet where senddate between subdate(curdate(), date_format(curdate(), '%w')+2) and subdate(curdate(), date_format(curdate(), '%w')-4)", function(err, rows){
                callback(null, rows);
            });
        }
    }, 
    function(err, results){
        res.render('schedule', {
            'title': '工作周报',
            'flag': 'schedule',
            'sendSheetUserId': results.sendSheetUserId,
            '_': _
        });  
    });
};

exports.scheduleId = function(req, res){
    var userId = parseInt(req.params.id, 10);
    async.series({
        user: function(callback){
            connection.query("select * from ued_user where userId=?", [userId], function(err, rows){
                callback(null, rows);
            });
        },
        userSheet: function(callback){
            connection.query("select * from ued_worksheet where userId=?", [userId], function(err, rows){
                callback(null, rows);
            });
        }
    }, 
    function(err, results){
        res.render('user_schedule', {
            'title': '工作周报',
            'flag': 'schedule',
            'user': results.user[0],
            'userSheet': results.userSheet,
            moment: moment,
            '_': _
        });  
    });
};

exports.scheduleList = function(req, res){
    var userId = parseInt(res.locals.current_user.userId, 10);
    var position = userPostions[res.locals.current_user.position];
    var state = 1;
    connection.query('select * from ued_worksheet where userId=? order by sendDate desc', [userId], function(err, rows){
        res.render('schedule_list', {
            'title': '工作周报历史',
            'flag': 'schedule',
            'sheets': rows,
            moment: moment
        });  
    });
};

exports.postScheduleTask = function(req, res){
    var userId = parseInt(res.locals.current_user.userId, 10);
    var position = userPostions[res.locals.current_user.position];
    var state = 1;

    var getUserNames = function(item, results){
        var names = [];
        var userArr = _.compact(_.map([item['UD'], item['UI'], item['FE']], function(item){
            if (!!item) {
                return item.split(',');
            }
        }));
        _.each(userArr, function(id, k){
            _.each(results.users, function(user){
                if(user.userId == id){
                    names.push(user.name);
                }
            });
        });

        if(item.mainPM) {
            names.push(item.mainPM);
        }

        return names.join(',');
    };

    var getSchedulePercent = function(item) {
        var isComplete = !(item.realEndDate === '0000-00-00');
        var departStartDate = moment(item.departStartDate);
        var departEndDate = moment(item.departEndDate);
        var realEndDate = !isComplete ? moment() : moment(item.realEndDate);
        var allDays = departEndDate.diff(departStartDate, 'days');
        var pastDays = realEndDate.diff(departStartDate, 'days')
        
        if (isComplete) {
            return 100;
        } else {
            return Math.round((pastDays / allDays)*100);
        }
    };

    var task = {
        'userName': '',
        'userId': userId,
        'items': [],
        'scheduleItems': []
    };

    var getCurrentUserName = (function(){
        _.each(res.locals.allUsers, function(user){
            if(user.userId == userId){
                task.userName = user.name;
            }
        });
    })();

    async.series({
        tasks : function(callback) {
            connection.query('select * from ued_task where ?? REGEXP "?" and (taskState=0 or taskState = ?)', [position, userId, state], function(err, rows){
                callback(null, rows);
            });
        },
        users : function(callback) {
            getUserList(function(err, users){
                callback(null, users);
            });
        }
    },
    function(err, results){
        _.each(results.tasks, function(item, k){
            task.items.push({
                name: item.taskName,
                taskId: item.taskId,
                contents: [
                    {
                        detail: '',
                        elapse: 0,
                        progress: 0
                    }
                ],
                percent: getSchedulePercent(item),
                participants: getUserNames(item, results),
                type: 'system'
            });
        });
        _.each(task.items, function(item){
            if(item.percent !== 100) {
                task.scheduleItems.push({
                    name: item.name,
                    taskId: item.taskId,
                    contents: [
                        {
                            detail: '',
                            priority: 0,
                            elapse: 0
                        }
                    ],
                    participants: item.participants,
                    type: 'system'
                });
            }
        });
        res.jsonp(task);
    });
};

exports.sendScheduleMail = function(req, res){
    var contents = req.body.content;
    connection.query('insert into ued_worksheet set ?', {
        'userId': contents.userId,
        'userName': contents.userName,
        'totalTimes': contents.totalTimes,
        'totalScheduleTimes': contents.totalScheduleTimes,
        'contents': JSON.stringify(contents),
        'allTaskUsers': contents.allTaskUsers
    }, function(err){
        var cc = ['yuanh@yiche.com'];
        var email_suffix = '@yiche.com';
        var user_names = contents.allTaskUsers.split(',');

        _.each(user_names, function(name, index){
            _.each(res.locals.allUsers, function(item){
                if(name === item.name && name !== '和雪岭'){
                    cc.push(item.userName + email_suffix);
                }
            });
        });

        _.each(user_names, function(name, index){
            _.each(res.locals.allPM, function(item){
                if(name === item.pmName){
                    cc.push(item.pmEmail + email_suffix);
                }
            });
        });

        var content ='';
        content += '<h2 style="color: #27c896; font-family:microsoft yahei, Helvetica, arial; font-size: 24px;">' +contents.userName+ '的工作周报</h2>';
        content += '<table width="1000" style="margin-bottom:20px;">';
        content += '<tr>';
        content += '<th align="left" width="500" style="color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 18px;">本周工作</th>';
        content += '<th align="right" width="500" style="color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 18px;">本周工时：' +contents.totalTimes+ '</th>';
        content += '</tr>';
        content += '</table>';

        content += '<table width="1000">';
        content += '<tr>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">任务名称</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">工作内容</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">使用工时</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">参与人</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">工作完成</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">项目完成</th>';
        content += '</tr>';

        _.each(contents.items, function(item){
            content += '<tr>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">' + item.name + '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">';
                _.each(item.contents, function(sub){
                     content += '<p>' + sub.detail + '</p>';
                });
            content += '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">';
                _.each(item.contents, function(sub){
                     content += '<p>' + sub.elapse + '</p>';
                });
            content += '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">' + item.participants + '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">';
                _.each(item.contents, function(sub){
                     content += '<p>' + sub.progress + '%<p>';
                });
            content += '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">' + item.percent + '%</td>';
            content += '</tr>';
        });

        content += '</table>';

        content += '<table width="1000" style="margin-top: 50px; margin-bottom:20px;">';
        content += '<tr>';
        content += '<th align="left" width="500" style="color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 18px;">下周工作计划</th>';
        content += '<th align="right" width="500" style="color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 18px;">计划工时：' +contents.totalScheduleTimes+ '</th>';
        content += '</tr>';
        content += '</table>';

        content += '<table width="1000">';
        content += '<tr>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">任务名称</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">工作内容</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">计划工时</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">参与人</th>';
        content += '<th align="left" style="padding:5px;border-bottom: 2px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px; font-weight:bold;">优先级</th>';
        content += '</tr>';

        _.each(contents.scheduleItems, function(item){
            content += '<tr>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">' + item.name + '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">';
                _.each(item.contents, function(sub){
                     content += '<p>' + sub.detail + '</p>';
                });
            content += '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">';
                _.each(item.contents, function(sub){
                     content += '<p>' + sub.elapse + '</p>';
                });
            content += '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">' + item.participants + '</td>';
            content += '<td style="padding:5px;border-bottom: 1px solid #ddd; color: #666; font-family: Helvetica Neue, Helvetica, microsoft yahei, arial; font-size: 14px;">';
                _.each(item.contents, function(sub){
                     content += '<p style="color:#f99235;">' + new Array(parseInt(sub.priority, 10)+1).join('★') + '</p>';
                });
            content += '</td>';
            content += '</tr>';
        });

        content += '</table>';
        
        var mailOptions = {
            from: mail_from,
            to: 'hexl@yiche.com',
            cc: cc,
            subject: contents.userName + "的UED周报",
            html: mail_template({
                title: contents.userName + "的UED周报", 
                content: content
            })
        };
        sendMail(mailOptions);

        if(err){
            res.jsonp('error');
        }else{
            res.jsonp('success');
        }
    });
};


exports.user = function(req, res) {
    getUserList(function(err, users){
        res.render('user', {
            title: '用户管理',
            persons: users,
            flag: 'user',
            user: req.session.user
        });
    });
};

exports.userNew = function(req, res) {
    res.render('user_new', {
        title: '添加用户'
    });
};

exports.userNewAction = function(req, res) {
    var user = req.body;

    var data = {
        name     : user.name,
        userName : user.userName,
        position : user.position,
        password : md5(user.userName),
        state    : 1,
        power    : 0
    };
    connection.query('insert into ued_user set ?', data, function(err, rows){
        res.redirect('/user/new');
    });
};

// ajax action
exports.addRemark = function(req, res){
    var remark = req.body.postData;
    var url = req.body.redirectUrl;
    putRemark(remark, function(err, result){
        res.send({
            url: req.headers.referer
        });
    });
};

exports.setAssessTime = function(req, res) {
    var taskId = req.body.taskId;
    var obj = req.body.data;
    setAssessTime(obj, taskId, function(err, rows){
        console.log(err);
        if(err){
            res.send('false');
        }else{
            res.send('true');
        }
    });
};

exports.set_task = function(req, res) {
    var taskId = req.body.taskId;
    var obj = req.body.data;
    // res.send(req.body); 
    setUserTaskStatus(obj, taskId, function(err, rows){
        res.send('success');
    });
};

exports.set_taskReview = function(req, res){
    var taskId = req.body.taskId;
    var obj_remark = req.body.remark;
    var obj_status = req.body.setUserTaskStatus;
    var redirectUrl = { redirectUrl: req.headers.referer };

    setUserTaskStatus(obj_status, taskId, function(err, rows){
        putRemark(obj_remark, function(err, rows){
            res.send(redirectUrl);
        });
    });
};

exports.set_taskStatus = function(req, res) {
    var taskId = req.body.taskId;
    var obj_remark = req.body.remark;
    var obj_status = req.body.taskStatus;
    setUserTaskStatus(obj_status, taskId, function(err, rows){
        if(obj_remark){
            putRemark(obj_remark, function(err, rows){
                return res.send('200');
            });
        }
        return res.send('200');
    });
};

exports.get_indexTaskList = function(req, res) {
    var offset = parseInt(req.body.offset);
    getTasksOfComplete(10, offset, function(err, rows){
        res.jsonp(rows);
    });
};

exports.get_indexTaskListOfUser = function(req, res) {
    var time = moment(req.body.time);
    time.set('d', time.daysInMonth());

    var userId = parseInt(req.body.userId, 10);
    var position;
    for(var item in res.locals.allUsers) {
        if(userId == res.locals.allUsers[item].userId) {
            position = userPostions[res.locals.allUsers[item].position];
        }
    }
    getTasksByMonthRangeOfUser(time, position, userId, function(err, rows){
        res.jsonp(rows);
    });
};

exports.get_TaskList = function (req, res, next) {
    var status = parseInt(req.body.status, 10),
        offset = parseInt(req.body.offset, 10),
        isQ = parseInt(req.body.isq, 10);

    getTaskList(status, isQ, offset, function(err, rows, next){
        if (err) {
            return next(err);
        }
        var json = JSON.stringify(rows[0]);
        res.send(rows);
    });
};

exports.adjust_workPeriod = function (req, res, next) {
    var id = req.body.id;
    var post = req.body.post;
    updateTaskById(id, post, function(err, rows){
        if(err){
            return res.jsonp('error');
        }        
        res.jsonp('success');
    });

};

exports.send_mail = function(req, res) {
    var mail_type = req.body.mail_type;
    var id = req.body.taskId;
    var userId = req.body.userId
    var content = req.body.content;
 
    async.series({
        task : function(callback) {
            getTaskById (id, function(err, rows){
                callback(null, rows[0]);
            });
        },
        taskUser: function(callback){
            callback(null, getUserByLocalsId(userId, res.locals.allUsers));
        }
    }, 
    function(err, results){
        var task = results.task;
        var to_mail = [];
        var cc_mail = ['hexl@bitauto.com'];
        var obj_content = {
            '1': '交互设计',
            '2': '视觉设计',
            '3': '前端'
        };
        
        var to_mail = getUserMailAddrs([task.UD, task.UI, task.FE], res.locals.allUsers);
        var current_user = getUserByLocalsId(userId, res.locals.allUsers);
        // cc_mail = _.union(getPMMailAddrsByNames(task.mainPM, res.locals.allPM), cc_mail);

        switch(mail_type){
            case 'review':
                var review_content = '<p>"'+task.taskName+'" '+ obj_content[current_user.position] +'工作已完成。</p>';
                review_content += '<p>'+task.mainPM.split(',').shift()+'，你好！</p>';
                review_content += '<p>请点击链接确认评审结果：<a target="_blank" href="'+req.body.url+'">立即确认</a></p>';
                review_content += '<p>如点击无效，请复制下方链接到浏览器地址栏中打开：</p>';
                review_content += '<p>http://'+req.body.url+'</p>';

                var mailOptions = {
                    from: mail_from,
                    to: to_mail.join(','),
                    cc: cc_mail.join(','),
                    subject: task.taskName+ "- UED任务通知",
                    html: mail_template({
                        title: obj_content[current_user.position] +'评审结果确认', 
                        content: review_content
                    })
                };
                sendMail(mailOptions);
                res.send('success');
                break;
            case 'pause':
                var pause_content = '<p>"'+task.taskName+'" '+ obj_content[current_user.position] +'工作于今日暂停。</p>';
                pause_content += '<p>'+obj_content[current_user.position] + ':' + current_user.name +'</p>';
                pause_content += '<p>暂停原因：'+ content +'</p>';

                var mailOptions = {
                    from: mail_from,
                    to: to_mail.join(','),
                    cc: cc_mail.join(','),
                    subject: task.taskName+ "- UED任务通知",
                    html: mail_template({
                        title: obj_content[current_user.position] +'暂停', 
                        content: pause_content
                    })
                };
                sendMail(mailOptions);
                res.send('success');
                break;
            case 'continue':
                var continue_content = '<p>"'+task.taskName+'" '+ obj_content[current_user.position] +'工作于今日起继续进行。</p>';
                continue_content += '<p>'+obj_content[current_user.position] + ':' + current_user.name +'</p>';
                continue_content += '<p>暂停阶段：' +
                    moment(
                        task[userPostions[current_user.position]+'pauseDays'].split('|').pop()==='' ?
                        moment().valueOf() :
                        task[userPostions[current_user.position]+'pauseDays'].split('|').pop()
                    ).format('YYYY.MM.DD') +
                    '-' +
                    moment().format('YYYY.MM.DD') + '</p>';
                continue_content += '<p>继续说明：'+ content +'</p>';

                var mailOptions = {
                    from: mail_from,
                    to: to_mail.join(','),
                    cc: cc_mail.join(','),
                    subject: task.taskName+ "- UED任务通知",
                    html: mail_template({
                        title: obj_content[current_user.position] +'继续', 
                        content: continue_content
                    })
                };
                sendMail(mailOptions);
                res.send('success');
                break;
            case 'whole-stop':
                var whole_stop_content = '<p>"'+task.taskName+'" '+ '任务于今日终止。</p>';
                whole_stop_content += '<p>终止原因：'+ content +'</p>';

                var mailOptions = {
                    from: mail_from,
                    to: to_mail.join(','),
                    cc: cc_mail.join(','),
                    subject: task.taskName+ "- UED任务通知",
                    html: mail_template({
                        title: task.taskName+'任务终止', 
                        content: whole_stop_content
                    })
                };
                sendMail(mailOptions);
                res.send('success');
                break;
            case 'whole-pause':
                var whole_pause_content = '<p>"'+task.taskName+'" '+ '任务于今日暂停。</p>';
                whole_pause_content += '<p>暂停原因：'+ content +'</p>';

                var mailOptions = {
                    from: mail_from,
                    to: to_mail.join(','),
                    cc: cc_mail.join(','),
                    subject: task.taskName+ "- UED任务通知",
                    html: mail_template({
                        title: task.taskName+'任务暂停', 
                        content: whole_pause_content
                    })
                };
                sendMail(mailOptions);
                res.send('success');
                break;
            case 'whole-continue':
                var whole_continue_content = '<p>"'+task.taskName+'" '+ '任务今日起继续进行。</p>';
                whole_continue_content += '<p>暂停阶段：'+ moment(task['pauseDays'].split('|').pop()).format('YYYY.MM.DD') + '-' + moment().format('YYYY.MM.DD') +'</p>';
                whole_continue_content += '<p>开始原因：'+ content +'</p>';

                var mailOptions = {
                    from: mail_from,
                    to: to_mail.join(','),
                    cc: cc_mail.join(','),
                    subject: task.taskName+ "- UED任务通知",
                    html: mail_template({
                        title: task.taskName+'任务继续', 
                        content: whole_continue_content
                    })
                };
                sendMail(mailOptions);
                res.send('success');
                break;
            case 'complete':
                var whole_continue_content = '<p>"'+task.taskName+'" '+ obj_content[current_user.position] + '任务完成。</p>';
                whole_continue_content += '<p>阶段：'+ moment(task[userPostions[current_user.position]+'StartDate']).format('YYYY.MM.DD') + '-' + moment().format('YYYY.MM.DD') +'</p>';
                whole_continue_content += '<p>说明：'+ content +'</p>';

                var mailOptions = {
                    from: mail_from,
                    to: to_mail.join(','),
                    cc: cc_mail.join(','),
                    subject: task.taskName+ "- UED任务通知",
                    html: mail_template({
                        title: task.taskName+'任务完成', 
                        content: whole_continue_content
                    })
                };
                sendMail(mailOptions);
                res.send('success');
                break;
        }
    });
};

exports.comments = function(req, res) {
    var comment = req.body;
    var data = {
        taskId : comment.taskId,
        userName : sanitize(comment.userName).trim(),
        content : sanitize(comment.content).trim(),
        type: comment.type,
        pass: comment.pass,
        isPM: comment.isPM
    };
    
    if(comment.isPM == 1){
        connection.query('insert into ued_review set ?', data, function(err, rows) {
            var new_comment = rows;
            getTaskById (data.taskId, function(err, rows){
                var task = rows[0];
                var user = [];
                var current_date = moment().format('YYYY-MM-DD');
                var positionName = {
                    'UD' : '交互',
                    'UI' : '视觉',
                    'FE' : '前端',
                };
                
                _.each(['UD', 'UI', 'FE'], function(item){
                    if(task[item]){
                       user.push(item); 
                    }
                });

                var post = {};
                
                post[data.type+'reviewDays'] = updateStatusDate(task[data.type+'reviewDays'], current_date);
                post[data.type+'taskStatus'] = 1;

                var cc_mail = [];
                var to_mail = getUserMailAddrs([task.UD, task.UI, task.FE], res.locals.allUsers);
                cc_mail = _.union(getPMMailAddrsByNames(task.mainPM, res.locals.allPM), cc_mail);
                
                if (comment.pass==1) {
                    var review_content = '<p>任务名称：'+task.taskName+ '</p>';
                    review_content += '<p>任务状态：'+positionName[comment.type]+ '工作已完成，评审通过。</p>';
                    
                    review_content += '<p>收件人：'+to_mail+ '</p>';
                    review_content += '<p>抄送：'+cc_mail;+ '</p>';

                    var mailOptions = {
                        from: mail_from,
                        to: to_mail.join(','),
                        cc: cc_mail.join(','),
                        subject: task.taskName+ "- UED任务通知",
                        html: mail_template({
                            title: positionName[comment.type] +'评审通过', 
                            content: review_content
                        })
                    };
                    sendMail(mailOptions);
                } else {
                    var review_content = '<p>任务名称：'+task.taskName+ '</p>';
                    review_content += '<p>任务状态：'+positionName[comment.type]+ '评审未通过</p>';

                    connection.query('select * from ued_review where id=? limit 1', [new_comment.insertId], function(err, rows) {
                        review_content += '<p>原因：'+rows[0].content+ '</p>';
                        review_content += '<p>收件人：'+to_mail+ '</p>';
                        review_content += '<p>抄送：'+cc_mail;+ '</p>';

                        var mailOptions = {
                            from: mail_from,
                            to: to_mail.join(','),
                            cc: cc_mail.join(','),
                            subject: task.taskName+ "- UED任务通知",
                            html: mail_template({
                                title: positionName[comment.type] +'评审未通过', 
                                content: review_content
                            })
                        };
                        sendMail(mailOptions);
                    });
                    
                }
                updateTaskById(task.taskId, post, function(err, rows) {
                    res.redirect('/');
                });
            });
        });
    }else{
        connection.query('insert into ued_review set ?', data, function(err, rows) {
            res.redirect('back');
        });
    }
}

// sql
function getUserByName (name, callback) {
    connection.query('select * from ued_user where userName = ?', [name], callback);
}

function getUserById (id, callback) {
    connection.query('select * from ued_user where userId = ?', [id], callback);
}

function getAllUsers (callback) {
    connection.query('select * from ued_user where state != 0', callback);
}

function getUsersBySet (str, callback) {
    var sets = str.replace(/\,*$/g, '');
    connection.query('select * from ued_user where userId in (' + sets +')', callback);
}

function getTasksByState (state, callback) {
    connection.query('select * from ued_task where taskState=? and isQ=0 order by taskId desc', [state], callback);
}

function getTasks(state, limit, offset, callback) {
    connection.query('select * from ued_task where isQ=0 and (taskState =0 or taskState =?) order by taskState asc, departStartDate desc limit ? offset ?', [state, limit, offset], callback);
}

function getTasksOfComplete(limit, offset, callback) {
    connection.query('select * from ued_task where taskState != 0 and taskState != 3 order by departStartDate desc, taskState desc limit ? offset ?', [limit, offset], callback);
}

function getTaskById (id, callback) {
    connection.query('select * from ued_task where taskId=? limit 1', [id], callback);
}

function getTasksOfMy(id, callback) {
    connection.query('select * from ued_task where isQ=? order by taskId desc,taskState asc', [id], callback);
}

function getTasksOfDeaprt (status, offset, callback) {
    connection.query('select * from ued_task where taskState=? and isQ=0 order by departStartDate desc limit 10 offset ?', [status, offset], callback);
}

function getTasksOfPerformance (status, offset, callback) {
    connection.query('select * from ued_task where taskState=? and isQ=1 limit 10 offset 0', [status, offset], callback);
}
function getTasksOfUser(status, isQ, position, userId, offsets, callback) {
    connection.query('select * from ued_task where taskState=? and isQ=? and ?? like "%?%" order by taskId desc,taskState asc limit 10 offset ?', [status, isQ, position, userId, offsets], callback);
}

function getTasksByMonthRange(time, callback) {
    var now= moment(time);
    var past = moment(time).add('M', -3);
    past.set('date', past.daysInMonth());
    connection.query('select * from ued_task where (taskState=? or taskState=2) and realEndDate >= ? and realEndDate < ? order by realEndDate desc', [1, past.format(), now.format()], callback);
}

function getTasksByMonthRangeOfUser(time, position, userId, callback) {
    var now= moment(time);
    var past = moment(time).add('M', -4);
    past.set('date', past.daysInMonth());
    connection.query('select * from ued_task where taskState=? and realEndDate >= ? and realEndDate < ? and ?? like "%?%" order by realEndDate desc', [1, past.format(), now.format(), position, userId], callback);
}

function getTasksByMonthRangeOfPMName(time, state, name, callback) {
    var now= moment(time);
    var past = moment(time).add('M', -4);
    past.set('date', past.daysInMonth());
    connection.query('select * from ued_task where taskState=? and realEndDate >= ? and realEndDate < ? and ?? like "%'+name+'%" order by realEndDate desc', [state, past.format(), now.format()], callback);
}

function getUserList(callback) {
    connection.query('select * from ued_user where position>0 and state=1 order by position asc, userName asc', callback);
}

function getAllPM (callback) {
    connection.query('select * from ued_pm order by pmName asc', callback);
}

function putTask (obj, callback) {
    connection.query('insert into ued_task set ?', obj, callback);
}

function getRemarksByTaskId (id, callback) {
    connection.query('select * from ued_mark where taskId = ? order by markDate desc', [id], callback);
}

function putRemark(obj, callback) {
    connection.query('insert into ued_mark set ?', obj, callback);
}

function getNewProjectList (callback) {
    connection.query('select * from ued_task where taskState=-1 and isQ=0', callback);
}

function setAssessTime (obj, taskId, callback) {
    connection.query('update ued_task set ? where taskId= ?', [obj, taskId], callback);
}

function setUserTaskStatus (obj, taskId, callback) {
    connection.query('update ued_task set ? where taskId = ?', [obj, taskId], callback);
}

function getTaskList(status, isQ, offset, callback) {
    connection.query('select * from ued_task where taskState=? and isQ=? order by departStartDate desc limit 10 offset ?', [status, isQ, offset], callback)
}

function updateTaskById(taskId, obj, callback) {
    connection.query('update ued_task set ? where taskId = ?', [obj, taskId], callback);
}

// utils
function md5 (str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}

function encrypt(str, secret) {
    var cipher = crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
}

function decrypt(str, secret) {
    var decipher = crypto.createDecipher('aes192', secret);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

function gen_session (user, res) {
    var auth_token = encrypt(user.userId + '\t' + user.userName + '\t' + user.password + '\t' + user.position, 'ep_task_system');
    res.cookie('uedTask', auth_token, {path: '/', maxAge: 1000 * 60 * 60 * 24 * 30});
}

function splitStr(str, symbol) {
    return str.split(symbol);
}

function calc_workday (end, start) {
    var start = moment(start).format('YYYY-MM-DD');
    var end   = moment(end).format('YYYY-MM-DD');
    var total = moment(end).diff(start, 'days') + 1;
    var days  = total;

    for (var i = 0; i < total; i++ ) {
        if(moment(start).add('d', i).day() == 0 || moment(start).add('d', i).day() == 6){
            days -= 1;
        }
    }

    return days;
}

function getUserMailAddrs(userArr, allUsers) {
    var mail_list = [];
    var user = _.compact(
        _.flatten(
            _.map(userArr, function(user){
                console.log(user);
                return user && user.split(',');
            })
        )
    );
     _.each(user, function(id){
        _.each(allUsers, function(person){
            if(id == person.userId){
                mail_list.push(person.userName+'@bitauto.com');
            }
        });
    });

    return mail_list;
}

function getPMMailAddrsByNames(nameStr, allPM) {
    var mail_list = [];
    var pm = _.compact(nameStr.split(','));
    _.each(pm, function(id){
        _.each(allPM, function(pm){
            if(id == pm.pmName){
                mail_list.push(pm.pmEmail+'@bitauto.com');
            }
        });
    });
    return mail_list;
}

function getPauseDays(pauseDaystr) {
    var pauseDays = [];
    var strDate = pauseDaystr.split('|');
    _.each(strDate, function(str){
        var start, end, duration;
        duration = str.split(',');
        if(duration.length==1){
            duration.push(moment().format('YYYY-MM-DD'));
        }
        start = duration[0];
        end = duration[1];
        while(moment(end).diff(start)>=0){
            pauseDays.push(start);
            start = moment(start).add('d', 1).format('YYYY-MM-DD');
        }
    });
    return pauseDays;
}

function getUserByLocalsId(id, allUsers){
    var current_user;
    _.each(allUsers, function(user){
        if(id == user.userId){
            current_user = user;
        }
    });
    return current_user;
}

function getDurationDays(str){
    var arr = [];
    var temp_arr = [];
    if (!str) {
      return arr;  
    }

    _.each(str.split('|'), function(item) {
        if (item.split(',').length == 1) {
            temp_arr.push((item +','+moment().format('YYYY-MM-DD')).split(','));
        } else {
            temp_arr.push(item.split(','));
        }
    });

    _.each(temp_arr, function(item){
        var start = item[0];
        var end = item[1];

        for (var i=0; i<= moment(end).diff(start, 'days'); i++) {
            if (moment(start).add('d', i).day() != 0 || moment(start).add('d', i).day() != 6) {
                arr.push(moment(start).add('d', i).format('YYYY-MM-DD'));
            }
        }
    });
    return arr;
}

function updateStatusDate(str, date){
    if(typeof(str) === 'undefined') return;
    var new_duration = str || '';
    var arr = str.split('|').pop().split(',');

    
    if (arr.length == 1) {
        if (moment(arr[0]).valueOf() < moment(date).valueOf()) {
            new_duration += ',' + moment(date).add('d', -1).format('YYYY-MM-DD');
        } else {
            var temp  = str.split('|');
            temp.splice(-1, 1);
            new_duration = temp.join('|');
        }
    } else if (arr.length == 2) {
        if ( arr[0] === date ) {
            var temp  = str.split('|');
            temp.splice(-1, 1);
            new_duration = temp.join('|');
        } else if ( arr[1] >= date ) {
            var temp  = str.split('|');
            temp.splice(-1, 1);
            temp.push([arr[0], moment(date).add('d', -1).format('YYYY-MM-DD')]);
            new_duration = temp.join('|');
        }

    }
    return new_duration;
}

exports.auth_user = function (req, res, next) {
    if (req.session.user) {
        res.locals.current_user = req.session.user;
        next();
    } else {
        var cookie = req.cookies['uedTask'];
        if (!cookie) {
            return next();
        }

        var auth_token = decrypt(cookie, 'ep_task_system');
        var auth = auth_token.split('\t');
        var user_id = auth[0];
        
        getUserById(user_id, function (err, user) {
            var user = user[0];
            if (err) {
                return next(err);
            } else {
                req.session.user = user;
                res.locals.current_user = req.session.user;
                return next();
            };
        });
    }
};

exports.signinRequired = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }
    next();
};

var mail_template = _.template('<style type="text/css">a { color: #5c85bd; }</style><center><table width="700" style="text-align:left;border:10px solid #dddddd;background:#fff;"> <tr><td height="70" style="padding:0 0 0 10px;border-bottom:1px solid #e6e4e4;"><h3 style="margin:0;padding:0;height:24px;color:#5a5e6d;font-size:24px;font-weight:normal;font-family:Helvetica Neue, Helvetica, microsoft yahei, arial;"><%= title %></h3></td><td align="right" style="padding:0 10px 0 0;border-bottom:1px solid #e6e4e4;"><a href=""><img src="http://ww3.sinaimg.cn/mw690/4d78ba74tw1edhj9a65wwj202m018dfm.jpg" /></a></td></tr> <tr> <td valign="top" colspan="2" height="380" style="padding:20px 10px;font-size:14px;font-family:Helvetica Neue, Helvetica, microsoft yahei, arial;"> <%= content %> </td> </tr> <tr> <td colspan="2" style="padding:10px;border-bottom:1px solid #b8dbd0;"><p style="margin:0;font-family:Helvetica Neue, Helvetica, microsoft yahei, arial;color:#5a5e6d;">惠买车事业部 UED</p></td></tr><tr><td style="padding:5px 10px;"><a href="'+ base_url +'" style="text-decoration:none;font-size:12px;font-family:Helvetica Neue, Helvetica, microsoft yahei, arial;">UED 任务管理系统</a></td></tr></table></center>');


