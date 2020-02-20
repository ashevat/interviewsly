// Modules

const   autoprefixer    = require('autoprefixer'),
        browser         = require('browser-sync').create(),
        cssnano         = require('cssnano'),
        del             = require('del'),
        gulp            = require('gulp'),
        imagemin        = require('gulp-imagemin'),
        nunjucks        = require('gulp-nunjucks-render'),
        postcss         = require('gulp-postcss'),
        purgecss        = require('@fullhuman/postcss-purgecss'),
        sass            = require('gulp-sass');

// Paths

const paths = {
    dest: 'dist',
    html:   {
        src: 'src/pages/**/*.njk',
        njk: 'src/templates',
        watch: 'src/**/*.njk'
    },
    css: {
        src: 'src/assets/scss/**/*.scss',
        dest: 'dist/assets/css'
    },
    fonts: {
        css: 'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
        src: 'node_modules/@fortawesome/fontawesome-free/webfonts/*',
        dest: 'dist/assets/webfonts'

    },
    img: {
        src: 'src/assets/img/**/*{png,jpg,gif,svg,ico}',
        dest: 'dist/assets/img'
    },
    js: {
        jquery: 'node_modules/jquery/dist/jquery.slim.min.js',
        popper: 'node_modules/popper.js/dist/umd/popper.min.js',
        bootjs: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
        dest: 'dist/assets/js'
    }
}

// Tasks

function clean(cb) {
    return del(paths.dest)
    cb();
}

function html(cb) {
    return gulp
    .src(paths.html.src)
    .pipe(nunjucks({
        path: [paths.html.njk]
    }))
    .pipe(gulp.dest(paths.dest))
    .pipe(browser.stream())
    cb();
}

function css(cb) {
    var plugins = [
        autoprefixer(),
        cssnano()
    ];
    return gulp
    .src(paths.css.src)
    .pipe(sass())
    .pipe(postcss(plugins))
    .pipe(gulp.dest(paths.css.dest))
    .pipe(browser.stream())
    cb();
}

function uncss(cb) {
    const plugins = [
        purgecss({
            content: [
                paths.html.watch,
                paths.js.bootjs
            ]
        }),
        autoprefixer(),
        cssnano()
    ];
    return gulp
    .src(paths.css.src)
    .pipe(sass())
    .pipe(postcss(plugins))
    .pipe(gulp.dest(paths.css.dest))
    cb();
}

function fontawesome(cb) {
    return gulp
    .src(paths.fonts.css)
    .pipe(gulp.dest(paths.css.dest))
    cb();
}

function webfonts(cb) {
    return gulp
    .src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest))
    cb();
}

function js(cb) {
    return gulp
    .src([
        paths.js.jquery,
        paths.js.popper,
        paths.js.bootjs
    ])
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browser.stream())
    cb();
}

function img(cb) {
    return gulp
    .src(paths.img.src)
    .pipe(imagemin())
    .pipe(gulp.dest(paths.img.dest))
    .pipe(browser.stream())
    cb();
}

function server(cb) {
    browser.init({
        server: paths.dest
    })
    cb();
}

function watch() {
    gulp.watch(paths.html.watch, html);
    gulp.watch(paths.css.src, css);
    gulp.watch(paths.img.src, img);
}

exports.default = gulp.series(clean, gulp.parallel(html, css, fontawesome, webfonts, js, img),server, watch);
exports.uncss = gulp.series(uncss);
exports.watch = gulp.parallel(watch, server);
