var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var generators = require('yeoman-generator');
var github = require('github');


var proxy = process.env.http_proxy || process.env.HTTP_PROXY ||
  process.env.https_proxy || process.env.HTTPS_PROXY || null;
var githubOptions = {
  version: '3.0.0'
};

if (proxy) {
  var proxyUrl = url.parse(proxy);
  githubOptions.proxy = {
    host: proxyUrl.hostname,
    port: proxyUrl.port
  };
}

var GitHubApi = require('github');
var github = new GitHubApi(githubOptions);

if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'oauth',
    token: process.env.GITHUB_TOKEN
  });
}

var githubUser = function(name, cb, log) {
  github.user.getFrom({
    user: name
  }, function (err, res) {
    if (err) {
      log.error('Cannot fetch your github profile. Make sure you\'ve typed it correctly.');
      res = {
        name: '',
        email: '',
        html_url: ''
      };
    }

    cb(JSON.parse(JSON.stringify(res)));
  });
}


var Generator = module.exports = generators.Base.extend({
  initializing: function() {
    this.package = require('../package.json');
    this.opts = {};

    this.log.writeln(
      'Generating from ' + chalk.cyan('Stem Boilerplate') +
      ' v' + chalk.cyan(this.package.version) + '...'
    );
  },

  prompting: function() {
    var done = this.async();

    this.log.writeln('Let us config your app:');

    var prompts = [
      {
        name: 'githubUser',
        message: 'Would you mind telling me your username on GitHub?',
        default: 'someuser'
      },
      {
        name: 'appName',
        message: 'What\'s the base name of your app?',
        default: this.appname
      }
    ];

    this.prompt(prompts, function (props) {
      this.opts = props;

      done();
    }.bind(this));
  },

  configuring: {
    userInfo: function () {
      var done = this.async();

      githubUser(this.opts.githubUser, function (res) {
        this.opts.realname = res.name;
        this.opts.email = res.email !== null ? res.email : '';
        this.opts.githubUrl = res.html_url;

        done();
      }.bind(this), this.log);
    },

    packageDependencies: function() {
      this.opts.pkg = require('./templates/package.json');
    }
  },

  writing: {
    files: function() {
      var prompts = [];
      var files   = this.expandFiles('**/*', {
        cwd: this.sourceRoot(),
        dot: true
      });
      var ignores = [
        '.git',
        'LICENSE',
        'README.md',
      ];

      files.forEach(function(file) {
        if (ignores.indexOf(file) !== -1) {
          return;
        }

        this.copy(file, file);
      }, this);
    },

    templates: function() {
      var tpls = [
        'package.json',
        'README.md'
      ];

      for(var i = 0, l = tpls.length; i < l; i++) {
        this.template('../tpl/' + tpls[i], tpls[i]);
      }
    }
  },

  install: function() {
    this.installDependencies({
      skipInstall: this.options['skip-install'],
      bower: false
    });
  }
});

Generator.name = "Stem Boilerplate";
