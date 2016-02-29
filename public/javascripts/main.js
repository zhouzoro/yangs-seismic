function startEdit() {
    var editArea = $(this).parent('#person').attr('id');
    console.log(editArea);
    tinymce.init({
        selector: '#person',
        inline: true
    });
}
$(document).ready(function() {
    Cookies.remove('editmode');
    if ($('.edit-controls') && $('.edit-controls')[0]) {
        Cookies.set('editmode', 'right on', {
            expires: 1
        });
    }
})

$('.edit-controls').each(function() {
    var editor = $(this);
    $(this).find('.save-btn').hide();
    $(this).next('.editable').addClass('editing edit-disabled');
    $(this).find('.edit-btn').click(() => {
        $(this).find('.edit-btn').hide();
        $(this).find('.save-btn').show().click(function() {
            $(this).next('.editable').addClass('edit-disabled');
            if ($(this).data('type') == 'about') {
                var data = { html: tinymce.activeEditor.save() };
                $.post('/change/about', data, function(res) {
                    console.log(res);
                })
                console.log(tinymce.activeEditor.getContent());
            }
        });
        var editArea = '#' + $(this).next('.editable').attr('id')
        $(this).next('.editable').removeClass('edit-disabled');
        console.log(editArea);
        initMce(editArea);
    });
    $(this).find('.delete-btn').click(() => {
        $('#loader').modal('show');
        var loader = $('#loader').find('.loader');
        loader.text('ing!');
        $.post('/delete', { _id: editor.data('id'), doctype: editor.data('type') }, function(res) {
            if (res.result) {
                loader.text('done and done!');
                window.location = '/'
            } else {
                loader.text('oops, failed...somehow');
                $('#loader').modal('hide');
                loader.text('loading');
            }
        })
    });
    Cookies.set('editmode', true, {
        expires: 1
    });
    console.log('editmode');
});

function initMce(selector) {
    //remove all instance
    /*for (var i = tinymce.editors.length - 1; i > -1; i--) {
        var ed_id = tinymce.editors[i].id;
        tinyMCE.execCommand("mceRemoveEditor", true, ed_id);
    }*/
    tinymce.EditorManager.remove();
    //init the new one
    tinymce.init({
        selector: selector,
        //inline: true,
        scontent_css: '/stylesheets/style.min.css',
        plugins: "advlist lists link anchor paste image autoresize preview imagetools lists",
        toolbar: 'undo redo advlist lists formatselect fontsizeselect bold italic underline strikethrough alignleft aligncenter alignright link image preview',
        image_caption: true,
        paste_data_images: true,
        fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 18pt 24pt 36pt',
        menubar: false,
        images_upload_url: '/images',
        min_width: 720
    });
    //console.log(tinymce.editors.length);
    //setTimeout(function(){console.log(tinymce.editors.length);},1000);
}
$('.add-btn').click(function() {
    var targetUrl = $(this).data('url');
    var uploadType = $(this).data('type');
    console.log(targetUrl);
    $.get(targetUrl, function(res) {
        $('#modal').find('.content').html(res);
        $('#modal').modal('show');
        initUploadOf(uploadType);
        $('#edit-pic').click(uploadPic);
    })
})

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
    }).change(function() {

        if (this.files && this.files[0]) {
            var reader = new FileReader();

            reader.onload = function(e) {
                img.attr('src', e.target.result);
            }

            reader.readAsDataURL(this.files[0]);
            label.switchClass('btn', 'pct');
            var updateProgress = (oEvent) => {
                var pct = Math.ceil(100 * oEvent.loaded / oEvent.total);
                var height = 100 - pct;
                loader.css({ 'height': height + 'px' });
                label.text(pct + '%');
            };
            var fileUploadReq = new XMLHttpRequest();
            fileUploadReq.withCredentials = false;
            fileUploadReq.open('POST', '/images');

            fileUploadReq.onload = () => {
                var json = JSON.parse(fileUploadReq.responseText);
                console.log(json.location);
                img.attr('src', json.location);
                label.switchClass('pct', 'btn').text('change');
                $('.temp-input').remove();
            };
            fileUploadReq.upload.addEventListener("progress", updateProgress, false);
            var formData = new FormData();
            formData.append('image', this.files[0], this.files[0].name);
            fileUploadReq.send(formData);

        }
    })
    $('body').append(tempImgInput);
    tempImgInput.click();
}

function computProgress(oEvent) {
    var percentComplete = Math.ceil(1000 * oEvent.loaded / oEvent.total) / 10 + '%';
    return percentComplete;
}

function uploadPeople() {
    var people = $('#upload-people');

    var data = {
        name: people.find('#input-name').val(),
        picture: people.find('#profile-pic').find('img').attr('src'),
        title: people.find('#input-title').val(),
        office: people.find('#input-office').val(),
        email: people.find('#input-email').val(),
        phone: people.find('#input-phone').val(),
        details: tinymce.activeEditor.save()
    };
    console.log(data);
    $.post('/add_people', data, function(res) {
        window.location = res.url;
    });
}

