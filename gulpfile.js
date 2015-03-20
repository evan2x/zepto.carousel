
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', function(){

    gulp.src('./zepto.slider.js')
        .pipe(uglify())
        .pipe(rename('zepto.slider.min.js'))
        .pipe(gulp.dest('./'));
});