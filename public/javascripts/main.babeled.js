'use strict';

$(document).ready(function () {
    if (window.location.pathname == '/') Cookies.remove('editmode');
    if ($('.edit-controls') && $('.edit-controls')[0]) {
        Cookies.set('editmode', 'right on', {
            expires: 1
        });
    }
    console.log(111);
    $('.edit-logo').click(uploadLogo);
    $('#sidebar-hidden').find('.item.nav-link').click(function () {
        $('.sidebar').sidebar('hide');
    });
    $('.content-module').each(function (i, el) {
        if (checkVisible(el)) {
            $(el).addClass("already-visible");
        }
    });
    showScrollTop();
    // changeHeaderOrNot();
    $(document).scroll(function () {
        showScrollTop();
        scrollStatus.recordScroll();
        //contentAnimate();
    });
    if ($('#app-r') && $('#app-r')[0]) initRefe();
    //$(window).resize(changeHeaderOrNot);
    $('.carousel-fade').carousel({
        interval: 1000 * 8
    });
});

function initRefe() {
    var vue = new Vue({
        el: '#app-r',
        data: {
            refes: []
        },
        methods: {
            remove: function remove(refe) {
                refe.abort();
                this.refes.$remove(refe);
            }
        }
    });
    var refeManager = initManeger();
    $('#btn-add').click(function () {
        vue.refes.push(refeManager.addAtt());
    });
    $('#btn-upload').click(function () {
        $('#loader').modal('show');
        var loader = $('#loader').find('.loader');
        var updatep = function updatep(n) {
            loader.text('uploading ' + n + 'of ' + vue.refes.length);
        };
        _.forEach(vue.refes, function (val, index) {
            index++;
            updatep(index);
            console.log(val);
            var data = {
                index: val.index,
                title: val.title,
                name: val.name,
                txt: val.txt,
                source: val.source,
                path: val.path
            };
            $.post('/add_publication', data, function (res) {
                console.log(res);
                $('#loader').modal('hide');
                if (index == vue.refes.length) {
                    document.location.reload(true);
                }
            });
        });
        $('#loader').modal('hide');
        document.location.reload(true);
    });
}

function uploadLogo() {
    var img = $(this).next('img');
    var tempImgInput = $('<input>').attr({
        'type': 'file',
        'class': 'temp-input'
    }).css({
        'display': 'none',
        'position': 'absolute'
    }).change(function () {

        if (this.files && this.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                img.attr('src', e.target.result);
            };
            reader.readAsDataURL(this.files[0]);
            var fileUploadReq = new XMLHttpRequest();
            fileUploadReq.withCredentials = false;
            fileUploadReq.open('POST', '/logo');
            var formData = new FormData();
            formData.append('file', this.files[0], this.files[0].name);
            fileUploadReq.send(formData);
        }
    });
    $('body').append(tempImgInput);
    tempImgInput.click();
}
/*
function uploadFile(updateProgressFunc) {
    var tempImgInput = $('<input>').attr({
        'type': 'file',
        'class': 'temp-input'
    }).css({
        'display': 'none',
        'position': 'absolute'
    }).change(function() {

        if (this.files && this.files[0]) {
            function updateProg(oEvent) {
                var pct = Math.ceil(100 * oEvent.loaded / oEvent.total);
                var height = 100 - pct;
            };
            var updateProgress = updateProgressFunc ? updateProgressFunc : updateProg;
            var fileUploadReq = new XMLHttpRequest();
            fileUploadReq.withCredentials = false;
            fileUploadReq.open('POST', '/files');

            fileUploadReq.onload = function() {
                var json = JSON.parse(fileUploadReq.responseText);
                console.log(json.location);
                $('.temp-input').remove();
            };
            fileUploadReq.upload.addEventListener("progress", updateProgress, false);
            var formData = new FormData();
            formData.append('file', this.files[0], this.files[0].name);
            fileUploadReq.send(formData);
        }
    });
    $('body').append(tempImgInput);
    tempImgInput.click();
}*/

