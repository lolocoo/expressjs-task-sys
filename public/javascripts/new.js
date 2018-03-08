$.fn.popover = function (options) {
    var defaults = $.extend({}, {
        width: 'auto',
        offsetY: 0,
        offsetX: 0,
        btns: true,
        arrowPos: 'right'
    }, options);

    return this.on('click', function(e){
        e.stopPropagation();
        var $elem = $(this);
        var $tpl = $('<div class="popover '+ defaults.arrowPos +'"><div class="arrow"></div><div class="popover-content"></div>'+ (defaults.btns ? '<p class="popover-btns"><button type="button" class="confirm btn btn-primary btn-sm">确认</button> <button type="button" class="cancel btn btn-default btn-sm">取消</button></p>':'') +'</div>');
        var $content = $tpl.find('.popover-content');
        var $confirm = $tpl.find('.confirm');
        var $cancel = $tpl.find('.cancel');

        var pos = $(this).offset(),
            w = $(this).width(),
            h = $(this).height();

        $('.popover').remove();
        $tpl.appendTo('body');
        $(this).data('isPop', 'true');

        $content.html(defaults.content);
        
        $tpl.css({
            width: defaults.width,
            top: pos.top + defaults.offsetY,
            left: pos.left + w + defaults.offsetX,
            display: 'block'
        });
        
        if(typeof defaults.callback === 'function') {
            defaults.callback(this, $content, $tpl, $confirm,  e);
        }
        // $tpl.on('click', function(e){
        //     console.log(e.target);
        //     e.stopPropagation();
        // });
        $cancel.on('click', function(){
            $tpl.remove();
        });
        // $(document).on('click', '.popover', function(e){
        //     e.stopPropagation();
        //     $tpl.remove();
        // });
    });
};

function handleStrDate(strdate, currentdate){
    var str = '' , temp;

    if (!strdate || strdate == undefined) {
        return currentdate;
    } else {
        temp = strdate.split('|').pop().split(',');

        switch(temp.length){
            case 1:
                str = strdate + ',' + currentdate;
                break;
            case 2:
                str = strdate + '|' + currentdate;
                break;
        }
        return str;
    }
}

