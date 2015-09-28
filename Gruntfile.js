/*jshint node:true*/
module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt, [ 'grunt-*', 'intern-geezer' ]);
	
	var path = require('path');

	var stripComments = /<\!--.*?-->/g,
		collapseWhiteSpace = /\s+/g;

	grunt.initConfig({
		jshint: {
			all: [
				'gruntfile.js', 'src/dojoConfig.js', 'src/windowEvent.js', 'src/app/*.js', 'src/app/widgets/*.js'
			]
		},
		dojo: {
			dist: {
				options: {
					dojo: path.join('src', 'dojo', 'dojo.js'),
					dojoConfig: path.join('src', 'dojoConfig.js'),
					profile: path.join('profiles', 'app.profile.js'),
					releaseDir: path.join('..', 'dist'),
					basePath: path.join(__dirname, 'src')
				}
			}
		},
		copy: {
			config: {
				options: {
					process: function (content, srcpath) {
						return content.replace(/isDebug:\s+(true|1),?\s+/, '');
					}
				},
				src: path.join('src', 'dojoConfig.js'),
				dest: path.join('dist', 'dojoConfig.js')
				
			},
			index: {
				options: {
					process: function (content, srcpath) {
						return content
							.replace(stripComments, '')
							.replace(collapseWhiteSpace, ' ');
					}
				},
				
				src: path.join('src', 'index.html'),
				dest: path.join('dist', 'index.html')
			},
			window: {
				
				files: [{
					src: path.join('src', 'manifest.json'),
					dest: path.join('dist', 'manifest.json')
					}, {
					src: path.join('src', 'windowEvent.js'),
					dest: path.join('dist', 'windowEvent.js')
					}
				],
			},
		},
		connect: {
			options: {
				port: 8888,
				hostname: 'localhost'
			},
			test: {
				options: {
					base: 'src'
				}
			},
			dist: {
				options: {
					base: 'dist'
				}
			}
		},
		clean: {
			dist: {
				files: [{
					dot: true,
					src: [
						'dist'
					]
				}]
			}
		},
		stylus: {
			compile: {
				options: {
					compress: false,
					'import': [ 'nib' ],
					'include css': false
				},
				files: {
					'src/app/resources/main.css': 'src/app/resources/main.styl'
				},
			},
		},
		watch: {
			stylus: {
				files: 'src/app/resources/*.styl',
				tasks: [ 'stylus:compile' ]
			}
		},
		intern: {
			local: {
				options: {
					runType: 'client',
					config: 'src/app/tests/intern'
				}
			},
			remote: {
				options: {
					runType: 'runner',
					config: 'src/app/tests/intern'
				}
			}
		}
	});

	grunt.registerTask('default', [ 'jshint:all', 'stylus:compile', 'watch:stylus' ]);
	grunt.registerTask('server', function (target) {
		if (target === 'dist') {
			return grunt.task.run([
			           'jshint:all',
				'build',
				'connect:dist:keepalive'
			]);
		}

		grunt.task.run([
		           'jshint:all',
			'stylus:compile',
			'connect:test',
			'watch:stylus'
		]);
	});
	grunt.registerTask('build', ['stylus:compile', 'clean', 'dojo:dist', 'copy' ]);
};