function contentAnimate() {
    $('.content-module').each(function (i, el) {
        if (checkVisible(el) && !$(el).hasClass("already-visible")) {
            $(el).addClass("already-visible");
            if (scrollStatus.direction === 'down') {
                $(el).removeClass('not-visible').addClass("come-in");
            } else {
                $(el).removeClass('not-visible').addClass("come-down");
            }
        } else if (!checkVisible(el)) {
            $(el).removeClass("already-visible come-in come-down").addClass('not-visible');
        }
    });
}
var scrollStatus = {
    scrollRecord: [0, 0],
    init: function init() {
        scrollStatus.setPosition();
    },
    setPosition: function setPosition() {
        scrollStatus.position = $(window).scrollTop();
    },
    recordScroll: function recordScroll() {
        scrollStatus.scrollRecord[1] = scrollStatus.scrollRecord[0];
        scrollStatus.scrollRecord[0] = $(window).scrollTop() > scrollStatus.position ? -1 : 1;
        scrollStatus.position = $(window).scrollTop();
        scrollStatus.direction = scrollStatus.scrollRecord[0] === -1 ? 'down' : 'up';
        scrollStatus.continuous = scrollStatus.scrollRecord[0] === scrollStatus.scrollRecord[1];
    },
    adaptResize: function adaptResize() {
        scrollStatus.init();
    }
};
$(document).ready(scrollStatus.init);
$(window).resize(scrollStatus.adaptResize);

function changeHeaderOrNot() {
    if ($(window).width() < 1000) {
        controlNavPosition();
        $(document).on('scroll', controlNavPosition);
    } else {
        $(document).off('scroll', controlNavPosition);
    }
}

function toggleSidebar() {
    $('.sidebar').sidebar('toggle');
}

function ScrollTop() {
    var body = $("html, body");
    body.stop().animate({
        scrollTop: 0
    }, '500');
}

function showScrollTop() {
    if (!checkVisible($('#top-indicator'))) {
        $('#vertical-nv').removeClass("normal").addClass("pinned");
        $('#scroll-top').removeClass("out").addClass("in");
    } else {
        $('#vertical-nv').removeClass("pinned").addClass("normal");
        $('#scroll-top').removeClass("in").addClass("out");
    }
}

function controlNavPosition(evt) {
    if (checkVisible($('#top-indicator'))) {
        $('#header').removeClass('fixed-header').addClass('normal');
    } else {
        $('#header').removeClass('normal').addClass('fixed-header');
        if (scrollStatus.direction === 'up' && scrollStatus.continuous === true) {
            $('#header').removeClass('hidden').addClass('shown');
        } else if (scrollStatus.direction === 'down' && scrollStatus.continuous === true) {
            $('#header').removeClass('shown').addClass('hidden');
        }
    }
}

function checkVisible(elm, evalType) {
    evalType = evalType || 'visible';

    var vpH = $(window).height(),


    // Viewport Height
    st = $(window).scrollTop(),


    // Scroll Top
    y = $(elm).offset().top,
        elementHeight = $(elm).height();

    if (evalType === 'visible') return y < vpH + st && y > st - elementHeight;
    if (evalType === 'above') return y < vpH + st;
}

