'use strict';

const del = require('del');
const gulp = require('gulp');
const uglify = require('gulp-uglify-es').default;
const zip = require('gulp-zip');
const formatDate = require('date-fns/format');

gulp.task('copy-icons', function () {
    return gulp.src('./icons/*').pipe(gulp.dest('./dist/icons'));
});

gulp.task(
    'copy',
    gulp.series('copy-icons', function () {
        return gulp
            .src(['./manifest.json', './options.html'])
            .pipe(gulp.dest('./dist'));
    })
);

gulp.task('script', function () {
    return gulp
        .src(['./contentScript.js', './options.js'])
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('make-archive', () =>
    gulp
        .src('dist/**/*')
        .pipe(
            zip(`gcal-checker-ext-${formatDate(new Date(), 'dd.MM.yyyy')}.zip`)
        )
        .pipe(gulp.dest('dist-archives/'))
);

gulp.task('clean', () => del(['dist']));

gulp.task(
    'default',
    gulp.series('clean', gulp.series('script', 'copy', 'make-archive'))
);