function Att() {
    this.title = '';
    this.name = '';
    this.source = '';
    this.path = '';
    this.progress = '0%';
    this.updateProgress = (oEvent) => {
        this.progress = computProgress(oEvent);
    };
    var fileUploadReq = new XMLHttpRequest();
    fileUploadReq.withCredentials = false;
    fileUploadReq.open('POST', '/files');

    fileUploadReq.onload = () => {
        var json = JSON.parse(fileUploadReq.responseText);
        this.path = json.location;
    };
    fileUploadReq.upload.addEventListener("progress", this.updateProgress, false);
    this.uploadFile = (ele) => {
        this.name = ele.files[0].name;
        var form = $(ele).parent('.frmfile')[0];
        var formData = new FormData(form);
        fileUploadReq.send(formData);
        $('.temp-input').remove();
    };
    this.abort = function() {
        fileUploadReq.abort();
    }
}

function initManeger() {
    var e = {
        atts: {}
    };
    var attCount = 0;
    e.states = []; //Array of upload process states, '1' means complete
    e.addAtt = function() {
        e.states.push(0);
        attCount++;
        var attname = 'att' + attCount;
        var newAtt = new Att();
        e.atts[attname] = newAtt;
        var tempImgInput = $('<input>').attr({
            'type': 'file',
            'class': 'temp-input'
        }).css({
            'display': 'none',
            'position': 'absolute'
        }).change(function() {
            if (this.files && this.files[0]) {
                newAtt.uploadFile(this);
            }
        })
        $('body').append(tempImgInput);
        tempImgInput.click();
        return newAtt
    };
    e.wrapUp = function() {
        var html = '';
        _.forEach(vue.atts, function(att, index) {
            index++;
            html += '<p>附件.' + index + '： <a href="' + att.path + '" download="' + att.name + '">' + att.name + '</a>' + '</p>';
        })
        return html;
    }
    return e;
};

function initUploadOf(type) {
    initMce('#input-body');
    if (type === 'people') {
        console.log('uploading type of ' + type);
    } else {
        var attManager = initManeger();
        vue = new Vue({
            el: '#app',
            data: {
                atts: []
            },
            methods: {
                remove: function(att) {
                    att.abort();
                    this.atts.$remove(att);
                }
            }
        })
        $('#btn-img').click(function() {
            var tempImgInput = $('<input>').attr({
                'type': 'file',
                'class': 'temp-input'
            }).css({
                'display': 'none',
                'position': 'absolute'
            }).change(function() {
                if (this.files && this.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        tinymce.activeEditor.execCommand('insertHTML', false, '<img class="inline-img" src="' + e.target.result + '" width="80%" >');

                        tinymce.activeEditor.uploadImages();
                    }
                    reader.readAsDataURL(this.files[0]);
                }

                $('.temp-input').remove();
            })
            $('body').append(tempImgInput);
            tempImgInput.click();
        });
        $('#input-date').val(GetCurrentDate());
        $('#btn-att').click(function() {
            vue.atts.push(attManager.addAtt());
        });

        $('#btn-upload').click(function() {
            $('#loader').modal('show');
            var loader = $('#loader').find('.loader');
            loader.text('uploading Images');
            tinymce.activeEditor.uploadImages(function(success) {
                loader.text('wrapping together');
                var attHtml = attManager.wrapUp(vue.atts);
                var data;
                //if (type === 'project') {
                data = {
                    title: $('#input-title').val(),
                    date: $('#input-date').val(),
                    source: $('#input-source').val(),
                    cover: $(tinymce.activeEditor.save()).find('img').attr('src'),
                    quote: getQuoteText(tinymce.activeEditor.save()),
                    body: tinymce.activeEditor.save() + attHtml,
                    att: attHtml
                };
                //}
                loader.text('uploading');
                var posturl = '/add_' + type;
                $.post(posturl, data, function(res) {
                    $('#loader').modal('hide');
                    window.location = res.url;
                });
            });
        })
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

function uploadContent(type) {
    $('#loader').modal('show');
    var loader = $('#loader').find('.loader');
    loader.text('gathering');
    if (type === 'people') {

        var people = $('#upload-people');

        var data = {
            name: people.find('#input-name').val(),
            picture: people.find('#profile-pic').find('img').attr('src'),
            title: people.find('#input-title').val(),
            office: people.find('#input-office').val(),
            email: people.find('#input-email').val(),
            phone: people.find('#input-phone').val(),
            details: tinymce.activeEditor.save()
        };
        console.log(data);
        $.post('/add_people', data, function(res) {
            window.location = res.url;
        });
    } else if (type === '???') {

        tinymce.activeEditor.uploadImages(function(success) {
            loader.text('wrapping together');
            var attHtml = attManager.wrapUp(vue.atts);
            var data = {
                title: $('#input-title').val(),
                date: $('#input-date').val(),
                source: $('#input-source').val(),
                cover: $(tinymce.activeEditor.save()).find('img').attr('src'),
                quote: getQuoteText(tinymce.activeEditor.save()),
                body: tinymce.activeEditor.save() + attHtml,
                att: attHtml
            };
            loader.text('uploading');
            $.post('/add_new_proj', data, function(res) {
                $('#loader').modal('hide');
                window.location = res.url;
            });
        });
    }
}

function getQuoteText(htmlStr) {
    var p = '';
    $(htmlStr).find('*').each(function() {
        if ($(this).text().length > 32) {
            p = $(this).text();
            return false;
        }
    })
    return p
}