function scrollTo(eleId) {
    var body = $("html, body");
    body.stop().animate({
        scrollTop: $(eleId).offset().top
    }, '500');
}
$('.edit-controls').each(function () {
    var _this = this;

    var editControl = $(this);
    $(this).find('.save-btn').hide();
    if (editControl.data('type') == 'publication') {
        var publication = editControl.parent('.publication');
        var editor = $(this).parent().find('.edit-only');
        $(this).find('.edit-btn').click(function () {
            $(_this).find('.edit-btn').hide();
            $(_this).find('.save-btn').show();
            editor.css('display', 'inline-block');
            editor.prev('.edit-hidden').css('display', 'none');
            $(_this).find('.save-btn').click(function () {
                var data = {
                    id: $(_this).data('id'),
                    index: editor.find('.att-index').val(),
                    txt: editor.find('.att-txt').val(),
                    source: editor.find('.att-source').val()
                };
                $.post('/add_publication', data, function (res) {
                    console.log(res);
                    document.location.reload(true);
                });
            });
        });
    } else if ($(this).parent().find('.editable') && $(this).parent().find('.editable')[0]) {
        var editor = $(this).parent().find('.editable');
        editor.addClass('editing edit-disabled');
        $(this).find('.edit-btn').click(function () {
            $(_this).find('.edit-btn').hide();
            $(_this).find('.save-btn').show();
            $(_this).find('.save-btn').click(function () {
                var data = { html: tinymce.activeEditor.save() };
                $.post('/change/' + editControl.data('type'), data, function (res) {
                    console.log(res);
                    document.location.reload(true);
                });
            });
            var editArea = '#' + editor.attr('id');
            editor.removeClass('edit-disabled');
            initMce(editArea);
        });
    } else if ($(this).parent().find('.edit-only') && $(this).parent().find('.edit-only')[0]) {
        var editor = $(this).parent().find('.edit-only');
        console.log(editor);
        $(this).find('.edit-btn').click(function () {
            $(_this).find('.edit-btn').hide();
            $(_this).find('.save-btn').show();
            editor.css('display', 'inline-block');
            editor.prev('.edit-hidden').css('display', 'none');
            initUploadOf(editControl.data('type'), editControl.data('id'));
        });
    }
    $(this).find('.delete-btn').click(function () {
        $('#loader').modal('show');
        var loader = $('#loader').find('.loader');
        loader.text('ing!');
        $.post('/delete', { _id: editControl.data('id'), doctype: editControl.data('type') }, function (res) {
            if (res.url) {
                loader.text('done and done!');
                window.location = res.url;
            } else {
                loader.text('oops, failed...somehow');
                $('#loader').modal('hide');
                loader.text('loading');
            }
        });
    });
});

function initMce(selector, docId) {
    //remove all instance
    /*for (var i = tinymce.editors.length - 1; i > -1; i--) {
        var ed_id = tinymce.editors[i].id;
        tinyMCE.execCommand("mceRemoveEditor", true, ed_id);
    }*/
    var inline = false;
    if (docId) inline = true;
    tinymce.EditorManager.remove();
    //init the new one
    tinymce.init({
        selector: selector,
        skin: 'mymce1',
        language: 'zh_CN',
        content_css: '/stylesheets/mce.min.css',
        inline: inline,
        plugins: 'table contextmenu autoresize contextmenu paste image imagetools preview',
        style_formats: [{ title: 'H1', block: 'h1' }, { title: 'H2', block: 'h2' }, { title: 'H3', block: 'h3' }, { title: 'Bold text', inline: 'strong' }, { title: 'Red text', inline: 'span', styles: { color: '#ff0000' } }, { title: 'Red header', block: 'h1', styles: { color: '#ff0000' } }, { title: 'Badge', inline: 'span', styles: { display: 'inline-block', border: '1px solid #2276d2', 'border-radius': '5px', padding: '2px 5px', margin: '0 2px', color: '#2276d2' } }, { title: 'Table row 1', selector: 'tr', classes: 'tablerow1' }],
        formats: {
            alignleft: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'left' },
            aligncenter: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'center' },
            alignright: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'right' },
            alignfull: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'full' },
            bold: { inline: 'span', 'classes': 'bold' },
            italic: { inline: 'span', 'classes': 'italic' },
            underline: { inline: 'span', 'classes': 'underline', exact: true },
            strikethrough: { inline: 'del' },
            customformat: { inline: 'span', styles: { color: '#00ff00', fontSize: '20px' }, attributes: { title: 'My custom format' }, classes: 'example1' }
        },
        //content_css: '/stylesheets/person.min.css',
        //plugins: "advlist lists link anchor contextmenu paste image autoresize preview imagetools lists",
        toolbar: 'formatselect fontsizeselect bold italic underline strikethrough alignleft aligncenter alignright alignfull advlist lists link image preview',
        image_caption: true,
        paste_data_images: true,
        //block_formats: 'Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3',
        fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 18pt 24pt',
        //plugins: "contextmenu",
        contextmenu: "formatselect bold italic link image inserttable | cell row column deletetable",
        menubar: false,
        images_upload_url: '/images',
        statusbar: false
    });
}
$('.add-btn').click(function () {
    var transloader = $('<div>').attr('class', 'expand-transition');
    $(this).append(transloader);
    var targetUrl = $(this).data('url');
    var uploadType = $(this).data('type');
    $.get(targetUrl, function (res) {
        $('#modal-cust').find('.container').html(res);
        $('#btn-cancel').click(function () {
            $('#body').show();
            $('#modal-cust').hide('fast');
            $('#modal-cust').find('.container').html('');
        });
        $('#modal-cust').show('slow');
        $('#body').hide('slow');
        initUploadOf(uploadType);
        transloader.remove();
        $('#edit-pic').click(uploadPic);
    });
});

