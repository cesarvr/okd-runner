## OKD-runner
Write self-deploying Node.js applications for *OpenShift* and soon in *Kubernetes*.

#### Setup
Now this guide assume you got an OpenShift cluster up and running, if you don't, you still can get access to [OpenShift Online](https://manage.openshift.com/) for free or setup one in your computer via [Minishift](https://github.com/minishift/minishift) or [oc cluster-up](https://github.com/cesarvr/Openshift#ocup).

Once you have OpenShift sorted out, you'll need to create a project/namespace manually, you can do this by login into the console and clicking into new project, thats the only limitation of the module at the moment of not being able to create it for you.

#### OKD-Runner

After all that, we get back to our working directory and install ``okd-runner`` [module from npm](https://www.npmjs.com/package/okd-runner):

```sh
npm install install okd-runner --save
```

We require the module:

```js
let count = 0

const run = require('okd-runner') // <- self-deploy module

require('http')
    .createServer((req, res) => {
        res.end(`<HTML>
                    <h1>Hello From -> ${process.platform}</h1>
                    <h2>Visitor: ${count++} </h2>
                </HTML>`)
        console.log(`response: ${Date.now()}`)
    }).listen(8080)
```

And run our application with the ``--cloud`` flag:


```sh
  node app.js --cloud   # or -c for short
```

The first time it will ask you for your cluster credentials:

![](https://github.com/cesarvr/hugo-blog/blob/master/static/self-deploy/creds.gif?raw=true)


#### Namespace, Container Creation & Deployment

Then it will show you the namespaces available for your user, you chose one:

![](https://github.com/cesarvr/hugo-blog/blob/master/static/self-deploy/deploy.gif?raw=true)

The next stage will create and deploy you image, once the image is deployed a route is created, as you might observe now the OS is Linux.


#### Routing

The route basically will allow traffic to your pod from the outside, when this components is created you will get the URL back:

```sh
...
building  ok
URL:  http://my-app-dev-01.7e14.starter-us-west-2.openshiftapps.com
...
```

#### Container Logs

Another convenient feature is to receive the logs of your container in your stdout, this makes your life easier to see what happening inside the container.

```sh
...
npm info using node@v10.14.0
npm info lifecycle my-app@1.0.0~prestart: my-app@1.0.0
npm info lifecycle my-app@1.0.0~start: my-app@1.0.0

> my-app@1.0.0 start /opt/app-root/src
> node app.js

response: 1550511176623
...
```


### Clean up

If you want to remove that project from the namespace you just need to execute your application with the ``-rm`` flag:

```js
node app -rm
```

This command will remove the project and all the generated components from OpenShift.

Hope this module simplify a bit your life when developing micro-services using Node.js, also you can contribute to [this module](https://github.com/cesarvr/okd-runner) by suggesting improvement or by opening an [issue](https://github.com/cesarvr/okd-runner/issues) or sending PR.  

