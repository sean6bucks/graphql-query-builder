var gulp = require('gulp');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var DIST_DIR = './dist';
var OUTPUT_FILE = 'sk-query';

function filename(name, min) {
	return name + (min ? '.min' : '') + '.js';
}

gulp.task('clean', function () {
	return gulp.src(DIST_DIR, {read: false})
		.pipe(clean());
});

gulp.task('build', ['clean'], function(done) {
	gulp.src('./sk-query.js')
		.pipe(rename(filename(OUTPUT_FILE, false)))
		.pipe(gulp.dest(DIST_DIR));
	gulp.src('./sk-query.js')
		.pipe(rename(filename(OUTPUT_FILE, true)))
		.pipe(uglify())
		.pipe(gulp.dest(DIST_DIR));
});

// gulp.task('build-min', ['clean'], function(done) {
// 	build(minConfig, done);
// });

// gulp.task('build-components', ['clean'], function() {
// 	gulp.src('components/script.js')
// 		.pipe(rename(filename(SCRIPT_FILE, false)))
// 		.pipe(gulp.dest(DIST_DIR));
// 	gulp.src('components/script.js')
// 		.pipe(rename(filename(SCRIPT_FILE, true)))
// 		.pipe(uglify())
// 		.pipe(gulp.dest(DIST_DIR));
// });