function uploadPic() {
    var img = $(this).next('img');
    var loader = $(this).find('#pic-loader');
    var label = $(this).find('label');
    var tempImgInput = $('<input>').attr({
        'type': 'file',
        'class': 'temp-input'
    }).css({
        'display': 'none',
        'position': 'absolute'
    }).change(function () {

        if (this.files && this.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                img.attr('src', e.target.result);
            };
            reader.readAsDataURL(this.files[0]);
            label.removeClass('btn').addClass('pct');
            var updateProgress = function updateProgress(oEvent) {
                var pct = Math.ceil(100 * oEvent.loaded / oEvent.total);
                var height = 100 - pct;
                loader.css({ 'height': height + 'px' });
                label.text(pct + '%');
            };
            var fileUploadReq = new XMLHttpRequest();
            fileUploadReq.withCredentials = false;
            fileUploadReq.open('POST', '/images');

            fileUploadReq.onload = function () {
                var json = JSON.parse(fileUploadReq.responseText);
                console.log(json.location);
                img.attr('src', json.location);
                label.removeClass('pct').addClass('btn').text('change');
                $('.temp-input').remove();
            };
            fileUploadReq.upload.addEventListener("progress", updateProgress, false);
            var formData = new FormData();
            formData.append('image', this.files[0], this.files[0].name);
            fileUploadReq.send(formData);
        }
    });
    $('body').append(tempImgInput);
    tempImgInput.click();
}

function computProgress(oEvent) {
    var percentComplete = Math.ceil(1000 * oEvent.loaded / oEvent.total) / 10 + '%';
    return percentComplete;
}

function Att() {
    var _this2 = this;
    this.index = 0;
    this.txt = '';
    this.name = '';
    this.source = '';
    this.path = '';
    this.progress = '0%';
    this.updateProgress = function (oEvent) {
        _this2.progress = computProgress(oEvent);
    };
    var fileUploadReq = new XMLHttpRequest();
    fileUploadReq.withCredentials = false;
    fileUploadReq.open('POST', '/files');

    fileUploadReq.onload = function () {
        var json = JSON.parse(fileUploadReq.responseText);
        _this2.path = json.location;
    };
    fileUploadReq.upload.addEventListener("progress", this.updateProgress, false);
    this.uploadFile = function () {
        var tempImgInput = $('<input>').attr({
            'type': 'file',
            'class': 'temp-input'
        }).css({
            'display': 'none',
            'position': 'absolute'
        }).change(function () {
            if (this.files && this.files[0]) {
                var formData = new FormData();
                _this2.name = this.files[0].name;
                formData.append('file', this.files[0], this.files[0].name);
                fileUploadReq.onload = function () {
                    var json = JSON.parse(fileUploadReq.responseText);
                    _this2.path = json.location;
                };
                fileUploadReq.send(formData);
            }
        });
        $('body').append(tempImgInput);
        tempImgInput.click();
    };
    this.abort = function () {
        fileUploadReq.abort();
    };
}

