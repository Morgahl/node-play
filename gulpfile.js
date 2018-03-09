(function() {
	'use strict'
	var pkg = require('./package.json'),
		tscfg = require('./tsconfig.json'),
		exec = require('child_process').exec,
		spawn = require('child_process').spawn,
		gulp = require('gulp'),
		ts = require('gulp-typescript'),
		watch = require('gulp-watch'),

		node, // this is only populated when a node is currently running

		paths = {
			root: './',
			dist: {
				root: 'dist/'
			},
			source: {
				root: 'src/',
			}
		},

		remote_host_name = '<remote host name>',
		docker_image_name = `${pkg.name}`,
		main_version = pkg.version,
		revision = ''

	gulp.task('dist', ['dist:lib'])

	gulp.task('dist:run', ['dist:lib'], function() {
		if (node) node.kill()
		node = spawn('node', ['dist/main.js'], { stdio: 'inherit' })
		node.on('close', function(code) {
			if (code === 8) {
				gulp.log('Error detected, waiting for changes...')
			}
		})
	})

	gulp.task('dist:copy-js', function() {
		return gulp.src([paths.source.root + '**/*.js'])
			.pipe(gulp.dest(paths.dist.root))
	})

	gulp.task('dist:lib', ['dist:copy-js'], function() {
		return gulp.src([paths.source.root + '**/*.ts'])
			.pipe(ts(tscfg.compilerOptions))
			.pipe(gulp.dest(paths.dist.root))
	})

	gulp.task('dist:docker', ['dist:lib'], function() {
		var cp = exec(`docker build -t ${docker_image_name}:${main_version}${revision} .`)

		cp.stdout.pipe(process.stdout)
		cp.stdin.pipe(process.stdin)
	})

	gulp.task('dist:docker-live', ['dist:docker'], function() {
		var cp = exec(`docker build -t ${remote_host_name}/${docker_image_name}:${main_version}${revision} .`)

		cp.stdout.pipe(process.stdout)
		cp.stdin.pipe(process.stdin)

		cp.addListener('close', function() {
			var cp = exec(`docker push ${remote_host_name}/${docker_image_name}:${main_version}${revision}`)

			cp.stdout.pipe(process.stdout)
			cp.stdin.pipe(process.stdin)
		})
		cp.addListener('error', function() {
			return
		})
	})

	/* =================================
	Watch
	================================= */
	gulp.task('watch', ['dist:run'], function() {
		watch(paths.source.root + '**/*.ts', function() {
			gulp.start('dist:run')
		})
	})

	gulp.task('default', ['watch'])
	gulp.task('test', ['dist'])
})()
