var scrollStatus = {
    referent: '',
    scrollRecord: [0, 0],
    position: 0,
    scrollDirection: 0,
    init: function() {
        this.selectReferent();
        this.setPosition();
    },
    selectReferent: function() {
        if ($('footer') && $('footer')[0]) {
            this.referent = 'footer';
        } else {
            this.referent = 'body div:last-child';
        }
    },
    setPosition: function() {
        this.position = $(this.referent).scrollTop();
    }
    recordScroll: function() {
        this.scrollRecord[1] = this.scrollRecord[0];
        this.scrollRecord[0] = $(this.referent).scrollTop() > this.position ? -1 : 1;
    },
    adaptResize: function() {
        this.init();
    },
    getDirection: function() {
        var d = '';
        if (this.scrollRecord[0] === 1) {
            d = 'u';
            if (this.scrollRecord[1] === 1) d = 'u2';
        } else if (this.scrollRecord[0] === -1) {
            d = 'd';
            if (this.scrollRecord[1] === -1) d = 'd2';
        }
        return d;
    }
}
$(document).ready(scrollStatus.init);
$(document).scroll(scrollStatus.recordScroll);
$(window).resize(scrollStatus.adaptResize);
