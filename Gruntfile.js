module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: '\n\n',
                stripBanners: true,
                banner: '/*!\n<%= pkg.name %> - v<%= pkg.version %>\n<%= grunt.template.today("dd.mm.yyyy") %>\nLicense: <%= pkg.license %>\n*/\n',
                process: function (src, filepath) {
                    return ('//' + filepath + '\n' + src + ';').replace(/;;/g, ';');
                }
            },
            dist: {
                src: ['src/core.js', 'src/**/*.js'],
                dest: 'dist/impact.es6.js'
            }

        },
        jst: {
            dev: {
                options: {
                    processName: function (filepath) {
                        return filepath.replace(/src\//i, '/');
                    },
                    namespace: '$$emtecJamesEngine'
                },
                files: {
                    'dist/emtec-james-engine-jst.js': 'src/**/*.html'
                }
            }
        },
        uglify: {
            options: {
                screwIE8: true,
                banner: '/*!\n<%= pkg.name %> - v<%= pkg.version %>\n<%= grunt.template.today("dd.mm.yyyy") %>\nLicense: <%= pkg.license %>\n*/\n'
            },
            dist: {
                files: {
                    'dist/impact.es5.min.js': ['dist/impact.es5.js']
                }
            }
        },
        watch: {
            default: {
                files: ['src/**/*.*'],
                tasks: ['build']
            }
        },
        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015']
            },
            dist: {
                files: {
                    'dist/impact.es5.js': 'dist/impact.es6.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-babel');

    // Default task.
    grunt.registerTask('default', ['build', 'watch']);

    // we can't uglify ES6 yet ... WTF
    grunt.registerTask('build', ['concat', 'babel', 'uglify']);

};