function updateStatusDate(str, date){
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
        console.log(arr[0] === date);
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

var UED_TASK = {
    lifter: function() {
        var $rockect = $('#lifter');

        $(window).scroll(function(){
            if($('body').scrollTop() > 100) {
                $rockect.fadeIn();
            }else{
                $rockect.fadeOut();
            }
        });

        $rockect.on('click', function() {
            $('body').animate({scrollTop:0}, 500);
        });
    },
    dropdownMenu: function(){},
    addRemark: function(){
        if(typeof(TASKUSER) == 'undefined' || typeof(CURRENT_USER) == 'undefined' || $.inArray(CURRENT_USER, TASKUSER) == -1) return;
        var tpl = '<div class="remark-form">' +
                      '<h3>备注说明：</h3>' +
                      '<p><textarea class="form-control"></textarea></p>' +
                  '</div>';
        $('#J_c_month_select_container .day').each(function(){
            var $elem = $(this);
            $elem.popover({
                width: 400,
                offsetY: -45,
                content: tpl,
                callback: function(elem, content, popover, surebtn, e){
                    surebtn.on('click', function(){
                        if( !content.find('textarea').val() ) {
                            content.find('textarea').focus();
                            return false;
                        };
                        surebtn.text('Loading...');
                        $.post('/addRemark', 
                        {
                            postData: {
                                taskId   : $('#taskId').val(),
                                userId   : parseInt(CURRENT_USER, 10),
                                position : parseInt(CURRENT_USER_POSITION, 10), 
                                content  : content.find('textarea').val(),
                                action   : 'bz',
                                markDate : $elem.data('taskdate')
                            },
                            redirectUrl: {
                                url: window.location.pathname
                            }
                        }, 
                        function(data){
                            window.location.href = data.url;
                        });
                    });
                }
            });
        });
    },
    creatTaskForm: function(){
        if (!$.fn.chosen) return false;
        $('.chosen-select').chosen();
        var today = moment().format('YYYY-MM-DD');
        $('#startDate, #endDate').EP_datepicker({
            // startDate: today
        });
    },
    userTaskOption: function(){
        if (typeof(CURRENT_USER_POSITION) == 'undefined' || typeof(CURRENT_TASK) == 'undefined') {
            return false;
        }
        var memberPos = {
            '1': 'UD',
            '2': 'UI',
            '3': 'FE'
        };

        var taskId = parseInt($('#taskId').val(), 10);
        var userTaskStatus = memberPos[CURRENT_USER_POSITION] + 'taskStatus';
        
        $('#userTaskOption li').each(function(){
            switch(this.className) {
                // * begin user status == 1
                case 'begin':
                    var $elem = $(this);
                    var current_date = moment().format('YYYY-MM-DD');
                    var userStartDate = memberPos[CURRENT_USER_POSITION] + 'StartDate';
                    
                    var userData = {};
                    userData[userTaskStatus] = 1;
                    userData[userStartDate] = current_date;

                    $elem.on('click', function(){
                        // console.log(userData);
                        $.post('/set_task', {
                            taskId: taskId,
                            data : userData
                        }, function(data){
                            window.location.reload();
                        });
                    });
                    break;
                // * pause user status == 2
                case 'pause':
                    var $elem = $(this);
                    var current_date = moment().format('YYYY-MM-DD');
                    var content = '<div class="remark-form"><h3>暂停原因：</h3><p><textarea class="form-control"></textarea></p></div>';
                    var review_date = updateStatusDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_R_DAYS'], current_date);
                    var pause_date = handleStrDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_P_DAYS'], current_date);

                    $elem.popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -203,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };
                                surebtn.text('Loading...');
                                
                                var data = {
                                    taskId: taskId
                                };

                                data['remark'] = {
                                    taskId   : taskId,
                                    userId   : parseInt(CURRENT_USER, 10),
                                    position : parseInt(CURRENT_USER_POSITION, 10), 
                                    content  : content.find('textarea').val(),
                                    action   : 'zt',
                                    markDate : current_date
                                };
                                
                                data['taskStatus'] = {};
                                data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'taskStatus'] = 2;
                                data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'reviewDays'] = review_date;
                                data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'pauseDays'] = pause_date;

                                $.post('/set_taskStatus', data, function(){
                                    var url = data.redirectUrl;
                                    $.post('/send_mail', {
                                            taskId: taskId,
                                            mail_type: 'pause',
                                            userId: parseInt(CURRENT_USER, 10),
                                            content: content.find('textarea').val(),
                                    },
                                    function(){
                                        window.location.reload();
                                    });
                                });
                            });
                        }
                    });
                    break;
                // * reviewing user status == 3
                case 'review':
                    var $elem = $(this);
                    var content = '<div class="remark-form"><h3>评审说明：</h3><p><textarea placeholder="选填" class="form-control"></textarea></p></div>';
                    var current_date = moment().format('YYYY-MM-DD');
                    var review_date = handleStrDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_R_DAYS'], current_date);
                    var pause_date = updateStatusDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_P_DAYS'], current_date);
                  
                    var href = window.location.host+'/task/'+taskId;
                    var uri = $('#J_task-pm').text().split(' ').shift() +','+ memberPos[CURRENT_USER_POSITION]+ ',' + taskId;
                    var encode_uri = $.base64.encode(uri, true);
                    var decode_uri = $.base64.decode(encode_uri, true);
                    var secret_url = href+'?uri='+encode_uri;

                    $(this).popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -203,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };
                                surebtn.text('Loading...');
                                
                                var data = { taskId: taskId };

                                data['remark'] = {
                                    taskId   : taskId,
                                    userId   : parseInt(CURRENT_USER, 10),
                                    position : parseInt(CURRENT_USER_POSITION, 10), 
                                    content  : content.find('textarea').val(),
                                    action   : 'ps',
                                    markDate : current_date
                                };
                                
                                data['taskStatus'] = {};
                                data['taskStatus'][userTaskStatus] = 3;
                                data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'reviewDays'] = review_date;
                                data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'pauseDays'] = pause_date;
                                
                                $.post('/set_taskStatus', data, function(data){
                                    if(data){
                                       $.post('/send_mail', {
                                            taskId: taskId, 
                                            mail_type: 'review',
                                            userId: parseInt(CURRENT_USER, 10),
                                            content: content.find('textarea').val(),
                                            url: secret_url
                                        },
                                        function(){
                                            window.location.reload();
                                        });
                                    }
                                });
                            });
                        }
                    });
                    break;
                case 'cancel-review':
                    var $elem = $(this);
                    var content = '<div class="remark-form"><h3>评审说明：</h3><p><textarea placeholder="选填" class="form-control"></textarea></p></div>';
                    var current_date = moment().format('YYYY-MM-DD');
                    var review_date = handleStrDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_R_DAYS'], current_date);
                    var pause_date = updateStatusDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_P_DAYS'], current_date);

                    $elem.on('click', function(){
                        var data = { taskId: taskId };                        
                        
                        data['taskStatus'] = {};
                        data['taskStatus'][userTaskStatus] = 1;
                        data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'reviewDays'] = review_date;
                        data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'pauseDays'] = pause_date;
                        
                        $.post('/set_taskStatus', data, function(data){
                            if(data){
                                window.location.reload();
                            }
                        });
                    });
                    break;
                // * complete user status == 4
                case 'complete':
                    var $elem = $(this);
                    var current_date = moment().format('YYYY-MM-DD');
                    var content = '<div class="remark-form"><h3>输出地址：</h3><p><input type="text" class="form-control"></p><p>说明：</p><p><textarea class="form-control"></textarea></p></div>';
                    
                    $(this).popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -277,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };
                                surebtn.text('Loading...');
                                
                                var dataObj = {
                                    taskId: taskId,
                                };

                                dataObj['remark'] = {};
                                dataObj['remark'] = {
                                    taskId   : taskId,
                                    userId   : parseInt(CURRENT_USER, 10),
                                    position : parseInt(CURRENT_USER_POSITION, 10), 
                                    content  : content.find('textarea').val(),
                                    action   : 'wc',
                                    markDate : current_date
                                };
                                
                                dataObj['setUserTaskStatus'] = {};
                                dataObj['setUserTaskStatus'][userTaskStatus] = 4;
                                dataObj['setUserTaskStatus'][TASK_MEMBERS_POS[CURRENT_USER_POSITION]+'EndDate'] = current_date;

                                var task_next_user = (function(){
                                    for(var item in TASK_MEMBERS_POS){
                                        if(item>CURRENT_USER_POSITION){
                                            return memberPos[item];
                                            break;
                                        } 
                                    }
                                })();

                                if ( task_next_user && 
                                        parseInt(CURRENT_TASK[task_next_user+'_TASKSTATUS'], 10) === 0) {
                                    dataObj['setUserTaskStatus'][task_next_user+'StartDate'] = moment().format('YYYY-MM-DD');
                                    dataObj['setUserTaskStatus'][task_next_user+'taskStatus'] = 1;
                                }
                                
                                var current_pause_days = CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_P_DAYS'];
                                var current_review_days = CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_R_DAYS'];
                                
                                if (current_pause_days != '' && _.compact(current_pause_days.split('|').pop().split(',')).length == 1) {
                                    dataObj['setUserTaskStatus'][memberPos[CURRENT_USER_POSITION]+'pauseDays'] = current_pause_days + ',' + current_date;
                                }

                                if (current_review_days != '' && _.compact(current_review_days.split('|').pop().split(',')).length == 1) {
                                    dataObj['setUserTaskStatus'][memberPos[CURRENT_USER_POSITION]+'reviewDays'] = current_review_days + ',' + current_date;
                                }

                                if (TASK_PROGRESS_STATUS+1 == TASKUSER_LEN){
                                    dataObj['setUserTaskStatus']['taskState'] = 4;
                                    dataObj['setUserTaskStatus']['realEndDate'] = current_date;
                                }
                                
                                $.post('/set_task_review', dataObj, function(data){
                                    $.post('/send_mail', 
                                        {
                                            taskId: taskId, 
                                            mail_type: 'complete',
                                            userId: parseInt(CURRENT_USER, 10),
                                            content: content.find('textarea').val(),
                                        },
                                        function(data){
                                            window.location.reload();
                                        }
                                    );
                                });
                            });
                        }
                    });
                    break;
                case 'remark':                  
                    var $elem = $(this);
                    var content = '<div class="remark-form remark-memo">' +
                            '<div class="remark-inner">' +
                                '<h3>备注：</h3>' +
                                '<input id="J_changeRemarkDate" type="text" value="'+ moment().format('YYYY-MM-DD') +'"class="form-control">' +
                                '<p style="clear:both"><textarea class="form-control"></textarea></p>' +
                            '</div>' +
                            '<div class="remark-calendar"></div>' +
                        '</div>';
                    var $content = $(content);

                    $elem.popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -160,
                        offsetY: -203,
                        content: $content,
                        callback: function(elem, content, popover, surebtn, e){
                            var $calendar = $content.find('#J_changeRemarkDate');
                            
                            $calendar.EP_datepicker({
                                startDate: moment(CURRENT_TASK.STARTDATE).format('YYYY-MM-DD'),
                            });

                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };
                                surebtn.text('Loading...');
                                $.post('/addRemark', 
                                {
                                    postData: {
                                        taskId   : taskId,
                                        userId   : parseInt(CURRENT_USER, 10),
                                        position : parseInt(CURRENT_USER_POSITION, 10), 
                                        content  : content.find('textarea').val(),
                                        action   : 'bz',
                                        markDate : $calendar.val()
                                    },
                                    redirectUrl: {
                                        url: window.location.pathname                                    
                                    }
                                }, 
                                function(data){
                                    window.location.href = data.url;
                                });
                            });
                        }
                    });
                    
                    break;
                case 'continue':
                    var $elem = $(this);
                    var current_date = moment().format('YYYY-MM-DD');
                    var content = '<div class="remark-form"><h3>说明：</h3><p><textarea class="form-control"></textarea></p></div>';
                    var review_date = updateStatusDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_R_DAYS'], current_date);
                    var pause_date = updateStatusDate(CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_P_DAYS'], current_date);
                    var use_task_status = CURRENT_TASK[memberPos[CURRENT_USER_POSITION]+'_TASKSTATUS'];
                    
                    $elem.popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -203,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };
                                surebtn.text('Loading...');
                                
                                var data = {taskId: taskId };

                                data['remark'] = {
                                    taskId   : taskId,
                                    userId   : parseInt(CURRENT_USER, 10),
                                    position : parseInt(CURRENT_USER_POSITION, 10), 
                                    content  : content.find('textarea').val(),
                                    action   : 'jx',
                                    markDate : current_date
                                };
                                
                                data['taskStatus'] = {};
                                data['taskStatus'][userTaskStatus] = 1;
                                data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'reviewDays'] = review_date;
                                data['taskStatus'][memberPos[CURRENT_USER_POSITION]+'pauseDays'] = pause_date;

                                $.post('/set_taskStatus', data, function(){
                                    $.post('/send_mail', {
                                        taskId: taskId, 
                                        mail_type: 'continue',
                                        userId: parseInt(CURRENT_USER, 10),
                                        content: content.find('textarea').val(),
                                    },
                                    function(){
                                        window.location.reload();
                                    });
                                });
                            });
                        }
                    });
                    break;
                case 'whole-start':
                    $(this).on('click', function(){
                        var user = _.map(TASK_MEMBERS_POS, function(key, val){ return key; });
                        var beginer = _.first(user);
                        var post_data = {
                            'taskState' : 1,
                            'departStartDate' : moment().format('YYYY-MM-DD')
                        };
                        post_data[beginer+'taskStatus'] = 1;
                        post_data[beginer+'StartDate'] = moment().format('YYYY-MM-DD');
                        console.log(post_data);
                        $.post('/set_task', {
                            taskId: taskId,
                            data : post_data
                        }, function(data){
                            window.location.reload();
                        });
                    });
                    console.log('hello world');
                    break;
                case 'whole-stop':
                    var content = '<div class="remark-form"><h3>终止原因：</h3><p><textarea palceholder="选填" class="form-control"></textarea></p></div>';
                    var $elem = $(this);
                    var current_date = moment().format('YYYY-MM-DD');
                    var whole_pause_date = updateStatusDate(CURRENT_TASK['WHOLE_P_DAYS'], current_date);

                    var userData = {
                        taskId   : taskId,
                        taskState: 2,
                        realEndDate: current_date,
                        pauseDays: whole_pause_date
                    };

                    $(this).popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -203,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };
                                surebtn.text('Loading...');
                                
                                var dataObj = {
                                    taskId: taskId,
                                };

                                dataObj['remark'] = {};
                                dataObj['remark'] = {
                                    taskId   : taskId,
                                    userId   : parseInt(CURRENT_USER, 10),
                                    position : parseInt(CURRENT_USER_POSITION, 10), 
                                    content  : content.find('textarea').val(),
                                    action   : 'zz',
                                    markDate : current_date
                                };
                                
                                // dataObj['setUserTaskStatus'] = {};
                                // dataObj['setUserTaskStatus'][userTaskStatus] = 2;
                                // dataObj['setUserTaskStatus'][memberPos[CURRENT_USER_POSITION]+'pauseDays'] = pause_date;

                                // $.post('/set_task_review', dataObj, function(data){});

                                for( var item in TASK_MEMBERS_POS ) {
                                    if (CURRENT_TASK[TASK_MEMBERS_POS[item]+'EndDate'] == '0000-00-00') {
                                        userData[TASK_MEMBERS_POS[item]+'EndDate'] = current_date;
                                        userData[TASK_MEMBERS_POS[item]+'taskStatus'] = 4;
                                    }
                                }

                                $.post('/set_task', {
                                    taskId: taskId,
                                    data : userData
                                }, function(data){
                                    $.post('/send_mail', 
                                        {
                                            taskId: taskId, 
                                            mail_type: 'whole-stop',
                                            userId: parseInt(CURRENT_USER, 10),
                                            content: content.find('textarea').val(),
                                        },
                                        function(data){
                                            window.location.reload();
                                        }
                                    );
                                });
                            });
                        }
                    });
                    break;
                case 'whole-continue':
                    var content = '<div class="remark-form"><h3>说明：</h3><p><textarea palceholder="选填" class="form-control"></textarea></p></div>';
                    var $elem = $(this);
                    var current_date = moment().format('YYYY-MM-DD');
                    var whole_pause_date = updateStatusDate(CURRENT_TASK['WHOLE_P_DAYS'], current_date);
                    var userData = {
                        taskId: taskId,
                        taskState: 1,
                        pauseDays: whole_pause_date
                    };

                    $(this).popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -203,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };
                                surebtn.text('Loading...');
                                
                                var dataObj = {
                                    taskId: taskId,
                                };

                                dataObj['remark'] = {};
                                dataObj['remark'] = {
                                    taskId   : taskId,
                                    userId   : parseInt(CURRENT_USER, 10),
                                    position : parseInt(CURRENT_USER_POSITION, 10), 
                                    content  : content.find('textarea').val(),
                                    action   : 'jx',
                                    markDate : current_date
                                };
                                
                                $.post('/set_task_review', dataObj, function(data){});

                                $.post('/set_task', {
                                    taskId: taskId,
                                    data : userData
                                }, function(data){
                                    $.post('/send_mail', 
                                        {
                                            taskId: taskId, 
                                            mail_type: 'whole-continue',
                                            userId: parseInt(CURRENT_USER, 10),
                                            content: content.find('textarea').val(),
                                        },
                                        function(data){
                                            window.location.reload();
                                        }
                                    );
                                });
                            });
                        }
                    });
                    break;
                case 'whole-pause':
                    var content = '<div class="remark-form"><h3>暂停原因：</h3><p><textarea class="form-control"></textarea></p></div>';
                    var $elem = $(this);
                    var current_date = moment().format('YYYY-MM-DD');
                    var whole_pause_date = handleStrDate(CURRENT_TASK['WHOLE_P_DAYS'], current_date);
                    var userData = {
                        taskId: taskId,
                        taskState: 2,
                        pauseDays: whole_pause_date
                    };

                    $(this).popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -203,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            surebtn.on('click', function(){
                                if( !content.find('textarea').val() ) {
                                    content.find('textarea').focus();
                                    return;
                                };

                                surebtn.text('Loading...');

                                var dataObj = {
                                    taskId: taskId,
                                    remark: {
                                        taskId   : taskId,
                                        userId   : parseInt(CURRENT_USER, 10),
                                        position : parseInt(CURRENT_USER_POSITION, 10), 
                                        content  : content.find('textarea').val(),
                                        action   : 'zt',
                                        markDate : current_date
                                    }
                                };

                                $.post('/set_task_review', dataObj);

                                $.post('/set_task', {
                                    taskId: taskId,
                                    data : userData
                                }, function(data){
                                    $.post('/send_mail', 
                                        {
                                            taskId: taskId, 
                                            mail_type: 'whole-pause',
                                            userId: parseInt(CURRENT_USER, 10),
                                            content: content.find('textarea').val(),
                                        },
                                        function(data){
                                            window.location.reload();
                                        }
                                    );
                                });
                            });
                        }
                    });
                    break;
                
                case 'change-task-date':
                    var content = '<div class="remark-form"><h3>修改任务时间：</h3><p><textarea class="form-control"></textarea></p></div>';
                    $(this).popover({
                        arrowPos: 'top',
                        width: 300,
                        offsetX: -153,
                        offsetY: -203,
                        content: content
                    });
                    break;
            }
        });
    },
    assessTime: function(){
        $('.J_assess-project-time').each(function(){
            switch($(this).data('user-pos')){
                case 'UD':
                    var $elem = $(this);
                    var $parent = $elem.parent();
                    var taskId  = parseInt($elem.data('taskid'), 10);
                    var userPos = $elem.data('user-pos');
                    var content = '<div class="assess-time-form ud-assess-time-form">' +
                                      '<dl>' +
                                          '<dt>交互评估：</dt>' +
                                          '<dd>' +
                                            '<input id="totalCountDay" value="0" type="number" autofocus="autofocus" class="form-control" min="0" required="required" id="pgdate" name="expectDate"> 天' + 
                                            '<p class="fz12 dim mb10">评估天数须包括评审天数</p>' +
                                            '<div class="is-error hide">请正确填写工期</div>' +
                                          '</dd>' +
                                      '<dl>' +
                                      '<h3>详细说明</h3>' +
                                      '<dl>' +
                                          '<dt>功能框架梳理：</dt>' + 
                                          '<dd><input type="number" value="0" name="UD_1" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                      '<dl>' +
                                          '<dt>交互原型设计：</dt>' + 
                                          '<dd><input type="number" value="0" name="UD_2" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                      '<dl>' +
                                          '<dt>整体交互规范：</dt>' + 
                                          '<dd><input type="number" value="0" name="UD_3" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                      '<dl>' +
                                          '<dt>交互说明文档：</dt>' + 
                                          '<dd><input type="number" value="0" name="UD_4" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                      '<dl>' +
                                          '<dt>可用性测试：</dt>' + 
                                          '<dd><input type="number" value="0" name="UD_5" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                  '</div>';
                    $(this).popover({
                        arrowPos: 'bottom',
                        width: 300,
                        offsetX: -180,
                        offsetY: 25,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            var $error = $(content).find('.is-error');
                            $('input[name^="UD_"]').on('change', function(){
                                var temp_val = 0;
                                $('input[name^="UD_"]').each(function(){
                                    temp_val += parseInt($(this).val(), 10);
                                });
                                $('#totalCountDay').val(temp_val);
                            });
                            
                            $(content).find('input[type="number"]').on('change', function(){
                                if($error.is(':visible')){
                                    $error.hide();
                                }
                            });
                            surebtn.on('click', function(){
                                var total_count = parseInt($('#totalCountDay').val(), 10);
                                var tmp_count = 0;
                                $('input[name^="UD_"]').each(function(){
                                    tmp_count += parseInt($(this).val(), 10);
                                });
                                if(total_count < tmp_count || total_count == 0) {
                                    $error.show();
                                    return false;
                                }
                                $.post('/assess_project_time', {
                                    taskId: taskId,
                                    data: {
                                        'UDexpectDate' : total_count,
                                        'UD_1' : parseInt($('input[name="UD_1"]').val(), 10),
                                        'UD_2' : parseInt($('input[name="UD_2"]').val(), 10),
                                        'UD_3' : parseInt($('input[name="UD_3"]').val(), 10),
                                        'UD_4' : parseInt($('input[name="UD_4"]').val(), 10),
                                        'UD_5' : parseInt($('input[name="UD_5"]').val(), 10)
                                    }
                                }, function(data){
                                    if(data==='true'){
                                        $elem.remove();
                                        $parent.html(total_count);
                                        $parent.outerWidth($parent.outerWidth());
                                        $parent.addClass('text-right').outerWidth(total_count*22);
                                        popover.remove();
                                    }
                                });
                            });
                        }
                    });
                break;
                case 'UI':
                    var $elem = $(this);
                    var $parent = $elem.parent();
                    var taskId  = parseInt($elem.data('taskid'), 10);
                    var userPos = $elem.data('user-pos');
                    var content = '<div class="assess-time-form ud-assess-time-form">' +
                                      '<dl>' +
                                          '<dt>视觉评估：</dt>' +
                                          '<dd>' +
                                            '<input id="totalCountDay" value="0" type="number" autofocus="autofocus" class="form-control" min="0" required="required" id="pgdate" name="expectDate"> 天' + 
                                            '<p class="fz12 dim">评估天数须包括评审天数</p>' +
                                            '<div class="is-error hide">请正确填写工期</div>' +
                                          '</dd>' +
                                      '<dl>' +
                                      '<h3>详细说明</h3>' +
                                      '<dl>' +
                                          '<dt>主风格：</dt>' + 
                                          '<dd><input type="number" value="0" name="UI_1" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                      '<dl>' +
                                          '<dt>风格延展：</dt>' + 
                                          '<dd><input type="number" value="0" name="UI_2" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                      '<dl>' +
                                          '<dt>页面规范：</dt>' + 
                                          '<dd><input type="number" value="0" name="UI_3" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                  '</div>';
                    $(this).popover({
                        arrowPos: 'bottom',
                        width: 300,
                        offsetX: -180,
                        offsetY: 25,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            var $error = $(content).find('.is-error');
                            $('input[name^="UI_"]').on('change', function(){
                                var temp_val = 0;
                                $('input[name^="UI_"]').each(function(){
                                    temp_val += parseInt($(this).val(), 10);
                                });
                                $('#totalCountDay').val(temp_val);
                            });
                            
                            $(content).find('input[type="number"]').on('change', function(){
                                if($error.is(':visible')){
                                    $error.hide();
                                }
                            });
                            surebtn.on('click', function(){
                                var total_count = parseInt($('#totalCountDay').val(), 10);
                                var tmp_count = 0;
                                $('input[name^="UI_"]').each(function(){
                                    tmp_count += parseInt($(this).val(), 10);
                                });
                                if(total_count < tmp_count || total_count == 0) {
                                    $error.show();
                                    return false;
                                }
                                $.post('/assess_project_time', {
                                    taskId: taskId,
                                    data: {
                                        'UIexpectDate' : total_count,
                                        'UI_1' : parseInt($('input[name="UI_1"]').val(), 10),
                                        'UI_2' : parseInt($('input[name="UI_2"]').val(), 10),
                                        'UI_3' : parseInt($('input[name="UI_3"]').val(), 10)
                                    }
                                }, function(data){
                                    if(data==='true'){
                                        $elem.remove();
                                        $parent.html(total_count);
                                        $parent.outerWidth($parent.outerWidth());
                                        $parent.addClass('text-right').outerWidth(total_count*22);
                                        popover.remove();
                                    }
                                });
                            });
                        }
                    });
                break;
                case 'FE':
                    var $elem = $(this);
                    var $parent = $elem.parent();
                    var taskId  = parseInt($elem.data('taskid'), 10);
                    var userPos = 'build';
                    var content = '<div class="assess-time-form ud-assess-time-form">' +
                                      '<dl>' +
                                          '<dt>前端评估：</dt>' +
                                          '<dd>' +
                                            '<input id="totalCountDay" value="0" type="number" autofocus="autofocus" class="form-control" min="0" required="required" id="pgdate" name="expectDate"> 天' + 
                                            '<p class="fz12 dim">评估天数须包括评审天数</p>' +
                                            '<div class="is-error hide">请正确填写工期</div>' +
                                          '</dd>' +
                                      '<dl>' +
                                      '<h3>详细说明</h3>' +
                                      '<dl>' +
                                          '<dt>前端重构：</dt>' + 
                                          '<dd><input type="number" value="0" name="build_1" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                      '<dl>' +
                                          '<dt>交互实现：</dt>' + 
                                          '<dd><input type="number" value="0" name="build_2" class="form-control" min="0"> 天</dd>' +
                                      '</dl>' +
                                  '</div>';
                    $elem.popover({
                        arrowPos: 'bottom',
                        width: 300,
                        offsetX: -180,
                        offsetY: 25,
                        content: content,
                        callback: function(elem, content, popover, surebtn, e){
                            var $error = $(content).find('.is-error');
                            $('input[name^="build_"]').on('change', function(){
                                var temp_val = 0;
                                $('input[name^="build_"]').each(function(){
                                    temp_val += parseInt($(this).val(), 10);
                                });
                                $('#totalCountDay').val(temp_val);
                            });
                            
                            $(content).find('input[type="number"]').on('change', function(){
                                if($error.is(':visible')){
                                    $error.hide();
                                }
                            });
                            surebtn.on('click', function(){
                                var total_count = parseInt($('#totalCountDay').val(), 10);
                                var tmp_count = 0;
                                $('input[name^="build_"]').each(function(){
                                    tmp_count += parseInt($(this).val(), 10);
                                });
                                if(total_count < tmp_count || total_count == 0) {
                                    $error.show();
                                    return false;
                                }
                                $.post('/assess_project_time', {
                                    taskId: taskId,
                                    data: {
                                        'FEExpectDate' : total_count,
                                        'FE_1' : parseInt($('input[name="build_1"]').val(), 10),
                                        'FE_2' : parseInt($('input[name="build_2"]').val(), 10)
                                    }
                                }, function(data){
                                    if(data==='true'){
                                        $elem.remove();
                                        $parent.html(total_count);
                                        $parent.outerWidth($parent.outerWidth());
                                        $parent.outerWidth(total_count*22);
                                        popover.remove();
                                    }
                                });
                            });
                        }
                    });
                break;
            };
  
        });
    },
    modifyWorkPeriod: function() {
        var $elem, $popover;

        $elem = $('.modify-work-period');
        $popover = $elem.next('.modify-work-period-content').html();

        $elem.popover({
            width: 500,
            offsetX: -280,
            offsetY: 20,
            arrowPos: 'bottom',
            content: $popover,
            callback: function(elem, content, popover, surebtn, e){
                surebtn.on('click', function(){
                    $.post('/update_task', {
                        id: $elem.data('taskid'),
                        post: {
                            UDexpectDate: $('input[name="UDexpectDate"]', popover).val(),
                            UIexpectDate: $('input[name="UIexpectDate"]', popover).val(),
                            FEexpectDate: $('input[name="FEexpectDate"]', popover).val()
                        }
                    }, function(data){
                        if(data=='success'){
                            popover.remove();
                            window.location.reload();
                        }
                    });
                });
            }
        });
    },
    newProjFeed: function() {
        var $elem = $('#newProjFeed');
        $elem.popover({
            offsetX: -180,
            offsetY: 25,
            arrowPos: 'bottom',
            btns: false,
            content: 'Loading',
            callback: function(elem, content, popover, surebtn, e){
                $.get('/get_newPorjects', function(data){
                    var html = '<ul class="new-project-feed">';
                    if (data.length) {
                        for(var item in data){
                            html+= '<li><a href="/project/'+ data[item].taskId +'"><span>'+ data[item].mainPM.split(',')[0] +'</span>'+ data[item].taskName +'</a></li>';
                        }
                    }else{
                        html += "<li>暂无新任务</li>";
                    }
                    html += '</ul>';
                    content.empty().html(html);
                });
            }
        });
    },
    userSelector: function() {
        if($(".chosen-select-index").length){
            $(".chosen-select-index").chosen({disable_search_threshold: 20});
        }
        $('.J_user-selector, .J_pm-selector').on('change', function(){
            window.location.href = $(this).val();
        });
    },
    loginError: function() {
        $('#loginForm input:text').on('keyup', function(){
            var $error = $('#loginForm .login-error');
            if($error){
                $error.fadeOut('fast', function(){
                    $error.remove();
                });
            }
        });  
    },
    showReviewUrl: function(){
        if(!$.base64 || typeof(CURRENT_USER_POSITION) === "undefined") return;
        var taskId = $('#taskId').val();
        var memberPos = {
            '1': 'UD',
            '2': 'UI',
            '3': 'FE'
        };
        var href = window.location.host+'/task/'+taskId;
        var uri = $('#J_task-pm').text().split(' ').shift() +','+ memberPos[CURRENT_USER_POSITION]+ ',' + taskId;
        var encode_uri = $.base64.encode(uri, true);
        var decode_uri = $.base64.decode(encode_uri, true);
        var secret_url = href+'?uri='+encode_uri;
        var url_container = $('#J_' + memberPos[CURRENT_USER_POSITION] + '_review_url');
        if(url_container.length){
            url_container.append('<div class="sub-mod-hd"><h3>'+ 
                (memberPos[CURRENT_USER_POSITION] == 'UD' ? 'UE' : memberPos[CURRENT_USER_POSITION]) +' 评审地址</h3></div><div class="sub-mod-bd">'+
                '<input type="url" class="form-control" value="http://' +secret_url+ '" />' +
                '<button id="copy-button" class="btn btn-default" date-toggle="tooltip" data-placement="bottom" data-title="已复制" data-clipboard-text="http://'+secret_url+'">复制</button>' +
                '</div>');

            var client = new ZeroClipboard(document.getElementById("copy-button"), {
                moviePath: "/javascripts/ZeroClipboard.swf"
            });
            client.on( "load", function(client) {
                // alert( "movie is loaded" );
                client.on( "complete", function(client, args) {
                // `this` is the element that was clicked
                // this.style.display = "none";
                // alert("Copied text to clipboard: " + args.text );
                    $(this).tooltip('show');
                });
            });
        }
    },
    pmReviewAction: function(){
        if(!$.base64) return;
        var url = window.location;
        var hash_uri  = $.base64.decode(url.search.split('?uri').pop(), true).split(',');
        var secret_pm= hash_uri[0];
        var secret_type= hash_uri[1];
        var secret_id= hash_uri[2];

        var current_pm = $('#J_task-pm').text().split(' ').shift();
        var current_taskId = $('#taskId').val();
        var types = {
            'UD' : '交互',
            'UI' : '视觉',
            'FE' : '前端'
        };

        var html = '<div id="J_pm_review_action" class="pm-review-action">' +
                        '<form action="/comments" method="post">' +
                        '<input type="text" name="content" class="form-control" placeholder="'+types[secret_type]+'评审说明(选填)" />' +
                        '<input type="hidden" name="pass" value="0" />' +
                        '<input type="hidden" name="isPM" value="1" />' +
                        '<input type="hidden" name="taskId" value="'+secret_id+'" />' +
                        '<input type="hidden" name="type" value="'+ secret_type +'" />' +
                        '<input type="hidden" name="userName" value="'+secret_pm+'" />' +
                        '<input type="button" class="btn btn-primary" value="通过"> ' +
                        '<input type="button" class="btn btn-danger" value="未通过">' +
                        '</form>' +
                    '</div>';


        if(secret_pm===current_pm && secret_id===current_taskId){
            $('.task-detail-options').empty().html(html);
            var $wrap = $('#J_pm_review_action');
            var $content = $wrap.find('[name="content"]');
            var $form = $wrap.find('form');
            $wrap.on('click', ':button', function(){
                if($(this).val() == '通过') {
                    $wrap.find('[name="pass"]').val(1);
                } else {
                    $wrap.find('[name="pass"]').val(0);
                }
                $content.val(types[secret_type] + '评审:' + $(this).val() + '。' + $content.val());
                $form.submit();
                console.log($content.val());
            });
        }
    },
    ganttView: function(){
        var $gantt = $('#J_gannt');
        if(!$gantt.length){
            return;
        }
        var $wrap = $gantt.find('.gantt-calendar');
        var $item = $wrap.find('.gantt-calendar-item');
        var oWidth = 0;
        $item.each(function(){
            oWidth += $(this).width();
        });
        oWidth = Math.max(oWidth, 1136);
        $wrap.width(oWidth);
        $gantt.find('.gantt-wrap').width(oWidth);

        $gantt.slimScrollHorizontal({
                  width: '1136px',
                  height: 'auto',
                  alwaysVisible: false,
                  start: 'left',
                  position: 'bottom',
                  wheelStep: 10
        }).css({ background: '#f1f1f1', paddingBottom: '10px' });

    },
    ganttComments: function(){
        if($('.gantt-comments').length){
            $('.gantt-comments').tooltip({
                html: true,
                animation: true
            });
        }
      
    },
    toggleSheet: function(){
        if(!$('.js-toggle-sheet').length) return;
        $('.js-toggle-sheet').on('click', function(){
            $(this).next().toggleClass('hide');
        });
    },
    editWeekReportBtn: function(){
        if(!$('#js-edit-week-report').length) return;
        
        // $('#js-edit-week-report').click(function(){
        //     if(moment().day() !== 5) {
        //         alert('只有周五才能编写周报！');
        //         return false;
        //     }
        //     if(moment().format('YYYY-MM-DD') === Storage.getItem('sendWeekReportDate')) {
        //         alert('本周你已经发送过周报了');
        //         return false;
        //     }
        // });
       
    },
    init: function() {
        for(fn in this) {
            if( this.hasOwnProperty(fn) && typeof this[fn] === 'function' && fn !== 'init') {
                this[fn]();
            }
        }
    }
};

