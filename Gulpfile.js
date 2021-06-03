/* global require process console */
const gulp = require("gulp"),
    del = require("del"),
    cliargs = require("yargs").argv,
    vbuffer = require("vinyl-buffer"),
    terser = require("gulp-terser"),
    less = require("gulp-less"),
    vsource = require("vinyl-source-stream"),
    connect = require("gulp-connect"),
    sourcemaps = require("gulp-sourcemaps"),
    tap = require("gulp-tap"),
    browserify = require("browserify"),
    babel = require("gulp-babel"),
    pkg = require("./package.json"),
    mergeStream = require("merge-stream"),
    compression = require("compression"),
    // workbox = require("workbox-build"),
    config = require("./build.config"),
    testConfig = require("./jest.config"),

    isProductionEnv = () => cliargs.env === "production" || process.env.NODE_ENV === "production",

    errorHandler = name => e => {
      console.error(name + ": " + e.toString());
      console.log(e);
    },

    uglifyIfProduction = stream => {
      if(isProductionEnv()) {
        stream = stream
            .pipe(vbuffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(terser({
              compress: {
                dead_code: true,
                drop_console: true
              }
            }))
            // .pipe(rename())
            .pipe(sourcemaps.write("./"))
            .on("error", errorHandler("Terser"));
      }
      return stream;
    };


gulp.task("help", () => {
  console.log([
    "-------------------------------------------------------------------------------------------",
    "",
    "Available build targets",
    "help           This target",
    "clean          Cleans the build directory",
    "<default>      Builds the app (Production build)",
    "dev:server     Starts the dev server",
    "",
    "To make a production build:",
    "Set the NODE_ENV environment variable to 'production' or pass --env=production option",
    "-------------------------------------------------------------------------------------------"
  ].join("\n"));
});



gulp.task("env:production", cb => {
  process.env.NODE_ENV = "production";
  cb();
});



gulp.task("clean", cb => {
  return del([
    config.build_dir + "/**",
    config.build_dir
  ], cb);
});


// Assets are defined in build.config.js
gulp.task("copy:assets", () => {
  const src = config.src_dir,
      dist = config.build_dir;
  return gulp.src(config.assets, {base: src, cwd: src}).pipe(gulp.dest(dist));
});



gulp.task("build:less", () => {
  const branding = cliargs.branding || process.env.BRANDING || "default";
  console.log(`Using ${branding} branding`);
  return gulp.src(config.src_dir + "/app.less")
      .pipe(less({
        globalVars: {
          branding: branding
        }
      }))
      .pipe(gulp.dest(config.build_dir + "/css"));
});



gulp.task("build:service-worker", () => {
  const src = config.src_dir,
      dist = config.build_dir,
      sworkers = config.serviceworkers.map(sw => {
        return `${src}/${sw}`;
      });
  // Copy the service worker related files
  return gulp.src(sworkers)
      .pipe(babel())
      .pipe(gulp.dest(dist));
});



/*
gulp.task("build:service-worker", callback => {
  const dist = config.dist.app_dir;
  return workbox.generateSW({
    globDirectory: dist,
    globPatterns: ["**\\/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}"],
    swDest: `${dist}/sw.js`,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: new RegExp("https://some.api.url"),
        handler: "staleWhileRevalidate"
      }
    ]
  }).then(() => {
    // console.info("Service worker generation completed.");
    callback();
  }).catch(error => {
    console.warn("Service worker generation failed: " + error);
  });
});
*/



gulp.task("build:vendor", () => {
  const b = browserify(config.browserify),
      deps = pkg.dependencies,
      distDir = config.build_dir;

  Object.keys(deps).forEach(dep => {
    console.log("   ", dep);
    b.require(dep);
  });
  let stream = b/* .transform() */
      .bundle()
      .pipe(vsource("vendor.js"));
  return uglifyIfProduction(stream).pipe(gulp.dest(distDir + "/js"));
});



gulp.task("build:app", () => {
  const src = config.src_dir,
      viewsdir = config.views_dir,
      dist = config.build_dir,
      b = browserify(Object.assign({}, config.browserify, {builtins: false})),
      packageDeps = Object.keys(pkg.dependencies);

  b.require(`${src}/app.js`, {expose: "app"});
  // Exclude vendors since we've created a separate bundle for vendor libraries
  packageDeps.forEach(dep => b.external(dep));

  // Expose additional libs in the js and lib directories
  config.libs.forEach(lib => {
    console.log("   ", lib.name);
    b.require(`./${lib.path}`, {
      basedir: config.src_dir,
      expose: lib.name
    });
  });

  let modStream,
      appStream = b/* .transform() */
          .bundle()
          .pipe(vsource("app.js"));

  appStream = uglifyIfProduction(appStream).pipe(gulp.dest(dist + "/js"));

  // babel transform view js files
  let externals = config.libs.map(l => l.name).concat(packageDeps);
  // console.log(externals);
  modStream = gulp.src(`${src}/${viewsdir}/*/index.js`)
      .pipe(tap(file => {
        // console.log(file.contents);
        const b = browserify(file.path, Object.assign({}, config.browserify, {builtins: false}));
        externals.forEach(dep => b.external(dep));
        file.contents = b.bundle();
      }))
      .pipe(vbuffer());

  modStream = uglifyIfProduction(modStream).pipe(gulp.dest(`${dist}/${viewsdir}`));

  return mergeStream(appStream, modStream);
});



gulp.task("build", gulp.series("build:vendor", "build:app", "copy:assets", "build:less", cb => {
  cb();
}));



gulp.task("default", gulp.series("env:production", "build", "build:service-worker", cb => {
  cb();
}));



gulp.task("dev:server", gulp.series("build", "build:service-worker", () => {
  return connect.server({
    root: config.build_dir,
    host: "0.0.0.0",
    port: 8080,
    middleware() {
      return [
        compression()
      ];
    }
  });
}));



gulp.task("prod:server", gulp.series("env:production", "build", "build:service-worker", () => {
  return connect.server({
    root: config.build_dir,
    port: 8080,
    middleware() {
      return [
        compression()
      ];
    }
  });
}));
