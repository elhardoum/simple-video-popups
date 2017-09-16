var gulp = require('gulp')
  , autoprefixer = require('gulp-autoprefixer')
  , sass = require('gulp-sass');


gulp.task('scss', function(done) {
  gulp.src('*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
    .pipe(gulp.dest('.'))
    .on('end', done)
});

gulp.task('watch', function(done) {
  gulp.watch('*.scss',['scss'])
  .on('end', done)
});

gulp.task('default', ['scss']);