var send_week_report_date;
var Storage = window.localStorage;

$(function(){
    UED_TASK.init();
});

$('body').show();
$('.version').text(NProgress.version);
NProgress.start();
setTimeout(function() { NProgress.done(); $('.fade').removeClass('out'); }, 300);



// work sheet app - using angularjs
var worksheetApp = angular.module('worksheetApp', []);

worksheetApp.controller('taskCtrl', function($scope, $http) {
    $scope.task;
    $scope.isChanged = false;
    $scope.isSending = false;

    $http({
        method: 'post',
        url: '/post_schedule_task',
        data: {
            'id': parseInt(CURRENT_USER, 10) || null,
            'position': parseInt(CURRENT_USER_POSITION, 10) || null,
        }
    }).success(function(data, status) {
        $scope.task = data;
    });

    $scope.addItem = function(index) {
        $scope.task.items[index].contents.push({
            'detail': '',
            'elapse': 0
        });
    };

    $scope.addScheduleItem = function(index) {
        $scope.task.scheduleItems[index].contents.push({
            'detail': '',
            'elapse': 0
        });
    };

    $scope.addCustomProject = function() {
        $scope.task.items.push({
            'name': '自定义项目',
            'contents': [{
                'detail': '',
                'elapse': 0,
                'progress': 0
            }],
            'participants': '',
            'percent': 0,
            'type': 'custom'
        });
    };

    $scope.addScheduleProject = function() {
        $scope.task.scheduleItems.push({
            'name': '自定义项目',
            'contents': [{
                'detail': '',
                'elapse': 0,
                'priority': 0
            }],
            'participants': '',
            'percent': 0,
            'type': 'custom'
        });
    };

    $scope.removeCustomProject = function(index) {
        $scope.task.items.splice(index, 1);
    };

    $scope.removeScheduleProject = function(index) {
        $scope.task.scheduleItems.splice(index, 1);
    };

    $scope.removeItem = function(item, index) {
        item.contents.splice(index, 1);
    };

    $scope.removeScheduleItem = function(item, index) {
        item.contents.splice(index, 1);
    };

    $scope.getAllItems = function() {
        return $scope.task.items.length;
    };

    $scope.getTotalTimes = function() {
        var times = 0;
        angular.forEach($scope.task.items, function(item) {
            angular.forEach(item.contents, function(v) {
                times += (!v.elapse && typeof(v.elapse) != Number) ? 0 : parseInt(v.elapse, 10);
            });
        });
        $scope.task.totalTimes = times;
        return times;
    };

    $scope.getScheduleTotalTimes = function() {
        var times = 0;
        angular.forEach($scope.task.scheduleItems, function(item) {
            angular.forEach(item.contents, function(v) {
                times += (!v.elapse && typeof(v.elapse) != Number) ? 0 : parseInt(v.elapse, 10);
            });
        });
        $scope.task.totalScheduleTimes = times;
        return times;
    };

    $scope.setPriority = function(item, level) {
        item.priority = level + 1;
    };

    $scope.saveDrafts = function() {
        localStorage['task'] = JSON.stringify($scope.task);
        $scope.isChanged = false;
    };

    $scope.sendMail = function(elem) {
        var getAllUsersName = function(arr) {
            var names = [];
            _.each(arr, function(item) {
                _.each(item.participants.split(','), function(v) {
                    names.push(v);
                });
            });
            return names;
        };

        $scope.task.allTaskUsers = _.uniq(getAllUsersName($scope.task.items).concat(getAllUsersName($scope.task.scheduleItems))).join(',');

        $scope.isSending = true;
        console.log($scope.task);  
        $.post('/sendScheduleMail', {
            'content': $scope.task
        }, function(data) {
            if(data==='success') {
                Storage.setItem('sendWeekReportDate', moment().format('YYYY-MM-DD'));
                alert('发送成功！');
                window.location.href = "/schedule_list";
            }
        });
    };

    $scope.$watch('task', function(newVal, oldVal, scope) {
        if (newVal !== oldVal) {
            $scope.isChanged = true;
        }
    }, true);
});

worksheetApp.directive('formatUsername', function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel){
            element.on('change', function(e){
                var elem = e.target;
                elem.value = ngModel.$modelValue.replace(/\s*,\s*|\s+,|\s+/g, ',');
                scope.$apply(function(){ngModel.$setViewValue(elem.value)});
            });
        }
    };
});