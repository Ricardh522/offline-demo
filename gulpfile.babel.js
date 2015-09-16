/**
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

// This gulpfile makes use of new JavaScript features.
// Babel handles this without us having to do anything. It just works.
// You can read more about the new JavaScript features here:
// https://babeljs.io/docs/learn-es2015/

import gulp from 'gulp';
import runSequence from 'run-sequence';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import pkg from './package.json';
import autoprefixer from 'gulp-autoprefixer';
import stylus from 'gulp-stylus';
import sourcemaps from 'gulp-sourcemaps';
import concat from 'gulp-concat-css';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

// Lint JavaScript
gulp.task('jshint', () =>
  gulp.src(['src/app/main.js', 'src/app/javascript/widgets/*.js'])
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
);

// Copy index.html at the root level (app)
gulp.task('copy', () =>
  gulp.src([
    'src/index.html',
    'src/*.appcache',
    'src/*.manifest',
    'src/*.json'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
);

// Compile and automatically prefix stylesheets
gulp.task('stylus', () => {
  gulp.src('src/app/resources/styles/*.styl')
    .pipe(stylus())
    .pipe(gulp.dest('src/app/resources/styles/build'));
});

gulp.task('prefix', () => {
    gulp.src('src/app/resources/styles/build/*.css')
        .pipe(sourcemaps.init())
        .pipe(autoprefixer())
        .pipe(concat('all.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('src/app/resources/css'));
});

// Watch files for changes & reload
gulp.task('serve', ['stylus', 'prefix'], () => {
  browserSync({
    notify: false,
    // Customize the BrowserSync console logging prefix
    logPrefix: 'WSK',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: ['.tmp', 'src']
  });

  gulp.watch(['src/app/**/*.html'], reload);
  gulp.watch(['src/app/resources/**/**'], reload);
  gulp.watch(['src/app/javascript/main.js'], ['jshint']);
  gulp.watch(['src/app/javascript/widgets/*.js'], reload);
  gulp.watch(['src/app/resources/images/*'], reload);
  gulp.watch(['dist/app/**/*.html'], reload);
  gulp.watch(['dist/app/resources/**/**'], reload);
  gulp.watch(['dist/app/javascript/main.js'], ['jshint']);
  gulp.watch(['dist/app/javascript/widgets/*.js'], reload);
  gulp.watch(['dist/app/resources/images/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['copy'], () =>
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: 'dist',
    baseDir: 'dist'
  })
);

