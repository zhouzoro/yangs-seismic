function CV(p) {
    this.name = p && p.name ? p.name : '';
    this.picture = p && p.picture ? p.picture : '';
    this.title = p && p.title ? p.title : '';
    this.degree = p && p.degree ? p.degree : '';
    this.office = p && p.office ? p.office : '';
    this.email = p && p.email ? p.email : '';
    this.phone = p && p.phone ? p.phone : '';
    this.education = p && p.education ? p.education : [''];
    this.acdamicEmployment = p && p.acdamicEmployment ? p.acdamicEmployment : [''];
    this.researchInterest = p && p.researchInterest ? p.researchInterest : [''];
    this.award = p && p.award ? p.award : [''];
    this.professionalActivity = p && p.professionalActivity ? p.professionalActivity : [''];
    this.selectedPublications = p && p.selectedPublications ? p.selectedPublications : [''];
}

function initNewCV() {
    var cv = new CV();
    var vue = new Vue({
        el: '#cv-upload',
        data: cv,
        methods: {
            remove: function remove(att) {
                att.abort();
                this.atts.$remove(att);
            }
        }
    });
}
var menu = [{
    id: 'home',
    name: 'Home'
}, {
    id: 'vita',
    name: 'Curriculum Vitae'
}, {
    id: 'research',
    name: 'Research'
}, {
    id: 'publication',
    name: 'Publication'
}, {
    id: 'teaching',
    name: 'Teaching'
}, {
    id: 'people',
    name: 'People'
}, {
    id: 'vacancies',
    name: 'Vacancies'
}];
