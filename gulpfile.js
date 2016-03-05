var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');
var babel = require("gulp-babel");

gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts', 'images');
});

gulp.task('styles', function() {
    return sass('public/stylesheets/*.sass', {
            style: 'expanded'
        })
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('public/stylesheets'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('public/stylesheets'))
        .pipe(notify({
            message: 'Styles task complete.'
        }));
});

gulp.task('scripts', function() {
    return gulp.src('public/javascripts/main.js')
        .pipe(babel())
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest('public/javascripts'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(uglify())
        .pipe(gulp.dest('public/javascripts'))
        .pipe(notify({
            message: 'Scripts task complete.'
        }));
});

gulp.task('images', function() {
    return gulp.src('public/images/**/*')
        .pipe(cache(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('public/images'))
        .pipe(notify({
            message: 'Images task complete'
        }));
});
gulp.task('person', function() {
    return gulp.src('public/stylesheets/person.css')
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('public/stylesheets'))
        .pipe(notify({
            message: 'Styles task complete.'
        }));
});
gulp.task('clean', function() {
    return del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img']);
});

gulp.task('watch', function() {

    // Watch .sass files
    gulp.watch('public/stylesheets/*.sass', ['styles']);
    // Watch person.css
    gulp.watch('public/stylesheets/person.css', ['person']);

    // Watch .js files
    gulp.watch('public/javascripts/main.js', ['scripts']);

    // Watch image files
    //gulp.watch('public/images/*', ['images']);

});

gulp.task('watch-styles', function() {

    // Watch .scss files
    gulp.watch('public/stylesheets/*.sass', ['styles']);

});