function initManeger() {
    var e = {
        atts: {}
    };
    var attCount = 0;
    e.addAtt = function () {
        attCount++;
        var attname = 'att' + attCount;
        var newAtt = new Att();
        newAtt.uploadFile();
        e.atts[attname] = newAtt;
        return newAtt;
    };
    e.wrapUp = function (atts) {
        var html = '';
        _.forEach(atts, function (att, index) {
            index++;
            html += '<p>附件.' + index + '： <a href="' + att.path + '" download="' + att.name + '">' + att.name + '</a>' + '</p>';
        });
        return html;
    };
    return e;
};

function initUploadOf(type, docId) {
    initMce('#input-body', docId);
    if (type === 'people') {
        console.log('uploading type of ' + type);
        $('#btn-upload').click(function () {
            $('#loader').modal('show');
            var people = $('#upload-people');
            var data = {
                name: people.find('#input-name').val(),
                picture: people.find('#profile-pic').find('img').attr('src'),
                title: people.find('#input-title').val(),
                degree: people.find('#input-degree').val(),
                office: people.find('#input-office').val(),
                email: people.find('#input-email').val(),
                phone: people.find('#input-phone').val(),
                details: tinymce.activeEditor.save()
            };
            if (docId) data.id = docId;
            $.post('/add_people', data, function (res) {
                if (docId) document.location.reload(true);else window.location = res.url;
            });
        });
    } else {
        var attManager = initManeger();
        var vue = new Vue({
            el: '#app',
            data: {
                atts: []
            },
            methods: {
                remove: function remove(att) {
                    att.abort();
                    this.atts.$remove(att);
                }
            }
        });
        $('#btn-img').click(function () {
            var tempImgInput = $('<input>').attr({
                'type': 'file',
                'class': 'temp-input'
            }).css({
                'display': 'none',
                'position': 'absolute'
            }).change(function () {
                if (this.files && this.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        tinymce.activeEditor.execCommand('insertHTML', false, '<img class="inline-img" src="' + e.target.result + '" width="80%" >');

                        tinymce.activeEditor.uploadImages();
                    };
                    reader.readAsDataURL(this.files[0]);
                }

                $('.temp-input').remove();
            });
            $('body').append(tempImgInput);
            tempImgInput.click();
        });
        $('#input-date').val(GetCurrentDate());
        $('#btn-att').click(function () {
            vue.atts.push(attManager.addAtt());
        });
        $('#btn-upload').click(function () {
            $('#loader').modal('show');
            var loader = $('#loader').find('.loader');
            loader.text('uploading Images');
            tinymce.activeEditor.uploadImages(function (success) {
                loader.text('wrapping together');
                var attHtml = attManager.wrapUp(vue.atts);
                data = {
                    title: $('#input-title').val(),
                    date: $('#input-date').val(),
                    source: $('#input-source').val(),
                    cover: $(tinymce.activeEditor.save()).find('img').attr('src'),
                    quote: getQuoteText(tinymce.activeEditor.save()),
                    body: tinymce.activeEditor.save() + attHtml,
                    att: attHtml
                };
                if (docId) data.id = docId;
                loader.text('uploading');
                var posturl = '/add_' + type;
                $.post(posturl, data, function (res) {
                    $('#loader').modal('hide');
                    if (docId) document.location.reload(true);else window.location = res.url;
                });
            });
        });
    }
}

function GetCurrentDate() {
    var cdate = new Date();
    var month = cdate.getMonth() < 9 ? '0' + (cdate.getMonth() + 1) : cdate.getMonth() + 1;
    var currentDate = cdate.getFullYear() + "-" + month + "-" + cdate.getDate();
    return currentDate;
}

function getQuoteText(htmlStr) {
    var p = '';
    $(htmlStr).find('*').each(function () {
        if ($(this).text().length > 32) {
            p = $(this).text();
            return false;
        }
    });
    return p;
}