// Bluecat client command line tool
// used for setup basic test framework scaffold

var Fs = require('fs');
var Path = require('path');
var Inquirer = require('inquirer');
var Exec = require('child_process').execSync;
var argv = require('yargs')
  .usage('Usage: $0 <config|api>')
  .demand(1)
  .argv;

var questions = [
  {
    type: 'input',
    name: 'project_name',
    message: 'What\'s the name of your project',
    //default: 'Service test'
  }
];

if(argv._[0] === 'config') {
  console.log('\n===========================================');
  console.log('Bluecat Test Framework Configuration Helper');
  console.log('===========================================\n');

  Inquirer.prompt( questions, function( answers ) {
    // console.log( JSON.stringify(answers, null, '  ') );

    // setting up config dir
    var dir = Path.join(process.cwd(), 'config');
    if (!Fs.existsSync(dir)){
      Fs.mkdirSync(dir);
    }
    var content = {};
    content[answers.project_name] = {
      get:{
        schema: "http",
        method: ["GET"],
      },
      post:{
        schema: "http",
        method: ["POST"],
      }
    };
    Fs.appendFileSync(Path.join(dir, 'api.json'), JSON.stringify(content, null, 2));

    content = {
      env: "production",
      proxy: null,
      server: {
        host: "httpbin.org",
      }
    };
    Fs.appendFileSync(Path.join(dir, 'default.json'), JSON.stringify(content, null, 2));

    // setting up test dir
    dir = Path.join(process.cwd(), 'test');
    if (!Fs.existsSync(dir)){
      Fs.mkdirSync(dir);
    }
    var testContent = `
var Config = require('config');
var Bluecat = require('bluecat');

var api = Bluecat.Api('${answers.project_name}');

service = new Bluecat.ServiceSync(api, Config.server.host);
service.setProxy(Config.proxy);
exports.${answers.project_name} = service;
`;
    Fs.appendFileSync(Path.join(dir, 'test.js'), testContent);
    Fs.mkdirSync(Path.join(dir, answers.project_name));
    testContent = `
// Sample test suite utilizing Bluecat

var expect = require('chai').expect;
var test = require('../../test/test.js');

describe('Sample test suite', function() {
  before(function() {
    service = test.${answers.project_name};
  });

  it('sample test to get endpoint [C001]', function(done) {
    service.run(function() {
      var r = service.get.GET({});
      expect(r.data.statusCode).to.equal(200);
      expect(r.data.body).is.a('object');
      expect(r.data.body.url).to.equal('http://httpbin.org/get');
      done();
    });
  });

  it('sample test to post endpoint [C002]', function(done) {
    service.run(function() {
      var payload = {
        sample: {
          addressLineOne: '755 abc Ave',
          city: 'Albany'
        }
      };

      var r = service.post.POST({
        body: payload
      });
      expect(r.data.statusCode).to.equal(200);
      expect(r.data.body).is.a('object');
      expect(r.data.body.json.sample.city).to.equal('Albany');
      done();
    });
  });

});
`
    Fs.appendFileSync(Path.join(dir, answers.project_name, 'sample.js'), testContent);

    // setting up root dir
    var content = {
      name: answers.project_name,
      version: '0.0.1',
      dependencies: {
      }
    };
    Fs.appendFileSync(Path.join(process.cwd(), 'package.json'), JSON.stringify(content, null, 2));
    console.log('Installing npm package...');
    var output = Exec('npm install bluecat chai config mocha mocha-espresso mocha-multi --save');
    output.on('error', function(err) {
      console.log('Error when running npm install: ' + err);
      exit(1);
    });
  });
}
